---
tags:
  - Unity
  - URP
  - Shader
---
```hlsl
Shader "Custom/Lit/Basic/LitShader"
{

    Properties
    {
        [MainTexture] _BaseMap ("Main Texture", 2D)= "white"{}
        [MainColor] _BaseColor ("Diffuse Colore", Color) = (1,1,1,1)

        [Toggle(_NORMALMAP)]_NormalMapTog("Use Normal Map", int) = 0
        [Normal][NoScaleOffset] _BumpMap("Normal Map", 2D) = "bump"{}

        [Toggle(_ALPHATEST_ON)] _AlphaTest("Aplpha Test", int) = 0
        _Cutoff("Aplha test value", Range(0,1)) = 0

        [Enum(Off,0, Front,1, Back,2)] _CullMode("Cull Mode", int) = 2

        [Toggle(_SPECULAR_SETUP)]_MetallicSpecTog("Use Metallic (if on) or Specular (if off) work flow", int) = 0
        _Metallic("Metallic", Range(0.0, 1.0)) = 0.5
        _SpecColor("Specular Color", Color) = (0.5, 0.5, 0.5, 0.5)
        _Smoothness("Smoothness", Range(0,1.0)) = 0.5
        [Toggle(_METALLICSPECGLOSSMAP)] _MetalSpecGlossMapTog("Use Metallic or Specular Gloss Map", int) = 0
        _MetallicSpecGlossMap("Metaillic or Specular Map", 2D) = "white"{}

  
        [Toggle(_EMISSION)]_EmissionTog("Use Emission", int) = 0
        [HDR]_EmissionColor("Emission Color", Color) = (0,0,0,0)
        [NoScaleOffset] _EmissionMap("Emission Map", 2D) = "white"{}
        
        [Toggle(_OCCLUSIONMAP)] _OcclusionTog("Use Occlusion Map", int) = 0
        [NoScaleOffset] _OcclusionMap("Occlusion Map", 2D) = "white"{}
        _OcclusionStrength("Occlusion Strength", Range(0,1)) = 1

        [Toggle(_SPECULARHIGHLIGHTS_OFF)]_SpecularHighlightsTog("Turn Specular Highlights Off", int) = 0
        [Toggle(_ENVIRONMENTREFLECTIONS_OFF)]_EnvironmentReflectionsTog("Turn Environmental Refelctions Off", int) = 0
        [Toggle(_RECEIVE_SHADOWS_OFF)]_ReceiveShadowsTog("Turn Receive Shadows Off", int) = 0
    }

    SubShader
    {
        Tags
        {

            "RenderPipeline" = "UniversalPipeline"
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
            float _Metallic;
            float _OcclusionStrength;
        CBUFFER_END

        ENDHLSL

        Pass
        {
            Name "Custom Basic Forward Lit"
            Tags { "LightMode" = "UniversalForward" }
            Cull [_CullMode]

            HLSLPROGRAM

            #include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/Lighting.hlsl"

            #pragma vertex LitPassVertex
            #pragma fragment LitPassFragment

            #pragma shader_feature _ALPHATEST_ON
            
            #pragma shader_feature _NORMALMAP
            
            #pragma shader_feature _EMISSION

            #pragma shader_feature _SPECULAR_SETUP
            #pragma shader_feature_local_fragment _METALLICSPECGLOSSMAP

            #pragma shader_feature _OCCLUSIONMAP

            #pragma multi_compile LIGHTMAP_ON
            #pragma multi_compile _MAIN_LIGHT_SHADOWS
            #pragma multi_compile _MAIN_LIGHT_SHADOWS_CASCADE
            #pragma multi_compile _ADDITIONAL_LIGHTS
            #pragma multi_compile _ADDITIONAL_LIGHT_SHADOWS

            #pragma multi_compile_fog

            #pragma shader_feature_local_fragment _SPECULARHIGHLIGHTS_OFF
            #pragma shader_feature_local_fragment _ENVIRONMENTREFLECTIONS_OFF
            #pragma shader_feature_local_fragment _RECEIVE_SHADOWS_OFF

            struct Attribute
            {

                float3 posOS : POSITION
                float3 normalOS : NORMAL;
#ifdef _NORMALMAP
                float4 tangentOS: TANGENT;
#endif

                float2 uv : TEXCOORD0;

                float2 lightmapUV: TEXCOORD1;

                float4 vertexColor: COLOR;
            };

            struct Varyings
            {
                float4 posCS: SV_POSITION;
                float3 posWS: TEXCOORD0;
#ifdef _NORMALMAP
                half4 normalWS: TEXCOORD1;
                half4 tangentWS: TEXCOORD2;
                half4 bitangentWS: TEXCOORD3;
#else
                float3 normalWS: TEXCOORD3;
#endif

                float2 uv: TEXCOORD4;

                DECLARE_LIGHTMAP_OR_SH(lightmapUV, vertexSH, 5);
                
#ifdef _ADDITIONAL_LIGHTS_VERTEX
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

                VertexPositionInputs posInputs = GetVertexPositionInputs(IN.posOS);
                OUT.posCS = posInputs.positionCS;
                OUT.posWS = posInputs.positionWS;

                VertexNormalInputs normalInputs;
#ifdef _NORMALMAP
                float3 viewDir = GetWorldSpaceViewDir(posInputs.positionWS);
                normalInputs = GetVertexNormalInputs(IN.normalOS, IN.tangentOS);
                OUT.normalWS = half4(normalInputs.normalWS.xyz, viewDir.x);
                OUT.tangentWS = half4(normalInputs.tangentWS.xyz, viewDir.y);
                OUT.bitangentWS = half4(normalInputs.bitangentWS.xyz, 
						                viewDir.z);
#else
                normalInputs = GetVertexNormalInputs(IN.normalOS);
                OUT.normalWS = NormalizeNormalPerVertex(normalInputs.normalWS);
#endif

                half fogFator = ComputeFogFactor(posInputs.positionCS.z);
#ifdef _ADDITIONAL_LIGHTS_VERTEX
                half3 vertexLight = VertexLighting(posInputs.positionWS, normalInputs.normalWS);
                OUT.fogFactorAndVertexLight = half4(fogFator, vertexLight);
#else
                OUT.fogFactor = fogFator;
#endif


#ifdef REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR
               OUT.shadowCoord = GetShadowCoord(posInputs);
#endif
                OUTPUT_LIGHTMAP_UV(IN.lightmapUV, unity_LightmapST, OUT.lightmapUV);

                OUTPUT_SH(OUT.normalWS, OUT.vertexSH);

                OUT.uv = TRANSFORM_TEX(IN.uv, _BaseMap);

                OUT.vertexColor = IN.vertexColor;

                return OUT;

            }

            #include "CustomLib/PBRInput.hlsl"
            #include "CustomLib/PBRSurface.hlsl"

  
            float4 LitPassFragment(Varyings IN): SV_TARGET
            {
                SurfaceData surfaceData;

                InitSurfaceData(IN, surfaceData);

                InputData inputData;

                InitInputData(IN, surfaceData.normalTS, inputData);

                half4 color = UniversalFragmentPBR(inputData, surfaceData);

                color.rgb = MixFog(color.rgb, inputData.fogCoord);

                return color;

            }

            ENDHLSL
        }

		阴影Pass { ... }  
  
        深度Pass { ... }   
  
        深度法线Pass { ... } 
    }
}
```

