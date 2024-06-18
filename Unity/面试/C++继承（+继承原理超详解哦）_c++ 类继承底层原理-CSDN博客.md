---
link: https://blog.csdn.net/weixin_73450183/article/details/132841681#:~:text=%E7%BB%A7%E6%89%BF%E6%98%AF%E9%9D%A2%E5%90%91%E5%AF%B9%E8%B1%A1%E7%BC%96%E7%A8%8B%E4%B8%AD%E4%B8%80%E7%A7%8D%E4%BB%A3%E7%A0%81%E5%A4%8D%E7%94%A8%E7%9A%84%E9%87%8D%E8%A6%81%E6%89%8B%E6%AE%B5%E3%80%82,%E7%BB%A7%E6%89%BF%E6%98%AF%E5%9C%A8%E4%BF%9D%E6%8C%81%E5%8E%9F%E6%9C%89%E7%B1%BB%EF%BC%88%E5%9F%BA%E7%B1%BB%E6%88%96%E7%88%B6%E7%B1%BB%EF%BC%89%E7%89%B9%E6%80%A7%E7%9A%84%E5%9F%BA%E7%A1%80%E4%B8%8A%E8%BF%9B%E8%A1%8C%E6%8B%93%E5%B1%95%EF%BC%8C%E5%A2%9E%E5%8A%A0%E5%B1%9E%E6%80%A7%E6%88%96%E6%96%B9%E6%B3%95%EF%BC%8C%E4%BB%8E%E8%80%8C%E4%BA%A7%E7%94%9F%E4%B8%80%E4%B8%AA%E6%96%B0%E7%9A%84%E7%B1%BB%EF%BC%88%E6%B4%BE%E7%94%9F%E7%B1%BB%E6%88%96%E5%AD%90%E7%B1%BB%EF%BC%89%20%E3%80%82
byline: 成就一亿技术人!
excerpt: 文章浏览阅读2.2k次，点赞40次，收藏28次。继承是面向对象编程中一种代码复用的重要手段。继承是在保持原有类（基类或父类）特性的基础上进行拓展，增加属性或方法，从而产生一个新的类（派生类或子类）。继承体现了面向对象编程的层次型结构，是由简单到复杂的过程_c++
  类继承底层原理
tags:
  - slurp/c++-类继承底层原理
slurped: 2024-06-18T04:22:36.395Z
title: C++继承（+继承原理超详解哦）_c++ 类继承底层原理-CSDN博客
---

#### 继承

