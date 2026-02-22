# GPU动画优化 —— 技术原理详解

## 前言

在大量角色渲染的场景中，Unity默认的动画系统（Animator + SkinnedMeshRenderer）存在严重的CPU瓶颈：

1. **Animator** 在CPU端执行状态机逻辑、动画混合、骨骼层级递归计算
2. **SkinnedMeshRenderer** 在CPU端对每个顶点执行 `Σ(BoneMatrix[i] × Vertex × Weight[i])` 蒙皮变换

当角色数量达到数百时，即使GPU仍有余力，CPU早已成为瓶颈。本文档详细解析三种将动画计算迁移至GPU的技术方案。

---

## 一、骨骼蒙皮的数学基础

### 1.1 骨骼层级与矩阵链

骨骼动画的核心是**矩阵链乘**。一个骨骼在世界空间中的变换矩阵为：

$$M_{world}^{bone} = M_{parent} \times M_{local}^{bone}$$

对于深度为 $d$ 的骨骼，需要递归计算 $d$ 次矩阵乘法。这是Animator的主要CPU开销之一。

### 1.2 绑定姿势（Bind Pose）

建模时，模型处于T-Pose（绑定姿势），此时每个骨骼在世界空间的变换矩阵为 $M_{bind}^{bone}$。

`Mesh.bindposes[i]` 存储的是绑定姿势矩阵的**逆矩阵**：

$$B_i = (M_{bind}^{bone_i})^{-1}$$

它的作用是：将顶点从模型空间变换到该骨骼的**骨骼局部空间**。

### 1.3 蒙皮变换公式

运行时，骨骼 $i$ 在当前帧的动画矩阵为 $M_{anim}^{bone_i}$（localToWorldMatrix），最终的蒙皮矩阵为：

$$S_i = M_{anim}^{bone_i} \times B_i = M_{anim}^{bone_i} \times (M_{bind}^{bone_i})^{-1}$$

这个矩阵的物理含义是：先将顶点从模型空间变换到绑定姿势时的骨骼空间（ $B_i$ ），再用当前帧的骨骼矩阵（ $M_{anim}^{bone_i}$ ）变换到世界空间。

对于受 $n$ 个骨骼影响的顶点（通常 $n=4$），最终位置为：

$$V'= \sum_{i=0}^{n-1} w_i \cdot S_i \cdot V$$

其中 $w_i$ 为骨骼权重，$\sum w_i = 1$。

### 1.4 坐标空间说明

在实际代码（`BoneBaker.WriteTransformData`）中，烘焙时计算的矩阵为：

```
bindPoseToBoneAnimated = bone.localToWorldMatrix × bindPose
```

注意这里没有乘以SkinnedMeshRenderer的 `worldToLocalMatrix`，因此烘焙出的矩阵将顶点从模型空间变换到**世界空间**。但由于烘焙时实例化对象位于原点且无旋转缩放，世界空间等价于模型空间。运行时Shader在对象空间（Object Space）中操作，随后由Unity的MVP矩阵完成模型空间→裁剪空间的变换。

---

## 二、AnimationTexture 骨骼模式 —— 纹理编码与采样

### 2.1 为什么用纹理存储动画数据？

GPU最擅长的数据访问方式是**纹理采样**：
- 纹理有专用的缓存层（Texture Cache），针对2D空间局部性优化
- `SAMPLE_TEXTURE2D_LOD` 可在顶点着色器中使用（LOD=0，不需要mip）
- 支持GPU Instancing —— 所有实例共享同一张纹理，通过不同的UV偏移读取不同帧

对比方案：用 `StructuredBuffer` 也可行，但纹理方案在移动端兼容性更好，且天然支持Instancing。

### 2.2 纹理布局设计

```
         U轴 (宽度) ──→
    ┌─────────────────────────────────────────┐
    │ Bone0   Bone0   Bone0   Bone1   Bone1  │  ← 帧0 (Idle动画)
V轴 │ Row0    Row1    Row2    Row0    Row1   │
(高  │─────────────────────────────────────────│
度)  │ Bone0   Bone0   Bone0   Bone1   Bone1  │  ← 帧1
 │  │ Row0    Row1    Row2    Row0    Row1   │
 ↓  │─────────────────────────────────────────│
    │        ...（更多帧）...                    │  
    │─────────────────────────────────────────│
    │ Bone0   ...                              │  ← 帧N (Run动画第0帧)
    │─────────────────────────────────────────│
    │        ...                               │
    └─────────────────────────────────────────┘
```

