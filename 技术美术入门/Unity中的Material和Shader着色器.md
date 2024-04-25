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

## URP Shader/lit Material surface Options

### Surface Type 表面类型

使用此下拉菜单将不透明或透明表面类型应用于材质。这决定了 URP 在哪个渲染过程中渲染材质。

1. Opaque 不透明：不透明表面类型始终是完全可见的，无论它们背后是什么。URP 首先渲染不透明材质。
2. Transparent 透明：透明表面类型受其背景影响，它们会根据您选择的透明表面类型而有所不同。URP 在不透明对象之后在单独的通道中渲染透明材质

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/BlendingMode.png)

### Blending Mode 混合模式

只有 Surface Type 选择 Transparent 后，才会出现此属性选项

使用此下拉菜单来确定 URP 如何通过将材质与背景像素混合来计算透明材质的每个像素的颜色。

1. Alpha：使用材质的 alpha 值来更改对象的透明度。0 是完全透明的。1 看起来完全不透明，但在透明渲染过程中仍会渲染材质。用于可见但也会随着时间的推移而消失的视觉效果非常有用，例如云。
2. Premultiply 自左乘：将与 Alpha 类似的效果应用于材质，但`保留反射和高光`，即使您的表面是透明的。这意味着只有反射光是可见的。例如，透明玻璃。
3. additive 叠加：在另一个表面的顶部为材质添加一个额外的层。这对全息图有好处。
4. Multiply 乘法：将材质的颜色与表面后面的颜色相乘。这会产生更暗的效果，就像你透过彩色玻璃看一样。

## Diffuse reflectivity 漫反射率

### 漫反射率 Diffuse reflectivity = 漫反射光 / 入射光

漫反射的光除以射到物体表面的可见光得出的比例。

### albedo 反照率 = 反射光 / 入射光

反射光 = 镜面反射光 + 漫反射光

所以，一般来说，除了在一些特殊的理想表面（完全漫反射，没有镜面反射），albedo 大于且包含 Diffuse reflectivity

## URP Shader/lit Material surface Inputs

### Base Map（基础贴图、基础映射、漫反射贴图）

前面说过，漫反射光决定了物体的颜色。所以，在 Unity 的 URP/Lit Shader 中，使用 Base Map 来设定 漫反射率，即物体表面的颜色或贴图用纹理。

### Metallic / Specular Map 金属/高光 贴图

- Metallic Map（Metallic 工作流模式选项）
    使用滑块控制表面的金属感。1 是全金属的，如银或铜，0 是全电介质，如塑料或木材。对于脏污或腐蚀的金属，您通常可以使用介于 0 和 1 之间的值。  
    左侧也可以分配金属感使用的贴图纹理
    
- Specular Map（Specular 工作流模式选项）
    
- Smoothness 平滑度：  
    对于这两种工作流程，您都可以使用“平滑度”滑块来控制表面上高光的分布。0 给出一个宽阔、粗糙的高光。1 提供像玻璃一样的小而锐利的高光。介于两者之间的值会产生半光泽外观。例如，0.5 会产生类似塑料的光泽度。
    
- Source ： 使用 Source 下拉菜单选择着色器从何处`采样平滑度贴图`。
    - Metallic Alpha（来自金属贴图的 Alpha 通道）
    - Albedo Alpha（来自基本贴图的 Alpha 通道）。
    默认值为金属 Alpha。如果所选源具有 Alpha 通道，则着色器对通道进行采样并将每个采样乘以平滑度。

### Normal Map 法线贴图

设置旁边的浮点值是 法线贴图效果的乘数。低值会降低法线贴图的效果。高值会产生更强的效果。 好处是，使用 2D 资源模拟出 3D 表面细节效果，大幅度节省机器性能

### Height Map 高度贴图

URP 实现了视差映射技术，该技术使用高度贴图通过移动可见表面纹理的区域来实现表面级遮挡效果。

它类似于法线映射的概念，但是这种技术更复杂，因此性能也更昂贵。

高度贴图通常与法线贴图一起使用，通常它们用于想给表面定义一个很大的凹凸效果使用。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/heightMap.png)

设置旁边的浮点值是高度图效果的乘数。低值会降低高度贴图的效果。高值会产生更强的效果。

这种效果，它可以产生一个非常令人信服的 3D 几何效果，表面的凹凸效果有些会相互遮挡住，看起来真的像是 3D 几何体，但真实的几何体没有任何修改，因为这仅仅是绘制一个表面的效果。

