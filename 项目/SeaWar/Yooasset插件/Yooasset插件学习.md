---
tags: SeaWar/Yooasset插件/Yooasset插件学习 mytodo
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/Yooasset插件
dateStart: 2025-08-11
dateFinish: 2025-08-11
finished: false
displayIcon: pixel-banner-images/项目任务.png

---
# 资源收集策略
以下打包，以`ScriptableBuildPipeline`管线为例。
```cardlink
url: https://blog.csdn.net/m0_57771536/article/details/148870712
title: "Unity Scriptable Build Pipeline (SBP) 详解_unity sbp-CSDN博客"
description: "文章浏览阅读851次，点赞24次，收藏12次。Unity 的可编程构建管线（Scriptable Build Pipeline, SBP）标志着引擎构建架构的一次关键转变，它从不透明的 C++ 实现转向了灵活、可扩展的 C# 框架。SBP 旨在满足现代游戏开发日益增长的需求，通过改进增量处理和高效缓存机制显著提升了构建性能。它赋予开发者对内容构建过程前所未有的控制力，从而能够针对特定项目需求进行深度定制。尽管 SBP 是 Unity 推荐的 Addressables 系统的重要基础层，但理解其核心组件、构建流程和高级功能对于优化大型项目、简化 CI/C_unity sbp"
host: blog.csdn.net
```

## 打包参数`ScriptableBuildParameters`
`ScriptableBuildParameters`重点关注的参数是压缩选项`CompressOption`，主要是`LZMA`和`LZ4`两个压缩选项的区别




