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

**写入纹理的内容**：每帧每根骨骼的 **蒙皮矩阵**（`bone.localToWorldMatrix × bindPose`），经压缩后以 **四元数 + 平移** 形式存储。

- 蒙皮矩阵分解为旋转（四元数 XYZW）和平移（XYZ），每根骨骼仅需 **2 个像素**，相比原始矩阵行存储（3 像素）**宽度减少 33%**。
- 四元数统一归一化到 **正 w 半球**（`w < 0` 时取反），确保帧间 Lerp 插值的一致性。
- 纹理布局：X 轴 = `boneIndex × 2 + channel`（0=四元数, 1=平移），Y 轴 = `frameIndex`。
- 运行时 Shader 通过 `QuatTransToMatrix()` 将四元数+平移重建为 4×4 矩阵，再结合 UV1（骨骼索引）和 UV2（骨骼权重）对最多 4 根骨骼进行加权混合，变换顶点。

```
纹理 X 轴 (宽度方向)
┌───────────┬───────────┬───────────┬───────────┬───
│  Bone0    │  Bone0    │  Bone1    │  Bone1    │...
│ Quat XYZW│Trans XYZ_ │ Quat XYZW│Trans XYZ_ │
├───────────┼───────────┼───────────┼───────────┤    Y 轴
│   RGBA    │   RGBA    │   RGBA    │   RGBA    │  (帧方向)
│  (Half)   │  (Half)   │  (Half)   │  (Half)   │    ↓
└───────────┴───────────┴───────────┴───────────┘
```

#### 2.3.2 顶点动画模式（Vertex Mode）

**写入纹理的内容**：每帧每个顶点的 **世界空间位置** 和 **法线**。

- 每个顶点需 2 个像素：Position（RGB） + Normal（RGB）。
- **行折叠（Row Folding）**：每帧的线性像素序列（`vertexCount × 2`）折叠到 `foldedWidth = min(vertexCount × 2, maxAtlasSize)` 宽度，每帧占据 `rowsPerFrame = ceil(vertexCount × 2 / foldedWidth)` 行。避免纹理宽度极端（如 10000×60），改善 GPU cache 命中率。
- 运行时 Shader 通过 `SV_VertexID` 和折叠坐标公式直接从纹理读取位置和法线——不需要任何骨骼信息。

```
行折叠示例 (vertexCount=5, 每帧 10 像素, foldedWidth=4, rowsPerFrame=3)

逻辑线性序列：V0.Pos V0.Nrm V1.Pos V1.Nrm V2.Pos V2.Nrm V3.Pos V3.Nrm V4.Pos V4.Nrm
               [0]    [1]    [2]    [3]    [4]    [5]    [6]    [7]    [8]    [9]

折叠后纹理布局 (foldedWidth=4):
         col 0    col 1    col 2    col 3
       ┌────────┬────────┬────────┬────────┐
row 0  │ V0.Pos │ V0.Nrm │ V1.Pos │ V1.Nrm │  ← linearIndex 0-3
row 1  │ V2.Pos │ V2.Nrm │ V3.Pos │ V3.Nrm │  ← linearIndex 4-7
row 2  │ V4.Pos │ V4.Nrm │ (空)   │ (空)   │  ← linearIndex 8-9
       ├────────┼────────┼────────┼────────┤
row 3  │  ... Frame 1, row 0 ...           │
row 4  │  ... Frame 1, row 1 ...           │
row 5  │  ... Frame 1, row 2 ...           │
       └────────┴────────┴────────┴────────┘
```

坐标映射公式：
- `linearIndex = vertexID × 2 + channel`（0=Position, 1=Normal）
- `pixelX = linearIndex % foldedWidth`
- `pixelY = frame × rowsPerFrame + linearIndex / foldedWidth`

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
       ├── BakeTextures[]  (Texture2D[], RGBAHalf, 自动拆分多张 Atlas)
       ├── BakedMesh       (Mesh，已处理)
       ├── AnimationClips[] (动画片段元数据，含 TextureIndex)
       ├── RowsPerFrame    (顶点模式行折叠参数，骨骼模式=1)
       └── ExposeTransforms[] (暴露骨骼信息)
