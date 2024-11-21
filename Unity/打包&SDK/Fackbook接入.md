---
tags:
  - Unity
  - Facebook
---

```cardlink
url: https://blog.csdn.net/qq_46179975/article/details/135983463
title: "6000字保姆级大白话教你Unity接入FaceBook SDK_unity6000-CSDN博客"
description: "文章浏览阅读3k次，点赞24次，收藏27次。最近博主也是开始找大四实习了，由于工作需要，需要接海外的sdk，例如、、等等，由于以前在校都是所作的项目都是跟打交道，以至于接入这些sdk这块造成了挺久的困惑，所以在这里先记录一下Unity如何接的sdk。_unity6000"
host: blog.csdn.net
```

# 配置Facebook登陆
配置Facebook登录在Android后台需要提供密钥散列、软件包名称和类名

```cardlink
url: https://blog.csdn.net/wuyutaoktm/article/details/120657464
title: "android接入facebook登陆_密钥散列和类名-CSDN博客"
description: "文章浏览阅读1.1k次。配置Facebook登录在Android后台需要提供密钥散列、软件包名称和类名。密钥散列可通过代码运行或命令行获取，两者结果相同。本文介绍了两种获取方法，并提供了Gradle.properties中签名信息的示例。确保正确配置这些信息以避免重复设置带来的困扰。"
host: blog.csdn.net
```

```cardlink
url: https://www.cnblogs.com/Yellow0-0River/p/14986121.html
title: "生成facebook所需的android密钥散列 - JohnRey - 博客园"
description: "android接入facebook sdk，网页版登录成功，app登录失败，多半是对应应用的facebook后台需要更新散列密钥 在windows下，我所用到的有两种方式获取散列密钥（keytool配置到环境变量中） 执行以下命令，再输入密钥库口令即可生成 keytool -exportcert -"
host: www.cnblogs.com
```

使用Toolkey配合openssl来获取密钥散列，命令行格式如下：
`keytool -exportcert -alias release -keystore keystroe路径 | openssl.exe路径 sha1 -binary | openssl.exe路径 base64
`