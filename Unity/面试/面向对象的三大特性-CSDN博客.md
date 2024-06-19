---
link: https://blog.csdn.net/qq_41706670/article/details/81589587
byline: 成就一亿技术人!
excerpt: 文章浏览阅读2.8w次，点赞20次，收藏39次。封装、继承、多态————————封装和继承目的都是为了代码重用，多态目的是为了接口重用。封装封装是把客观事物抽象成类，并且把自己的属性和方法让可信的类或对象操作，对不可性的隐藏。继承继承是指这样一种能力：它可以使用现有类的所有功能，并在无需重新编写原来的类的情况下对这些功能进行扩展。继承得到的新类称为“子类”或“派生类”。被继承的父类称为“基类”、“父类”或“超类”。
  ..._面向对象的三大特性
tags:
  - slurp/面向对象的三大特性
slurped: 2024-06-19T05:50:24.622Z
title: 面向对象的三大特性-CSDN博客
---

## 面向对象的三大特性

最新推荐文章于 2024-05-04 23:58:28 发布

![](https://csdnimg.cn/release/blogv2/dist/pc/img/original.png)

[private_pig](https://blog.csdn.net/qq_41706670 "private_pig") ![](https://csdnimg.cn/release/blogv2/dist/pc/img/newCurrentTime2.png) 最新推荐文章于 2024-05-04 23:58:28 发布

版权声明：本文为博主原创文章，遵循 [CC 4.0 BY-SA](http://creativecommons.org/licenses/by-sa/4.0/) 版权协议，转载请附上原文出处链接和本声明。

## 封装、继承、多态

```
封装和继承目的都是为了代码重用，多态目的是为了接口重用。
```

### 封装

封装是把客观事物抽象成类，并且**把自己的属性和方法让可信的类或对象操作，对不可性的隐藏。**

### 继承

继承是指这样一种能力：**它可以使用现有类的所有功能，并在无需重新编写原来的类的情况下对这些功能进行扩展。**

- 继承得到的新类称为“子类”或“派生类”。被继承的父类称为“基类”、“父类”或“超类”。
- 继承的过程是一个从一般到特殊的的过程。
- 继承概念的实现方式有二类：实现继承与接口继承。实现继承是指直接使用基类的属性和方法而无需额外编码的能力；接口继承是指仅使用属性和方法的名称、但是子类必须提供实现的能力；  
    java的访问权限  
    ![这里写图片描述](https://img-blog.csdn.net/20180811180656480?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzQxNzA2Njcw/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)

继承与接口与抽象类

- 接口可以继承接口，但用extends 而不是implement。
- 接口不能继承抽象类，抽象类可以实现（implement）接口。原因是接口的实现和抽象类的继承都要重写父类的抽象方法。而接口里只能有抽象方法，抽象类里则允许有抽象方法和非抽象方法。
- 抽象类可以继承实体类。

### 多态

多态性（polymorphism）是允许你将父对象设置成为和一个或更多的他的子对象相等的技术，赋值之后，父对象就可以根据当前赋值给它的子对象的特性以不同的方式运作。这就意味着**虽然针对不同对象的具体操作不同，但通过一个公共的类，它们（那些操作）可以通过相同的方式予以调用。**

```
//父类
public class Base {
	protected void show() {}
}

//子类
class Kid extends Base {
	 public  void show() {
		System.out.println(" i am  kid");
	}
}
```

```

    public static void main( String[] args )
    {
    	Kid kid = new Kid();
    	Base base = kid;
    	base.show();
    }

```

#### 运行结果：

![结果](https://img-blog.csdn.net/20180811183022633?watermark/2/text/aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzQxNzA2Njcw/font/5a6L5L2T/fontsize/400/fill/I0JBQkFCMA==/dissolve/70)  
实现多态，有二种方式，覆盖，重载。  
覆盖，是指子类重新定义父类的虚函数的做法。  
重载，是指允许存在多个同名函数，而这些函数的参数表不同（或许参数个数不同，或许参数类型不同，或许两者都不同）。  
重载和覆盖可参考https://blog.csdn.net/qq_41706670/article/details/81704748