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

```C#
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
```C#
UnitySendMessage("GameObjectName1", "MethodName1", "Message to send");
```
参数1为绑定了脚本的GameObject名字。