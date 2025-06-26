# Type Conversion  
## 抽象操作
程序员不能调用这些对类型转化行为进行规范化描述的行为   
**`ToPriminitive(input, preferredType = default)`**
1. input为原子类型，返回input  
2. 若input上存在一个key为Symbol.toPriminitive的方法，调用input\[Symbol.toPrimitive](preferredType)   
3. 否则调用OrdinaryToPrimitive(input, preferredType)  
	- peferredType值是string 则令 methods = \["toString", "valueOf"]  
	- 否则 methods = \["valueOf", "toString"]  

**`ToBoolean(input)`**  
falsy values: undefined, null, false, 0, NaN, ""  

**`ToNumber(input)`**
- undefined: NaN  
- null, false: +0  
- true: 1
- symbol/***bigint***: TypeError  
- object: `primValue = ToPrimitive(input, "number"); return ToNumber(primValue)`
- string: Number(input)  

**`ToBigInt(input)`**
- undefined/null: TypeError
- symbol/***number***: TypeError  
- false: 0n    
- True: 1n  
- string: BigInt(input)  

**`ToNumeric(input)`**
1. `primValue = ToPrimitive(input, "number")`
2. 如果primValue是一个bigint值，则返回primValue
3. 返回ToNumber(primValue)

**`ToString(input)`**
- undefined/null/false/true: "名称"  
- symbol: TypeError  
- object: `primValue = ToPrimitive(input, "string"); retrurn ToString(primValue)` 
- number: String(input)

**`ToObject(input)`**
- undefined/null: TypeError  
- boolean/string/number: new Boolean/String/Number(input) 
- bigint: 对象o, 满足`o.[[Prototype]] ==== BigInt.prototype, o.[[BigIntData]] === input`  
- symbol: 同上

## 类型转换  
### 显式转换  
**`String(value)`**
1. 没有传入参数: 返回""
2. symbol类型: 返回value的描述字符串  
3. 返回 ToString(value) 

*显式包含隐式*: `a.toString()` 为 `1.tmp = ToObject(a) 2.tmp.toString()`  

**`Number(value)`**
1. 没有传入参数: 返回+0
2. 返回ToNumber(value)  

***一元***操作符+会把操作数转化为number类型  

**`Boolean(value)`**
返回ToBoolean(value)   
!操作符调用 ToBoolean()  

### 隐式转换  
**`+`**  left + right
```javascript
let lv = ToPrimitive(left), rv = ToPrimitive(right)
if(typeof lv === "string" || typeof rv === "string")
	lv = ToString(lv), rv = ToString(rv)
	return lv.concat(rv)
lv = ToNumeric(lv), rv = ToNumeric(rv)
if(typeof lv !== typeof rv) throw TypeError 
return lv + rv
```
**`-`** left - right  
```javascript
let lv = ToNumeric(left), rv = ToNumeric(right)
if(typeof lv !== typeof rv) throw TypeError
return lv - rv
```
boolean 间 +,- 转化为number  

**`others -> boolean`**   
条件判断, || && 操作符中的***左***操作数  
`left && right` / `left || right`  
```javascript
let bool = ToBoolean(left)
if(bool === false/true) return left
return right
```
`left ?? right`  
left: null/undefined -> return right    
else -> return right   

if(a){ foo(a)} <=> a && foo(a)  
设置缺省值: x = x || "hello"  

## == VS ===  
== 允许类型转换， === 不允许  
#### 抽象相等 == 
- 类型相同：返回 x === y
- null == undefined
- number和string, boolean： ToNumber(y)  
- bigint和string: StringToBigInt(y) 若是NaN返回false，否则返回 x === n
- object: x == ToPrimitive(y)  
- bigint和number: 若有NaN, +-Infinity 返回false; 否则在数学意义上做比较  
- 其他返回false  
#### 严格相等 === 
1. 类型不同: false
2. x: number/bigint 返回 type(x)::equal(x,y)  ***(+0 = -0)***
3. 返回SameValueNonNumeric(x,y)  
boolean值比较的时候boolean被转化成number，不要将非boolean值与boolean值比较  
![](../img/compare.png)
![](../img/interestingCompare.png)

### ARC(x, y, leftFirst)
1. 根据leftFirst判断先把哪个ToPriminitive()
2. 都是string则比较字典序
3. string和bigint: StringToBigInt()
4. 其他则两个都ToNumeric：
   - 类型相同 Type(nx)::lessThan(nx,ny)
   - **NaN: undefined**
   - -Infinity < +Infinity
   - 数学意义上比较

```javascript
// x < y
r = ARC(x, y, true);
if(r === undefined)
	r = false;
return r;

// x > y
r = ARC(y, x, false);
if(r === undefined)
	r = false;
return r;

// x <= y
r = ARC(y, x, false);
if(r === true || r === undefined)
	r = false;
else
	r = true;
return r;

// x >= y
r = ARC(x, y, true);
if(r === true || r === undefined)
	r = false;
else
	r = true;
return r;
```
* 比较 x = {a : 42}, y = {a : 43}   
  x < , > , >= , <= y均为false   
  因为x,y.toPriminitive()调用valueof()返回自身不是原子值，调用toString()均返回[object Object] 
