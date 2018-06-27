const gulp = require("gulp");
const uglify = require("gulp-uglify");    //压缩js
const pump = require("pump");
const cleanCss = require("gulp-clean-css");  //压缩css
const htmlMin = require("gulp-htmlmin");    //压缩html
const less = require("gulp-less");         //编译less
const concat = require("gulp-concat");     //合并文件
const imageMin = require("gulp-imagemin");   //图片压缩
const del = require("del");         //删除文件夹
const browserSync = require('browser-sync').create();  //服务创建
const reload = browserSync.reload;           //服务器刷新
const runSequence = require('run-sequence');   //异步调用gulp
const changed = require('gulp-changed');         //只编译改动过的文件
const babel = require('gulp-babel');        //js es6转换
const autoprefixer = require('gulp-autoprefixer');   //css前缀
const cache = require('gulp-cache');   //用于图片缓存
const sourceMap = require('gulp-sourcemaps');  //源地图
const rev = require('gulp-rev');                 //版本号
const revCollector = require('gulp-rev-collector');   //html内版本号地址写入

//文件路径
let jsReg = "./src/**/*.js";
let cssReg = "./src/**/*.css";
let htmlReg = "./src/**/*.html";
let lessReg = "./src/**/*.less";

//autprofixer  查看package.json browserslist 
// let autopreConfig = {
//     browsers: ["last 10 versions","ie >= 9","ff >= 30","chrome >= 34","safari >= 6","ios >= 6","android >= 4.4","Firefox >= 20"]
// }


//------------  dev
//css   
gulp.task('devCss',()=>{
    return gulp
            .src(cssReg)
            .pipe(changed('./dist'))   //changed的目录需和dest发布目录一致  程序哪两个目录下文件对比
            .pipe(autoprefixer())
            .pipe(gulp.dest("./dist"))
            .pipe(reload({stream:true}))
})
gulp.task('devLess',()=>{
    return gulp
            .src(lessReg)
            .pipe(changed('./dist'))
            .pipe(sourceMap.init())
            .pipe(less())
            .pipe(autoprefixer())
            .pipe(sourceMap.write())
            .pipe(gulp.dest("./dist"))
            .pipe(reload({stream:true}))
})

//js
gulp.task('devJs',()=>{
    return pump([
            gulp.src(jsReg),
            changed('./dist'),
            sourceMap.init(),
            // concat('all.js'))  //concat合并文件
            babel(),
            sourceMap.write('.'),
            gulp.dest('./dist'),
            reload({stream:true})
    ])
})

//html
gulp.task('devHtml',()=>{
    return gulp
            .src(htmlReg)
            .pipe(changed('./dist'))
            .pipe(gulp.dest('./dist'))
            .pipe(reload({stream:true}))
})



//----------------------  build
//css
gulp.task('buildCss',()=>{
    return gulp
            .src(cssReg)
            .pipe(autoprefixer())
            .pipe(cleanCss())
            .pipe(rev())
            .pipe(gulp.dest("./dist"))
            // .pipe(rev.manifest({
            //     path:'./rev-manifest.json',    //生成manifest的路径
            //     merge:true                  //合并流中的manifest  这里less和css的任务冲突  放弃合并改用路径生成不同文件
            // }))
            .pipe(rev.manifest())
            .pipe(gulp.dest('./rev/css'))
})
gulp.task('buildLess',()=>{
    return gulp
            .src(lessReg)
            .pipe(less())
            .pipe(autoprefixer())
            .pipe(cleanCss())
            .pipe(rev())
            .pipe(gulp.dest("./dist"))
            .pipe(rev.manifest())
            .pipe(gulp.dest('./rev/less'))
})
//js
gulp.task('buildJs',()=>{
    return pump([
        gulp.src(jsReg),
            rev(),
            babel(),
            uglify(),
            gulp.dest('./dist'),
            rev.manifest(),
            gulp.dest('./rev/js')
    ])
})
//html
gulp.task('buildHtml',()=>{
    return gulp
            .src(['rev/**/*.json','src/**/*.html'])
            .pipe(revCollector())   //改变html内的文件名引用
            .pipe(htmlMin({
                removeComments: true,//清除HTML注释
                collapseWhitespace: true,//压缩HTML
                collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
                removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
                //removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
                // removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
                minifyJS: true,//压缩页面JS
                minifyCSS: true//压缩页面CSS
            }))
            .pipe(gulp.dest('./dist'))
})


