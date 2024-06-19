---
link: https://blog.csdn.net/Q540670228/article/details/122809006
byline: 成就一亿技术人!
excerpt: 文章浏览阅读2k次，点赞6次，收藏38次。Lua全知识点汇总（超详细）文章目录Lua全知识点汇总（超详细）Lua中的注释用法Lua中的变量类型Lua的字符串操作Lua的运算符Lua的条件分支语句Lua的循环语句Lua的Function函数
  （含闭包面试重点）Lua的多脚本执行**Lua的Table表**table表的遍历table表的公共方法table表的特殊用法（字典，类）**Lua的元表**概念方法**Lua的面向对象
  OOP**封装继承多态OOP汇总代码  面试重点Lua的特殊用法Lua自带库函数Lua的垃圾回收Lua中的注释用法单_lua面试基础知识点
tags:
  - slurp/lua面试基础知识点
slurped: 2024-06-15T14:57:55.496Z
title: Lua全知识点详细汇总（基础知识+面向对象+面试重点）_lua面试基础知识点-CSDN博客
---

### Lua全知识点汇总（超详细）

---

#### 文章目录

- - [Lua全知识点汇总（超详细）](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_0)
    - - [Lua中的注释用法](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_5)
        - [Lua中的变量类型](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_25)
        - [Lua的字符串操作](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_82)
        - [Lua的运算符](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_133)
        - [Lua的条件分支语句](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_151)
        - [Lua的循环语句](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_179)
        - [Lua的Function函数 （含闭包面试重点）](https://blog.csdn.net/Q540670228/article/details/122809006#LuaFunction__220)
        - [Lua的多脚本执行](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_329)
        - [**Lua的Table表**](https://blog.csdn.net/Q540670228/article/details/122809006#LuaTable_383)
        - - [table表的遍历](https://blog.csdn.net/Q540670228/article/details/122809006#table_391)
            - [table表的公共方法](https://blog.csdn.net/Q540670228/article/details/122809006#table_454)
            - [table表的特殊用法（字典，类）](https://blog.csdn.net/Q540670228/article/details/122809006#table_501)
        - [**Lua的元表**](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_584)
        - - [概念](https://blog.csdn.net/Q540670228/article/details/122809006#_586)
            - [方法](https://blog.csdn.net/Q540670228/article/details/122809006#_592)
        - [**Lua的面向对象 OOP**](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_OOP_750)
        - - [封装](https://blog.csdn.net/Q540670228/article/details/122809006#_754)
            - [继承](https://blog.csdn.net/Q540670228/article/details/122809006#_783)
            - [多态](https://blog.csdn.net/Q540670228/article/details/122809006#_813)
            - [OOP汇总代码 面试重点](https://blog.csdn.net/Q540670228/article/details/122809006#OOP___858)
        - [Lua的特殊用法](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_926)
        - [Lua自带库函数](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_953)
        - [Lua的垃圾回收](https://blog.csdn.net/Q540670228/article/details/122809006#Lua_1017)

#### Lua中的注释用法

- 单行注释 –
- 多行注释
    1. `-- [[内容]]`
    2. `--[[内容]]--`
    3. `--[[内容--]]`

```lua
--这是一个单行注释
--[[这是第一种
多行注释]]
--[[这是第二种
多行注释]]--
--[[这是第三种
多行注释--]]
```

#### Lua中的变量类型

4种简单变量类型

1. `number` 数字类型，所有的数字都是number类型
2. `string` 字符串类型 ， “xxx” 或 ‘xxx’
3. `boolean` 布尔类型 ， true 或 false
4. `nil` 空类型 ， 未声明的变量均为nil类型

4中复杂变量类型

5. `function` 函数类型 ， **函数存储在变量中** 可以作为函数参数和返回值或存储在表中
6. `table` 表类型 ， 类似字典的一种关联数组，索引为数字或字符串，利用{}创建表
7. `userdata` 用户自定义数据类型 ， 表示任意存储在变量中的C数据结构
8. `thread` 协同程序 ， 用于在主线程中另开启一段逻辑进行相关处理

**Lua中的用法**

- Lua声明变量的时候 不需要定义数据类型，直接为变量赋值即可。
- 标识符可以用字母和下划线开头，不能以数字进行开头
- 利用type(变量名)可以返回当前变量的类型名 （返回值类型是string)

```lua
--number类型
num1 = 100
num2 = 1.2
print("num1的类型是"..type(num1))
print("num2的类型是"..type(num2))
--string类型
str = "123"
print("str的类型是"..type(str))
--boolean类型
bool = true
print("bool的类型是"..type(bool))
--nil空类型
nilTest1 = nil
print("nilTest1的类型是"..type(nilTest1))
print("nilTest2的类型是"..type(nilTest2))
--function函数类型
func1 = function()
end
function func2()
end
print("func1的类型是"..type(func1))
print("func2的类型是"..type(func2))
--table表类型
table1 = {}
print("table1的类型是"..type(table1))
--thread 协同程序
threadTest = coroutine.create(func1)
print("threadTest的类型是"..type(threadTest))
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/2827e069042f439296a1789d5f5c2387.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA56qX5aSW5ZCs6L2p6Zuo,size_20,color_FFFFFF,t_70,g_se,x_16)

#### Lua的字符串操作

```lua
--获取字符串的长度  #
str = "123456"
print(#str)

--字符串的多行打印
--1.利用转义字符
print("转义字符换行\n第二行")
--2.利用[[]]里面字符串在编辑状态下的回车有效
print([[编辑器下换行
第二行]])

--字符串的拼接
--1.关键字..
print("关键字拼接字符串".."123")
--2.string.format() 格式化输出
print(string.format("格式化输出字符串%d",123))
--%d 整数 %s字符串 %c 单个字符

--小写转大写 不是原地操作返回新字符串 以下均是
str = "abcDEfg"
print("小写转大写"..string.upper(str))
--大写转小写
print("大写转小写"..string.lower(str))
--反转字符串
print("翻转字符串"..string.reverse(str))
--字符串索引查找 索引从1开始
--双返回值 查找字符串的首个字符和末尾字符的索引值
print("字符串索引查找"..string.find(str,"DE"))
--截取字符串 [a,b]双闭
print("截取字符串"..string.sub(str,3,4))
--字符串重复复制 第二个参数重复次数
print("字符串重复复制"..string.rep(str,2))
--字符串修改 参数(字符串，需要修改的字符串，用于替换的字符串)
--返回两个参数，第一个是修改后的字符串 第二个参数是修改的次数
print("字符串修改"..string.gsub(str,"DE","**"))

--字符 转 ASCII码 第二个参数是字符串中指定位置的字符 索引从1开始
a = string.byte("Lua",1) --L的ASCII码
print("L的ASCII码"..a)
--ASCII码转字符
print("ASCII码转字符"..string.char(a))
```

![[外链图片转存失败,源站可能有防盗链机制,建议将图片保存下来直接上传(img-FZhmvAup-1644217345998)(知识点总结3-Lua语法.assets/image-20220206130504048-16441239050212.png)]](https://img-blog.csdnimg.cn/b32a34f5898c42f9a695fd607a1b68b4.png?x-oss-process=image/watermark,type_d3F5LXplbmhlaQ,shadow_50,text_Q1NETiBA56qX5aSW5ZCs6L2p6Zuo,size_20,color_FFFFFF,t_70,g_se,x_16)

#### Lua的运算符

- 算术运算符
    - 支持 `+ - * / % ^`运算符 注意此时的`^`是次幂 相当于pow()函数
    - **没有自增++ 自减-- 运算符**
    - **没有复合运算符** `+= -= /= *=`
    - 字符串的相加 或 字符串与数字的相加 均会转换成数字与数字相加，若字符串不为合法数字则会进行报错。
- 条件运算符
    - 支持 `> < >= <= == ~=` 注意不等于是`~=`
- 逻辑运算符
    - 支持 and or not 支持短路情况，不能使用`&& || ！`等
- 位运算符
    - Lua不支持位运算符 需自己实现 ^不是异或 是幂运算
- 三目运算符
    - Lua也不支持三目运算符

#### Lua的条件分支语句

只有if语句 不支持switch 和 三目运算符

```lua
--条件分支语句
a = 9
--单分支
if a > 5 then
	print("对")
end
--双分支
if a < 5 then
	print("123")
else
	print("321")
end
--多分支
if a < 5 then
	print("123")
elseif a == 6 then  --elseif必须连着写
	print("6")
end
--没有switch运算符
```

#### Lua的循环语句

Lua中支持三种循环方式 for while do-while

for循环的注意点：变量指定的循环范围是双闭合区间，包含指定的末尾值

```lua
--循环语句

--while 进入条件 do
--    语句xx
--end
num = 0
while num<5 do
	print(num)
	num = num + 1
end

--do while语句
--repeat ....... until 退出条件
num = 0
repeat
	print(num)
	num = num + 1
until num > 5   --满足条件跳出（结束条件）


--for 语句
--[a,b] 默认步长为1
for i = 1 , 5 do  --[1 5] 双闭 i默认加1
	print(i)
end

--for 语句改变步长
for i = 1 , 5 , 2 do --自定义增量
	print(i)
end
```

#### Lua的Function函数 （含闭包面试重点）

- 函数的声明和使用
    
    ```lua
    --两种声明方式
    --1.直接声明
    function func1()
        print("第一种")
    end
    --2.赋值给变量
    func2 = function()
        print("第二种")
    end
    --函数的调用 函数名(参数) 必须在声明之后进行调用
    func1()
    func2()
    ```
    
- 函数的参数问题
    
    ```lua
    --lua中含参函数的定义和调用
    func3 = function(a,b)
        print(a,b)
    end
    func3(1,9)   --打印1 9
    --注意特殊情况：lua中不严格要求传参个数的匹配
    --1.当传入参数不足时，未传入的参数默认为nil
    func3(1) --打印1 nil
    
    --2.当传入参数多余时，会自动丢弃不会报错
    func3(1,9,8,7)  --仍打印1 9
    
    --变长参数的使用
    --变长参数的使用需要先在函数内部用表存起来再对表进行相关操作
    func4 = function(...)
        arg = {...}
        for i = 1,#arg do
            print(arg[i])
        end
    end
    func4(1,"222",true,nil) --会依次每行打印出来这些参数
    ```
    
- 函数的返回值问题
    
    ```lua
    --lua中函数的返回值问题
    --lua支持单返回值和多返回值的函数
    --1.单返回值 基本和其它语言一致
    func1 = function(a)
        return a
    end
    print(func1("单返回值函数"))
    --2.多返回值
    func2 = function(a,b,c)
        return a,b,c
    end
    print(func2("返回值1","返回值2","返回值3")) --打印三个返回值
    
    --接收多返回值问题
    tmp1,tmp2,tmp3 = func2(1,2,3) --当对应时会依次接收到三个返回值
    --当接收参数少于返回值个数 会自动舍弃多余返回值
    tmp1 = func2(1,2,3) --只有tmp1会接收到1
    --当接收参数多于返回值个数 多余的默认为nil
    tmp1,tmp2,tmp3,tmp4 = func2(1,2,3) --tmp4默认为nil
    ```
    
- 特殊问题：函数的嵌套、函数的重载
    
    ```lua
    --函数的嵌套
    --函数的嵌套就是在一个函数中可以返回新的函数
    --函数作为一种变量类型可以作为参数或返回值
    func1 = function()
        --匿名函数
        return function()
            print("嵌套函数")
        end
    end
    --嵌套函数的调用
    func1()() --最简易的方式
    func2 = func1()
    func2() --先作为变量存起来在进行调用
    
    --函数的重载
    --lua不支持函数的重载，调用时会默认调用最后声明的同名函数
    
    ```
    
- 面试重点：函数闭包的体现
    
    闭包：**闭包就是一个函数和该函数会访问到的所有外部局部变量（`upvalue`）**。当Lua执行一个函数时，其会创建一个新的数据对象，其中包含了函数原型、环境的引用（用来查找全局变量）和一个由所有`upvalue`引用组成的数组，而这个数据对象就称为闭包。由此可见，**函数是编译期概念是静态的，闭包是运行期概念是动态的**。当外部函数运行完毕时，其内部函数使用的外部局部变量本应随之释放，却因闭包使用`upvalue`的原因未能得以释放而是继续存放在内存中，这就是闭包的体现。函数则是一种没有外部局部变量的闭包，**函数是一种特殊的闭包。**
    
    ```lua
    --闭包的性质由嵌套函数体现
    function func1(x)
        --改变了传入参数x的生命周期
        return function(y)
            return x + y
        end
    end
    func2 = func1(10)
    print(func2(5)) --最终会打印15 外部局部变量x的值改变了生命周期依然存在
    ```
    

#### Lua的多脚本执行

**局部变量和全局变量**

Lua中不加修饰符local直接定义的变量无论在哪定义的均为全局变量 全局有效（注意定义在函数内部的全局变量需要执行一次函数后才有效）

Lua中加修饰符local的变量为局部变量 根据变量所处的范围确定作用域（定义在函数或循环内部则作用于此函数或循环等，定义在外面则作用于此脚本）函数的参数也是局部变量作用于当前函数（可能因闭包改变生命周期）

```lua
---多脚本执行
--全局变量和本地变量
--全局变量
a = 1
c = "111"
print(c) --输出结果 111

--本地（局部）变量的关键字 local
for i = 1,2 do
	local d = "111" --局部变量只作用于此循环
	print(d)
end
print(d) --输出结果为nil
--函数内部不加local也是全局变量 执行一次函数后才定义
local cur = "r1"

--多脚本执行
--关键字 require("脚本名")
require("Test")  --注意路径问题 同一文件夹下直接文件名 不然需要利用 / 指明具体相对路径
print(testB) --另一脚本的loacl变量无法使用（脚本局部变量）



--脚本卸载
require("Test") --已经加载过的脚本，在加载一次过后不会再被执行
--package.loaded["脚本名"] 返回值为该脚本是否被执行
print(package.loaded["Test"])
--卸载已经加载过的脚本
package.loaded["Test"] = nil


--大G表
--大G表就是_G 是一个总表(table) 它将我们申明的所有全局的变量都存储在其中
for k,v in pairs(_G) do
	print(k,v)
end

--本地变量 加了local关键字的变量不会存到大_G表中
--可以在脚本中return 东西 在另一个脚本加载时接受返回值 也可以返回本地变量

print(require("Test"))
```

#### **Lua的Table表**

Lua中的复杂数据类型表table能存任何数据类型十分强大，其是一种类似于字典的关联数组，索引可以是数字或字符串，当省略索引时，会自动从1开始为该元素添加索引。

两种自定义索引的构造方法 {[“key”]=“value”,[1]=2} {key1= 1,key2=“123”}第二种的键必须省略单/双引号，且键值默认为字符串。

table由于其自身的一些特性，对遍历和#获取长度十分不友好 接下来会对各种情况进行梳理

##### table表的遍历

- 不包含自定义索引的table定义和遍历
    
    ```Lua
    --lua中table索引默认从1开始
    arr = {1,"str",false,nil}
    arr2 = {1,"str",nil,100,200}
    print(#arr,#arr2) --打印结果为3  2
    --结论：#获取长度时遇到nil则结束不计入nil且不会继续向后计数 ！！！
    
    --table的遍历
    for i = 1,#arr2 do
        print(arr[i])
    end
    --利用#对数组遍历有风险，遇到nil就会停，当存在nil时不建议使用 ！！！
    ```
    
- 包含自定义索引的table定义和遍历
```lua
    --lua中包含自定义索引的table表
    --使用数字作为自定义索引时会有很多问题，一般不建议使用
    test = {["key1"]=1,["key2"]=2,[-1]=-1,[0]=0,[1]=1,[2]=2,[4]=4，[6]=6,11,22,44}
    print(test[1],test[2],test[4]) -- 输出结果 11  22  4
    print(#test)--输出结果  6
    print(test[5])-- 输出结果 nil
```

>[!important]
>结论
>1. 在包含自定义索引的表中，字符串索引不会被#求长度所计数，且调用时明确
>2. 未添加索引的元素会从1开始依次自动添加索引，当自定义索引使用数字时与自动索引发生冲突，调用时会优先调用自动索引元素。
>3. \#求长度时只考虑数字索引元素（无论是自定义还是自动填充），当使用自定义索引时可能会发生跳跃情况（上方例子中索引缺失5 长度仍为6） 会自动设缺项为nil。但可能发生一些特殊情况。这种情况源于lua中查找元素时的特点，其会从索引1开始先查找普通元素，当普通元素索引不存在时再去查找自定义索引表部分，采用的是折半查找方式，一般步长大于2时会出现问题，具体实现时尽量避免这种情况。


- 迭代器遍历table表 （建议使用）
    
    ```lua
    --迭代器遍历table
    --采用#方式遍历具有风险，因此考虑采用迭代器方式遍历table表
    test = {[-1]=-1,[0]=0,[1]=1,[3]=3,[5]=5,["key1"]="value1",11,22,33}
    --1. 采用迭代器ipairs 从1开始小于等于0的值遍历不到,也无法遍历字符串索引，且也有断序中断问题和#差不多也不建议使用
    for k,v in ipairs(test) do
        print("ipairs遍历键值对"..k.."_"..v)
    end
    --只能输出1_11 2_22 3_33
    
    --2. 采用pairs迭代器进行遍历 均能遍历到 建议使用！
    for k,v in pairs(test) do
        print("pairs遍历键值对"..k.."_"..v)
    end
    --[[
    ipairs遍历键值对1_11
    ipairs遍历键值对2_22
    ipairs遍历键值对3_33
    pairs遍历键值对1_11
    pairs遍历键值对2_22
    pairs遍历键值对3_33
    pairs遍历键值对0_0
    pairs遍历键值对key1_value1
    pairs遍历键值对-1_-1
    pairs遍历键值对5_5]]
    ```
    
##### table表的公共方法

1. 表的插入 `table.insert(t1,t2)` 将表t2插入到t1的末尾 在t1中原地操作
    
    **注意插入的是表，不是表中元素，相当于t2表作为t1表中的最后一个元素（表的嵌套）**
    
    ```lua
    t1 = {{age = 1 , name ="Liu"},{age =2 , name ="Li" }}
    t2 = {name = "ss" , sex = "girl"}
    
    --插入 t2插入到t1中
    table.insert(t1,t2)
    print(#t1) --输出结果  3
    print(t1[3].name) --输出结果   ss
    ```
    
2. 表的删除 `table.remove(t1,index)`删除表t1的index索引处元素，若省略index则默认移除最后一个索引。 在t1中原地操作
    
    **删除元素建议使用remove方法，若使用置nil，会造成表的中断，#求长度不准确等问题**
    
3. 表的排序 `table.sort(t1,function)` function为排序规则可省略，默认为升序，原地操作。
    
    ```lua
    --表的排序
    t1 = {1,3,2,5,4,9,7}
    table.sort(t1) --升序
    
    --采用匿名函数改变规则降序排列
    table.sort(t1,function(a,b)
        if a > b then
            return true
        end
    end)
    --a为靠前字符 b为靠后字符 return true则不会进行交换
    ```
    
4. 表的拼接 `str = table.concat(t1,'分隔符')`返回一个拼接后的字符串,可选分隔符。
    
    ```lua
    --表的拼接 注意只能拼接字符串和数字类型
    tb = {"123","456",789}
    str = table.concat(tb)  --用于拼接表中元素 返回字符串 默认无分隔符
    print(str) --输出结果123456789
    str = table.concat(tb,";") --指定分隔符  注意true false不可拼接
    print(str) --输出结果123;456;789
    ```
    

##### table表的特殊用法（字典，类）

**字典的用法**

```lua
---表的特殊用法之字典
--字典的声明 利用自定义索引构造键值对形式
a = {["name"] = "MrLiu",["age"] = 14 , [4] = 5}
print(a["name"])  --访问单个变量[key]得到value

print(a.name)  --也可以通过.访问成员变量的方式得到值,但是不能是数字
a["name"] = "LZH"  --若存在则修改，不存在则新增。 
print(a.name)

a["name"] = nil    --删除

--字典的遍历 不能用ipairs无效 使用pairs
for k,v in pairs(a) do
	print(k..'_'..v)
end
```

**类的用法 ！！！ 重要**

类的组成：成员变量 + 成员方法 ；即一个类包含其特有的属性和对这些属性的相关操作。

在Lua中没有直接的类的相关语法，但是可以通过表来模拟基本的类。

```lua
--Lua中是默认没有面向对象的，需要自己来实现

--用表模拟类，成员变量+成员函数

Student = {
	name = "MrLiu",
	sex = "男",
	age = 18,
	Up = function()
		print("我成长了")
	end,
	getAge = function()
	--直接在内部写 无任何关系 此中age是全局变量
	--	return age;
	--指定类名.属性
	return Student.age  --此种写法不符合OOP的思想
	end
}

print(Student.getAge())
--利用冒号:和self配合定义函数 调用时切记使用冒号调用，传入自身。
--这种定义方法必须放在表的外面，内部无法使用这种定义形式
function Student:getAge2()
		return self.age
end
print(Student:getAge2())

function Student.Up2()
	print("我又成长了")
end
Student.Up2()

print(Student.getAge(Student)) --将自己传入进去
print(Student:getAge())   ---！！！！ 冒号调用方法 会默认把调用者作为第一个参数传入方法中

function Student:getSex()
	--lua 中 关键字self 表示默认传入的第一个参数
	-- : 直接运用非匿名参数 默认传入调用者作为第一个参数
	--两者配合 self就是表（类）自身
	print(self.sex)
end

Student:getSex() --调用时也必须用:或者传参
Student.getSex(Student) --这两种方法等效 更推荐上方的冒号调用
```

面试点总结

1. 在Lua中表模拟类时，**表中各元素之间相互独立因而表中方法无法像类一样直接调用其它元素**，**成员函数想要访问成员变量只能靠传参或传入表后利用表调用成员变量**。
2. 传入调用表更为通用，可自行定义一个参数用来接收调用表对象，用普通的点.调用时将表传入进去即可在函数内部利用表对象获取相应的成员变量了。
3. 现实开发更常用冒号配合self完成上述功能。**利用 冒号 : 可自动将调用者当作第一个参数传递给函数**，在定义函数时采用 冒号:的定义方法 配合self的使用（**self默认为函数参数的第一个参数**），达到类调用成员变量的效果。

#### **Lua的元表**

##### 概念

**任何表都可以作为另一个表的元表，任何表都可以拥有自己的元表**。在Lua中任何值都预定义了一组操作集合（例如number可以加减乘除，而table就不可以），**元表则可以修改一个值的行为，使其在面对一些特定的非预定义的操作时执行特定的操作**。

简单来说，**元表就是子表的备用表**，当在子表中进行某些操作但其本身无法完成时，会到元表中去找寻特定操作去完成它。**元表的存在和传统OOP父类的作用相似，为了实现Lua OOP，元表是必不可少的。**

##### 方法

- 设置元表函数 `setmetatable(subTable,metaTable)` 参数1 :子表 , 参数2 :元表
    
- 特定操作 `__tostring = function` 当子表被当作字符串调用时，会默认调用这个元表中的`tostring`对应的`func`方法。（**注意此时function会自动将子表传参给第一个参数**）
    
    ```lua
    --演示tostring 用法
    meta = {
        --改变子表行为，当子表作为字符串被调用时 会调用此匿名函数方法
        --会自动将子表传参给第一个参数（需要使用子表时务必定义此参数）
        __tostring = function(t)
            return t.name
        end
    }
    t = {
        name = "MrLiu"
    }
    setmetatable(t,meta)
    print(t)  --打印MrLiu
    ```
    
- 特定操作 `__call = function` 当子表被当作一个函数来使用时，会默认调用这个__call对应的函数（注意此时`func`仍会自动将子表传给第一个参数，自定义参数从第二个开始声明）
    
    ```lua
    --特定操作__call
    meta3 = {
    	--当子表要被当作字符串使用时，会默认调用这个元表中的tostring方法
    	--会自动将子类传参进第一个参数
    	__tostring = function(t)
    		return t.name
    	end,
    	--当子表被当作一个函数来使用时，会默认调用这个__call中的内容
    	__call = function(a,b)
    		print(a) --默认第一个参数还是表本身，打印自身相当于调用元表的tostring
    		print(b) --第二个参数开始才是传入的参数
    		print("奥里给")
    	end
    }
    myTable3 = {
    	name = "MrLiu"
    }
    --设置元表函数
    setmetatable(myTable3,meta3)
    
    myTable3("给力奥") --会输出 奥里给  给力奥
    ```
    
- 特定操作运算符重载 当子表之间使用+ - * /等运算符时会调用该方法 参数为两个table
    
    ```lua
    --特定操作运算符重载
    meta4 = {
    	--相当于运算符重载，当子表使用+运算符时，会调用该方法
    	__add = function(t1,t2)
    		return t1.age + t2.age
    	end,
        --同理当子表之间使用-运算符时，会调用该方法
    	__sub = function(t1,t2)
    		return t1.age - t2.age
    	end,
    	---运算符*
    	__mul = function(t1,t2)
    		return 0
    	end,
    	--运算符/
    	__div = function(t1,t2)
    		return 0
    	end,
    	--运算符%
    	__mod = function(t1,t2)
    		return 0
    	end,
    	--运算符^ 幂运算
    	__pow = function(t1,t2)
    		return 0
    	end,
    	--运算符 == 
    	__eq = function(t1,t2)
    		return true
    	end,
    	--运算符<
    	__lt = function(t1,t2)
    		return true
    	end,
    	--运算符<=
    	__le = function(t1,t2)
    		return false
    	end,
    	--运算符..
    	__concat= function(t1,t2)
    		return 0
    	end
    }
    --注意点 使用非比较运算符时 有一方注册了元表即可，另一方只需要满足重载函数要求即可
    myTable4 = {age = 1}
    setmetatable(myTable4,meta4)
    myTable5 = {age = 2}
    print(myTable4 + myTable5)  --输出3
    print(myTable4 - myTable5)  --输出-1
    
    --如果要使用比较运算符 == < <=等运算符，二者必须设置同一个元表才能准确调用
    setmetatable(myTable5,meta4)
    print(myTable4 == myTable5) --输出true
    print(myTable4 < myTable5) --输出true
    print(myTable4<=myTable5) --输出false
    
    print(myTable4 .. myTable5) --输出0
    ```
    
- **特定操作 `__index = table`** 当在子表中找不到某一个属性时，会到元表中`__index`指定的表中去找对应的属性 ,`__index`支持向上一层层套用，如果再找不到会继续向上找，直到找到目标属性或返回nil
    
    ```lua
    meta6Father = {
    	age = 1;
    }
    --建议此特定操作采用外部方式定义 否则可能出问题
    meta6Father.__index = meta6Father; --__index的查找可以一层一层向上套用
     
    --特定操作__index 和 __newindex
    meta6 ={
    	--__index 当子表中找不到某一个属性时
    	-- 会到元表中 __index指定的表去找索引
    	-- 找不到会继续向上找找不到返回nil
    }
    meta6.__index = meta6 --建议__index写在表外初始化不然会有问题查不到age
    myTable6 ={}
    setmetatable(myTable6,meta6)
    setmetatable(meta6,meta6Father)
    --层级关系 myTable6 --> meta6 --> meta6Father 一层层查找在meta6Father中有age属性
    print(myTable6.age)
    
    --若想只获取当前表的元素而不会向上查找元表指定的表，可以使用rawget(table,"属性名")函数
    print(rawget(myTable6,"age")) --输出nil
    ```
    
- 特定操作 `__newindex = table` 当为子表赋值时，如果赋值一个不存在的索引，那么其会把值赋值到`newindex`所指的表中 不会修改子表（同理也支持套用）
    
    ```lua
    --__newindex 当子表赋值时，如果赋值一个不存在的索引
    -- 那么会把值赋值到newindex所指的表中 不会修改子表
    meta7 = {}
    meta7.__newindex = {}
    myTable7 = {}
    setmetatable(myTable7,meta7);
    myTable7.age = 1;
    print(myTable7.age)
    print(meta7.__newindex.age)
    
    -- 获取元表 getmetatable
    print(getmetatable(myTable7))
    --rawset(表,"属性名",属性值) 赋值到指定表中 不受原表newindex的影响
    ```
    

#### **Lua的面向对象 OOP**

​ Lua作为脚本语言本身并不支持面向对象，但通过元表提供的方法，可以手动实现Lua中的面向对象，面向对象的三大特征：封装，继承，多态。下面将一一去实现它们！

##### 封装

​ 封装就是将描述某一种实体的数据以及对数据的操作集合到一起，形成一个封装体，保证内部数据结构的完整性。Lua中的类都是基于table去实现的，table可以存放任何数据类型，可以轻松实现封装的特性。类都会有new的实例化方法，仍需利用元表去实现一些类的基本方法。

```lua
--面向对象的类  其实都是基于table来实现
--下面实现万物的祖先Object类并提供new方法
Object = {}
Object.id = 1   --测试用
--实现实例化方法
function Object:new() -- 冒号会自动创建第一个参数 相当于function Object.new(t)
	--self 为默认传入的第一个参数 和冒号配合使用达到传入自身的目的
    
	local obj = {} --创建新对象(表)
	--设置元表特定操作__index指向调用new方法的表
	self.__index = self
	setmetatable(obj,self) --设置新表的元表为调用new方法的表
	return obj
end


local myObj = Object:new() --利用Object创建新对象（表） 一定冒号调用
print(myObj.id) --此时子表找不到id会向上找元表Object 输出1
myObj.id = 2;       --向子表中直接赋值 不会更改元表的内容而是在子表中新建/修改属性
print(myObj.id) --会打印2 因为子表中存在id了不会再找元表
```

关于new创建实例对象，多个对象之间互不影响的原因：当调用某个值时会优先考虑自己的表是否已经含有，若没有才会向上查找元表。当修改某个值时，只会在自己的表中进行新建/修改，一定不会影响到元表。此时元表就像一个模板一样虽然也是表但不会被子表改变，子表开始用的这套模板，但后续的更改却只发生在自己的子表中。充分体现了类与对象的关系！

##### 继承

​ 继承是OOP的又一大重要特征，其能实现概念上的统一。继承就是子类继承父类的特征和行为，使得子类对象（实例）具有父类的实例域和方法，或类从父类继承方法，使得子类具有父类相同的行为。继承的概念和元表更为相似，即使得子类继承父类，子类中找不到的再去父类中寻找。

```lua
--C# class 类名 : 继承类
--继承是新建一个类而不是一个对象 虽然本质上都是创建子表设置元表 但在OOP中要区分开来概念上的不同，新建一个类时提供利用字符串创建全局变量名的方法。
--Lua 中写一个用于继承的方法
function Object:subClass(className) --利用字符串创建子对象
	-- _G 是总表 所有声明的全局变量 都以键值对的形式存在其中
	-- 直接向_G中赋值 等于声明了全局变量 全局可用
	_G[className] = {}

	local obj = _G[className]
	self.__index = self
	setmetatable(obj,self)
	--为子类定义一个base属性指向父类
	obj.base = self
end

Object:subClass("Monster") --新建类Monster继承自Object
dragon = Monster:new() --实例化Monster对象
dragon.id = 100;
print(dragon.id) --输出100
```

对实例化和继承的对比

​ 关于实现的继承方法`subClass`，本质上和实例化一样就是创建子表设置元表，只不过继承多了个设置父对象的操作。但二者在意义上却完全不同，继承是类与类之间的关系，得到的表不能直接使用而是要作为类使用，只能操作其调用new方法实例化后的对象，在实际开发过程中虽然语法层面没有严格要求，但一定要按照OOP的准则严格进行，否则会出现极其严重的混淆情况。

##### 多态

多态就是 父类的同一种动作或者行为，在不同的子类上有不同的实现效果。在Lua中对元表`index`的设置也是会优先查找子表，不同子表实现元表的同名方法，产生不同的效果即可实现多态。

```lua
--父类的同一种动作或者行为，在不同的子类上有不同的实现。
--(父类调用同一方法，在不同的子类上有不同的执行效果)
Object:subClass("GameObject") --GameObject继承Object
GameObject:subClass("Player") -- Player继承GameObject
GameObject.posX = 0
GameObject.posY = 0
function GameObject:speak()
	print(self.posX)
	print(self.posY)
end
function GameObject:Move()
	self.posX = self.posX + 1
	self.posY = self.posY + 1
end
function Player:Move() --重写父类方法 缺点无法保留父类方法 需实现base方法
	--base 指的是 GameObject 表
	--这种方式调用 相当于是把基类表作为第一个参数传入了
	--避免把基类表 传入到方法中 这样相当于共用一张表的属性
	--self.base:Move()  此时传入的第一个参数是self.base父类 会修改父类的数据
    ----而应通过.调用self.base.Move(self) 执行父类逻辑 使用子类数据
	self.base.Move(self) --执行父类逻辑 传入子类数据
	self.posX = self.posX + 10
	self.posY = self.posY + 10
end
local p1 = Player:new() --实例化Player 为p1
p1:Move()
p1:speak()
print(p1.posX)
local p2 = Player:new() --实例化Player 为p2
print(rawget(p2,"posX"))
p2:Move()
print(rawget(p2,"posX"))
p2:speak()
--注意 此时利用Player创建的多个对象共用一个Player元表
--当访问值的时候可能子表没有会访问元表中的值
--但当赋值时会在子表中创建/修改对应属性的值 所以各个对象之间才是独立的
```

**使用base时一定注意传入参数问题，不能修改父类的数据，而是要传入自身的子类数据**

##### OOP汇总代码 面试重点

```lua
--面向对象实现
--万物之父 所有对象的基类 Object
--封装
Object = {}
--实例化方法
function Object:new()
	local obj = {}
	--给空对象设置元表 以及 __index
	self.__index = self
	setmetatable(obj,self)
	return obj
end
--继承 本质和new一样 用法有所不同 字符串创建 设置base
function Object:subClass(className)
	--根据名字生成一张表 -- 一个类
	_G[className] = {}
	local obj = _G[className]
	--设置自己的“父类”
	obj.base = self
	--向子类设置元表 以及__index
	self.__index = self
	setmetatable(obj,self)
end

--声明一个新类继承自Object
Object:subClass("GameObject")
--成员变量
GameObject.posX = 0
GameObject.posY = 0
--成员方法
function GameObject:Move()
	self.posX = self.posX + 10
	self.posY = self.posY + 10
end
function GameObject:speak()
	print(self.posX)
	print(self.posY)
end

--实例化对象
local obj1 = GameObject:new()
local obj2 = GameObject:new()
obj1:Move()
obj1:speak()
obj2:speak()

--多态 Player重写了GameObject的Move方法
GameObject:subClass("Player")
function Player:Move()
	--注意调用父类方法时不能用冒号 要传入自身而不是base父类
	self.base.Move(self) 
end

local p1 = Player:new()
local p2 = Player:new()
p1:Move()
p1:Move()
p2:Move()
p1:speak()
p2:speak()
	
```

#### Lua的特殊用法

- 多变量赋值：`a,b,c = 1,2,"123"` 一次为多个变量进行赋值
    
- `and or` 不仅可以连接`boolean`类型其余类型均可连接，只有nil和false认为是假且有短路情况 且表达式的值为最后判断的值
    
    ```
    print(1 and 2) --输出2 先判断1为真继续判断2为真 最后结果为2
    print(false and 1) --输出false 判断false为假由于短路情况，所以最后结果为false
    print(true and false) --输出false 和第一个同理
    print(nil or false) -- 输出false 先判断nil为假无短路进而判断false结果为false
    ```
    
- Lua不支持三目运算符，自行实现三目运算符 条件? 结果1 : 结果2
    
    ```
    --Lua自行实现三目运算符
    x = 3
    y = 2
    local res = (x > y) and x or y
    --解释如下
    --如果条件为真 and 后必定为真 or短路运算结果为x 符合三目运算符规则
    --如果条件为假 短路运算and必定为假 然后进而判断or后的元素 结果为y 符合规则
    ```
    

#### Lua自带库函数

```
print("*************Lua自带库**************")

print("********时间********")
--系统时间
print(os.time())  --一串代表时间的数字 不直观
--自己传入参数得到时间
print(os.time({year = 2014 , month = 8, day = 14}))
--os.date("*t") 返回值是表 键值对
local nowTime = os.date("*t") 
for k,v in pairs(nowTime) do
	print(k,v)
end
--[[
hour	14
min	50
wday	2
day	7
month	2
year	2022
sec	41
yday	38
isdst	false
]]
print("********数学计算********")
--math
--绝对值
print(math.abs(-13))
--弧度转角度
print(math.deg(math.pi))
--三角函数 传入弧度
print(math.cos(math.pi))
--向下向上取整
print(math.floor(2.6)) --下
print(math.ceil(5.2)) --上
--最大最小值
print(math.max(1,2))
print(math.min(1,2,3,0))
--小数分离 分成整数部分和小数部分 返回两个参数
print(math.modf(1.2))
--幂运算 用^也可
print(math.pow(2,5))
--随机数 先设置随机数种子否则都一样
--[[用法：1.无参调用，产生[0, 1)之间的浮点随机数。

　　　2.一个参数n，产生[1, n]之间的整数。

　　　3.两个参数，产生[n, m]之间的整数。]]
math.randomseed(os.time())
print(math.random(100))
print(math.random(100))


print("********路径********")
--lua脚本加载路径
print(package.path)
package.path = package.path .. ";C:\\"  --字符串拼接增加加载路径
print(package.path)
```

#### Lua的垃圾回收

```
print("**************垃圾回收***********")

--垃圾回收关键字
--collectgarbage


test = {id = 1 , name = "123123"}

--获取当前lua占用内存书 K字节 用返回值*1024就可以得到具体的内存占用字节数
print(collectgarbage("count")) --"count"为固定语法

test = nil --必须置空才垃圾回收
--进行垃圾回收 有点像C#的GC机制
collectgarbage("collect")

print(collectgarbage("count"))

--lua中 自带自动定时进行GC的方法
--Unity 中热更新开发 尽量不要去用自动垃圾回收 消耗性能。
```