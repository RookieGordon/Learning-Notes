---
link: https://zhuanlan.zhihu.com/p/337121368
site: 知乎专栏
excerpt: 200+篇教程总入口，欢迎收藏：放牛的星星：[教程汇总+持续更新]Unity从入门到入坟——收藏这一篇就够了本章主要内容：
  1、烘焙静态的全局光照 2、采样光贴图、探针和LPPVs。 3、创建元通道（meta pass） 4、支持自…
tags:
  - slurp/Unity（游戏引擎）
  - slurp/全局光照
  - slurp/CatLike
slurped: 2024-05-21T10:12:46.165Z
title: Unity通用渲染管线（URP）系列（五）——烘焙光（Baked Light）
---

![](https://pic4.zhimg.com/v2-dd6a9dd1a3d0fdb9892814787726504b_b.jpg)

**200+篇教程总入口，欢迎收藏：**

> 本章主要内容：  
> 1、烘焙静态的全局光照  
> 2、采样光贴图、探针和LPPVs。  
> 3、创建元通道（meta pass）  
> 4、支持自发光表面

这是自定义可编程管线的的第五篇。主要讲解如何把静态光烘焙到贴图和探针里。

> 本教程是CatLikeCoding系列的一部分，原文地址见文章底部。

这篇教程使用Unity Unity 2019.2.18f1.

![](https://pic3.zhimg.com/v2-75db7a65959f02c74f45032396f597be_b.jpg)

光照场景，单个混合光和一些自发光物体

**1、烘焙静态光**

在这一节前面，我们已经能够在渲染的时候计算出所有的光照信息了，但这不是必选项。光照信息同样可以提前计算然后存储在一张光照贴图和探针里。之所以这么做有两个主要原因：减少实时光的计算数量，以及添加运行时所不能支持的间接照明。后者还是我们所熟知的全局照明的一个部分：光线并不是从光源直接照射过来，而是通过环境或者一些发光表面反射而来。

下面所要介绍的静态光的含义是指不会在运行时发生改变的光源。因为它也需要被存储起来，所以会增加构建的包体大小和运行时的内存使用。

> 实时的全局光照是什么样的？  
> Unity使用Enlighten系统进行实时全局照明，但是已经过时了，因此我们将不再使用它。除此之外，还可以在运行时渲染反射探针以创建镜面环境反射，但是在本教程中我们不介绍它们。

**1.1 场景光照设置**

全局光照是逐场景配置的，打开Lighting window，切换到Scene页签即可查看。在Mixed Lighting选项下，勾选 Baked Global Illumination 按钮就可以启动烘焙光照功能。还有一个“Lighting Mode”选项，我们把它设置为“Baked Indirect”，这意味着我们将烘焙所有静态的间接光照。

如果你的项目是在Unity 2019.2或更早版本中创建的，那么你还将看到一个启用realtime lighting的选项，需要将其禁用。如果你的项目是在Unity 2019.3或更高版本中创建的，则不会显示该选项。

![](https://pic3.zhimg.com/v2-60a67d796928f8dca1348fb1018a493e_b.jpg)

只烘焙间接光

下面的截图是光照贴图的常规设置，主要用来控制光照贴图的生成，Unity已经给我们填好了默认参数。后面的生成过程除了把LightMap Resolution 减少到20、禁用Compress Lightmaps以及Directional Mode 设置为 Non-Directional 之外，其他都保持默认设置。这里lightmapper选择了Progressive CPU。

![](https://pic2.zhimg.com/v2-24cb74a8318d4acfcd2b297c5327f239_b.jpg)

Lightmapping 设置

> Directional mode是干什么的？  
> 它可以烘焙方向性数据，从而可以使法线贴图影响入射的烘焙光。由于我们目前不支持法线贴图，因此没有理由启用它。

**1.2 静态物体**

为了能够演示烘焙光，我创建了一个场景。用绿色的Plane当做地面，然后放一些球和立方体，再在中间放一个大台子，台子只有一面是敞开的，里面是完全没有光的。

![](https://pic2.zhimg.com/v2-a4a14dd87ac238550c231a97a5c07a09_b.jpg)

有盖子的时候

![](https://pic2.zhimg.com/v2-a4b009d450a9456cd38e74d2fd63ae49_b.jpg)

没盖子的时候

场景只有一个方向光，并且模式设置为Mixed。这告诉Unity，需要给这盏灯做烘焙。除此之外，它和正常的实时光没有区别。

![](https://pic2.zhimg.com/v2-1bf3208fe6e2577411197e7f96230699_b.jpg)

Mixed-mode 的灯光

在烘焙过程中，我还包括了地平面和所有立方体。它们将成为光线反射的对象，从而成为间接的对象。通过启用它们的MeshRenderer组件上的“Contribute Global Illumination”Toggle按钮就可以了。启用此功能还会自动将其“Receive Global Illumination”模式切换为“Lightmaps”，这意味着到达其表面的间接光也会被烘焙到光照贴图中。你还可以通过从对象的“Static ”下拉列表中启用Contribute GI或使其完全静态来启用此模式。

![](https://pic2.zhimg.com/v2-4d272a96b451c659fc26a29b97e74d51_b.jpg)

开启了 Contribute global illumination

如果Auto Generate的功能是开启的，那么一旦启用了上述配置之后，场景的照明将会再次烘焙。如果没有开启的话，就需要你自己手动点击Generate Lighting按钮。Lightmap设置还会显示在MeshRenderer组件中，这里可以查看包含了该物体的光照贴图的预览。

![](https://pic1.zhimg.com/v2-4058e7583f19a4e1db13ef014f17efd0_b.jpg)

接受直接光照烘焙的贴图

球体不会显示在光照贴图中，因为它们对整体照明几乎没有帮助，因此会被认为是动态的。他们不得不依靠光探针，相关内容将在后面介绍。通过将静态对象的“Receive Global Illumination”模式切换为“Light Probes”，也可以将其从贴图中排除。它们仍然会影响烘焙结果，但不会占用光照贴图中的空间。

**1.3 完全用于烘焙的灯光**

烘焙的灯光大部分为蓝色，这是因为sky box导致的，它代表了环境天空的间接照明。中心建筑物周围的较亮区域是由光源从地面和墙壁反射的间接照明引起的。通过将灯光的“Mode ”设置为“Baked”， 我们还可以将所有照明（直接和间接）烘焙到贴图中。然而，它不再提供实时灯光功能。

![](https://pic4.zhimg.com/v2-92c975f3d014b8d27a9fee2e3a0fe75f_b.jpg)

![](https://pic2.zhimg.com/v2-db3d6cf1533aa7342c63355d5ac0ef7d_b.jpg)

没有实时光的效果

实际上，烘焙后的直接光也会被当做间接光，因此会出现在贴图上，从而使贴图显得更亮。

![](https://pic1.zhimg.com/v2-ca1ef8f7d665b468ab0e2ecda39f85e4_b.jpg)

**2 采样烘焙灯光**

现在全世界一片漆黑。这是因为场景里没有实时光，并且我们的Shader现在还不知道发生了什么事情。我们需要对光照贴图进行采样，让Shader完成它的工作。

**2.1 全局光照**

创建一个新的ShaderLibrary/GI.hlsl文件来包含所有和全局光照相关的代码。再这里定义一个GI的数据结果，一个GetGI的函数来返回它，同时传递进来一个光照贴图的UV的参数。因为间接光来自四面八方，所有只能用于漫反射，而不能用于镜面反射。因此，给GI结构一个diffuse color的属性。初始化的时候，用光照贴图的UV填充它，以便进行调试。

![](https://pic4.zhimg.com/v2-b39114cf5f3b1a8f4f637de363f4d2df_b.jpg)

> 镜面的全局照明怎么办？  
> 镜面反射通常是通过反射探针提供的，我们将在以后的教程中介绍。屏幕空间反射（Screen-space）是另一种方式。

在计算实时照明之前，将GI参数添加到GetLighting并使用它初始化颜色值。此时，我们不将其与表面的漫反射率相乘，以便可以看到未修改的接收光。

![](https://pic2.zhimg.com/v2-17bad955a7f49dbb3029df633daf973d_b.jpg)

在LitPass中在Lighting 之前添加GI。

![](https://pic1.zhimg.com/v2-ec03f105c3e09f7ae0a0ce8056611fd0_b.jpg)

获取最初在UV坐标为零的LitPassFragment中的全局照明数据，并将其传递给GetLighting。

![](https://pic4.zhimg.com/v2-2261f2be02a0454aaceab322a20a99bf_b.jpg)

**2.2 光照贴图的坐标**

要得到光照贴图的UV坐标，就必须由Unity将其发送到着色器。我们需要告诉管线对每个被烘焙了灯光信息的对象执行此操作。通过将CameraRenderer.DrawVisibleGeometry中的图形设置的每对象数据属性设置为PerObjectData.Lightmaps来完成的。

![](https://pic3.zhimg.com/v2-c56d65be8fa3ff44063482c05921805e_b.jpg)

现在，Unity将使用具有LIGHTMAP_ON关键字的着色器变体来渲染光照对象。因此，需要将一个多编译指令添加到我们的Lit着色器的CustomLit传递中。

![](https://pic4.zhimg.com/v2-91dad055e0eccda7c3468f45609feb87_b.jpg)

光照贴图的UV坐标是“Attributes`”顶点数据的一部分。我们需要将它们转移到Varyings里，以便可以在LitPassFragment中使用它们。但是，应在只在我们需要的时候才执行此操作。可以使用类似于传递实例标识符的方法，并依赖GI_ATTRIBUTE_DATA，GI_VARYINGS_DATA和TRANSFER_GI_DATA宏。

![](https://pic2.zhimg.com/v2-c171f3988c4f2ba0d6ea7dfcd4217c29_b.jpg)

再加上另一个GI_FRAGMENT_DATA宏来检索GetGI的必要参数。

![](https://pic2.zhimg.com/v2-a4df77d03b5dc61ff2a7d91a35e05799_b.jpg)

这些宏需要在GI中自行定义。最初将他们都定义为空，除了GI_FRAGMENT_DATA设置为零。宏的参数列表的工作方式与函数的相似，不同之处在于宏名称和参数列表之间没有类型且不允许有空格，否则，该列表将被解释为宏定义的内容。

![](https://pic4.zhimg.com/v2-4576498321c0df93d8dde21cdfdc3caf_b.jpg)

定义LIGHTMAP_ON时，宏应该被替换，现在拷贝并修改它们，如下。光照贴图UV是通过第二个纹理坐标通道提供的，因此我们需要在Attributes中使用TEXCOORD1语义。

![](https://pic2.zhimg.com/v2-aaadaf75585535bff0dfa1c3520bf9d9_b.jpg)

![](https://pic1.zhimg.com/v2-39ae1f04898b48400895fb721133363c_b.jpg)

光照贴图的坐标

现在所有的静态烘焙物体已经可以显示他们的UV了，但是所有的动态物体仍然是黑色的。

**2.3 变换光照贴图的坐标**

光照贴图坐标通常是由Unity自动为每个网格生成的，或者是外部导入的网格数据的一部分。他们定义了一个纹理展开来使网格变平，使其映射到纹理坐标。展开图将按比例缩放并放置在光照贴图中的每个对象上，因此每个实例都有自己的空间。就像缩放和平移应用于base UV一样。我们也必须将其应用于光照贴图UV。

光照贴图的UV转换作为UnityPerDraw缓冲区的一部分传递到GPU，因此需要在其中添加。我们称之为unity_LightmapST。即使已弃用，也请在其后添加unityDynamicLightmapST，否则SRP批处理程序的兼容性可能会中断。

![](https://pic2.zhimg.com/v2-443a756cfba71432f1ea5f41feed2b25_b.jpg)

lightmapping可以和GPU Instancing一起用吗？  
是的，所有UnityPerDraw 的数据，instanced 在需要的时候都可以用。

然后调整TRANSFER_GI_DATA宏，以便应用转换。如果每个宏的末尾（但最后一行）都标有反斜杠，则可以将宏定义分成多行。

![](https://pic3.zhimg.com/v2-40bb2226aa6e5c9c2c3019363076f4d2_b.jpg)

![](https://pic2.zhimg.com/v2-e453730a4ca0763d84fac80e8e5fada1_b.jpg)

转换后的 光贴图 坐标

**2.4 采样光照贴图**

GI负责对灯光图进行采样。光照贴图纹理被称为unity_Lightmap，并带有采样器状态。它包含在Core RP Library中的EnityLighting.hlsl里，我们需要使用它来检索灯光数据。

![](https://pic4.zhimg.com/v2-c200b24b863c8cdc471db07d3a43e953_b.jpg)

创建一个SampleLightMap函数，该函数在有光照贴图时调用SampleSingleLightmap，否则返回零。在GetGI中使用它来设置漫射光。

![](https://pic2.zhimg.com/v2-ab270d74c9886a7597fbda574990c049_b.jpg)

SampleSingleLightmap函数需要一些的参数。首先，我们需要将纹理和采样器状态作为前两个参数传递给它，可以使用TEXTURE2D_ARGS宏。

![](https://pic2.zhimg.com/v2-7c656479e5408c4924ca4849357f0fdd_b.jpg)

接下来要处理缩放和转换。因为在早些时候已经处理过它了，所以这里只需要给一个默认的identity 。

![](https://pic2.zhimg.com/v2-c42ace22dd0f15a2cfff3ad251abc8f5_b.jpg)

然后是一个布尔值，表示是否压缩了光照贴图，如果没有定义UNITY_LIGHTMAP_FULL_HDR就是false。最后一个参数是包含解码指令的float4。第一个组件使用LIGHTMAP_HDR_MULTIPLIER，第二个组件使用LIGHTMAP_HDR_EXPONENT。

![](https://pic3.zhimg.com/v2-689770b9d1788fcefa434453f68211da_b.jpg)

![](https://pic4.zhimg.com/v2-5875c7325619c4e7ce26a6f05033c89f_b.jpg)

采样了烘焙灯光之后

**2.5 禁用环境光**

烘焙光现在非常的明亮，因为它还包括来自SkyBox的间接照明。我们可以通过将其强度系数减小为零来禁用它。这样就可以专心的处理单独的定向光。

![](https://pic2.zhimg.com/v2-d58f01c89a1472a0a2b6b89b58c8b041_b.jpg)

![](https://pic4.zhimg.com/v2-6c45b112433ebff3f2cfc1cd290c62e3_b.jpg)

环境光的强度设置为0

注意，平台内部现在已经能够看清一些了，这些基本都来自于间接光。

> 我们还可以烘焙其他类型的光吗？  
> 是的，虽然我们目前只关注定向灯，但其他类型的光源会可以被烘焙，只是在正确烘焙之前需要做一些额外的工作。

**3 光探针**

动态对象不会影响烘焙的全局光，但全局光却可以通过光探针对其进行影响。光探针是场景中的一个点，通过用三阶多项式（特别是L2球谐函数）近似的将所有入射光进行烘焙。光线探测器放置在场景周围，Unity在每个对象之间插值以得出其位置的最终照明近似值。

**3.1 光探针组**

通过GameObject / Light / Light Probe Group创建一个光探针组，将光探针添加到场景中。这会创建一个带有LightProbeGroup组件的游戏对象，该组件默认包含六个立方体形状的探针。启用“Edit Light Probes”后，可以对探针进行移动，或者复制、删除单个探针，就像它们是游戏对象一样。

![](https://pic4.zhimg.com/v2-ad7108cf606eae60e9e8feb7213ddfaf_b.jpg)

在平台结构的内部编辑光探针

一个场景中可以有多个探针组。Unity将所有探针组合在一起，然后创建一个将它们全部连接在一起的四面体体积网格。每个动态对象最终都在一个四面体内部。对其顶点处的四个探针进行插值，以得出应用于对象的最终光照信息。如果物体最终超出了探针覆盖的区域，则使用最近的三角形代替，因此光照可能看起来很奇怪。

默认情况下，选择动态对象时，将使用gizmos 来显示影响对象的探针以及在其位置处的插值结果。你可以通过在“ Lighting”窗口的“ Debug Settings”下调整“ Light Probe Visualization”来更改此设置。

![](https://pic3.zhimg.com/v2-f1902ab76bbe061242b76a807a29c7ba_b.jpg)

![](https://pic2.zhimg.com/v2-fb21be5ac650f6027f8d514cb672dce1_b.jpg)

选择的物体受到的探针影响

放置光探针的位置取决于场景。首先，仅在需要动态对象的地方才需要它们。其次，将它们放置在灯光发生变化的地方。每个探针都是插值的终点，所以最好将它们放在灯光过渡周围。第三，不要将它们放在被烘焙的几何图形里面，因为那样的话，它们最终会变成黑色。最后，插值会穿过对象，因此，如果墙壁相对两侧的光照不同，则将探针靠近墙壁的两侧。这样，就不在墙壁两侧各自插值了。除这些外，还需要大量的效果调试。

![](https://pic3.zhimg.com/v2-f29f106d228b568b0cec40ea7dfe900a_b.jpg)

展示所有的光探针情况

**3.2 采样探针**

插值的光探测器数据需要逐对象的传递给GPU。我们要告诉Unity需要这么干，但这次是通过PerObjectData.LightProbe而不是PerObjectData.Lightmaps。因为可能需要同时启用两个标志，所以将它们与布尔OR运算符结合在一起。

![](https://pic1.zhimg.com/v2-ee2c9e6cfe6991ef1425be770a3f2bd8_b.jpg)

所需的UnityPerDraw数据由七个float4向量组成，分别代表红色，绿色和蓝色光的多项式的分量。它们的名称为unity_SH ，为A，B或C。前两个具有三个版本，后缀为r，g和b。

![](https://pic4.zhimg.com/v2-e0b3b2c78916e0de9ab5dd9fb0f9451b_b.jpg)

我们通过新的SampleLightProbe函数对GI中的光探针进行采样。但它需要一个方向，所以给它一个世界空间的surface参数。

如果此对象正在使用光照贴图，则返回零。否则，返回零和SampleSH9的最大值。该功能需要探针数据和法线向量作为参数。探针数据必须作为系数数组提供。

![](https://pic4.zhimg.com/v2-f0608dfa375d8702fb418e116fc60b1b_b.jpg)

将surface参数添加到GetGI，并将其添加到漫射光中。

![](https://pic1.zhimg.com/v2-b63f7f640f411bf8f730882e7e950838_b.jpg)

最后，在LitPassFragment中将surface传递给它。

![](https://pic2.zhimg.com/v2-f216faeacbb52ad769e9b27f1adb7ba1_b.jpg)

采样光探针

**3.3Light Probe Proxy Volumes（LPPVs）**

光源探测器适用于比较小的动态对象，但是由于照明基于单个点，因此不适用于较大的对象。例如，我在场景中添加了两个拉伸的立方体。因为它们的位置在黑暗区域内，所以立方体整个区域都是黑暗的，这显然与光照不匹配。

![](https://pic3.zhimg.com/v2-8a7c8a1b6e2729ef385f8f7a2219b69e_b.jpg)

大型物体从一个位置采样

这时候，我们可以通过使用光探针代理集（简称LPPV）来解决此限制。只需将LightProbeProxyVolume组件添加到每个立方体上，然后将其Light Probes模式设置为Use Proxy Volume。

代理集可以通过多种方式配置。在这种情况下，我使用了自定义分辨率模式将子探针沿着立方体的边缘放置，因此它们是可见的。

![](https://pic3.zhimg.com/v2-4efc72b5bb417e4081147db57f4714be_b.jpg)

![](https://pic4.zhimg.com/v2-b2ad0ccb1631cfaee3753a4332146203_b.jpg)

使用LPPVs

> 为什么我在场景视图里看不到这些探针呢？  
> 当LPPV的刷新模式设置为Automatic时，它们有可能不会显示。你可以将其临时设置为“Every Frame”。

**3.4 采样LPPVs**

LPPV也要求将每个对象的数据发送到GPU。这时，必须启用qiPerObjectData.LightProbeProxyVolume。

![](https://pic3.zhimg.com/v2-b1b79873490e85f1d0d7f33b741e114e_b.jpg)

必须将四个附加值添加到UnityPerDraw：unity_ProbeVolumeParams，unity_ProbeVolumeWorldToObject，unity_ProbeVolumeSizeInv和unity_ProbeVolumeMin。第二个是矩阵，其他是4D向量。

![](https://pic4.zhimg.com/v2-fb25b4c9c24736666d3a808d6e871043_b.jpg)

探针代理集数据以3D float格式的纹理存储，称为unity_ProbeVolumeSH。通过TEXTURE3D_FLOAT宏及其采样器状态将其添加到GI。

![](https://pic3.zhimg.com/v2-04c5ee1e2052001a1604058c8fb54386_b.jpg)

通过unity_ProbeVolumeParams的第一个组件来传达是否使用LPPV或内插光探针。如果已设置，那么我们必须通过SampleProbeVolumeSH4函数对代理集进行采样。将纹理和采样器传递给它，然后传递世界位置和法线。之后是矩阵，分别是unity_ProbeVolumeParams的Y和Z分量，然后是min和size-inv数据的XYZ部分。

![](https://pic2.zhimg.com/v2-8de8c0da69d84f12dbaf26a20de5ede5_b.jpg)

![](https://pic1.zhimg.com/v2-65e65b8bda6a545f3cdf413df14efdbc_b.jpg)

采样 Sampling LPPVs

对LPPV进行采样需要对代理集的空间进行转换，以及其他一些计算，比如：代理集纹理采样以及球谐函数的应用。这时，如果只用L1球谐函数，结果的精确度会较低，但起码会在单个对象的表面上发生变化了。

**4 元通道（meta Pass）**

由于间接漫反射光会从表面反射，因此应该受到这些表面的漫反射率的影响。但目前还没有这个效果。Unity将我们的表面均匀地视为白色了。Unity使用特殊的元通道来确定烘焙时的反射光。由于我们尚未定义此类通道，因此Unity使用默认pass，该pass以白色结尾。

**4.1 统一输入**

添加另一个通道意味着我们需要再次定义着色器属性。让我们从LitPass中提取基本纹理和UnityPerMaterial buff，并将其放入新的Shaders / LitInput.hlsl文件中。我们还将通过引入TransformBaseUV，GetBase，GetCutoff，GetMetallic和GetSmoothness函数来隐藏instancing 代码。给他们每人都配备基本的UV参数，即便它们没有用到。隐藏是否从贴图中检索值。

![](https://pic4.zhimg.com/v2-99a73d5c1f0230d0fd77a429afcc6f1b_b.jpg)

要在所有Lit通道中包含此文件，需要在通道之前在其SubShader块的顶部添加HLSLINCLUDE块。在其中包括Common，然后是LitInput。该代码将在所有pass的开始处插入。

![](https://pic2.zhimg.com/v2-0577f3ff3e1ef9e2dcaf80be3eeaf885_b.jpg)

从LitPass中删除现在重复的include语句和声明。

![](https://pic3.zhimg.com/v2-e57d95833a2745d96459177633da58b2_b.jpg)

在LitPassVertex中使用TransformBaseUV。

![](https://pic4.zhimg.com/v2-0bb20bd66316977ee7a648de015a5833_b.jpg)

以及在LitPassFragment中检索着色器属性的相关函数。

![](https://pic1.zhimg.com/v2-ca7a370d7d2555174caaa8e06ff5add8_b.jpg)

给ShadowCasterPass相同的处理。

**4.2 Unlit**

我们还要对“Unlit”着色器执行此操作。复制LitInput.hlsl并将其重命名为UnlitInput.hlsl。然后从其UnityPerMaterial版本中删除_Metallic和_Smoothness。保留GetMetallic和GetSmoothness函数并使它们返回0.0，表示非常弱的漫反射表面。之后，还为着色器提供一个HLSLINCLUDE块。

![](https://pic1.zhimg.com/v2-8e55839a517e3cb303e9b3eb345e8a08_b.jpg)

就像我们对LitPass所做的那样转换UnlitPass。请注意，即使ShadowCasterPass最终使用不同的输入定义，也可以在两个着色器上正常使用。

**4.3 元灯光模式（Light Mode）**

将LightPass设置为Meta，向Lit和Unlit着色器添加新的传递。此阶段需要始终禁用剔除，可以通过添加“culling ”选项进行配置。它将使用新的MetaPass.hlsl文件中定义的MetaPassVertex和MetaPassFragment函数。同时，它不需要多重编译指令。

![](https://pic3.zhimg.com/v2-478ec0ceb3aeebfe1acea09b1098e596_b.jpg)

我们需要知道表面的漫反射率，因此我们必须在MetaPassFragment中获取其BRDF数据。因此，我们必须包含BRDF，还要加上Surface, Shadows 和Light ，因为BRDF依赖于它们。因为我们只需要知道对象空间位置和基本UV，将剪辑空间位置设置为零即可。可以通过ZERO_INITIALIZE（Surface，surface）将表面初始化为零，然后我们只需设置其颜色，金属和光滑度值即可。这足以获取BRDF数据了，但现在我们将从返回零开始。

![](https://pic2.zhimg.com/v2-7d39229e90ec0803ba2575a7462d2b59_b.jpg)

一旦Unity用我们自己的meta pass重新烘焙了场景，所有的间接照明都将消失，因为黑色表面不会反射任何东西。

![](https://pic1.zhimg.com/v2-9eca5e81ea0d01aa971072ff251c9c00_b.jpg)

失去了间接光

**4.4 光照贴图坐标**

就像在采样光照贴图时一样，我们需要使用光照贴图的UV坐标。不同之处在于，这次我们朝相反的方向前进，将它们用于XY对象空间位置。之后，我们必须将其输入TransformWorldToHClip，即使在这种情况下该函数执行的转换类型与其名称所建议的不同。

![](https://pic1.zhimg.com/v2-a711ba826901680ebf8e7b547a189234_b.jpg)

我们仍然需要对象空间顶点属性作为输入，因为着色器希望它存在。实际上，除非OpenGL显式使用Z坐标，否则它似乎无法工作。我们将使用Unity自己的元通道使用的相同虚拟分配，即input.positionOS.z> 0.0？FLT_MIN：0.0。

![](https://pic4.zhimg.com/v2-7ce7596e7bc426e56c18f786e937f353_b.jpg)

**4.5 漫反射率**

元通道可用于生成不同的数据。通过bool4 unity_MetaFragmentControl标志向量传达请求的内容。

![](https://pic4.zhimg.com/v2-7b3d42f735f323f4961f1bd8bba15f8f_b.jpg)

如果设置了X标志，则要求使用漫反射率，因此使其成为RGB结果。a分量应设置为1。

![](https://pic4.zhimg.com/v2-3e85dab149e79a7291e926e2b537c363_b.jpg)

这足以使反射光着色，但是Unity的meta pass通过增加按粗糙度，比如将镜面反射率减少一半的方法，也可以稍微提升最终结果。其背后的思路是高镜面但粗糙的材质也可以传递通过一些间接光。

![](https://pic3.zhimg.com/v2-dac5b938a72f50ae7489945ff633d7aa_b.jpg)

然后，通过使用PositivePow方法将结果提高到通过unity_OneOverOutputBoost提供的平方，但最终将其限制为unity_MaxOutputValue，来修改结果。

![](https://pic2.zhimg.com/v2-8902edba74429aaed756d72c09a874e5_b.jpg)

这些值以浮点数形式提供。

![](https://pic2.zhimg.com/v2-5e96e29cff78a3b4ba98c6113d7af371_b.jpg)

![](https://pic4.zhimg.com/v2-ac349a25ca67be06876b7e5cc8ea71bf_b.jpg)

彩色的间接光，大部分为地面绿色

现在已经可以从间接光里获取一些正确的颜色了，同样我们可以把表面的漫反射应用上，通过GetLighting函数。

![](https://pic1.zhimg.com/v2-7eeab88b01c6530cd51b6c6208314bcc_b.jpg)

![](https://pic2.zhimg.com/v2-f52931c51574dd48fe1da0a1a396e045_b.jpg)

正确着色的烘焙光

而且，我们还可以通过将强度重新设置为1来再次打开环境照明。

![](https://pic3.zhimg.com/v2-9ad1cfb2ee19d30a7e88c4c455001fa2_b.jpg)

添加了环境光

最后，将灯光的模式设置回“Mixed”。这使得它再次成为实时光，并烘焙了所有间接漫射光。

![](https://pic3.zhimg.com/v2-f3acbed1c2dbbd9338ef98133fea43ba_b.jpg)

**5 自发光表面**

一些表面会发出自己的光，因此即使没有其他灯光也可以看到。只需在LitPassFragment的末尾添加一些颜色即可实现。但这不是真正的光源，因此不会影响其他表面。但是，该效果可能有助于烘焙灯光。

**5.1 辐射光**

向基础着色器添加两个新属性：辐射贴图和颜色，就像基础贴图和颜色一样。但是，我们将对两者使用相同的坐标变换，因此我们不需要为辐射贴图显示单独的控制控件。可以通过为其指定NoScaleOffset属性来隐藏它们。要支持非常明亮的发光，请在颜色上添加HDR属性。这样就可以通过检查器配置亮度大于1的颜色，从而显示HRD颜色弹出窗口，而不是常规的颜色弹出窗口。

例如，我制作了一个不透明的发光材质，该材质使用Default-Particle纹理，该纹理包含圆形渐变，因此会产生一个亮点。

![](https://pic3.zhimg.com/v2-43f74b0a74b56d42937e6b053654066a_b.jpg)

![](https://pic3.zhimg.com/v2-7e1a6646b97370d0f796a31478850696_b.jpg)

emission 设置为白点的材质

将贴图添加到LitInput并将emission color添加到UnityPerMaterial。然后添加一个与GetBase一样工作的GetEmission函数，除了它会使用别的纹理和颜色。

![](https://pic3.zhimg.com/v2-4c4b423e54213e42333a73d81535fc02_b.jpg)

在LitPassFragment末尾将emission添加到最终颜色中。

![](https://pic3.zhimg.com/v2-b8db1b98d5ecd75301f641800aab869a_b.jpg)

还要向UnlitInput添加GetEmission函数。这时，我们其实只需使其成为GetBase的代理即可。因此，如果烘焙不发光的物体，它最终会发出全彩。

![](https://pic1.zhimg.com/v2-4d8cc4c554f3c6b75947fcaefbe5a99c_b.jpg)

为了使不受光的材质也能发出非常明亮的光，我们可以将HDR属性添加到“Unlit”的基础颜色属性中。

![](https://pic1.zhimg.com/v2-3fc5f4d0de439f18b3dc398a5197ba9c_b.jpg)

最后，让我们将emission color添加到PerObjectMaterialProperties。在这种情况下，我们可以通过为配置字段提供ColorUsage属性来允许HDR输入。需要给它传递两个布尔值。第一个指示是否必须显示Alpha通道，我们不需要。第二个指示是否允许HDR值。

![](https://pic4.zhimg.com/v2-ffd2fc2089052bb1558f1b8a4ea3089b_b.jpg)

![](https://pic4.zhimg.com/v2-8050f88caf64fa1b9f740945f2dd0efb_b.jpg)

Per-object的emission 设置为HDR黄色

我们在场景中添加了一些小的发光立方体。我让它们为全局光照做些贡献，并在“Lightmap ”中将它们的Scale 加倍，以避免发出有关重叠UV坐标的警告。当顶点在光照贴图中最终靠得太近时，就会发生这种情况，因此它们必须共享同一纹理像素。

![](https://pic3.zhimg.com/v2-9263daa456c367ade4ec445d18b63832_b.jpg)

发光立方体；没有环境照明

**5.2 烘焙自发光**

自发光 通过单独的通道进行烘焙。当设置了unity_MetaFragmentControl的Y标志时，假定MetaPassFragment返回自发光，再次将A分量设置为1。

![](https://pic3.zhimg.com/v2-2a32fb2766209625cb4082215468b072_b.jpg)

但它不会自动设置，必须逐材质的进行烘焙设定。可以通过在PerObjectMaterialProperties.OnGUI中的编辑器上调用LightmapEmissionProperty来显示此配置选项。

![](https://pic4.zhimg.com/v2-543d27327ff5f48ea6214432bfbde163_b.jpg)

这将显示“Global Illumination”的下拉菜单，该菜单最初设置为“None”。尽管它的名字看起来高级，但其实它仅影响自发光的烘焙。将其更改为“Baked ”告诉灯光映射器给自发光运行单独的通道。还有一个“Realtime ”选项，但实际上已弃用。

![](https://pic2.zhimg.com/v2-e96a2687c546572b33fd8a8759f027d5_b.jpg)

Emission 设置为 baked

到这步之后仍然还不能正常工作，因为Unity会积极尝试避免在烘焙时使用单独的emission通道。如果材质的emission 设置为零的话，还会直接将其忽略。但是，它没有限制单个对象的材质属性。通过更改emission mode，被选定的材质的globalIlluminationFlags属性的默MaterialGlobalIlluminationFlags.EmissiveIsBlack标志，可以覆盖该结果。这意味着你仅应在需要时才启用“Baked ”选项。

![](https://pic2.zhimg.com/v2-3dc455946634a702313036a93a71a5d1_b.jpg)

![](https://pic2.zhimg.com/v2-eb5f39994e5e8f8c1c178f24c68ff9bd_b.jpg)

![](https://pic3.zhimg.com/v2-7d36e15b6ed6a42335be8c514cfafeda_b.jpg)

烘焙了自发光，但是去掉了间接光的效果

**6 烘焙透明度**

也可以烘焙透明物体，但是需要一些额外的设置。

![](https://pic2.zhimg.com/v2-bcd7c9eba91ad3c198c2ad44a728baa5_b.jpg)

半透明的天花板会被视为不透明

**6.1 硬编码属性**

不幸的是，Unity的光照贴图器（烘焙器）对于透明性的处理是硬编码的。它会查看材质的队列以确定它是不透明，裁切还是透明。然后，通过使用_Cutoff属性进行alpha裁剪，将_MainTex和_Color属性的alpha分量相乘来确定透明度。我们的着色器具有第三步但缺少前两个。当前进行这项工作的唯一方法是将期望的属性添加到我们的着色器中，为它们提供HideInInspector属性，这样它们就不会显示在检查器中。Unity的SRP着色器必须处理相同的问题。

![](https://pic1.zhimg.com/v2-08ebf16341159668fab619bb60442138_b.jpg)

**6.2 复制属性**

必须确保_MainTex属性指向与_BaseMap相同的纹理，并使用相同的UV转换。两种颜色属性也必须相同。如果进行了更改，则可以在CustomShaderGUI.OnGUI的末尾调用的新CopyLightMappingProperties方法中执行此操作。如果存在相关属性，请复制其值。

![](https://pic3.zhimg.com/v2-0cd812ecd56aae1ea93941156c1eb72a_b.jpg)

![](https://pic1.zhimg.com/v2-b54401b0572894b7475ae491b8ea2830_b.jpg)

透明现在可以被正确的烘焙了

这也适用于Clip的材质。但由于单独处理透明性，因此不需要在MetaPassFragment中执行片元剪切。

![](https://pic3.zhimg.com/v2-9b818ad3ddbd0b5389d0aa8646f2b6b2_b.jpg)

烘焙 clipping

但不方便的是，这意味着烘焙的透明度只能取决于单一的纹理，颜色和cutoff 属性。同样，光照贴图器仅考虑材质的属性。每个实例的属性都会被忽略。

**7 Mesh球**

最后，我们为Mesh球生成的实例添加对全局照明的支持。由于其实例是在运行模式下生成的，因此无法烘焙它们，但是只需一点改变，它们便可以通过光探测器接收烘焙的照明。

![](https://pic4.zhimg.com/v2-3f09f9a97186ce5a6dc1e6513f0147e3_b.jpg)

mesh ball 在烘焙光线下

**7.1 光探针**

通过调用额外五个参数的DrawMeshInstanced方法来使用光探测器。首先是阴影投射模式，我们要启用它。接下来是实例是否应该投射阴影，这是我们想要效果的。接下来是图层，我们只使用默认的零。然后，提供一个实例可见的摄像机。传递null意味着应该为所有摄像机渲染它们。最后，设置光探针的模式。必须使用LightProbeUsage.CustomProvided，因为没有哪个位置可以用来混合探针。

![](https://pic1.zhimg.com/v2-a096ea59d4e6ccfd77647e484bac74d4_b.jpg)

我们还需要为所有实例手动生成内插值的光探针，并将它们添加到材质属性块中。这意味着在配置块时我们需要访问实例位置。可以通过获取转换矩阵的最后一列来检索它们并将它们存储在一个临时数组中。

![](https://pic2.zhimg.com/v2-c19b5637cd9d2ef9f424afd0c33ebf79_b.jpg)

通过SphericalHarmonicsL2列表提供光探针。通过调用LightProbes.CalculateInterpolatedLightAndOcclusionProbes来填充它，并将位置和光探针数组作为参数。还有一个用于遮挡的第三个参数，我们将使用null。

![](https://pic4.zhimg.com/v2-8ce2365a42160298d30be8f4acc30b4b_b.jpg)

> 这里可以用List吗？  
> 是的，但这样会多一个CalculateInterpolatedLightAndOcclusionProbes变体。我们只需要一次数据，因此在这种情况下List对我们没有好处。

之后，我们可以通过CopySHCoefficientArraysFrom将光探针数据复制到该块。

![](https://pic3.zhimg.com/v2-2efed627993e421222f2c2fbcc0b4152_b.jpg)

![](https://pic4.zhimg.com/v2-de97f70be73c6f9831187cf913ed6e63_b.jpg)

使用光探针

**7.2 LPPV**

另一种方法是使用LPPV。这也是可行的，因为所有实例都存在于狭窄的空间中。这使我们不必计算和存储内插的光探针。此外，只要实例位置保持在体积内，就可以为实例位置设置动画序列，而不必每帧提供新的光探针数据。

添加一个LightProbeProxyVolume配置字段。如果存在，则不要将光探针数据添加到模块中。然后，将LightProbeUsage.UseProxyVolume而不是LightProbeUsage.CustomProvided传递给DrawMeshInstanced。始终将体积作为附加参数提供，即使它为null且未使用。

![](https://pic1.zhimg.com/v2-01141e4b57805fd0a8ac45412831f27c_b.jpg)

你可以将LPPV组件添加到Mesh球或将其放置在其他位置。自定义边界模式可用于定义体积占用的世界空间区域。

![](https://pic4.zhimg.com/v2-88b2afe5ac7824c2eb9a4c1ef792406f_b.jpg)

![](https://pic3.zhimg.com/v2-8fa20944dc42ada3d756ebf6d69c92fa_b.jpg)

使用 LPPV

下一节 介绍阴影遮罩

本文翻译自 Jasper Flick的系列教程

原文地址：