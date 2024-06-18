---
link: https://cloud.tencent.com/developer/article/1493624
byline: LV.关注文章0获赞0
excerpt: 首先我们要明白，泛型是泛型，集合是集合，泛型集合就是带泛型的集合。下面我们来模仿这List集合看一下下面这个例子：
tags:
  - slurp/安全
  - slurp/list
  - slurp/object
  - slurp/泛型
slurped: 2024-06-18T04:59:25.166Z
title: C#高级语法之泛型、泛型约束，类型安全、逆变和协变（思想原理）-腾讯云开发者社区-腾讯云
---

**一、为什么使用泛型？**

##### **泛型其实就是一个不确定的类型，可以用在类和方法上，泛型在声明期间没有明确的定义类型，编译完成之后会生成一个占位符，只有在调用者调用时，传入指定的类型，才会用确切的类型将占位符替换掉。**

首先我们要明白，泛型是泛型，集合是集合，泛型集合就是带泛型的集合。下面我们来模仿这List集合看一下下面这个例子：

##### **我们的目的是要写一个可以存放任何动物的集合，首先抽象出一个动物类：**

```
//动物类
public class Animal
{
    //随便定义出一个属性和方法
    public String SkinColor { get; set; }//皮肤颜色
    //会跑的方法
    public virtual void CanRun()
    {
        Console.WriteLine("Animal Run Can");
    }
}
```

##### **然后创建Dog类和Pig类**

```
//动物子类 Dog
public class Dog : Animal
{
    //重写父类方法
    public override void CanRun()
    {
        Console.WriteLine("Dog Can Run");
    }
}

//动物子类 Pig
public class Pig : Animal
{
    //重写父类方法
    public override void CanRun()
    {
        Console.WriteLine("Pig Can Run");
    }
}
```

因为我们的目的是存放所有的动物，然后我们来写一个AnimalHouse用来存放所有动物：

```
//存放所有动物
public class AnimalHouse
{
    //由于自己写线性表需要考虑很多东西，而且我们是要讲泛型的，所以内部就用List来实现
    private List<Animal> animal = new List<Animal>();

    //添加方法
    public void AddAnimal(Animal a)
    {
        animal.Add(a);
    }
    //移除方法，并返回是否成功
    public bool RemoveAnimal(Animal a)
    {
        return animal.Remove(a);
    }

}
```

AnimalHouse类型可以存放所有的动物，但是每次存入子类对象的时候就会进行装箱操作，每次取出的话，还要再次进行拆箱操作，会消耗额外的性能，因为所有的子类都能存放，所以拆箱的话也会很麻烦。

##### **如果我们有方法可以做到，让调用者来决定添加什么类型(具体的类型，例如Dog、Pig)，然后我们创建什么类型，是不是这些问题就不存在了？泛型就可以做到。**

我们看一下泛型是如何定义的：

```
//用在类中
public class ClassName<CName>
{
    //用在方法中
    public void Mothed<MName>() {
        
    }

    //泛型类中具体使用CName
    //返回值为CName并且接受一个类型为CName类型的对象
    public CName GetC(CName c) {
        //default关键字的作用就是返回类型的默认值
        return default(CName);
    }
}
```

其中CName和MName是可变的类型(名字也是可变的)，用法的话就和类型用法一样，用的时候就把它当成具体的类型来用。

了解过泛型，接下来我们使用泛型把AnimalHouse类更改一下，将所有类型Animal更改为泛型，如下：

```
public class AnimalHouse<T>
{
    private List<T> animal = new List<T>();

    public void AddAnimal(T a)
{
        animal.Add(a);
    }
    
    public bool RemoveAnimal(T a)
{
        return animal.Remove(a);
    }
}
```

AnimalHouse类型想要存储什么样的动物，就可以完全交由调用者来决定：

