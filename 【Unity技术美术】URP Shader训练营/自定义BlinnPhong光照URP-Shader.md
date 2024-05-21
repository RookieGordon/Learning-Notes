---
tags:
  - Unity
  - URP
  - Shader
---
## [[【Unity Shader】在URP里写Shader（三）：URP简单光照Shader]]

```HLSL
Shader "Custom/Lit/Basic/SimpleLitShader"  
{  
    Properties  
    {  
        [MainTexture] _BaseMap ("Main Texture", 2D)= "white"{}  
        [MainColor] _BaseColor ("Diffuse Colore", Color) = (1,1,1,1)  
  
        [Toggle(_NORMALMAP)]_NormalMapTog("Using Normal Map", int) = 0  
        [Normal][NoScaleOffset] _BumpMap("Normal Map", 2D) = "bump"{}  
  
        [Toggle(_ALPHATEST_ON)] _AlphaTest("Aplpha Test", int) = 0  
        _Cutoff("Aplha test value", Range(0,1)) = 0  
  
        [Enum(Off,0, Front,1, Back,2)] _CullMode("Cull Mode", int) = 2  
  
        [Toggle(_EMISSION)]_EmissionTog("Using Emission", int) = 0  
        [HDR]_EmissionColor("Emission Color", Color) = (0,0,0,0)  
        [NoScaleOffset] _EmissionMap("Emission Map", 2D) = "white"{}  
  
        [Toggle(_SPECGLOSSMAP)] _SpecularTog("Using Specular And Gloss", int) = 0  
        [Toggle(_GLOSSINESS_FROM_BASE_ALPHA)] _GlossSource("Whether the source of the glossiness is the Albedo Alpha (if on) or the SpecularMap (if off)", int) = 0  
        _SpecColor("Specular Color", Color) = (0.5, 0.5, 0.5, 0.5)  
        [NoScaleOffset] _SpecGlossMap("Specular Map", 2D) = "white"{}  
  
        _Smoothness("Smoothness", Range(0,1)) = 0.5  
    }  
  
    SubShader  
    {  
        Tags  
        {  
            "RenderPipeline" = "UniversalPipline"  
            "RenderType" = "Opaque"  
            "Queue" = "Geometry"  
        }  
  
        HLSLINCLUDE  
        #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Core.hlsl"  
        CBUFFER_START(UnityPerMaterial)  
            float4 _BaseColor;  
            float4 _BaseMap_ST;  
            float _Cutoff;  
            float4 _EmissionColor;  
            float4 _SpecColor;  
            float _Smoothness;  
            TEXTURE2D(_SpecGlossMap);  
            SAMPLER(sampler_SpecGlossMap);  
        CBUFFER_END  
        ENDHLSL  
        Pass       
        {  
            Name "Custom Basic Forward Lit"  
            Tags {  "LightMode" = "UniversalForward"  }  
            Cull [_CullMode]  
  
            HLSLPROGRAM  
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"  
            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/SurfaceInput.hlsl"  
            #pragma vertex LitPassVertex  
            #pragma fragment LitPassFragment  
  
            #pragma shader_feature _ALPHATEST_ON  
            #pragma shader_feature _NORMALMAP  
            #pragma shader_feature _EMISSION  
            #pragma shader_feature _SPECGLOSSMAP  
            #define _SPECULAR_COLOR // 总是打开高光反射  
            #pragma shader_feature _GLOSSINESS_FROM_BASE_ALPHA  
            #pragma multi_compile LIGHTMAP_ON  
            #pragma multi_compile _MAIN_LIGHT_SHADOWS  
            #pragma multi_compile _MAIN_LIGHT_SHADOWS_CASCADE  
            #pragma multi_compile _ADDITIONAL_LIGHTS  
            #pragma multi_compile _ADDITIONAL_LIGHT_SHADOWS  
  
            struct Attribute  
            {  
                float3 posOS : POSITION;  
                float3 normalOS : NORMAL;  
#ifdef _NORMALMAP  
                float4 tangentOS: TANGENT;  
#endif  
                float2 uv : TEXCOORD0;  
                // 光照贴图，离线烘焙出光照对物体的影响，转换成贴图，贴到物体表面  
                float2 lightmapUV: TEXCOORD1;  
                float4 vertexColor: COLOR;  
            };  
            struct Varyings  
            {  
                float4 posCS: SV_POSITION;  
                float3 posWS: TEXCOORD0;  
                float2 uv: TEXCOORD1;  
                DECLARE_LIGHTMAP_OR_SH(lightmapUV, vertexSH, 2);  
#ifdef _NORMALMAP  
                half4 normalWS: TEXCOORD3;  
                half4 tangentWS: TEXCOORD4;                
                half4 bitangentWS: TEXCOORD5;
#else  
                float3 normalWS: TEXCOORD3;  
#endif  
  
#ifdef _ADDITIONAL_LIGHTS_VERTEX  
				// x: 雾效信息； yzw：顶点光照信息  
                half4 fogFactorAndVertexLight: TEXCOORD6;  
#else  
                half fogFactor: TEXCOORD6;  
#endif  

#ifdef REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR  
                float4 shadowCoord: TEXCOORD7;  
#endif  
                float4 vertexColor: COLOR;  
            };  
            
            Varyings LitPassVertex(Attribute IN)  
            {                
	            Varyings OUT = (Varyings)0;  
  
                VertexPositionInputs posInputs GetVertexPositionInputs(
													                IN.posOS); 
                OUT.posCS = posInputs.positionCS;  
                OUT.posWS = posInputs.positionWS;  
  
                VertexNormalInputs normalInputs;  
#ifdef _NORMALMAP  
                float3 viewDir = GetWorldSpaceViewDir(OUT.posWS);  
                normalInputs = GetVertexNormalInputs(IN.normalOS, 
										             IN.tangentOS);
                // 充分利用寄存器空间  
                OUT.normalWS = half4(normalInputs.normalWS.xyz, viewDir.x);  
                OUT.tangentWS = half4(normalInputs.tangentWS.xyz, viewDir.y);  
                OUT.bitangentWS = half4(normalInputs.bitangentWS.xyz,
                                        viewDir.z);
#else  
                normalInputs = GetVertexNormalInputs(IN.normalOS);  
                OUT.normalWS = NormalizeNormalPerVertex(
										            normalInputs.normalWS);  
#endif  
  
                half fogFator = ComputeFogFactor(posInputs.positionCS.z);  
#ifdef _ADDITIONAL_LIGHTS_VERTEX  
                half3 vertexLight = VertexLighting(posInputs.positionWS,
									               normalInputs.normalWS);  
                OUT.fogFactorAndVertexLight = half4(fogFator, vertexLight);
#else  
                OUT.fogFactor = fogFator;  
#endif  
  
#ifdef REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR  
                OUT.shadowCoord = GetShadowCoord(posInputs);  
#endif  
  
                OUT.uv = TRANSFORM_TEX(IN.uv, _BaseMap);  
  
                OUTPUT_LIGHTMAP_UV(IN.lightmapUV, 
					               unity_LightmapST, 
					               OUT.lightmapUV);  
                OUTPUT_SH(OUT.normalWS, OUT.vertexSH);  
  
                OUT.vertexColor = IN.vertexColor;  
  
                return OUT;  
            }  
            
            half4 SampleSpecularSmoothness(float2 uv, 
                                half alpha, 
                                half4 specColor,  
						        TEXTURE2D_PARAM(specMap, sampler_specMap))  
            {                
                half4 specularSmoothness = half4(0, 0, 0, 1);  
#ifdef _SPECGLOSSMAP  
                specularSmoothness = SAMPLE_TEXTURE2D(specMap,
											          sampler_specMap, 
										              uv) * specColor;  
#elif defined(_SPECULAR_COLOR)  
                specularSmoothness = specColor;
#endif  
  
#ifdef _GLOSSINESS_FROM_BASE_ALPHA  
                specularSmoothness.a = alpha;  
#endif  
  
                return specularSmoothness;  
            } 
             
            void InitSurfaceData(Varyings IN, out SurfaceData surfaceData)  
            {                
	            surfaceData = (SurfaceData)0;  
                half4 baseMap = SAMPLE_TEXTURE2D(_BaseMap, 
									            sampler_BaseMap, 
									            IN.uv);  
                half4 diffuse = baseMap * _BaseColor * IN.vertexColor;  
#ifdef _ALPHATEST_ON  
                clip(diffuse.a - _Cutoff);  
#endif  
                surfaceData.albedo = diffuse.rgb;  
  
                surfaceData.normalTS = SampleNormal(IN.uv,
										             _BumpMap,  
										             sampler_BumpMap);  
  
                surfaceData.emission = SampleEmission(IN.uv, 
										              _EmissionColor, 
										              _EmissionMap, 
										              sampler_EmissionMap);  
  
                surfaceData.occlusion = 1.0;  
  
                half4 specular = SampleSpecularSmoothness(IN.uv, 
											        baseMap.a, 
											        _SpecColor, 
											        _SpecGlossMap,  
									                sampler_SpecGlossMap);                
                surfaceData.specular = specular.rgb;  
                surfaceData.smoothness = specular.a * _Smoothness;  
            }  
            
            void InitInputData(Varyings IN, half3 normalTS, out InputData inputData)  
            {                
	            inputData = (InputData)0; 
	             
                inputData.positionWS = IN.posWS;  
  
#ifdef _NORMALMAP  
                inputData.normalWS = TransformTangentToWorld(normalTS, 
									                half3x3(IN.tangentWS.xyz, 
									                IN.bitangentWS.xyz, 
									                IN.normalWS.xyz));  
#else  
                inputData.normalWS = IN.normalWS;  
#endif  
                inputData.normalWS NormalizeNormalPerPixel(
										                inputData.normalWS);  
  
#ifdef _NORMALMAP  
                inputData.viewDirectionWS = half3(IN.normalWS.w, 
								                  IN.tangentWS.w, 
								                  IN.bitangentWS.w);  
#else  
                inputData.viewDirectionWS = GetWorldSpaceViewDir(IN.posWS);  
#endif  
                inputData.viewDirectionWS = NormalizeNormalPerPixel(
									            inputData.viewDirectionWS);  
  
#ifdef REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR  
                inputData.shadowCoord = IN.shadowCoord;  
#elif MAIN_LIGHT_CALCULATE_SHADOWS  
                inputData.shadowCoord = TransformWorldToShadowCoord(IN.posWS);  
#else  
                inputData.shadowCoord = float4(0,0,0,0);  
#endif  
  
#ifdef _ADDITIONAL_LIGHTS_VERTEX  
                inputData.vertexLighting = IN.fogFactorAndVertexLight.yzw;  
                inputData.fogCoord = IN.fogFactorAndVertexLight.x;#else  
                inputData.vertexLighting = half3(0,0,0);  
                inputData.fogCoord = IN.fogFactor;  
#endif  
  
                inputData.bakedGI = SAMPLE_GI(IN.lightmapUV, 
								                IN.vertexSH, 
								                IN.normalWS);  
  
                inputData.normalizedScreenSpaceUV = GetNormalizedScreenSpaceUV(
									                IN.posCS);  
  
                inputData.shadowMask = SAMPLE_SHADOWMASK(IN.lightmapUV);  
            }  
            
            float4 LitPassFragment(Varyings IN): SV_TARGET  
            {  
                SurfaceData surfaceData;  
                InitSurfaceData(IN, surfaceData);  
                InputData inputData;  
                InitInputData(IN, surfaceData.normalTS, inputData);  
                half4 color = UniversalFragmentBlinnPhong(inputData, surfaceData);  
  
                return color;  
            }            
            ENDHLSL  
        }  
  
        阴影Pass { ... }  
  
        深度Pass { ... }   
  
        深度法线Pass { ... }  
    }}
```

