---
link: https://blog.csdn.net/ousetuhou/article/details/134905401
byline: 成就一亿技术人!
excerpt: 文章浏览阅读542次，点赞11次，收藏9次。就算你有五年工作经验，也不得不防有些面试官问的初级问题，这波C#高频基础面试题，也许能帮到你。_c#面试
tags:
  - slurp/c#面试
slurped: 2024-06-15T15:02:56.059Z
title: C#.NET基础高频面试题_c#面试-CSDN博客
---

🎈🎈有些面试官的问题就是比较初级，对于底子比较弱的你，那真叫“防不胜防”啊🎈🎈

👍👍所以，你也有必要准备以下这些高频基础面试题🎉

👍👍机会都是给有准备的人的，祝你一面而就🎉

### 1. 什么是C#委托？

委托是一类继承自System.Delegate的类型，它是一个引用数据类型，保存着方法的引用。可以使用 delegate 关键字后跟函数签名来声明委托。也可以使用内置委托，如Action<>和Func<>。

每个委托对象至少包含了一个指向某个方法的指针，该方法可以是实例方法，也可以是静态方法。

委托允许将方法作为参数传递给其他方法，并且在需要时执行该方法，实现了回调方法的机制。能够帮助程序员设计更加简洁优美的面向对象程序。

### 2.什么是链式委托

链式委托又叫多播委托。是指一个由委托串成的链表，当链表上的一个委托被回调时，所有链表上该委托的后续委托将会被顺序执行。

使用 `+=` 运算符添加委托会创建一个委托链，使用 `-=` 运算符从委托链中删除委托。例子：

```
using System;
 

class Program
{
    //声明委托类型MyDelegate
    public delegate void MyDelegate();

 
    static void Main()
    {
        MyDelegate myDelegate = Method1;
        myDelegate += Method2;           //+=运算符，向委托链中添加委托
        myDelegate += Method3;
        myDelegate -= Method2;           //-=运算符，从委托链中删除委托
        
        Console.WriteLine("委托链");
        myDelegate();                    //执行委托方法，将按照添加方法的顺序调用所有方法
        
        Console.ReadKey();
    }
 
    static void Method1()
    {
        Console.WriteLine("方法1")
    }
 
    static void Method2()
    {
        Console.WriteLine("方法2");
    }
 
    static void Method3()
    {
        Console.WriteLine("方法3");
    }
}
```

### 3. 什么是事件？跟委托有什么区别？

事件是一种特殊的委托。事件用event关键字来声明，是一种使对象或类能够提供通知的成员。客户端可以通过提供事件处理程序为相应的事件添加可执行代码。

### 4. 什么是泛型？为什么要用泛型？

当程序的处理算法或逻辑相同，只是处理类型不同，这时候可以将程序处理的类型抽象为参数T。泛型技术支持泛型类、泛型接口、泛型委托、泛型方法等。

泛型的好处：

- **代码的可重用性、扩展性好**。无需从基类型继承，无需重写成员。
- **类型安全性提高**。 泛型将类型安全的负担从你那里转移到编译器。 没有必要编写代码来测试正确的数据类型，因为它会在编译时强制执行。 降低了强制类型转换的必要性和运行时错误的可能性。
- **性能提高**。泛型集合类型通常能更好地存储和操作值类型，因为无需对值类型进行装箱。

### 5. 泛型约束有哪些？泛型的主要约束和次要约束是什么？

泛型约束就是对泛型参数T加一些限制，T必须满足约束的要求，否则就报错。

有五大泛型约束，可以组合起来使用。

-  class 引用类型约束、
-  struct 值类型约束、
-  new() 无参构造函数约束、
-  接口约束
-  基类约束

每个泛型参数**可以有至多一个主要约束**，泛型的主要约束是指泛型参数必须是或者继承自某个引用类型，有两个特殊的主要约束：class和struct，分别代表泛型参数是引用类型和值类型。  
每个泛型参数**可以有无限个次要约束**，接口约束为次要约束。它规定的是某个泛型参数必须实现所有次要约束指定的接口。

### 6. 什么是CLR？

公共语言运行时 (common language runtime,CLR) 是托管代码执行核心中的引擎。

CLR为托管代码提供各种服务，如跨语言集成、代码访问安全性、对象生存期管理、调试和分析支持等。CLR实际上是驻留在内存里的一段代理代码，负责应用程序在整个执行期间的代码管理工作。

C# 是托管代码，用C#写的代码由C#编译器先编译为中间语言代码，公共语言运行时中的JIT即时编译器把中间语言代码编译成机器指令，并执行。

