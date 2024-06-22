---
tags:
  - Unity
  - Android工程
---

# Android相关目录结构
![[（图解5）Android工程目录结构1.png|280]]
## AndroidManifest配置文件

通过Unity导出的Android中，`package`就是unity中设置的包名：
![[（图解4）Android工程中的package.png|410]]

`label`代表App的名字，`icon`代表App的图标：
```XML
<application android:label="@string/app_name" android:icon="@mipmap/app_icon">
	<meta-data android:name="unity.builder"android:value="\1374536239054"/>
</application>
```
`@string/app_name`是一个路径，表示`res/values/strings.xml`文件中的`app_name`字段，`strings.xml`如下：
```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
	<string name="app_name">打包</string>
	<string name="game_view_content_description">Game view</string>
</resources>
```

`@mipmap/app_icon`表示`res/mipmap/app_icon`文件夹下的图标

### 权限

```XML
<uses-permission android:name="android.permission.ACCESS NETWORK STATE"/>
<uses-permission android:name="android.permission.INTERNET"/>
```
默认两条是网络权限

# Unity相关目录结构
![[（图解6）Android工程目录结构2.png|370]]

## Unity的AndroidManifest配置文件

![[Pasted image 20240622181515.png]]


```X
```