**关键设计决策：**

- **每个骨骼占3个像素**：4×4矩阵的最后一行恒为 `(0,0,0,1)`，只需存储前3行。每行4个分量恰好对应RGBA四通道。
- **纹理宽度** = `NextPowerOfTwo(boneCount × 3)`：GPU纹理宽度必须为2的幂次方（部分硬件要求）
- **纹理高度** = `NextPowerOfTwo(totalFrames)`：所有动画片段的帧堆叠排列
- **格式 `RGBAHalf`**：每通道16位半精度浮点（±65504，精度约3位小数），平衡精度与显存
- **FilterMode = Point**：逐像素精确采样，不能使用双线性插值（会导致矩阵数据混合出错）
- **WrapMode U=Clamp, V=Repeat**：U方向无多余数据，V方向允许循环动画的帧回绕

### 2.3 像素坐标计算

骨骼 $k$、矩阵第 $r$ 行、第 $f$ 帧的像素坐标：

$$\text{pixel}(k, r, f) = (k \times 3 + r, \; f)$$

对应代码：
```csharp
// GPUAnimUtil.cs
public static int2 GetTransformPixel(int transformIndex, int row, int frame)
{
    return new int2(transformIndex * 3 + row, frame);
}
```

### 2.4 Shader端采样：半像素偏移

纹理采样使用归一化UV坐标 `[0,1]`。要精确采样第 $(x, y)$ 个像素中心，需要进行**半像素偏移**：

$$u = \frac{x + 0.5}{\text{texWidth}}, \quad v = \frac{y + 0.5}{\text{texHeight}}$$

这正是代码中 `.5h` 的含义：

```hlsl
float2 index = float2(.5h + transformIndex * 3, .5h + sampleFrame);
return float4x4(
    SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex, index * _AnimTex_TexelSize.xy, 0),
    ...
);
```

其中 `_AnimTex_TexelSize.xy = (1/width, 1/height)` 是Unity自动传入的纹理尺寸倒数。

### 2.5 帧间插值

为了避免动画看起来"一帧一帧跳"，需要在相邻帧之间做**线性插值**：

$$S_{final} = \text{lerp}(S_{frame_0}, S_{frame_1}, t)$$

其中 $t \in [0, 1)$ 是当前时刻在两帧之间的归一化位置（`framePassed % 1`）。

对矩阵做线性插值在数学上不严格正确（旋转部分应该用四元数球面插值），但在帧率足够高（通常30fps）时，相邻帧的旋转差异很小，线性插值产生的误差不可感知。

### 2.6 骨骼权重的UV编码

原始Mesh的 `BoneWeight` 包含4个骨骼索引和4个权重。烘焙时将其写入UV通道：

```csharp
uv1[i] = new Vector4(boneIndex0, boneIndex1, boneIndex2, boneIndex3);  // → TEXCOORD1
uv2[i] = new Vector4(weight0, weight1, weight2, weight3);              // → TEXCOORD2
```

Shader中通过语义 `TEXCOORD1` / `TEXCOORD2` 读取：

```hlsl
float4 transformIndexes : TEXCOORD1;  // 骨骼索引（以float存储int，Shader中隐式转uint）
float4 transformWeights : TEXCOORD2;  // 骨骼权重
```

这样做的意义是：将SkinnedMeshRenderer的蒙皮信息转移为普通Mesh的UV数据，使其可以用MeshRenderer+MeshFilter渲染，完全脱离CPU蒙皮。

### 2.7 采样开销分析

单个顶点在骨骼模式下的纹理采样次数：

| 操作 | 采样次数 |
|------|----------|
| 4个骨骼 × 3行/骨骼 × 当前帧 | 12 |
| 4个骨骼 × 3行/骨骼 × 下一帧 | 12 |
| **合计** | **24** |

这在PC端完全不是问题。在移动端，纹理缓存的命中率很高（相邻顶点通常引用相同的骨骼，采样的纹理区域高度重叠），因此实际性能远优于理论最坏情况。

---

## 三、AnimationTexture 顶点模式 —— 直接位置采样

### 3.1 原理差异

顶点模式跳过了蒙皮计算，直接存储每一帧**变形后的顶点位置和法线**：

