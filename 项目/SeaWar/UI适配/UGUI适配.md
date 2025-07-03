---
tags:
  - SeaWar/UI适配/UGUI适配
  - mytodo
type: Project
project: SeaWar
projectType: Task
fileDirPath: 项目/SeaWar/UI适配
dateStart: 2025-07-03
dateFinish: 2025-07-05
finished: false
displayIcon: pixel-banner-images/项目任务.png
---
# CanvasScaler组件
## 三种UI缩放模式

### Constant Pixel Size
![[（图解1）Constant Pixel Size缩放模式.png|590]]
不根据屏幕分辨率调整 Canvas 的缩放，以 UI 元素的 像素值 × Scale Factor 对应真实屏幕的像素点进行渲染。当 Scale Factor 为 1 时，屏幕上显示为 UI 元素的给定像素大小。

**_Scale Factor_** 画布的缩放比例。默认况下为 1，表示正常大小。

_**Reference Pixels Per Unit**_ 每个 UI 单位代表的像素量。 官方的解释是”如果  sprite（精灵，下同） 具有 **Pixels Per Unit** 设置，则 sprite 中的一个像素将覆盖 UI 中的一个单位”，个人理解这个值是用来覆盖 sprite 导入设置中的 **Pixels Per Unit** 值，即决定每个 UI 单位应包含多少像素。
### Scale With Screen Size
![[（图解2）Scale With Screen Size模式.png|580]]
**Scale With Screen Size** 表示根据真实屏幕的宽高来缩放 Canvas。**Reference Resolution** 是游戏的设计分辨率。**Screen Match Mode** 有三种模式
1. **Match Width or Height** 根据真实屏幕的宽高比按指定的 **Match** 值来缩放 Canvas。  **Match**决定 Canvas 按宽高缩放的[权重值，当 **Match = 0** 时，按宽度进行 Canvas 等比缩放；当 **Match = 1** 时，按高度度进行 Canvas 等比缩放。一般情况下这个值非 0 即 1，不用纠结中间值
2. **Expand** 在屏幕大小上**内接**画布。以 Canvas 小于 屏幕 为例，放大画布直至宽或高有一边与屏幕重合停止。此模式下为 **Canvas 全部显示在屏幕中** 的前提下 Canvas 的最大缩放值
3. **Shrink** 在屏幕大小上 **外切** 画布。以 Canvas 小于 屏幕 为例，放大画布直至宽或高最后一边与屏幕重合停止。此模式下为 **Canvas 被裁切，不能完全显示在屏幕中**

