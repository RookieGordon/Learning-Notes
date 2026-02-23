# GPU 动画系统设计文档

> 作者：Gordon  
> 创建日期：2025/03/26  
> 最后更新：2026/02/23

---

## 目录

1. [传统 Unity 动画系统的缺陷](#1-传统-unity-动画系统的缺陷)
2. [优化思路与 GPU 动画原理](#2-优化思路与-gpu-动画原理)
3. [当前功能的设计思路](#3-当前功能的设计思路)
4. [适用范围与优缺点](#4-适用范围与优缺点)
5. [关键技术实现细节](#5-关键技术实现细节)

---

## 1. 传统 Unity 动画系统的缺陷

Unity 内置的 `Animator` + `SkinnedMeshRenderer` 动画管线，在常规场景下表现良好，但当需要同时渲染大量动画角色时（如 RTS、大规模战斗、人群模拟等），会暴露出严重的性能瓶颈。这些瓶颈集中体现在 **CPU 端**。

### 1.1 蒙皮计算的 CPU 开销

`SkinnedMeshRenderer` 的蒙皮过程——即"将每个顶点按骨骼权重做矩阵变换"——默认在 CPU 上执行。每个蒙皮角色在每一帧都需要：

- 遍历所有顶点（通常数百至数千）。
- 查询每个顶点绑定的骨骼索引和权重（通常 4 根骨骼）。
- 逐顶点执行矩阵乘法和加权混合。

当角色数量达到上百个时，这些逐顶点运算在 CPU 端积累的耗时将成为帧率的主要瓶颈。

### 1.2 Animator 状态机的 CPU 开销

Unity 的 `Animator` 组件每帧需要进行：

- **状态机求值**：遍历条件（Transition）、检查参数，确定当前动画状态。
- **动画采样与混合**：对 AnimationClip 的曲线数据执行插值采样，当涉及 Blend Tree 或 Layer 混合时，还需要对多个 Clip 进行加权混合。
- **骨骼层级更新**：从根骨骼递归计算每根骨骼在世界空间中的变换矩阵。

每一个 `Animator` 实例都是独立求值的，无法被 GPU 批处理，导致**成百上千个活跃 Animator 会显著占用主线程或 Job 线程的 CPU 时间**。

### 1.3 无法合批渲染

`SkinnedMeshRenderer` 由于每个实例的骨骼矩阵不同，且网格顶点在 CPU 端实时变形，本质上每个角色是独立提交的 Draw Call：

- **不支持 Static Batching**（网格在变形，非静态）。
- **不支持 GPU Instancing**（传统流水线中每个实例的网格数据在 CPU 端产出，无法共享顶点缓冲区）。
- **不支持 SRP Batcher 的几何合并**。

因此，100 个蒙皮角色就意味着至少 100 个 Draw Call，这对于 GPU 而言是大量的状态切换和提交开销。

### 1.4 问题小结

| 瓶颈来源               | 具体表现                                              | 影响规模     |
| ----------------------- | ----------------------------------------------------- | ------------ |
| 蒙皮计算               | 每帧逐顶点矩阵变换，完全运行在 CPU                    | O(角色数 × 顶点数) |
| Animator 状态机         | 每个实例独立求值、采样、混合                           | O(角色数 × 动画复杂度) |
| Draw Call 无法合批      | SkinnedMeshRenderer 无法参与 Instancing / Batching     | O(角色数)    |
| 内存与骨骼层级          | 每个实例需要独立的 Transform 层级和 SkinnedMeshRenderer | O(角色数 × 骨骼数) |

**核心矛盾**：CPU 做了大量"可并行化"的重复计算工作（蒙皮、采样），而 GPU 在此期间处于空闲等待状态。

---

## 2. 优化思路与 GPU 动画原理

### 2.1 优化的方向

既然瓶颈在 CPU，优化方向很自然地分为两条路径：

```
               传统方案
        Animator → 骨骼求值 → CPU蒙皮 → Draw Call × N
                    ↓
           ┌───────┴───────┐
           ↓               ↓
     方案A: 把蒙皮      方案B: 把动画数据
     搬到GPU执行        预烘焙到纹理中
           ↓               ↓
   GPU Skinned Mesh    Animation Texture
  (保留Animator，       (彻底抛弃Animator，
   ComputeShader        在Shader的顶点阶段
   执行蒙皮)            采样纹理完成变换)
```

### 2.2 方案 A：GPU Skinned Mesh（GPU 蒙皮）

**核心思路**：保留 `Animator` 做骨骼求值（状态机 + 动画采样），但将蒙皮计算从 CPU 移到 GPU。

- **实现方式**：通过 `ComputeShader` 接收骨骼矩阵数组，在 GPU 端对所有顶点并行执行蒙皮变换。
- **效果**：消除了 1.1 节所述的"CPU 逐顶点蒙皮"开销。
- **局限**：Animator 的状态机和采样开销仍然在 CPU 上。

### 2.3 方案 B：Animation Texture（动画纹理烘焙）

**核心思路**：在编辑器中离线烘焙，将整个动画数据"拍平"写入一张 2D 纹理，运行时彻底绕过 `Animator` 和 `SkinnedMeshRenderer`，在 vertex shader 中直接采样纹理完成顶点变换。

这一方案又可按照写入纹理的数据类型细分为两种模式：

#### 2.3.1 骨骼动画模式（Bone Mode）

**写入纹理的内容**：每帧每根骨骼的 **蒙皮矩阵**（`bone.localToWorldMatrix × bindPose`）。

- 每根骨骼的 4×4 矩阵，齐次行固定为 `(0,0,0,1)`，只需存 3 行 → **每根骨骼占 3 个像素**。
- 纹理布局：X 轴 = `boneIndex × 3 + row`，Y 轴 = `frameIndex`。
- 运行时 Shader 通过 UV1（骨骼索引）和 UV2（骨骼权重）对最多 4 根骨骼进行矩阵采样、加权混合，然后变换顶点。

```
纹理 X 轴 (宽度方向)
┌─────────┬─────────┬─────────┬─────────┬─────────┬─────────┬───
│ Bone0   │ Bone0   │ Bone0   │ Bone1   │ Bone1   │ Bone1   │...
│ Row0    │ Row1    │ Row2    │ Row0    │ Row1    │ Row2    │
├─────────┼─────────┼─────────┼─────────┼─────────┼─────────┤    Y 轴
│  RGBA   │  RGBA   │  RGBA   │  RGBA   │  RGBA   │  RGBA   │  (帧方向)
│ (Half)  │ (Half)  │ (Half)  │ (Half)  │ (Half)  │ (Half)  │    ↓
└─────────┴─────────┴─────────┴─────────┴─────────┴─────────┘
```

#### 2.3.2 顶点动画模式（Vertex Mode）

**写入纹理的内容**：每帧每个顶点的 **世界空间位置** 和 **法线**。

- 每个顶点需 2 个像素：Position（RGB） + Normal（RGB）。
- 纹理布局：X 轴 = `vertexIndex × 2 [+ 1]`，Y 轴 = `frameIndex`。
- 运行时 Shader 通过 `SV_VertexID` 直接从纹理读取位置和法线——不需要任何骨骼信息。

```
纹理 X 轴 (宽度方向)
┌──────────┬──────────┬──────────┬──────────┬───
│ Vertex0  │ Vertex0  │ Vertex1  │ Vertex1  │...
│ Position │ Normal   │ Position │ Normal   │
├──────────┼──────────┼──────────┼──────────┤    Y 轴
│  RGBA    │  RGBA    │  RGBA    │  RGBA    │  (帧方向)
│ (Half)   │ (Half)   │ (Half)   │ (Half)   │    ↓
└──────────┴──────────┴──────────┴──────────┘
```

### 2.4 为什么 Animation Texture 能解决合批问题

烘焙完成后，所有使用同一模型的角色共享 **同一份 Mesh** 和 **同一份 Animation Texture**，它们之间的唯一差异是 `MaterialPropertyBlock` 中的帧索引参数（`_AnimFrameBegin`, `_AnimFrameEnd`, `_AnimFrameInterpolate`）。

这意味着：

1. **Mesh 是静态的**，可以共享 Vertex Buffer。
2. 帧索引参数通过 **GPU Instancing** 的 `UNITY_INSTANCING_BUFFER` 逐实例传入。
3. 不同实例可以被合并在同一个 Draw Call 中提交。

因此，**数百个播放不同动画帧的角色可以在一个 Draw Call 内渲染完成**，从根本上解决了合批问题。

### 2.5 帧间插值

无论是骨骼模式还是顶点模式，运行时对于**非整数帧**都采用线性插值以保证动画的平滑过渡：

$$
\text{Result} = \text{lerp}(\text{Sample}(\text{FrameBegin}),\ \text{Sample}(\text{FrameEnd}),\ \text{Interpolate})
$$

其中 `FrameBegin` 和 `FrameEnd` 是当前时间对应的前后两个整数帧，`Interpolate` 是二者之间的小数部分。这一插值完全在 Shader 中执行，零 CPU 开销。

---

## 3. 当前功能的设计思路

本系统提供了两套互补的 GPU 动画方案，覆盖不同的使用场景。

### 3.1 整体架构

```
┌──────────────────────────────────────────────────────────────┐
│                    GPU Animation System                      │
│                                                              │
│  ┌────────────────────────────┐ ┌──────────────────────────┐ │
│  │   Animation Texture 方案   │ │  GPU Skinned Mesh 方案   │ │
│  │   (完全替代 Animator)       │ │  (保留 Animator)          │ │
│  │                            │ │                          │ │
│  │  Editor 烘焙工具            │ │  GPUSkinnedMeshRenderer  │ │
│  │  ├─ BoneBaker             │ │  ├─ ComputeShader 蒙皮    │ │
│  │  └─ VertexBaker           │ │  └─ 保留完整骨骼系统      │ │
│  │                            │ │                          │ │
│  │  Runtime 组件              │ │                          │ │
│  │  ├─ GPUAnimationController│ │                          │ │
│  │  ├─ AnimationTicker       │ │                          │ │
│  │  └─ Shader (hlsl)        │ │                          │ │
│  └────────────────────────────┘ └──────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                     共享基础设施                         │  │
│  │  GPUAnimationData  ·  GPUAnimDefine  ·  GPUAnimUtility │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Animation Texture 方案

#### 3.2.1 离线烘焙流程（Editor）

烘焙工具通过 `AnimationBakerWindow` 提供 Editor GUI，用户选择 FBX 模型和 AnimationClip 后一键烘焙：

```
输入：FBX GameObject + AnimationClip[]
            │
            ▼
  ┌──────────────────────────────────────┐
  │  1. 实例化 FBX，获取 SkinnedMeshRenderer │
  │  2. 遍历每个 Clip 的每一帧：              │
  │     - SampleAnimation() 采样到指定时间  │
  │     - 根据模式提取数据：                 │
  │       · Bone模式: 计算蒙皮矩阵           │
  │       · Vertex模式: BakeMesh() 获取顶点  │
  │     - 写入 Texture2D 对应像素           │
  │  3. 处理 Mesh：                         │
  │     · Bone模式: 写入UV1/UV2(骨骼索引/权重)│
  │     · Vertex模式: 清除骨骼相关数据       │
  │  4. 计算包围盒                          │
  │  5. 打包为 GPUAnimationData 资产        │
  └──────────────────────────────────────┘
            │
            ▼
输出：GPUAnimationData (ScriptableObject)
       ├── BakeTexture  (Texture2D, RGBAHalf)
       ├── BakedMesh    (Mesh，已处理)
       ├── AnimationClips[] (动画片段元数据)
       └── ExposeTransforms[] (暴露骨骼信息)
```

**关键设计决策**：

- **纹理格式** 使用 `RGBAHalf`（16-bit 半精度浮点），在精度与显存之间取得平衡。
- **纹理尺寸** 扩展到 2 的幂次（`NextPowerOfTwo`），满足 GPU 硬件对齐要求。
- **Filter Mode** 设为 `Point`（逐像素采样），避免双线性过滤混淆相邻骨骼/顶点的数据。
- **WrapMode** X 轴 `Clamp`（超出范围无意义），Y 轴 `Repeat`（循环动画可自然重复）。

#### 3.2.2 运行时控制（Runtime）

**`GPUAnimationController`** — 挂载在 GameObject 上，代替 `Animator`：

- 持有 `GPUAnimationData` 引用和 `AnimationTicker` 实例。
- 初始化时将烘焙好的 Mesh 赋给 `MeshFilter`，将 Animation Texture 和 Shader 关键字设置到材质上。
- 每帧调用 `Tick(deltaTime)`，驱动时间轴前进。

**`AnimationTicker`** — 纯逻辑的时间轴驱动器，不依赖 MonoBehaviour：

- 维护当前播放的 `AnimIndex` 和 `TimeElapsed`。
- `Tick()` 方法根据时间推算出当前帧（`Cur`）、下一帧（`Next`）和插值因子（`Interpolate`），封装为 `AnimationTickOutput`。
- 支持循环 / 非循环动画。
- 支持通过 `AnimationTickEvent` 在特定帧触发回调事件（如脚步声、攻击判定）。

**Shader（`GPUAnimationInclude.hlsl`）** — 在顶点着色器阶段完成动画采样：

- 通过 `multi_compile_local` 关键字切换 `_ANIM_BONE` / `_ANIM_VERTEX` 模式。
- 从 `UNITY_INSTANCING_BUFFER` 读取逐实例的帧参数。
- 采样纹理 → `lerp` 插值 → 变换顶点位置和法线。
- 支持 GPU Instancing，可大规模合批渲染。

**暴露骨骼（Expose Bones）**：

- 烘焙时可通过正则表达式指定需要暴露的骨骼节点（如武器挂点 `weapon_socket`）。
- 运行时 `GPUAnimationController` 从 Animation Texture 中采样对应骨骼的矩阵数据，还原出 Transform，供挂载子物体使用。

#### 3.2.3 骨骼模式 vs 顶点模式对比

| 维度            | Bone Mode（骨骼模式）                | Vertex Mode（顶点模式）               |
| --------------- | ------------------------------------ | ------------------------------------- |
| 纹理宽度        | `boneCount × 3`                      | `vertexCount × 2`                     |
| 纹理存储效率    | 高（骨骼数通常 20-60）                | 低（顶点数通常 500-5000+）             |
| Shader 复杂度   | 较高（采样 + 矩阵混合 + 变换）        | 较低（直接读取位置/法线）              |
| Mesh 预处理     | 需写入 UV1/UV2（骨骼索引/权重）        | 清除骨骼数据即可                       |
| 暴露骨骼        | 支持                                 | 不支持（无骨骼信息）                   |
| 适用场景        | 角色（骨骼数远少于顶点数）             | 特效 / 变形动画 / 低面数模型           |

### 3.3 GPU Skinned Mesh 方案

与 Animation Texture 方案**彻底抛弃 Animator** 不同，`GPUSkinnedMeshRenderer` 采取了一种**渐进式**的优化策略：**保留 Animator 控制骨骼运动，仅将蒙皮计算搬到 GPU 执行**。

#### 3.3.1 运行原理

```
  Animator (CPU)                    ComputeShader (GPU)
  ┌────────────┐                    ┌─────────────────────────┐
  │ 状态机求值  │                    │ CSSkinning Kernel       │
  │ 动画采样    │  ── boneMatrices →│                         │
  │ 骨骼层级    │                    │ 逐顶点并行：             │
  │ 计算       │                    │ for bone in 4_weights:  │
  └────────────┘                    │   pos += M[bone]*v*w    │
                                    │   nrm += M[bone]*n*w    │
                                    └────────┬────────────────┘
                                             │
                                    输出蒙皮后 positions/normals
                                             │
                                             ▼
                                    普通 MeshRenderer 渲染
```

**数据流**：

1. **初始化**：将原始顶点 `(Position, Normal)` 和骨骼权重 `(Indices, Weights)` 上传到 `StructuredBuffer`。
2. **每帧 LateUpdate**：
   - 从 `Animator` 驱动的骨骼 `Transform[]` 读取当前帧的世界矩阵。
   - 计算蒙皮矩阵：`rootWorldToLocal × bone.localToWorldMatrix × bindPose`。
   - 上传到 `_BoneMatrixBuffer`。
   - Dispatch ComputeShader，每 64 个顶点一组并行蒙皮。
3. **回读结果**：将 GPU 计算的顶点位置和法线读回 CPU，更新 `_outputMesh`。

#### 3.3.2 与 Animation Texture 方案的关系

两种方案**互补**，而非替代：

| 需求                          | Animation Texture | GPU Skinned Mesh |
| ----------------------------- | :-: | :-: |
| 大量同模型实例（数百+）          | ✅ 最佳           | ❌ 仍受 Animator 限制 |
| 需要动画混合 / Blend Tree       | ❌ 不支持         | ✅ 完整 Animator |
| 需要 IK / 布娃娃               | ❌ 不支持         | ✅ 保留骨骼系统 |
| 需要运行时动态换装              | ⚠️ 需重新烘焙    | ✅ 直接替换 Mesh |
| Draw Call 合批                 | ✅ GPU Instancing | ❌ 每实例独立 |

---

## 4. 适用范围与优缺点

### 4.1 适用场景

#### Animation Texture 方案

- **大规模人群 / 军队渲染**：RTS 游戏中数百上千个同类型单位。
- **远景 LOD 角色**：远处角色不需要精确动画混合，用预烘焙动画即可。
- **简单循环动画的装饰物**：旗帜、风车、NPC 待机动画等。
- **移动端性能优化**：CPU 算力有限时效果尤为显著。

#### GPU Skinned Mesh 方案

- **主角 / Boss 等高品质角色**：需要动画混合、IK、布娃娃等完整动画功能。
- **数量有限但顶点多的角色**：蒙皮计算量大但无需合批。
- **渐进式优化**：在不重构动画逻辑的前提下降低蒙皮 CPU 开销。

### 4.2 优点

| 优点                     | Animation Texture | GPU Skinned Mesh |
| ------------------------ | :-: | :-: |
| 消除 CPU 蒙皮开销         | ✅ | ✅ |
| 消除 Animator CPU 开销    | ✅ | ❌ |
| 支持 GPU Instancing 合批  | ✅ | ❌ |
| 保留完整动画系统功能       | ❌ | ✅ |
| 实现复杂度低              | ✅ | ✅ |
| 跨平台兼容性好            | ✅ (纹理采样) | ⚠️ (需 ComputeShader) |

### 4.3 缺点与限制

#### Animation Texture 方案

| 缺点 | 说明 |
| ---- | ---- |
| **不支持动画混合** | 状态间无法平滑过渡 Blend Tree，只能硬切换动画片段 |
| **不支持 IK / 布娃娃** | 完全是预烘焙数据，运行时无法动态修改骨骼 |
| **显存占用** | 大量动画片段 × 高帧率 × 高顶点/骨骼数 → 纹理尺寸可能较大（尤其在 Vertex Mode 下） |
| **精度限制** | `RGBAHalf` (16-bit) 的浮点精度有限，极端情况下可能出现细微抖动 |
| **烘焙流程** | 动画修改后需要重新烘焙，增加了工作流成本 |
| **暴露骨骼有限** | 仅 Bone Mode 支持，且需要在 CPU 端采样纹理还原矩阵 |

#### GPU Skinned Mesh 方案

| 缺点 | 说明 |
| ---- | ---- |
| **GPU→CPU 回读** | 当前实现使用 `ComputeBuffer.GetData()` 同步回读，存在 GPU Stall 风险 |
| **无法合批** | 每个实例仍是独立的 MeshRenderer + 独立的 Mesh 数据 |
| **Animator 开销未消除** | 仅解决蒙皮瓶颈，状态机和采样的 CPU 开销仍然存在 |
| **平台兼容性** | 需要 ComputeShader 支持（大部分现代平台已支持，但部分低端移动 GPU 例外） |

### 4.4 性能对比概览

以 100 个同模型角色（1000 顶点、30 根骨骼）为例的定性对比：

| 指标              | 传统方案                | Animation Texture       | GPU Skinned Mesh        |
| ----------------- | ----------------------- | ----------------------- | ----------------------- |
| CPU 蒙皮耗时      | ⬛⬛⬛⬛⬛ 高          | ⬜⬜⬜⬜⬜ 无          | ⬜⬜⬜⬜⬜ 无          |
| CPU 动画采样      | ⬛⬛⬛⬛⬛ 高          | ⬛ 极低（仅帧索引计算）  | ⬛⬛⬛⬛⬛ 高          |
| Draw Call         | ⬛⬛⬛⬛⬛ 100+        | ⬛ 1~2 (Instancing)     | ⬛⬛⬛⬛⬛ 100+        |
| GPU 负载          | ⬛ 低                  | ⬛⬛ 中（纹理采样）      | ⬛⬛⬛ 中高（CS计算）   |
| 动画功能完整度     | ⬛⬛⬛⬛⬛ 完整        | ⬛ 基础                 | ⬛⬛⬛⬛⬛ 完整        |
| 显存额外占用      | ⬜ 无                  | ⬛⬛⬛ 中               | ⬛⬛ 低                |

### 4.5 选型建议

```
需要大量同模型角色？
├── 是 → 需要动画混合/IK？
│        ├── 否 → Animation Texture (Bone Mode 优先，顶点少则 Vertex Mode)
│        └── 是 → 远景用 Animation Texture LOD + 近景用完整 Animator
│
└── 否 → 角色顶点数高、蒙皮是瓶颈？
         ├── 是 → GPU Skinned Mesh
         └── 否 → 传统 Animator + SkinnedMeshRenderer 即可
```

---

## 5. 关键技术实现细节

### 5.1 烘焙关键技术点

#### 5.1.1 动画片段元数据采集

烘焙前需要先收集所有 `AnimationClip` 的元数据，计算每个片段在纹理 Y 轴上的起始帧偏移，同时采集动画事件。核心逻辑位于 `AnimationBakerWindow.GetClipParams()`：

```csharp
// AnimationBakerWindow.cs
private static int GetClipParams(AnimationClip[] clips, out AnimationTickerClip[] clipParams)
{
    int totalHeight = 0;     // 所有片段累计的总帧数，即纹理的 Y 轴高度
    clipParams = new AnimationTickerClip[clips.Length];
    for (int i = 0; i < clips.Length; i++)
    {
        var clip = clips[i];

        // 采集动画事件（详见 5.2 节）
        var instanceEvents = new AnimationTickEvent[clip.events.Length];
        for (int j = 0; j < clip.events.Length; j++)
            instanceEvents[j] = new AnimationTickEvent(clip.events[j], clip.frameRate);

        clipParams[i] = new AnimationTickerClip(
            clip.name,
            totalHeight,       // FrameBegin: 当前片段在纹理中的 Y 轴起始行
            clip.frameRate,
            clip.length,
            clip.isLooping,
            instanceEvents
        );

        var frameCount = (int)(clip.length * clip.frameRate);
        totalHeight += frameCount;  // 每个片段依次排列在 Y 轴上
    }
    return totalHeight;
}
```

**关键点**：多个 AnimationClip 在纹理中**纵向拼接**，每个 Clip 占据 `FrameBegin` 到 `FrameBegin + FrameCount` 的行范围。运行时只需传入对应的帧偏移即可定位到正确的动画片段。

#### 5.1.2 骨骼动画烘焙（Bone Mode）

骨骼模式的核心是：将每帧每根骨骼的 **蒙皮矩阵** 写入纹理。

**蒙皮矩阵的计算**（`AnimationBakerWindow_BoneBaker.cs`）：

```csharp
private static Matrix4x4 GetBoneMatrices(Matrix4x4 bindPos, Transform bone)
{
    // bone.localToWorldMatrix: 骨骼在当前帧的世界变换
    // bindPos: 绑定姿势的逆矩阵（Mesh 空间 → 骨骼空间）
    // 二者相乘 = 从原始 Mesh 空间直接变换到当前帧骨骼位置
    var localToBoneAnimated = bone.localToWorldMatrix;
    var bindPoseToBoneAnimated = localToBoneAnimated * bindPos;
    return bindPoseToBoneAnimated;
}
```

$$
M_{skin} = M_{bone\_world} \times M_{bindPose}^{-1}
$$

这个矩阵的含义：将顶点从 T-Pose（绑定姿势）下的模型空间位置，直接变换到当前动画帧的世界空间位置。

**写入纹理的过程**：

```csharp
// AnimationBakerWindow_BoneBaker.cs - WriteTransformData()
for (int j = 0; j < frameCount; j++)
{
    // 1. 采样到第 j 帧的姿态
    clip.SampleAnimation(fbxObj, length * j / frameCount);

    for (int k = 0; k < bindPoses.Length; k++)
    {
        var frame = startFrame + j;
        var bindPoseToBoneAnimated = GetBoneMatrices(bindPoses[k], bones[k]);

        // 2. 4x4 矩阵的最后一行固定为 (0,0,0,1)，只需存 3 行
        //    每行是一个 Vector4，转为 Color (RGBA) 写入一个像素
        //    像素坐标: X = boneIndex * 3 + row,  Y = frame
        var pixel = GPUAnimUtil.GetTransformPixel(k, 0, frame);
        texture.SetPixel(pixel.x, pixel.y, bindPoseToBoneAnimated.GetRow(0).ToColor());
        pixel = GPUAnimUtil.GetTransformPixel(k, 1, frame);
        texture.SetPixel(pixel.x, pixel.y, bindPoseToBoneAnimated.GetRow(1).ToColor());
        pixel = GPUAnimUtil.GetTransformPixel(k, 2, frame);
        texture.SetPixel(pixel.x, pixel.y, bindPoseToBoneAnimated.GetRow(2).ToColor());
    }
}
```

**Mesh 的 UV 编码 — 将骨骼权重写入 UV1/UV2**：

原始 `SkinnedMeshRenderer` 的 `BoneWeight` 数据存储在 Mesh 内部的特殊通道中。但 GPU Animation 方案使用普通 `MeshRenderer`，因此需要将骨骼索引和权重以 UV 通道的方式写入 Mesh：

```csharp
// AnimationBakerWindow_BoneBaker.cs - BakeBoneAnimation()
var transformWeights = instanceMesh.boneWeights;
var uv1 = new Vector4[transformWeights.Length];  // 骨骼索引
var uv2 = new Vector4[transformWeights.Length];  // 骨骼权重
for (var i = 0; i < transformWeights.Length; i++)
{
    // UV1 (TEXCOORD1): 4个骨骼索引 → 对应 Shader 中的 transformIndexes
    uv1[i] = new Vector4(
        transformWeights[i].boneIndex0, transformWeights[i].boneIndex1,
        transformWeights[i].boneIndex2, transformWeights[i].boneIndex3);
    // UV2 (TEXCOORD2): 4个骨骼权重 → 对应 Shader 中的 transformWeights
    uv2[i] = new Vector4(
        transformWeights[i].weight0, transformWeights[i].weight1,
        transformWeights[i].weight2, transformWeights[i].weight3);
}
instanceMesh.SetUVs(1, uv1);
instanceMesh.SetUVs(2, uv2);
instanceMesh.boneWeights = null;  // 清除原始骨骼权重，不再需要
instanceMesh.bindposes = null;    // 清除绑定姿势
```

#### 5.1.3 顶点动画烘焙（Vertex Mode）

顶点模式更加直接——利用 Unity 的 `SkinnedMeshRenderer.BakeMesh()` 将蒙皮后的顶点数据直接烘焙出来：

```csharp
// AnimatonBakerWindow_VertexBaker.cs - WriteVertexData()
for (int j = 0; j < frameCount; j++)
{
    // 1. 采样到目标帧的动画姿态
    clip.SampleAnimation(fbxObj, length * j / frameCount);

    // 2. BakeMesh() 在 CPU 端完成蒙皮计算，输出变形后的顶点和法线
    meshRenderer.BakeMesh(vertexBakedMesh);
    var vertices = vertexBakedMesh.vertices;
    var normals = vertexBakedMesh.normals;

    for (int k = 0; k < meshRenderer.sharedMesh.vertexCount; k++)
    {
        var frame = startFrame + j;
        // 3. 每个顶点写入 2 个像素: Position + Normal
        var pixel = GPUAnimUtil.GetVertexPositionPixel(k, frame);
        bakedTexture.SetPixel(pixel.x, pixel.y, ColorUtil.ToColor(vertices[k]));
        pixel = GPUAnimUtil.GetVertexNormalPixel(k, frame);
        bakedTexture.SetPixel(pixel.x, pixel.y, ColorUtil.ToColor(normals[k]));

        // 4. 同时累积包围盒
        BoundsIncrement.Iterate(vertices[k]);
    }
}
```

顶点模式的 Mesh 处理更简单，清除不需要的数据即可：

```csharp
// 顶点模式不需要骨骼数据，也不需要法线/切线（从纹理采样获取）
instanceMesh.normals = null;
instanceMesh.tangents = null;
instanceMesh.boneWeights = null;
instanceMesh.bindposes = null;
```

#### 5.1.4 纹理尺寸与像素坐标映射

像素坐标的计算由 `GPUAnimUtility.cs` 统一管理，保证烘焙写入和运行时采样使用一致的寻址方式：

```csharp
// GPUAnimUtility.cs

// Bone Mode: 每根骨骼占 3 列（矩阵的 3 行），帧为行
public static int2 GetTransformPixel(int transformIndex, int row, int frame)
    => new int2(transformIndex * 3 + row, frame);

// Vertex Mode: 每个顶点占 2 列（Position + Normal），帧为行
public static int2 GetVertexPositionPixel(int vertexIndex, int frame)
    => new int2(vertexIndex * 2, frame);

public static int2 GetVertexNormalPixel(int vertexIndex, int frame)
    => new int2(vertexIndex * 2 + 1, frame);
```

纹理创建时宽高取 2 的幂次对齐：

```csharp
// BoneMode:   width = NextPowerOfTwo(boneCount * 3),   height = NextPowerOfTwo(totalFrames)
// VertexMode: width = NextPowerOfTwo(vertexCount * 2),  height = NextPowerOfTwo(totalFrames)
private static Texture2D CreateTexture(int width, int height)
{
    return new Texture2D(width, height, TextureFormat.RGBAHalf, false)
    {
        filterMode = FilterMode.Point,        // 逐像素采样，防止相邻数据混合
        wrapModeU = TextureWrapMode.Clamp,    // X轴: 超出无意义
        wrapModeV = TextureWrapMode.Repeat    // Y轴: 循环动画可重复
    };
}
```

> **为什么使用 `RGBAHalf`？** 动画数据包含负值和超过 `[0,1]` 范围的浮点数（如位置坐标）。`RGBA32` 只能存储 `[0,1]` 范围的 8-bit 值，精度和范围都不够。`RGBAHalf` 提供 16-bit 半精度浮点，范围 ±65504，精度约 3 位有效数字，足以满足大多数动画场景。

---

### 5.2 动画事件采集与运行时触发

#### 5.2.1 烘焙时事件采集

Unity `AnimationClip` 中的 `AnimationEvent` 以**时间**（秒）为单位标记事件位置。烘焙时将其转换为**帧数**存储，便于运行时直接与帧计数器比较：

```csharp
// AnimationTicker.cs
public struct AnimationTickEvent
{
    public float keyFrame;      // 事件触发的关键帧（浮点帧数）
    public string identity;     // 事件标识名（原始 AnimationEvent.functionName）

    public AnimationTickEvent(AnimationEvent aniEvent, float frameRate)
    {
        keyFrame = aniEvent.time * frameRate;   // 时间(秒) × 帧率 = 帧数
        identity = aniEvent.functionName;
    }
}
```

#### 5.2.2 运行时事件触发机制

运行时 `AnimationTicker.TickEvents()` 在每次 `Tick()` 时检查是否有事件需要触发。核心逻辑是判断事件关键帧是否落在 **上一帧与当前帧之间的时间窗口** 内：

```csharp
// AnimationTicker.cs - TickEvents()
private static void TickEvents(AnimationTickerClip param, float timeElapsed, float deltaTime,
    Action<string> onEvents)
{
    if (param.Events == null || param.Events.Length <= 0)
        return;

    float lastFrame = timeElapsed * param.FrameRate;              // 上一帧的帧数位置
    float nextFrame = lastFrame + deltaTime * param.FrameRate;    // 当前帧的帧数位置

    // 关键: 对于循环动画，需要计算循环偏移量，使事件在每次循环时都能正确触发
    // 例如: 动画总长 30 帧，当前 nextFrame = 65，则 checkOffset = 30 * floor(65/30) = 60
    // 事件 keyFrame=5 → 实际检测帧 = 60 + 5 = 65，落在窗口内 → 触发
    float checkOffset = param.Loop
        ? param.FrameCount * Mathf.Floor(nextFrame / param.FrameCount)
        : 0f;

    foreach (var aniEvent in param.Events)
    {
        float frameCheck = checkOffset + aniEvent.keyFrame;
        if (lastFrame < frameCheck && frameCheck <= nextFrame) // 半开区间 (last, next]
        {
            onEvents?.Invoke(aniEvent.identity);
        }
    }
}
```

**设计要点**：
- **半开区间** `(lastFrame, currentFrame]`：保证事件恰好在触发帧时只触发一次，不会遗漏也不会重复。
- **循环偏移量 `checkOffset`**：使循环动画在每次重新进入循环时，事件能被再次检测到。
- **事件在 `Tick()` 中先于时间推进执行**：确保事件检测使用的是推进前的 `TimeElapsed`，避免跳帧遗漏。

外部通过 `GPUAnimationController.OnAnimEvent` 回调接收事件：

```csharp
// GPUAnimationController.cs
public Action<string> OnAnimEvent;  // 外部注册回调

public void Tick(float deltaTime)
{
    // onEvents 回调作为参数传入 AnimationTicker.Tick()
    if (!AnimTicker.Tick(deltaTime, out var output, OnAnimEvent))
        return;
    // ... 应用帧参数到材质
}
```

---

### 5.3 运行时动画播放

#### 5.3.1 AnimationTicker 帧计算核心

`AnimationTicker.Tick()` 是运行时的核心，负责将**连续时间**转化为**离散帧索引 + 插值因子**：

```csharp
// AnimationTicker.cs - Tick()
AnimationTickerClip param = _animations[AnimIndex];
TimeElapsed += deltaTime;

int curFrame;
int nextFrame;
float framePassed;

if (param.Loop)
{
    // 循环模式: 时间取模后映射到帧数，帧数也取模循环
    framePassed = (TimeElapsed % param.Length) * param.FrameRate;
    curFrame = Mathf.FloorToInt(framePassed) % param.FrameCount;
    nextFrame = (curFrame + 1) % param.FrameCount;   // 首尾相接
}
else
{
    // 非循环模式: 时间钳制在 [0, Length]，帧数钳制在 [0, FrameCount-1]
    framePassed = Mathf.Min(param.Length, TimeElapsed) * param.FrameRate;
    curFrame = Mathf.Min(Mathf.FloorToInt(framePassed), param.FrameCount - 1);
    nextFrame = Mathf.Min(curFrame + 1, param.FrameCount - 1);  // 最后一帧停住
}

// 加上当前动画片段在纹理中的起始帧偏移
curFrame += param.FrameBegin;
nextFrame += param.FrameBegin;

// 插值因子：当前浮点帧的小数部分
framePassed %= 1f;

output = new AnimationTickOutput
{
    Cur = curFrame,            // 传递给 Shader 的 _AnimFrameBegin
    Next = nextFrame,          // 传递给 Shader 的 _AnimFrameEnd
    Interpolate = framePassed  // 传递给 Shader 的 _AnimFrameInterpolate
};
```

**`AnimationTickOutput` 的三个值**正好对应 Shader 中的三个 Instanced Property：

| CPU 输出字段         | Shader Property          | 含义                         |
| -------------------- | ------------------------ | ---------------------------- |
| `output.Cur`         | `_AnimFrameBegin`        | 纹理 Y 坐标（当前帧行号）     |
| `output.Next`        | `_AnimFrameEnd`          | 纹理 Y 坐标（下一帧行号）     |
| `output.Interpolate` | `_AnimFrameInterpolate`  | 两帧之间的线性插值因子 [0, 1) |

#### 5.3.2 帧参数传递到 GPU

`GPUAnimationController.Tick()` 将 `AnimationTickOutput` 通过 `MaterialPropertyBlock` 传递给渲染器，不修改共享材质，因此不同实例可以独立播放不同帧：

```csharp
// GPUAnimationController.cs - Tick()
public void Tick(float deltaTime)
{
    if (!AnimTicker.Tick(deltaTime, out var output, OnAnimEvent))
        return;

    _propertyBlock ??= new MaterialPropertyBlock();
    output.ApplyPropertyBlock(_propertyBlock);  // 写入帧参数
    MeshRenderer.SetPropertyBlock(_propertyBlock);
    TickExposeBones(output);  // 更新暴露骨骼
}

// GPUAnimUtility.cs - ApplyPropertyBlock()
public static void ApplyPropertyBlock(this AnimationTickOutput output, MaterialPropertyBlock block)
{
    block.SetInt(IDFrameBegin, output.Cur);          // _AnimFrameBegin
    block.SetInt(IDFrameEnd, output.Next);            // _AnimFrameEnd
    block.SetFloat(IDFrameInterpolate, output.Interpolate);  // _AnimFrameInterpolate
}
```

> **为什么用 `MaterialPropertyBlock` 而非直接修改 Material？** `MaterialPropertyBlock` 是逐 Renderer 的轻量级参数覆盖，不会打断 GPU Instancing 合批。如果直接修改 `material` 属性，Unity 会创建 Material 实例拷贝，导致无法合批。

#### 5.3.3 暴露骨骼的运行时还原

运行时 `GPUAnimationController` 需要从 Animation Texture 中 **在 CPU 端** 采样骨骼矩阵，还原出暴露骨骼的 `Transform`，用于挂载武器等子物体：

```csharp
// GPUAnimationController.cs - TickExposeBones()
for (int i = 0; i < GPUAnimData.ExposeTransforms.Length; i++)
{
    int boneIndex = GPUAnimData.ExposeTransforms[i].Index;

    // 和 Shader 中一样：采样两个关键帧的矩阵，做线性插值
    Matrix4x4 recordMatrix = new Matrix4x4();
    recordMatrix.SetRow(0, Vector4.Lerp(
        ReadAnimationTexture(boneIndex, 0, output.Cur),
        ReadAnimationTexture(boneIndex, 0, output.Next),
        output.Interpolate));
    recordMatrix.SetRow(1, Vector4.Lerp(
        ReadAnimationTexture(boneIndex, 1, output.Cur),
        ReadAnimationTexture(boneIndex, 1, output.Next),
        output.Interpolate));
    recordMatrix.SetRow(2, Vector4.Lerp(
        ReadAnimationTexture(boneIndex, 2, output.Cur),
        ReadAnimationTexture(boneIndex, 2, output.Next),
        output.Interpolate));
    recordMatrix.SetRow(3, new Vector4(0, 0, 0, 1));

    // 使用矩阵变换烘焙时记录的骨骼局部位置和方向
    _exposeBones[i].transform.localPosition =
        recordMatrix.MultiplyPoint(GPUAnimData.ExposeTransforms[i].Position);
    _exposeBones[i].transform.localRotation =
        Quaternion.LookRotation(recordMatrix.MultiplyVector(GPUAnimData.ExposeTransforms[i].Direction));
}

// 纹理像素的读取使用和烘焙时相同的坐标映射
private Vector4 ReadAnimationTexture(int boneIndex, int row, int frame)
{
    var pixel = GPUAnimUtil.GetTransformPixel(boneIndex, row, frame);
    return GPUAnimData.BakeTexture.GetPixel(pixel.x, pixel.y);
}
```

---

### 5.4 Shader 采样技术

#### 5.4.1 Instancing 缓冲区声明

Shader 通过 `UNITY_INSTANCING_BUFFER` 声明逐实例参数，使得每个角色可以播放不同的帧，同时仍然在同一个 Draw Call 内合批渲染：

```hlsl
// GPUAnimationInclude.hlsl
UNITY_INSTANCING_BUFFER_START(PropsGPUAnim)
    UNITY_DEFINE_INSTANCED_PROP(int, _AnimFrameBegin)
    UNITY_DEFINE_INSTANCED_PROP(int, _AnimFrameEnd)
    UNITY_DEFINE_INSTANCED_PROP(float, _AnimFrameInterpolate)
UNITY_INSTANCING_BUFFER_END(PropsGPUAnim)

#define _FrameBegin     UNITY_ACCESS_INSTANCED_PROP(PropsGPUAnim, _AnimFrameBegin)
#define _FrameEnd       UNITY_ACCESS_INSTANCED_PROP(PropsGPUAnim, _AnimFrameEnd)
#define _FrameInterpolate UNITY_ACCESS_INSTANCED_PROP(PropsGPUAnim, _AnimFrameInterpolate)
```

配合顶点数据中的 `UNITY_VERTEX_INPUT_INSTANCE_ID` 和顶点着色器中的 `UNITY_SETUP_INSTANCE_ID(v)`，每个实例可以正确读取到自己的帧参数。

#### 5.4.2 骨骼模式（_ANIM_BONE）的 Shader 采样

**Step 1 — 采样单根骨骼的变换矩阵**：

```hlsl
float4x4 SampleTransformMatrix(uint sampleFrame, uint transformIndex)
{
    // 像素坐标 = (transformIndex * 3 + 0.5, sampleFrame + 0.5)
    // +0.5 是为了在 Point Filter 模式下精确命中像素中心
    float2 index = float2(.5h + transformIndex * 3, .5h + sampleFrame);

    return float4x4(
        SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex,
            index * _AnimTex_TexelSize.xy, 0),                           // Row 0
        SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex,
            (index + float2(1, 0)) * _AnimTex_TexelSize.xy, 0),          // Row 1
        SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex,
            (index + float2(2, 0)) * _AnimTex_TexelSize.xy, 0),          // Row 2
        float4(0, 0, 0, 1)                                               // Row 3 (固定)
    );
}
```

> **为什么乘以 `_AnimTex_TexelSize.xy`？** `SAMPLE_TEXTURE2D_LOD` 接受的 UV 是 `[0, 1]` 范围的归一化坐标。`_AnimTex_TexelSize.xy = (1/width, 1/height)`，将像素坐标转换为 UV。

**Step 2 — 多骨骼加权混合**：

```hlsl
// 4 个骨骼索引 + 4 个权重 → 加权矩阵和
float4x4 SampleTransformMatrix(uint sampleFrame, uint4 transformIndex, float4 transformWeights)
{
    return SampleTransformMatrix(sampleFrame, transformIndex.x) * transformWeights.x
         + SampleTransformMatrix(sampleFrame, transformIndex.y) * transformWeights.y
         + SampleTransformMatrix(sampleFrame, transformIndex.z) * transformWeights.z
         + SampleTransformMatrix(sampleFrame, transformIndex.w) * transformWeights.w;
}
```

**Step 3 — 帧间插值 + 顶点变换**：

```hlsl
void SampleTransform(uint4 transformIndexes, float4 transformWeights,
                     inout float3 positionOS, inout float3 normalOS)
{
    // 采样 FrameBegin 和 FrameEnd 的矩阵，按 Interpolate 线性插值
    float4x4 sampleMatrix = lerp(
        SampleTransformMatrix(_FrameBegin, transformIndexes, transformWeights),
        SampleTransformMatrix(_FrameEnd, transformIndexes, transformWeights),
        _FrameInterpolate
    );

    // 用插值后的矩阵变换法线和位置
    normalOS = mul((float3x3)sampleMatrix, normalOS);
    positionOS = mul(sampleMatrix, float4(positionOS, 1)).xyz;
}
```

在顶点着色器中调用（骨骼索引和权重从 UV1/UV2 读取）：

```hlsl
// GPUAnimation_Example.shader
struct Attributes
{
    float3 positionOS : POSITION;
    float3 normalOS : NORMAL;
    float4 transformIndexes : TEXCOORD1;   // 烘焙时写入的 UV1
    float4 transformWeights : TEXCOORD2;   // 烘焙时写入的 UV2
    UNITY_VERTEX_INPUT_INSTANCE_ID
};

Varyings vert(Attributes v)
{
    UNITY_SETUP_INSTANCE_ID(v);
    SampleTransform(v.transformIndexes, v.transformWeights, v.positionOS, v.normalOS);
    // positionOS / normalOS 已被就地修改为动画后的值
    o.positionCS = TransformObjectToHClip(v.positionOS);
    // ...
}
```

#### 5.4.3 顶点模式（_ANIM_VERTEX）的 Shader 采样

顶点模式更简洁——直接用 `SV_VertexID` 从纹理中读取位置和法线：

```hlsl
float3 SamplePosition(uint vertexID, uint frame)
{
    return SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex,
        float2((vertexID * 2 + .5) * _AnimTex_TexelSize.x,
               frame * _AnimTex_TexelSize.y), 0).xyz;
}

float3 SampleNormal(uint vertexID, uint frame)
{
    return SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex,
        float2((vertexID * 2 + 1 + .5) * _AnimTex_TexelSize.x,
               frame * _AnimTex_TexelSize.y), 0).xyz;
}

