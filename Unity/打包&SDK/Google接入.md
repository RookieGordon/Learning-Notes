---
tags:
  - Unity
  - Google平台
---

```cardlink
url: https://blog.csdn.net/weixin_41733225/article/details/130991637
title: "Google Play上架aab保姆级教程（纯aab上架/已上架apk转aab上架）_google上架怎么用自己的签名文件-CSDN博客"
description: "文章浏览阅读1.2w次，点赞44次，收藏60次。本文主要介绍了aab上架Google Play的流程，包含纯aab上架和已上架apk转aab上架操作流程介绍_google上架怎么用自己的签名文件"
host: blog.csdn.net
```

# AAB签名、密钥
上传google play的应用必须以aab格式，aab的签名流程要比之前apk的复杂一些。需要上传密钥和应用签名密钥两个密钥。
上传密钥和签名密钥都可以使用Android Studio来生成
## 上传密钥
![[Pasted image 20241124110349.png|350]]
![[Pasted image 20241124110409.png|350]]
上传密钥，后缀名是`.jks`
## 应用签名
应用签名密钥生成步骤和上传密钥一致，不过后缀名是`.keystore`。
要使用该密钥给应用签名的话，可以通过Android Studio手动出AAB签名。
![[Pasted image 20241124111358.png|420]]
![[Pasted image 20241124111428.png|400]]
因为是Untiy导出的Android工程，因此也可以在Unity中配置应用签名密钥
![[Pasted image 20241124111702.png|410]]
或者通过代码设置
```CSharp
PlayerSettings.Android.useCustomKeystore = true;  
PlayerSettings.Android.keystoreName = Path.Combine(BuildDefine.BuildToolDir, "AppKey/app_signing_key.keystore");  
PlayerSettings.Android.keystorePass = "q1.com.123";  
PlayerSettings.Android.keyaliasName = "key0";  
PlayerSettings.Android.keyaliasPass = "q1.com.123";  
```
这样，导出的工程里面，
# Google内购

```cardlink
url: https://www.cnblogs.com/fnlingnzb-learner/p/16385685.html
title: "教你接入Google谷歌支付V3版本，图文讲解（Android、Unity） - Boblim - 博客园"
description: "转自：https://blog.csdn.net/linxinfa/article/details/115916000 一、前言 项目要出海，需要接入Google支付，今天就来说说如何接入Google支付吧。 要接入Google支付，需要先在Google Console上注册一个账号并申请一个应用，"
host: www.cnblogs.com
```

