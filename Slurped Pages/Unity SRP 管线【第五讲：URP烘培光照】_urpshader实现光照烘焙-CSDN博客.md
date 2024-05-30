---
link: https://blog.csdn.net/weixin_44518102/article/details/135383085
byline: 成就一亿技术人!
excerpt: 文章浏览阅读1.5k次，点赞24次，收藏24次。本节，我们将跟随数据流向讲解UEP管线中的烘培光照。_urpshader实现光照烘焙
tags:
  - slurp/urpshader实现光照烘焙
slurped: 2024-05-21T10:11:00.520Z
title: Unity SRP 管线【第五讲：URP烘培光照】_urpshader实现光照烘焙-CSDN博客
---

本节，我们将跟随数据流向讲解UEP管线中的烘培光照。  

#### 文章目录

- [一、URP烘培光照](https://blog.csdn.net/weixin_44518102/article/details/135383085#URP_2)
- - [1. 搭建场景](https://blog.csdn.net/weixin_44518102/article/details/135383085#1__3)
    - [2. 烘培光照参数设置](https://blog.csdn.net/weixin_44518102/article/details/135383085#2__9)
    - - [MixedLight光照设置：](https://blog.csdn.net/weixin_44518102/article/details/135383085#MixedLight_25)
        - - [直观感受](https://blog.csdn.net/weixin_44518102/article/details/135383085#_47)
        - [Lightmapping Settings参数设置：](https://blog.csdn.net/weixin_44518102/article/details/135383085#Lightmapping_Settings_74)
    - [3. 我们如何记录次表面光源颜色](https://blog.csdn.net/weixin_44518102/article/details/135383085#3__101)
    - - [首先我们提取出相关URP代码，便于测试](https://blog.csdn.net/weixin_44518102/article/details/135383085#URP_107)
        - [之后进入Shader](https://blog.csdn.net/weixin_44518102/article/details/135383085#Shader_109)
        - - [UnityMetaVertexPosition](https://blog.csdn.net/weixin_44518102/article/details/135383085#UnityMetaVertexPosition_153)
    - [4. 使用光照贴图](https://blog.csdn.net/weixin_44518102/article/details/135383085#4__365)
- [二、光照探针](https://blog.csdn.net/weixin_44518102/article/details/135383085#_590)
- - [1. 添加光照探针并获取烘培结果](https://blog.csdn.net/weixin_44518102/article/details/135383085#1__591)
    - [2. 获取烘培的球谐系数](https://blog.csdn.net/weixin_44518102/article/details/135383085#2__597)
    - [3. 计算球谐光照](https://blog.csdn.net/weixin_44518102/article/details/135383085#3__614)
    - [4. 使用球谐光照](https://blog.csdn.net/weixin_44518102/article/details/135383085#4__714)
- [三、光照探针代理体LPPV](https://blog.csdn.net/weixin_44518102/article/details/135383085#LPPV_717)
- [参考](https://blog.csdn.net/weixin_44518102/article/details/135383085#_725)

## 一、URP烘培光照

### 1. 搭建场景

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/95ab54fd74744a9680e623fc0b49070c.png#pix)  
将所有需要烘培的物体设置为ContributeGI（下面两种方法都可）  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/60e2ae200ea648a59b9ecf32157df0c7.png#pix)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/bc9a67f6cc5f4241a865ae5688fb18f6.png)  
将光源设置为Mixed

### 2. 烘培光照参数设置

添加新的Lighting Settings  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/724935a85166437e825f7eea99fc2a8f.png)  
点击 **Generate Lighting** 烘培  
一般GPU烘培比CPU烘培块，至于具体该怎么选择，以及有什么区别，可参照  
[unity渐进式烘焙Progressive CPU和GPU](https://blog.csdn.net/qq_41692884/article/details/119539477)  
或Unity官方文档：[The Progressive GPU Lightmapper](https://docs.unity.cn/cn/2023.2/Manual/GPUProgressiveLightmapper.html)

烘培后的光照会被保存在Scene同等目录下的同名文件下  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/bf419e2f001d4fb3905627b110df2651.png)  
使用烘培光照

- 首先需要确保烘培物体开启contribute GI
- 其次、烘培物体必须使用内置材质、或标准Shader、或自定义Shader中拥有Meta Pass。
- 之后需要定义光源为烘培类型（Mixed、Baked），可以在Window > Rendering > Light Explorer中做整体调整。

对当前场景做预烘培光照，需要打开Window > Rendering > Lighting

#### MixedLight光照设置：

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/58fbb53b2260487abc898bf86f836bed.png)

- **Baked Indirect【阴影全部由shadowMap生成】**： 烘培间接光就像是 **实时光照+额外的间接光**，但是在阴影距离之外没有阴影显示 （因为实时光只生成阴影范围之内的阴影）。  
    \quad 烘焙间接模式的一个很好的例子是，如果你正在制作一款室内射击游戏或冒险游戏，设置在与走廊相连的房间里。观看距离是有限的，所以所有可见的东西通常都应该在阴影距离之内。这个模式对于建立一个有雾的室外场景也很有用，因为你可以用雾来隐藏远处缺失的阴影。  
    **【使用：中档pc和高端移动设备】**  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/982f1a05e097473b9d07f6f40f2f52e0.png#pix)
- **Shadowmask**：烘培阴影遮罩贴图，可以保存静态物体之间的阴影关系。  
    Shadowmask是一种纹理，它与相应的光贴图共享相同的UV布局和分辨率。它为每个texel最多存储4个光源的遮挡信息，因为纹理在当前gpu上最多限制为4个通道。
    - **Distance Shadowmask【实时阴影距离以外仍有静态阴影】**：他与**Baked Indirect**的区别是，**Distance Shadowmask**可以在实时光照阴影距离之外，对静态物体使用烘培阴影，对动态物体使用光照探针阴影。**Distance Shadowmask**模式的一个很好的例子是，如果你正在构建一个开放的世界场景，其中阴影一直延伸到地平线，复杂的静态网格在移动角色上投射实时阴影。  
        【**使用：高端PC、新一代设备**】
    - **Shadowmask【动态物体可以接收到静态物体（Light Probe）阴影；静态物体使用阴影遮蔽贴图获取静态物体的阴影投影】**：**Shadowmask**可能有用的一个很好的例子是，如果你正在构建一个**几乎完全静态**的场景，使用镜面材料，柔和的烘烤阴影和动态阴影接受物体，但不要太靠近相机。另一个很好的例子是一个开放世界场景，它的阴影一直延伸到地平线，但**没有像昼夜循环这样的动态照明**。  
        【**使用：中低端PC、移动设备**】

**Distance Shadowmask** 和 **Shadowmask**类型的切换，在**Project Settings>Quality**中导航到**Shadows**，其中**Shadowmask Mode**选项可以切换**Distance Shadowmask** 和 **Shadowmask**。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/1ee4ca68bad24a239723ce6989676cb2.png#pix)  
该类型会额外生成一个LightMap贴图 `Lightmap-x_comp_shadowmask`  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/a482d32e321845c79fc1f273930b429e.png#pix)

- **Subtractive**：不仅仅烘培间接光，还烘培直接光，静态物体无法接受（除了主光源外）动态物体的阴影，动态物体只能通过光照探针得到静态物体的阴影。当你正在构建带有外部关卡和很少动态GameObjects的格子阴影(即卡通风格)游戏时，Subtractive模式便会发挥作用。  
    **【使用：低端移动设备】**

##### 直观感受

除两个绿色小球外，其余物体都是静态物体。场景中无光照探针。场景中只有主光源，设置为Mixed。

**Baked Indirect**：实时阴影距离以外无阴影。其他阴影实时生成。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/6eba91b0d696456996a3ce9846c279ec.png#pix)  
**Shadowmask**：  
实时阴影距离以外有静态物体阴影，无动态物体阴影。  
动态物体上无静态物体阴影。  
静态物体阴影为预烘培阴影，移动后阴影错误。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/6929cadeaa6a4fa2896e5d89b7b48ad3.png#pix)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/c0a57d6206854463a112ccb0bd66e4ad.png#pix)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/75b507d428074e7681927a9c91117132.png#pix)  
**Distance Shadowmask：**  
实时阴影距离以外有静态物体阴影，无动态物体阴影。  
动态物体可接受静态物体阴影  
静态物体移动后，阴影随之移动  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/c99e68f263f4446f99fa736b2e548f7b.png#pix)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/5df8de048dfa4534a5be16a3db272f50.png#pix)  
**Subtractive**：  
实时物体阴影由静态物体阴影和动态物体阴影混合得到，阴影混合效果并不好。  
静态物体移动阴影错误。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/f2ea42c607844b31a0ceacdea308f856.png#pix)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/6df03b6ea53c4af492c58d615a1dffbe.png#pix)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/b935df54477e4743a11211d7c3a7aef2.png#pix)  
以上效果可以得出  
阴影质量： **Distance Shadowmask > Baked Indirect > Shadowmask > Subtractive**

#### Lightmapping Settings参数设置：

其中，**Lightmapping Settings参数**包括：

- Lightmap Resolution【**采样数**】：每单位（unit，一般为1m）像素分辨率。值越高，烘培时间越长。
    
- Lightmap Padding（填充？？？）：在烘培光照中设置形状之间的纹理的分隔【默认为2】
    
- LightmapSize【**光照贴图大小**】：光照贴图大小，整合了多个OBJ的纹理光照贴图
    
- Compress Lightmaps【**压缩**】：是否压缩光照贴图。较低质量的压缩减少了内存和存储需求，但代价是更多的可视化工件。更高质量的压缩需要更多的内存和存储空间，但可以提供更好的视觉效果。
    
- Ambient Occlusion【**增加了环境光遮蔽效果、边缘缝隙会更暗一点**】：指定是否包含环境遮挡或不在烘烤光图结果中。当光线反射到它们上时，启用此功能可以模拟物体的裂缝和缝隙中发生的柔和阴影。
    
- Directional Mode【**是否烘培镜面反射**】：控制烘烤和实时光贴图是否存储来自照明环境的定向照明信息。该贴图存储**主要的入射方向**以及**一个因子：记录有多少光是从主入射方向射入的**，其他光照则认为均匀的来自法线半球，这些数据可以用来实时计算材质的镜面反射，但看起来仍像纯粹的漫反射。  
    Non-Directional  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/df398fe7943845d9b1804262518bd52c.png#pix)  
    Directional  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/7e955cabe7364d109d666880c2b19806.png#pix)  
    我没看出来区别在哪，但是Directional会多一个光照贴图：`Lightmap-0_comp_dir`  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/a67ae93c95af4fa1856c35bbe1a7b002.png)
    
- Indirect Intensity【**光线反射强度**】：Unity提供的参考值是在0-5。小于1，反射后光照强度衰减、大于1，反射光强总和大于1。基于物理的情况下，该值应该为一个小于1的数，但特定情况下，使用较大的值能得到更好的效果。
    
- Albedo Boost【**值越大，反射光颜色约趋向于白色**】：通过增强场景中材料的反照率来控制表面之间反弹的光量。增加这个值，在间接光计算中，反照率值趋向白色。默认值是物理精确值。
    
- 最后一个选项 **Lightmap Parameters** 为每个Obj的默认光照贴图数据，默认值可以通过**Create>LightmapParameters**创建，再在**Lighting**窗口的**Lightmap Parameters**选项中设置自定义的文件。  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/a29496569aab48638e9567b73032c496.png)  
    烘培主要包含如下参数  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/b31f43bd906147378f2afb2026396aca.png)  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/d2b31b2a12144dabb7aba3e960241ec9.png)  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/5096db1eaaa94630bd8edc1168d08739.png)  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/2d908d589bba412dafc068f583935785.png)
    

这些参数大多都不需要调整，使用默认值已经可以解决大部分项目需求。

### 3. 我们如何记录次表面光源颜色

首先我们设置烘培模式为 Backed Indirect 或 shadowmask，我们关闭主光源（直接光照），发现地表的绿色映射到了物体上。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/abdefda91ba94adda6381f35cd545a11.png)  
间接光照的颜色是通过物体材质中Shader的Meta Pass来设置的。  
我们转到Lit.shader的Meta Pass

#### 首先我们提取出相关URP代码，便于测试

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/de99eee80eaf47b8abbd06c6725dd8a0.png)

#### 之后进入Shader

```
#pragma vertex UniversalVertexMeta
#pragma fragment UniversalFragmentMetaLit

#include "Packages/com.unity.render-pipelines.universal/Shaders/LitInput.hlsl"
#include "MyLitMetaPass.hlsl"
```

首先，我们来看顶点着色器的输入，Meta Pass的输入为顶点、法线和3个UV  
。。。

```
struct Attributes
{
    float4 positionOS   : POSITION;
    float3 normalOS     : NORMAL;
    float2 uv0          : TEXCOORD0;//BaseMap的UV
    float2 uv1          : TEXCOORD1;//Lightmap的UV
    float2 uv2          : TEXCOORD2;//DynamicLightmap的UV
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

struct Varyings
{
    float4 positionCS   : SV_POSITION;
    float2 uv           : TEXCOORD0;
#ifdef EDITOR_VISUALIZATION
    float2 VizUV        : TEXCOORD1;
    float4 LightCoord   : TEXCOORD2;
#endif
};
```

之后，进入顶点着色器

```
Varyings UniversalVertexMeta(Attributes input)
{
    Varyings output = (Varyings)0;
    output.positionCS = UnityMetaVertexPosition(input.positionOS.xyz, input.uv1, input.uv2);
    output.uv = TRANSFORM_TEX(input.uv0, _BaseMap);
#ifdef EDITOR_VISUALIZATION
    UnityEditorVizData(input.positionOS.xyz, input.uv0, input.uv1, input.uv2, output.VizUV, output.LightCoord);
#endif
    return output;
}
```

##### UnityMetaVertexPosition

UnityMetaVertexPosition 函数定义在 `Core/ShaderLibrary/MetaPass.hlsl`，我们进入文件查看。  
其中`unity_LightmapST`和`unity_DynamicLightmapST`定义在UnityInput.hlsl中。  
引用自：`MyLit.shader -> LitInput.hlsl -> Core.hlsl -> input.hlsl -> UnityInput.hlsl`

```
float4 unity_LightmapST;
float4 unity_DynamicLightmapST;
```

该变量为Unity引擎自动帮我们赋值，  
unity_LightmapST保存了Baked LightMap的UV_ST。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/ed60ddfae2f44c3b8d84647f367fa2d7.png)

unity_DynamicLightmapST保存了Realtime Global Illumination的LightMap的UV_ST  
DynamicLightmap也是用于静态物体，区别是在运行时可以改变光照的intensity和direction。需要在LIGHT SETTING面板里勾选Realtime Global Illumination。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/ad01a0c95f9649b781cb1ba281f9b78f.png)

UnityMetaVertexPosition 输入顶点坐标，以及unity_Lightmap，unity_DynamicLightmap的UV坐标，得到光照贴图中数据的裁剪坐标。

`unity_MetaVertexControl`的定义在MetaPass.hlsl中

```
CBUFFER_START(UnityMetaPass)
    // x = use uv1 as raster position
    // y = use uv2 as raster position
    bool4 unity_MetaVertexControl;

    // x = return albedo
    // y = return normal
    bool4 unity_MetaFragmentControl;

    // Control which VisualizationMode we will
    // display in the editor
    int unity_VisualizationMode;
CBUFFER_END
```

`unity_MetaVertexControl`变量用来区别是LightMap还是dynamicLightmap。因此启用实时全局光照会替代烘培全局光照作为最终结果。  
`unity_MetaFragmentControl`变量用来区别烘焙表面颜色还是自发光颜色。

`EDITOR_VISUALIZATION`宏为编辑模式可视化，用于渲染材质验证器。该模式具体使用参照  
[基于物理的渲染材质验证器](https://docs.unity.cn/cn/2022.1/Manual/MaterialValidator.html)  
可以简单的理解为，当我们在编辑器模式下更改了Shading Mode，则直接输出物体的裁剪坐标。  
否则输出LightMap中得到的数据。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/246ee146f66d41589a9ad7ddc2157345.png)  
我的Unity版本（2021.3.31f1）中，与Unity文档2022.1版本shadingMode显示不同，至于哪些Shading Mode会启用该宏定义，在此处不再做测试。

```

float4 UnityMetaVertexPosition(float3 vertex, float2 uv1, float2 uv2)
{
    return UnityMetaVertexPosition(vertex, uv1, uv2, unity_LightmapST, unity_DynamicLightmapST);
}

float4 UnityMetaVertexPosition(float3 vertex, float2 uv1, float2 uv2, float4 lightmapST, float4 dynlightmapST)
{
#ifndef EDITOR_VISUALIZATION
    if (unity_MetaVertexControl.x)
    {
        vertex.xy = uv1 * lightmapST.xy + lightmapST.zw;
        // OpenGL right now needs to actually use incoming vertex position,
        // so use it in a very dummy way
        vertex.z = vertex.z > 0 ? REAL_MIN : 0.0f;
    }
    if (unity_MetaVertexControl.y)
    {
        vertex.xy = uv2 * dynlightmapST.xy + dynlightmapST.zw;
        // OpenGL right now needs to actually use incoming vertex position,
        // so use it in a very dummy way
        vertex.z = vertex.z > 0 ? REAL_MIN : 0.0f;
    }
    return TransformWorldToHClip(vertex);
#else
    return TransformObjectToHClip(vertex);
#endif
}
```

这里，顶点不再是模型的顶点坐标，而是该模型顶点在LightMap中的UV坐标，最终结果要将该UV坐标从世界坐标转为裁剪坐标。【不知道这么做有什么道理！！！！】

我猜测：这里的 ViewMatrix 和 ProjectionMatrix 都是单位矩阵，并不会对UV坐标有改变，因为将UV坐标从世界空间转换到裁剪空间没有道理。但这仅仅是猜测！！！！！！！！！

---

继续回到顶点着色器

```
Varyings UniversalVertexMeta(Attributes input)
{
    Varyings output = (Varyings)0;
    output.positionCS = UnityMetaVertexPosition(input.positionOS.xyz, input.uv1, input.uv2);
    output.uv = TRANSFORM_TEX(input.uv0, _BaseMap);
#ifdef EDITOR_VISUALIZATION
    UnityEditorVizData(input.positionOS.xyz, input.uv0, input.uv1, input.uv2, output.VizUV, output.LightCoord);
#endif
    return output;
}
```

`output.positionCS` 记录了LightMapUV坐标在的裁剪空间下的坐标。  
`output.uv`记录了_BaseMap的UV坐标。  
这里忽略EDITOR_VISUALIZATION被定义的代码。
```HLSL
#define TRANSFORM_TEX(tex,name) (tex.xy * name##_ST.xy + name##_ST.zw)
```

我们得到片元着色器输入数据如下

```
struct Varyings
{
    float4 positionCS   : SV_POSITION;
    float2 uv           : TEXCOORD0;
#ifdef EDITOR_VISUALIZATION
    float2 VizUV        : TEXCOORD1;
    float4 LightCoord   : TEXCOORD2;
#endif
```

进入片元着色器：

```
half4 UniversalFragmentMetaLit(Varyings input) : SV_Target
{
    SurfaceData surfaceData;
    InitializeStandardLitSurfaceData(input.uv, surfaceData);

    BRDFData brdfData;
    InitializeBRDFData(surfaceData.albedo, surfaceData.metallic, surfaceData.specular, surfaceData.smoothness, surfaceData.alpha, brdfData);

    MetaInput metaInput;
    metaInput.Albedo = brdfData.diffuse + brdfData.specular * brdfData.roughness * 0.5;
    metaInput.Emission = surfaceData.emission;
    return UniversalFragmentMeta(input, metaInput);
}
```

计算得到 `metaInput`，MetaInput定义在`MetaInput.hlsl`

```
#define MetaInput UnityMetaInput
#define MetaFragment UnityMetaFragment
```

UnityMetaInput结构体定义在MetaPass.hlsl中，保存了颜色和自发光颜色。

```
struct UnityMetaInput
{
    half3 Albedo;
    half3 Emission;
#ifdef EDITOR_VISUALIZATION
    float2 VizUV;
    float4 LightCoord;
#endif
};
```

然后，将顶点着色器输入`Varyings input`，和`UnityMetaInput metaInput`传给`UniversalFragmentMeta`函数。函数在`UniversalMetaPass.hlsl`内

```
half4 UniversalFragmentMeta(Varyings fragIn, MetaInput metaInput)
{
#ifdef EDITOR_VISUALIZATION
    metaInput.VizUV = fragIn.VizUV;
    metaInput.LightCoord = fragIn.LightCoord;
#endif

    return UnityMetaFragment(metaInput);
}
```

`UniversalFragmentMeta()`函数又调用了`UnityMetaFragment`，`UnityMetaFragment`定义在MetaPass.hlsl中

//如下代码删除了EDITOR_VISUALIZATION定义部分，我们只关注正常烘培。

```
float unity_OneOverOutputBoost;
float unity_MaxOutputValue;
float unity_UseLinearSpace;
half4 UnityMetaFragment (UnityMetaInput IN)
{
    half4 res = 0;
    //`unity_MetaFragmentControl`变量用来区别烘焙表面颜色还是自发光颜色。
    // x:烘焙表面颜色
    if (unity_MetaFragmentControl.x)
    {
        res = half4(IN.Albedo,1);

        // Apply Albedo Boost from LightmapSettings.
        res.rgb = clamp( pow( abs(res.rgb) , saturate(unity_OneOverOutputBoost) ), 0, unity_MaxOutputValue);
    }
    // y:烘培自发光
    if (unity_MetaFragmentControl.y)
    {
        half3 emission;
        if (unity_UseLinearSpace)
            emission = IN.Emission;
        else
            emission = Gamma20ToLinear(IN.Emission);

        res = half4(emission, 1.0);
    }
    return res;
}
```

unity_OneOverOutputBoost 和 unity_MaxOutputValue 用来定义烘焙时的光强。  
该值定义在Lighting窗口>Scene中  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/111d4bb0576f45f0865c10ef7ed55779.png)  
按照 Unity 的解释说明，我猜测：

- Albedo Boost的值被1除，传入unity_OneOverOutputBoost，标识指数强度值；
- Indirect Intensity的值，传入unity_MaxOutputValue， 规定了反射可以达到的最大亮度。

如果打开了烘培自发光，在Shader编辑器中打开Emission,设置为Baked，Shader会写入_EmissionColor值，并设置Flag。

```
m.globalIlluminationFlags &=~MaterialGlobalIlluminationFlags.EmissiveIsBlack;
```

Unity会根据这个Flag，自动设置`unity_MetaFragmentControl.y`的值。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/499011549f5841fdb4abfca1aecc74a6.png)  
根据下图可以看到： **左边自发光的小黄球（静态物体）** 的自发光颜色照射在了周围静态物体上，但 **右边自发光的小黄球** 是动态物体，因此，即使自发光并设置为Baked属性，也并没有烘培光照，这符合我们的想法。

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/ba7a64b8062745b0941d99dd12b518d3.png)  
无论是烘培光还是自发光，都只是将当前片元的出射光/自发光作为输出。他将指定该片元在烘培系统中以什么颜色作为光子基本颜色来映射。

总结：次表面光源颜色为表面接收到光源后的漫反射颜色，如果有自发光。则用自发光颜色替代。Unity将使用这些次表面光源或自发光光源，做间接光照烘培（我猜测应该是光子映射，而这些光子就是映射在网络上的光照贴图的一个个纹素）

### 4. 使用光照贴图

要想获取到光照贴图的数据，必须告诉Unity：`perObjectData = PerObjectData.Lightmaps`

```
var drawingSettings = new DrawingSettings(unlitShaderTagId, sortingSettings) 
{
	...
	perObjectData = PerObjectData.Lightmaps
};
```

在URP中，默认开启大多数配置，可在UniversalRenderPipelien.cs > RenderSingleCamera() > InitializeRenderingData()>GetPerObjectLightFlags()中找到此设置。

```
static void InitializeRenderingData(UniversalRenderPipelineAsset settings, ref CameraData cameraData, ref CullingResults cullResults,
     bool anyPostProcessingEnabled, out RenderingData renderingData)
{
	renderingData.perObjectData = GetPerObjectLightFlags(renderingData.lightData.additionalLightsCount);
}

static PerObjectData GetPerObjectLightFlags(int additionalLightsCount)
{
	var configuration = 
			PerObjectData.ReflectionProbes | 
			PerObjectData.Lightmaps | 
			PerObjectData.LightProbe | 
			PerObjectData.LightData | 
			PerObjectData.OcclusionProbe | 
			PerObjectData.ShadowMask;
}
```

一旦开启该配置PerObjectData.Lightmaps，Unity会将对有LightMap的物体使用含有LIGHTMAP_ON宏定义的Shader变体。  
我们需要在Shader中定义宏：

```
#pragma multi_compile _ LIGHTMAP_ON
```

在URP管线中，只有UniversalForward、UniversalGBuffer两个Pass有关于LIGHTMAP_ON的宏定义，当定义了LIGHTMAP_ON，说明该物体网络要使用烘培光进行渲染。  
我们只关心前向渲染的结果。

同样，我们将URP中的LitShader代码复制出来，便于修改  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/e70e057cf6cc4d1e9e42e3e4b306ba0b.png)  
我们在增加光照贴图后，Unity会将UV数据和顶点数据打包一起发送。

```
struct Attributes
{
	float2 staticLightmapUV   : TEXCOORD1;
	float2 dynamicLightmapUV  : TEXCOORD2;
};
```

我们通过`TEXCOORD1`和`TEXCOORD2`可以获取到烘培光照贴图的uv和实时全局光照的UV。  
在顶点着色器中，通过宏，将数据传入片元着色器。

```
// 处理烘培光照
	OUTPUT_LIGHTMAP_UV(input.staticLightmapUV, unity_LightmapST, output.staticLightmapUV);
// 处理实时全局光照
#ifdef DYNAMICLIGHTMAP_ON
    output.dynamicLightmapUV = input.dynamicLightmapUV.xy * unity_DynamicLightmapST.xy + unity_DynamicLightmapST.zw;
#endif
```

该宏定义在Lighting.hlsl中，如果启用了光照贴图，则该函数将经过了ST变换的UV坐标传递到片元着色器；否则，将LightMap宏置为空，并使用球谐函数作为全局光照数据。

```
#if defined(LIGHTMAP_ON)
    #define DECLARE_LIGHTMAP_OR_SH(lmName, shName, index) float2 lmName : TEXCOORD##index
    #define OUTPUT_LIGHTMAP_UV(lightmapUV, lightmapScaleOffset, OUT) OUT.xy = lightmapUV.xy * lightmapScaleOffset.xy + lightmapScaleOffset.zw;
    #define OUTPUT_SH(normalWS, OUT)
#else
    #define DECLARE_LIGHTMAP_OR_SH(lmName, shName, index) half3 shName : TEXCOORD##index
    #define OUTPUT_LIGHTMAP_UV(lightmapUV, lightmapScaleOffset, OUT)
    #define OUTPUT_SH(normalWS, OUT) OUT.xyz = SampleSHVertex(normalWS)
#endif
```

传入片元着色器后，初始化InputData，其中根据光照贴图设置half3 bakedGI参数。

```
void InitializeInputData(Varyings input, half3 normalTS, out InputData inputData)
{
#if defined(DYNAMICLIGHTMAP_ON)
    inputData.bakedGI = SAMPLE_GI(input.staticLightmapUV, input.dynamicLightmapUV, input.vertexSH, inputData.normalWS);
#else
    inputData.bakedGI = SAMPLE_GI(input.staticLightmapUV, input.vertexSH, inputData.normalWS);
#endif
}
```

其中，`SAMPLE_GI`宏定义在GlobalIllumination.hlsl中

```
// We either sample GI from baked lightmap or from probes.
// If lightmap: sampleData.xy = lightmapUV
// If probe: sampleData.xyz = L2 SH terms
#if defined(LIGHTMAP_ON) && defined(DYNAMICLIGHTMAP_ON)
#define SAMPLE_GI(staticLmName, dynamicLmName, shName, normalWSName) SampleLightmap(staticLmName, dynamicLmName, normalWSName)
#elif defined(DYNAMICLIGHTMAP_ON)
#define SAMPLE_GI(staticLmName, dynamicLmName, shName, normalWSName) SampleLightmap(0, dynamicLmName, normalWSName)
#elif defined(LIGHTMAP_ON)
#define SAMPLE_GI(staticLmName, shName, normalWSName) SampleLightmap(staticLmName, 0, normalWSName)
#else
#define SAMPLE_GI(staticLmName, shName, normalWSName) SampleSHPixel(shName, normalWSName)
#endif
```

- 如果定义了光照贴图或实时光照贴图，则使用函数SampleLightmap；
- 若未使用光照贴图，则使用SampleSHPixel。

核心代码:

```
// Sample baked and/or realtime lightmap. Non-Direction and Directional if available.
half3 SampleLightmap(float2 staticLightmapUV, float2 dynamicLightmapUV, half3 normalWS)
{
#ifdef UNITY_LIGHTMAP_FULL_HDR
    bool encodedLightmap = false;
#else
    bool encodedLightmap = true;
#endif

    half4 decodeInstructions = half4(LIGHTMAP_HDR_MULTIPLIER, LIGHTMAP_HDR_EXPONENT, 0.0h, 0.0h);

    // The shader library sample lightmap functions transform the lightmap uv coords to apply bias and scale.
    // However, universal pipeline already transformed those coords in vertex. We pass half4(1, 1, 0, 0) and
    // the compiler will optimize the transform away.
    half4 transformCoords = half4(1, 1, 0, 0);

    float3 diffuseLighting = 0;

#if defined(LIGHTMAP_ON) && defined(DIRLIGHTMAP_COMBINED)
    diffuseLighting = SampleDirectionalLightmap(TEXTURE2D_LIGHTMAP_ARGS(LIGHTMAP_NAME, LIGHTMAP_SAMPLER_NAME),
        TEXTURE2D_LIGHTMAP_ARGS(LIGHTMAP_INDIRECTION_NAME, LIGHTMAP_SAMPLER_NAME),
        LIGHTMAP_SAMPLE_EXTRA_ARGS, transformCoords, normalWS, encodedLightmap, decodeInstructions);
#elif defined(LIGHTMAP_ON)
    diffuseLighting = SampleSingleLightmap(TEXTURE2D_LIGHTMAP_ARGS(LIGHTMAP_NAME, LIGHTMAP_SAMPLER_NAME), LIGHTMAP_SAMPLE_EXTRA_ARGS, transformCoords, encodedLightmap, decodeInstructions);
#endif

#if defined(DYNAMICLIGHTMAP_ON) && defined(DIRLIGHTMAP_COMBINED)
    diffuseLighting += SampleDirectionalLightmap(TEXTURE2D_ARGS(unity_DynamicLightmap, samplerunity_DynamicLightmap),
        TEXTURE2D_ARGS(unity_DynamicDirectionality, samplerunity_DynamicLightmap),
        dynamicLightmapUV, transformCoords, normalWS, false, decodeInstructions);
#elif defined(DYNAMICLIGHTMAP_ON)
    diffuseLighting += SampleSingleLightmap(TEXTURE2D_ARGS(unity_DynamicLightmap, samplerunity_DynamicLightmap),
        dynamicLightmapUV, transformCoords, false, decodeInstructions);
#endif

    return diffuseLighting;
}
```

1. 是否解码贴图数据
2. 采样光照贴图，并根据光照贴图类型是否为方向贴图，决定是否使用方向采样（个人猜测，此处使用2次球谐实现）
3. 采样实时光照贴图，同样根据贴图类型进行不同的采样，之后将结果附加在光照贴图采样之上。

当下，我们只考虑开启最基础的`LIGHTMAP_ON`宏。  
SampleSingleLightmap函数在EntityLighting.hlsl中，函数除了基础的采样函数外，只增加了解码功能，并无特别之处。

```
real3 SampleSingleLightmap(TEXTURE2D_LIGHTMAP_PARAM(lightmapTex, lightmapSampler), LIGHTMAP_EXTRA_ARGS, float4 transform, bool encodedLightmap, real4 decodeInstructions)
{
    // transform is scale and bias
    uv = uv * transform.xy + transform.zw;
    real3 illuminance = real3(0.0, 0.0, 0.0);
    // Remark: baked lightmap is RGBM for now, dynamic lightmap is RGB9E5
    if (encodedLightmap)
    {
        real4 encodedIlluminance = SAMPLE_TEXTURE2D_LIGHTMAP(lightmapTex, lightmapSampler, LIGHTMAP_EXTRA_ARGS_USE).rgba;
        illuminance = DecodeLightmap(encodedIlluminance, decodeInstructions);
    }
    else
    {
        illuminance = SAMPLE_TEXTURE2D_LIGHTMAP(lightmapTex, lightmapSampler, LIGHTMAP_EXTRA_ARGS_USE).rgb;
    }
    return illuminance;
}
```

最终，采样结果传输路线为 illuminance -> diffuseLighting -> inputData.bakedGI.

---

之后，在Fragment中的如下函数中进行光照计算，UV数据保存在inputData中

```
half4 color = UniversalFragmentPBR(inputData, surfaceData);
```

在Lighting.hlsl中找到该函数

```
half4 UniversalFragmentPBR(InputData inputData, SurfaceData surfaceData)
{
	...
	MixRealtimeAndBakedGI(mainLight, inputData.normalWS, inputData.bakedGI);
	...
}
```

进入MixRealtimeAndBakedGI，该函数混合实时光和烘培光，主要是通过实时阴影计算，减去光照贴图的暗部亮度。

```
void MixRealtimeAndBakedGI(inout Light light, half3 normalWS, inout half3 bakedGI)
{
#if defined(LIGHTMAP_ON) && defined(_MIXED_LIGHTING_SUBTRACTIVE)
    bakedGI = SubtractDirectMainLightFromLightmap(light, normalWS, bakedGI);
#endif
}
```

进入SubtractDirectMainLightFromLightmap，为烘培光照添加主光照阴影

```
half3 SubtractDirectMainLightFromLightmap(Light mainLight, half3 normalWS, half3 bakedGI)
{
    // Let's try to make realtime shadows work on a surface, which already contains
    // baked lighting and shadowing from the main sun light.
    // Summary:
    // 1) Calculate possible value in the shadow by subtracting estimated light contribution from the places occluded by realtime shadow:
    //      a) preserves other baked lights and light bounces
    //      b) eliminates shadows on the geometry facing away from the light
    // 2) Clamp against user defined ShadowColor.
    // 3) Pick original lightmap value, if it is the darkest one.


    // 1) Gives good estimate of illumination as if light would've been shadowed during the bake.
    // We only subtract the main direction light. This is accounted in the contribution term below.
    half shadowStrength = GetMainLightShadowStrength();
    half contributionTerm = saturate(dot(mainLight.direction, normalWS));
    half3 lambert = mainLight.color * contributionTerm;
    half3 estimatedLightContributionMaskedByInverseOfShadow = lambert * (1.0 - mainLight.shadowAttenuation);
    half3 subtractedLightmap = bakedGI - estimatedLightContributionMaskedByInverseOfShadow;

    // 2) Allows user to define overall ambient of the scene and control situation when realtime shadow becomes too dark.
    half3 realtimeShadow = max(subtractedLightmap, _SubtractiveShadowColor.xyz);
    realtimeShadow = lerp(bakedGI, realtimeShadow, shadowStrength);

    // 3) Pick darkest color
    return min(bakedGI, realtimeShadow);
}
```

## 二、光照探针

### 1. 添加光照探针并获取烘培结果

使用光照探针，增加光照探针组件即可  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/426507cdf61b4ae193eb1d7ab01733fc.png)  
添加组件后，可编辑探针位置，之后点击烘培，即可对光照探针赋值。  
赋值的结果为球谐函数系数。

### 2. 获取烘培的球谐系数

我们通过设置`PerObjectData.LightProbe` 告诉Unity获取系数。

系数保存在UnityInput.hlsl中，为3阶球谐（单通道9个系数，故rgb三通道一共27个系数），故这里使用 4 * 7 = 28个存储空间。

```
CBUFFER_START(UnityPerDraw)
	// SH block feature
	real4 unity_SHAr;
	real4 unity_SHAg;
	real4 unity_SHAb;
	real4 unity_SHBr;
	real4 unity_SHBg;
	real4 unity_SHBb;
	real4 unity_SHC;
CBUFFER_END
```

### 3. 计算球谐光照

计算球谐函数分为 **顶点着色计算** 和 **片元着色计算** ，函数在GlobalIllumination.hlsl中。

```
// SH Vertex Evaluation. Depending on target SH sampling might be
// done completely per vertex or mixed with L2 term per vertex and L0, L1
// per pixel. See SampleSHPixel
half3 SampleSHVertex(half3 normalWS)
{
#if defined(EVALUATE_SH_VERTEX)
    return SampleSH(normalWS);
#elif defined(EVALUATE_SH_MIXED)
    // no max since this is only L2 contribution
    return SHEvalLinearL2(normalWS, unity_SHBr, unity_SHBg, unity_SHBb, unity_SHC);
#endif

    // Fully per-pixel. Nothing to compute.
    return half3(0.0, 0.0, 0.0);
}

// SH Pixel Evaluation. Depending on target SH sampling might be done
// mixed or fully in pixel. See SampleSHVertex
half3 SampleSHPixel(half3 L2Term, half3 normalWS)
{
#if defined(EVALUATE_SH_VERTEX)
    return L2Term;
#elif defined(EVALUATE_SH_MIXED)
    half3 res = L2Term + SHEvalLinearL0L1(normalWS, unity_SHAr, unity_SHAg, unity_SHAb);
#ifdef UNITY_COLORSPACE_GAMMA
    res = LinearToSRGB(res);
#endif
    return max(half3(0, 0, 0), res);
#endif

    // Default: Evaluate SH fully per-pixel
    return SampleSH(normalWS);
}
```

球谐计算调用

```
half3 SampleSH(half3 normalWS)
{
    // LPPV is not supported in Ligthweight Pipeline
    real4 SHCoefficients[7];
    SHCoefficients[0] = unity_SHAr;
    SHCoefficients[1] = unity_SHAg;
    SHCoefficients[2] = unity_SHAb;
    SHCoefficients[3] = unity_SHBr;
    SHCoefficients[4] = unity_SHBg;
    SHCoefficients[5] = unity_SHBb;
    SHCoefficients[6] = unity_SHC;

    return max(half3(0, 0, 0), SampleSH9(SHCoefficients, normalWS));
}
```

最终通过`SampleSH9`函数计算，该函数定义在core/EntityLighting.hlsl中  
`SHEvalLinearL0L1`函数计算0、1阶，`SHEvalLinearL2`函数计算2阶，最终将线性空间转化为SRGB空间。

```
float3 SampleSH9(float4 SHCoefficients[7], float3 N)
{
    float4 shAr = SHCoefficients[0];
    float4 shAg = SHCoefficients[1];
    float4 shAb = SHCoefficients[2];
    float4 shBr = SHCoefficients[3];
    float4 shBg = SHCoefficients[4];
    float4 shBb = SHCoefficients[5];
    float4 shCr = SHCoefficients[6];

    // Linear + constant polynomial terms
    float3 res = SHEvalLinearL0L1(N, shAr, shAg, shAb);

    // Quadratic polynomials
    res += SHEvalLinearL2(N, shBr, shBg, shBb, shCr);

#ifdef UNITY_COLORSPACE_GAMMA
    res = LinearToSRGB(res);
#endif

    return res;
}
```

球谐调用：在Globalillumination.hlsl中有宏如下

```
// We either sample GI from baked lightmap or from probes.
// If lightmap: sampleData.xy = lightmapUV
// If probe: sampleData.xyz = L2 SH terms
#if defined(LIGHTMAP_ON) && defined(DYNAMICLIGHTMAP_ON)
#define SAMPLE_GI(staticLmName, dynamicLmName, shName, normalWSName) SampleLightmap(staticLmName, dynamicLmName, normalWSName)
#elif defined(DYNAMICLIGHTMAP_ON)
#define SAMPLE_GI(staticLmName, dynamicLmName, shName, normalWSName) SampleLightmap(0, dynamicLmName, normalWSName)
#elif defined(LIGHTMAP_ON)
#define SAMPLE_GI(staticLmName, shName, normalWSName) SampleLightmap(staticLmName, 0, normalWSName)
#else
#define SAMPLE_GI(staticLmName, shName, normalWSName) SampleSHPixel(shName, normalWSName)
#endif
```

当未定义光照贴图和实时全局光照时，使用球谐函数赋值全局光照。

### 4. 使用球谐光照

在物体的Lighting一栏中，打开使用全局光照，并且使用LightProbes  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/5583887c342946c095f21a0bd7d6dd6a.png)

## 三、光照探针代理体LPPV

个人认为LPPV解决的是：大体积物体球谐着色错误的问题。因为大型物体只能通过物体位置输入球谐系数，而不能通过实际片元位置，得到最邻近的探针。

因此需要使用代理探针，作为物体位置的代理点，进行计算。  
然而我的硬件不支持LPPV，这里不做完整介绍。Unity好像也逐渐不再使用改方法。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/6502162c7f6d4c968581dcaa78ebd5ae.png)

## 参考

Unity官方文档  
[shiomi：Unity SRP 学习笔记（一）：PBR](https://zhuanlan.zhihu.com/p/108632412)  
[Baked Light Light Maps and Probes：Catlike](https://catlikecoding.com/unity/tutorials/custom-srp/baked-light/)