```

**关键设计决策**：

- **纹理格式** 使用 `RGBAHalf`（16-bit 半精度浮点），在精度与显存之间取得平衡。
- **纹理尺寸** 使用 NPOT（Non-Power-Of-Two）原始数据尺寸，避免 `NextPowerOfTwo` 导致的空间浪费（详见 5.1.5 节）。
- **Filter Mode** 设为 `Point`（逐像素采样），避免双线性过滤混淆相邻骨骼/顶点的数据。
- **WrapMode** U/V 轴统一使用 `Clamp`。循环动画的帧回绕由 CPU 端 `AnimationTicker` 处理，不依赖 GPU 的 Repeat 采样。这确保了 NPOT 纹理在旧 GPU（OpenGL ES 2.0）上的兼容性（详见 5.1.5 节）。

#### 3.2.2 运行时控制（Runtime）

**`GPUAnimationController`** — 挂载在 GameObject 上，代替 `Animator`：

- 持有单个 `GPUAnimationData` 和 `AnimationTicker` 实例。
- **多 Atlas 纹理**：`GPUAnimationData` 内部包含 `BakeTextures[]` 数组，烘焙器根据 Atlas 尺寸上限自动将动画拆分到多张纹理。每个 `AnimationTickerClip` 通过 `TextureIndex` 字段记录所属的 Atlas 下标，运行时根据当前播放的动画自动切换对应纹理。
- 初始化时将烘焙好的 Mesh 赋给 `MeshFilter`，Shader 关键字和行折叠参数（`_AnimRowsPerFrame`）设置到共享材质上。
- 每帧调用 `Tick(deltaTime)` 驱动时间轴前进，并通过 `MaterialPropertyBlock` 逐实例设置帧参数和当前活跃纹理。

**`AnimationTicker`** — 纯逻辑的时间轴驱动器，不依赖 MonoBehaviour：

- 维护当前播放的 `AnimIndex` 和 `TimeElapsed`。
- `Tick()` 方法根据时间推算出当前帧（`Cur`）、下一帧（`Next`）和插值因子（`Interpolate`），封装为 `AnimationTickOutput`。
- 支持循环 / 非循环动画。
- 支持通过 `AnimationTickEvent` 在特定帧触发回调事件（如脚步声、攻击判定）。

**Shader（`GPUAnimationInclude.hlsl`）** — 在顶点着色器阶段完成动画采样：

- 通过 `multi_compile_local` 关键字切换 `ANIM_BONE` / `ANIM_VERTEX` 模式。
- 从 `UNITY_INSTANCING_BUFFER` 读取逐实例的帧参数。
- 采样纹理 → `lerp` 插值 → 变换顶点位置和法线。
- 支持 GPU Instancing，可大规模合批渲染。

**暴露骨骼（Expose Bones）**：

- 烘焙时可通过正则表达式指定需要暴露的骨骼节点（如武器挂点 `weapon_socket`）。
- 运行时 `GPUAnimationController` 从 Animation Texture 中采样对应骨骼的矩阵数据，还原出 Transform，供挂载子物体使用。

#### 3.2.3 骨骼模式 vs 顶点模式对比

| 维度            | Bone Mode（骨骼模式）                | Vertex Mode（顶点模式）               |
| --------------- | ------------------------------------ | ------------------------------------- |
| 纹理宽度        | `boneCount × 2`（四元数+平移压缩）      | `min(vertexCount × 2, maxAtlasSize)`（行折叠） |
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

骨骼模式的核心是：将每帧每根骨骼的 **蒙皮矩阵** 分解为 **四元数（旋转）+ 平移** 写入纹理。

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

**骨骼数据压缩 — 四元数 + 平移编码**：

原始方案中每根骨骼存储矩阵的 3 行（3 像素 × 4 通道 = 12 float），但蒙皮矩阵是刚体变换（旋转 + 平移），可以分解为四元数（4 float）+ 平移（3 float），仅需 2 像素（8 通道，1 通道浪费），纹理宽度减少 **33%**。

```
原始矩阵存储 (3 像素/骨骼):
┌──────────┬──────────┬──────────┐
│ Row0 (4f)│ Row1 (4f)│ Row2 (4f)│  → 12 floats
└──────────┴──────────┴──────────┘

