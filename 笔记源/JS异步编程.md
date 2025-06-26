# JS异步编程  
1. 计算密集型: 拆成细粒度子任务  
   setTimeout(nextTask, 0)
2. IO密集型: 
   启动一个IO任务时传入一个回调函数，继续执行后面代码；
   IO任务完成后把IO完成时间加入任务队列，回调函数是这个事件的处理函数  

异步文件读取函数:
```javascript
const fs = require("fs");
fs.readFile("/etc/passwd", "utf8", (err, data) => {
  if(err) throw err;
  console.log(data);
})
console.log(" ");
console.log("文件读写中");
console.log(" ")
// 后面的代码会先执行
```
同步文件读取函数: `fs.readFileSync(filepath, options)`  

浏览器环境中从服务器端异步获取数据:
```javascript
const req = new XMLHttpRequest();
req.open("GET", "data/passwd"); //第三个参数默认为true(异步)
req.onload = function(){
   try{
      if(this.status === 200){
         console.log("获取文件成功"); //请求成功，服务器返回 200
         console.log(this.response);
      }else{
         console.log("获取文件失败");  //请求到达服务器，但返回错误状态码（如 404、500）
      }
   }catch(e){
      console.log("获取文件失败"); //请求完成，但处理响应时抛出异常（如数据解析错误）
      console.log(e);
   }
}
req.onerror = function(){
   console.log("获取文件失败"); //请求未到达服务器（网络问题、跨域错误、URL 无效）
}
req.send();
```

异步IO的仿真函数:
```javascript
const getData = function(url, callback){
  const timePeriod = Math.random() * 5000;
  const isSuccess = Math.random() < 0.5 ? true : false;

  setTimeout(() => {
    if(isSuccess){
      callback(false, "this is the data that you want: " + Math.random());
    }else{
      callback("sorry~");
    }
  }, timePeriod);
}
getData("https://www.pku.edu.cn", (err, data) => {
  err && console.log(err);
  !err && console.log(data);
});
console.log("rabbit is watching...")
```

### 回调函数的缺点
1. 错误处理:
   ```javascript
   try {
      getData(url, (err1, data1) => { // 异步回调
         if (err1) {
            console.log("出错了，我抛出了错误，你能接到吗？");
            throw err1; // ❌ 这里抛出错误无法被外部的 try/catch 捕获！
         }
         console.log(data1);
      });
   } catch(e) {
      console.log("错误信息: " + e); // 永远不会执行
   }
   //正确方式：在回调函数内部处理错误，而非尝试用外部 try/catch
   ```
2. 异步顺序任务处理复杂:
   ```javascript
   getData(url1, (err1, data1) => {
    if(err1) {
        console.log("url1:", err1); return;
    }
    getData(url2, (err2, data2) => {
        if(err2) {
            console.log("url2:", err2); return;
        }
        getData(url3, (err3, data3) => {
            if(err3) {
                console.log("url3:", err3); return;
            }
            console.log("终于成功的获取了所有数据");
        });
    });
   });
   ``` 
3. 并⾏/并发多任务处理:
   ```javascript
   let task1 = null, task2 = null, task3 = null; // 声明变量用于存储结果
   // 任务1
   getData(url1, (err1, data1) => {
      if(err1) { console.log("url1:", err1); return; }
      task1 = data1;       // 存储结果
      taskCompleted();     // 检查是否全部完成
   });
   // 任务2
   getData(url2, (err2, data2) => {
      if(err2) { console.log("url2:", err2); return; }
      task2 = data2;
      taskCompleted();
   });
   // 任务3
   getData(url3, (err3, data3) => {
      if(err3) { console.log("url3:", err3); return; }
      task3 = data3;
      taskCompleted();
   });   
   // 检查所有任务是否完成
   function taskCompleted() {
      if(task1 !== null && task2 !== null && task3 !== null) {
         console.log("终于完成所有任务了！");
      }
   }
   ``` 

### Generator 函数
调用不执行函数,返回一个iterable object(**也是一个iterator**), 按顺序包含所有yield后表达式的值  
- eg.遍历DOM树:
```javascript
function * DOMTraversal(element){
  yield element;
  element = element.firstElementChild;
  while(element){
    yield * DOMTraversal(element);
    element = element.nextElementSibling;
  }
}
for(let element of DOMTraversal(html))
  console.log(element.nodeName);
```
- 与Generator双向通讯: 
   1. next函数:
      ```javascript
      function * PersonGenerator(){
         const p1 = yield "rabbit";
         const p2 = yield "doggy";
         console.log(p1, p2);
      }
      const personIterator = PersonGenerator();
      let rst = personIterator.next();
      while(!rst.done){
         console.log(rst.value);
         if(rst.value === "rabbit") rst = personIterator.next("heyhey");
         else if(rst.value === "doggy") rst = personIterator.next("hello");
      }
      ```
   2. next函数参数:
      ```javascript
      function * generator(){
         try{
            yield "rabbit";
            yield "doggy";
         }catch(e){
            console.log(e);
         }
      }
      const iterator = generator();
      let rst = iterator.next();
      while(!rst.done){
         console.log(rst.value);
         iterator.throw("heyhey, an error!");
         rst = iterator.next();
      }
      ```
