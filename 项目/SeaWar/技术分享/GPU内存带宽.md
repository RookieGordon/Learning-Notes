![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=ODUyODExZTdkN2M1MTI0OTZhMGQ3MzEyMDkwYjhmNDlfOFVmMXZQRG9BNTNQTjI2b2prRUdoQWNLeHNCbmtBVUNfVG9rZW46R2ttc2IwQXRVb3I4ck54ZUVzN2M0TnZWbkplXzE3NzAxODkwNjM6MTc3MDE5MjY2M19WNA)

# 一. GPU内存层级存储详解

1. ## **主****内存** **(****DRAM** **- Dynamic Random-Access Memory)**
    

- 是什么：就是我们常说的“内存”或“显存”。在移动端，通常是一块与SoC（系统级芯片）封装在同一块板子上的独立芯片，通过物理导线与SoC连接。
    
- 物理特性：
    
    - 位置：片外（Off-Chip）。这意味着数据需要穿过芯片封装引脚，在PCB板上传输，物理距离远。
        
    - 类型：动态内存。利用电容存储电荷来代表0和1，需要定时刷新（Refresh） 来维持数据，否则电荷会泄漏。这是“D”（Dynamic）的由来，也是其速度慢的主要原因之一。
        
- 性能特点：
    
    - 速度慢：访问延迟极高（通常是几百个时钟周期）。
        
    - 带宽相对较低：尽管有宽总线和高速技术（如LPDDR5），但其带宽与GPU内部带宽相比，仍然是最狭窄的通道。
        
    - 容量大：通常为4GB、6GB、8GB甚至更大，可以存储整个游戏的所有资源。
        
- 角色：大型远程仓库。所有纹理、模型、帧缓冲区等数据的最终存放地。
    

2. ## **SRAM** **-** **Static Random-Access Memory**
    

- 是什么：GPU芯片内部集成的存储单元。
    
- 物理特性：
    
    - 位置：片内（On-Chip）。与GPU核心在同一块硅晶片上，物理距离极近。
        
    - 类型：静态内存。使用晶体管交叉耦合的结构（ flip-flop）来存储数据，不需要刷新。只要通电，数据就一直保持。这是“S”（Static）的由来，也是其速度快的根本原因。
        
- 性能特点：
    
    - 速度极快：访问延迟极低（几个时钟周期）。
        
    - 带宽极高：拥有通往GPU核心的极宽数据通路。
        
    - 容量小：因为一个SRAM单元需要6个晶体管，而DRAM只需1个晶体管加1个电容，所以SRAM非常“贵”，占用大量芯片面积，无法做大。
        
    - 功耗高：始终通电，静态功耗比DRAM高。
        

DRAM vs SRAM 核心区别总结：

|   |   |   |
|---|---|---|
|特性|SRAM (On-Chip Cache)|DRAM (主内存)|
|位置|芯片内部|芯片外部|
|速度|极快|慢|
|容量|小 (KB~MB级)|大 (GB级)|
|成本|高 (面积大)|低|
|原理|静态 (Flip-Flop)，无需刷新|动态 (电容)，需刷新|
|功耗|较高|较低|
|角色|高速缓存|主存储器|

1. ### **L1 / L2 缓存 (CPU &** **GPU****)**
    

SRAM在GPU内部被组织成多级缓存结构，其中最主要的是L1和L2。

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YmY0NzU3NTFlYmVjMzU5MDU3YTI4ZjdiMDE2Y2YzYjZfRUYzSnJZQTVUazdBV2h2SXNzZmtqZUduMGZQY3RPeWNfVG9rZW46V2ZGMWJvdXRzb2tidjN4c1ZRS2NNcWhjbmRkXzE3NzAxODkwNjM6MTc3MDE5MjY2M19WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MzE1MjYzN2M5MDY2ZjliNjljNWJlNmRhYjkwNDM4NjFfVllvVTBTSU1VeW5KZDdGbnJBcHI5cHZUcVB0M09WQnZfVG9rZW46Q2ZWU2JocG9Yb2swWUl4VGltaWNMOW9FbmJnXzE3NzAxODkwNjM6MTc3MDE5MjY2M19WNA)

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=NTkyMWY1ZDViZjhlZTBiYzNjODcyMDQ5MGU5Nzg2ZTZfbHllUkg2UGdId055T0NINUtrZFJmNFlKbEFIdE5FQXdfVG9rZW46TWtXemIyNXU2b0VZenR4aXlKc2NkQm91bmtiXzE3NzAxODkwNjM6MTc3MDE5MjY2M19WNA)