压缩存储 (2 像素/骨骼):
┌─────────────────┬──────────────────┐
│ Quaternion(xyzw) │ Translation(xyz_) │  → 7 floats + 1 unused
└─────────────────┴──────────────────┘
```

**写入纹理的过程**：

```csharp
// AnimationBakerWindow_BoneBaker.cs - WriteTransformData()
for (int j = 0; j < frameCount; j++)
{
    clip.SampleAnimation(fbxObj, length * j / frameCount);

    for (int k = 0; k < bindPoses.Length; k++)
    {
        var frame = startFrame + j;
        var skinMatrix = GetBoneMatrices(bindPoses[k], bones[k]);

        // 将蒙皮矩阵分解为四元数（旋转）+ 平移
        Quaternion rotation = skinMatrix.rotation;
        Vector3 translation = new Vector3(skinMatrix.m03, skinMatrix.m13, skinMatrix.m23);

        // 统一四元数到正 w 半球，确保帧间插值一致性
        // 同一骨骼相邻帧的四元数应在同一半球，避免 nlerp 走长弧
        if (rotation.w < 0)
        {
            rotation.x = -rotation.x; rotation.y = -rotation.y;
            rotation.z = -rotation.z; rotation.w = -rotation.w;
        }

        // 像素 0: 四元数 (x, y, z, w)
        var pixel = GPUAnimUtil.GetTransformPixel(k, 0, frame);
        texture.SetPixel(pixel.x, pixel.y, new Color(rotation.x, rotation.y, rotation.z, rotation.w));
        // 像素 1: 平移 (x, y, z, 0)
        pixel = GPUAnimUtil.GetTransformPixel(k, 1, frame);
        texture.SetPixel(pixel.x, pixel.y, new Color(translation.x, translation.y, translation.z, 0));
    }
}
```

> **为什么使用四元数压缩？** 骨骼动画中的蒙皮矩阵本质是刚体变换（旋转 + 平移），不包含缩放和剪切。四元数 + 平移完整表达了这一信息，且四元数的帧间插值（nlerp）比矩阵分量 lerp 更准确——后者可能引入意外的缩放/剪切伪影。

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

顶点模式更加直接——利用 Unity 的 `SkinnedMeshRenderer.BakeMesh()` 将蒙皮后的顶点数据直接烘焙出来。像素坐标采用 **行折叠** 映射，将每帧 `vertexCount×2` 像素的线性序列折叠到 `foldedWidth` 宽度：

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
    var frame = startFrame + j;
    for (int k = 0; k < meshRenderer.sharedMesh.vertexCount; k++)
    {
        // 3. 每个顶点写入 2 个像素: Position (linearIndex=k*2) + Normal (k*2+1)
        //    行折叠坐标映射：x = linearIndex % foldedWidth, y = frame * rowsPerFrame + linearIndex / foldedWidth
        var pixel = GPUAnimUtil.GetVertexPixel(k * 2, frame, foldedWidth, rowsPerFrame);
        texture.SetPixel(pixel.x, pixel.y, ColorUtil.ToColor(vertices[k]));
        pixel = GPUAnimUtil.GetVertexPixel(k * 2 + 1, frame, foldedWidth, rowsPerFrame);
        texture.SetPixel(pixel.x, pixel.y, ColorUtil.ToColor(normals[k]));

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

// Bone Mode: 每根骨骼占 2 列（四元数 + 平移），帧为行
public static int2 GetTransformPixel(int transformIndex, int row, int frame)
    => new int2(transformIndex * 2 + row, frame);

// Vertex Mode: 行折叠像素坐标映射
// linearIndex = vertexIndex * 2 + channel (0=Position, 1=Normal)
// x = linearIndex % foldedWidth
// y = frame * rowsPerFrame + linearIndex / foldedWidth
public static int2 GetVertexPixel(int linearIndex, int frame, int foldedWidth, int rowsPerFrame)
    => new int2(linearIndex % foldedWidth, frame * rowsPerFrame + linearIndex / foldedWidth);
```

纹理创建时直接使用原始数据尺寸（NPOT），不做 2 的幂次对齐：

```csharp
// BoneMode:   width = boneCount * 2,                         height = totalFrames
// VertexMode: width = min(vertexCount * 2, maxAtlasSize),    height = totalLogicalFrames * rowsPerFrame
private static Texture2D CreateTexture(int width, int height)
{
    return new Texture2D(width, height, TextureFormat.RGBAHalf, false)
    {
        filterMode = FilterMode.Point,        // 逐像素采样，防止相邻数据混合
        wrapModeU = TextureWrapMode.Clamp,    // X轴: 超出无意义
        wrapModeV = TextureWrapMode.Clamp     // Y轴: 帧回绕由 CPU 端 AnimationTicker 处理，兼容旧 GPU NPOT 限制
    };
}
```

