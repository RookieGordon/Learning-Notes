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

## 虚函数底层实现机制

最新推荐文章于 2024-04-20 23:59:14 发布

![](https://csdnimg.cn/release/blogv2/dist/pc/img/original.png)

![](https://csdnimg.cn/release/blogv2/dist/pc/img/identityVipNew.png) [chenchong_219](https://blog.csdn.net/chenchong_219 "chenchong_219") ![](https://csdnimg.cn/release/blogv2/dist/pc/img/newCurrentTime2.png) 最新推荐文章于 2024-04-20 23:59:14 发布

版权声明：本文为博主原创文章，遵循 [CC 4.0 BY-SA](http://creativecommons.org/licenses/by-sa/4.0/) 版权协议，转载请附上原文出处链接和本声明。

**1、多态的实现机制**

     C++在基类中声明一个带关键之Virtual的函数，这个函数叫虚函数；它可以在该基类的派生类中被重新定义并被赋予另外一种处理功能。通过指向指向派生类的基类指针或引用调用虚函数，编译器可以根据指向对象的类型在运行时决定调用的目标函数。这就实现了多态。

**2、实例**

```
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
return
```