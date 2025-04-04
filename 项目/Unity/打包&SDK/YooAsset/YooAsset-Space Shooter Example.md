---
tags:
  - Unity
  - YooAsset
---

```cardlink
url: https://www.yooasset.com/
title: "Hello from YooAsset | YooAsset"
description: "Description will go into a meta tag in <head />"
host: www.yooasset.com
favicon: https://www.yooasset.com/img/favicon.ico
image: https://www.yooasset.com/img/docusaurus-social-card.jpg
```

# 快速开始

![[（图解1）SpaceShooter项目结构.png]]
在Boot场景中，将模式改成`EditorSimulateMode`就可以直接运行Example了。

# 整包模式 + 热更新

将Boot场景运行模式改成`HostPlayMode`模式，然后使用YooAsset进行Build，将`CopyBuildinFileOption`选项改成拷贝模式，这样就可以将打出来的bundle文件，直接复制到StreamingAssets文件夹中。
Bundle打完后，直接开始打PC包，在2.2.4-preview版本中，打包的时候，会在Resource目录中，生成一份catlog文件，用于记录复制到本地的Bundle文件。
![[（图解2）YooAsset的Catalog文件.png|440]]
# 热更新

修改一下资源，然后采用增量模式进行Build，将资源复制到CDN中即可。

# 空包 + 热更新
不使用任何`CopyBuildinFileOption`选项，将Bundle打完后，需要将Package的versio文件复制到StreamingAssets文件夹中去，但是不要复制如何bundle资源。
![[（图解3）YooAsset打空包.png|540]]
这样也会生成Catalog文件，但是不会搜集到任何资源。