- [引言](https://blog.csdn.net/weixin_73450183/article/details/132841681#_1)
- [继承的基本概念](https://blog.csdn.net/weixin_73450183/article/details/132841681#_6)
- - [定义继承](https://blog.csdn.net/weixin_73450183/article/details/132841681#_20)
- [继承中的作用域](https://blog.csdn.net/weixin_73450183/article/details/132841681#_72)
- [继承中的赋值](https://blog.csdn.net/weixin_73450183/article/details/132841681#_136)
- [派生类的默认成员函数](https://blog.csdn.net/weixin_73450183/article/details/132841681#_167)
- - [构造函数](https://blog.csdn.net/weixin_73450183/article/details/132841681#_168)
    - [析构函数](https://blog.csdn.net/weixin_73450183/article/details/132841681#_206)
    - [拷贝构造与赋值重载](https://blog.csdn.net/weixin_73450183/article/details/132841681#_251)
- [菱形继承与菱形虚拟继承](https://blog.csdn.net/weixin_73450183/article/details/132841681#_325)
- - [多继承](https://blog.csdn.net/weixin_73450183/article/details/132841681#_326)
    - [菱形继承](https://blog.csdn.net/weixin_73450183/article/details/132841681#_359)
    - [菱形虚拟继承](https://blog.csdn.net/weixin_73450183/article/details/132841681#_424)
    - - [现象](https://blog.csdn.net/weixin_73450183/article/details/132841681#_426)
        - [原理](https://blog.csdn.net/weixin_73450183/article/details/132841681#_468)
- [继承与组合](https://blog.csdn.net/weixin_73450183/article/details/132841681#_473)
- [总结](https://blog.csdn.net/weixin_73450183/article/details/132841681#_512)

## 引言

在生活中不乏有这样的例子：在管理一个学校中人员的数据时，不同的身份有着不同的属性。在使用类来描述这些不同身份的人时，我们需要创建许多不同的类类型，例如学生类、教师类、门卫类等。但是其实这些不同身份的人是具有一些相同的属性的，例如姓名、年龄、性别、联系方式等。要是在每一个类类型中都对这些属性进行描述，就会显得有些冗余，继承的方式就可以解决这样的问题：  
**将这些共同的属性描述为一个父类，再使用不同的子类去继承父类，子类就会具有父类的属性与方法，这样就避免了上面冗余的问题**：  
![在这里插入图片描述](https://img-blog.csdnimg.cn/4c84940450d0437d89b536cb27020f10.png)  
在本篇文章中将详细介绍继承：

## 继承的基本概念

**继承是面向对象编程中一种代码复用的重要手段。继承是在保持原有类（基类或父类）特性的基础上进行拓展，增加属性或方法，从而产生一个新的类（派生类或子类）**。继承体现了面向对象编程的层次型结构，是由简单到复杂的过程：

```
class A
{
	int _a;
};
class B : public A
{
	int _b;
};
```

之前我们经常会使用组合的方式来进行类型的复用，在详细介绍完继承后会对它们进行区分。

### 定义继承

在定义继承时需要有**派生类、继承方式、基类**，格式如下：

```
class A
{
	int _a;
};
class B : public A
{
	int _b;
};
```

在上面的例子中，**类`A`为基类，类`B`为派生类， `:`后的`public`为继承方式**。

对于不同的访问限定符下的成员在不同的继承方式下的表现如下：  
**在前面类和对象部分中提到过`protected`与`private`成员在类内是没有区别的，但是在被继承时，私有成员在派生类中将不可见**  
![在这里插入图片描述](https://img-blog.csdnimg.cn/600d35236d634155956f2bc34622f565.png)

**需要注意的是：**

1. 基类`private`成员在派生类中无论以什么方式继承都是不可见的，即派生类对象在类里面与类外面都不能访问；
2. 如果基类成员不想在类外直接被访问，但需要在派生类中能访问，就定义为`protected`；
3. 使用`class`时默认的继承方式是`private` ，使用`struct`时默认的继承方式是`public`，但是最好显式写出继承方式；
4. 在实际运用中一般使用都是`public`继承：

```
class A
{
public:
	int _a1 = 0;
protected:
	int _a2 = 0;
private:
	int _a3 = 0;
};
class B : public A
{
public:
	void testclass()
	{
		cout << _a1 << endl;
		cout << _a2 << endl;
		//cout << _a3 << endl; 错误代码，基类私有对象在派生类中不可见
	}
};

int main()
{
	B b;
	cout << b._a1 << endl;
	//cout << b._a2 << endl; 错误代码，基类保护成员在公有继承下在派生类中依旧为报护成员
	return 0;
}
```

## 继承中的作用域

在继承中，派生类会依据上面提到的继承规则来继承基类中的成员。

**继承后，在派生类中原基类的成员和派生类新增成员各自有独立的域，并不在同一域中**；  
这意味着在继承时可以在派生类中定义与基类成员相同名称的成员，而不构成函数或者变量的命名冲突。但是会导致**派生类中的成员屏蔽掉基类中同名成员的直接访问**，即访问该成员时只能访问到派生类中新定义的成员（函数或变量），称为隐藏或重定义；  
需要注意的是，对于函数而言，**只需要派生类中定义函数与基类中的成员函数名相同就构成重载**：

```
class A
{
public:
	void func()
	{
		cout << "A::func()" << endl;
	}

	int _a = 10;
	int _aunique = 100;
};
class B : public A
{
public:
	void func(int b = 10)
	{
		cout << b << " " << "B::func()" << endl;
	}

	int _a = 20;
	int _b = 30;
};

int main()
{
	A a;
	B b;
	b.func();
	cout << b._a << endl;
	cout << b._b << endl;
	cout << b._aunique << endl;
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/ee7ade8e26cf42278790f316a2a2bc0d.png)  
在这段代码中，`A`为基类，`B`为派生类，派生类中定义了与`A`中同名的成员变量`_a`与成员函数`func`。  
在外面访问派生类的成员时，是不能访问到基类中被隐藏的成员的；  
当然，基类中没有被隐藏的成员是可以被访问到的。

要想访问基类中被隐藏的成员只能通过`基类 :: 基类成员`显式访问：

```
int main()
{
	A a;
	B b;
	//直接访问不到A中被隐藏成员
	b.func();
	cout << b._a << endl;
	cout << b._b << endl;
	//通过A::访问被隐藏成员
	b.A::func();
	cout << b.A::_a << endl;
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/1cfd8f4efae6411a894251a69f2812f5.png)  
在这段代码中，通过父类名`A`与域作用访问限定符`::`访问了`A`类中被隐藏的成员。

## 继承中的赋值

**派生类对象可以赋值给基类对象、基类的指针或引用**。这个行为被形象的称为切片或切割：  
![在这里插入图片描述](https://img-blog.csdnimg.cn/1cca7a4487244303a640b8f1b633a0ce.png)

```
//这里的A类与B类与上面一致
int main()
{
	A a;
	B b;
	b.A::_aunique = 200; //对b对象中A类的成员进行了改动
	A* ptra = &b; //派生类赋值给基类指针
	A& refa = b;  //派生类赋值给基类引用
	a = b;        //派生类赋值给基类对象
	 
	ptra->func();
	cout << ptra->_a << endl;
	cout << ptra->_aunique << endl;
	cout << endl;

	cout << refa._aunique << endl;
	cout << endl;
	cout << a._aunique << endl;
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/a8cfc7676d0649aea81f491277f11eba.png)  
**切片的行为是类本身具有的，并不需要进行强制类型转换**（强制类型转换需要构造临时对象）。

**不能使用基类对象给派生类对象赋值**

**基类的指针或者引用可以通过强制类型转换赋值给派生类的指针或者引用，但是必须是基类的指针是指向派生类对象时才是安全的**。这里基类如果是多态类型，可以使用`dynamic_cast` 来进行识别后进行安全转换。

## 派生类的默认成员函数

### 构造函数

构造派生类时，基类的那部分需要调用基类的构造函数来构造以及初始化：  
**当基类定义有默认构造函数时，派生类的构造函数中不需要显式调用基类构造函数**；  
**当基类没有默认构造函数时，需要在派生类构造函数的初始化列表中显式的调用基类构造函数**：

```
class A
{
public:
	A(int a)
	{
		_a = a;
		cout << "A(int a); " << endl;
	}
protected:
	int _a;
};

class B : public A
{
public:
	B(int a, int b)
		:A(a)
	{
		cout << "B(int a); " << endl;
		_b = b;
	}
protected:
	int _b;
};

int main()
{
	B b(10, 20);
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/ad6014474ee44f40a3cd61d27cf9ba8d.png)

### 析构函数

派生类的析构函数中会**自动调用**基类的析构函数释放基类中的资源。  
在**进行释放资源时，派生类中的资源先被释放，最后释放基类中的资源**：

```
class A
{
public:
	//A(int a)
	//{
	//	_a = a;
	//	cout << "A(int a); " << endl;
	//}
	~A()
	{
		cout << "~A();" << endl;
	}
protected:
	int _a = 10;
};

class B : public A
{
public:
	//B(int a, int b)
	//	:A(a)
	//{
	//	cout << "B(int a); " << endl;
	//	_b = b;
	//}
	~B()
	{
		cout << "~B();" << endl;
	}
protected:
	int _b = 20;
};

int main()
{
	B b;
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/1db47f5b556e497193e631cba0af75a1.png)

### 拷贝构造与赋值重载

派生类的拷贝构造与赋值重载函数都**需要显式调用基类的拷贝构造与赋值重载来处理基类中的成员**：

```

class A
{
public:
	A(int a)
	{
		_a = a;
		cout << "A(int a); " << endl;
	}
	A(const A& a)
	{
		cout << "A(const A& a);" << endl;
		_a = a._a;
	}
	A& operator=(const A& a)
	{
		cout << "A& operator=(const A & a);" << endl;
		_a = a._a;
		return *this;
	}
	//~A()
	//{
	//	cout << "~A();" << endl;
	//}
protected:
	int _a = 10;
};

class B : public A
{
public:
	B(int a, int b)
		:A(a)
	{
		cout << "B(int a); " << endl;
		_b = b;
	}
	B(const B& b)
		:A(b)
	{
		cout << "B(const B& b);" << endl;
		_b = b._b;
	}
	B& operator=(const B& b)
	{
		cout << "B& operator=(const B& b);" << endl;
		A::operator=(b);
		_b = b._b;
		return *this;
	}
	//~B()
	//{
	//	cout << "~B();" << endl;
	//}
protected:
	int _b = 20;
};

int main()
{
	B b1(10, 20);
	B b2(30, 40);
	cout << endl;
	b1 = b2;
	cout << endl;
	B b3(b2);
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/dad26daa8b7140e1be3fa94882ac30a7.png)

## 菱形继承与菱形虚拟继承

### 多继承

到这里，已经了解了继承的基本知识，但是在C++的继承体系下存在有一些问题：

在生活中不乏有这样的例子：一个人在社会中的身份可以有很多种，比如他（Zhangsan）可以既是大学生（Student），又是家教老师（Teacher）。如果我们要用一个派生类来描述`Zhangsan`，那么这个派生类就需要有两个基类，一个是`Student`类，另一个是`Teacher`类。**即一个派生类有多个基类的继承方式就是多继承**：

```
class Student
{
public:
	int _a = 10;
};

class Teacher
{
public:
	int _b = 20;
};

class Zhangsan : public Student , public Teacher
{
public:
	int _c = 30;
};

int main()
{
	Zhangsan z;
	cout << z._a << " " << z._b << " " << z._c << endl;
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/4153f26277234290aeb079802673f665.png)  
例如上面的代码，派生类`Zhangsan`继承了`Student`类和`Teacher`类，那么`Zhangsan`类型的对象就同时继承了`Student`类与`Teacher`类中的成员。（上面的`_a`、`_b`变量与继承方式均为`public`，所以可以直接访问）

### 菱形继承

上面的代码似乎很完美，满足了实际生活中复杂的需求。但是，当`Student`类与`Teacher`类都继承了同一个父类`People`类时，就会出现菱形继承：

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/857f9f1ba15e40e3a155e50430af1904.png)

**当`Student`类与`Teacher`类继承了`People`类后，这两个类中就都具有了`People`类中的成员`_x`，当`Zhangsan`类再去多继承`Student`与Teacher类时，`People`中的成员`_x`就会在`Zhangsan`类中出现两次。**

在我们使用`Zhangsan`实例化出的对象时，就会有数据冗余与二义性的问题：（数据冗余显而易见，出现了两份`_x`成员）

```
class People
{
public:
	int _x = 0;
};

class Student : public People
{
public:
	int _a = 10;
};

class Teacher : public People
{
public:
	int _b = 20;
};

class Zhangsan : public Student, public Teacher
{
public:
	int _c = 30;
};

int main()
{
	Zhangsan z;
	//访问这些数据时不会出现问题，因为这些成员在zhangsan类对象中只有一份
	cout << z._a << " " << z._b << " " << z._c << endl;
	//访问_x时就会出现二义性
	cout << z._x << endl; //error:错误代码，Zhangsan::_x指向不明确
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/f44a73c4c60c45d0b7374408adcc0079.png)  
当然，两个`_x`成员一定是分布在不同的基类中的，所以我们自然想到**通过域作用限定符来消除二义性**：

```
int main()
{
	Zhangsan z;
	//访问这些数据时不会出现问题，因为这些成员在zhangsan类对象中只有一份
	cout << z._a << " " << z._b << " " << z._c << endl;
	//访问_x时就会出现二义性
	//cout << z._x << endl; //error:错误代码，Zhangsan::_x指向不明确

	//通过域作用限定符消除二义性
	z.Student::_x = 1;
	z.Teacher::_x = 2;
	cout << z.Student::_x << " " << z.Teacher::_x << endl;
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/fd87a2da295e4f198b86a929494b206b.png)  
这样虽然解决了二义性的问题，但是这样的处理不仅没有解决数据冗余，还使菱形继承变得有些别扭。毕竟同一个人的同一属性怎么可以有两个不同的值呢？

### 菱形虚拟继承

为了解决上面的问题，C++标准提出了**虚拟继承**：

#### 现象

需要使用菱形继承的场景中，使用`vitrual`修饰在菱形继承的腰部类即可：

```
class People
{
public:
	int _x = 0;
};

//class Student : public People
class Student : virtual public People
{
public:
	int _a = 10;
};

//class Teacher : public People
class Teacher : virtual public People
{
public:
	int _b = 20;
};

class Zhangsan : public Student, public Teacher
{
public:
	int _c = 30;
};

int main()
{
	Zhangsan z;
	z._x = 66;

	cout << z._a << " " << z._b << " " << z._c << " " << z._x << endl;
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/42ae7b5a672c488bb82dee749838cbe8.png)  
在使用了菱形虚拟继承后，就不会出现上面的数据冗余与二义性的问题了。  
**（需要注意的是，不要在没有菱形继承的情况下使用虚拟继承!）**

#### 原理

菱形虚拟继承的原理就是：将本来分别存在两个腰部类中的两份基类的变量转存到一处，然后在两个腰部变量中存储一个地址，这个地址指向的是**虚基表，记录着距离多个基类变量的偏移量**。通过虚基表中的偏移量就可以找到基类中的那个重复的变量：  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/60b96c6af80d476498be2027b494e35b.png)  
那一份基类的成员变量是存在该派生类的末尾的，虚基表中的偏移量就是腰部类中**指向虚基表的指针的那个地址到基类成员变量的偏移量**。虚基表的开头是一个`nullptr`，我们可以通过内存窗口来验证：  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/aed27adaaf8d4f4ca20b529fe06a0246.png)

## 继承与组合

在继承之前，我们经常使用**组合**的方式来实现代码复用，即**在`B`类中定义`A`类成员变量**：

```
class A
{
public:
	void func()
	{
		cout << "A:" << _a << endl;
	}
protected:
	int _a = 10;
};
class B
{
public:
	void func()
	{
		cout << "B:" << _b << endl;
		a.func();
	}
protected:
	int _b = 20;
	A a;
};

int main()
{
	B b;
	b.func();
	return 0;
}
```

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/9ca5203425634b36845b23cdee9e3441.png)  
这种方式类似于一种**黑盒调用**，适用于 **“has a”** 的包含关系。  
**`A`类不会暴露其成员变量，而只是暴露接口给`B`类使用**。这样的复用方式更加有利于降低代码的耦合性，提高了代码的可维护性，我们推荐多用组合的方式。

相对的，继承更像一种**白盒调用**，适用于 **“is a”** 的包含关系。  
**`A`类可以暴露成员变量给`B`类，这样的关系使类之间的结合更加紧密。要实现多态就要用继承，所以这种方式也是不可或缺的**。

## 总结

到此，关于C++继承的知识就介绍完了  
在下一篇文章中将继续介绍C++的更多特性

如果大家认为我对某一部分没有介绍清楚或者某一部分出了问题，欢迎大家在评论区提出

如果本文对你有帮助，希望一键三连哦

希望与大家共同进步哦