```
| Vertex0_Pos | Vertex0_Normal | Vertex1_Pos | Vertex1_Normal | ...  ← 帧0
| Vertex0_Pos | Vertex0_Normal | Vertex1_Pos | Vertex1_Normal | ...  ← 帧1
...
```

每个顶点占2个像素（位置RGB + 法线RGB），通过 `SV_VertexID`（GPU硬件自动提供的顶点序号）索引。

### 3.2 SV_VertexID 语义

这是顶点模式的核心机制。GPU在执行顶点着色器时，会自动为每个顶点分配一个递增的整数ID（从0开始，与Mesh中的顶点顺序一致）。这个ID作为"纹理U坐标的索引"：

```hlsl
float3 SamplePosition(uint vertexID, uint frame)
{
    return SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex,
        float2((vertexID * 2 + .5) * _AnimTex_TexelSize.x,    // 位置在偶数列
               (frame + .5) * _AnimTex_TexelSize.y), 0).xyz;
}
```

关键约束：**烘焙后的Mesh不能修改顶点顺序**（如合并、优化等），否则VertexID与纹理数据会错位。

### 3.3 烘焙过程：SampleAnimation + BakeMesh

```csharp
clip.SampleAnimation(fbxObj, time);         // 将骨骼摆到指定时刻的姿势
meshRenderer.BakeMesh(vertexBakedMesh);     // 执行CPU蒙皮，获取变形后的Mesh
var vertices = vertexBakedMesh.vertices;    // 读取蒙皮后的顶点位置
var normals = vertexBakedMesh.normals;      // 读取蒙皮后的法线方向
```

`SampleAnimation` 是Unity提供的API，可以在Editor中以任意时刻对动画进行采样（不需要播放模式）。`BakeMesh` 将SkinnedMeshRenderer当前姿势的蒙皮结果输出到一个普通Mesh中。

### 3.4 顶点模式 vs 骨骼模式的纹理尺寸对比

假设一个模型有 30 个骨骼、5000 个顶点、3个动画（idle/walk/run，各60帧，共180帧）：

| 模式 | 纹理宽度 | 纹理高度 | 像素总数 | 显存（RGBAHalf=8B/px） |
|------|----------|----------|----------|------------------------|
| 骨骼 | NextPow2(30×3) = 128 | NextPow2(180) = 256 | 32,768 | 256 KB |
| 顶点 | NextPow2(5000×2) = 16384 | NextPow2(180) = 256 | 4,194,304 | 32 MB |

差距巨大。**顶点模式在高面数模型上不可行**，仅适用于百级别顶点的简单模型。

---

## 四、运行时帧计算 —— AnimationTicker

### 4.1 时间→帧的映射

AnimationTicker接收 `deltaTime`，维护一个累积时间轴 `TimeElapsed`，将其转换为纹理中的帧索引：

**循环动画：**

$$\text{framePassed} = (\text{TimeElapsed} \mod \text{Length}) \times \text{FrameRate}$$

$$\text{curFrame} = \lfloor \text{framePassed} \rfloor \mod \text{FrameCount}$$

$$\text{nextFrame} = (\text{curFrame} + 1) \mod \text{FrameCount}$$

`mod FrameCount` 确保帧索引回绕到动画开头。

**非循环动画：**

$$\text{framePassed} = \min(\text{Length}, \text{TimeElapsed}) \times \text{FrameRate}$$

$$\text{curFrame} = \min(\lfloor \text{framePassed} \rfloor, \text{FrameCount} - 1)$$

$$\text{nextFrame} = \min(\text{curFrame} + 1, \text{FrameCount} - 1)$$

`min` 确保播放到最后一帧后停留不越界。

**帧间插值系数：**

$$t = \text{framePassed} \mod 1.0$$

即 `framePassed` 的小数部分，范围 $[0, 1)$。

### 4.2 动画片段帧的全局偏移

所有动画片段在纹理中依次排列，每个片段记录其在纹理中的起始帧号 `FrameBegin`：

```
Idle:  FrameBegin=0,    FrameCount=60   → 帧 0~59
Walk:  FrameBegin=60,   FrameCount=45   → 帧 60~104
Run:   FrameBegin=105,  FrameCount=30   → 帧 105~134
```

最终传给Shader的帧号 = `curFrame + FrameBegin`（全局帧号）。

### 4.3 动画事件的帧空间检测

动画事件的触发检测在**帧空间**中进行（不是时间空间），确保与帧率无关的精确触发：

