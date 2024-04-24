---
tags:
  - Unity
  - URP
  - Shader
---
# Universal Render Pipeline 中的着色器分类：

- 2D > Sprite-Lit-Default ：专为 2D 项目设计，此着色器仅适用于平面对象，并将任何 3D 对象渲染为 2D。作为光照着色器，它将根据场景中到达对象的光线进行渲染。
- Particles > Lit、Simple Lit 和 Unlit：这些着色器用于视觉效果 (VFX)
- Terrain > Lit：此着色器针对 Unity 中的 Terrain 工具进行了优化
- Baked Lit 烘焙光照：此着色器会自动应用于光照贴图
- 复杂光照 Complex Lit、光照 Lit 和简单光照 Simple Lit：这些都是通用的、基于物理的光照着色器的变体。
- Unlit：如上所述，不使用灯光的着色器。