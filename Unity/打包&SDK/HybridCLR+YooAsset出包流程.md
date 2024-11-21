---
tags:
  - Unity
  - HybridCLR
  - YooAsset
---
# 打包流程整合
通过HybridCLR构建热更工程的dll，将其作为一个原生资源，使用YooAsset连同其他资源一起构建AssetBundle。
## Runtime流程
运行时，先启动游戏入口，初始化YooAsset，通过YooAsset更新热更工程代码，启动热更工程，进入游戏业务逻辑。
### 初始化YooAsset
初始化流程可以参考官方射击游戏示例：
```cardlink
url: https://github.com/tuyoogame/YooAsset/blob/dev/Assets/YooAsset/Samples~/Space%20Shooter/GameScript/Runtime/PatchLogic/PatchOperation.cs
title: "YooAsset/Assets/YooAsset/Samples~/Space Shooter/GameScript/Runtime/PatchLogic/PatchOperation.cs at dev · tuyoogame/YooAsset"
description: "unity3d resources management  system. Contribute to tuyoogame/YooAsset development by creating an account on GitHub."
host: github.com
favicon: https://github.githubassets.com/favicons/favicon.svg
image: https://opengraph.githubassets.com/790768f9aa21f98c5db27121a0a0c08ac4c68f2de8d866baad17fb4a9a836127/tuyoogame/YooAsset
```
### 下载热更代码
