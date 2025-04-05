---
tags:
  - Unity开发技术/动画性能优化/动画烘焙，GPU动画
  - mytodo
  - 动画烘焙
  - GPU-Animation
  - GPU-Instancing
  - 动画蒙皮
  - 骨骼动画
type: Study
course: Unity开发技术
courseType: Section
fileDirPath: 游戏开发技术探索/Unity开发技术/动画性能优化
dateStart: 2025-03-27
dateFinish: 2025-03-27
finished: false
banner: Study
displayIcon: pixel-banner-images/章节任务.png
---
# 动画烘焙
CPU端播放大量的动画是一个非常巨大的消耗，究其原因在于，无法使用常规的性能优化手段（[[关于静态批处理动态批处理GPU Instancing SRP Batcher的详细剖析|静态合批，动态合批]]）来进行优化，具体原因，参考：[[关于Unity中动画性能优化的问答#Unity中，简单的，低面数的骨骼动画是否可以采用动态合批进行性能优化，比如场景中同时实例化20个相同的模型进行动画播放？]]
因此，对于动画的性能优化，目前三种常规的解决方案：
1. [[关于Unity中动画性能优化的问答#**一、GPU蒙皮与骨骼矩阵传递**|GPU蒙皮+骨骼矩阵]]；
	- 适用于大规模成群的动画
	- 核心思想：[[关于Unity中动画性能优化的问答#^2d5863|通过GPU Instancing批量渲染多个骨骼动画角色，将每实例的骨骼矩阵数据通过ComputeBuffer传递至Shader，在GPU端完成顶点蒙皮计算，从而减少CPU与GPU间的数据交互和Draw Call数量。]]
2. [[关于Unity中动画性能优化的问答#**二、预生成动画纹理（Animation Texture）**10|预生成动画纹理]]；
	- 适用于比较固定的动画
	- 核心思想：[[关于Unity中动画性能优化的问答#^98902c|将动画的骨骼矩阵序列离线烘焙到纹理，运行时通过采样纹理获取骨骼矩阵，结合GPU Instancing批量渲染。]]
3. [[关于Unity中动画性能优化的问答#**五、ECS + GPU Instancing**|ECS+GPU Instancing]]
# GPU蒙皮

# 预生成动画
将动画离线烘焙到纹理贴图，有两种方法：1、直接烘焙顶点数据；2、烘焙骨骼数据；运行时，通过shader从纹理中获取动画数据，进而播放动画。
## 烘焙顶点
### 创建纹理贴图
```CSharp
/// <summary>  
/// 根据SkinnedMeshRenderer和动画，创建一张纹理贴图  
/// </summary>  
private Texture2D _CreateTexture(SkinnedMeshRenderer render, 
								AnimationClip[] clips, 
								out AnimationEvent[] events)  
{  
    var vertexCount = render.sharedMesh.vertexCount;  
    var totalVertexRecord = vertexCount * 2;  
    var totalFrame = _GetClipParams(clips, out events);  
    return new Texture2D(Mathf.NextPowerOfTwo(totalVertexRecord), 
					    Mathf.NextPowerOfTwo(totalFrame),  
				        TextureFormat.RGBAHalf, false)  
    {        
	    filterMode = FilterMode.Point,  
        wrapModeU = TextureWrapMode.Clamp,  
        wrapModeV = TextureWrapMode.Repeat  
    };  
}
```
纹理贴图的宽高由顶点数和动画片段的时长决定。纹理的宽高遵循POT规则，`Mathf.NextPowerOfTwo`方法，会返回一个比参数大的最小POT的值。
纹理的宽和两倍的蒙皮顶点数量有关，高和动画片段的时长有关。为什么宽需要顶点数乘以2呢？因为需要存储顶点位置和顶点法向量，一共六个值，因此最少需要两个像素才行。
U方向就是宽度方向，记录的是顶点序号，因此wrapMode需要设为Clamp（没有多余的数据可以读取）。而V方向是帧率方向，Repeat模式可以重复读取。
`_GetClipParams`用于计算纹理贴图的高度，并且提取动画片段的设置参数到`AnimationTickerClip`中
```CSharp
private static int _GetClipParams(AnimationClip[] clips, out AnimationTickerClip[] clipParams)  
{  
    int totalHeight = 0;  
    clipParams = new AnimationTickerClip[clips.Length];  
    for (int i = 0; i < clips.Length; i++)  
    {        
        var clip = clips[i];  
  
        var instanceEvents = new AnimationTickEvent[clip.events.Length];  
        for (int j = 0; j < clip.events.Length; j++)  
        {            
            instanceEvents[j] = new AnimationTickEvent(clip.events[j], clip.frameRate);  
        }  
        clipParams[i] = new AnimationTickerClip(clip.name, totalHeight, 
                                                clip.frameRate, clip.length, 
                                                clip.isLooping, instanceEvents);  
        var frameCount = (int)(clip.length * clip.frameRate);  
        totalHeight += frameCount;  
    }  
    return totalHeight;  
}
```
`AnimationTickerClip`对象，用于记录动画片段的设置参数
```CSharp
public struct AnimationTickerClip  
{  
    public string Name;  
    /// <summary>  
    /// 当前动画片段，在纹理贴图中的高度轴的起始位置  
    /// </summary>  
    public int FrameBegin;  
    public int FrameCount;  
    public bool Loop;  
    public float Length;  
    public float FrameRate;  
    public AnimationTickEvent[] Events;  
}
```
`FrameBegin`用于记录当前片段在纹理贴图中，高度所在的起始位置。纹理贴图的宽记录的是帧率，高记录的是所有片段的动画数据。
`AnimationTickEvent`对象，用于记录动画片段中的事件
```CSharp
public struct AnimationTickEvent  
{  
    public float keyFrame;  
    public string identity;
}
```

### 读取顶点数据，写入纹理
使用Unity提供的API——[Unity - Scripting API: AnimationClip.SampleAnimation](https://docs.unity3d.com/ScriptReference/AnimationClip.SampleAnimation.html)和[Unity - Scripting API: SkinnedMeshRenderer.BakeMesh](https://docs.unity3d.com/ScriptReference/SkinnedMeshRenderer.BakeMesh.html)可以对动画片段进行采样。`AnimationClip.SampleAnimation`可以实现在非运行状态下播放动画，`SkinnedMeshRenderer.BakeMesh`可以将动画蒙皮的状态进行快照，保存成一个mesh。
```CSharp
private static void _WriteVertexData(GameObject fbxObj, 
                                    SkinnedMeshRenderer render, 
                                    AnimationClip[] clips,  
                                    AnimationTickerClip[] clipParams, 
                                    Texture2D texture)  
{  
    for (int i = 0; i < clips.Length; i++)  
    {        
        var clip = clips[i];  
        var vertexBakedMesh = new Mesh();  
        var length = clip.length;  
        var frameRate = clip.frameRate;  
        var frameCount = (int)(length * frameRate);  
        var startFrame = clipParams[i].FrameBegin;  
        for (int j = 0; j < frameCount; j++)  
        {            
            clip.SampleAnimation(fbxObj, length * j / frameCount);  
            render.BakeMesh(vertexBakedMesh);  
            var vertices = vertexBakedMesh.vertices;  
            var normals = vertexBakedMesh.normals;  
            for (int k = 0; k < vertices.Length; k++)  
            {                
	            var frame = startFrame + j;  
                var pixel = GPUAniUtil.GetVertexPositionPixel(k, frame);  
                texture.SetPixel(pixel.x, pixel.y, ColorUtil.ToColor(vertices[k]));  
                pixel = GPUAniUtil.GetVertexNormalPixel(k, frame);  
                texture.SetPixel(pixel.x, pixel.y, ColorUtil.ToColor(normals[k]));  
            }        
        }    
    }
}
```
`length * j / frameCount`代表动画播放的的时间点，将当前时间点的蒙皮快照到`vertexBakedMesh`中，获取其中的顶点和法线数据。
因为顶点和法线占用两个像素，因此`GetVertexPositionPixel`方法中，顶点的位置需要乘以2。
```CSharp
public static int2 GetVertexPositionPixel(int vertexIndex, int frame)  
{  
    return new int2(vertexIndex * 2, frame);  
}  
  
public static int2 GetVertexNormalPixel(int vertexIndex, int frame)  
{  
    return new int2(vertexIndex * 2 + 1, frame);  
}
```

## 烘焙骨骼
### 创建纹理贴图
```CSharp
private static Texture2D _CreateBoneTexture(SkinnedMeshRenderer render, 
                                            AnimationClip[] clips,  
                                            out AnimationTickerClip[] clipParams)  
{  
    var transformCount = render.sharedMesh.bindposes.Length;  
    var totalWidth = transformCount * 3;  
    var totalFrame = _GetClipParams(clips, out clipParams);  
    return _CreateTexture(Mathf.NextPowerOfTwo(totalWidth), 
                        Mathf.NextPowerOfTwo(totalFrame));  
}
```
和创建顶点的纹理贴图类似，不过贴图的宽度是和骨骼数量相关的，乘以3，是因为需要记录的$4*4$方阵只需要记录12个参数（[[关于Unity中动画性能优化的问答#^744006|方阵的最后一行不需要记录]]）
## 运行时
### 自定义动画控制器
### 自定义动画

# 编辑器界面开发
Unity中，编辑器开发需要注意Unity的刷新和编译过程，会导致界面因为运行环境的改变而产生报错。因此需要对界面进行保存（序列化）操作，在运行环境产生变化后，及时还原数据，从而避免报错。
在Window中，声明`_serializedWindow`字段，然后将数据序列化的结果保存到某个地方，在Unity的运行，编译，资源导入等事件中，重新反序列化窗口即可。
```CSharp
private SerializedObject _serializedWindow;
private string _serializedPath;

private static void _InitOrResetWindow()
{
	// 本地没有数据
	if (File.Exist(_serializedPath))
	{
		// 反序列化窗口
	}
	else
	{
		_serializedWindow = new SerializedObject(this);
	}
}

// 编译完成（无报错），重新加载到运行时环境后调用
[UnityEditor.Callbacks.DidReloadScripts]
private static void OnScriptReload()
{
	_InitOrResetWindow();
}

private void OnEnable()
{
	// 监听资源导入事件
    AssetDatabase.importPackageCompleted += OnPackageImported;
    // 监听Editor的运行和停止事件
    EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
    // 监听脚本编译事件
    CompilationPipeline.compilationStarted += OnCompilationStarted;
	CompilationPipeline.compilationFinished += OnCompilationFinished;
}
```
# 参考
[[Unity-GPU Animation]]