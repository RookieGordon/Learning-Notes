---
title: "iOS Unity 交互（系列一）Unity调用iOS函数 Unity给iOS传值"
source: "https://www.jianshu.com/p/04eaca440c5e"
author:
  - "[[简书]]"
published: 2022-01-18
created: 2026-02-06
description: "前言: 这次是iOS和Unity交互。过程没有预想的那么顺利，也踩了一些坑，做个笔记。 要做的事情就是实现 iOS 和 Unity 交互，互相调用函数，传值。 传值系列 iO..."
tags:
  - "clippings"
---
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

  
![](https://upload-images.jianshu.io/upload_images/1235875-23b0f7efea103be4.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

1.png

项目成功运行

  
![](https://upload-images.jianshu.io/upload_images/1235875-e2be7de59692ffbc.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

2.png

#### 第2步 编写脚本

图片中的完整代码在文章末尾

  
![](https://upload-images.jianshu.io/upload_images/1235875-fabf9cab99321088.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

3.png

#### 第3步 新建Xcode项目，编写.mm文件，并把文件放到Unity项目中

![](https://upload-images.jianshu.io/upload_images/1235875-18e6f392ed20cf30.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

4.png

#### 第4步 生成Xcode项目，真机运行。

![](https://upload-images.jianshu.io/upload_images/1235875-4907e288630f15d7.png?imageMogr2/auto-orient/strip|imageView2/2/w/968/format/webp)

5.png

![](https://upload-images.jianshu.io/upload_images/1235875-d35faf65d31f5b1d.png?imageMogr2/auto-orient/strip|imageView2/2/w/1200/format/webp)

6.png

#### 图片中的示例代码：

C# 脚本代码 jiaoben.cs

```csharp
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

OC.mm文件代码 Unity\_iOS\_Connect.mm

```csharp
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
[malloc: \*\*\* error for object 0x1018ad6a0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fu012138730%2Farticle%2Fdetails%2F82896060)
[Unity 调用oc报错：malloc: \*\*\* error for object 0x1ecc0eb0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fjbl20078%2Farticle%2Fdetails%2F77865193)  
[malloc: \*\*\* error for object 0x1ecc0eb0: pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fwuming22222%2Farticle%2Fdetails%2F38900637)  
[Unity3D中C#调用iOS的静态库(\*.a)](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fskylin19840101%2Farticle%2Fdetails%2F51039176%3Fspm%3D1001.2101.3001.6650.1%26utm_medium%3Ddistribute.pc_relevant.none-task-blog-2%257Edefault%257ECTRLIST%257Edefault-1.pc_relevant_paycolumn_v2%26depth_1-utm_source%3Ddistribute.pc_relevant.none-task-blog-2%257Edefault%257ECTRLIST%257Edefault-1.pc_relevant_paycolumn_v2%26utm_relevant_index%3D2)  
[pointer being freed was not allocated](https://links.jianshu.com/go?to=https%3A%2F%2Fblog.csdn.net%2Fjiangxf24%2Farticle%2Fdetails%2F84044308)

最后编辑于 ：

©著作权归作者所有,转载或内容合作请联系作者  
【社区内容提示】社区部分内容疑似由AI辅助生成，浏览时请结合常识与多方信息审慎甄别。  
平台声明：文章内容（如有图片或视频亦包括在内）由作者上传并发布，文章内容仅代表作者本人观点，简书系信息发布平台，仅提供信息存储服务。