---
link: https://www.jianshu.com/p/04eaca440c5e
site: 简书
excerpt: "前言: 这次是iOS和Unity交互。过程没有预想的那么顺利，也踩了一些坑，做个笔记。 要做的事情就是实现 iOS 和 Unity
  交互，互相调用函数，传值。 传值系列 iO..."
twitter: https://twitter.com/@jianshu.com
slurped: 2026-02-06T14:56
title: iOS Unity 交互（系列一）Unity调用iOS函数 Unity给iOS传值
---

## iOS Unity 交互（系列一）Unity调用iOS函数 Unity给iOS传值

## 前言:

这次是iOS和Unity交互。过程没有预想的那么顺利，也踩了一些坑，做个笔记。

要做的事情就是实现 iOS 和 Unity 交互，互相调用函数，传值。

## 传值系列

[iOS Unity 交互（系列一）Unity调用iOS函数 Unity给iOS传值](https://www.jianshu.com/p/04eaca440c5e)  
[iOS Unity 交互（系列二）iOS调用Unity函数 iOS给Unity传值](https://www.jianshu.com/p/f397d51e4447)  
[iOS Unity 交互（系列三）iOS Unity互传参数与完整示例代码](https://www.jianshu.com/p/0b2a04acd51a)  
[iOS Unity 交互（系列四）Unity调用iOS SDK](https://www.jianshu.com/p/d18212c1455a)

#### 需要的工具

1、苹果电脑安装：Xcode，Unity，VSCode，开发工具安装最新的就行。

2、苹果手机真机，用于调试。

#### 实现目标

先实现一个最简单的交互，在Unity中调用函数，给iOS传值。

#### 操作流程

1、新建一个Unity项目 → 编写C#脚本

2、新建一个Xcode项目 → 编写.mm代码文件

3、把.mm文件放到Unity项目下 → 生成Xcode项目 → 真机运行

#### 第1步 新建Unity项目，初始化工作

新建空白项目

  

![](app://upload-images.jianshu.io/upload_images/1235875-23b0f7efea103be4.png)

1.png

项目成功运行

  

![](app://upload-images.jianshu.io/upload_images/1235875-e2be7de59692ffbc.png)

2.png

#### 第2步 编写脚本

图片中的完整代码在文章末尾

  

![](app://upload-images.jianshu.io/upload_images/1235875-fabf9cab99321088.png)

3.png

#### 第3步 新建Xcode项目，编写.mm文件，并把文件放到Unity项目中

![](app://upload-images.jianshu.io/upload_images/1235875-18e6f392ed20cf30.png)

4.png

#### 第4步 生成Xcode项目，真机运行。

![](app://upload-images.jianshu.io/upload_images/1235875-4907e288630f15d7.png)

5.png

![](app://upload-images.jianshu.io/upload_images/1235875-d35faf65d31f5b1d.png)

6.png

#### 图片中的示例代码：

C# 脚本代码 jiaoben.cs

```
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

using System.Runtime.InteropServices;

public class Jiaoben : MonoBehaviour
{

    [DllImport("__Internal")]
    private static extern void CadenceInitWith(string name);

    void Start()
    {
        Debug.Log("脚本开始运行");

        CadenceInitWith("ABCDEFG");
    }

    // Update is called once per frame
    void Update()
    {
        
    }
}

```

OC .mm文件代码 Unity_iOS_Connect.mm

```
#import <Foundation/Foundation.h>

extern "C" {

extern void CadenceInitWith(const char *objName) {
    NSString *s = [NSString stringWithUTF8String:objName];
    NSLog(@"接受从Unity传递过来的字符串 %@", s);
}

}
```

## 结语

终究是有一天碰上了Unity。

感谢以下iOS/Unity玩家的文章：  
[Unity3D与iOS的交互](https://www.jianshu.com/p/1ab65bee6692)

[<iOS和Unity交互>之参数传递](https://www.jianshu.com/p/86c4d9c9dafe)  
[Unity与iOS交互](https://www.jianshu.com/p/92fd1d197076)  
[unity 与oc交互](https://www.jianshu.com/p/8471114d6c3d)  
[Unity平台调用IOS](https://links.jianshu.com/go?to=https%3A%2F%2Fmy.oschina.net%2Fu%2F698044%2Fblog%2F610430)  
[Unity和OC简单交互(方法互调)](https://links.jianshu.com/go?to=https%3A%2F%2Fzhuanlan.zhihu.com%2Fp%2F375040440)  
[Unity-IOS交互整理](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.1024sou.com%2Farticle%2F62780.html)  
[iOS与Unity交互笔记之参数传递](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.jb51.net%2Farticle%2F159590.htm)  
[iOS 和 Unity之间参数传递的方法](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.yisu.com%2Fzixun%2F570616.html)  
[iOS与Unity交互笔记之参数传递](https://links.jianshu.com/go?to=http%3A%2F%2Fwww.manongjc.com%2Farticle%2F101353.html)  
[iOS和Unity交互之参数传递](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fcherish_joy%2Farticle%2Fdetails%2F70314336)  
[Unity3d与iOS交互开发—接入平台SDK必备技能](https://links.jianshu.com/go?to=https%3A%2F%2Fdeveloper.aliyun.com%2Farticle%2F130504)  
[iOS 和 Unity 交互之参数传递](https://links.jianshu.com/go?to=https%3A%2F%2Fmy.oschina.net%2Fu%2F4589456%2Fblog%2F4584594)

报错解决：  
[malloc: *** error for object 0x1018ad6a0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fu012138730%2Farticle%2Fdetails%2F82896060)

[Unity 调用oc报错：malloc: *** error for object 0x1ecc0eb0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fjbl20078%2Farticle%2Fdetails%2F77865193)  
[malloc: *** error for object 0x1ecc0eb0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fwuming22222%2Farticle%2Fdetails%2F38900637)  
[Unity3D中C#调用iOS的静态库(*.a)](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fskylin19840101%2Farticle%2Fdetails%2F51039176%3Fspm%3D1001.2101.3001.6650.1%26utm_medium%3Ddistribute.pc_relevant.none-task-blog-2%257Edefault%257ECTRLIST%257Edefault-1.pc_relevant_paycolumn_v2%26depth_1-utm_source%3Ddistribute.pc_relevant.none-task-blog-2%257Edefault%257ECTRLIST%257Edefault-1.pc_relevant_paycolumn_v2%26utm_relevant_index%3D2)  
[pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fjiangxf24%2Farticle%2Fdetails%2F84044308)

最后编辑于

：2022.01.20 10:07:26

©

著作权归作者所有,转载或内容合作请联系作者  
【社区内容提示】社区部分内容疑似由AI辅助生成，浏览时请结合常识与多方信息审慎甄别。  
平台声明：文章内容（如有图片或视频亦包括在内）由作者上传并发布，文章内容仅代表作者本人观点，简书系信息发布平台，仅提供信息存储服务。

### 相关阅读[更多精彩内容](https://www.jianshu.com/)

- [Unity与iOS交互](https://www.jianshu.com/p/92fd1d197076)
    
    一、概要 本篇文章主要介绍Unity调用iOS方法，以及iOS调用Unity方法，回传信息。暂不涉及iOS集成第三...
    
    [像个战士一样去战斗](https://www.jianshu.com/u/9604276fc4d7)阅读 7,980评论 0赞 0
    
- [<iOS和Unity交互>之界面跳转](https://www.jianshu.com/p/edc784385aaf)
    
    本文介绍了iOS和Unity交互,主要涉及两个界面之间的跳转. 如果对iOS和Unity交互传参方法不熟悉的朋友,...
    
    [o惜乐o](https://www.jianshu.com/u/a589d2b37b9c)阅读 11,288评论 5赞 17
    
- [Unity3D与iOS交互1（Unity里调用iOS原生）](https://www.jianshu.com/p/1567abb89f2d)
    
    此篇文章基于Unity version 5.3.6p6 与Xcode7.3。 在项目开发过程中，因为Unity3D...
    
    [Sam_xing](https://www.jianshu.com/u/f32be32b4880)阅读 12,935评论 6赞 8
    
- [iOS与Unity3D交互](https://www.jianshu.com/p/e314fd3fdc57)
    
    最近游戏组让配合开发一个 “在Unity中点击按钮弹出原生二维码扫码页面 -> 再把获取到的二维码信息传回给Uni...
    
    [抓鱼猫L](https://www.jianshu.com/u/c09e9c8f92aa)阅读 7,286评论 3赞 4
    
- [iOS与unity交互混编, 闭包方式实现互相调用](https://www.jianshu.com/p/d2b58ad148c6)
    
    背景 unity需要调用其没有实现的原生功能。unity使用C#开发，可以与c++混编。iOS使用Objectiv...
    
    [yiangdea](https://www.jianshu.com/u/f580d648f55a)阅读 8,441评论 0赞 2
    

### 友情链接[更多精彩内容](https://www.jianshu.com/)

- [如何在家给宠物做专业级美容修剪？](https://www.jianshu.com/p/6b44605658e1)
    
- [世卫组织如何促进猴痘防控的国际合作？](https://www.jianshu.com/p/acdfa7df4610)
    
- [华山坐缆车攻略](https://www.jianshu.com/p/d6e5025fd460)