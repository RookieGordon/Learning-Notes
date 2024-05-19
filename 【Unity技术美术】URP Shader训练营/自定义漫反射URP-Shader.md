---
tags:
  - Unity
  - URP
  - Shader
---


```hlsl
Pass  
{  
    Name "Custom Basic Forward Lit"  
    Tags  { "LightMode" = "UniversalForward" }  
    Cull [_CullMode]  
  
    HLSLPROGRAM  
    #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"  
    
    #pragma vertex LitPassVertex  
    #pragma fragment LitPassFragment  
  
    #pragma shader_feature _ALPHATEST_ON  
    #pragma multi_compile LIGHTMAP_ON  
    #pragma multi_compile _MAIN_LIGHT_SHADOWS  
  
    TEXTURE2D(_BaseMap);  
    SAMPLER(sampler_BaseMap);  
  
    struct Attribute  
    {  
        float3 posOS : POSITION;  
        float3 normalOS : NORMAL;  
        float2 uv : TEXCOORD0;  
        // 光照贴图，离线烘焙出光照对物体的影响，转换成贴图，贴到物体表面  
        float2 lightmapUV: TEXCOORD1;  
        float4 vertexColor: COLOR;  
    };  
    struct Varyings  
    {  
        float4 posCS: SV_POSITION;  
        float3 posWS: TEXCOORD0;  
        float3 normalWS: TEXCOORD1;  
        float2 uv: TEXCOORD2;  
        DECLARE_LIGHTMAP_OR_SH(lightmapUV, vertexSH, 3);  
        float4 vertexColor: COLOR;  
    };  
    
    Varyings LitPassVertex(Attribute IN)  
    {        
	    Varyings OUT = (Varyings)0;  
  
        VertexPositionInputs posInputs = GetVertexPositionInputs(IN.posOS);  
        OUT.posCS = posInputs.positionCS;  
        OUT.posWS = posInputs.positionWS;  
  
        VertexNormalInputs normalInputs = GetVertexNormalInputs(IN.normalOS);  
        OUT.normalWS = normalInputs.normalWS;  
  
        OUT.uv = TRANSFORM_TEX(IN.uv, _BaseMap);  
  
        OUTPUT_LIGHTMAP_UV(IN.lightmapUV, unity_LightmapST, OUT.lightmapUV);  
        OUTPUT_SH(OUT.normalWS, OUT.vertexSH);  
  
        OUT.vertexColor = IN.vertexColor;  
  
        return OUT;  
    }  
    
    float4 LitPassFragment(Varyings IN): SV_Target  
    {  
        float4 texColor = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv);  
  
        #ifdef _ALPHATEST_ON  
            clip(texColor.a - _Cutoff);  
        #endif  
  
        // 烘焙GI信息（1、球谐光照，2、光照贴图，3、光照探针）  
        half3 bakedGI = SAMPLE_GI(IN.lightmapUV, IN.vertexSH, IN.normalWS);  
        float4 PosShadowCoord = TransformWorldToShadowCoord(IN.posWS);  
        Light light = GetMainLight(PosShadowCoord);  
        half3 lightColor = light.color * light.distanceAttenuation * light.shadowAttenuation;  
        half3 lambertLightColor = LightingLambert(lightColor, light.direction, IN.normalWS);  
  
        float4 shading = float4(bakedGI + lambertLightColor, 1);  
        float4 albedo = texColor * _BaseColor * IN.vertexColor;  
        return shading + albedo;  
    }    
    ENDHLSL  
}
```

使用`LIGHTMAP_ON`宏，用于控制是否开启烘焙。