在属性中，增加了法线，自发光，高光，光泽度等相关属性。

使用`_GLOSSINESS_FROM_BASE_ALPHA`宏，控制平滑度的来源，从主纹理的alpha通道，还是高光贴图。

`_MAIN_LIGHT_SHADOWS`决定了是否使用主光阴影，`_MAIN_LIGHT_SHADOWS_CASCADE`用于控制阴影坐标的计算方式：
```HLSL
float4 TransformWorldToShadowCoord(float3 positionWS)  
{  
#ifdef _MAIN_LIGHT_SHADOWS_CASCADE  
    half cascadeIndex = ComputeCascadeIndex(positionWS);  
#else  
    half cascadeIndex = 0;  
#endif  
  
    float4 shadowCoord = mul(_MainLightWorldToShadow[cascadeIndex], float4(positionWS, 1.0));  
  
    return float4(shadowCoord.xyz, 0);  
}
```

`_ADDITIONAL_LIGHTS`表示，是否采用额外光照，`_ADDITIONAL_LIGHT_SHADOWS`表示，额外光照是否产生阴影。

使用了法线贴图，则`Attribute`和`Varyings`中，增加法线，切线，副切线相关变量。

`_ADDITIONAL_LIGHTS_VERTEX`宏表示是否启用顶点光照，可以在URP配置中修改：
![[（图解8）配置额外光照使用顶点光.png|510]]
启用了顶点光照后，就将雾效和光照数据放到一起，节约内存。

`REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR`表示是否需要对阴影坐标进行插值

如果启用了`_NORMALMAP`，那么就使用`GetVertexNormalInputs`计算法线等数据：
```HLSL
VertexNormalInputs GetVertexNormalInputs(float3 normalOS, float4 tangentOS)  
{  
    VertexNormalInputs tbn;  
  
    // mikkts space compliant. only normalize when extracting normal at frag.  
    real sign = real(tangentOS.w) * GetOddNegativeScale();  
    tbn.normalWS = TransformObjectToWorldNormal(normalOS);  
    tbn.tangentWS = real3(TransformObjectToWorldDir(tangentOS.xyz));  
    tbn.bitangentWS = real3(cross(tbn.normalWS, float3(tbn.tangentWS))) * sign;  
    return tbn;  
}
```
通过法线和切线，叉乘得到副切线。再使用`GetWorldSpaceViewDir`计算视角方向，如果在透视投影的模式下，视角方向就是摄像机的位置减去顶点的位置：
```HLSL
float3 GetWorldSpaceViewDir(float3 positionWS)  
{  
    if (IsPerspectiveProjection())  
    {        // Perspective  
        return GetCurrentViewPosition() - positionWS;  
    }    else  
    {  
        // Orthographic  
        return -GetViewForwardDir();  
    }
}
```
为了节省空间，将视角方向的三个分量放到切线空间的三个基向量第四个分量上，因为这三个基向量，在使用的时候，只需要xyz三个分量。