```
//声明存放所有Dog类型的集合
AnimalHouse<Dog> dog = new AnimalHouse<Dog>();
//声明存放所有Pig类型的集合
AnimalHouse<Pig> pig = new AnimalHouse<Pig>();
```

调用方法的时候，原本写的是T类型，当声明的时候传入具体的类型之后，类中所有的T都会变成具体的类型，例如Dog类型，Pig类型

![](https://ask.qcloudimg.com/http-save/yehe-4894130/83ovbnocnt.png)

![](https://ask.qcloudimg.com/http-save/yehe-4894130/i74uecvvnz.png)

这样我们的问题就解决了，当调用者传入什么类型，我们就构造什么类型的集合来存放动物。

但是还有一个问题，就是调用者也可以不传入动物，调用者可以传入一个桌子(Desk类)、电脑(Computer)，但是这些都不是我们想要的。比如我们需要调用动物的CanRun方法，让动物跑一下再放入集合里（z），因为我们知道动物都是继承自Animal类，所有动物都会有CanRun方法，但是如果传入过来一个飞Desk类我们还能使用CanRun方法吗？答案是未知的，所以为了确保安全，我们需要对传入的类型进行约束。

#### **二、泛型约束**

泛型约束就是对泛型(传入的类型)进行约束，约束就是指定该类型必须满足某些特定的特征，例如：可以被实例化、比如实现Animal类等等

我们来看一下官方文档上都有那些泛型约束：

对多个参数应用约束：

```
//微软官方例子
class Base { }
class Test<T, U>
    where U : struct
    where T : Base, new()
{ }
```

使用的话只需要在泛型后面添加 **where 泛型 : 泛型约束1、泛型约束2**....，**如果有new()约束的话则必须放在最后，**说明都有很详细的介绍。

然后我们来为AnimalHouse添加泛型约束为：必须包含公共无参构造函数和基类必须是Animal

```
//Animal约束T必须是Animal的子类或者本身，new()约束放在最后
public class AnimalHouse<T> where T : Animal, new()
{
    private List<T> animal = new List<T>();

    public void AddAnimal(T a)
{
        //调用CanRun方法
        //如果不加Animal泛型约束是无法调用.CanRun方法的，因为类型是不确定的
        a.CanRun();
        //添加
        animal.Add(a);
    }
    
    public bool RemoveAnimal(T a)
{
        return animal.Remove(a);
    }
}
```

然后调用的时候我们传入Object试一下

![](https://ask.qcloudimg.com/http-save/yehe-4894130/p5l8hif1di.png)

提示Object类型不能传入AnimalHouse<T>中，因为无法转换为Animal类型。

我们在写一个继承Animal类的Tiger子类，然后私有化构造函数

```
//动物子类 Tiger
public class Tiger : Animal
{
    //私有化构造函数
    private Tiger()
    {

    }
    public override void CanRun()
    {
        Console.WriteLine("Tiger Can Run");
    }
}
```

然后创建AnimalHouse类型对象，传入Tiger类试一下：

![](https://ask.qcloudimg.com/http-save/yehe-4894130/wjamar8tq4.png)

提示必须是公共无参的非抽象类型构造函数。现在我们的AnimalHouse类就很完善了，可以存入所有的动物，而且只能存入动物

#### **三、逆变和协变**

先来看一个问题

```
Dog dog = new Dog();
Animal animal = dog;
```

这样写编译是不会报错的，因为Dog继承了Animal，默认会进行一个隐式转换，但是下面这样写

```
AnimalHouse<Dog> dogHouse = new AnimalHouse<Dog>();
AnimalHouse<Animal> animalHouse = dogHouse;
```

![](https://ask.qcloudimg.com/http-save/yehe-4894130/h9acihpc1r.png)

这样写的话会报一个无法转换类型的错误。

强转的话，会转换失败，我们设个断点在后一句，然后监视一下animalHouse的值，可以看到值为null

```
//强转编译会通过，强转的话会转换失败，值为null
IAnimalHouse<Animal> animalHouse = dogHouse as IAnimalHouse<Animal>;
```

![](https://ask.qcloudimg.com/http-save/yehe-4894130/jrto29ihax.png)

![](https://ask.qcloudimg.com/http-save/yehe-4894130/issp62oaw8.png)

协变就是为了解决这一问题的，这样做其实也是为了解决类型安全问题（百度百科）：例如类型安全代码不能从其他对象的私有字段读取值。它只从定义完善的允许方式访问类型才能读取。

因为协变只能用在**接口或者委托类型中**，所以我们将AnimalHouse抽象抽来一个空接口IAnimalHouse，然后实现该接口：

```
//动物房子接口（所有动物的房子必须继承该接口，例如红砖动物房子，别墅动物房）
public interface IAnimalHouse<T> where T : Animal,new()
{

}
//实现IAnimalHouse接口
public class AnimalHouse<T> : IAnimalHouse<T> where T : Animal,new()
{
    private List<T> animal = new List<T>();

    public void AddAnimal(T a)
    {
        a.CanRun();
        animal.Add(a);
    }
    public bool RemoveAnimal(T a)
    {
        return animal.Remove(a);
    }
}
```

协变是在T泛型前使用out关键字，其他不需要做修改

```
public interface IAnimalHouse<out T> where T : Animal,new()
{

}
```

接下来我们用接口来调用一下，现在一切ok了，编译也可以通过

```
IAnimalHouse<Dog> dogHouse = new AnimalHouse<Dog>();
IAnimalHouse<Animal> animalHouse = dogHouse;
```

##### **协变的作用就是可以将子类泛型隐式转换为父类泛型，而逆变就是将父类泛型隐式转换为子类泛型**

将接口类型改为使用in关键字

```
public interface IAnimalHouse<in T> where T : Animal,new()
{

}
```

逆变就完成了：

```
IAnimalHouse<Animal> animalHouse = new AnimalHouse<Animal>();
IAnimalHouse<Dog> dogHouse = animalHouse;
```

逆变和协变还有两点：协变时**泛型**无法作为**参数**、逆变时**泛型**无法作为**返回值。**

逆变：

![](https://ask.qcloudimg.com/http-save/yehe-4894130/85favly4u8.png)

协变：

![](https://ask.qcloudimg.com/http-save/yehe-4894130/ytkm41vxa2.png)

##### **语法都是一些 非常粗糙的东西，重要的是思想、思想、思想。然后我们来看一下为什么要有逆变和协变？**

##### **什么叫做类型安全？C#中的类型安全个人理解大致就是：一个对象向父类转换时，会隐式安全的转换，而两种不确定可以成功转换的类型（父类转子类），转换时必须显式转换。解决了类型安全大致就是，这两种类型一定可以转换成功。（如果有错误，欢迎指正）。**

##### **协变的话我相信应该很好理解，将子类转换为父类，兼容性好，解决了类型安全（因为子类转父类是肯定可以转换成功的）；而协变作为返回值是百分百的类型安全**

##### **“逆变为什么又是解决了类型安全呢？子类转父类也安全吗？不是有可能存在失败吗？”**

##### **其实逆变的内部也是实现子类转换为父类，所以说也是安全的。**

##### **“可是我明明看到的是IAnimalHouse<Dog> dogHouse = animalHouse;将父类对象赋值给了子类，你还想骗人？”**

##### **这样写确实是将父类转换为子类，不过逆变是用在作为参数传递的。这是因为写代码的“视角”原因，为什么协变这么好理解，因为子类转换父类很明显可以看出来“IAnimalHouse<Animal> animalHouse = dogHouse;”，然后我们换个“视角”，将逆变作为参数传递一下，看这个例子：**

**先将IAnimalHouse接口修改一下：**

```
public interface IAnimalHouse<in T> where T : Animal,new()
{
    //添加方法
    void AddAnimal(T a);
    //移除方法
    bool RemoveAnimal(T a);
}
```

**然后我们在主类（Main函数所在的类）中添加一个TestIn方法来说明为什么逆变是安全的：**

```
//需要一个IAnimalHouse<Dog>类型的参数
public void TestIn(IAnimalHouse<Dog> dog) 
{
    
}
```

**接下来我们将“视角”切到TestIn中，作为第一视角，我们正在写这个方法，至于其他人如何调用我们都是不得而知的**

**我们就随便在当前方法中添加一个操作：为dog变量添加一个Dog对象，TestIn方法改为如下：**

```
//需要一个IAnimalHouse<Dog>类型的参数
public static void TestIn(IAnimalHouse<Dog> dog)
{
    Dog d = new Dog();
    dog.AddAnimal(d);
}
```

**我们将“视角”调用者视角，如果我们想调用当前方法，只有两种方法：**

```
//第一种
AnimalHouse<Dog> dogHouse = new AnimalHouse<Dog>();
TestIn(dogHouse);
//第二种
AnimalHouse<Animal> animalHouse = new AnimalHouse<Animal>();
//因为使用了in关键字所以可以传入父类对象
TestIn(animalHouse);
```

**第一种的话我们就不看了，很正常也很合理，我们主要来看第二种，那第二种类型安全又在哪儿呢？**

**可能有人已经反应过来了，我们再来看一下TestIn方法，有一个需要传递过来的IAnimalHouse<Dog>类型的dog对象，如果调用者是使用第二种方法调用的，那这个所谓的IAnimalHouse<Dog>类型的dog对象是不是其实就是AnimalHouse<Animal>类型的对象？而dog.AddAnimal(参数类型);的参数类型是不是就是需要一个Animal类型的对象？那传入一个Dog类型的d对象是不是最终也是转换为Animal类型放入dog对象中？所以当逆变作为参数传递时，类型是安全的。**

#### **思考：那么，现在你能明白上面那个错误，为什么“协变时泛型无法作为参数、逆变时泛型无法作为返回值”了吗？**

```
public interface IAnimalHouse<in T> where T : Animal,new()
{
    //如果这样写逆变成立的话
    //我们实现该接口，实现In方法，return(返回)一个默认值default(T)或者new T()
    //此时使用第二种方法调用TestIn，并在TestIn中调用In方法
    //注意，在TestIn中In方法的显示返回值肯定是Dog，但是实际上要返回的类型是Animal
    //所以就存在Animal类型转换为Dog类型，所以就有可能失败
    //所以逆变时泛型无法作为返回值
    T In();

    void AddAnimal(T a);
    bool RemoveAnimal(T a);
}
```

```
//在主类（Main类）中添加一个out协变测试方法
public static IAnimalHouse<Animal> TestOut() 
{
    //返回一个子类
    return new AnimalHouse<Dog>();
}

//回到接口
public interface IAnimalHouse<out T> where T : Animal,new()
{
    //如果这样写协变成立的话
    //我们在Main方法中调用TestOut()方法，使用house变量接收一下
    //IAnimalHouse<Animal> house = TestOut();
    //然后调用house的AddAnimal()方法
    //注意，此时AddAnimal方法需要的是一个Animal，但是实际类型却是Dog类型
    //因为我们的TestOut方法返回的是一个Dog类型的对象
    //所以当我们在AddAnimal()中传入new Animal()时，会存在Animal父类到Dog子类的转换
    //类型是不安全的，所以协变时泛型无法作为参数
    void AddAnimal(T a);
    bool RemoveAnimal(T a);
}
```

本文参与 [腾讯云自媒体同步曝光计划](https://cloud.tencent.com/developer/support-plan)，分享自微信公众号。

原始发表：2019-08-25

，如有侵权请联系 [cloudcommunity@tencent.com](mailto:cloudcommunity@tencent.com) 删除