####   2.1.1 L2缓存

- 位置：On-Chip。
    
- 特性：所有GPU核心共享。容量较大（通常为256KB ~ 1MB+），是屏蔽DRAM访问的最重要屏障。所有访问请求未命中L1后，都会来到这里。它的命中率直接决定了访问DRAM的频率。
    
- 关键指标：`L2 Texture Miss%` 衡量的是纹理请求无法在L2缓存中找到的比例，这部分请求必须去访问缓慢的DRAM。您的优化目标是将它降到10%以下。
    

####   2.1.2 L1缓存

- 位置：On-Chip，非常接近每个特定的处理单元。
    
- 特性：
    
    - 专用性：通常有指令L1、数据L1、纹理L1、常量L1等，为不同用途做了高度优化。
        
    - 速度最快：比L2更快。
        
    - 容量最小：通常为16KB ~ 64KB。
        
- 关键指标：`% L1 Hit` 和 `L1 Texture Miss%` 衡量的是L1缓存的效率。因为它太小，所以极度依赖数据的局部性（Locality）。随机、散落的访问模式会迅速污染L1缓存，导致命中率低下。
    

  

2. ### **Tile Memory / On-Chip Memory (TBR架构的核心)**
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=MjFjZDQ2MDQ3NzFlY2MyNTI5ZjlmODQ1OTIyMmI4MDBfVVBVWUZ2WmZWMDJQZkZ5VGhRZUhRTFd2ZVZFVEttUXpfVG9rZW46WElkMmJEcHhjb2ZRUHZ4RkZPTWNhVkxDbmNlXzE3NzAxODkwNjM6MTc3MDE5MjY2M19WNA)

这是移动端GPU（Mali, PowerVR, Adreno）相比桌面GPU架构的一个革命性设计，是TBDR架构的灵魂。

- 是什么：一块嵌入在GPU芯片内部的专用SRAM。它不是缓存，而是一块软件（驱动）管理的目的性极强的暂存区。
    
- 工作原理：
    
    - 分块 (Tiling)：将屏幕图像划分为16x16或32x32像素的小块（Tiles）。
        
    - 加载 (Load)：在渲染一个Tile之前，GPU驱动会主动地、批量地将渲染这个Tile所需的颜色附件和深度/模板缓冲区从DRAM加载到这块On-Chip Memory中。
        
    - 渲染 (Render)：整个Tile的所有渲染操作（数百万次像素读写）都完全在这块超高速的SRAM中进行，完全避开DRAM。
        
    - 存储 (Store)：当一个Tile的所有渲染完成后，将最终结果一次性写回DRAM中的帧缓冲区。
        
- 带来的巨大优势：
    
    - 带宽暴降：将数百万次对DRAM的随机、细粒度访问，变成了每Tile两次（一读一写）批量、顺序的访问。带宽消耗降低可达10-100倍。
        
    - 功耗大降：访问On-Chip SRAM的能耗远低于访问Off-Chip DRAM。
        
- 带宽相关优化的关系：减少Overdraw、简化Fragment Shader的优化，直接让这块宝贵的On-Chip Memory的使用效率更高。
    

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=Yzc1OTgxN2QzZWFmNDlhMGVkZDQ0ZTFiNDJhMTlhZWFfb2hxWk9ONUZRV3BkMHJhQTRXcm1JTGdzbmJONHNuMGRfVG9rZW46SlB2OWJGZDJ6b25jVE54a09yWGM3NGZIbmZiXzE3NzAxODkwNjM6MTc3MDE5MjY2M19WNA)

  

