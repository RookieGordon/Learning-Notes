---
tags:
  - Unity
  - URP
  - Shader
annotation-target: Custom Render Pipeline.pdf
---
# 项目设置

>%%
>```annotation-json
>{"created":"2024-05-20T05:10:48.337Z","text":"教程使用线性空间，而非gamma空间。","updated":"2024-05-20T05:10:48.337Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":3276,"end":3413},{"type":"TextQuoteSelector","exact":"Go to the player settings via Edit / Project Settings and then Player, then switchColor Space under the Other Settings section to Linear.","prefix":"uses gamma space asthe default. ","suffix":"Color space set to linear.Fill t"}]}]}
>```
>%%
>*%%PREFIX%%uses gamma space asthe default.%%HIGHLIGHT%% ==Go to the player settings via Edit / Project Settings and then Player, then switchColor Space under the Other Settings section to Linear.== %%POSTFIX%%Color space set to linear.Fill t*
>%%LINK%%[[#^njrbdnqe1z|show annotation]]
>%%COMMENT%%
> 将默认的gamma空间改成线性空间
>%%TAGS%%
>
^njrbdnqe1z

# 配置渲染管道资产

由于使用的是内置渲染管线模板，所以需要一个URP管线资产。



>%%
>```annotation-json
>{"created":"2024-05-20T08:34:57.628Z","text":"创建一个名为CustomRendererPiplineAsset的类，继承自UnityEngine.Rendering。\nRP 资产的主要目的是为 Unity 提供一种获取负责渲染的管道对象实例的方法。资产本身只是一个句柄和存储设置的地方。","updated":"2024-05-20T08:34:57.628Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":4371,"end":4499},{"type":"TextQuoteSelector","exact":" Create a Custom RP asset folder with a Runtime child folder. Put anew C# script in there for the CustomRenderPipelineAsset type","prefix":" Unityuses for the Universal RP.","suffix":".Folder structure.The asset type"}]}]}
>```
>%%
>*%%PREFIX%%Unityuses for the Universal RP.%%HIGHLIGHT%% ==Create a Custom RP asset folder with a Runtime child folder. Put anew C# script in there for the CustomRenderPipelineAsset type== %%POSTFIX%%.Folder structure.The asset type*
>%%LINK%%[[#^6abrrw6pya7|show annotation]]
>%%COMMENT%%
>创建一个名为CustomRendererPiplineAsset的类，继承自UnityEngine.Rendering.RenderPipelineAsset。
>RP 资产的主要目的是为 Unity 提供一种获取负责渲染的管道对象实例的方法。资产本身只是一个句柄和存储设置的地方。
>%%TAGS%%
>
^6abrrw6pya7