在`Attribute`中增加`lightmapUV`字段，表示光照贴图的uv坐标。`Varyings`中，增加定义`DECLARE_LIGHTMAP_OR_SH(lightmapUV, vertexSH, 3)`，这会根据是否有`LIGHTMAP_ON`定义，声明所需的变量，具体定义如下：
```hlsl
#if defined(LIGHTMAP_ON)  
    #define DECLARE_LIGHTMAP_OR_SH(lmName, shName, index) float2 lmName : TEXCOORD##index  
    #define OUTPUT_LIGHTMAP_UV(lightmapUV, lightmapScaleOffset, OUT) OUT.xy = lightmapUV.xy * lightmapScaleOffset.xy + lightmapScaleOffset.zw;  
    #define OUTPUT_SH(normalWS, OUT)  
#else  
    #define DECLARE_LIGHTMAP_OR_SH(lmName, shName, index) half3 shName : TEXCOORD##index  
    #define OUTPUT_LIGHTMAP_UV(lightmapUV, lightmapScaleOffset, OUT)    #define OUTPUT_SH(normalWS, OUT) OUT.xyz = SampleSHVertex(normalWS)#endif
```
可以看到，如果开启了`LIGHTMAP_ON`，就会在声明一个`lightmapUV`变量，否则就声明一个`vertexSH`变量。

在顶点着色器中，调用`OUTPUT_LIGHTMAP_UV`和`OUTPUT_SH`用于对计算光照贴图的uv坐标

片元着色器中，调用`SAMPLE_GI`对光照贴图进行采样，使得烘焙好的光照贴图生效。

使用`GetMainLight`获取场景中的主光源数据，然后通过光源数据，使用`LightingLambert`计算兰伯特光照。

## Unity中的GI

```cardlink
url: https://zhuanlan.zhihu.com/p/684579536
title: "Unity URP 中的 GI"
description: "记录一下 Unity 中的 GI 系统在 Unity URP Shader 中的使用 OverviewGI 包括静态 GI 和动态 GI，静态 GI 由 Baked GI System 贡献，动态 GI 由 Enlighten Lighting System 贡献 将场景的 Lighting Mode 设置为 Sha…"
host: zhuanlan.zhihu.com
```

```cardlink
url: https://blog.csdn.net/weixin_44518102/article/details/135383085
title: "Unity SRP 管线【第五讲：URP烘培光照】_urpshader实现光照烘焙-CSDN博客"
description: "文章浏览阅读1.4k次，点赞24次，收藏24次。本节，我们将跟随数据流向讲解UEP管线中的烘培光照。_urpshader实现光照烘焙"
host: blog.csdn.net
```

```cardlink
url: https://blog.csdn.net/weixin_44518102/article/details/135085765
title: "Unity SRP 管线【第五讲：自定义烘培光照】_samplesinglelightmap-CSDN博客"
description: "文章浏览阅读1.1k次，点赞21次，收藏28次。细节内容详见catlike 这里只做效果展示！！！！_samplesinglelightmap"
host: blog.csdn.net
```

```cardlink
url: https://zhuanlan.zhihu.com/p/393639054
title: "URP源码阅读之GI"
description: "一、传递数据给GPU Unity在GPU渲染物体时如果想使用lightmap或lightprobe等信息，首先需要通知Unity把这些相关数据传递给GPU。这个是通过设置DrawingSettings里面的perObjectData实现的，具体的URP代码如下： 通过…"
host: zhuanlan.zhihu.com
image: https://picx.zhimg.com/v2-d64b539cbf04be1838a4f7c1e967f8b5_720w.jpg?source=172ae18b
```

```cardlink
url: https://zhuanlan.zhihu.com/p/337121368
title: "Unity通用渲染管线（URP）系列（五）——烘焙光（Baked Light）"
description: "200+篇教程总入口，欢迎收藏：放牛的星星：[教程汇总+持续更新]Unity从入门到入坟——收藏这一篇就够了本章主要内容： 1、烘焙静态的全局光照 2、采样光贴图、探针和LPPVs。 3、创建元通道（meta pass） 4、支持自…"
host: zhuanlan.zhihu.com
image: https://picx.zhimg.com/v2-daa0c77a118c750f54d79bd9c665be4e_720w.jpg?source=172ae18b
```