# **二.** **Bandwidth**

带宽消耗在哪里？

- 路径：
    
    - CPU -> 通过系统总线 -> 写入主内存（DRAM）中的特定区域（命令缓冲区、资源缓冲区 <-> SRAM 。
        
    - SRAM内部：sm寄存器<->L1<->L2
        
- 消耗的带宽：系统共享总线带宽。
    
- 优化目标：减少Draw Call数量、合并资源、避免每帧提交大量动态数据。
    

  

# 三. 移动端GPU带宽数据流

## 一.概括

渲染过程：

1. CPU（中央厨房）：负责准备原料、下发菜谱指令。
    
2. 系统总线与主内存（DRAM）（食材运输通道和中央仓库）：原料和指令从这里传递。
    
3. GPU（餐厅厨房）：拥有多位厨师（核心），负责实际炒菜。
    
4. GPU缓存（L1/L2）（厨师手边的调料台和厨房冰箱）：存放最常用、最急需的原料。
    
5. 屏幕（传菜窗口）：菜品最终从这里送出。
    

**带宽危机**：如果运输通道（带宽） 狭窄，或者厨师老是跑回中央仓库（DRAM） 取原料，那么即使厨师手艺再好，出菜速度也会被严重拖慢。我们的所有优化，核心目标就是：**修更宽的路，建更近的仓库，让厨师少跑腿**。

  

## 二、CPU -> GPU -> 屏幕：带宽消耗的三阶段分解

### 阶段一：CPU准备与提交 (中央厨房备料)

- 发生了什么：CPU准备渲染指令（Draw Calls）和资源数据（顶点、纹理、Uniform/常量数据等），并将它们写入主内存中一块叫命令缓冲区（Command Buffer） 的区域。
    
- 带宽消耗点：
    
    - 路径：`CPU` -> 通过系统总线（如AXI） -> `主内存（DRAM）中的命令缓冲区和资源区`。
        
    - 消耗类型：系统共享总线带宽。
        
    - 特点：这部分带宽由CPU和GPU共享，如果占用过高，会影响整个系统的响应。
        
    - 影响：Draw Call越多、渲染状态切换越频繁，需要传输的命令数据就越多，消耗的带宽也相应增加。
        
    
      
    
- 优化手段 & 对应效果：
    
    - GPU Instancing：例如将渲染100个相同树的100个Draw Call，合并成1个Draw Call。减少需要传输的指令数据量，直接减轻了系统总线压力。
        
    - 减少SetPass Calls：减少渲染状态的切换（如切换Shader、纹理）。每次状态切换都需要CPU提交新的指令数据。减少切换，就是减少了需要传输的指令量。
        
    - 合并静态批次：将多个静态物体的网格数据合并成一个，减少了需要提交的顶点缓冲区资源数量。
        
    
      
    

### 阶段二：GPU渲染 (餐厅厨房炒菜) - 主战场！

这是带宽消耗最大、最复杂的阶段。GPU需要从主内存获取大量数据来执行渲染命令。

- 发生了什么：GPU读取CPU提交的指令和资源，执行顶点着色、光栅化、片段着色等一系列操作。
    
- 带宽消耗点：
    
    - 路径：`GPU核心` <-> 通过内存控制器 <-> `主内存（DRAM）`。
        
    - 消耗类型：GPU内存带宽。这是**性能分析工具****（如****Snapdragon** **Profiler）**中 `Read/Write Total (Bytes/sec)` 指标主要度量的部分。
        
    - 消耗细分：
        
        - **纹理采样（Texture Fetching）**：最大消耗源之一。片段着色器需要频繁读取纹理数据，高分辨率纹理、各向异性过滤（Anisotropic Filtering）、复杂的材质（多张纹理叠加）都会导致惊人的带宽消耗。
            
        - **顶点获取（Vertex Fetching）**：顶点着色器需要读取顶点缓冲区数据。
            
        - **帧缓冲操作（Framebuffer Access）**：写入颜色、读取深度/模板缓冲区。在非TBDR架构上这是另一个带宽黑洞。
            
        - **渲染到纹理 (Render to Texture) / G-Buffer Passes**：在延迟渲染（Deferred Shading）、后处理（如Bloom, Blur）、阴影映射（Shadow Mapping）时，GPU需要将中间结果渲染到一张纹理上，而不是最终的屏幕缓冲区, 这相当于渲染了多帧，每一Pass都有自己的一套纹理采样和帧缓冲区读写操作，极大地增加了总带宽消耗。
            