### ![](https://img-blog.csdnimg.cn/direct/7d97b78546bb4987baa9d1bd0176ceb1.png)  
7. 什么是GC？

.Net程序可以找出某个时间点上哪些已分配的内存空间没有被程序使用，并自动释放它们。

自动找出并释放不再使用的内存空间的机制，就称为**垃圾回收机制（简称：GC）**。

GC是由CLR负责的。

GC的机制是采用分代回收算法和标记压缩算法。（具体请自查）

### 8. using关键字有哪些作用？

using的作用一：引用命名空间。

> //引用命名空间
> 
> using System.IO;
> 
> //也可以给已有的命名空间创建别名
> 
> using s = System.Text;

作用二：释放资源。“using”用于定义该 using 语句块中使用的资源的范围。一旦代码块完成执行，在 using 代码块中使用的所有资源都会被释放。GC只能对托管堆里面分配的内存资源 进行自动回收，对于非托管资源比如文件对象、数据库连接对象等都需要用using语句由程序员自己进行回收。

> using(资源类 对象名=new 资源类())      //资源类必须实现IDisposable接口
> 
> {
> 
>     //代码块
> 
> }

例子：

```
//注意：实现了IDisposable接口的类，才能被用于using语句块
class Books : IDisposable
{
	private string _name;
	private decimal _price;
﻿
	public Books(string name, decimal price)
	{
		_name = name;
		_price = price;
	}
​
	public void Print()
	{
		Console.WriteLine("Book name is {0} and price is {1}", _name, _price);
	}
​
	public void Dispose()
	{
	   Console.WriteLine("Dispose方法被调用，进行释放资源");
	}
}
​
class Students
{
	public void DoSomething()
	{
		//使用using语句块，
		using(Books myBook = new Books("book name", 12.45))
		{
			myBook.Print();
		} //语句块结束之后，myBook.Dispose()会被自动调用

	}
}
```

### 9. 构造函数的作用？

构造函数与类名同名，没有返回值，在new实例化对象时会被自动调用。作用是：  
■ 给创建的对象建立一个标识符;  
■ 为对象内的数据成员开辟内存空间;  
■ 完成对象数据成员的初始化。

### 10. 装箱和拆箱是什么？

定义：当数据从值类型转换为引用类型的过程被称为“装箱”，而从引用类型转换为值类型的过程则被成为“拆箱”。

当我们将一个值类型转换为引用类型，数据将会从栈移动到堆中。相反，当我们将一个引用类型转换为值类型时，数据也会从堆移动到栈中。不管是在从栈移动到堆还是从堆中移动到栈上都会不可避免地对系统性能产生一些影响。

```
namespace demoapp
{
    class Conversion
    {
        public void DoSomething()
        {
            int i = 10;
            object o = i; //装箱
        }
    }
}

//==================================================
namespace demoapp
{
    class Conversion
    {
        public void DoSomething()
        {
            object o = 222;
            int i = (int)o; //拆箱
        }
    }
}
```

### 11. struct（结构）和class（类）区别？  

- struct 继承自 System.Value 类型，因此它是值类型，class 继承自 System.Object 类型，是引用类型；
- struct 不能被继承，class 可以被继承;
- struct 默认的访问权限是public，而class 默认的访问权限是private;
- struct的主要职责是存储数据，内存使用效率高，但不能有子类，不具有多态行为。
- class既能存储数据，又具有多态行为，但它是在堆上面分配内存，可能消耗更多时间，且会造成更多内存碎片。
- 存小量数据库可以用struct，存大量数据使用class。

### 12. 什么时候值类型会被分配在堆上？

如果作为一个方法的局部变量，那么值类型变量会被分配在 栈上。（值栈引堆）  
但是如果一个值类型变量是某个class类型的实例变量，因为class类型 会被分配在托管堆上，所以该值类型变量也会被创建在托管堆上。

### 13. CLR内存分配分哪些区域？

三大块：：栈、GC堆、大对象堆。  
**栈用于分配值类型实例**：由操作系统负责分配和回收，执行效率非常高，GC是管不了的。  
**GC堆：**用于分配小对象实例（小于85000字节的），GC会分三代进行垃圾回收，当进行GC操作（垃圾回收）时，垃圾收集器会对GC堆进行压缩回收。  
**大对象堆（LOH）：**用于分配 超过85000字节的对象，大对象分配在LOH上，不受GC控制，不会被压缩，只有在完全GC回收(只有在2代回收时才会处理大对象)时才会被回收。

### 14. 什么是虚方法？什么是抽象方法？

