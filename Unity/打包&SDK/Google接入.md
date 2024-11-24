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
## 上传密钥和应用签名密钥
![[Pasted image 20241124110349.png|350]]
![[Pasted image 20241124110409.png|350]]
上传密钥，后缀名是`.jks`。
应用签名密钥生成步骤和上传密钥一致，不过后缀名是`.keystore`。
## 应用签名
### 使用密钥给应用签名
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
这样，导出的工程里面，build.gradle文件中，就会包含密钥信息，可以直接出AAB或APK。
![[Pasted image 20241124112151.png|540]]
### 验证签名
```cardlink
url: https://blog.csdn.net/qq_39420519/article/details/118554055
title: "Android aab的打包、调试、安装_.aab-CSDN博客"
description: "文章浏览阅读3w次，点赞15次，收藏50次。前言Google Play在今年3月发出了一个 Google Play新政策通知，即在今年8月后新应用必须以 API 级别 30 (Android 11) 为目标平台，并使用 Android App Bundle（aab）发布格式，对于现有应用是不受强制影响的。如果我没记错的话，早在18年Google就已经提出了aab这个东西，那么对于这次提到的Android APP Bundle直接带来的好处也是清晰明了的，我直接给撸过来了：Android App Bundle：Google Play 使用_.aab"
host: blog.csdn.net
```
可以使用以下命令：
`java -jar bundletool-all-1.17.2.jar build-apks --bundle aab包地址 --output apks输出地址 --ks=keystore地址 --ks-pass=pass:密码 --ks-key-alias=密钥别名 --key-pass=pass:别名密码 --mode=universal
注意：
- 需要`bundletool`工具，如果没有，可以前往[官方地址下载]([Releases · google/bundletool](https://github.com/google/bundletool/releases))。
- aab地址和apks地址，前面可能需要加`=`，改为`--bundle=E:/Test/my.aab`，不过如果aab和bundletool放一起，就不用了。
拿到APKS文件后，后缀改成zip解压即可
## 密钥加密
一般需使用加密公钥（`encryption_public_key.pem`）对签名密钥进行加密。加密公钥可以在`Google play console`上面下载。使用以下命令，对密钥进行加密：
`java -jar pepk.jar --keystore=keystore路径 --alias=密钥别名 --output=output.zip --include-cert --rsa-aes-encryption --encryption-key-path=pem公钥路径`
# Google内购

```cardlink
url: https://www.cnblogs.com/fnlingnzb-learner/p/16385685.html
title: "教你接入Google谷歌支付V3版本，图文讲解（Android、Unity） - Boblim - 博客园"
description: "转自：https://blog.csdn.net/linxinfa/article/details/115916000 一、前言 项目要出海，需要接入Google支付，今天就来说说如何接入Google支付吧。 要接入Google支付，需要先在Google Console上注册一个账号并申请一个应用，"
host: www.cnblogs.com
```