- 优化手段 & 对应效果：
    
    - 减少纹理采样：直接将纹理采样的请求次数减少，可降低了内存控制器的压力和高带宽消耗的DRAM访问次数。
        
    - 纹理压缩（ASTC）/减小尺寸/去除无用通道：从根本上减小了数据本身的体积。
        
        - 同样大小的L2缓存可以缓存更多纹素（提高命中率）。
            
        - 从内存搬运一张纹理所需的数据量变少（直接降低带宽消耗）。
            
        - 对应**Snapdragon Profiler**的 **`L2 Texture Miss%`** 和 **`Read Total`** 指标。
            
    - 启用Mipmaps：这是为纹理采样优化的终极手段。强制中远景物体读取低分辨率的小纹理，极大提高了纹理缓存命中率，避免了不必要的高分辨率数据读取。
        
    - Mesh减面/LOD：减少了需要从主内存加载的顶点数据量。顶点越少，需要传输的数据就越少，顶点着色器的压力也越小。
        
    - Overdraw优化：即使是在TBR架构上，Overdraw（过度绘制）依然会消耗GPU在片上进行片段计算的资源和功耗。减少Overdraw提升了整体效率。
        
    
      
    

### 阶段三：显示输出 (从厨房窗口传菜)

- 发生了什么：渲染完成的最终图像存储在帧缓冲区中。显示控制器会以固定的频率（如60Hz）读取帧缓冲区的内容，并将其转换成信号输出到屏幕。
    
- 带宽消耗点：
    
    - 路径：`显示控制器` -> 通过内存控制器 -> `读取主内存中的帧缓冲区`。
        
    - 消耗类型：显示接口带宽。这是一个固定开销。
        
    - 计算公式：`带宽 = 分辨率 × 颜色深度 × 刷新率` (e.g., 1080p @ 60Hz RGBA8 ≈ 0.5 GB/s)。
        
- 优化手段 & 对应效果：
    
    - 降帧和降低渲染分辨率能有效降低这部分的开销
        
    - 这个阶段的优化通常不是我们应用层优化的重点，更多由系统和驱动控制。但高刷新率屏幕（90/120Hz）会显著增加这部分带宽。技术如面板自刷新（PSR） 可以在静态画面时大幅节省这部分带宽和功耗。
        

  

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=NzgyOWMzM2UxMjkxYWUyZThiOTFiODRiMjEyYTUxMDBfM1Jka2FScExvN203aWdXYjZkSE5FWW9BbXFTVEFjZW5fVG9rZW46WHBhcWJ2ZlRjbzJ2aVN4b3VGd2NmRVdvbmNZXzE3NzAxODkwNjM6MTc3MDE5MjY2M19WNA)

# 四.部分指标解读

## Read/Write Total (Bytes/sec)

顾名思义，该指标就是最直接的读写总带宽，任何优化都能直接通过该参数反映出来。

理想范围：1.8G-2.4G