**virtual虚方法：**一个虚方法必须有一个默认实现，我们可以在派生类中使用 override 关键字来覆盖这个虚方法。  
**abstract抽象方法：** 基类里面只是创建了，但没有实现该方法，必须在派生类中去实现该抽象方法（抽象方法类似于接口方法，只有声明，没有实现）

### 15. 什么是方法重载和方法重写，区别？

方法重载和覆盖都是一种多态性。

方法重载（overload）是指我们有一个名称相同，但方法签名不同的方法。是一种编译时多态。

方法重写是使用 override 关键字，重写基类的虚拟方法。实现运行时多态性。

### 16. C#里都知道哪些数据容器类？

1、数组（Array）  
2、列表（List）  
3、集合（Collection）  
4、字典（Dictionary）  
5、队列（Queue）  
6、栈（Stack）  
7、哈希表（Hashtable）  
8、链表（LinkedList）

### 17. 什么是 C# 中的 LINQ？

LINQ 是指语言集成查询。LINQ 是一种使用 .NET 功能和类似于 SQL 的 C# 语法查询数据的方法。 LINQ 的优点是我们可以查询不同的数据源。数据源可以是:

- 对象的集合：LINQ to Object
- XML 文件：LINQ to XML
- JSON 文件：LINQ to JSON
- 数据库对象：LINQ to EF或LINQ to SQL

使用LINQ可以轻松地从任何实现 IEnumerable 接口的对象中检索数据。下面是 LINQ 的语法：

```
public class Devices
{
    public void GetData()
    {
        List<string> mobiles = new List<string>() {
              "Iphone","Samsung","Nokia","MI"
        };
        
        //LINQ语法
        var result = from s in mobiles
                     where s.Contains("Nokia")
                     select s;
       //...
    }
}
```

### 18. IList和List有什么区别？

IList是一个接口，规定实现这类接口的类需要实现的功能（函数）有哪些。IList不能被实例化。  
List <>是个类型，已经实现了IList <>定义的那些方法。  
总结：IList是一个接口，而List是一个确定的类型。

### 19. string和StringBuilder的区别

这两者都是引用类型，都被分配在托管堆上。

**字符串string是不可变的对象**。初始化字符串对象后，该字符串对象的长度、内容都是确定不变的了。当我们必须执行一些操作来更改字符串或附加新字符串时，它会在内存中创建一个新实例以将新值保存在字符串对象中。因为string的”不可变“，导致多次修改字符串的时候会损耗性能。

```
using System;

namespace demoapp
{
    class StringClass
    {
        public static void Main(String[] args)
        {
            string val = "Hello";
            //以下会创建一个新的String的实例
            val += "World";
            Console.WriteLine(val);
        }
    }
}
```

.NET为了解决这个问题，提供了动态创建string的方法，即**StringBuilder类，它是一个可变对象**，以克服string不可变带来的性能损耗。StringBuilder默认容量是16字节，可以允许扩充它所封装的字符串中字符的数量，每个StringBuffer对象都有一定的缓冲区容量，当字符串大小没有超过容量时，不会分配新的容量，当字符串大小超过容量时，会自动增加容量。

```
using System;
using System.Text;

namespace demoapp
{
    class StringClass
    {
        public static void main(String[] args)
        {
            StringBuilder val = new StringBuilder("Hello"); //定义StringBuilder对象
            val.Append("World");         //向val对象的字符串后面追加“World”
            Console.WriteLine(val);
        }
    }
}
```

对于简单的字符串拼接操作，在性能上StringBuilder不一定总是优于string，因为StringBuilder对象的创建也消耗大量的性能。注意区分使用。

### 20. IQueryable接口和IEnumerable接口的区别？

IQueryable是可查询接口，IEnumerable是可枚举接口，只有实现了IEnumerable的对象，才可以foreach遍历。

在EF/EF Core中，这两个接口的用法要注意：

（1）所有对于IEnumerable的过滤、排序、分组、聚合等操作，都是在内存中进行的。也就是说把所有的数据不管用不用得到，都从数据库倒入内存中，只是在内存中进行过滤和排序操作，但性能很高，空间换时间，用于操作本地数据源。

（2）所有对于IQueryable的过滤、排序、分组、聚合等操作，只有在数据真正用到的时候才会到数据库中查询，以及只把需要的数据筛选到内存中。Linq to SQL引擎会把表达式树转化成相应的SQL在数据库中执行，这也是Linq的延迟加载核心思想所在，在很复杂的操作下可能比较慢了，时间换空间。

---

C#的基础知识点当然不止以上这些，以上只不过是我根据学员的上百个面试录音，汇总出来的一些高频基础面试题。如果对你有帮助，欢迎关注+评论+转发，如有需要可以点击下方加我微信。