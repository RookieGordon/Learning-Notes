---
tags:
  - Unity
  - Shader-Graph
---
# Shader Graph 界面

## Shader Graph 窗口

![|510](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/CC_Shad_SG_2_2.jpg)

- Blackboard 黑板(2)：包含可供使用此着色器创建材质所使用的属性`（可以在 Unity 的 Inspector 窗口中进行值配置）`。可以在此处对图表中的属性和关键字进行定义、排序和分类。在 Blackboard 中，您还可以编辑所选 Shader Graph Asset 或 Sub Graph 的路径。
- Main Preview 主预览窗口 (4)：将为您提供着色器外观及其行为方式的实时更新。
- Master Stack 主堆栈 (6)：是定义着色器最终表面外观的着色器图的终点，一个 Shader 中有且只有一个。它列出了顶点着色器和片段（片元）着色器的主要着色器属性，并为您提供了插入必要值的末端节点。
- Internal Inspector：包含与用户当前单击的任何内容相关的信息的区域。这是一个默认情况下自动隐藏的窗口，只有在选择了用户可以编辑的内容时才会出现。使用内部检查器显示和修改属性、节点选项和图形设置。

![|520](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/SG_Inspector.png)

# Node 节点

## 节点概述

Shader Graph 中和新元素是 Node 节点，每种节点功能各不相同。
每个节点都包含多个端口 Port，每个端口都有确定的数据类型，这些 Port 端口可以用来输入（在节点左侧）、输出（在节点右侧）。

![|320](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/mult_node.png)
通过 边 Edge 可以将节点连接起来，组成完整的 Shader Graph。只有一个 Edge 可以连接到任何输入端口，但多个 Edge 可以连接到输出端口

# 主堆栈（Master Stack）

## Context 上下文

主堆栈包含两个上下文：顶点 Vetext 和片段(片元) Fragment 。这些代表着色器的两个阶段。

连接到顶点上下文中块的节点成为最终着色器顶点函数的一部分。您连接到片段上下文中的块的节点成为最终着色器的片段（或像素）函数的一部分。如果您将任何节点连接到两个上下文，它们将执行两次，一次在顶点函数中，然后再次在片段函数中。您不能剪切、复制或粘贴上下文。

![|250](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/MasterStack_Empty.png)

## Block Node 块节点

块节点是主堆栈的特定类型的节点。Block Node 表示 Shader Graph 在最终着色器输出中使用的单个表面（或顶点）描述数据。

特定于某个渲染管道的 Block Node 块节点仅可用于该管道，例如，Universal Block 节点仅适用于 Universal Render Pipeline (URP)，High Definition Block 节点仅适用于 High Definition Render Pipeline (HDRP)。

# 常用节点

## 属性节点 Property Node

属性节点，就是 Blackboard 黑板 中创建的属性值节点，使用步骤：
1. 在 Blackboard 中创建属性；  
    ![|150](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/propertyNode01.png)
2. 将属性拖拽到 Shader 里，用于输入
    ![|410](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/propertyNode03.png)
3. 在 Shader Editor 的 Graph Inspector 的 Node Settings 中，可以对属性设置进行更改  
    ![|270](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/propertyNode02.png)
4. 在 unity Inspector 中，可以随时更改属性值  
    ![|350](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/propertyNode04.png)

## Procedural节点类型

### Noise节点 

#### Gradient Noise Node 梯度噪声节点

此节点属于代码生成类节点（Procedural），其特点是，用于 Shader 的数据来自于代码（算法）生成。
![|240](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/sg_g_noise_node.png)
根据输入 UV（float2 类型值）生成梯度或 Perlin 噪声。生成噪声的比例由输入 Scale 控制，Scale 值越大，噪声斑纹越小。

梯度噪声产生的纹理具有连续性，所以经常用来模拟山脉、云朵、水等具有连续性（波状）的物质，该类噪声的典型代表是 Perlin Noise。其它梯度噪声还有 Simplex Noise 和 Wavelet Noise，它们也是由 Perlin Noise 演变而来。

下图显示了各种不同的噪声算法对应的灰度图：
![|410](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/noise3.jpg)

> 扩展阅读：[图形噪声](https://gitee.com/link?target=https%3A%2F%2Fhuailiang.github.io%2Fblog%2F2021%2Fnoise%2F)

## 算术节点 Math Node

顾名思义，是用作算术运算的节点，比如最基础的加减乘除
### Basic


![|400](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/mathnode.png)

#### 时间节点 Time Node

该节点属于 Input - Basic 分类，所以是一种基础的数据输入类节点，用来提供随时间变化的动态值，作为其他节点的输入

该节点是 Shader Graph 中，实现动态效果的不二之选。
![|140](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/sg_time_node.png)
```CSharp
float Time_Time = _Time.y; // 随时间增大的浮点值
float Time_SineTime = _SinTime.w;//正弦时间，随时间在（-1，1）之间变化
float Time_CosineTime = _CosTime.w;//余弦时间
float Time_DeltaTime = unity_DeltaTime.x;//当前帧时间，从前一帧，到后一帧所用的时间
float Time_SmoothDelta = unity_DeltaTime.z;//**平滑后的当前帧时间**
```

### Range

#### 重映射节点 Remap Node

将输入的值映射到另一个范围之中，如下图是将 -1~~1 映射到 0~~1
![|410](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/sg_remap_node.png)
左侧输入：
- In ：输入的值
- In Min Max ：输入值的范围
- Out Min Max : 输出值的范围

右侧输出：
- out ：输入值根据输入输出值范围，重新映射后，得到的值

### Round

#### Step Node

如果输入 In 的值大于或等于输入 Edge 的值，则返回 1 ，否则返回 0。
![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/sg_step_node.png)

## UV

### Tilling and Offset Node

为 UV 输入，提供平铺和偏移设置，输出新的处理过的 UV。
- 平铺 Tilling ：一个 float2 （x,y）类型的值，默认 x=1,y=1 表示保持原始大小。X=0.5，y=0.5，表示在原先一个单位区域，现在只能放下 1/4，纹理会被拉伸；x=2,y=2，表示原先一个单位空间，将放入 4 个，纹理会被缩小
- 偏移 Offset ：一个 float2 值（x,y），设置通道的偏移量，默认 x= 0,y=0。设置后，会在指定坐标轴产生偏移。

这通常用于细节贴图和随时间滚动的纹理。
![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/sg_T&O_node.png)

## Utility

### Logic

### 分支节点 Branch Node

类似于 if 判断语句，当 Predicate 为真时，输出的值是 True 输入端口的值；当 Predicate 为假时，输出值等于 False 输入端口对应的值
![](https://gitee.com/chutianshu1981/AwesomeUnityTutorial/raw/main/imgs/sg_Branch_Node.png)