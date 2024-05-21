---
link: https://blog.csdn.net/weixin_44518102/article/details/135085765
byline: 成就一亿技术人!
excerpt: 文章浏览阅读1.1k次，点赞21次，收藏28次。细节内容详见catlike 这里只做效果展示！！！！_samplesinglelightmap
tags:
  - slurp/samplesinglelightmap
slurped: 2024-05-21T10:11:57.524Z
title: Unity SRP 管线【第五讲：自定义烘培光照】_samplesinglelightmap-CSDN博客
---

#### 文章目录

- [一、自定义烘培光照](https://blog.csdn.net/weixin_44518102/article/details/135085765#_1)
- - [1. 烘培光照贴图](https://blog.csdn.net/weixin_44518102/article/details/135085765#1__4)
    - [2. 获取光照贴图](https://blog.csdn.net/weixin_44518102/article/details/135085765#2__10)
    - [3. 获取物体在光照贴图上的UV坐标](https://blog.csdn.net/weixin_44518102/article/details/135085765#3_UV_18)
    - [4. 采样光照贴图](https://blog.csdn.net/weixin_44518102/article/details/135085765#4__119)
- [二、自定义光照探针](https://blog.csdn.net/weixin_44518102/article/details/135085765#_260)
- [三、 Light Probe Proxy Volumes（LPPV）](https://blog.csdn.net/weixin_44518102/article/details/135085765#_Light_Probe_Proxy_VolumesLPPV_266)
- [四、Meta Pass](https://blog.csdn.net/weixin_44518102/article/details/135085765#Meta_Pass_269)
- [五、 自发光烘培](https://blog.csdn.net/weixin_44518102/article/details/135085765#__280)

## 一、自定义烘培光照

细节内容详见[catlikecoding.com](https://catlikecoding.com/unity/tutorials/custom-srp/baked-light/)  
这里只做效果展示！！！！

### 1. 烘培光照贴图

- 在Lighting中设置LightingSettingsAsset，
- 并且将需要烘培的物体设置为ContributeGI
- 将光照设置为Mixed或Baked
- 最后点击GenerateLighting烘培，得到光照贴图  
    ![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/6a9b6b91a25a45b0bcbe014181525a41.png#left_pix)

### 2. 获取光照贴图

通过定义unity_Lightmap纹理即可获取光照贴图，整个场景的光照贴图全部集成在一张贴图中。

```
TEXTURE2D(unity_Lightmap);
SAMPLER(samplerunity_Lightmap);
```

因为整个场景的光照贴图都在一张贴图上，所以物体的UV坐标也不再是原本的UV坐标

### 3. 获取物体在光照贴图上的UV坐标

首先，需要Unity将每个烘培了光照的物体的光照贴图UV发送到GPU。  
我们在CameraRenderer中设置`drawingSettings` 中的`perObjectData` 为`PerObjectData.Lightmaps`

```
var drawingSettings = new DrawingSettings(unlitShaderTagID, sortingSettings)//使用哪个ShaderTagID，以什么一定顺序渲染的设定
{
    //动态合批
    enableDynamicBatching = useDynamicBatching,
    //实例化
    enableInstancing = useGPUInstancing,
    //光照贴图UV坐标
    perObjectData = PerObjectData.Lightmaps,
};
```

当开启 Lighting 窗口下的Baked Global Illumination按钮时，Unity会对打开Comtribute Global Illumination的物体写入宏`_LIGHTMAP_ON`  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/dc39b42827b34c85943bd7c4c78b98c2.png)  
因此需要在需要光照烘培的Shader中定义

```
#pragma multi_compile _ LIGHTMAP_ON
```

Unity会将UV坐标作为顶点数据发送到顶点着色器  
顶点着色器中作为TEXCOORD1（第二个纹理通道）进行输入

以下定义宏，来避免未开启光照烘培时的UV计算和输入

```
#if defined(LIGHTMAP_ON)
	#define GI_ATTRIBUTE_DATA float2 lightMapUV : TEXCOORD1;
	#define GI_VARYINGS_DATA  float2 lightMapUV : VAR_LIGHT_MAP_UV;
	#define TRANSFER_GI_DATA(input, output) output.lightMapUV = input.lightMapUV;
	#define GI_FRAGMENT_DATA(input)         input.lightMapUV
#else
	#define GI_ATTRIBUTE_DATA 
	#define GI_VARYINGS_DATA  
	#define TRANSFER_GI_DATA(input, output) 
	#define GI_FRAGMENT_DATA(input)				0.0      
#endif
```

并在着色器输入输出中添加GI_ATTRIBUTE_DATA、GI_VARYINGS_DATA

```
struct Attributes
{
    float3 positionOS : POSITION;
    float2 baseUV : TEXCOORD0;
    float3 normalOS : NORMAL;
    GI_ATTRIBUTE_DATA
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

struct Varyings{
    float4 positionCS : SV_POSITION;
    float2 baseUV : VAR_BASE_UV;
    float3 normalWS : VAR_NORMAL;
    float3 positionWS : VAR_POSITION;
    GI_VARYINGS_DATA
    UNITY_VERTEX_INPUT_INSTANCE_ID
};
```

将UV坐标传入片元着色器

```
Varyings LitPassVertex(Attributes input)
{
    Varyings output;
    ....
    // 全局光照
    TRANSFER_GI_DATA(input, output);
    
    return output;
}
```

在片元着色器中获取UV坐标

```
// 全局光照
#if defined(LIGHTMAP_ON)
    float2 LightMapUV = GI_FRAGMENT_DATA(input);
#endif
```

然而，这获取的UV并不是该物体在LightMap上的UV，而是LightMap局部空间上的UV。  
每个物体均匀且不重叠的按照缩放和偏移放置在这张LightMap中，所以每一个物体都有一个对应的UV缩放和偏移数据。  
我们通过在Shader的Input文件中添加`unity_LightmapST`得到该数据，该数据由Unity直接提供。

```
CBUFFER_START(UnityPerDraw)
	...
	float4 unity_LightmapST;
CBUFFER_END
```

> 教程中引入了动态光照贴图UV  
> float4 unity_DynamicLightmaoST;  
> 防止因为兼容性导致的SRP批处理中断
> 
> ---
> 
> 这里我们不引入 unity_DynamicLightmaoST

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/62814f957ad9486890c14077e9365a4c.png)

### 4. 采样光照贴图

光照贴图的采样函数由`render-pipelines.core`提供，因为Unity有可能对：LightMap进行了压缩，所以使用内置函数可以帮我们解决这个问题。

其中，是否压缩LightMap在Light窗口下的Lightmap Compression来设置  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/a1370c37de1f47f7a037554adc82534e.png)  
设置压缩会在Shader中输入关键字 `UNITY_LIGHTMAP_FULL_HDR`。

```
#include "Packages/com.unity.render-pipelines.core/ShaderLibrary/EntityLighting.hlsl"
```

里面有关于

- 球谐采样
- 光照探针采样
- 遮蔽探针采样
- 解码/编码LightMap
- 解码/编码HDR环境贴图
- 采样光照贴图的函数

的函数

其中，使用SampleSingleLightmap，对单一LightMap进行采样

```
real3 SampleSingleLightmap(
	TEXTURE2D_LIGHTMAP_PARAM(lightmapTex, lightmapSampler), 
	LIGHTMAP_EXTRA_ARGS, 
	float4 transform, 
	bool encodedLightmap, 
	real4 decodeInstructions)
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

我们使用该函数对LightMap进行采样，并根据是否开启LIGHTMAP_ON决定是否调用函数。

```
float3 SampleLightMap(float2 lightMapUV)
{
#if defined(LIGHTMAP_ON)
	return SampleSingleLightmap(
		TEXTURE2D_ARGS(unity_Lightmap, samplerunity_Lightmap), 
		lightMapUV, 
		unity_LightmapST, 
	#if defined(UNITY_LIGHTMAP_FULL_HDR)
		false,
	#else
		true,
	#endif
		float4(LIGHTMAP_HDR_MULTIPLIER, LIGHTMAP_HDR_EXPONENT, 0.0, 0.0)
	);
#else
	return 0.0;
#endif
}
```

返回数据

```
struct GI{
	float3 diffuse;
};

GI GetGI(float2 lightMapUV){
	GI gi;
	gi.diffuse = SampleLightMap(lightMapUV);
	return gi;
}
```

在FragmentShader中调用函数，获取LightMap采样的数据。

```
// 全局光照
    float2 LightMapUV = GI_FRAGMENT_DATA(input);
    GI gi = GetGI(LightMapUV);
```

计算光照

```
    float3 color = GetLighting(surface, brdf, gi);
```

将全局光照作为基础色

```
float3 GetLighting(Surface surfaceWS, BRDF brdf, GI gi)
{
	// 得到表面级联阴影数据
	CascadeShadowData cascadeShadowData = GetCascadeShadowData(surfaceWS);
	// 将全局光照作为基础色
	float3 color = gi.diffuse;
	// 对可见光照结果进行累加
	for(int i = 0; i < GetDirectionalLightCount();i++)
	{
		Light light = GetDirectionalLight(i, surfaceWS, cascadeShadowData);
		color += GetLighting(surfaceWS, brdf, light);
	}
	return color;
}
```

烘培光照  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/5ad4e9c8f5b648b7b4dbff2d10b0323a.png)  
烘培光照+直接光照  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/7282ad972ca44bb8b4078e29a012dd58.png)  
注意：这里烘培光照只计算间接光照，不计算直接光照

但为什么是白色呢，不应该有绿色映射吗？？？？？？

将代码中计算GI的光照修改为

```
float3 color = gi.diffuse * brdf.diffuse;
```

变为：  
间接光照（烘培）  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/571049aa0d4844c88447172596c418fa.png)  
烘培光照（烘培）+直接光照  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/0351e9cd4bf9454bb2a73db1787942fe.png)  
效果好了，但是仍然没有得到正确的间接光照！

所以光照贴图保存的到底是什么  
似乎只是一个强度，但没有颜色！！！  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/04709c6f8ecd4ac3a4d4aae15f508dcc.png)  
我们将直接光照颜色设为红色，再次查看间接光照数据。  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/b93820ca51224704b31256c26d065237.png)  
可以看到，间接光照变成了红色，也就是说，光照烘培得到的数据并不是实际光照经过物体表面反射得到的间接光照，而是光照在弹射过程中按照一定比例衰减的结果。

因此，GI最终结果与BRDF相乘得到的才是间接光照的结果（没有反射物体颜色的映射）

如果要获取间接光照，见 **4.Meta Pass**

## 二、自定义光照探针

使用光照探针前  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/2c47376fcb5a41ddb8fdf21fe1425029.png)  
使用光照探针后  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/c85d3e6eba9840098da9b1e44e781469.png)

## 三、 Light Probe Proxy Volumes（LPPV）

## 四、Meta Pass

因为间接漫射光从表面反射，它应该受到这些表面漫反射的影响。这种情况目前还没有发生。Unity将我们的表面视为均匀的白色。Unity使用一个特殊的Meta通道来确定烘焙时的反射光。因为我们还没有定义这样的通道，Unity使用默认的通道，它最终是白色的。

增加Meta文件前  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/a6c182f2c7d24b6dbc9d9b03a46d9614.png)  
增加Meta文件后  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/ff2b86f24db542fca04d367644357616.png)  
间接光照效果  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/fa406408518b4c679aa756835d74a8e4.png)  
加上动态物体光照探针效果  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/da60e9e008974646b6ac8b7a7b78093d.png)

## 五、 自发光烘培

![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/b935b82fe7b642c482dceb991af5fbec.png)  
![在这里插入图片描述](https://img-blog.csdnimg.cn/direct/a857294f4c62415fb584d4e98f4e9994.png)