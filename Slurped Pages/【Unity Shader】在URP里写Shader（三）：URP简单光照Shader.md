---
link: https://zhuanlan.zhihu.com/p/336670858
site: 知乎专栏
excerpt: Acshy：【Unity Shader】在URP里写Shader（一）：介绍-从Built-In到URP Acshy：【Unity
  Shader】在URP里写Shader（二）：从一个Unlit Shader开始 Acshy：【Unity
  Shader】在URP里写Shader（三）：URP简单光照Shade…
tags:
  - slurp/Unity（游戏引擎）
  - slurp/shader
  - slurp/游戏开发
slurped: 2024-05-21T10:16:18.506Z
title: 【Unity Shader】在URP里写Shader（三）：URP简单光照Shader
---

[Acshy：【Unity Shader】在URP里写Shader（一）：介绍-从Built-In到URP](https://zhuanlan.zhihu.com/p/336428407)

[Acshy：【Unity Shader】在URP里写Shader（二）：从一个Unlit Shader开始](https://zhuanlan.zhihu.com/p/336508199)

[Acshy：【Unity Shader】在URP里写Shader（三）：URP简单光照Shader](https://zhuanlan.zhihu.com/p/336670858)

在上一篇我们通过一个Unlit Shader熟悉了URP里的Shader怎么写。

那么在这一篇，我们写一个简单的Lambert+BlinPhong的简单光照Shader，来熟悉一下URP中和光照相关的API。

## Lighiting库函数

在URP中所有和光照相关的函数都在Lighting.hlsl这个文件中，包含了获取光照信息计算简单光照乃至计算PBR的相关功能函数。

我们需要在Shader中引入这个库：

```
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"
```

## 光照模型

Lambert和BlinPhong基本上是光照计算中最基础的两个公式了。我们用Lambert来计算漫反射（Diffuse），用BlinPhong方法计算高光（Specular）。

![](https://pic1.zhimg.com/v2-fdd15e7a429bdfbd4a2a5064f05fa538_b.png)

![](https://pic1.zhimg.com/v2-523c5c26f87e29a760b1ffa566f62264_b.jpg)

具体公式就不展开介绍了，大家可以直接看[其它参考](https://link.zhihu.com/?target=https%3A//blog.51cto.com/aonaufly/1548254%3Fsource%3Ddrt)。

## 相关变量获取

从公式中可以知道，要完成光照的计算，需要在同一坐标空间下的法线、光线方向、视线方向（用于求半角向量）以及光照颜色、高光颜色、表面平滑度等。

我们先只计算主光源的光照，在世界坐标系下计算，需要获取世界坐标系下的相关向量。

视线方向（ViewDir）,下面的GetCameraPositionWS()是Lighting.hlsl中获取相机位置的方法：

```
VertexPositionInputs positionInputs = GetVertexPositionInputs(IN.positionOS.xyz);
OUT.viewDirWS = GetCameraPositionWS() - positionInputs.positionWS; 
```

法线（NormalDir）：

```
VertexNormalInputs normalInputs = GetVertexNormalInputs(IN.normalOS.xyz);
OUT.normalWS = normalInputs.normalWS;
```

光线方向（LightDir），GetMainLight()方法能获取主光源的颜色、方向、衰减等信息，非常方便：

```
 Light light = GetMainLight();
 float3 lightDirWS = light.direction;
```

## 计算光照

当一切准备就绪，我们就能进行计算了。虽然公式本身就非常简单，但是我们能通过调用Lighting.hlsl的相关函数让这一切变得更加方便！

```
half3 diffuse = baseMap.xyz*_BaseColor*LightingLambert(light.color, light.direction, IN.normalWS);
//等同于：
//half3 diffuse = lightColor*saturate(dot(normal, lightDir));

half3 specular = LightingSpecular(light.color, light.direction, normalize(IN.normalWS), normalize(IN.viewDirWS), _SpecularColor, _Smoothness);
// 等同于：
//float3 halfVec = SafeNormalize(float3(lightDir) + float3(viewDir));
//half NdotH = saturate(dot(normal, halfVec));
//half3 specular = lightColor * specular.rgb * pow(NdotH, smoothness);

half3 color=diffuse+specular;
```

渲染效果：

![](https://pic1.zhimg.com/v2-cf6ca726bc2020e09e1a746838ad5e78_b.jpg)

Lambert+BlinPhong光照

## 处理多个光源

上面我们只处理了主光源，现在我们来对其他光源进行处理。

在[第一篇文章](https://zhuanlan.zhihu.com/p/336428407)中我们提到过，URP使用的单Pass的方式计算多个光源。所以我们需要在一个Pass中遍历所有光源，对每个光源进行上文中的计算。

**方案一：逐顶点计算附加光源**

处于性能考虑，Unity URP的默认材质中一般对主光源进行逐像素光照，对于其他光源进行逐顶点光照（我们可以在URP Asset中更改这一设置）。URP封装了在逐顶点漫反射的方法，我们只需要在逐顶点着色器中调用就能计算附加光照的漫反射。该方法将所有附加光的漫反射计算结果进行累加，返回附加光的累加颜色。

```
half3 vertexLight = VertexLighting(vertexInput.positionWS, normalInput.normalWS);
```

**方案二：逐像素计算每个附加光源**

如果希望每个光源都能够进行逐像素的漫反射和高光反射计算，那么我们就需要在片元着色器中遍历每一个光源，并进行和上面一样的光照计算。

```
uint pixelLightCount = GetAdditionalLightsCount();
for (uint lightIndex = 0; lightIndex < pixelLightCount; ++lightIndex)
{
    Light light = GetAdditionalLight(lightIndex, IN.positionWS);
    diffuse += LightingLambert(light.color, light.direction, IN.normalWS);
    specular += LightingSpecular(light.color, light.direction, normalize(IN.normalWS), normalize(IN.viewDirWS), _SpecularColor, _Smoothness);
}
```

GetAdditionalLightsCount()能够获取到影响这个片段的附加光源数量，但是如果数量超过了URP中设定的附加光照上限，就会返回附加光照上限的数量。

GetAdditionalLight(lightIndex, IN.positionWS);方法会按照index去找到对应的光源，并根据提供的片段世界坐标位置计算光照和阴影衰减，并存储在返回的Light结构体内。

![](https://pic2.zhimg.com/v2-94d6d7609b3c5581931ca7cef161a72d_b.jpg)

逐像素多光源光照

## 阴影Pass

我们目前只写了一个渲染Pass，并没有处理阴影相关的内容。

一般在Buit-In管线里，我们只需要最后FallBack返回到系统的Diffuse Shader，管线就会去里面找到他处理阴影的Pass。但是在URP中，一个Shader中的所有Pass需要有一致的CBuffer，否则便会打破SRP Batcher，影响效率。

而系统默认SimpleLit的Shader中的CBuffer内容和我的写的并不一致，所以我们需要把它阴影处理的Pass复制一份，并且删掉其中引用的SimpleLitInput.hlsl（相关CBuffer的声明在这里面）。

```
Pass
        {
            Name "ShadowCaster"
            Tags{"LightMode" = "ShadowCaster"}

            ZWrite On
            ZTest LEqual
            Cull[_Cull]

            HLSLPROGRAM
            // Required to compile gles 2.0 with standard srp library
            #pragma prefer_hlslcc gles
            #pragma exclude_renderers d3d11_9x
            #pragma target 2.0

            // -------------------------------------
            // Material Keywords
            #pragma shader_feature _ALPHATEST_ON
            #pragma shader_feature _GLOSSINESS_FROM_BASE_ALPHA

            //--------------------------------------
            // GPU Instancing
            #pragma multi_compile_instancing

            #pragma vertex ShadowPassVertex
            #pragma fragment ShadowPassFragment


            //由于这段代码中声明了自己的CBUFFER，与我们需要的不一样，所以我们注释掉他
            //#include "Packages/com.unity.render-pipelines.universal/Shaders/SimpleLitInput.hlsl"
            //它还引入了下面2个hlsl文件
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/SurfaceInput.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/Shaders/ShadowCasterPass.hlsl"
            ENDHLSL
        }
```

到此为止，我们实现了一个能够处理多光源情况的简单漫反射和镜面反射的Shader。

下面是完整的参考代码：

```
Shader "Custom/URPSimpleLit"
{
    Properties
    {
        _BaseMap ("Base Texture",2D) = "white"{}
        _BaseColor("Base Color",Color) = (1,1,1,1)
        _SpecularColor("SpecularColor",Color)=(1,1,1,1)
        _Smoothness("Smoothness",float)=10
        _Cutoff("Cutoff",float)=0.5
    }
    SubShader
    {
        Tags
        {
            "RenderPipeline"="UniversalPipeline"
            "Queue"="Geometry"
            "RenderType"="Opaque"
        }

        HLSLINCLUDE
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
        CBUFFER_START(UnityPerMaterial)
        float4 _BaseMap_ST;
        float4 _BaseColor;
        float4 _SpecularColor;
        float _Smoothness;
        float _Cutoff;
        CBUFFER_END
        
        ENDHLSL
    

        Pass
        {
            Name "URPSimpleLit" 
            Tags{"LightMode"="UniversalForward"}

            HLSLPROGRAM            
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            #pragma vertex vert
            #pragma fragment frag

            struct Attributes
            {
                float4 positionOS : POSITION;
                float4 normalOS : NORMAL;
                float2 uv : TEXCOORD0;
            };
            struct Varings
            {
                float4 positionCS : SV_POSITION;
                float2 uv : TEXCOORD0;
                float3 positionWS : TEXCOORD1;
                float3 viewDirWS : TEXCOORD2;
                float3 normalWS : TEXCOORD3;
            };
            
            TEXTURE2D(_BaseMap);
            SAMPLER(sampler_BaseMap);    

            Varings vert(Attributes IN)
            {
                Varings OUT;
                VertexPositionInputs positionInputs = GetVertexPositionInputs(IN.positionOS.xyz);
                VertexNormalInputs normalInputs = GetVertexNormalInputs(IN.normalOS.xyz);
                OUT.positionCS = positionInputs.positionCS;
                OUT.positionWS = positionInputs.positionWS;
                OUT.viewDirWS = GetCameraPositionWS() - positionInputs.positionWS;
                OUT.normalWS = normalInputs.normalWS;
                OUT.uv=TRANSFORM_TEX(IN.uv,_BaseMap);
                return OUT;
            }
            
            float4 frag(Varings IN):SV_Target
            {
                
                half4 baseMap = SAMPLE_TEXTURE2D(_BaseMap, sampler_BaseMap, IN.uv);      
                //计算主光
                Light light = GetMainLight();
                half3 diffuse = LightingLambert(light.color, light.direction, IN.normalWS);
                half3 specular = LightingSpecular(light.color, light.direction, normalize(IN.normalWS), normalize(IN.viewDirWS), _SpecularColor, _Smoothness);
                //计算附加光照
                uint pixelLightCount = GetAdditionalLightsCount();
                for (uint lightIndex = 0; lightIndex < pixelLightCount; ++lightIndex)
                {
                    Light light = GetAdditionalLight(lightIndex, IN.positionWS);
                    diffuse += LightingLambert(light.color, light.direction, IN.normalWS);
                    specular += LightingSpecular(light.color, light.direction, normalize(IN.normalWS), normalize(IN.viewDirWS), _SpecularColor, _Smoothness);
                }

                half3 color=baseMap.xyz*diffuse*_BaseColor+specular;
                clip(baseMap.a-_Cutoff);
                return float4(color,1);
            }
            ENDHLSL            
        }

        
          Pass
        {
            Name "ShadowCaster"
            Tags{"LightMode" = "ShadowCaster"}

            ZWrite On
            ZTest LEqual
            Cull[_Cull]

            HLSLPROGRAM
            // Required to compile gles 2.0 with standard srp library
            #pragma prefer_hlslcc gles
            #pragma exclude_renderers d3d11_9x
            #pragma target 2.0

            // -------------------------------------
            // Material Keywords
            #pragma shader_feature _ALPHATEST_ON
            #pragma shader_feature _GLOSSINESS_FROM_BASE_ALPHA

            //--------------------------------------
            // GPU Instancing
            #pragma multi_compile_instancing

            #pragma vertex ShadowPassVertex
            #pragma fragment ShadowPassFragment


            //由于这段代码中声明了自己的CBUFFER，与我们需要的不一样，所以我们注释掉他
            //#include "Packages/com.unity.render-pipelines.universal/Shaders/SimpleLitInput.hlsl"
            //它还引入了下面2个hlsl文件
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/SurfaceInput.hlsl"
            #include "Packages/com.unity.render-pipelines.universal/Shaders/ShadowCasterPass.hlsl"
            ENDHLSL
        }

    }
}
```

## 参考文章

[Writing Shader Code for the Universal RP](https://link.zhihu.com/?target=https%3A//cyangamedev.wordpress.com/2020/06/05/urp-shader-code/8/)

最好的参考其实就是直接看URP默认提供的Shader和相关工具库，在Unity的Project窗口中，可以在Packages/com.unity.render-pipelines.universal/ShaderLibrary 目录下面找到他们。

[https://github.com/Unity-Technologies/Graphics/tree/master/com.unity.render-pipelines.universal/ShaderLibrary](https://link.zhihu.com/?target=https%3A//github.com/Unity-Technologies/Graphics/tree/master/com.unity.render-pipelines.universal/ShaderLibrary)

至此大部分从Buit-In管线到URP管线写Shader的基础内容就差不多了！如果这几篇文章有人看，之后又有时间，再看看是不是继续介绍一下URP的BRDF相关的函数（咕咕咕）。

**如果这篇文章对你有用，收藏之余希望能点个赞哈哈！**