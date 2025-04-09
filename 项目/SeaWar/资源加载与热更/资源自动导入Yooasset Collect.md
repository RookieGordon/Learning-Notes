---
tags:
  - SeaWar/资源加载与热更/资源自动导入Yooasset
  - Collect
  - mytodo
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/资源加载与热更
dateStart: 2025-04-08
dateFinish: 2025-04-10
finished: false
displayIcon: pixel-banner-images/项目任务.png
---
# 资源后处理框架
需要实现一套资源导入后的后处理框架，在资源被创建，被删除，被移动后，执行某些操作。那么资源自动收集到YooAsset就可以通过该框架进行实现
## 需求
1. 在Unity的资源发生变更的时（被创建，被删除，被移动，被修改），执行特定的处理逻辑；
2. 不能出现递归处理的情况，例如：资源A在被后处理后，会再次触发`被修改`回调，此时就不应该继续处理，否则就会死循环；




