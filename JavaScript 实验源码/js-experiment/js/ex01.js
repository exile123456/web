// 第三种引入方式：外部独立JS文件
console.log("\n=== 3. 外部JS文件 ex01.js 加载成功 ===");

// 字符串方法练习
let str = "Hello JavaScript";
console.log("字符串长度:", str.length);
console.log("转大写:", str.toUpperCase());
console.log("截取子串:", str.substring(0,5));
console.log("查找字符位置:", str.indexOf("Java"));

// 数组方法练习
let arr = ["HTML", "CSS", "JS"];
arr.push("Vue"); // 末尾追加
console.log("push后数组:", arr);
console.log("数组反转:", arr.reverse());

console.log("=== 外部JS执行完毕 ===");