> **为什么使用 NPOT 而非 POT？** `NextPowerOfTwo` 会导致纹理尺寸在边界处发生成倍膨胀（如 2049→4096），严重时可超出 GPU 最大纹理尺寸限制。NPOT 在现代 GPU 上无性能影响，但需保证 WrapMode 为 Clamp 以兼容旧设备。详见 [5.1.5 NPOT 纹理与 Clamp WrapMode](#515-npot-纹理与-clamp-wrapmode)。

> **为什么使用 `RGBAHalf`？** 动画数据包含负值和超过 `[0,1]` 范围的浮点数（如位置坐标）。`RGBA32` 只能存储 `[0,1]` 范围的 8-bit 值，精度和范围都不够。`RGBAHalf` 提供 16-bit 半精度浮点，范围 ±65504，精度约 3 位有效数字，足以满足大多数动画场景。

#### 5.1.5 NPOT 纹理与 Clamp WrapMode

这是一个影响跨平台兼容性的关键技术决策。

##### 问题背景：POT 对齐的空间浪费

早期实现中，纹理尺寸使用 `Mathf.NextPowerOfTwo()` 对齐到 2 的幂次。由于 `NextPowerOfTwo` 的跳跃特性，当原始数据恰好超过幂次边界时，纹理尺寸会发生**成倍膨胀**：

| 原始数据尺寸 | POT 对齐后 | 膨胀率 |
|-------------|-----------|--------|
| 130 × 500 | 256 × 512 | 2.6× |
| 2049 × 900 | 4096 × 1024 | 2.3× |
| 4097 × 3000 | 8192 × 4096 | 2.7× |

对于动画片段多、骨骼/顶点数多的资源，POT 膨胀后的纹理可能**超出 GPU 最大纹理尺寸限制**（移动端通常为 4096 或 8192），导致 `new Texture2D()` 直接抛出异常。

##### 解决方案：NPOT + Clamp

移除 `NextPowerOfTwo`，纹理尺寸直接使用原始数据量：

- **Bone Mode**: `width = boneCount × 3`, `height = totalFrames`
- **Vertex Mode**: `width = vertexCount × 2`, `height = totalFrames`

这要求解决 NPOT 在旧设备上的兼容性问题。

##### 旧 GPU 的 NPOT 限制

OpenGL ES 2.0 及更早的 GPU 对 NPOT 纹理有 **"limited NPOT"** 约束：

| 功能 | POT 纹理 | NPOT 纹理（ES 2.0） |
|------|---------|---------------------|
| WrapMode: Clamp | ✅ 支持 | ✅ 支持 |
| WrapMode: Repeat | ✅ 支持 | ❌ **未定义行为** |
| Mipmap 生成 | ✅ 支持 | ❌ 纹理不完整 |
| 双线性过滤 | ✅ 支持 | ⚠ 部分受限 |

**NPOT + Repeat** 在旧 GPU 上的典型异常表现：
- 纹理变为全黑（GPU 将其视为 incomplete texture）
- 采样结果为随机噪点或读到错误行的数据
- 极端情况下回退到软件路径导致严重掉帧

##### 为什么 Clamp 可以替代 Repeat

关键洞察：**V 轴的 Repeat 模式从未被真正使用过**。

循环动画的帧回绕由 CPU 端 `AnimationTicker` 完成——它在计算帧索引时已对 `FrameCount` 取模：

```csharp
// AnimationTicker.cs - 循环模式
framePassed = (TimeElapsed % param.Length) * param.FrameRate;
curFrame = Mathf.FloorToInt(framePassed) % param.FrameCount;   // CPU 端取模
nextFrame = (curFrame + 1) % param.FrameCount;                 // 首尾相接
curFrame += param.FrameBegin;   // 加上纹理中的起始帧偏移
nextFrame += param.FrameBegin;
```

传入 Shader 的 `_AnimFrameBegin` / `_AnimFrameEnd` 始终在 `[0, totalFrames)` 范围内。Shader 中的 UV 计算：

```hlsl
float2 uv = float2((index + .5) * _AnimTex_TexelSize.x,
                    (frame + .5) * _AnimTex_TexelSize.y);
```

其中 `frame` ∈ [0, totalFrames)，`_AnimTex_TexelSize.y = 1/textureHeight`。因此 `uv.y` ∈ [0.5/H, (H-0.5)/H)，永远不会超出 `[0, 1)` 区间——GPU 的 Repeat 模式从未被触发。

将 `wrapModeV` 改为 `Clamp` 后，行为完全等价，同时满足了旧 GPU 的 NPOT 兼容要求。

##### 方案总结

```
传统 POT 方案:    NextPowerOfTwo(width) × NextPowerOfTwo(height) + wrapV=Repeat
  → 空间浪费大，可能超限，但兼容所有 GPU

NPOT + Clamp 方案: width × height + wrapV=Clamp
  → 零空间浪费，不超限，兼容所有 GPU（包括 ES 2.0）
  → 前提: 帧回绕由 CPU 端处理（本系统已满足）
```

---

#### 5.1.6 顶点模式行折叠（Row Folding）

##### 问题背景：极端纹理横纵比

顶点模式下，每帧需要 `vertexCount × 2` 个像素（Position + Normal）。如果直接将所有像素排在一行，纹理宽度可能达到数千甚至上万像素（例如 5000 顶点 → 宽度 10000），而高度仅为帧数（如 60），导致：

- **GPU 纹理尺寸限制**：移动端 GPU 通常限制单维最大 4096 或 8192 像素，宽度直接超限。
- **Cache 不友好**：极宽的纹理行会跨越多个 cache line，空间局部性差。
- **横纵比极端**：10000×60 的纹理在调试时难以预览和分析。

##### 解决方案：行折叠

将每帧的线性像素序列 **折叠成多行**，使纹理宽度不超过 `maxAtlasSize`：

```
foldedWidth   = min(vertexCount × 2, maxAtlasSize)
rowsPerFrame  = ceil(vertexCount × 2 / foldedWidth)
```

坐标映射公式：

$$
\text{linearIndex} = \text{vertexID} \times 2 + \text{channel} \quad (0=\text{Position},\ 1=\text{Normal})
$$

$$
\text{pixelX} = \text{linearIndex} \bmod \text{foldedWidth}
$$

$$
\text{pixelY} = \text{frame} \times \text{rowsPerFrame} + \lfloor \text{linearIndex} / \text{foldedWidth} \rfloor
$$

##### 退化兼容

当 `vertexCount × 2 ≤ maxAtlasSize` 时，`foldedWidth = vertexCount × 2`，`rowsPerFrame = 1`，公式完全退化为传统单行布局——无额外开销。骨骼模式始终 `rowsPerFrame = 1`。

##### 运行时参数传递

`RowsPerFrame` 烘焙时计算并存入 `GPUAnimationData`，运行时通过 `Material.SetInt("_AnimRowsPerFrame", rowsPerFrame)` 设置到共享材质（非 `MaterialPropertyBlock`），因为同一角色的所有实例共享相同的折叠参数。Shader 中通过 `int _AnimRowsPerFrame` 全局 uniform 读取。

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

运行时 `GPUAnimationController` 需要从 Animation Texture 中 **在 CPU 端** 采样骨骼数据，还原出暴露骨骼的 `Transform`，用于挂载武器等子物体。

骨骼数据使用 **四元数 + 平移** 的压缩格式，CPU 端采用 `Quaternion.Lerp`（归一化线性插值）+ `Vector3.Lerp` 进行帧间插值，比矩阵分量 lerp 更准确——不会引入缩放/剪切伪影：

```csharp
// GPUAnimationController.cs - TickExposeBones()
for (int i = 0; i < _exposeTransformInfo.Length; i++)
{
    int boneIndex = _exposeTransformInfo[i].Index;

    // 采样当前帧与下一帧的四元数
    Vector4 qCurPx  = ReadAnimationTexture(boneIndex, 0, output.Cur);
    Vector4 qNextPx = ReadAnimationTexture(boneIndex, 0, output.Next);
    var qCur  = new Quaternion(qCurPx.x, qCurPx.y, qCurPx.z, qCurPx.w);
    var qNext = new Quaternion(qNextPx.x, qNextPx.y, qNextPx.z, qNextPx.w);
    Quaternion q = Quaternion.Lerp(qCur, qNext, output.Interpolate);

    // 采样当前帧与下一帧的平移
    Vector4 tCurPx  = ReadAnimationTexture(boneIndex, 1, output.Cur);
    Vector4 tNextPx = ReadAnimationTexture(boneIndex, 1, output.Next);
    Vector3 t = Vector3.Lerp(
        new Vector3(tCurPx.x, tCurPx.y, tCurPx.z),
        new Vector3(tNextPx.x, tNextPx.y, tNextPx.z),
        output.Interpolate);

    // 从四元数 + 平移重建变换矩阵
    Matrix4x4 recordMatrix = Matrix4x4.TRS(t, q, Vector3.one);

    _exposeBones[i].transform.localPosition =
        recordMatrix.MultiplyPoint(_exposeTransformInfo[i].Position);
    _exposeBones[i].transform.localRotation =
        Quaternion.LookRotation(recordMatrix.MultiplyVector(_exposeTransformInfo[i].Direction));
}

// 从当前播放动画所在的 Atlas 纹理中读取像素
private Vector4 ReadAnimationTexture(int boneIndex, int row, int frame)
{
    var pixel = GPUAnimUtil.GetTransformPixel(boneIndex, row, frame);
    return GetActiveTexture().GetPixel(pixel.x, pixel.y);
}
```

> **多 Atlas 支持**：暴露骨骼的定义（名称、骨骼索引、局部偏移）在 `InitExposeBones` 时从 `GPUAnimData.ExposeTransforms` 获取；运行时 `ReadAnimationTexture` 通过 `GetActiveTexture()` 从当前动画所在的 Atlas 纹理采样，当切换到不同 Atlas 中的动画时自动随之切换。

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

**Step 0 — 四元数 + 平移 → 4×4 矩阵重建**：

烘焙阶段将蒙皮矩阵压缩为 *四元数 XYZW + 平移 XYZ*（2 像素/骨骼），Shader 中通过 `QuatTransToMatrix` 重建完整 4×4 矩阵：

```hlsl
float4x4 QuatTransToMatrix(float4 q, float3 t)
{
    float x2 = q.x * 2, y2 = q.y * 2, z2 = q.z * 2;
    float xx = q.x * x2, xy = q.x * y2, xz = q.x * z2;
    float yy = q.y * y2, yz = q.y * z2, zz = q.z * z2;
    float wx = q.w * x2, wy = q.w * y2, wz = q.w * z2;

    return float4x4(
        1 - yy - zz,  xy - wz,      xz + wy,      t.x,
        xy + wz,      1 - xx - zz,  yz - wx,       t.y,
        xz - wy,      yz + wx,      1 - xx - yy,   t.z,
        0,            0,            0,              1
    );
}
```

**Step 1 — 采样单根骨骼的变换矩阵**：

```hlsl
float4x4 SampleTransformMatrix(uint sampleFrame, uint transformIndex)
{
    // +0.5: 像素中心偏移，避免 Point Filter 在边界采样错误
    // 每根骨骼占 2 列像素: 像素0=四元数, 像素1=平移
    float2 index = float2(transformIndex * 2 + .5h, sampleFrame + .5h);
    // 像素 0: 四元数 (x, y, z, w)
    float4 q = SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex,
        index * _AnimTex_TexelSize.xy, 0);
    // 像素 1: 平移 (x, y, z, _)
    float3 t = SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex,
        (index + float2(1, 0)) * _AnimTex_TexelSize.xy, 0).xyz;
    return QuatTransToMatrix(q, t);
}
```

> **为什么乘以 `_AnimTex_TexelSize.xy`？** `SAMPLE_TEXTURE2D_LOD` 接受的 UV 是 `[0, 1]` 范围的归一化坐标。`_AnimTex_TexelSize.xy = (1/width, 1/height)`，将像素坐标转换为 UV。
>
> **为什么采用四元数压缩？** 相比直接存储矩阵 3 行（3 像素/骨骼），四元数+平移仅需 2 像素/骨骼，宽度减少 33%。烘焙时将四元数统一到正 w 半球，帧间插值使用 `normalize(lerp(q0, q1, t))`（nlerp），比矩阵分量 lerp 更不容易产生缩放/剪切伪影。

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

顶点模式使用 **行折叠坐标** 从纹理中读取位置和法线。每帧的线性像素序列折叠成多行后，Shader 中通过 `_AnimRowsPerFrame`（由 CPU 端设置到共享 Material）和纹理宽度 `_AnimTex_TexelSize.z` 计算折叠后的 UV 坐标：

```hlsl
// 全局 uniform（通过 Material 设置，所有实例共享）
int _AnimRowsPerFrame;  // = ceil(vertexCount * 2 / texWidth)，骨骼模式为 1

float3 SamplePosition(uint vertexID, uint frame)
{
    uint texWidth = (uint)_AnimTex_TexelSize.z;
    uint linearIdx = vertexID * 2;
    float2 uv = float2(
        (linearIdx % texWidth + .5) * _AnimTex_TexelSize.x,
        (frame * _AnimRowsPerFrame + linearIdx / texWidth + .5) * _AnimTex_TexelSize.y);
    return SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex, uv, 0).xyz;
}

float3 SampleNormal(uint vertexID, uint frame)
{
    uint texWidth = (uint)_AnimTex_TexelSize.z;
    uint linearIdx = vertexID * 2 + 1;
    float2 uv = float2(
        (linearIdx % texWidth + .5) * _AnimTex_TexelSize.x,
        (frame * _AnimRowsPerFrame + linearIdx / texWidth + .5) * _AnimTex_TexelSize.y);
    return SAMPLE_TEXTURE2D_LOD(_AnimTex, sampler_AnimTex, uv, 0).xyz;
}

void SampleVertex(uint vertexID, inout float3 positionOS, inout float3 normalOS)
{
    positionOS = lerp(SamplePosition(vertexID, _FrameBegin),
                      SamplePosition(vertexID, _FrameEnd),
                      _FrameInterpolate);
    normalOS = normalize(lerp(SampleNormal(vertexID, _FrameBegin),
                              SampleNormal(vertexID, _FrameEnd),
                              _FrameInterpolate));
}
```

> **行折叠坐标映射**：`linearIdx = vertexID * 2 [+ 1]` 得到线性索引后，`% texWidth` 得到列号，`/ texWidth` 得到行偏移，加上 `frame * _AnimRowsPerFrame` 得到纹理 Y 坐标。与烘焙时 `GetVertexPixel(linearIndex, frame, foldedWidth, rowsPerFrame)` 的编码完全一致。骨骼模式下 `_AnimRowsPerFrame = 1`，退化为传统单行布局，无额外开销。

#### 5.4.4 Shader 关键字切换

通过 `multi_compile_local` 关键字在编译时生成两套变体，运行时根据烘焙模式启用对应的关键字：

```hlsl
// Shader 声明
#pragma shader_feature_local ANIM_BONE ANIM_VERTEX
```

```csharp
// C# 端启用关键字（GPUAnimUtility.cs）
public static void ApplyMaterial(this GPUAnimationData data, Material sharedMaterial)
{
    if (data.BakeTextures != null && data.BakeTextures.Length > 0)
        sharedMaterial.SetTexture(IDAnimationTex, data.BakeTextures[0]);
    sharedMaterial.EnableKeywords(data.BakedMode);  // 启用 ANIM_BONE 或 ANIM_VERTEX
}
```

`EGPUAnimationMode` 枚举的命名直接对应 Shader 关键字名称（`ANIM_VERTEX` / `ANIM_BONE`），通过 `EnableKeywords` 扩展方法将枚举值转为 Shader 关键字字符串。

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

---

### 5.6 多 Atlas 纹理架构（Multi-Atlas）

当角色动画数量较多（例如 RPG 角色拥有 50+ 动画片段）时，所有动画烘焙到单张纹理可能超出移动端 GPU 纹理尺寸上限（通常 4096×4096）。
**多 Atlas** 架构将同一角色的动画自动拆分到多张纹理中，打包在单个 `GPUAnimationData` 资产内，运行时根据当前播放的动画片段自动切换对应的纹理。

#### 5.6.1 数据结构

```
┌─── GPUAnimationData (ScriptableObject) ─────────────────────────────┐
│                                                                       │
│  BakeTextures[0]: Atlas_0        BakeTextures[1]: Atlas_1            │
│  ┌────────────────────────┐      ┌────────────────────────┐         │
│  │ Idle     (FrameBegin=0)│      │ Attack_01 (FrameBegin=0)│        │
│  │ Walk     (FrameBegin=30)│     │ Attack_02 (FrameBegin=25)│       │
│  │ Run      (FrameBegin=60)│     │ Skill_01  (FrameBegin=50)│       │
│  └────────────────────────┘      └────────────────────────┘         │
│                                                                       │
│  AnimationClips[] (统一索引):                                         │
│  ┌─────┬─────────────┬────────────┬──────────────┐                   │
│  │ Idx │ Name        │ FrameBegin │ TextureIndex │                   │
│  ├─────┼─────────────┼────────────┼──────────────┤                   │
│  │  0  │ Idle        │     0      │      0       │                   │
│  │  1  │ Walk        │    30      │      0       │                   │
│  │  2  │ Run         │    60      │      0       │                   │
│  │  3  │ Attack_01   │     0      │      1       │                   │
│  │  4  │ Attack_02   │    25      │      1       │                   │
│  │  5  │ Skill_01    │    50      │      1       │                   │
│  └─────┴─────────────┴────────────┴──────────────┘                   │
│                                                                       │
│  BakedMesh, RowsPerFrame, ExposeTransforms                           │
└───────────────────────────────────────────────────────────────────────┘
```

#### 5.6.2 核心机制

**自动拆分**：烘焙器根据用户设定的 `_maxAtlasSize`（1024/2048/4096/8192），采用贪心策略将动画片段按序填入 Atlas，当累计帧数超出高度上限时自动开始新的 Atlas。每个 `AnimationTickerClip` 的 `FrameBegin` 是相对于其所在 Atlas 的局部帧偏移（非全局偏移），`TextureIndex` 记录所属 Atlas 下标。

**运行时纹理切换**：`GPUAnimationController.Tick()` 通过 `AnimTicker.Anim.TextureIndex` 获取当前动画所在的 Atlas 索引，从 `GPUAnimData.BakeTextures[TextureIndex]` 取得纹理，通过 `MaterialPropertyBlock.SetTexture()` 逐实例设置，不修改共享材质：

```csharp
// GPUAnimationController.cs
private Texture2D GetActiveTexture()
{
    int texIdx = AnimTicker.Anim.TextureIndex;
    return GPUAnimData.BakeTextures[texIdx];
}

public void Tick(float deltaTime)
{
    // ...
    var texture = GetActiveTexture();
    if (texture != null)
        GPUAnimUtil.SetAnimTexture(_propertyBlock, texture);
    MeshRenderer.SetPropertyBlock(_propertyBlock);
}
```

**直接索引**：外部通过 `SetAnimation(int index)` 或 `SetAnimation(string name)` 切换动画，直接操作 `AnimationClips[]` 数组下标，无需额外的间接索引表，因为所有片段已扁平化存储在单个数据集中。

#### 5.6.3 设计约束

| 约束 | 说明 |
|------|------|
| **单一数据集** | 一个 Controller 持有一个 `GPUAnimationData`，所有动画在烘焙时统一拆分，不支持运行时拼接多个独立数据集 |
| **单片段不跨纹理** | 一个动画片段的所有帧必须在同一张 Atlas 中，不支持跨纹理拼接 |
| **纹理不合批** | 播放不同 Atlas 纹理的实例无法在同一 Draw Call 中合批；仅当多个实例播放同一 Atlas 内的动画时才可 GPU Instancing 合批 |
| **暴露骨骼** | 暴露骨骼定义存储在 `GPUAnimData.ExposeTransforms` 中，运行时从当前活跃 Atlas 纹理采样 |

#### 5.6.4 行折叠与多 Atlas 的协同

顶点模式下，行折叠和多 Atlas 拆分协同工作：

1. **foldedWidth** = `min(vertexCount × 2, maxAtlasSize)` — 决定纹理宽度
2. **rowsPerFrame** = `ceil(vertexCount × 2 / foldedWidth)` — 每个逻辑帧占据的物理行数
3. **maxLogicalFrames** = `maxAtlasSize / rowsPerFrame` — 单张 Atlas 可容纳的逻辑帧数上限
4. 烘焙器据此将动画片段贪心分配到多张 Atlas，每张 Atlas 的物理高度 = `logicalFrames × rowsPerFrame`
5. `RowsPerFrame` 存入 `GPUAnimationData`，初始化时通过 `Material.SetInt("_AnimRowsPerFrame", ...)` 设置到共享材质
