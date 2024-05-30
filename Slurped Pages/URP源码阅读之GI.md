---
link: https://zhuanlan.zhihu.com/p/393639054
site: 知乎专栏
excerpt: 一、传递数据给GPU
  Unity在GPU渲染物体时如果想使用lightmap或lightprobe等信息，首先需要通知Unity把这些相关数据传递给GPU。这个是通过设置DrawingSettings里面的perObjectData实现的，具体的URP代码如下：
  通过…
tags:
  - slurp/Unity（游戏引擎）
  - slurp/shader
  - slurp/渲染
slurped: 2024-05-21T10:12:22.576Z
title: URP源码阅读之GI
---

一、传递数据给GPU

Unity在GPU渲染物体时如果想使用lightmap或lightprobe等信息，首先需要通知Unity把这些相关数据传递给GPU。这个是通过设置DrawingSettings里面的perObjectData实现的，具体的URP代码如下：

![](https://pic1.zhimg.com/v2-13a32738114ada4d19a68a62332d3f98_b.jpg)

通过跟踪代码可以发现，RenderingData里面的perObjectData是由下面这个方法赋值的：

![](https://pic1.zhimg.com/v2-46b47ec89b17feb2cc5dfc658f64947c_b.jpg)

由代码可见，默认情况下URP会将ReflectionProbes、Lightmaps、LightPrbe、LightData、OcclusionProbe等数据传递给GPU。这里做个小小的测试，把代码中PerObjectData.Lightmaps|注释掉后，看一个烘焙后的场景的情况：

![](https://pic4.zhimg.com/v2-5c8ac20cf2b0471c31a6bed74b88ac7b_b.jpg)

可以看到，原本正常运行的场景现在无法正常显示烘焙的信息了。

二、采样数据

1.LitForwardPass.LitPassVertex的代码如下：

```
// Used in Standard (Physically Based) shader
Varyings LitPassVertex(Attributes input)
{
    Varyings output = (Varyings)0;

    UNITY_SETUP_INSTANCE_ID(input);
    UNITY_TRANSFER_INSTANCE_ID(input, output);
    UNITY_INITIALIZE_VERTEX_OUTPUT_STEREO(output);

    VertexPositionInputs vertexInput = GetVertexPositionInputs(input.positionOS.xyz);

    // normalWS and tangentWS already normalize.
    // this is required to avoid skewing the direction during interpolation
    // also required for per-vertex lighting and SH evaluation
    VertexNormalInputs normalInput = GetVertexNormalInputs(input.normalOS, input.tangentOS);
    float3 viewDirWS = GetCameraPositionWS() - vertexInput.positionWS;
    half3 vertexLight = VertexLighting(vertexInput.positionWS, normalInput.normalWS);
    half fogFactor = ComputeFogFactor(vertexInput.positionCS.z);

    output.uv = TRANSFORM_TEX(input.texcoord, _BaseMap);

    // already normalized from normal transform to WS.
    output.normalWS = normalInput.normalWS;
    output.viewDirWS = viewDirWS;
#ifdef _NORMALMAP
    real sign = input.tangentOS.w * GetOddNegativeScale();
    output.tangentWS = half4(normalInput.tangentWS.xyz, sign);
#endif

    OUTPUT_LIGHTMAP_UV(input.lightmapUV, unity_LightmapST, output.lightmapUV);
    OUTPUT_SH(output.normalWS.xyz, output.vertexSH);

    output.fogFactorAndVertexLight = half4(fogFactor, vertexLight);

#if defined(REQUIRES_WORLD_SPACE_POS_INTERPOLATOR)
    output.positionWS = vertexInput.positionWS;
#endif

#if defined(REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR)
    output.shadowCoord = GetShadowCoord(vertexInput);
#endif

    output.positionCS = vertexInput.positionCS;

    return output;
}
```

其中和GI相关的代码有：

OUTPUT_LIGHTMAP_UV(input.lightmapUV, unity_LightmapST, output.lightmapUV);

和OUTPUT_SH(output.normalWS.xyz, output.vertexSH);

相关宏定义在Lighting.hlsl中：

```
#ifdef LIGHTMAP_ON
    #define DECLARE_LIGHTMAP_OR_SH(lmName, shName, index) float2 lmName : TEXCOORD##index
    #define OUTPUT_LIGHTMAP_UV(lightmapUV, lightmapScaleOffset, OUT) OUT.xy = lightmapUV.xy * lightmapScaleOffset.xy + lightmapScaleOffset.zw;
    #define OUTPUT_SH(normalWS, OUT)
#else
    #define DECLARE_LIGHTMAP_OR_SH(lmName, shName, index) half3 shName : TEXCOORD##index
    #define OUTPUT_LIGHTMAP_UV(lightmapUV, lightmapScaleOffset, OUT)
    #define OUTPUT_SH(normalWS, OUT) OUT.xyz = SampleSHVertex(normalWS)
#endif
```

OUTPUT_LIGHTMAP_UV宏定义比较简单，就是对uv值进行缩放和偏移处理。

OUTPUT_SH宏定义是调用了SampleSHVertex方法，是逐顶点地对球谐函数进行采样：

```
// SH Vertex Evaluation. Depending on target SH sampling might be
// done completely per vertex or mixed with L2 term per vertex and L0, L1
// per pixel. See SampleSHPixel
half3 SampleSHVertex(half3 normalWS)
{
#if defined(EVALUATE_SH_VERTEX)
    return max(half3(0, 0, 0), SampleSH(normalWS));
#elif defined(EVALUATE_SH_MIXED)
    // no max since this is only L2 contribution
    return SHEvalLinearL2(normalWS, unity_SHBr, unity_SHBg, unity_SHBb, unity_SHC);
#endif

    // Fully per-pixel. Nothing to compute.
    return half3(0.0, 0.0, 0.0);
}
```

这里需要对球谐函数有个初步了解：

球谐函数是基于预计算辐射度传输理论实现的一种实时渲染技术。预计算辐射度传输技术能够实时重现在区域面光源照射下的全局照明效果。这种技术通过在运行前对场景中光线的相互作用进行预计算，计算每个场景中每个物体表面点的光照信息，然后用球谐函数对这些预计算的光照信息数据进行编码，在运行时读取数据进行解码，重现光照效果。球谐光照使用新的光照方程来代替传统的光照方程，并将这些新方程的相关信息使用球谐函数投影到频域，存储成一些列的系数。在运行渲染过程中，利用这些预先存储的系数信息对原始的光照方程进行还原，并对待渲染的场景进行着色计算。这个计算过程是对无限积分进行有限近似的过程。简单地说，球谐光照的基本步骤就是把真实环境中连续的光照方程离散化，得到离散的光照方程，然后其对这些离散的光照方程进行分解，分解后进行球谐变换，得到球谐系数，在运行时根据球谐系数重新还原光照方程。

详细的推导可以看这个系列文章：

目前还看不懂~我暂时不求甚解地理解为：Unity将光照信息编码为unity_SHAr、unity_SHAg、unity_SHAb、unity_SHBr、unity_SHBg、unity_SHBb、unity_SHC等参数，然后采样的时候，通过一定的算法对参数进行解码。具体的解码方法有：

EVALUATE_SH_VERTEX是完全在vertex阶段完成球谐函数采样计算，EVALUATE_SH_MIXED是在vertex中完成L2 SH，在pixel中完成L0L1

SampleSH代码：

```
// Samples SH L0, L1 and L2 terms
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
half3 SampleSH9(half4 SHCoefficients[7], half3 N)
{
    half4 shAr = SHCoefficients[0];
    half4 shAg = SHCoefficients[1];
    half4 shAb = SHCoefficients[2];
    half4 shBr = SHCoefficients[3];
    half4 shBg = SHCoefficients[4];
    half4 shBb = SHCoefficients[5];
    half4 shCr = SHCoefficients[6];

    // Linear + constant polynomial terms
    half3 res = SHEvalLinearL0L1(N, shAr, shAg, shAb);

    // Quadratic polynomials
    res += SHEvalLinearL2(N, shBr, shBg, shBb, shCr);

    return res;
}
```

SampleSH9就是将SHEvalLinearL0L1（l=0,1时的光照结果）和SHEvalLinearL2（l=2时的光照结果）的光照结果叠加起来。

在LIGHTMAP_ON定义的时候会使用采样lightmap的方式计算GI，而相反则会使用采样球谐函数的方式计算。静态物体（Contribute GI 为static）的LIGHTMAP_ON为定义的，动态物体为未定义，这个是由Unity内部完成的。

2.LitForwardPass.LitPassFragment

```
// Used in Standard (Physically Based) shader
half4 LitPassFragment(Varyings input) : SV_Target
{
    UNITY_SETUP_INSTANCE_ID(input);
    UNITY_SETUP_STEREO_EYE_INDEX_POST_VERTEX(input);

    SurfaceData surfaceData;
    InitializeStandardLitSurfaceData(input.uv, surfaceData);

    InputData inputData;
    InitializeInputData(input, surfaceData.normalTS, inputData);

    half4 color = UniversalFragmentPBR(inputData, surfaceData.albedo, surfaceData.metallic, surfaceData.specular, surfaceData.smoothness, surfaceData.occlusion, surfaceData.emission, surfaceData.alpha);

    color.rgb = MixFog(color.rgb, inputData.fogCoord);
    color.a = OutputAlpha(color.a, _Surface);

	return color;
}
```

和GI相关的代码：

1.InitializeInputData方法最后的部分：

![](https://pic1.zhimg.com/v2-c949eeae9fffc9e1b308cde5e4582260_b.png)

```
// We either sample GI from baked lightmap or from probes.
// If lightmap: sampleData.xy = lightmapUV
// If probe: sampleData.xyz = L2 SH terms
#ifdef LIGHTMAP_ON
#define SAMPLE_GI(lmName, shName, normalWSName) SampleLightmap(lmName, normalWSName)
#else
#define SAMPLE_GI(lmName, shName, normalWSName) SampleSHPixel(shName, normalWSName)
#endif
```

这和Vertext阶段类似，静态物体采样光照贴图，动态物体采样球谐光照作为GI，不过这里的采样是逐像素采样。

2.UniversalFragmentPBR方法中的调用的MixRealtimeAndBakedGI方法

```
void MixRealtimeAndBakedGI(inout Light light, half3 normalWS, inout half3 bakedGI, half4 shadowMask)
{
#if defined(_MIXED_LIGHTING_SUBTRACTIVE) && defined(LIGHTMAP_ON)
    bakedGI = SubtractDirectMainLightFromLightmap(light, normalWS, bakedGI);
#endif
}
```

`#if defined(_MIXED_LIGHTING_SUBTRACTIVE) && defined(LIGHTMAP_ON)`意思是只有MixedLighting的LightMode定义为Subtractive模式时的静态物体才需要做这个操作。LightMode的设置是在LightSetting面板设置的：

![](https://pic1.zhimg.com/v2-e6f6e23d8d2677eb5dd42d642989d040_b.jpg)

SubtractDirectMainLightFromLightmap这个方法的主要功能是让静态物体能够接受到实时光产生的阴影：

```
half3 SubtractDirectMainLightFromLightmap(Light mainLight, half3 normalWS, half3 bakedGI)
{
    // Let's try to make realtime shadows work on a surface, which already contains
    // baked lighting and shadowing from the main sun light.
    // Summary:
    // 1) Calculate possible value in the shadow by subtracting estimated light contribution from 
    // the places occluded by realtime shadow:
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

思路是：

1.通过将从光照贴图采样的值和实时光照在此处的贡献值相减，得到一个阴影的估算值

2.将估算值和_SubtractiveShadowColor相比较，取最大值，然后使用shadowStrength在backedGI和估算值之间进行插值

3.取backedGI和估算值之间的最小值（更黑的那一个）

效果：静态物体可以接受实时阴影

![](https://pic4.zhimg.com/v2-ef1abf1235290ce4681c2b530fa11893_b.jpg)

注释掉SubtractDirectMainLightFromLightmap方法后，静态物体无法接受到实时阴影了：

![](https://pic2.zhimg.com/v2-c3dacbbb07fb269bc804ef94d7978a3d_b.jpg)

3.UniversalFragmentPBR方法中的调用的GlobalIllumination方法，计算全局光照值。

```
half3 GlobalIllumination(BRDFData brdfData, half3 bakedGI, half occlusion, half3 normalWS, half3 viewDirectionWS)
{
    half3 reflectVector = reflect(-viewDirectionWS, normalWS);
    half fresnelTerm = Pow4(1.0 - saturate(dot(normalWS, viewDirectionWS)));

    half3 indirectDiffuse = bakedGI * occlusion;
    half3 indirectSpecular = GlossyEnvironmentReflection(reflectVector, brdfData.perceptualRoughness, occlusion);

    return EnvironmentBRDF(brdfData, indirectDiffuse, indirectSpecular, fresnelTerm);
}
```

首先计算菲涅尔系数，然后计算间接光的高光，最后根据求得的几个数据计算间接光的BRDF值。

计算间接光的高光的代码如下：

```
half3 GlossyEnvironmentReflection(half3 reflectVector, half perceptualRoughness, half occlusion)
{
#if !defined(_ENVIRONMENTREFLECTIONS_OFF)
    half mip = PerceptualRoughnessToMipmapLevel(perceptualRoughness);
    half4 encodedIrradiance = SAMPLE_TEXTURECUBE_LOD(unity_SpecCube0, samplerunity_SpecCube0, reflectVector, mip);

#if !defined(UNITY_USE_NATIVE_HDR)
    half3 irradiance = DecodeHDREnvironment(encodedIrradiance, unity_SpecCube0_HDR);
#else
    half3 irradiance = encodedIrradiance.rgb;
#endif

    return irradiance * occlusion;
#endif // GLOSSY_REFLECTIONS

    return _GlossyEnvironmentColor.rgb * occlusion;
}
```

这里根据材质是否接受反射（_ENVIRONMENTREFLECTIONS_OFF）来返回两种结果：如果不接受发射光，则直接返回环境光*遮挡系数。否则会采样天空盒，返回采样值*遮挡系数。