```csharp
float lastFrame = timeElapsed * frameRate;            // 上一次Tick时的帧位置
float nextFrame = lastFrame + deltaTime * frameRate;  // 当前Tick的帧位置

// 循环动画：计算当前所在圈数的偏移
float checkOffset = loop ? frameCount * Floor(nextFrame / frameCount) : 0;

// 检测事件是否落在 (lastFrame, nextFrame] 窗口内
foreach (event in events)
{
    float frameCheck = checkOffset + event.keyFrame;
    if (lastFrame < frameCheck && frameCheck <= nextFrame)
        trigger(event);
}
```

`checkOffset` 的作用：假设动画有60帧，事件在第10帧。当 `nextFrame=70`（第二圈第10帧），`checkOffset = 60`，`frameCheck = 60+10 = 70`，落在窗口 `(60, 70]` 内，正确触发。

---

## 五、Shader关键字与GPU Instancing

### 5.1 shader_feature_local 变体机制

```hlsl
#pragma shader_feature_local _ANIM_BONE _ANIM_VERTEX
```

`shader_feature_local` 声明材质级别的Shader变体。Unity只会为实际使用的变体编译Shader代码，未使用的变体不占用运行时内存。`local` 前缀表示关键字作用域限于当前Shader，不影响全局关键字池。

运行时通过C#代码启用关键字：

```csharp
material.EnableKeyword("_ANIM_BONE");   // 激活骨骼模式分支
material.DisableKeyword("_ANIM_VERTEX"); // 关闭顶点模式分支
```

本项目通过枚举名称与关键字名称保持一致（`_ANIM_BONE`、`_ANIM_VERTEX`），实现自动映射。

### 5.2 GPU Instancing 数据传递

GPU Instancing允许一次DrawCall渲染多个使用相同Mesh和Material的对象，每个实例可以有不同的Per-Instance属性。

**Shader端声明：**

```hlsl
UNITY_INSTANCING_BUFFER_START(PropsGPUAnim)
    UNITY_DEFINE_INSTANCED_PROP(int, _AnimFrameBegin)
    UNITY_DEFINE_INSTANCED_PROP(int, _AnimFrameEnd)
    UNITY_DEFINE_INSTANCED_PROP(float, _AnimFrameInterpolate)
UNITY_INSTANCING_BUFFER_END(PropsGPUAnim)
```

这将这三个属性声明为**Per-Instance数据**。Unity在底层使用 `CBUFFER` 数组存储所有实例的值。

**C#端传入：**

```csharp
// 单体模式：MaterialPropertyBlock
block.SetInt("_AnimFrameBegin", output.Cur);
block.SetInt("_AnimFrameEnd", output.Next);
block.SetFloat("_AnimFrameInterpolate", output.Interpolate);
meshRenderer.SetPropertyBlock(block);

// 批量模式：FloatArray + DrawMeshInstanced
block.SetFloatArray("_AnimFrameBegin", curFrameArray);
block.SetFloatArray("_AnimFrameEnd", nextFrameArray);
block.SetFloatArray("_AnimFrameInterpolate", interpolateArray);
Graphics.DrawMeshInstanced(mesh, 0, material, matrices, count, block);
```

**关键点：** `DisableBatching = True` 标签是必需的。因为Dynamic Batching会合并Mesh，破坏Per-Instance属性的实例隔离。而GPU Instancing是在DrawCall级别的合批，不会影响属性传递。

### 5.3 UNITY_SETUP_INSTANCE_ID 的作用

```hlsl
UNITY_SETUP_INSTANCE_ID(v);
```

这行宏展开后，会从 `SV_InstanceID` 语义中获取当前实例的ID，并设置到一个内部变量中。后续所有的 `UNITY_ACCESS_INSTANCED_PROP` 都会使用这个ID作为数组索引，从 `CBUFFER` 中读取属于当前实例的属性值。

---

## 六、暴露骨骼节点（Expose Bone）

### 6.1 问题背景

脱离Animator后，场景中不再有骨骼Transform层级。但角色可能需要在手部挂载武器、在头部挂载特效等。

### 6.2 实现原理

烘焙时记录需要暴露的骨骼的**初始姿态参数**：

```csharp
struct GPUAnimationExposeBone
{
    int Index;         // 该骨骼在骨骼数组中的索引
    string Name;       // 节点名称
    Vector3 Position;  // 绑定姿势下，该节点相对于根节点的局部位置
    Vector3 Direction; // 绑定姿势下，该节点的正前方向
}
```