```hlsl
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
    inputData.normalWS = NormalizeNormalPerPixel(inputData.normalWS);

#ifdef _NORMALMAP
    inputData.viewDirectionWS = half3(IN.normalWS.w, 
									    IN.tangentWS.w, 
									    IN.bitangentWS.w);
#else
    inputData.viewDirectionWS = GetWorldSpaceViewDir(IN.posWS);
#endif
    inputData.viewDirectionWS = NormalizeNormalPerPixel(inputData.viewDirectionWS);

  
#ifdef REQUIRES_VERTEX_SHADOW_COORD_INTERPOLATOR
    inputData.shadowCoord = IN.shadowCoord;
#elif defined(MAIN_LIGHT_CALCULATE_SHADOWS)
    inputData.shadowCoord = TransformWorldToShadowCoord(IN.posWS);
#else
    inputData.shadowCoord = float4(0,0,0,0);
#endif

#ifdef _ADDITIONAL_LIGHTS_VERTEX
    inputData.vertexLighting = IN.fogFactorAndVertexLight.yzw;
    inputData.fogCoord = IN.fogFactorAndVertexLight.x;
#else
    inputData.vertexLighting = half3(0,0,0);
    inputData.fogCoord = IN.fogFactor;
#endif

    inputData.bakedGI = SAMPLE_GI(IN.lightmapUV, IN.vertexSH, IN.normalWS);

    inputData.normalizedScreenSpaceUV = GetNormalizedScreenSpaceUV(IN.posCS);

    inputData.shadowMask = SAMPLE_SHADOWMASK(IN.lightmapUV);

}
```