Generator: 状态机  
调用完毕后上下文仍然存在，直到遍历完毕  

### Promise 
```javascript
const promise = new Promise((resolve, reject) => {
   getData("https://www.rabbitIsSoPretty.cn", (err, data) => {
      if(err){
         reject(err);
      }else{
         resolve(data);
      }
   });
});
promise.then(data => {
   console.log("success", data);
}, err => {
   console.log("failure", err);
});
```
.catch(callback) => .then(undefined, callback)  

封装:
```javascript
function getDataPromise(url){
   return new Promise((resolve, reject) => {
   getData("https://www.rabbitIsSoPretty.cn", (err, data) => {
      if(err){
         reject(err);
      }else{
         resolve(data);
      }
   });
});
}
```
顺序读取:
```javascript
getDataPromise(url1)
  .then(data1 => getDataPromise(url2))
  .then(data2 => getDataPromise(url3))
  .then(data3 => console.log("顺序异步读取三个数据，成功！"))
  .catch(error => console.log("发生错误："+error));
//--------------------------------------------
Promise.all([
    getDataPromise(url1), 
    getDataPromise(url2), 
    getDataPromise(url3)
])
.then(result => {
    console.log("成功读取三个数据");
    console.log(result[0]); // url1的结果
    console.log(result[1]); // url2的结果
    console.log(result[2]); // url3的结果
})
.catch(error => console.log(error));
console.log("我就在这里静静地看你表演...");
```

失败会持续在promise链中传播，直到遇到一个catch  
成功会持续在promise链中传播，直到遇到⼀个then⽅法（成功被处理）

### async await 
```javascript
async function helloWorld(){
  const data = [];
  try{
    data[0] = await getDataPromise(url1);
    data[1] = await getDataPromise(url2);
    data[2] = await getDataPromise(url3);
  }catch(error){
    console.log("error:" + error);
    return;
  }
  for(let item of data) console.log(item);
}
helloWorld();
console.log("rabbit is watching...")
```
async function: 总是返回⼀个promise object  
async函数中出现的运⾏时错误如果没有被try-catch语句捕获，也会被封装为promise后返回  
当在async函数的执⾏过程中遇到了⼀个await表达式，该函数的执⾏会被暂停，直到await表达式中的promise进⼊终⽌状态  
A. 成功状态：await表达式返回相应的值（求值成功）；然后继
续执⾏async函数后⾯的代码  
B. 失败状态：抛出异常；如果异常没有被捕获，async函数将
异常封装成⼀个promise后返回  
对await表达式的求值不会造成线程阻塞（称之为：异步等待）  

#### Async iterable object
具有一个Symbol.asyncIterator的property，是一个well-known symbol  
这个property的value是⼀个function,调⽤这个function会返回⼀个asyncIterator（异步遍历器）  
⼀个asyncIterator是⼀个object, 这个object具有⼀个名称为next的⽅法, 对next⽅法的⼀次调⽤会返回⼀个Promise object  
```javascript
vs.reverse = function() {
  return { // 返回 Async Iterable 对象
    [Symbol.asyncIterator]: () => { // 实现 asyncIterator 方法
      let i = this.length - 1; // 从数组末尾开始
      return { // 返回 Async Iterator
        next: () => {
          const done = (i < 0); // 是否遍历完成
          const value = !done ? this[i--] : undefined; // 当前值
          return new Promise(resolve => 
            setTimeout(() => resolve({ done, value }), 1000) // 延迟 1 秒
        )}
      };
    }
  };
};
const asyncItr = vs.reverse()[Symbol.asyncIterator](); // 获取异步迭代器

const asyncLoop = (asyncIter, f) => { // 异步遍历驱动函数
  asyncIter.next().then(({ done, value }) => {
    if (done) return;
    f(value); // 处理当前值（这里是 console.log）
    asyncLoop(asyncIter, f); // 递归调用继续遍历
  });
};
const intTimer = () => setInterval(() => console.log("tick"), 500); // 辅助计时器
const t = intTimer(); // 启动计时器（每 500ms 输出 "tick"）
asyncLoop(asyncItr, console.log); // 开始异步遍历
setTimeout(() => clearInterval(t), 7000); // 7 秒后停止计时器
//----------------------
//for-await-of语句(也可用于一般itearable object)
const t = setInterval(() => console.log("tick"), 500);
for await (const value of vs.reverse()) {
  console.log("value:", value);
}
clearInterval(t);
```
#### Async Generator 
```javascript
const getValue = () => {
    return new Promise( resolve => {
    setTimeout( () => resolve(Math.random()), 1000);
    });
}

const asyncGen = async function * () { // 声明一个 async generator
 for (let i = 0; i < 5; i++){
    const value = await getValue(); // 可以使用await关键词
    yield value + 1;
    }
}
const t = setInterval(() => console.log("tick"), 500);
for await (const v of asyncGen()) console.log(v);
clearInterval(t);
```