运行时，`GPUAnimationController.TickExposeBones` 从动画纹理中采样该骨骼的变换矩阵（与Shader采样逻辑相同，但在CPU端执行 `Texture2D.GetPixel`）：

```csharp
Matrix4x4 recordMatrix = new Matrix4x4();
recordMatrix.SetRow(0, Vector4.Lerp(
    ReadAnimationTexture(boneIndex, 0, output.Cur),   // 行0
    ReadAnimationTexture(boneIndex, 0, output.Next),
    output.Interpolate));
recordMatrix.SetRow(1, Vector4.Lerp(...));             // 行1
recordMatrix.SetRow(2, Vector4.Lerp(...));             // 行2
recordMatrix.SetRow(3, new Vector4(0, 0, 0, 1));

// 用插值后的矩阵变换初始姿态位置和方向
exposeBone.localPosition = recordMatrix.MultiplyPoint(bindPosition);
exposeBone.localRotation = Quaternion.LookRotation(recordMatrix.MultiplyVector(bindDirection));
```

这样就在不依赖骨骼层级的情况下，实时重建了挂载点的位置和朝向。

### 6.3 正则匹配

暴露骨骼通过正则表达式匹配节点名称（如 `"Weapon|Head"`），在烘焙时记录匹配到的节点信息。如果匹配到的节点本身不是骨骼（如中间节点），会沿父链向上查找最近的骨骼。

---

## 七、GPUSkinnedMesh —— ComputeShader蒙皮

### 7.1 与AnimationTexture的本质区别

| 维度 | AnimationTexture | GPUSkinnedMesh |
|------|------------------|----------------|
| 动画求解 | 离线烘焙（Editor时期） | 在线求解（Animator运行时） |
| 蒙皮执行 | GPU顶点着色器中 | GPU ComputeShader中 |
| 数据流方向 | 纹理 → VS → 像素 | CPU矩阵 → CS → Mesh → VS → 像素 |
| Animator | 完全移除 | 完全保留 |

### 7.2 ComputeShader线程模型

```hlsl
[numthreads(64, 1, 1)]
void CSSkinning(uint3 id : SV_DispatchThreadID)
```

- `numthreads(64, 1, 1)`：每个线程组包含64个线程，每个线程处理1个顶点
- Dispatch的线程组数 = `Ceil(vertexCount / 64)`
- `SV_DispatchThreadID` 是全局线程索引，等于 `groupID × groupSize + localID`

GPU会将线程组分配到SM（Streaming Multiprocessor）上执行。64是常见的最优线程组大小，既能充分利用SM的warp调度，又不会因为寄存器压力过大而降低占用率。

### 7.3 数据流详解

**初始化阶段（一次性）：**

```
CPU                              GPU
 │                                │
 │  VertexData[N]   ──SetData──→  StructuredBuffer<VertexData>     (只读，不变)
 │  BoneWeight[N]   ──SetData──→  StructuredBuffer<BoneWeightData> (只读，不变)
 │                                │
```

**每帧更新：**

```
CPU                              GPU
 │                                │
 │  ① Animator更新骨骼            │
 │  ② 计算蒙皮矩阵:              │
 │     M[i] = rootW2L             │
 │           × bone[i].L2W        │
 │           × bindPose[i]        │
 │                                │
 │  BoneMatrix[B]  ──SetData──→  StructuredBuffer<float4x4>  (每帧更新)
 │                                │
 │        ──Dispatch──→           ComputeShader (N个线程并行)
 │                                │
 │  positions[N]  ←──GetData──    RWStructuredBuffer<float3>  (蒙皮输出)
 │  normals[N]    ←──GetData──    RWStructuredBuffer<float3>  (蒙皮输出)
 │                                │
 │  ③ 写回Mesh.vertices/normals  │
 │  ④ RecalculateBounds           │
```

### 7.4 蒙皮矩阵计算公式

```csharp
boneMatrices[i] = rootWorldToLocal × bones[i].localToWorldMatrix × bindPoses[i]
```

乘以 `rootWorldToLocal` 是为了将结果保持在**对象空间**（Object Space），因为MeshRenderer的渲染管线已经包含了ObjectToWorld变换。如果不乘这个矩阵，蒙皮后的顶点会在世界空间，但MeshRenderer还会再做一次ObjectToWorld，导致位置双倍偏移。

