# Web页面编程深入 
内容: HTML 样式: CSS 行为: JavaScript  
## 在JS中访问/修改DOM中的信息  
一个Web页面的DOM被封装在名为document的object里面，  
document和DOM中各种元素（被封装为object）提供一组properties用于对DOM中信息进行读取和修改  
在JS中对DOM的修改会实时反应在浏览器页面中  
- 传统定位元素方法:
  - `obj.getElementById(id)`  
  - `obj.getElementsByTagName(tag)`
  - `obj.getElementByClassName(class)` (在当前元素的后代元素中查找) 
  ```javascript

  ```
- 现代方式: CSS选择器
  - `obj.querySelector(selector_str)`
  - `obj.querySelectorAll(selector_str)`
- 获取和设置HTML元素的attribute 
  - `element.getAttribute(属性名)`
  - `element.setAttribute(属性名，属性值)`

	```javascript
	var para
	para = document.getElementsByTagName("p")[0];
	alert("旧的：" +para.getAttribute("title"));
	para.setAttribute("title", "你好，名字为title的属性")
	alert("新的：" +para.getAttribute("title"))
  	```
  - HTML中明确规范的attribute可以直接通过属性名获取
	eg. `div.setAttribute("id", "special")` <=> `div.id = "special`
- 获取和设置HTML元素的文本  
  html元素的文本存在element.textContent中
  ```javascript
  var items, i;
	items = document.getElementsByTagName("li");
	for(i = 0; i < items.length; i++){
	items[i].textContent += ":我是黑客";
	}
  ```
- 向DOM中添加新的元素
  `let ne = document.createElement(tagName)`
  `p.appendChild(ne)`
  `p.insertBefore(ne, ref_element)`

## 获取和设置HTML元素的CSS属性的值  
```javascript
document.addEventListener("DOMContentLoaded", () => {
    const div = document.querySelector("div");
    console.log("div.style.font-size:", div.style.fontSize + ";");
    console.log("div.style.background-color:", div.style.backgroundColor + ";");
});
```
一个object封装当前元素的所有CSS信息:  
const styles = windows.getComputedStyle(element)
const propValue = styles.getPropertyValue(propNameStr);
可以直接设置CSS属性值，是否生效由层叠规则决定  

## Web页面中的事件处理  
![](../img/createWeb.png)
![](../img/createPage.png)
![](../img/ProcessEvents.png)
HTML要求事件处理至少包含两个任务队列:  
宏任务队列和微任务队列，处理一个宏任务过程中可能会产生多个微任务   
![](../img/ProcessJobs.png)
处理完一个宏任务之后会立刻按序处理所有的微任务，处理完之后才去处理下一个宏任务  
浏览器刷新频率：60桢/秒 流畅性要求一个宏任务及其产生的所有微任务在16ms之内完成  
两种定时器：
**`window.setTimeout`**
延迟delay秒后把timeout事件加入任务队列中  
const id = setTimeout(func, delay)
clearTimeout(id)
```javascript
// 设置一个定时器
const timerId = setTimeout(() => {
  console.log('这条消息不会显示，因为定时器被取消了');
}, 5000);
// 2秒后取消定时器
setTimeout(() => {
  clearTimeout(timerId);
  console.log('定时器已取消');
}, 2000);
```

**`window.setInterval`**
延迟delay秒后把interval事件加入任务队列中, 如果已存在同源时间则不加入   
const id = setInterval(func, delay)
clearInterval(id)

```javascript
setTimeout(function repeatMe(){
	setTimeout(repeatMe, 10);
}, 10);
//在语义上与setInterval不等价，因为
//setInterval：尝试严格每隔10ms执行一次（不考虑代码执行时间）
//setTimeout：下一次调用在前一次代码执行完成后才开始计时10ms
```

### 处理计算密集型操作  
将复杂操作拆分为小粒度操作:  
```javascript
const createTable = function(){
    const rowCount = 40000, divideInto = 100;
    const chunkSize = rowCount / divideInto;
    let iteration = 0;
    const tb = document.querySelector("tbody");

    setTimeout(function generateRows(){
        const base = chunkSize * iteration;
        for(let i = 0; i < chunkSize; i++) {
            const tr = document.createElement("tr");
            for(let j = 0; j < 6; j++) {
                const td = document.createElement("td");
                td.textContent = (base + i) + ", " + j;
                tr.appendChild(td);
            }
            tb.appendChild(tr);
        }
        if(++iteration < divideInto) {
            setTimeout(generateRows, 0);
        }
    }, 0);
};
document.addEventListener("DOMContentLoaded", createTable);
```

事件在DOM上的传播:  
事件对象target属性值: 事件发生的html元素  
事件处理函数（不是箭头函数时）this表示当前事件监听函数所附着的HTML元素  
```javascript
<button id = "btn">你敢点击我吗？</button>
<script type = "text/javascript">
	const btn = document.querySelector("#btn");
	btn.addEventListener("click", function handler(event){
		console.log(event.target === btn) //true
		console.log(this === btn);   //true
	})
</script>
```
点击innerDiv之后innerDiv, outerDiv和document会依次出现点击事件  
```javascript
<script>
    const outerDiv = document.querySelector("#outerDiv");
    const innerDiv = document.querySelector("#innerDiv");
	var time = 0;
    outerDiv.addEventListener("click", function outerHandler(){
        console.log("outerDiv监测到了一个点击事件");
		console.log("这是第" + time++ + "次点击");
    });
    innerDiv.addEventListener("click", function innerHandler(){
        console.log("innerDiv监测到了一个点击事件");
		console.log("这是第" + time++ + "次点击");
    });
    document.addEventListener("click", function docHandler(){
        console.log("document监测到了一个点击事件");
		console.log("这是第" + time++ + "次点击");
    });
</script>
```
事件在DOM中传播分两个阶段: 事件捕获(capturing)和事件冒泡(bubbling)  
addEventListener(type, func, useCapture = false)  (默认为冒泡)
![](../img/bubbling.png)

把事情处理代理给祖先元素:   
eg. 在父元素上监听子元素事件:   
```javascript
const tb = document.querySelector("tbody");
tb.addEventListener("click", function(e){
	if(e.target.tagName.toLowerCase() === "td"){
		event.target.style.backgroundColor = "yellow";
	}
});
```

Web中的事件处理:  
1. 创建出一个自定义事件object:
	`const event = new CustomEvent(eventType, {detail:eventDetail})`
2. 在合适的HTML元素上派发事件:  
	`target.dispatchEvent(event)`
