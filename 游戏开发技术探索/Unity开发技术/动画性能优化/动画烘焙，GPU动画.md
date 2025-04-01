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
将动画离线烘焙到纹理贴图，有两种方法：1、直接烘焙顶点数据；2、烘焙骨骼数据；
## 烘焙顶点
 

## 烘焙骨骼
# 编辑器界面开发
Unity中，编辑器开发需要注意Unity的刷新和编译过程，会导致界面因为运行环境的改变而产生报错。因此需要对界面进行保存（序列化）操作，在运行环境产生变化后，及时还原数据，从而避免报错。
在Window中，声明`_serializedWindow`字段，然后将数据序列化的结果保存到某个地方，在Unity的运行，编译，资源导入等事件中，重新反序列化窗口即可。
```C#
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

// 脚本重载
[UnityEditor.Callbacks.DidReloadScripts]
private static void OnScriptReload()
{
	_InitOrResetWindow();
}

// 资源导入

// 运行或停止运行

```


