---
link: https://www.cnblogs.com/unity2018/p/8492463.html
excerpt: Unity 2018.1 beta中引入的Scriptable Render
  Pipeline可编程脚本渲染管线，简称SRP。是一种在Unity中通过C#脚本配置和执行渲染的方式。在编写自定义渲染管线之前，必须要先理解渲染管线的含义。本文将帮助你开始学习编写自定义SRP。
  本文演示项目，请访问Git
slurped: 2024-05-21T09:25:07.234Z
title: 可编程脚本渲染管线SRP - Unity官方平台 - 博客园
---

[Unity 2018.1 beta](http://mp.weixin.qq.com/s?__biz=MzU5MjQ1NTEwOA==&mid=2247490255&idx=1&sn=9ac8ae68f57eb86631455cfbe944327b&chksm=fe1e2e64c969a772ed7c1bf5a0b1282ce669bb4fceed90c75b1de6faf7f153ea3146a08ea228&scene=21#wechat_redirect)中引入的Scriptable Render Pipeline可编程脚本渲染管线，简称SRP。是一种在Unity中通过C#脚本配置和执行渲染的方式。在编写自定义渲染管线之前，必须要先理解渲染管线的含义。本文将帮助你开始学习编写自定义SRP。

本文演示项目，请访问Github下载：

[https://github.com/stramit/SRPBlog/tree/master/SRP-Demo](https://github.com/stramit/SRPBlog/tree/master/SRP-Demo)

**什么是渲染管线**

渲染管线是将对象显示到屏幕上所需的一系列技术的总称。它包含: 剔除、渲染对象、后期处理等一系列高级概念。这些高级概念还可以分别根据你所希望的执行方式继续分解。

例如：渲染对象可以按照以下方式进行

- 多通道渲染：每个光照每个对象一个通道
    
- 单通道渲染：每个对象一个通道
    
- 延迟渲染：渲染表面属性到一个G-Buffer，执行屏幕空间光照。
    

这些就是当你编写一个自定义SRP时需要作出的决定。每项技术都有一些需要考虑的性能成本。

**渲染入口点**

当使用SRP时，你需要定一个类，用于控制渲染；这就是你将要创建的渲染管线。入口点是一个对“Render”函数的调用，它需要两个参数，渲染上下文以及一个需要渲染的摄像机列表。

```CSharp
public class BasicPipeInstance : RenderPipeline
{
   public override void Render(ScriptableRenderContext context, Camera[] cameras){}
}
```

**渲染管线上下文**

SRP渲染采用的是延迟执行的方式。用户要设置好需要执行的命令列表，然后再执行。用来设置这些命令的对象叫做“ScriptableRenderContext”。当你向上下文填充完操作命令后，可以通过调用“Submit”提交队列中的所有绘制调用。

举例来说，使用一个由渲染上下文执行的命令缓冲区清除一个渲染目标：
```CSharp
//新建一个命令缓冲区
//用于向渲染上下文发送命令
var cmd = new CommandBuffer();
 
//发送一个清除渲染目标的命令
cmd.ClearRenderTarget(true, false, Color.green);
 
//执行命令缓冲区
context.ExecuteCommandBuffer(cmd);
```

![](https://mmbiz.qpic.cn/mmbiz_png/mToLbH2dg6eUqkiaG1DT3J8b8MXZfegx9TEVtiafGcaCTVpzgsdoCl3xErXU4U70K2nLXXwx5LQrKdB90UiaxQeuA/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

_一个简单渲染管线示例_ 

下面有一个完整的渲染管线代码，仅仅用于清除屏幕。
```Csharp
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Experimental.Rendering;
 
[ExecuteInEditMode]
public class BasicAssetPipe : RenderPipelineAsset
{
    public Color clearColor = Color.green;
 
#if UNITY_EDITOR
    [UnityEditor.MenuItem("SRP-Demo/01 - Create Basic Asset Pipeline")]
    static void CreateBasicAssetPipeline()
    {
        var instance = ScriptableObject.CreateInstance<BasicAssetPipe>();
        UnityEditor.AssetDatabase.CreateAsset(instance, "Assets/SRP-Demo/1-BasicAssetPipe/BasicAssetPipe.asset");
    }
#endif
 
    protected override IRenderPipeline InternalCreatePipeline()
    {
        return new BasicPipeInstance(clearColor);
    }
}
 
public class BasicPipeInstance : RenderPipeline
{
    private Color m_ClearColor = Color.black;

    public BasicPipeInstance(Color clearColor)
    {
        m_ClearColor = clearColor;
    }
 
    public override void Render(ScriptableRenderContext context, Camera[] cameras)
    {
        base.Render(context, cameras);
        var cmd = new CommandBuffer();
        cmd.ClearRenderTarget(true, true, m_ClearColor);
        context.ExecuteCommandBuffer(cmd);
        cmd.Release();
        context.Submit();
    }
}
```

**剔除**

剔除是确定要在屏幕上显示什么对象的过程。

在Unity中，剔除包括：

- 视锥剔除：计算存在于摄像机远*视*面之间的对象。
- 遮挡剔除：计算哪些对象被其它对象挡住，并将它们从渲染中排除。
    

当渲染开始时，首先要计算的是到底要渲染什么。这包括获取摄像机，并从摄像机的视角进行剔除操作。剔除操作会返回一个可为摄像机进行渲染的对象和光照的列表。这些对象随后将被用在渲染管线中。

**SRP中的剔除操作**

在SRP中，你通常会选择某个摄像机的视角执行对象渲染。这与Unity内置渲染所使用的摄像机对象是相同的。SRP提供了一系列API用于剔除操作。整个流程通常看起来像下面这样：
```CSharp
//新建一个结构体，用于存储剔除参数
ScriptableCullingParameters   cullingParams;
 
//填充来自摄像机的剔除参数
if   (!CullResults.GetCullingParameters(camera, stereoEnabled, out cullingParams))
      continue;
 
//如果你想修改剔除参数，可在这里进行
cullingParams.isOrthographic   = true;
 
//新建一个结构体，用于存储剔除结果
CullResults   cullResults = new CullResults();
 
//执行剔除操作
CullResults.Cull(ref   cullingParams, context, ref cullResults);
```

现在可以使用填充的剔除结果执行渲染了。

**绘制**

现在我们已有了一组剔除结果，可以将它们渲染到屏幕了。但还有很多东西需要配置，所以有一些选择需要事先确定。这些选择的驱动因素有：

- 渲染管线的目标硬件
    
- 希望获得的观感
    
- 制作的项目的类型
    

例如一个移动2D滚轴游戏和一个PC端第一人称游戏，这些游戏所受的约束条件大不相同，因此它们的渲染管线自然也就大相径庭。以下是一些实际可能需要面对的选择：

-  高动态范围 vs 低动态范围
    
- 线性 vs 伽马
    
- 多重采样抗锯齿（MSAA） vs 后期处理抗锯齿
    
- PBR材质 vs 简单材质
    
- 光照 vs 无光照
    
- 光照技术
    
- 阴影技术
    

在编写渲染管线时作好这些决定将有助于确定在创作时遇到的许多约束。

现在我们将演示一个无光照的简易渲染器，这个渲染器可以将一些对象渲染为不透明。

 **过滤：渲染区域（Bucket）和图层（Layer）**

一般来说，渲染对象会有某个特定分类，比如不透明、透明、次面，或其它的什么类别。Unity用一个称为队列（queue） 的概念表示需要进行渲染的对象，这些队列进而组成存放对象的区域（bucket）（源自对象上的材质）。当从SRP调用渲染时，需要制定所使用区域的范围。

除了区域之外，标准的Unity图层也可以被用于过滤。这为通过SRP绘制对象时提供了额外的过滤能力。
```CSharp
//获取不透明渲染过滤器设置
var   opaqueRange = new FilterRenderersSettings();
 
//设置不透明队列的范围
opaqueRange.renderQueueRange   = new RenderQueueRange()
{
      min = 0,
      max = (int)UnityEngine.Rendering.RenderQueue.GeometryLast,
};
 
//Include   all layers包括所有图层
opaqueRange.layerMask   = ~0;
```

**绘制设置：应当如何绘制**

过滤和剔除确定了渲染什么，但随后我们还需要确定如何渲染。SRP提供了一系列不同的选项，配置被过滤对象的渲染方式。用于进行这个数据的结构体叫做“DrawRenderSettings”。这个结构体可对许多方面进行配置：

- 排序——对象渲染的顺序，例如自后向前和自前向后
    
- 每渲染器标志 —— 应当从Unity传递给着色器的“内置”设置，这包括每个对象的光照探头，每个对象的光照贴图之类的东西。
    
- 渲染标志 —— 用于进行批处理的算法，实例化 vs 非实例化
    
- 着色器通道 —— 当前绘制调用应当使用哪个着色器通道   
    
```Csharp
//新建绘制渲染设置
//注意它需要输入一个着色器通道名
var drs =   new DrawRendererSettings(Camera.current, new ShaderPassName("Opaque"));
 
//启用绘制调用上的实例化
drs.flags =   DrawRendererFlags.EnableInstancing;
 
//传递光照探针和光照贴图数据给每个渲染器
drs.rendererConfiguration   = RendererConfiguration.PerObjectLightProbe |   RendererConfiguration.PerObjectLightmaps;
 
//像普通不透明对象一样排序对象
drs.sorting.flags   = SortFlags.CommonOpaque;
```

**绘制**

 现在我们已有了发送一个绘制调用所需的三样东西：

- 剔除结果
    
- 过滤规则
    
- 绘制规则
    

我们可以发送一个绘制调用了。就像SRP中的所有东西一样，绘制调用也是以一个针对上下文发出的调用。在SRP中，你通常不会渲染单独的网格，而是发出一个调用，一次性渲染大批量的网格。这不仅减少了脚本执行上的开销，也使CPU上的执行得以快速作业化。

要发送一个绘制调用，需要将我们已有的东西进行合并。
```CSharp
//绘制所有渲染器
context.DrawRenderers(cullResults.visibleRenderers,   ref drs, opaqueRange);
//提交上下文，这将执行所有队列中的命令。
context.Submit();
```

这将会把对象绘制到当前绑定的渲染目标中。你可以使用一个命令缓冲区，按需切换渲染目标。

![](https://mmbiz.qpic.cn/mmbiz_png/mToLbH2dg6eUqkiaG1DT3J8b8MXZfegx9sGaricCZicicwN8g7e6ojcEw5JNA3H4Sl94Vpx5T2v0C54EAKoMyx4Hvg/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

这是一个可以渲染不透明对象的渲染器：
```Csharp
using System;    
using UnityEngine;    
using UnityEngine.Rendering;    
using UnityEngine.Experimental.Rendering; 

[ExecuteInEditMode]    
public class OpaqueAssetPipe : RenderPipelineAsset    
{    
	#if UNITY_EDITOR    
	[UnityEditor.MenuItem("SRP-Demo/02 - Create Opaque Asset Pipeline")]    
	static void CreateBasicAssetPipeline()    
	{    
		var instance = ScriptableObject.CreateInstance<OpaqueAssetPipe>();    
		UnityEditor.AssetDatabase.CreateAsset(instance, "Assets/SRP-Demo/2-OpaqueAssetPipe/OpaqueAssetPipe.asset");    
	}    
	#endif    
	protected override IRenderPipeline InternalCreatePipeline()    
	{    
		return new OpaqueAssetPipeInstance();    
	}    
}    
public class OpaqueAssetPipeInstance : RenderPipeline    
{    
	public override void Render(ScriptableRenderContext context, Camera[] cameras)    
	{    
		base.Render(context, cameras);    
		foreach (var camera in cameras)    
		{    
			ScriptableCullingParameters cullingParams;    
			if (!CullResults.GetCullingParameters(camera, out cullingParams))  
				continue;    
				
			CullResults cull = CullResults.Cull(ref cullingParams, context);    
			
			context.SetupCameraProperties(camera);    
			var cmd = new CommandBuffer();    
			cmd.ClearRenderTarget(true, false, Color.black);    
			context.ExecuteCommandBuffer(cmd);    
			cmd.Release();    
			var settings = new DrawRendererSettings(camera, new ShaderPassName("BasicPass"));    
			settings.sorting.flags = SortFlags.CommonOpaque;    
			var filterSettings = new FilterRenderersSettings(true) { renderQueueRange = RenderQueueRange.opaque };    
			context.DrawRenderers(cull.visibleRenderers, ref settings, filterSettings);    
			context.DrawSkybox(camera);    
			context.Submit();    
		}    
	}    
} 
```

这个示例可以进一步扩展，添加透明渲染：
```Csharp
using System;    
using UnityEngine;    
using UnityEngine.Rendering;    
using UnityEngine.Experimental.Rendering;   

[ExecuteInEditMode]    
public class TransparentAssetPipe : RenderPipelineAsset    
{    

#if UNITY_EDITOR    
	[UnityEditor.MenuItem("SRP-Demo/03 - Create Transparent Asset Pipeline")]  
	static void CreateBasicAssetPipeline()    
	{    
		var instance = ScriptableObject.CreateInstance<TransparentAssetPipe>();    
		UnityEditor.AssetDatabase.CreateAsset(instance, "Assets/SRP-Demo/3-TransparentAssetPipe/TransparentAssetPipe.asset");    
	}    
#endif    

	protected override IRenderPipeline InternalCreatePipeline()    
	{    
		return new TransparentAssetPipeInstance();    
	}    
}    
public class TransparentAssetPipeInstance : RenderPipeline    
{    
	public override void Render(ScriptableRenderContext context, Camera[] cameras)    
	{    
		base.Render(context, cameras);    
		foreach (var camera in cameras)    
		{    
			ScriptableCullingParameters cullingParams;    
			if (!CullResults.GetCullingParameters(camera, out cullingParams))  
				continue;  
				  
			CullResults cull = CullResults.Cull(ref cullingParams, context);    
			context.SetupCameraProperties(camera);    
			var cmd = new CommandBuffer();    
			cmd.ClearRenderTarget(true, false, Color.black);    
			context.ExecuteCommandBuffer(cmd);    
			cmd.Release();    
			
			var settings = new DrawRendererSettings(camera, new ShaderPassName("BasicPass"));    
			settings.sorting.flags = SortFlags.CommonOpaque;    
			var filterSettings = new FilterRenderersSettings(true) { renderQueueRange = RenderQueueRange.opaque };    
			context.DrawRenderers(cull.visibleRenderers, ref settings, filterSettings);    
			context.DrawSkybox(camera);    
			settings.sorting.flags = SortFlags.CommonTransparent;    
			filterSettings.renderQueueRange = RenderQueueRange.transparent;    
			context.DrawRenderers(cull.visibleRenderers, ref settings, filterSettings);    
			context.Submit();    
		}    
	}    
}  
```

这里要重点注意的是，渲染透明时，渲染顺序会变为自后向前。

![](https://mmbiz.qpic.cn/mmbiz_png/mToLbH2dg6eUqkiaG1DT3J8b8MXZfegx9vnAQmJtibs2UWYNzEe9mcEjFd34YibC0QtuH9UvZZ7Y3x6PIZiabFSeIw/640?wx_fmt=png&tp=webp&wxfrom=5&wx_lazy=1)

**小结**

我们希望本篇文章能帮你入门，开始编写你自己的自定义SRP。下载Unity 2018.1 beta 即刻开始创作自定义SRP的旅程吧。更多关于Unity 2018.1的信息请访问[Unity Connect*台](https://connect.unity.com/t/unitychina)!