高度贴图正常应该是张灰度图，白色代表凸起的部分，黑色代表凹下的部分。下面就是 Albedo 贴图和高度贴图的匹配使用。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/albedo_wall.JPEG)

下图从左向右说明：

1. 岩石墙材质只设置了 Albedo 贴图，没有设置法线贴图和高度贴图。
2. 设置了法线贴图。修改了表面的光照，但岩石间没有相互遮挡效果。
3. 这个精致的效果是使用了法线贴图和高度贴图。岩石看起来就像是从表面凸起来似的，靠近相机的岩石看起来可以遮挡着后面的岩石。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/heightmapWall.JPEG)

### Occlusion Map 遮挡贴图

遮挡贴图用于模拟来自环境光和反射的阴影，这使得照明看起来更逼真，因为更少的光到达物体的角落和缝隙

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/OcclusionMap.png)

用于提升模型间接光影效果。间接光源可能来自 Ambient Lighting（环境光），因此模型中凹凸很明显的凹下去那部分，如裂缝或褶皱，实际上不会接收到太多的间接光。

一张遮挡贴图应该就是张灰度图，白色代表应该接收到的间接光效果会多一些，黑色代表少一些（全黑说明一点间接光都不接收）。

生成遮挡纹理稍微更复杂一些。例如，在场景中有个角色戴了一帽子，在帽子和角色的头之间会有些边缘是几乎接收不到间接光的。在这种情况，这种遮挡贴图通常是由美术同学使用 3D 软件根据模型自动生成的。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/ao.JPEG)

遮挡贴图定义了角色的头戴的披肩附近的部分，哪些相对 Ambient lighting（环境光）是曝光，哪些是挡光的。如下图显示。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/occlusionMap.JPEG)

在应用遮挡贴图前后的效果图（左边没使用，右边使用了）。部分模型的区域被遮挡了，特别是在脖子周围的头戴饰品遮挡的那部分，左边的图片显示太亮了，右边的图片设置了环境光遮挡贴图后的效果，脖子那些绿色的、来自环境草木的环境光就没那么亮了。

### [](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/blob/main/%E5%9B%BE%E5%BD%A2-%E6%8A%80%E6%9C%AF%E7%BE%8E%E5%B7%A5%E7%9B%B8%E5%85%B3/05-URP%20Material%20surface%20%E6%9D%90%E8%B4%A8%E8%A1%A8%E9%9D%A2%E8%AE%BE%E7%BD%AE.md#56-emssion-%E6%95%A3%E5%8F%91%E5%85%89)5.6 Emssion 散发（光）

使表面看起来像是在发光。启用后， 会出现 Emission Map 和 Emission Color 设置。

- Emission Map 发光贴图
- Emission Color 发光颜色

属性设置：

1. Color : 指定发光的颜色和强度。单击 Color 框可打开 HDR Color 拾色器。在此处可以更改光照的颜色和发光的强度 (Intensity)。要指定材质的哪些区域发光，可以向该属性分配一个发光贴图。如果您执行此操作，Unity 会使用贴图的全色值来控制发光颜色和亮度。还可以使用 HDR 拾色器对贴图着色和改变发光强度。
2. Global Illumination : 指定此材质发出的光如何影响附近其他游戏对象的环境光照。有三个选项：
    - Realtime：Unity 将此材质的自发光添加到场景的 Realtime Global Illumination（实时全局光照）计算中。这意味着此自发光会影响附近游戏对象（包括正在移动的游戏对象）的光照。
    - Baked：Unity 将此材质的自发光烘焙到场景的静态全局光照中。此材质会影响附近静态游戏对象的光照，但不会影响动态游戏对象的光照。但是，光照探针仍然会影响动态游戏对象的光照。
    - None：此材质的自发光不会影响场景中的实时光照贴图、烘焙光照贴图或光照探针。此自发光不会照亮或影响其他游戏对象。材质本身具有发光颜色。

发光贴图示例：

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/StandardShaderEmissiveMaterialInspector.png)

上图，左：计算机终端的发光贴图。此处有两个发光屏幕以及键盘上的发光按键。右：使用发光贴图的发光材质。该材质同时具有发光和非发光区域。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/StandardShaderEmissiveInLightAndShadow.jpg)

在上图中，存在高亮度和低亮度的区域，并有阴影投射在发光区域上，这充分表现了发光材质在不同光照条件下的显示效果。

![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/StandardShaderEmissiveBakedEffect.jpg)

上图中可以看出，计算机终端发光贴图中的烘焙发光值会照亮此黑暗场景中的周围区域