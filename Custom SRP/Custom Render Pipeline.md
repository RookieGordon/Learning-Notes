---
tags:
  - Unity
  - URP
  - Shader
annotation-target: Custom Render Pipeline.pdf
---
# 一个新的渲染管道
## 项目设置

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

## 配置渲染管道资产

```cardlink
url: https://docs.unity.cn/cn/2019.4/Manual/srp-creating-render-pipeline-asset-and-render-pipeline-instance.html
title: "创建渲染管线资源和渲染管线实例 - Unity 手册"
description: "如果您要创建自己的可编程渲染管线 (SRP)，您的项目必须包含："
host: docs.unity.cn
favicon: ../StaticFiles/images/favicons/favicon.png
image: https://unity3d.com/files/images/ogimg.jpg
```

由于使用的是内置渲染管线模板，所以需要一个URP管线资产。用了管理渲染管线，以及保存一些管线设置

>%%
>```annotation-json
>{"text":"1. 创建一个名为CustomRendererPiplineAsset的类，继承UnityEngine.Rendering.RenderPipelineAsset。\n2. `RenderPipelineAsset的主要目的是为 Unity 提供一种获取负责渲染的管道对象实例的方法。资产本身只是一个句柄和存储设置的地方。`","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":4371,"end":4499},{"type":"TextQuoteSelector","exact":" Create a Custom RP asset folder with a Runtime child folder. Put anew C# script in there for the CustomRenderPipelineAsset type","prefix":"Unityuses for the Universal RP.","suffix":".Folder structure.The asset type"}]}],"created":"2024-05-20T08:34:57.628Z","updated":"2024-05-20T08:34:57.628Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}
>```
>%%
>*%%PREFIX%%Unityuses for the Universal RP.%%HIGHLIGHT%% ==Create a Custom RP asset folder with a Runtime child folder. Put anew C# script in there for the CustomRenderPipelineAsset type== %%POSTFIX%%.Folder structure.The asset type*
>%%LINK%%[[#^6abrrw6pya7|show annotation]]
>%%COMMENT%%
>1. 创建一个名为CustomRendererPiplineAsset的类，继承UnityEngine.Rendering.RenderPipelineAsset。
>2. `RenderPipelineAsset的主要目的是为 Unity 提供一种获取负责渲染的管道对象实例的方法。资产本身只是一个句柄和存储设置的地方。`
>%%TAGS%%
>
^6abrrw6pya7

Project Setting中的Graphics和Quality Settings共同决定了活动渲染管线。在Graphics中，我们可以更改Unity默认设置的渲染管线资产；在Quality Settings中，我们可以覆盖指定画质等级所使用的渲染管线资产。

当然，Unity也支持在运行时，切换渲染管线。我们可以在脚本中获取或设置活动渲染管线，并为他们编写改变设置时的回调函数。要执行此操作，请使用以下 API：

- 若想要获取定义了活动渲染管线的渲染管线资产的引用，使用 `GraphicsSettings.currentRenderPipeline`
- 若想要决定Unity是否使用默认渲染管线资产或重载渲染管线资产（指不同画质所对应的资产），使用`GraphicsSettings.defaultRenderPipeline和 QualitySettings.renderPipeline`
- 若想要获取当前正在运行的活动渲染管线的实例，使用`RenderPipelineManager.currentPipeline`。注意：<font color="#ffc000">在该渲染管线渲染至少一帧之后才会更新它的属性</font>
- 若要检测并执行某种活动渲染管线更改时的代码，使用`RenderPipelineManager.activeRenderPipelineTypeChanged`

## 渲染管线

>%%
>```annotation-json
>{"created":"2024-05-20T09:17:45.273Z","text":"继承自RenderPipline的CustomRenderPipline，就是CustomRenderPiplineAsset提供给Unity获取的渲染管道。","updated":"2024-05-20T09:17:45.273Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":7057,"end":7077},{"type":"TextQuoteSelector","exact":"CustomRenderPipeline","prefix":"ender Pipeline InstanceCreate a ","suffix":" class and put its script file i"}]}]}
>```
>%%
>*%%PREFIX%%ender Pipeline InstanceCreate a%%HIGHLIGHT%% ==CustomRenderPipeline== %%POSTFIX%%class and put its script file i*
>%%LINK%%[[#^ewfbjnqckvf|show annotation]]
>%%COMMENT%%
>继承自RenderPipline的CustomRenderPipline，就是CustomRenderPiplineAsset提供给Unity获取的渲染管道。
>%%TAGS%%
>
^ewfbjnqckvf

# 渲染



>%%
>```annotation-json
>{"created":"2024-05-20T10:11:31.325Z","text":"每帧都会调用管线的Render方法。由于每个摄像机都会独立渲染，因此创建一个摄像机渲染对象CameraRenderer，独立控制相机的渲染。","updated":"2024-05-20T10:11:31.325Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":8572,"end":8735},{"type":"TextQuoteSelector","exact":"Each frame Unity invokes Render on the RP instance. It passes along a context struct thatprovides a connection to the native engine, which we can use for rendering","prefix":"render-pipeline/ 7/402 Rendering","suffix":". It also passes anarray of came"}]}]}
>```
>%%
>*%%PREFIX%%render-pipeline/ 7/402 Rendering%%HIGHLIGHT%% ==Each frame Unity invokes Render on the RP instance. It passes along a context struct thatprovides a connection to the native engine, which we can use for rendering== %%POSTFIX%%. It also passes anarray of came*
>%%LINK%%[[#^vnnk7cifj5|show annotation]]
>%%COMMENT%%
>每帧都会调用管线的Render方法。由于每个摄像机都会独立渲染，因此创建一个摄像机渲染对象CameraRenderer，独立控制相机的渲染。
>%%TAGS%%
>
^vnnk7cifj5

## 绘制天空盒



>%%
>```annotation-json
>{"created":"2024-05-20T10:43:30.335Z","text":"在Render方法中，绘制所有可见的对象，将该功能独立成`DrawVisibleGeometry`方法，调用`DrawSkybox`方法，绘制天空盒","updated":"2024-05-20T10:43:30.335Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":10423,"end":10504},{"type":"TextQuoteSelector","exact":"The job of CameraRenderer.Render is to draw all geometry that its camera can see.","prefix":"line/ 8/402.2 Drawing the Skybox","suffix":" Isolate thatspecific task in a "}]}]}
>```
>%%
>*%%PREFIX%%line/ 8/402.2 Drawing the Skybox%%HIGHLIGHT%% ==The job of CameraRenderer.Render is to draw all geometry that its camera can see.== %%POSTFIX%%Isolate thatspecific task in a*
>%%LINK%%[[#^azbzarogveh|show annotation]]
>%%COMMENT%%
>在Render方法中，绘制所有可见的对象，将该功能独立成`DrawVisibleGeometry`方法，调用`DrawSkybox`方法，绘制天空盒
>%%TAGS%%
>
^azbzarogveh

`ScriptableRenderContext`向 GPU 调度和提交状态更新和绘制命令。

[RenderPipeline.Render](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.RenderPipeline.Render.html) 方法实现通常会针对每个摄像机剔除渲染管线不需要渲染的对象（请参阅 [CullingResults](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.CullingResults.html)），然后对 [ScriptableRenderContext.DrawRenderers](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.ScriptableRenderContext.DrawRenderers.html) 发起一系列调用并混合 [ScriptableRenderContext.ExecuteCommandBuffer](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.ScriptableRenderContext.ExecuteCommandBuffer.html) 调用。这些调用会设置全局着色器属性、更改渲染目标、分发计算着色器和其他渲染任务。若要实际执行渲染循环，请调用 [ScriptableRenderContext.Submit](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.ScriptableRenderContext.Submit.html)。




>%%
>```annotation-json
>{"text":"`DrawSkybox`方法只是用于控制是否显示天空盒（此时移动旋转相机，天空盒没有任何变化）。天空盒的绘制是由相机的`clar flags`控制的。\n如果要正确渲染天空盒，就需要设置视图投影矩阵——VP。通过使用``SetupCameraProperties`方法，应用相机的属性","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":11965,"end":12123},{"type":"TextQuoteSelector","exact":"We pass the camera to DrawSkybox, but that's only used to determine whether the skybox shouldbe drawn at all, which is controlled via the camera's clear flags","prefix":"ct how the skybox gets rendered.","suffix":".To correctly render the skybox—"}]}],"created":"2024-05-21T04:22:05.541Z","updated":"2024-05-21T04:22:05.541Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}
>```
>%%
>*%%PREFIX%%ct how the skybox gets rendered.%%HIGHLIGHT%% ==We pass the camera to DrawSkybox, but that's only used to determine whether the skybox shouldbe drawn at all, which is controlled via the camera's clear flags== %%POSTFIX%%.To correctly render the skybox—*
>%%LINK%%[[#^ipnz9b383g|show annotation]]
>%%COMMENT%%
>`DrawSkybox`方法只是用于控制是否显示天空盒（此时移动旋转相机，天空盒没有任何变化）。天空盒的绘制是由相机的`clar flags`控制的。
>如果要正确渲染天空盒，就需要设置视图投影矩阵——VP。通过使用``SetupCameraProperties`方法，应用相机的属性
>%%TAGS%%
>
^ipnz9b383g

## 命令缓冲区

在我们提交之前，上下文会延迟实际渲染。在此之前，我们要对其进行配置，并添加命令供稍后执行。

在`CameraRenderer`中，创建一个`CommandBuffer`对象，用于设置渲染命令。

