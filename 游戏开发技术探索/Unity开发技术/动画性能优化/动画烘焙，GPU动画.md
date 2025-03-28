---
tags:
  - Unity开发技术/动画性能优化/动画烘焙，GPU动画
  - mytodo
  - 动画烘焙
  - GPU-Animation
  - GPU-Instancing
  - 动画蒙皮
  - 骨骼动画
type: Study
course: Unity开发技术
courseType: Section
fileDirPath: 游戏开发技术探索/Unity开发技术/动画性能优化
dateStart: 2025-03-27
dateFinish: 2025-03-27
finished: false
banner: Study
displayIcon: pixel-banner-images/章节任务.png
---
# 动画烘焙
CPU端播放大量的动画是一个非常巨大的消耗，究其原因在于，无法使用常规的性能优化手段（[[关于静态批处理动态批处理GPU Instancing SRP Batcher的详细剖析|静态合批，动态合批]]）来进行优化，具体原因，参考：[[关于Unity中动画性能优化的问答#Unity中，简单的，低面数的骨骼动画是否可以采用动态合批进行性能优化，比如场景中同时实例化20个相同的模型进行动画播放？]]
因此，对于动画的性能优化，目前三种常规的解决方案：
1. [[关于Unity中动画性能优化的问答#**一、GPU蒙皮与骨骼矩阵传递**|GPU蒙皮+骨骼矩阵]]；

2. [[关于Unity中动画性能优化的问答#**二、预生成动画纹理（Animation Texture）**10|预生成动画纹理]]；
3. [[关于Unity中动画性能优化的问答#**五、ECS + GPU Instancing**|ECS+GPU Instancing]]

## 烘焙顶点

## 烘焙骨骼