### 7.5 性能瓶颈分析

当前实现的主要瓶颈不在ComputeShader本身（GPU端蒙皮非常快），而在**数据回读**：

```csharp
_outputVertexBuffer.GetData(positions);   // GPU → CPU 同步等待
_outputNormalBuffer.GetData(normals);     // GPU → CPU 同步等待
_outputMesh.vertices = positions;         // CPU修改Mesh
```

`GetData` 会强制GPU-CPU同步（Pipeline Stall），GPU必须完成所有待处理的命令后才能将数据传回CPU。这抵消了GPU计算带来的优势。

**优化方向：**
- 使用 `AsyncGPUReadback` 进行异步回读（延迟一帧）
- 使用 `GraphicsBuffer` + `Mesh.SetVertexBufferData` 避免CPU中转
- 终极方案：改为在顶点着色器中直接读取ComputeBuffer（需要自定义渲染管线或Shader），完全消除回读

---

## 八、纹理WrapMode的设计意图

```csharp
wrapModeU = TextureWrapMode.Clamp,
wrapModeV = TextureWrapMode.Repeat
```

- **U轴（数据序号方向）Clamp**：纹理宽度为2的幂次方，大于实际数据宽度。超出有效范围的U坐标应该钳位到边界（最后一个有效像素），而不是回绕读取无效数据。

- **V轴（帧方向）Repeat**：支持循环动画中帧号超过纹理高度时自然回绕。但实际代码中帧索引已经做了 `mod` 处理，Repeat主要是防御性设计。

**FilterMode = Point** 是强制要求。Bilinear/Trilinear插值会混合相邻像素的值，而相邻像素可能属于不同骨骼的不同矩阵行，混合后的数据毫无意义。帧间插值是在Shader中通过 `lerp` 手动完成的，而非硬件纹理过滤。

---

## 九、SRP Batcher 兼容性

Shader中声明了 `CBUFFER_START(UnityPerMaterial)`：

```hlsl
CBUFFER_START(UnityPerMaterial)
    float4 _MainTex_ST;
CBUFFER_END
```

SRP Batcher要求所有材质属性必须在 `UnityPerMaterial` CBUFFER中声明。注意 `_AnimFrameBegin` 等Per-Instance属性**不在**这个CBUFFER中（它们在Instancing Buffer中），所以不会冲突。

`DisableBatching = True` 标签禁止了传统的Dynamic Batching，但**不影响** SRP Batcher 和 GPU Instancing。SRP Batcher和GPU Instancing可以同时工作，前者减少SetPass Call，后者减少DrawCall。

---

## 十、ShadowCaster Pass 的必要性

GPU动画Shader必须包含ShadowCaster Pass，且其中**也要执行动画采样**：

```hlsl
#if defined(_ANIM_BONE)
    SampleTransform(v.transformIndexes, v.transformWeights, v.positionOS, v.normalOS);
#elif defined(_ANIM_VERTEX)
    SampleVertex(v.vertexID, v.positionOS, v.normalOS);
#endif
```

如果ShadowCaster不做动画变换，阴影会始终停留在T-Pose（绑定姿势），与角色的实际姿态不匹配。

阴影偏移使用URP标准的 `ApplyShadowBias` + 深度钳位（`UNITY_REVERSED_Z` 分支）处理 Shadow Acne 和 Peter Panning 问题。

---

## 十一、关键数学公式总结

| 公式 | 用途 | 位置 |
|------|------|------|
| $S_i = M_{anim}^{bone_i} \times B_i$ | 计算第 $i$ 个骨骼的蒙皮矩阵 | Baker / ComputeShader |
| $V' = \Sigma w_i \cdot S_i \cdot V$ | 多骨骼加权蒙皮 | Shader `SampleTransform` / CS `CSSkinning` |
| $\text{uv} = (x+0.5, y+0.5) \times \text{texelSize}$ | 像素中心归一化坐标 | Shader 纹理采样 |
| $f = (t \mod L) \times R$ | 时间→帧映射（循环） | `AnimationTicker.Tick` |
| $t = f \mod 1$ | 帧间插值系数 | `AnimationTicker.Tick` |
| $M_{skin} = W2L_{root} \times L2W_{bone} \times B$ | GPU蒙皮骨骼矩阵 | `GPUSkinnedMeshRenderer` |
