---
tags:
  - Unity
  - 自定义管线
  - 绘制天空盒设置
  - 绘制物体设置
  - 剔除物体设置
annotation-target: Custom Render Pipeline.pdf
---
# 参考

## [[可编程脚本渲染管线SRP - Unity官方平台 - 博客园]]

[Fetching Data#jx84](https://max2d.com/archives/1031)
## [[Unity SRP搞事（一）基本管线]]

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
>{"created":"2024-05-22T03:02:16.992Z","text":"每帧都会调用管线的Render方法。由于每个摄像机都会独立渲染，因此创建一个摄像机渲染对象CameraRenderer，独立控制相机的渲染。重写该相机的Render方法，用于控制该相机的渲染。","updated":"2024-05-22T03:02:16.992Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":9273,"end":9509},{"type":"TextQuoteSelector","exact":"using UnityEngine;using UnityEngine.Rendering;public class CameraRenderer {ScriptableRenderContext context;Camera camera;public void Render (ScriptableRenderContext context, Camera camera) {this.context = context;this.camera = camera;}}","prefix":"eters in fields for convenience.","suffix":"Have CustomRenderPipeline create"}]}]}
>```
>%%
>*%%PREFIX%%eters in fields for convenience.%%HIGHLIGHT%% 
>==using UnityEngine;
>using UnityEngine.Rendering;
>public class CameraRenderer {
>	ScriptableRenderContext context;
>	Camera camera;
>	public void Render (ScriptableRenderContext context, Camera camera) {
>		this.context = context;
>		this.camera = camera;
>	}
>}== 
>%%POSTFIX%%Have CustomRenderPipeline create*
>%%LINK%%[[#^89vtnze8gxt|show annotation]]
>%%COMMENT%%
>每帧都会调用管线的Render方法。由于每个摄像机都会独立渲染，因此创建一个摄像机渲染对象CameraRenderer，独立控制相机的渲染。重写该相机的Render方法，用于控制该相机的渲染。
>%%TAGS%%
>
^89vtnze8gxt

`ScriptableRenderContext`向 GPU 调度和提交状态更新和绘制命令。

[RenderPipeline.Render](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.RenderPipeline.Render.html) 方法实现通常会针对每个摄像机剔除渲染管线不需要渲染的对象（请参阅 [CullingResults](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.CullingResults.html)），然后对 [ScriptableRenderContext.DrawRenderers](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.ScriptableRenderContext.DrawRenderers.html) 发起一系列调用并混合 [ScriptableRenderContext.ExecuteCommandBuffer](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.ScriptableRenderContext.ExecuteCommandBuffer.html) 调用。这些调用会设置全局着色器属性、更改渲染目标、分发计算着色器和其他渲染任务。若要实际执行渲染循环，请调用 [ScriptableRenderContext.Submit](https://docs.unity.cn/cn/2019.4/ScriptReference/Rendering.ScriptableRenderContext.Submit.html)。
## 绘制天空盒

>%%
>```annotation-json
>{"created":"2024-05-22T03:05:03.737Z","text":"在Render方法中，绘制所有可见的对象，将该功能独立成`DrawVisibleGeometry`方法，调用`DrawSkybox`方法，绘制天空盒","updated":"2024-05-22T03:05:03.737Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":10724,"end":10917},{"type":"TextQuoteSelector","exact":"public void Render (ScriptableRenderContext context, Camera camera) {this.context = context;this.camera = camera;DrawVisibleGeometry();}void DrawVisibleGeometry () {context.DrawSkybox(camera);}","prefix":"t with thecamera as an argument.","suffix":"This does not yet make the skybo"}]}]}
>```
>%%
>*%%PREFIX%%t with thecamera as an argument.%%HIGHLIGHT%% 
>==public void Render (ScriptableRenderContext context, Camera camera) 
>{
>     this.context = context;
>	this.camera = camera;
>	DrawVisibleGeometry();
>}
>void DrawVisibleGeometry () {
>	context.DrawSkybox(camera);
>}== 
>%%POSTFIX%%This does not yet make the skybo*
>%%LINK%%[[#^wm18j8qekeq|show annotation]]
>%%COMMENT%%
>在Render方法中，绘制所有可见的对象，将该功能独立成`DrawVisibleGeometry`方法，调用`DrawSkybox`方法，绘制天空盒
>%%TAGS%%
>
^wm18j8qekeq


>%%
>```annotation-json
>{"created":"2024-05-22T03:49:57.903Z","text":"`DrawSkybox`方法只是用于控制是否显示天空盒（此时移动旋转相机，天空盒没有任何变化）。天空盒的绘制是由相机的`clar flags`控制的。\n如果要正确渲染天空盒，就需要设置视图投影矩阵——VP。通过使用`SetupCameraProperties`方法，应用相机的属性","updated":"2024-05-22T03:49:57.903Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":12878,"end":13085},{"type":"TextQuoteSelector","exact":"public void Render (ScriptableRenderContext context, Camera camera) {this.context = context;this.camera = camera;Setup();DrawVisibleGeometry();Submit();}void Setup () {context.SetupCameraProperties(camera);}","prefix":"etry, in a separate Setupmethod.","suffix":"Skybox, correctly aligned.2024/5"}]}]}
>```
>%%
>*%%PREFIX%%etry, in a separate Setupmethod.%%HIGHLIGHT%% 
>==public void Render (ScriptableRenderContext context, Camera camera) {
>	this.context = context;
>	this.camera = camera;
>	Setup();
>	DrawVisibleGeometry();
>	Submit();
>}
>void Setup () {
>	context.SetupCameraProperties(camera);
>}== 
>%%POSTFIX%%Skybox, correctly aligned.2024/5*
>%%LINK%%[[#^gt3htl9uy1v|show annotation]]
>%%COMMENT%%
>`DrawSkybox`方法只是用于控制是否显示天空盒（此时移动旋转相机，天空盒没有任何变化）。天空盒的绘制是由相机的`clar flags`控制的。
>如果要正确渲染天空盒，就需要设置视图投影矩阵——VP。通过使用`SetupCameraProperties`方法，应用相机的属性
>%%TAGS%%
>
^gt3htl9uy1v

## 命令缓冲区

在我们提交之前，上下文会延迟实际渲染。在此之前，我们要对其进行配置，并添加命令供稍后执行。

在`CameraRenderer`中，创建一个`CommandBuffer`对象，用于设置渲染命令。

>%%
>```annotation-json
>{"text":"为了能够使得profiler和frame debugger正常工作，需要调用`BeginSample`和`EndSample`方法。在执行渲染命令前，开始采样，提交命令前，结束采样","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":14781,"end":15035},{"type":"TextQuoteSelector","exact":"We can use command buffers to inject profiler samples, which will show up both in the profilerand the frame debugger. This is done by invoking BeginSample and EndSample at the appropriatepoints, which is at the beginning of Setup and Submit in our case. ","prefix":"ject initializer syntax is used.","suffix":"Both methods must beprovided wit"}]}],"created":"2024-05-21T04:48:06.339Z","updated":"2024-05-21T04:48:06.339Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}
>```
>%%
>*%%PREFIX%%ject initializer syntax is used.%%HIGHLIGHT%% ==We can use command buffers to inject profiler samples, which will show up both in the profilerand the frame debugger. This is done by invoking BeginSample and EndSample at the appropriatepoints, which is at the beginning of Setup and Submit in our case.== %%POSTFIX%%Both methods must beprovided wit*
>%%LINK%%[[#^r9kswjpuppc|show annotation]]
>%%COMMENT%%
>为了能够使得profiler和frame debugger正常工作，需要调用`BeginSample`和`EndSample`方法。在执行渲染命令前，开始采样，提交命令前，结束采样
>%%TAGS%%
>
^r9kswjpuppc


>%%
>```annotation-json
>{"created":"2024-05-22T03:54:16.768Z","text":"使用`ExecuteCommandBuffer`方法，可以执行缓冲区中的命令。该操作是复制命令到渲染管线中执行渲染。在提交命令前，将缓冲区中的命令与设置复制到管线中。","updated":"2024-05-22T03:54:16.768Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":15717,"end":15973},{"type":"TextQuoteSelector","exact":"void Setup () {buffer.BeginSample(bufferName);ExecuteBuffer();context.SetupCameraProperties(camera);}void Submit () {buffer.EndSample(bufferName);ExecuteBuffer();context.Submit();}void ExecuteBuffer () {context.ExecuteCommandBuffer(buffer);buffer.Clear();}","prefix":" to add a method that does both.","suffix":"The Camera.RenderSkyBox sample n"}]}]}
>```
>%%
>*%%PREFIX%%to add a method that does both.%%HIGHLIGHT%% 
>==void Setup (){
>buffer.BeginSample(bufferName);
>ExecuteBuffer();
>context.SetupCameraProperties(camera);
>}
>void Submit () {
>buffer.EndSample(bufferName);
>ExecuteBuffer();context.Submit();
>}
>void ExecuteBuffer () {
>context.ExecuteCommandBuffer(buffer);
>buffer.Clear();
>}== 
>%%POSTFIX%%The Camera.RenderSkyBox sample n*
>%%LINK%%[[#^z06jwq33t6c|show annotation]]
>%%COMMENT%%
>使用`ExecuteCommandBuffer`方法，可以执行缓冲区中的命令。该操作是复制命令到渲染管线中执行渲染。在提交命令前，将缓冲区中的命令与设置复制到管线中。
>%%TAGS%%
>
^z06jwq33t6c


这样就可以在Frame Debugger中，看到自定义的渲染命令缓冲区了
![[（图解1）渲染命令缓冲区名称.png|580]]
另外可以看到，渲染天空盒用的Pass来自`Skybox/Procedural`这个shader。

## 清除渲染目标


>%%
>```annotation-json
>{"created":"2024-05-22T03:56:16.554Z","text":"每次绘制时，应使用ClearRenderTarget清除上一次渲染上下文。这样会在Fream Debugger中产生一个新的条目Draw GL，该条目就代表着清除","updated":"2024-05-22T03:56:16.554Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":16918,"end":17069},{"type":"TextQuoteSelector","exact":"void Setup () {buffer.BeginSample(bufferName);buffer.ClearRenderTarget(true, true, Color.clear);ExecuteBuffer();context.SetupCameraProperties(camera);}","prefix":"for which we'll use Color.clear.","suffix":"Clearing, with nested sample.The"}]}]}
>```
>%%
>*%%PREFIX%%for which we'll use Color.clear.%%HIGHLIGHT%% 
>==void Setup () {
>buffer.BeginSample(bufferName);
>buffer.ClearRenderTarget(true, true, Color.clear);
>ExecuteBuffer();
>context.SetupCameraProperties(camera);
>}== 
>%%POSTFIX%%Clearing, with nested sample.The*
>%%LINK%%[[#^yzoq9547jh|show annotation]]
>%%COMMENT%%
>每次绘制时，应使用ClearRenderTarget清除上一次渲染上下文。这样会在Fream Debugger中产生一个新的条目Draw GL，该条目就代表着清除
>%%TAGS%%
>
^yzoq9547jh


![[（图解2）ClearRenderTarget的Frame Debbugger显示.png|530]]
从图中可以看出，`ClearRenderTarget`步骤，使用了`Hidden/InternalClear`这个Shader，该Shader所做的事情，就是绘制一个全屏四边形，但是其实这并不是最有效的方法，在设置摄像机属性后，进行清理，才是最高效的方法：

![[（图解3）设置摄像机属性后，再清理上下文.png|570]]
可以发现，这时候就没有执行任何着色器，而是直接清理了颜色和深度缓冲区，以及模板数据。

## 剔除

>%%
>```annotation-json
>{"created":"2024-05-22T03:57:56.745Z","text":"可以通过修改获取到的ScriptableCullingParameters来控制剔除。通过使用剔除，可以只渲染摄像机能看到的物体，而非去渲染每个物体。通过剔除，将可以将对象收集到CullingResults对象中。","updated":"2024-05-22T03:57:56.745Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":19555,"end":19669},{"type":"TextQuoteSelector","exact":"bool Cull () {ScriptableCullingParameters pif (camera.TryGetCullingParameters(out p)) {return true;}return false;}","prefix":"turns either success or failure.","suffix":"Why do we have to write out?When"}]}]}
>```
>%%
>*%%PREFIX%%turns either success or failure.%%HIGHLIGHT%% 
>==bool Cull () {
>	ScriptableCullingParameters p
>	if (camera.TryGetCullingParameters(out p)) {
>		return true;
>	}
>	return false;
>}== 
>%%POSTFIX%%Why do we have to write out?When*
>%%LINK%%[[#^kmkkdh0bi7|show annotation]]
>%%COMMENT%%
>可以通过修改获取到的ScriptableCullingParameters来控制剔除。通过使用剔除，可以只渲染摄像机能看到的物体，而非去渲染每个物体。通过剔除，将可以将对象收集到CullingResults对象中。
>%%TAGS%%
>
^kmkkdh0bi7

可以通过修改`cullingOptions`字段来配置剔除，例如：`cullingParameters.cullingOptions &= ~CullingOptions.OcclusionCull`

## 绘制几何物体

>%%
>```annotation-json
>{"created":"2024-05-22T03:59:55.051Z","text":"向DrawRenderers 方法提供剔除结果（CullingResults），绘制（DrawingSettings）和筛选（FilteringSettings）设置后，才能正确绘制场景中的物体","updated":"2024-05-22T03:59:55.051Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":22320,"end":22551},{"type":"TextQuoteSelector","exact":"void DrawVisibleGeometry () {var drawingSettings = new DrawingSettings();var filteringSettings = new FilteringSettings();context.DrawRenderers(cullingResults, ref drawingSettings, ref filteringSettings);context.DrawSkybox(camera);}","prefix":"metry, beforedrawing the skybox.","suffix":"We don't see anything yet becaus"}]}]}
>```
>%%
>*%%PREFIX%%metry, beforedrawing the skybox.%%HIGHLIGHT%% 
>==void DrawVisibleGeometry () {
>var drawingSettings = new DrawingSettings();
>var filteringSettings = new FilteringSettings();
>context.DrawRenderers(cullingResults, ref drawingSettings, ref filteringSettings);
>context.DrawSkybox(camera);
>}== 
>%%POSTFIX%%We don't see anything yet becaus*
>%%LINK%%[[#^el65f3rxgc8|show annotation]]
>%%COMMENT%%
>向DrawRenderers 方法提供剔除结果（CullingResults），绘制（DrawingSettings）和筛选（FilteringSettings）设置后，才能正确绘制场景中的物体
>%%TAGS%%
>
^el65f3rxgc8


>%%
>```annotation-json
>{"created":"2024-05-22T04:04:09.168Z","text":"向`DrawingSettings`结构体提供一个用于渲染无光物体的shader，这样就可以渲染出场景中所有无光效物体了","updated":"2024-05-22T04:04:09.168Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":22816,"end":22889},{"type":"TextQuoteSelector","exact":"static ShaderTagId unlitShaderTagId = new ShaderTagId(\"SRPDefaultUnlit\");","prefix":" and cache it in a static field.","suffix":"Provide it as the first argument"}]}]}
>```
>%%
>*%%PREFIX%%and cache it in a static field.%%HIGHLIGHT%% 
>==static ShaderTagId unlitShaderTagId = new ShaderTagId("SRPDefaultUnlit");== 
>%%POSTFIX%%Provide it as the first argument*
>%%LINK%%[[#^qcjswi9zb3i|show annotation]]
>%%COMMENT%%
>向`DrawingSettings`结构体提供一个用于渲染无光物体的shader，这样就可以渲染出场景中所有无光效物体了
>%%TAGS%%
>
^qcjswi9zb3i


>%%
>```annotation-json
>{"created":"2024-05-22T04:07:24.175Z","text":"`FilteringSettings`结构体，设置成筛选所有渲染队列的模式。","updated":"2024-05-22T04:07:24.175Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":23462,"end":23530},{"type":"TextQuoteSelector","exact":"var filteringSettings = new FilteringSettings(RenderQueueRange.all);","prefix":"ructor so we include everything.","suffix":"2024/5/19 23:46 Custom Render Pi"}]}]}
>```
>%%
>*%%PREFIX%%ructor so we include everything.%%HIGHLIGHT%% 
>==var filteringSettings = new FilteringSettings(RenderQueueRange.all);== 
>%%POSTFIX%%2024/5/19 23:46 Custom Render Pi*
>%%LINK%%[[#^n92jblaihli|show annotation]]
>%%COMMENT%%
>`FilteringSettings`结构体，设置成筛选所有渲染队列的模式。
>%%TAGS%%
>
^n92jblaihli

到目前为止，已经可以渲染出场景中的物体了。但是还是有问题：==不透明对象渲染有问题，有的消失了，有的只渲染了一部分==，通过使用Frame Debugger进行调试，发现是天空盒渲染带来的问题。

## 分别绘制不透明和透明几何图形

到此，绘制了所有未使用光照着色器的物体，这其中，但是天空盒却遮住了那些不透明物体后面的透明物体。出现这种情况是因为透明着色器不会写入深度缓冲区。透明着色器不会隐藏它们后面的东西，因为我们可以透过它们看到东西。解决方法是首先绘制不透明对象，然后绘制天空盒，最后才绘制透明对象。

>%%
>```annotation-json
>{"created":"2024-05-21T16:12:01.326Z","text":"由于透明物体与天空盒的存在，为了保证渲染结果的正确，需要先渲染不透明物体，再渲染天空盒，最后渲染透明物体。","updated":"2024-05-21T16:12:01.326Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":25452,"end":25548},{"type":"TextQuoteSelector","exact":"The solution is to first drawnopaque objects, then the skybox, and only then transparent objects","prefix":"ecause we can see through them. ","suffix":".We can eliminate the transparen"}]}]}
>```
>%%
>*%%PREFIX%%ecause we can see through them.%%HIGHLIGHT%% ==The solution is to first drawnopaque objects, then the skybox, and only then transparent objects== %%POSTFIX%%.We can eliminate the transparen*
>%%LINK%%[[#^y0tcsesyk8|show annotation]]
>%%COMMENT%%
>由于透明物体与天空盒的存在，为了保证渲染结果的正确，需要先渲染不透明物体，再渲染天空盒，最后渲染透明物体。
>%%TAGS%%
>
^y0tcsesyk8

# 编辑渲染

## 绘制旧版着色器

>%%
>```annotation-json
>{"created":"2024-05-22T04:14:18.002Z","text":"由于不支持的Shader没有渲染出来，这本质上来说，是不对的，因此增加一个方法用于处理这些不支持的Shader。","updated":"2024-05-22T04:14:18.002Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":28753,"end":29017},{"type":"TextQuoteSelector","exact":"void DrawUnsupportedShaders () {var drawingSettings = new DrawingSettings(legacyShaderTagIds[0], new SortingSettings(camera));var filteringSettings = FilteringSettings.defaultValue;context.DrawRenderers(cullingResults, ref drawingSettings, ref filteringSettings);}","prefix":"supportedShaders();Submit();}...","suffix":"We can draw multiple passes by i"}]}]}
>```
>%%
>*%%PREFIX%%supportedShaders();Submit();}...%%HIGHLIGHT%% 
>==void DrawUnsupportedShaders () {
>	var drawingSettings = new DrawingSettings(legacyShaderTagIds[0], new SortingSettings(camera));
>	var filteringSettings = FilteringSettings.defaultValue;
>	context.DrawRenderers(cullingResults, ref drawingSettings, ref filteringSettings);
>}== 
>%%POSTFIX%%We can draw multiple passes by i*
>%%LINK%%[[#^zp01ywf38ol|show annotation]]
>%%COMMENT%%
>由于不支持的Shader没有渲染出来，这本质上来说，是不对的，因此增加一个方法用于处理这些不支持的Shader。
>%%TAGS%%
>
^zp01ywf38ol

## 绘制错误的材质


>%%
>```annotation-json
>{"created":"2024-05-22T04:41:29.495Z","text":"创建一个错误材质，用于渲染不支持的Shader。另外，出于开发考虑，使用分部类，将这部分处理不支持shader的代码，仅仅放到在编辑器中处理。","updated":"2024-05-22T04:41:29.495Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":30358,"end":30623},{"type":"TextQuoteSelector","exact":"void DrawUnsupportedShaders () {if (errorMaterial == null) {errorMaterial =new Material(Shader.Find(\"Hidden/InternalErrorShader\"));}var drawingSettings = new DrawingSettings(legacyShaderTagIds[0], new SortingSettings(camera)) {overrideMaterial = errorMaterial};...}","prefix":"tatic Material errorMaterial;...","suffix":"Rendered with magenta error shad"}]}]}
>```
>%%
>*%%PREFIX%%tatic Material errorMaterial;...%%HIGHLIGHT%% 
>==void DrawUnsupportedShaders () {
>	if (errorMaterial == null) {
>		errorMaterial =new Material(Shader.Find("Hidden/InternalErrorShader"));
>	}
>	var drawingSettings = new DrawingSettings(legacyShaderTagIds[0], new SortingSettings(camera)) {overrideMaterial = errorMaterial};
>	...
>}== 
>%%POSTFIX%%Rendered with magenta error shad*
>%%LINK%%[[#^b54iktqwxue|show annotation]]
>%%COMMENT%%
>创建一个错误材质，用于渲染不支持的Shader。另外，出于开发考虑，使用分部类，将这部分处理不支持shader的代码，仅仅放到在编辑器中处理。
>%%TAGS%%
>
^b54iktqwxue

## 绘制Gizmos


>%%
>```annotation-json
>{"created":"2024-05-22T04:49:13.746Z","text":"调用`Handles.ShouldRenderGizmos`显示Gizmos，该方法须在所有物体绘制结束后，再调用","updated":"2024-05-22T04:49:13.746Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":34392,"end":34570},{"type":"TextQuoteSelector","exact":"partial void DrawGizmos () {if (Handles.ShouldRenderGizmos()) {context.DrawGizmos(camera, GizmoSubset.PreImageEffects);context.DrawGizmos(camera, GizmoSubset.PostImageEffects);}}","prefix":"edShaders ();#if UNITY_EDITOR...","suffix":"partial void DrawUnsupportedShad"}]}]}
>```
>%%
>*%%PREFIX%%edShaders ();#if UNITY_EDITOR...%%HIGHLIGHT%% 
>==partial void DrawGizmos () {
>	if (Handles.ShouldRenderGizmos()) {
>		context.DrawGizmos(camera, GizmoSubset.PreImageEffects);
>		context.DrawGizmos(camera, GizmoSubset.PostImageEffects);
>	}
>}== 
>%%POSTFIX%%partial void DrawUnsupportedShad*
>%%LINK%%[[#^e5c1wrqg38h|show annotation]]
>%%COMMENT%%
>调用`Handles.ShouldRenderGizmos`显示Gizmos，该方法须在所有物体绘制结束后，再调用
>%%TAGS%%
>
^e5c1wrqg38h

## 绘制UGUI

目前，如果创建一个UGUI对象，是无法在Scene视图中显示的，通过Frame Debugger可以发现，UI是单独绘制的，不是由自定义的渲染管道绘制的。
![[（图解4）帧调试器中的UI.png]]


>%%
>```annotation-json
>{"created":"2024-05-22T06:17:35.372Z","text":"在Cull之前调用`ScriptableRenderContext.EmitWorldGeometryForSceneView`方法，显式地将用户界面添加到世界几何体中进行渲染。","updated":"2024-05-22T06:17:35.372Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":36570,"end":36721},{"type":"TextQuoteSelector","exact":"partial void PrepareForSceneWindow () {if (camera.cameraType == CameraType.SceneView) {ScriptableRenderContext.EmitWorldGeometryForSceneView(camera);}}","prefix":"eneWindow ();#if UNITY_EDITOR...","suffix":"As that might add geometry to th"}]}]}
>```
>%%
>*%%PREFIX%%eneWindow ();#if UNITY_EDITOR...%%HIGHLIGHT%% 
>==partial void PrepareForSceneWindow () {
>	if (camera.cameraType == CameraType.SceneView) {
>		ScriptableRenderContext.EmitWorldGeometryForSceneView(camera);
>	}
>}== 
>%%POSTFIX%%As that might add geometry to th*
>%%LINK%%[[#^b08743urlju|show annotation]]
>%%COMMENT%%
>在Cull之前调用`ScriptableRenderContext.EmitWorldGeometryForSceneView`方法，显式地将用户界面添加到世界几何体中进行渲染。
>%%TAGS%%
>
^b08743urlju

# 多摄像机

## 两个摄像机

每个摄像头都有一个深度值，默认主摄像头的深度值为-1。它们会按照深度递增的顺序进行渲染。

## 清除标记

>%%
>```annotation-json
>{"created":"2024-05-22T06:52:07.224Z","text":"`CameraClearFlags`枚举值并不是独立的标志值，而是代表递减的清除量。除了最后一种情况，在其他所有情况下都必须清除深度缓冲区。除了`CameraClearFlags.Color`的情况，其他都不需要清理颜色缓冲区","updated":"2024-05-22T06:52:07.224Z","document":{"title":"Custom Render Pipeline","link":[{"href":"urn:x-pdf:43a511de2f13b3a0e3ec2f97c3aa0a76"},{"href":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf"}],"documentFingerprint":"43a511de2f13b3a0e3ec2f97c3aa0a76"},"uri":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","target":[{"source":"vault:/Custom SRP/attachments/Custom Render Pipeline.pdf","selector":[{"type":"TextPositionSelector","start":43967,"end":44134},{"type":"TextQuoteSelector","exact":"buffer.ClearRenderTarget(flags <= CameraClearFlags.Depth,flags == CameraClearFlags.Color,flags == CameraClearFlags.Color ?camera.backgroundColor.linear : Color.clear);","prefix":" we cansuffice with Color.clear.","suffix":"2024/5/19 23:46 Custom Render Pi"}]}]}
>```
>%%
>*%%PREFIX%%we cansuffice with Color.clear.%%HIGHLIGHT%% 
>==buffer.ClearRenderTarget(flags <= CameraClearFlags.Depth,
>flags == CameraClearFlags.Color,
>flags == CameraClearFlags.Color ?camera.backgroundColor.linear : Color.clear);==
> %%POSTFIX%%2024/5/19 23:46 Custom Render Pi*
>%%LINK%%[[#^14w6fckup4e|show annotation]]
>%%COMMENT%%
>`CameraClearFlags`枚举值并不是独立的标志值，而是代表递减的清除量。除了最后一种情况，在其他所有情况下都必须清除深度缓冲区。除了`CameraClearFlags.Color`的情况，其他都不需要清理颜色缓冲区
>%%TAGS%%
>
^14w6fckup4e