```HLSL
#include "Packages/com.unity.render-pipelines.universal/ShaderLibrary/SurfaceInput.hlsl"

  
TEXTURE2D(_MetallicSpecGlossMap);
SAMPLER(sampler_MetallicSpecGlossMap);
TEXTURE2D(_OcclusionMap);
SAMPLER(sampler_OcclusionMap);

  
half SampleOcclusion(float2 uv)
{
#ifdef _OCCLUSIONMAP
       // TODO: Controls things like these by exposing SHADER_QUALITY levels (low, medium, high)
    #if defined(SHADER_API_GLES)
        return SAMPLE_TEXTURE2D(_OcclusionMap, sampler_OcclusionMap, uv).g;
    #else
        half occ = SAMPLE_TEXTURE2D(_OcclusionMap, sampler_OcclusionMap, uv).g;
        return LerpWhiteTo(occ, _OcclusionStrength);
    #endif
#else
    return half(1.0);
#endif

}

  
half4 SampleMetallicSpecGloss(float2 uv, half albedoAlpha)
{

    half4 specGloss;

#ifdef _METALLICSPECGLOSSMAP
    specGloss = SAMPLE_TEXTURE2D(_MetallicSpecGlossMap, sampler_MetallicSpecGlossMap, uv);
    #ifdef _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A
        specGloss.a = albedoAlpha * _Smoothness;
    #else
        specGloss.a *= _Smoothness;
    #endif
#else // _METALLICSPECGLOSSMAP
    #if _SPECULAR_SETUP
        specGloss.rgb = _SpecColor.rgb;
    #else
        specGloss.rgb = _Metallic.rrr;
    #endif

  
    #ifdef _SMOOTHNESS_TEXTURE_ALBEDO_CHANNEL_A
        specGloss.a = albedoAlpha * _Smoothness;
    #else
        specGloss.a = _Smoothness;
    #endif

#endif

    return specGloss;
}

  

void InitSurfaceData(Varyings IN, out SurfaceData surfaceData)
{

    surfaceData = (SurfaceData)0;

    half4 albedoAplha = SampleAlbedoAlpha(IN.uv, _BaseMap, sampler_BaseMap);

    surfaceData.alpha = Alpha(albedoAplha.a, _BaseColor, _Cutoff);

    surfaceData.albedo = (albedoAplha * _BaseColor * IN.vertexColor).rgb;

    surfaceData.normalTS = SampleNormal(IN.uv, _BumpMap, sampler_BumpMap);

    surfaceData.emission = SampleEmission(IN.uv, 
						    _EmissionColor, 
						    _EmissionMap, 
						    sampler_EmissionMap);

    surfaceData.occlusion = SampleOcclusion(IN.uv);

    half4 metalSpec = SampleMetallicSpecGloss(IN.uv, albedoAplha.a);

#ifdef _SPECULAR_SETUP
    surfaceData.metallic = 1;
    surfaceData.specular = metalSpec.rgb;
#else
    surfaceData.specular = half3(0,0,0);
    surfaceData.metallic = metalSpec.r;
#endif

    surfaceData.smoothness = metalSpec.a;
}
```