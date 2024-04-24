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

# URP Material surface 材质表面设置

## 镜面反射（Specular reflection）和漫反射（diffuse reflection）

镜面反射和漫反射构成了表面的总反射率。所有反射光要么是镜面的，要么是漫反射的。

### Unity 中实体表面光处理设置原则

Unity 中，影响一个物体表面反射光线的属性设置主要有两个：

1. `Smoothness 光滑度`： 很容易理解，就是描述物体表面光滑程度的计量属性。在 Unity 中通过数值来设定。
2. `specularity 镜面反射度`： 高光不同于平滑度。我们可以把一个红苹果打磨到非常光滑，但它永远不会变成金属。然而，为了有任何镜面反射，一个光滑的物体必须有一些镜面反射。  
    下图中的苹果具有相同的平滑度，但增加了高光度 ![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/CC_Shad_Light3.png.2000x0x1.png) specularity 在 Unity 中并不直接用数值设定，而是使用纹理贴图来设定

所以，必须有 specularity > 0，才能使物体表面产生镜面反射，否则，即使光滑度最高，也只有漫反射

Unity 中，设置物体表面质感，有两种不同的工作流流程：

- 金属模式 Metallic：反射光和入射光颜色相同
- 高光模式 Specular: 可以随意设置反射光的颜色，可以跟入射光色彩不同

![[（图解1）Unity的URP中的金属和高光工作流.jpg|500]]

### 使用高光（镜面反射）工作流程设置表面质感

在 Specular 工作流程中，Specular 设置大于 0 的平滑材质会有一些镜面反射。

在高光工作流程中，遵循以下设置原则：

- 有光泽的金属具有`高镜面反射设置`和`高平滑度`设置。有光泽的非金属具有低镜面反射设置和高平滑度设置。
- Smoothness 聚焦镜面反射，Specular Map 控制镜面反射的量和颜色。
- 高光贴图可以使用 RGB 颜色。

![[（图解5）高光工作流参数.png|450]]
高光工作流中，Specular Map参数后面可以调节高光反射的颜色

### 使用金属工作流程设置表面质感

Specular 工作流程是两者中更科学的。Metallic 工作流程更简单，但并不严格遵循物理光的规则。

在金属工作流程中，遵循以下设置原则：

- 闪亮的金属具有高金属设置和高平滑度设置。 闪亮的非金属具有零或低金属值和高平滑度值。
- 平滑度控制镜面反射的焦点。
- 金属贴图仅使用灰度。

![[（图解2）金属工作流的参数.png|410]]
在金属工作流中，Metallic Map对应的数值，就是镜面反射度

![[（图解3）平滑度都为1的高光（左）和金属（右）对比.png|580]]