//图片
gulp.task('gulpImage',()=>{
    return gulp
            .src('./src/**/*.{png,jpg,gif,ico}')
            .pipe(cache(imageMin([
                imageMin.gifsicle({interlaced: true}),
                imageMin.jpegtran({progressive: true}),
                imageMin.optipng({optimizationLevel: 7}),
                imageMin.svgo({
                    plugins: [
                        {removeViewBox: true},
                        {cleanupIDs: false}
                    ]
                })
            ])))
            .pipe(gulp.dest('./dist'))
})


// //------删除文件夹
// gulp.task('build',()=>{
//     del(['dist/']).then(()=>{
//         gulp.start(['gulpJs','gulpLess','gulpCss','gulpHtml'])   //gulp.start
//     })
// });
    //或使用run-sequence
gulp.task('cleanDel',()=>{
    return del(['./dist','./rev'])    //加return
})
//dev  -----------开发版本（无压缩）
gulp.task('dev',()=>{
    // [] 中任务是并行的，其他按照先后顺序执行
    runSequence('cleanDel',['devJs','devLess','devCss','gulpImage','devHtml'])
})

//-------------服务器
gulp.task('run',()=>{
    browserSync.init({
        server:{
            baseDir:"./dist",       // 启动服务的目录 默认 index.html    
            // index: 'index.html' // 自定义启动文件名
        },
        // open: 'external',   // 决定Browsersync启动时自动打开的网址 external 表示 可外部打开 url, 可以在同一 wifi 下不同终端测试
        open:false,
        // injectChanges: true // 注入CSS改变
        // port:3001
    })

    //监听文件变化
    gulp.watch(jsReg,['devJs']);
    gulp.watch(lessReg,['devLess']);
    gulp.watch(cssReg,['devCss']);
    gulp.watch(htmlReg,['devHtml']);
    gulp.watch('./src/**/*.{png,jpg,gif,ico}', ['gulpImage']);
})

//---  build 开发版本
gulp.task('build',()=>{
    runSequence('cleanDel',['buildJs','buildCss','buildLess','gulpImage'],'buildHtml')
})






// gulp.task('one',()=>{
//     setTimeout(()=>console.log(3),5000)
// })
// gulp.task('tow',()=>console.log(2))

// gulp.task('default',['one','tow'],()=>{
//     console.log("hellow word")
// })



//gulp-htmlmin      html压缩
//gulp-clean-css       css压缩
//gulp-uglify            js文件压缩
//gulp-less              less编译
//gulp-autoprefixer       css前缀
//gulp-imagemin          图片压缩
//gulp-cache              图片缓存
//browser-sync             服务器
//run-sequence          设定同步异步执行任务
//gulp-changed          只编译改动过的文件
//gulp-sourcemaps
//gulp-babel            es6转换 npm i -D gulp-babel babel-core babel-preset-env
                        //babel-plugin-transform-runtim 需要webapck-gulp 或 browserify
                        //----  npm install --save-dev babel-plugin-transform-runtime
                        //----  npm install --save babel-runtime

//gulp-rev                添加版本号
//gulp-rev-all            //或使用这个添加版本号

//gulp-rev-collector      添加html内版本号地址
//gulp-rev-replace          或使用这个


//gulp-concat           合并文件
//gulp-jshint             js代码检查
// gulp-load-plugins   自动加载插件
//gulp-rename            重命名
//browsersync