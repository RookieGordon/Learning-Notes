---
link: https://blog.csdn.net/chenchong_219/article/details/41967321
byline: 成就一亿技术人!
excerpt: 文章浏览阅读4.3k次。1、多态的实现机制     C++在基类中声明一个带关键之Virtual的函数，这个函数叫虚函数；它可以在该基类的派生类中被重新定义并被赋予另外一种处理功能。通过指向指向派生类的基类指针或引用调用虚函数，编译器可以根据指向对象的类型在运行时决定调用的目标函数。这就实现了多态。2、实例#includeusing
  namespace std;class Base{pu_c# 虚函数原理
tags:
  - slurp/c#-虚函数原理
slurped: 2024-06-19T03:58:51.026Z
title: 虚函数底层实现机制_c# 虚函数原理-CSDN博客
---

1、多态的实现机制

C++在基类中声明一个带关键之Virtual的函数，这个函数叫虚函数；它可以在该基类的派生类中被重新定义并被赋予另外一种处理功能。通过指向指向派生类的基类指针或引用调用虚函数，编译器可以根据指向对象的类型在运行时决定调用的目标函数。这就实现了多态。


2、实例
```Cpp
#include<iostream>
using namespace std;
 
class Base
{
public:
	virtual void fun1 () {cout<<" printf base fun1!" <<endl;}
	virtual void fun2 () {cout<<" printf base fun2!" <<endl;}
private:
	int m_data1;
} ;
 
class Derive: public Base
{
public:
	void fun1 () {cout<<" printf derive fun1!" <<endl;}
	void fun3 () {cout<<" printf derive fun3" <<endl;}
private:
	int m_data2;
} ;
 
int main ()
{
	Base *pBase=new Derive;
	Derive a;
	pBase->fun1 () ;
	pBase->fun2 () ;
	a.fun3 () ;
	return 0;
}
```

3、底层机制
在每一个含有虚函数的类对象中，都含有一个VPTR，指向虚函数表。
![[Pasted image 20240619120411.png|570]]
派生类也会继承基类的虚函数，如果宅派生类中改写虚函数，虚函数表就会受到影响；表中元素所指向的地址不是基类的地址，而是派生类的函数地址。
![[Pasted image 20240619120423.png|570]]
当执行语句pBase->fun1()时，由于PBase指向的是派生类对象，于是就调用的Deriver::fun1()。

4、多重继承

```Cpp
#include<iostream_h>
class base1
{
public：
	virtual void vn(){}
private：
	int i;
)；
class base2
{
public：
	virtual void vf2(){}
private：
	intj；
)；

class derived：public base 1，public base2
{
public：
	virtual void vf3(){}
private：
	int k：
)；
void main()
{
	derivedd：
	base1 pl；
	base2 p2；
	pl=&d；p2 &d：
	pl->vfl()；
	p2->vf2()；
}
```

如果一个类具有多个包含虚函数的父类，编译器会为它创建多个VIrtual table，每个virtual table中各个虚函数的顺序与相应的父类一样。