void SampleVertex(uint vertexID, inout float3 positionOS, inout float3 normalOS)
{
    // 两帧插值
    positionOS = lerp(
        SamplePosition(vertexID, _FrameBegin),
        SamplePosition(vertexID, _FrameEnd),
        _FrameInterpolate);
    normalOS = lerp(
        SampleNormal(vertexID, _FrameBegin),
        SampleNormal(vertexID, _FrameEnd),
        _FrameInterpolate);
}
```

> **顶点模式的像素寻址**：`vertexID * 2` 对应 Position 像素，`vertexID * 2 + 1` 对应 Normal 像素，与烘焙时 `GetVertexPositionPixel` / `GetVertexNormalPixel` 的编码完全一致。

#### 5.4.4 Shader 关键字切换

通过 `multi_compile_local` 关键字在编译时生成两套变体，运行时根据烘焙模式启用对应的关键字：

```hlsl
// Shader 声明
#pragma shader_feature_local _ANIM_BONE _ANIM_VERTEX
```

```csharp
// C# 端启用关键字（GPUAnimUtility.cs）
public static void ApplyMaterial(this GPUAnimationData data, Material sharedMaterial)
{
    sharedMaterial.SetTexture(IDAnimationTex, data.BakeTexture);
    sharedMaterial.EnableKeywords(data.BakedMode);  // 启用 _ANIM_BONE 或 _ANIM_VERTEX
}
```

`EGPUAnimationMode` 枚举的命名直接对应 Shader 关键字名称（`_ANIM_VERTEX` / `_ANIM_BONE`），通过 `EnableKeywords` 扩展方法将枚举值转为 Shader 关键字字符串。

---

### 5.5 GPU Skinned Mesh 的 ComputeShader 实现

ComputeShader 方案的技术核心是 `GPUSkinning.compute`：

```hlsl
// GPUSkinning.compute
[numthreads(64, 1, 1)]
void CSSkinning(uint3 id : SV_DispatchThreadID)
{
    uint vertexIndex = id.x;
    if (vertexIndex >= _VertexCount) return;

    VertexData vertex = _VertexBuffer[vertexIndex];
    BoneWeightData bw = _BoneWeightBuffer[vertexIndex];

    float3 skinnedPos = float3(0, 0, 0);
    float3 skinnedNormal = float3(0, 0, 0);

    // 4骨骼加权蒙皮（和传统 CPU 蒙皮算法完全一致）
    [unroll]
    for (int i = 0; i < 4; i++)
    {
        float weight = bw.Weights[i];
        if (weight <= 0.0) continue;

        uint boneIndex = (uint)bw.Indices[i];
        float4x4 boneMatrix = _BoneMatrixBuffer[boneIndex];

        skinnedPos += mul(boneMatrix, float4(vertex.Position, 1.0)).xyz * weight;
        skinnedNormal += mul((float3x3)boneMatrix, vertex.Normal) * weight;
    }

    _OutputVertexBuffer[vertexIndex] = skinnedPos;
    _OutputNormalBuffer[vertexIndex] = normalize(skinnedNormal);
}
```

C# 端每帧在 `LateUpdate` 中更新骨骼矩阵并提交 Dispatch：

```csharp
// GPUSkinnedMeshRenderer.cs
private void UpdateBoneMatrices()
{
    var rootWorldToLocal = transform.worldToLocalMatrix;
    for (int i = 0; i < _bones.Length; i++)
    {
        if (_bones[i] != null)
            // 蒙皮矩阵 = 根节点逆矩阵 × 骨骼世界矩阵 × 绑定姿势逆矩阵
            _boneMatrices[i] = rootWorldToLocal * _bones[i].localToWorldMatrix * _bindPoses[i];
    }
    _boneMatrixBuffer.SetData(_boneMatrices);
}

private void DispatchSkinning()
{
    // _threadGroupCount = ceil(vertexCount / 64)
    SkinningShader.Dispatch(_kernelIndex, _threadGroupCount, 1, 1);
}
```

> **注意**：当前实现使用 `ComputeBuffer.GetData()` 同步回读结果到 CPU，这会产生 GPU Stall。后续可优化为 `AsyncGPUReadback` 异步回读，或使用 `GraphicsBuffer` 直接将 ComputeShader 输出绑定到渲染管线，避免回读。
