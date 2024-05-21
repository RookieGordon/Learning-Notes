---
link: https://zhuanlan.zhihu.com/p/66156092
site: 知乎专栏
excerpt: Leon：The Rendering and Art of '11-11 Memories Retold'
  看了这篇文章，是真的骚，那个油画风格真的绝了。看了之后手真痒，然后定睛一看，要修改管线，点赞，收藏，关闭！ 之前我一直在看的是 @銀葉吉祥…
tags:
  - slurp/Unity（游戏引擎）
slurped: 2024-05-21T09:48:46.462Z
title: Unity SRP搞事（一）基本管线
---

[Leon：The Rendering and Art of '11-11 Memories Retold'](https://zhuanlan.zhihu.com/p/65714644)

看了这篇文章，是真的骚，那个油画风格真的绝了。看了之后手真痒，然后定睛一看，要修改管线，点赞，收藏，关闭！

之前我一直在看的是 [@銀葉吉祥](https://www.zhihu.com/people/0479798a2c2d842f7c2877ae3c2d3f7e) 的专栏，不过貌似他咕咕咕了，说好的2018年6月下旬发呢？SRP这一块的中文资料貌似还是比较少的，所以我也就边查边写了。

---

## 创建管线

Unity默认使用的是前向渲染管线，除此之外还有延迟渲染管线。为了使用自制的管线，我们首先要将管线创建为管线资源RenderPipelineAsset，它是一种ScriptableObject。

```
using UnityEngine;
using UnityEngine.Experimental.Rendering;

[CreateAssetMenu(menuName = "Rendering/NoobPipeline")]
public class NoobPipelineAsset : RenderPipelineAsset
{
    protected override IRenderPipeline InternalCreatePipeline()
    {
        return new NoobPipeline();
    }
}

public class NoobPipeline : RenderPipeline
{
    public override void Dispose()
    {
        base.Dispose();
    }

    public override void Render(ScriptableRenderContext renderContext, Camera[] cameras)
    {
        base.Render(renderContext, cameras);

    }
}
```

随后在资源窗口右键-Create-Rendering-NoobPipeline，我们就可以创建一个自制的管线资源。将这个资源放到Edit-Project Settings-Graphics中：

![](https://pic4.zhimg.com/v2-d3973d28f5de7241b1fd4cae51efddcf_b.png)

此时我们会发现，Scene窗口一片灰暗，Game窗口一片漆黑。Unity已经成功的使用了NRP作为正在使用中的渲染管线。在这一片空白的黑暗中，我们将为更多的色彩添砖加瓦。

根据wiki所述，Unity SRP实际是被分为两部分，一部分是SRP资源，也就是现在被装载的NoobPipelineAsset，它表示了管道的配置，例如：

- 是否应投射阴影
- 应使用什么着色器质量级别
- 阴影距离是多少
- 默认材质配置

SRP资源保存了哪些用户希望控制的配置。

而SRP实例是实际执行渲染的类，当Unity开始执行SRP时，它会要求当前的SRP资源返回一个渲染实例，实例中也会缓存SRP资源中的一些设置。

SRP实例中可能有以下动作诸如：

- 清空帧缓冲
- 场景剔除
- 渲染物体
- 从一个帧缓冲blit到另一个帧缓冲
- 渲染阴影
- 后处理

## 天空盒渲染

我们注意到，Render函数有两个参数，分别是ScriptableRenderContext和Camera[]。顾名思义，渲染管线接下来要实现的内容就是利用上下文和摄像机完成渲染，因为每一个Camera都会走一次完整渲染，因此我们改写成以下形式：

```
    public override void Render(ScriptableRenderContext renderContext, Camera[] cameras)
    {
        base.Render(renderContext, cameras);
        foreach (var camera in cameras)
            Render(renderContext, camera);
    }

    private void Render(ScriptableRenderContext renderContext, Camera camera)
    {
        renderContext.DrawSkybox(camera);
        renderContext.Submit();
    }
```

此时我们再去Game窗口看一下，有了，有天空了，神界原罪天下第一！

![](https://pic3.zhimg.com/v2-85e822b4c05c31727a25097799eda6f6_r.jpg)

但是，无论如何修改摄像机的朝向，天空盒被渲染的部分永远是正中央。这种睿智的现象是因为我们没有将上下文与相机绑定造成的：

```
renderContext.SetupCameraProperties(camera);
renderContext.DrawSkybox(camera);
renderContext.Submit();
```

SetupCameraProperties函数的注释是这样写的：Setup camera specific global shader variables. 也就是给摄像机设置好全局着色器变量，这里的全局着色器变量，应当就是Unity Shader中常常要用到的诸如WorldSpaceLightPos0之类的。

## CommandBuffer

根据官方文档描述，CommandBuffer用于拓展渲染管线，一个CommandBuffer储存了一系列的渲染指令，可以在Camera渲染的不同时刻插入并执行。

![](https://pic4.zhimg.com/v2-41fddecce61c22a13715375ea69a34cf_b.jpg)

图片引自【5】

通常CommandBuffer用于快速地执行一些需要违背管线次序的效果，比如透视效果就需要在某种程度上使被遮挡的物体在深度测试中保留下来。这时使用CommandBuffer就可以在上图的绿点处插入执行，给予了开发者更多的余地——CameraEvent定义了25种不同的情形，相信无论是流水线的哪个阶段需要插入，都能找到自己需要的情形。

![](https://pic3.zhimg.com/v2-d1700090c0dfb74e33c1b5436a4c19da_b.jpg)

丰富的情形可供选择

```
    private CommandBuffer commandBuffer;
    public NoobPipeline()
    {
        commandBuffer = new CommandBuffer();
    }

    public override void Dispose()
    {
        commandBuffer.Release();
        base.Dispose();
    }

    private void Render(ScriptableRenderContext renderContext, Camera camera)
    {
        //配置CommandBuffer命令
        commandBuffer.Clear();
        commandBuffer.name = camera.name;
        var flags = camera.clearFlags;
        commandBuffer.ClearRenderTarget(
            (flags & CameraClearFlags.Depth) != 0,
            (flags & CameraClearFlags.Color) != 0,
            camera.backgroundColor);
        renderContext.SetupCameraProperties(camera);
        renderContext.ExecuteCommandBuffer(commandBuffer);
        renderContext.DrawSkybox(camera);
        renderContext.Submit();
    }
```

我们先用CommandBuffer实现一个基本的清理上一帧图像的功能。使用获取到的摄像机的相关参数清空之后，再渲染天空球。在Frame Debugger中，我们可以看到目前管线的渲染过程：

![](https://pic3.zhimg.com/v2-503493adda226dc34a75306cd24c4806_b.png)

## 剔除和绘制

在渲染流水线中，剔除是决定了什么呈现在屏幕上的一个步骤，它是可以配置的。Unity的Culling中包含了两种剔除：

- 基于相机视锥体的剔除——相机远近平面之间的对象才能被看到
- 基于遮挡的剔除——被其他物体完全遮挡的对象会被剔除

SRP中的剔除提供了一系列API来帮助开发者配置，类似：

```
// Create an structure to hold the culling paramaters
ScriptableCullingParameters cullingParams;

//Populate the culling paramaters from the camera
if (!CullResults.GetCullingParameters(camera, stereoEnabled, out cullingParams))
    continue;

// if you like you can modify the culling paramaters here
cullingParams.isOrthographic = true;

// Create a structure to hold the cull results
CullResults cullResults = new CullResults();

// Perform the culling operation
CullResults.Cull(ref cullingParams, context, ref cullResults);
```

为了看到效果，我们先扔几个物体到场景里，并且设置好对应的材质：

![](https://pic1.zhimg.com/v2-2f659435026ff72412518667b21ef34c_b.jpg)

其中Unlit Transparent不需要赋值贴图，因此它现在呈现为没有透明度的白色。

![](https://pic1.zhimg.com/v2-ad8cc9519f5cefaedd47439706e600a4_b.png)

当然，做这个操作的时候先要把我们编写的管线资源卸载掉，否则在scene视图也好，game视图也罢，都是看不到的。

```
    private CommandBuffer commandBuffer;
    private ScriptableCullingParameters cullingParameters;
    private CullResults cullResult;
    public NoobPipeline()
    {
        commandBuffer = new CommandBuffer();
        cullResult = new CullResults();
    }

    private void Render(ScriptableRenderContext renderContext, Camera camera)
    {
        //配置CommandBuffer命令
        commandBuffer.Clear();
        commandBuffer.name = camera.name;
        var flags = camera.clearFlags;
        commandBuffer.ClearRenderTarget(
            (flags & CameraClearFlags.Depth) != 0,
            (flags & CameraClearFlags.Color) != 0,
            camera.backgroundColor);
        //开始剔除
        if (!CullResults.GetCullingParameters(camera, out cullingParameters))
        {
            //若没有有效的剔除参数，就结束摄像机的渲染
            return;
        }
        CullResults.Cull(ref cullingParameters, renderContext, ref cullResult);
        //开始绘制
        renderContext.SetupCameraProperties(camera);
        renderContext.ExecuteCommandBuffer(commandBuffer);
        var drawSettings = new DrawRendererSettings(camera, new ShaderPassName("SRPDefaultUnlit"));
        var filterSettings = new FilterRenderersSettings(true);//该过滤包含所有物体
        renderContext.DrawRenderers(cullResult.visibleRenderers, ref drawSettings, filterSettings);
        renderContext.DrawSkybox(camera);
        renderContext.Submit();
    }
```

在上述代码中，我们先从摄像机中拿到对应的剔除参数，然后使用Cull方法，结合剔除参数和Context得到剔除结果。ScriptableCullingParameters里还有对剔除的诸多设置，如果对从摄像机拿到的裁减参数不满意，还可以做修改。

除了剔除结果之外，在渲染的时候还需要两个参数：渲染设置和过滤设置。

过滤设置实际上是对**可见物体**的管理，比如对于某个相机，我只想渲染Layer为某个值的画面，以达到特殊的画面效果，这个Layer设置之后，就是在过滤设置里头进行过滤；学过Shader之后也知道，哦，透明物体要设为Transparent，它会在所有深度缓冲都设置好之后再渲染，这个次序问题也是由过滤设置管理的。这里我们先包含所有可见物体试试。

而渲染设置则需要提供相机和一个Shader Pass。这个相机用来设置排序和剔除层级，而渲染时候则使用提供的Shader Pass进行渲染。这里我们先使用unity的默认unlit材质，标记为"SRPDefaultUnlit"。

奇怪的是，我们只看到了一个物体，也就是Unlit/Color所在的那个球体。Standard没有看到很正常，因为渲染参数传入的Pass是Unlit，那么Unlit/Transparent呢？

![](https://pic3.zhimg.com/v2-6c42d9886543c90cdd4e373976c0396e_b.jpg)

打开Frame Debugger，可以看到透明物体实际上在天空盒渲染前被渲染了。所以剩下的问题是要调整渲染的次序。所以我们要Draw两次，第一次绘制不透明物体，第二次在天空盒绘制后绘制透明物体。

如果现在有两个不透明的物体叠在一起，我们先绘制哪个呢？如果我们先绘制远的那个，那么近的那个在渲染的时候就会重新绘制一次重叠区域。因此我们先绘制近的那个，再绘制远的那个物体时，重叠区域的像素会因为无法通过深度测试而不被渲染，大大降低了渲染压力。

Unity SRP中为我们提供了简单的排序方法，只需指定Sort Flag就能排序。对于不透明物体和透明物体，只需指定drawSettings.sorting.flags。

```
        //绘制不透明物体
        var drawSettings = new DrawRendererSettings(camera, new ShaderPassName("SRPDefaultUnlit"));
        var filterSettings = new FilterRenderersSettings(true)
        {
            renderQueueRange = RenderQueueRange.opaque
        };
        drawSettings.sorting.flags = SortFlags.CommonOpaque;
        renderContext.DrawRenderers(cullResult.visibleRenderers, ref drawSettings, filterSettings);
        //绘制天空盒
        renderContext.DrawSkybox(camera);
        //绘制透明物体
        drawSettings.sorting.flags = SortFlags.CommonTransparent;
        filterSettings.renderQueueRange = RenderQueueRange.transparent;
        renderContext.DrawRenderers(cullResult.visibleRenderers, ref drawSettings, filterSettings);
        //提交
        renderContext.Submit();
```

这回，剩下的白色球体也被绘制出来了。

一些优化

除了DrawRendererSettings需要使用Camera之外，其他能复用的都复用。而每次使用camera.name的时候，都会新建一个新的string类型，所以这一块干脆使用字符串常量。

```
//绘制透明物体
……
//绘制错误物体
DrawErrorShaderObject(renderContext, camera);
//提交
renderContext.Submit();

private void DrawErrorShaderObject(ScriptableRenderContext renderContext, Camera camera)
{
    if (errorMaterial == null)
    {
        Shader errorShader = Shader.Find("Hidden/InternalErrorShader");
        errorMaterial = new Material(errorShader)
        {
           hideFlags = HideFlags.HideAndDontSave
       };
    }
    var drawSettings = new DrawRendererSettings(camera, new ShaderPassName("ForwardBase"));
    drawSettings.SetOverrideMaterial(errorMaterial, 0);
    renderContext.DrawRenderers(cullResult.visibleRenderers, ref drawSettings, errorFilter);
}
```

上述代码是将不支持的“错误Shader”的物体于最后渲染，因为我们不关心它的渲染顺序，我们要做的就是将它展现出来，因此使用DrawRendererSettings的SetOverrideMaterial方法，用Unity内置的error shader进行渲染。

DrawRendererSettings之所以使用“ForwardBase”作为Pass Name，是因为目前我们的SRP只支持前向光照，而默认的表面着色器是有这个Pass的，如果还想将其他Shader Pass明确作为错误Shader提示，也可用SetShaderPassName方法添加。

### 参考资料

【1】[Custom Pipeline](https://link.zhihu.com/?target=https%3A//catlikecoding.com/unity/tutorials/scriptable-render-pipeline/custom-pipeline/)

【2】[銀葉吉祥：一起来写Unity渲染管线吧！一 搭建最基本的管线](https://zhuanlan.zhihu.com/p/35862626)

【3】[https://blog.csdn.net/qq_18229381/article/details/78053018](https://link.zhihu.com/?target=https%3A//blog.csdn.net/qq_18229381/article/details/78053018)

【4】[Graphics Command Buffers](https://link.zhihu.com/?target=https%3A//docs.unity3d.com/Manual/GraphicsCommandBuffers.html)

【5】[使用CommandBuffer实现描边效果](https://link.zhihu.com/?target=https%3A//www.jianshu.com/p/6e75467a17d4)