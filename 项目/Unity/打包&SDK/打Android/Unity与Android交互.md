---
tags:
  - Unity
  - 打Android包
---

```cardlink
url: https://www.bilibili.com/video/BV1V5411Y7VR?p=1&vd_source=b6adab4df1ba9fd0ec4afd2bda0940e9
title: "Unity和Android通信（一）_哔哩哔哩_bilibili"
description: "Unity和Android通信（一）是Unity和Android通信的第1集视频，该合集共计3集，视频收藏或关注UP主，及时了解更多相关视频内容。"
host: www.bilibili.com
image: https://i2.hdslb.com/bfs/archive/649ea21265c40711710d75be389b06c4d5ee758f.jpg@100w_100h_1c.png
```

```cardlink
url: https://www.bilibili.com/video/BV1Qt4y1a7aW?p=1&vd_source=b6adab4df1ba9fd0ec4afd2bda0940e9
title: "01-Android打包方式(1)配置环境_哔哩哔哩_bilibili"
description: "01-Android打包方式(1)配置环境是Unity 与 Android 、IOS (一) 打包与交互的第1集视频，该合集共计16集，视频收藏或关注UP主，及时了解更多相关视频内容。"
host: www.bilibili.com
image: https://i1.hdslb.com/bfs/archive/0e3a9072007a964e03b9d4790fb3a9932e44c1ae.jpg@100w_100h_1c.png
```

# Android项目导出到Unity使用

## 使用继承了UnityPlayerActivity的jar包调用Android功能

### 导入Unity的jar包到Android项目

Android工程调用Unity工程，需要Unity提供相关的库文件。该库文件在Unity Editor的安装目录下：`Editor/Data/PlaybackEngine/AndroidPlayer/Variations/Mono/Release/Classes/classes.jar`。将该库文件放到Android的Lib文件夹中下，然后添加库文件。
![[（图解1）Android添加Unity库文件.png|360]]
添加库文件完成后，将`MainActivity`继承`UnityPlayerActicity`，这样，该类就可以在Untiy中被调用了。

### 将Android项目库导入到Untiy使用

删除项目中的资源文件，同时要将Mainfest文件中的引用也删除掉。因为这些资源文件都会被编译到包里面
![[Pasted image 20240624112817.png|490]]
然后配置一个build gradle，以Android Library形式导出aar文件，同时删除`applicationId`配置：
![[Pasted image 20240624113529.png|480]]
最后，由于项目引用了Unity提供的jar包，为了导入到Unity中后，不引起冲突，该jar包不能被包含到aar包中，将jar包修改成只编译：
![[Pasted image 20240624114006.png|470]]
编译完成的aar包在build文件夹中：
![[Pasted image 20240624114106.png|220]]
解压aar文件，将其中AndroidManifest文件拿出来，和aar一起放入Unity工程：
![[Pasted image 20240624114516.png|510]]

## 直接调用Android库文件

### 创建Android Library

在空白工程中，创建Module
![[（图解9）创建Android Library.png|430]]
创建一个类，用来封装Unity需要调用的方法：
![[Pasted image 20240624112033.png|430]]

### 导出Library给Unity

编译完成的aar文件在Libiray库的build文件夹中：
![[Pasted image 20240624112226.png|270]]
将该aar放入到Untiy中，和上一种方法不同，这次不需要提供Mainfest文件给Unity。

# Unity项目导出到Android工程使用

将Unity用作Android应用中的库  

github地址：  
```cardlink
url: https://github.com/Unity-Technologies/uaal-example
title: "GitHub - Unity-Technologies/uaal-example"
description: "Contribute to Unity-Technologies/uaal-example development by creating an account on GitHub."
host: github.com
favicon: https://github.githubassets.com/favicons/favicon.svg
image: https://opengraph.githubassets.com/9207d041cd0c095ea48e18a2b31f4e4ad1af70b9f2f55bd96bb700668976f55d/Unity-Technologies/uaal-example
```

说明地址：[Fetching Data#lifd](https://forum.unity.com/threads/integration-unity-as-a-library-in-native-android-app-version-2.751712/)

# C#调用Java

Unity提供了`AndroidJavaClass`和`AndroidJavajObject`两个对象来与Java进行交换，前者可以获取一个Java中的类，后者可以获取一个Java对象。

## 获取Java中的静态方法和对象

```Java
package com.example.testunity

public class Test{
	public static String LOG ="LOG";

	public String pame

	public static void SetLOG(String log){
		LOG=log;
		Log.d(LOG, "SetLOG:"+log);
	}
	
	public static String GetLoG(){
		Log.d(LOG, "GetLOG:"+LOG);
		return LOG;
	}
	
	public void SetName(String name){
		this.name name;
		Log.d(LOG, "SetName:"+name);
	}
	
	public String GetName(){
		Log.d(LOG, "GetName:"+name);
		return this.name;
	}
}

```

通过`AndroidJavaClass`获取到类后，就可以通过类来调用静态方法和静态变量。创建`AndroidJavaClass`对象，需要提供包名和类名。

```CSharp
AndroidJavaClass javaClass = new AndroidJavaClass("com.example.testunity.Test");
```

有了javaClass后，就可以通过`Call`，`CallStatic`等方法调用类中的方法。

# Java调用CSharp

Android工程调用Unity工程，需要Unity提供相关的库文件。该库文件在Unity Editor的安装目录下：`Editor/Data/PlaybackEngine/AndroidPlayer/Variations/Mono/Release/Classes/classes.jar`。将该库文件放到Android的Lib文件夹中下，然后添加库文件。
![[（图解1）Android添加Unity库文件.png|360]]
添加完成库文件后，就可以在其中找到Unity相关的方法：
![[（图解2）Unity库文件.png|370]]
在Android工程中，可以通过Unity提供的`UnitySendMessage`方法来调用Unity中的方法：
![[（图解3）Unity Player库文件.png|480]]
```CSharp
UnitySendMessage("GameObjectName1", "MethodName1", "Message to send");
```
参数1为绑定了脚本的GameObject名字。