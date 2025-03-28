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
因此，对于动画的性能优化，最优的方式就是选择`GPU Instaning`来做，具体的方式就是将顶点或者骨骼数据记录下来，然后将数据传递给`Compute Shader`，
动画烘焙分为顶点烘焙和骨骼烘焙，顶点烘焙相对简单，但是烘焙出来的纹理贴图尺寸很大，骨骼烘焙就相对复杂，但是资源量比较小。
## 烘焙顶点

## 烘焙骨骼



