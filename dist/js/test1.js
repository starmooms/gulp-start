console.log(1);
console.log(2);
var a = 4;
{
    var _a = 5;
    console.log("a1:" + _a);
}
console.log("a2:" + a);

[1, 2, 3].forEach(function (n) {
    console.log(n);
});

console.log("maptest");

// let p = (number)=>{
//     return new Promise((resolve,reject)=>{
//         setTimeout(()=>{
//             resolve(`-----------${number}`)
//         },1000)
//     })
// }

// p(1)
//     .then((n)=>{
//         console.log(n)
//         return p(2)
//     }).then((n)=>{
//         console.log(n)
//         return p(3)
//     }).then((n)=>{
//         console.log(n)
//     })
//# sourceMappingURL=test1.js.map
