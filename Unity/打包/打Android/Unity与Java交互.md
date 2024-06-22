---
tags:
  - Unity
  - 打Android包
---
# C#与Java交互

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

