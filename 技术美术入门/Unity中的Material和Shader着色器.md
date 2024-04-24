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

- 有光泽的金属具有`高镜面反射设置`和`高平滑度`设置。有光泽的非金属具有`低镜面反射`设置和`高平滑度`设置。
- Smoothness 聚焦镜面反射，Specular Map 控制镜面反射的量和颜色。
- 高光贴图可以使用 RGB 颜色。

![[（图解5）高光工作流参数.png|450]]
高光工作流中，Specular Map参数后面可以调节镜面反射程度和颜色

### 使用金属工作流程设置表面质感

Specular 工作流程是两者中更科学的。Metallic 工作流程更简单，但并不严格遵循物理光的规则。

在金属工作流程中，遵循以下设置原则：

- 闪亮的金属具有`高金属`设置和`高平滑度`设置。 闪亮的非金属具有`零或低金属`值和`高平滑度`值。
- 平滑度控制镜面反射的焦点。
- `金属贴图仅使用灰度`。

![[（图解2）金属工作流的参数.png|410]]
在金属工作流中，Metallic Map对应的数值，就是金属程度（或者，镜面反射度。因为在光滑度不变下，金属度越高，反射越高）

![[（图解3）平滑度都为1的高光（左）和金属（右）对比.png|580]]
通过对比，可以看出来，左边更像镜子，右边更像金属。

### Unity 中物体表面设置效果比对图

金属设置参考图表

![|440](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/StandardShaderCalibrationChartMetallic.png)

高光设置的参考图表

![|420](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/StandardShaderCalibrationChartSpecular.png)

### URP Shader/lit Material surface Options

#### Surface Type 表面类型

使用此下拉菜单将不透明或透明表面类型应用于材质。这决定了 URP 在哪个渲染过程中渲染材质。

1. Opaque 不透明：不透明表面类型始终是完全可见的，无论它们背后是什么。URP 首先渲染不透明材质。
2. Transparent 透明：透明表面类型受其背景影响，它们会根据您选择的透明表面类型而有所不同。URP 在不透明对象之后在单独的通道中渲染透明材质

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/BlendingMode.png)

#### Blending Mode 混合模式

只有 Surface Type 选择 Transparent 后，才会出现此属性选项

使用此下拉菜单来确定 URP 如何通过将材质与背景像素混合来计算透明材质的每个像素的颜色。

1. Alpha：使用材质的 alpha 值来更改对象的透明度。0 是完全透明的。1 看起来完全不透明，但在透明渲染过程中仍会渲染材质。用于可见但也会随着时间的推移而消失的视觉效果非常有用，例如云。
2. Premultiply 自左乘：将与 Alpha 类似的效果应用于材质，但`保留反射和高光`，即使您的表面是透明的。这意味着只有反射光是可见的。例如，透明玻璃。
3. additive 叠加：在另一个表面的顶部为材质添加一个额外的层。这对全息图有好处。
4. Multiply 乘法：将材质的颜色与表面后面的颜色相乘。这会产生更暗的效果，就像你透过彩色玻璃看一样。