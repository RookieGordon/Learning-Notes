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
CPU端播放大量的动画是一个非常巨大的消耗，究其原因在于，无法使用常规的性能优化手段（[[关于静态批处理动态批处理GPU Instancing SRP Batcher的详细剖析|静态合批，动态合批]]）来进行优化，因为`因此蒙皮网格是不能合批的。反过来说，计算骨骼动画实际也就是在计算蒙皮网格各顶点的位置。`
动画烘焙分为顶点烘焙和骨骼烘焙，顶点烘焙相对简单，但是烘焙出来的纹理贴图尺寸很大，骨骼烘焙就相对复杂，但是资源量比较小。
## 烘焙顶点

## 烘焙骨骼