使用`ComputeFogFactor`计算出雾效的系数，雾的效果只与z轴相关。如果使用了顶点光`_ADDITIONAL_LIGHTS_VERTEX`，那么就需要使用`VertexLighting`获取顶点光照：
```HLSL
half3 VertexLighting(float3 positionWS, half3 normalWS)  
{  
    half3 vertexLightColor = half3(0.0, 0.0, 0.0);  
  
#ifdef _ADDITIONAL_LIGHTS_VERTEX  
    uint lightsCount = GetAdditionalLightsCount();  
    for (uint lightIndex = 0u; lightIndex < lightCount; ++lightIndex) {      
	    Light light = GetAdditionalLight(lightIndex, positionWS);        
	    half3 lightColor = light.color * light.distanceAttenuation;  
		vertexLightColor += LightingLambert(lightColor, 
											light.direction, 
											normalWS);    
    }
#endif  
  
    return vertexLightColor;  
}
```
可以看到，顶点光照也是获取了光源数据，然后通过`LightingLambert`计算出`Lambert`光照。

使用`GetShadowCoord`计算顶点的阴影坐标：
```hlsl
float4 GetShadowCoord(VertexPositionInputs vertexInput)  
{  
#if defined(_MAIN_LIGHT_SHADOWS_SCREEN) && !defined(_SURFACE_TYPE_TRANSPARENT)  
    return ComputeScreenPos(vertexInput.positionCS);  
#else  
    return TransformWorldToShadowCoord(vertexInput.positionWS);  
#endif  
}
```

在片元着色器中，使用内置的`UniversalFragmentBlinnPhong`计算`BlinnPhong`光照，这个函数需要两个结构体参数`SurfaceData`和`InputData`。`SurfaceData`中存放的主要是颜色数据，而`InputData`中，存放的主要是顶点相关的输入性数据。

## SurfaceData结构体

`normalTS`字段是法线贴图的采样结果，使用内置`SampleNormal`函数对法线贴图进行采样。

使用内置`SampleSpecularSmoothness`函数，对高光贴图进行采样，将采样结果的rgb通道，放到`specular`字段，a通道放到`smoothness`字段，作为平滑度。

## InputData结构体

如果使用了`_NORMALMAP`就把法线贴图采样得到的法线，使用`TransformTangentToWorld`转换到世界坐标中，
```HLSL
real3 TransformTangentToWorld(float3 dirTS, real3x3 tangentToWorld)  
{  
    // Note matrix is in row major convention with left multiplication as it is build on the fly  
    return mul(dirTS, tangentToWorld);  
}
```
该函数需要一个变换矩阵，可以使用切线空间的基向量组成变换矩阵，按照切线-副切线-法线组合而成。

如果使用了法线贴图，直接从`Varyings`中，获取光照方向，否则就通过`GetWorldSpaceViewDir`获取光照方向。