![](https://o455xcugsp.feishu.cn/space/api/box/stream/download/asynccode/?code=YzEwODViNTY3MDI4ZjM0MGUwOWE2MmUxYjMzZjNmMzZfV0JrZVF5VmJvTkZVcUc3Y2tFZ2tNRHEyNkxSSmNGR0FfVG9rZW46RGM0dmJoNGpnb2ROTnB4TkJRQ2NNUG9Cbm1oXzE3NzAxODkwNjM6MTc3MDE5MjY2M19WNA)

UWA发布 | Unity手游性能年度蓝皮书：https://mp.weixin.qq.com/s/CyyH_uaafRbZRzTDDY1wSA

  

## ALU/Vertex（顶点着色器ALU操作数）

理想范围：20-40 ALU操作/顶点

- 顶点着色器负责坐标变换、蒙皮计算等任务。移动端GPU（如Mali、Adreno）受限于带宽和并行能力，若单顶点ALU操作超过40，易引发以下问题：
    
    - 顶点吞吐瓶颈：高复杂度计算导致GPU顶点处理单元过载，帧率下降。
        
    - 带宽压力：顶点数据读取频繁，若未压缩或复用率低（如未启用GPU Instancing），会加剧内存延迟。
        
- 异常阈值：
    
    > - 50 ALU/Vertex：需优化模型拓扑（减少顶点数）或启用静态合批（Static Batching）
    >     
    
- 高温/卡顿根因：
    
    - 高ALU/Vertex + 低顶点复用 → 顶点获取停滞（% Vertex Fetch Stall >20%），CPU-GPU数据传输阻塞。
        

## ALU/Fragment（片段着色器ALU操作数）

理想范围：10-30 ALU操作/片段

- 片段着色器处理像素级光照、纹理采样等，其计算量随分辨率平方级增长。移动端建议：
    
    - 中低端设备：≤20 ALU/Fragment（如720P屏幕）。
        
    - 高端设备：≤30 ALU/Fragment（如1080P+屏幕）。
        
- 异常风险：
    
    > - 40 ALU/Fragment：导致GPU填充率（Fill Rate）瓶颈，引发过热降频。
    >     
    > - 高Divergence（分支分歧）：若利用率（% Shader ALU Capacity Utilized）<50%，需减少动态分支（如用查表替代`if`语句）
    >     
    
- 高温/卡顿根因：
    
    - 高ALU/Fragment + 高Divergence → Quad利用率低下（如微三角形导致有效像素计算仅25%），GPU算力浪费。
        

|   |   |   |
|---|---|---|
|指标​​|​​影响因素​​|​​优化方法​​|
|​​ALU/Vertex​​|顶点数量、蒙皮骨骼数|- 压缩顶点数据（16位浮点）  <br>- 启用GPU Instancing提升复用率|
|​​ALU/Fragment​​|纹理采样、复杂光照、后处理|- 减少冗余纹理采样（合并RGBA通道）  <br>- 简化Shader分支（如预计算光照）  <br>- 控制Overdraw（层级≤2）|

## 其他关键指标

包含**L1 Hit%, L1 Texture Miss %, L2 Texture Miss%**

|   |   |   |   |
|---|---|---|---|
|​​指标​​|​​L1缓存影响​​|​​L2缓存影响​​|​​安全阈值​​|
|​​命中率​​|决定单帧渲染延迟（如技能特效）|影响场景切换流畅度（如大地图）|L1>80%, L2>90%|
|​​未命中代价​​|延迟增加 ​​50–100ns​​|延迟增加 ​​200–500ns​​|需控制L1 Miss%<20%|
|​​带宽压力​​|高未命中率触发主存频繁读写|高未命中率显著增加功耗|总带宽<1.2GB/s|

- 降低L1 miss率：
    
    - 压缩顶点数据（`half3`替代`float3`），确保单次访问填满64B缓存行。
        
    - 避免Shader中随机纹理采样（如噪声图改用程序化生成）。
        
    - 减少采样纹理次数
        
    - 提高Shader访问纹理的空间局部性（即纹理采样是否连续）
        
- 降低L2 miss率：
    
    - 合并小纹理为图集（Texture Atlas），增加空间局部性。
        
    - 对静态物体启用GPU Instancing，复用相同模型数据。
        
    - 启用mipmap
        
    - 减少shader采样次数
        
    - 减少RT的切换
        

  

  

移动平台GPU硬件学习与理解：https://zhuanlan.zhihu.com/p/347001411?hmsr=toutiao.io