---
tags:
  - Unity
  - URP
  - Shader
annotation-target: Draw Calls.pdf
---
# Shaders

## Shader函数

>%%
>```annotation-json
>{"created":"2024-05-25T07:02:54.906Z","text":"一般来说，位置和纹理变量，使用float类型，其他则使用half类型即可","updated":"2024-05-25T07:02:54.906Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":8876,"end":9021},{"type":"TextQuoteSelector","exact":"he rule of thumb is to use float forpositions and texture coordinates only and half for everything else, provided that the results aregood enough","prefix":" use half as much as possible. T","suffix":".When not targeting mobile platf"}]}]}
>```
>%%
>*%%PREFIX%%use half as much as possible. T%%HIGHLIGHT%% ==he rule of thumb is to use float forpositions and texture coordinates only and half for everything else, provided that the results aregood enough== %%POSTFIX%%.When not targeting mobile platf*
>%%LINK%%[[#^2qgvqyy4vlr|show annotation]]
>%%COMMENT%%
>一般来说，位置和纹理变量，使用float类型，其他则使用half类型即可
>%%TAGS%%
>
^2qgvqyy4vlr

# 批处理

## SPR的批处理

>%%
>```annotation-json
>{"created":"2024-05-25T12:37:52.592Z","text":"SRP批次并没有减少抽取调用的数量，而是使它们更精简。它缓存材质属性在GPU上，所以他们不需要发送每个绘制调用。","updated":"2024-05-25T12:37:52.592Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":23093,"end":23375},{"type":"TextQuoteSelector","exact":"Rather than reducing the amount of draw calls the SRP batches makes them leaner. It cachesmaterial properties on the GPU so they don't have to be sent every draw call. This reduces boththe amount of data that has to be communicated and the work that the CPU has to do per drawcall. ","prefix":" reason for this.Not compatible.","suffix":"But this only works if the shade"}]}]}
>```
>%%
>*%%PREFIX%%reason for this.Not compatible.%%HIGHLIGHT%% ==Rather than reducing the amount of draw calls the SRP batches makes them leaner. It cachesmaterial properties on the GPU so they don't have to be sent every draw call. This reduces boththe amount of data that has to be communicated and the work that the CPU has to do per drawcall.== %%POSTFIX%%But this only works if the shade*
>%%LINK%%[[#^iikguqxho2k|show annotation]]
>%%COMMENT%%
>SRP批次并没有减少抽取调用的数量，而是使它们更精简。它缓存材质属性在GPU上，所以他们不需要发送每个绘制调用。
>%%TAGS%%
>
^iikguqxho2k

>%%
>```annotation-json
>{"created":"2024-05-25T12:44:35.070Z","text":"几个重要的矩阵，是放到`UnityPerDraw`中的","updated":"2024-05-25T12:44:35.070Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":24642,"end":24771},{"type":"TextQuoteSelector","exact":"CBUFFER_START(UnityPerDraw)float4x4 unity_ObjectToWorld;float4x4 unity_WorldToObject;real4 unity_WorldTransformParams;CBUFFER_END","prefix":"als/custom-srp/draw-calls/ 19/43","suffix":"In this case we're required to d"}]}]}
>```
>%%
>*%%PREFIX%%als/custom-srp/draw-calls/ 19/43%%HIGHLIGHT%% 
>==CBUFFER_START(UnityPerDraw)
>float4x4 unity_ObjectToWorld;
>float4x4 unity_WorldToObject;
>real4 unity_WorldTransformParams;
>CBUFFER_END==
> %%POSTFIX%%In this case we're required to d*
>%%LINK%%[[#^nltxai06xk|show annotation]]
>%%COMMENT%%
>几个重要的矩阵，是放到`UnityPerDraw`中的
>%%TAGS%%
>
^nltxai06xk

>%%
>```annotation-json
>{"created":"2024-05-25T12:48:25.712Z","text":"使用`GraphicsSettings.useScriptableRenderPipelineBatching = true`开启SRP Batcher。","updated":"2024-05-25T12:48:25.712Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":25544,"end":25637},{"type":"TextQuoteSelector","exact":"public CustomRenderPipeline () {GraphicsSettings.useScriptableRenderPipelineBatching = true;}","prefix":"r method toCustomRenderPipeline.","suffix":"Negative batches saved.The Stats"}]}]}
>```
>%%
>*%%PREFIX%%r method toCustomRenderPipeline.%%HIGHLIGHT%% 
>==public CustomRenderPipeline () {
>GraphicsSettings.useScriptableRenderPipelineBatching = true;
>}== 
>%%POSTFIX%%Negative batches saved.The Stats*
>%%LINK%%[[#^36xzdt4m45o|show annotation]]
>%%COMMENT%%
>使用`GraphicsSettings.useScriptableRenderPipelineBatching = true`开启SRP Batcher。
>%%TAGS%%
>
^36xzdt4m45o

## 多种颜色





>%%
>```annotation-json
>{"created":"2024-05-25T13:26:43.846Z","text":"创建一个`PerObjectMaterialProperties`组件，用于控制物体材质的`_BaseColor`属性。使用`MaterialPropertyBlock`对象来修改物体Renderer组件使用的着色器的`Properties`属性。","updated":"2024-05-25T13:26:43.846Z","document":{"title":"Draw Calls","link":[{"href":"urn:x-pdf:23ef64e21d6e965e28063c4b0394ee19"},{"href":"vault:/Custom SRP/attachments/Draw Calls.pdf"}],"documentFingerprint":"23ef64e21d6e965e28063c4b0394ee19"},"uri":"vault:/Custom SRP/attachments/Draw Calls.pdf","target":[{"source":"vault:/Custom SRP/attachments/Draw Calls.pdf","selector":[{"type":"TextPositionSelector","start":27539,"end":27703},{"type":"TextQuoteSelector","exact":"public class PerObjectMaterialProperties : MonoBehaviour {static int baseColorId = Shader.PropertyToID(\"_BaseColor\");[SerializeField]Color baseColor = Color.white;}","prefix":"gine;[DisallowMultipleComponent]","suffix":"PerObjectMaterialProperties comp"}]}]}
>```
>%%
>*%%PREFIX%%gine;[DisallowMultipleComponent]%%HIGHLIGHT%% 
>==public class PerObjectMaterialProperties : MonoBehaviour {
>static int baseColorId = Shader.PropertyToID("_BaseColor");
>[SerializeField]Color baseColor = Color.white;
>}== 
>%%POSTFIX%%PerObjectMaterialProperties comp*
>%%LINK%%[[#^afkh0yp1tjf|show annotation]]
>%%COMMENT%%
>创建一个`PerObjectMaterialProperties`组件，用于控制物体材质的`_BaseColor`属性。使用`MaterialPropertyBlock`对象来修改物体Renderer组件使用的着色器的`Properties`属性。
>%%TAGS%%
>
^afkh0yp1tjf
