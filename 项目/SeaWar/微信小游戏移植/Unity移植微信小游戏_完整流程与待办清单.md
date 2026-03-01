# Unity 游戏移植微信小游戏
## 完整流程手册与项目待办清单

> 适用版本：Unity 2022.3 LTS · 转换插件：minigame-unity-webgl-transform

---

> ⚠️ **本手册特别关注目标游戏已使用的五项关键技术**：自建 CDN 资源服务、async/await 异步编程、Job System + Burst 编译器、URP 渲染管线、原生 Socket 通信。其中 Burst 在 WebGL **完全不可用**（风险最高）；原生 TCP/UDP Socket（System.Net.Sockets）在 WebGL 沙箱中同样完全不可用，必须全面迁移到 WebSocket（wss://）；URP 的 Deferred 渲染路径不支持，Shader 变体爆炸可使构建超时。**务必在立项阶段完成三项可行性评估后再排期。**

---

## 移植阶段总览

| 阶段 | 名称 | 核心目标 | 参考工期 | 关键里程碑 |
|------|------|----------|----------|------------|
| **P1** | 环境准备与可行性评估 | 确认技术可行性 | 1–2 周 | Burst/Socket 替换方案确定；CDN 域名备案 |
| **P2** | 引擎配置与首包构建 | 工程能跑起来 | 1–2 周 | Hello World 小游戏跑通；微信开发者工具可预览 |
| **P3** | CDN 与资源管线 | 资源正常加载 | 2–3 周 | AB 远程加载正常；缓存机制验证通过 |
| **P4** | async/await 改造 | 异步逻辑正确运行 | 2–4 周 | 所有 Task.Delay/Run 替换为 UniTask；无线程相关崩溃 |
| **P5** | Job System 降级与性能 | 帧率达标 | 2–4 周 | Burst 移除后帧率 ≥30fps；内存峰值 <500MB |
| **P5.5** | Socket 通信迁移 | 网络通信正常 | 2–3 周 | WebSocket 实测延迟 ≤100ms；断线重连 3 次内恢复 |
| **P6** | 微信 SDK 集成 | 平台功能可用 | 1–2 周 | 登录/支付/分享/排行榜全部联调通过 |
| **P7** | 质量保证与上线 | 通过审核上线 | 2–3 周 | 体验版稳定；提审一次通过 |

---

## 阶段 1｜环境准备与可行性评估

> 在动工前摸清底线，避免在错误假设上投入大量人力

### 1.1 开发环境搭建

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 1 | 安装 Unity 2022.3 LTS，添加 WebGL Build Support 模块 | 🔴 阻塞 | 所有构建操作的前提 |
| 2 | 下载微信开发者工具 Stable 版（非 Nightly） | 🔴 阻塞 | 调试小游戏的唯一官方工具 |
| 3 | 注册微信小游戏账号，获取 AppID，保存 AppSecret | 🔴 阻塞 | 后续所有平台功能均需 AppID |
| 4 | 通过 UPM 安装微信小游戏 Unity SDK（com.qq.weixin.minigame） | 🔴 阻塞 | 转换工具核心依赖 |
| 5 | 安装 Node.js 18+ 并验证 npm 可用（SDK 部分工具链依赖 Node） | 🟠 高 | 转换脚本运行依赖 |
| 6 | 配置 CI/CD 构建机：Windows 或 macOS，内存 ≥16GB，SSD 空间 ≥50GB | 🟡 中 | WebGL 构建极耗内存和时间 |

### 1.2 技术可行性评估（关键决策点）

> ⚠️ 本节是移植工作能否成功的最关键决策点。特别是 Burst 评估结果将直接影响整体工期和技术方案。建议在此阶段输出一份正式的《技术可行性报告》供管理层决策。

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 7 | **Burst 依赖度排查**：全局搜索 `[BurstCompile]` 特性，统计受影响的 Job 数量。若 Burst Job 涉及核心战斗/物理/AI 的高频路径，需制定降级方案 | 🔴 阻塞 | Burst 在 WebGL 完全不可用 |
| 8 | 统计所有 `Task.Delay` / `Task.Run` / `Task.ContinueWith` / `ConfigureAwait` 调用点数量 | 🔴 阻塞 | 单线程环境全部失效 |
| 9 | 统计所有使用 `www` / `UnityWebRequest` 下载 AB 的代码路径 | 🟠 高 | 需替换为 WXAssetBundle API |
| 10 | 检查是否使用了反射密集型代码（JSON 序列化库、IOC 框架等） | 🟠 高 | IL2CPP 裁剪可能误删 |
| 11 | 统计原始 WebGL 包体大小（IL2CPP 构建后） | 🟠 高 | 评估分包策略所需数据 |
| 12 | 清查自建 CDN 域名，逐一确认 ICP 备案状态，提前准备不合规域名的替换方案 | 🟠 高 | 未备案域名无法通过审核 |
| 13 | 评估游戏内存峰值（Profiler 采样），确认 iOS 低端设备达标空间 | 🟡 中 | iOS 1GB 硬限制 |
| 14 | **Socket 通信架构排查**：统计所有 `System.Net.Sockets`（TcpClient / UdpClient / Socket）及第三方 SDK 的调用入口。若使用 UDP（帧同步常见），需评估是否改用降频或状态同步方案 | 🔴 阻塞 | WebGL 沙箱禁止所有原生 Socket |
| 15 | 确认游戏服务器是否已支持 WebSocket 协议（端口 + wss:// 证书 + 握手逻辑）；若无则列入服务端排期 | 🔴 阻塞 | 服务端适配可能是关键路径 |

### 1.3 URP 可行性评估

> ⚠️ URP 在 WebGL 上有三个硬性约束需要在立项阶段确认：Deferred 渲染路径不可用、Decal Renderer Feature 不支持、Shader 变体数量可使构建时间从 20 分钟暴增到 4+ 小时。这三项必须在 P1 阶段完成评估并制定应对方案。

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| URP-1 | **渲染路径检查**：确认 URP Asset 中 Rendering Path 当前设置。若为 Deferred 或 Deferred+，必须切换为 Forward 或 Forward+，可能涉及光照/阴影效果回退 | 🔴 阻塞 | Deferred Rendering 在 WebGL 完全不支持 |
| URP-2 | **Renderer Features 清查**：列出所有自定义 URP Renderer Feature。重点确认：Decal（WebGL 不支持）、Screen Space Shadows（WebGL 不支持）、SSAO（WebGL 极慢，建议关闭） | 🔴 阻塞 | 部分 Feature 在 WebGL 会编译失败或黑屏 |
| URP-3 | **Shader 变体数量评估**：执行一次 WebGL 目标构建，在 Editor.log 中搜索"Compiling shader"统计总变体数。参考：<5万可接受，5–20万需启用 Stripping，>20万需专项治理 | 🟠 高 | URP 项目常见 10万+ 变体，严重拖慢构建 |

---

## 阶段 2｜引擎配置与首包构建

> 正确配置 Unity WebGL 构建参数，完成第一次可运行的小游戏

### 2.1 Unity Player Settings 配置

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 14 | 切换 Platform 到 WebGL，确认 Build Target 正确 | 🔴 阻塞 | |
| 15 | 启用 WebGL 2.0（Graphics APIs → WebGL 2.0 排第一） | 🔴 阻塞 | GPU Instancing / ASTC 纹理依赖此项 |
| 16 | 设置 Color Space 为 Gamma（WebGL 2.0 下的 Linear 存在 iOS 兼容风险） | 🟠 高 | 如需 PBR 精度，Linear 需额外测试 |
| 17 | Code Optimization 设为 Disk Size with LTO，减少 WASM 体积 | 🟠 高 | 体积直接影响编译内存 |
| 18 | Strip Engine Code 开启，Managed Stripping Level 设为 High | 🟠 高 | 过度裁剪会误删反射相关代码 |
| 19 | Exception Handling 设为 Explicitly Thrown Exceptions Only | 🟠 高 | Full 模式使 WASM 体积暴增 |
| 20 | 关闭 Development Build（正式性能测试时）；调试时开启并勾选 Auto Connect Profiler | 🟡 中 | |
| 21 | 配置 link.xml 保护所有通过反射访问的程序集 | 🟠 高 | 高裁剪级别必须配套使用 |

### 2.2 纹理与内存优化配置

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 22 | 全局纹理格式改为 ASTC（Android/iOS 均选 ASTC），Quality Settings 中各平台单独确认 | 🔴 阻塞 | 显存节省 10–16x |
| 23 | UI 纹理、Sprite Atlas、CubeMap 关闭 Mip Map | 🟠 高 | 节省约 1/3 显存 |
| 24 | Quality Settings → Disable v Sync（由 requestAnimationFrame 控制，不设 targetFrameRate） | 🟡 中 | |
| 25 | 关闭 HDR（Graphics Settings 各 tier 中关闭 HDR），除非游戏强依赖 HDR 后处理 | 🟡 中 | 节省约 40MB 显存及一次 RT 拷贝 |
| 26 | 音频全部改为 Compressed In Memory，Force To Mono，Quality 设最低值 1 | 🟡 中 | |
| 27 | 在 Player Settings → WebGL → Memory Growth Mode 选 Geometric 或按需增长 | 🟡 中 | Unity 2021.2+ 生效 |

### 2.3 微信转换工具配置与首次构建

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 28 | 菜单 → 微信小游戏 → 转换小游戏 → 填写 AppID、DATA_CDN 地址（填占位 URL 也可先跑通） | 🔴 阻塞 | |
| 29 | 首次构建选最精简场景（仅 Loading 场景），验证导出流程无报错 | 🔴 阻塞 | |
| 30 | 用微信开发者工具打开导出的 `minigame/` 目录，确认可预览（无编译错误） | 🔴 阻塞 | 基础流程验证 |
| 31 | 确认 WASM 包体 <4MB（仅含核心代码分包），否则需启用代码分包工具 | 🟠 高 | 主包上限 4MB |
| 32 | 确认导出 `webgl/` 目录结构正确，StreamingAssets 文件夹存在且包含 AB 相关文件 | 🟡 中 | |
| 33 | 在真实 Android 设备上扫码预览，确认渲染正常、无崩溃 | 🟠 高 | |

### 2.4 URP 渲染管线专项配置

> 💡 URP 的每一项配置都会直接影响 WebGL 构建包体、GPU 内存和运行时帧率。推荐为 WebGL 目标单独创建一套 URP Asset，不影响其他平台。

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| URP-4 | **强制切换到 Forward 渲染路径**：URP Asset → Rendering → Rendering Path = Forward 或 Forward+。Deferred 依赖 G-Buffer（多张 MRT），WebGL framebuffer 扩展支持不完整，在多数移动设备上输出黑屏 | 🔴 阻塞 | Deferred 在 WebGL 输出黑屏 |
| URP-5 | **MSAA 设置**：URP Asset → Quality → Anti Aliasing = 2x（移动端最优）或 Disabled。4x MSAA 在 iOS WebGL 下需要 4 倍 RT 内存，中低端设备直接触发 OOM；禁用后可用 FXAA 后处理替代 | 🟠 高 | 4x MSAA 在 iOS 低端设备导致 OOM |
| URP-6 | **关闭 HDR**：URP Asset → Quality → HDR = Off。HDR 需要额外的 RGBA16F RenderTexture（约 40MB/1080p），且在 Gamma 色彩空间下实际收益极小 | 🟠 高 | 节省约 40MB RT 内存 |
| URP-7 | **阴影精简**：Cascade Count = 1（中低端）或 2（高端），Shadow Resolution ≤ 1024，Shadow Distance 缩到场景最小合理值。每个 Cascade 消耗一张独立 ShadowMap RT，1024² 约 4MB，4 Cascade = 16MB | 🟠 高 | 阴影 RT 是 GPU 内存大户 |
| URP-8 | **限制 Additional Lights**：URP Asset → Lighting → Additional Lights = Per Vertex，最大数量 = 2。Per Pixel 模式在 Forward 路径下每盏灯叠加一次完整 Fragment Shader 计算 | 🟠 高 | 多动态光源是帧率杀手 |
| URP-9 | **按需关闭 Depth Texture 和 Opaque Texture**：仅在 Shader 中实际采样这两张纹理时才开启（软粒子需 Depth Texture，折射需 Opaque Texture） | 🟡 中 | 无使用则关闭，节省 RT 内存和 CopyPass |
| URP-10 | **后处理 Volume 精简**：仅保留 Bloom（Intensity ≤ 0.5）+ Color Grading（Mode = LDR）。**明确禁用**：SSAO（帧率下降 30–50%）、SSR、DoF、Motion Blur、Chromatic Aberration | 🔴 阻塞 | SSAO 在 WebGL 会导致帧率崩溃 |
| URP-11 | **Shader 变体裁剪（三步法）**：① Project Settings → Graphics → Shader Stripping 开启 Strip unused shader_feature variants；② 使用 Shader Variant Collection 录制实际使用变体；③ URP Asset 中关闭所有未使用的功能开关 | 🟠 高 | 变体数每减少 50% 构建速度大幅提升 |
| URP-12 | 所有自定义 Renderer Feature 加 WebGL 平台守卫：在 `AddRenderPasses()` 中加 `#if !UNITY_WEBGL` 或运行时判断 `Application.platform != RuntimePlatform.WebGLPlayer` | 🟠 高 | 不兼容 Feature 导致渲染异常或崩溃 |
| URP-13 | （可选）为 WebGL 平台创建独立的 URP Asset 配置文件，在 Quality Settings 中指定，与 PC/Console 配置彻底解耦 | 🟡 中 | 推荐最佳实践，保持多平台配置独立 |

---

## 阶段 3｜CDN 与资源管线适配

> 将自建 CDN 与微信小游戏网络沙箱完全打通，资源按需加载

### 3.1 域名与网络配置（平台侧）

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 34 | 登录微信公众平台 → 开发管理 → 开发设置 → 服务器域名，配置四类白名单域名 | 🔴 阻塞 | 线上环境所有请求都需在白名单 |
| 35 | request 合法域名：填入 API 服务器域名（HTTPS，已备案，无端口号） | 🔴 阻塞 | |
| 36 | downloadFile 合法域名：填入 CDN 域名（所有 AB 资源下载用） | 🔴 阻塞 | |
| 37 | uploadFile 合法域名：填入文件上传接口域名（如有） | 🟡 中 | |
| 38 | socket 合法域名：填入 WebSocket 服务域名（wss:// 协议，如有） | 🟡 中 | |
| 39 | 验证所有 CDN 域名 SSL 证书有效期 >6 个月，设置证书到期自动续签提醒 | 🟠 高 | 证书过期直接导致所有下载失败 |
| 40 | CDN 服务器配置 CORS 响应头：`Access-Control-Allow-Origin: *` | 🟠 高 | 跨域拦截 |
| 41 | CDN 开启 Brotli 压缩响应（对 WASM 文件特别重要，可压缩 70%+ 体积） | 🟠 高 | |
| 42 | 开发阶段：微信开发者工具勾选"不校验合法域名"；上线前必须关闭 | 🟡 中 | 仅开发调试用 |

### 3.2 AssetBundle 构建策略

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 43 | AB 构建选项：ChunkBasedCompression（LZ4）+ DisableWriteTypeTree + AppendHashToAssetBundleName | 🔴 阻塞 | Hash 用于缓存版本管理 |
| 44 | 控制单个 AB 文件大小在 2–5MB（太小碎片多，太大超时且拉高峰值内存） | 🟠 高 | |
| 45 | 将第一个场景和 Loading 资源打入首包（<20MB 总限制内） | 🔴 阻塞 | |
| 46 | 其余所有场景和资源打成 AB 放到 CDN | 🟠 高 | |
| 47 | 建立 AB Manifest 版本文件，记录各 AB 的 hash 和 URL 映射 | 🟠 高 | |

### 3.3 AB 加载代码改造

> ⚠️ 关键改造点：Unity 标准的 `AssetBundle.LoadFromFile()` 和 `WWW` 系列 API 在微信小游戏中内存效率极低，必须替换为微信专用接口。

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 48 | 将所有 `UnityWebRequestAssetBundle.GetAssetBundle(url)` 替换为 `WXAssetBundle.GetAssetBundle(url)` | 🔴 阻塞 | 官方 API，桥接微信原生文件系统 |
| 49 | 将 `bundle.Unload(false)` 替换为 `bundle.WXUnload(false)` | 🟠 高 | 正确释放微信文件系统资源 |
| 50 | 禁止使用 `WWW.LoadFromCacheOrDownload` 及任何 WWW 缓存接口 | 🔴 阻塞 | 产生大量不可释放内存 |
| 51 | 禁止使用 `AssetBundle.LoadFromFile()`（路径在 WASM 内存文件系统，无效节省） | 🟠 高 | |
| 52 | 加载逻辑改为：下载 AB → 立即提取资源 → 立即调用 `WXUnload(false)`，不缓存 AB 对象 | 🟠 高 | 避免 2–3x 体积的 AB 内存滞留 |
| 53 | 实现并发下载限制器（最多同时 10 个请求），超出时排队等待 | 🟠 高 | 微信限制并发上限为 10 个 |
| 54 | 实现进入后台检测，暂停或取消进行中的网络请求（后台 5s 未完成请求将超时失败） | 🟡 中 | |
| 55 | 实现空闲时预下载机制：游戏空闲时使用 preload 请求头预缓存后续关卡资源 | 🟡 中 | |

---

## 阶段 4｜async/await 异步代码改造

> 将所有依赖 System.Threading 的异步逻辑迁移到 UniTask

> ❌ **WebGL 是严格单线程环境。** async/await 关键字本身可用，但所有依赖线程池的 Task API 在运行时会直接崩溃或死锁。UniTask 是目前最成熟的替换方案。

### 4.1 UniTask 引入

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 56 | 通过 UPM 安装 UniTask：Add from git URL → `https://github.com/Cysharp/UniTask.git?path=src/UniTask/Assets/Plugins/UniTask` | 🔴 阻塞 | |
| 57 | 在项目根 Assembly Definition 中添加 UniTask 引用 | 🟠 高 | |
| 58 | 在 UniTask 面板中确认 WebGL 模式已启用（不使用 ThreadPool 调度器） | 🔴 阻塞 | |

### 4.2 Task API 全量替换对照表

| 替换前（不可用） | 替换后（UniTask） | 优先级 |
|-----------------|------------------|--------|
| `Task` / `Task<T>` | `UniTask` / `UniTask<T>` | 🔴 阻塞 |
| `Task.Delay(ms)` | `UniTask.Delay(ms)` | 🔴 阻塞 |
| `Task.Delay(ms, cancellationToken)` | `UniTask.Delay(ms, cancellationToken: ct)` | 🔴 阻塞 |
| `Task.Run(() => ...)` | 不可替换为多线程；改为 `UniTask.Create()` 或直接同步 | 🔴 阻塞 |
| `Task.WhenAll(...)` | `UniTask.WhenAll(...)` | 🟠 高 |
| `Task.WhenAny(...)` | `UniTask.WhenAny(...)` | 🟠 高 |
| `await Task.Yield()` | `await UniTask.Yield()` | 🟡 中 |
| `ConfigureAwait(false)` | 删除（单线程无意义） | 🟠 高 |
| `CancellationTokenSource` 带超时构造 | 改用 `CancellationTokenSource` + `UniTask.Delay` 组合取消 | 🟠 高 |
| `TaskCompletionSource<T>` | `UniTaskCompletionSource<T>` | 🟡 中 |

### 4.3 改造验证

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 59 | 全局搜索 `using System.Threading`（非 CancellationToken 相关的使用基本都需处理） | 🔴 阻塞 | |
| 60 | 全局搜索 `Task.` 确认无遗漏调用点 | 🔴 阻塞 | |
| 61 | 运行回归测试，验证改造后所有异步流程（Loading、战斗、UI 切换）正常 | 🟠 高 | |
| 62 | WebGL 构建后实机测试，确认无线程相关异常日志 | 🔴 阻塞 | |

---

## 阶段 5｜Job System 降级与性能优化

> Burst 缺失导致性能回退，通过算法和渲染优化保证帧率达标

> ❌ **核心前提**：Burst 编译器在 WebGL 完全不受支持（`[BurstCompile]` 被静默忽略），Job System 可以编译运行但所有 Worker 数为 0（单线程同步执行）。依赖 Burst 的高性能计算在 WebGL 上可能慢 5–10 倍。必须在 P1 评估阶段就确定降级方案。

### 5.1 Burst 相关代码处理

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 63 | 确认项目已在 WebGL 构建设置中标记 Burst 为 Disabled（避免意外增大包体） | 🔴 阻塞 | |
| 64 | 用 `#if !UNITY_WEBGL` 条件编译包裹原始高性能 Burst 代码，保留非 WebGL 平台的优化 | 🟠 高 | |
| 65 | 针对 WebGL 分支，编写简化版实现：降低算法复杂度 / 减少计算频率 / 预计算替换实时计算 | 🟠 高 | 因游戏而异，需个案分析 |
| 66 | 批量粒子/动画 Bone 计算等 Job 在 WebGL 下改为分帧处理（每帧处理 N 个，利用多帧分摊） | 🟡 中 | |
| 67 | AI 寻路：WebGL 下降低更新频率（如 0.3s/次 → 0.5s/次），减小寻路图精度 | 🟡 中 | |

### 5.2 内存优化

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 68 | 使用 Profiler（WebGL Dev Build）对内存峰值进行 3 次以上采样，确认 Managed Heap 峰值 | 🔴 阻塞 | |
| 69 | 验证所有 AB 加载后都及时 WXUnload，无 AB 对象泄漏（Profiler → Memory 面板验证） | 🔴 阻塞 | |
| 70 | GPU 纹理内存检查：确认 ASTC 8x8 纹理正常加载，无 RGBA32 未压缩纹理残留 | 🟠 高 | |
| 71 | 场景切换后强制调用 `Resources.UnloadUnusedAssets()` + `GC.Collect()` 以对齐内存峰值检测 | 🟠 高 | |
| 72 | iOS 低端设备（1GB 内存）实机验证内存峰值 <1GB（含微信基础库约 200MB 开销） | 🔴 阻塞 | |

### 5.3 渲染优化

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 73 | 启用 SRP Batcher（URP 默认启用），确认 WebGL 2.0 模式下生效 | 🟠 高 | |
| 74 | 启用 GPU Instancing（Material 上勾选 Enable GPU Instancing，需 WebGL 2.0） | 🟡 中 | |
| 75 | iOS 上 DrawMeshInstanced 每次调用矩阵数量不超过 32 | 🟠 高 | iOS WebGL 2.0 实现限制 |
| 76 | UI 使用 Sprite Atlas 合图，减少 UI Draw Call | 🟠 高 | |
| 77 | 粒子系统：控制总粒子数 <5000，关闭不必要的 Renderer 的 Shadow Casting | 🟡 中 | |
| 78 | 后处理：仅保留对画面质量影响最大的 1–2 个效果，其余关闭 | 🟡 中 | |
| 79 | 在转换面板中启用 EmscriptenGLX（微信专用 GL 优化，可提升 10%+ 帧率） | 🟡 中 | |

### 5.4 URP 渲染性能专项

> 💡 URP 在 WebGL 单线程环境下，每一个额外的 RenderPass 都会引入 RT 切换开销（glBindFramebuffer）。在 iOS WebGL 上，RT 切换的代价比 Android 高出约 3 倍，因此**减少 Pass 数量是 URP 性能优化的核心抓手**。

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| URP-14 | **Frame Debugger 审查 URP Pass 总数**：`Window → Analysis → Frame Debugger`（WebGL Dev Build 下可用）。目标：移动端 WebGL 建议 Pass 总数 ≤15；重点排查多余的 CopyColor、CopyDepth、SSAO 等自动插入的 Pass | 🟠 高 | 每个冗余 Pass 都是帧时间开销 |
| URP-15 | **烘焙替换实时 GI**：将所有静态场景光照切换为 Baked Lightmap，禁用 Realtime Global Illumination。Realtime GI（Enlighten 系统）在 WebGL 单线程下每帧都有 CPU 计算开销，且无法利用 Burst 加速 | 🟠 高 | 实时 GI + 无 Burst = 严重 CPU 占用 |
| URP-16 | （低端设备保底方案）URP Asset → Rendering → Render Scale = 0.75。GPU 光栅化像素数减少约 44%，帧率通常可提升 20–35% | 🟡 中 | 中低端设备帧率兜底方案 |
| URP-17 | **验证 SRP Batcher 在 WebGL 下实际生效**：Frame Debugger 确认 SRP Batch 合批数量 > 0。手写 Legacy Shader 需手动添加 `CBUFFER_START(UnityPerMaterial)` 块 | 🟡 中 | 确认合批生效，而非仅配置开启 |

---

## 阶段 5.5｜Socket 通信迁移

> 将原生 TCP/UDP Socket 完整替换为 WebSocket，保证游戏实时通信在微信沙箱内正常运行

> ❌ `System.Net.Sockets` 的任何 API（TcpClient、UdpClient、Socket.Connect）在运行时都会抛出 SocketException 或直接崩溃。微信小游戏提供的唯一替代方案是 `wx.connectSocket`，底层是 WebSocket over WSS。

### 5.5.1 客户端 Socket 代码替换

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| WS-1 | 全局搜索所有 Socket 使用入口，建立替换清单。搜索关键词：`System.Net.Sockets`、`TcpClient`、`UdpClient`、`NetworkStream`、`BinaryReader/Writer`，以及第三方库关键词（Mirror、Netly、MLAPI、FishNet 的 Transport 类名） | 🔴 阻塞 | 摸清改造边界是第一步 |
| WS-2 | 引入 WebSocket 客户端库：推荐 **NativeWebSocket**（WebGL 目标下直接桥接 `wx.connectSocket`，Standalone 下使用 `ClientWebSocket`，同一套 API 跨平台透明切换） | 🔴 阻塞 | WebGL 下必须走 wx.connectSocket |
| WS-3 | 封装统一的 `NetworkClient` 抽象层（接口：`Connect(url)` / `Send(byte[])` / `OnMessage(Action<byte[]>)` / `Disconnect()`），业务逻辑仅依赖接口，底层实现按平台切换 | 🟠 高 | 抽象层保证多平台逻辑复用 |
| WS-4 | 消息帧格式迁移：将原 TCP 流式粘包/拆包逻辑（ReadInt32 帧头）改为 WebSocket Message 边界，每次 `OnMessage` 回调天然对应一条完整消息，粘包解析逻辑可直接删除 | 🟠 高 | 协议语义变化，粘包逻辑可删除 |
| WS-5 | **每帧主动调用 `websocket.DispatchMessageQueue()`**（NativeWebSocket 要求）。WebSocket 消息回调积累在 JS 侧队列，必须在 `Update()` 中每帧手动分发，否则 `OnMessage` 永远不会触发 | 🔴 阻塞 | 遗漏此调用 = 收不到任何服务器消息 |
| WS-6 | 在 WebGL 平台禁用/替换所有 UDP 相关代码路径。若原游戏使用 UDP 帧同步（KCP），方案：①WebSocket + 服务端丢帧补偿（降低同步频率）；②仅 WebGL 平台改为状态同步 | 🔴 阻塞 | WebGL 不支持 UDP，帧同步需专项方案 |

### 5.5.2 服务端 WebSocket 支持

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| WS-7 | 游戏服务器增加 WebSocket 监听端口，实现 HTTP Upgrade 握手（Java: Netty；Go: gorilla/websocket；C++: uWebSockets） | 🔴 阻塞 | 服务端不支持 WS 则客户端无法连接 |
| WS-8 | 为 WebSocket 端口配置 TLS 证书（wss://），证书域名必须与微信后台 socket 合法域名完全一致。建议 Nginx/Caddy 做 TLS 终止，后端服务使用明文 WebSocket | 🔴 阻塞 | 线上只允许 wss://，ws:// 被拦截 |
| WS-9 | 在微信公众平台 → 服务器域名 → **socket 合法域名**中填入 `wss://` 域名（注意：socket 和 request 是两个独立白名单） | 🔴 阻塞 | 两个白名单独立配置，不可混淆 |
| WS-10 | 服务端实现 WebSocket 心跳响应（Pong 帧），配置连接超时 60s。移动端 NAT 设备空闲连接通常 30–90s 超时断开，需在 30s 内未收到消息时主动发 Ping | 🟠 高 | 移动端 NAT 超时是静默断线的主因 |

### 5.5.3 移动端鲁棒性：断线重连与后台处理

> ⚠️ 移动端网络切换（WiFi → 4G）、进入隧道、锁屏、微信切后台都会导致 WebSocket 断开，客户端必须有完善的重连与状态恢复机制。

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| WS-11 | **实现指数退避重连策略**：重试间隔 1s → 2s → 4s → 8s（上限 30s），最多重试 5–10 次。重连期间显示"网络重连中..."UI | 🔴 阻塞 | 无重连逻辑 = 断线即需重启游戏 |
| WS-12 | **监听微信生命周期事件**：`WX.OnHide` 时停止心跳、记录断开时间戳；`WX.OnShow` 时立即检查 WebSocket 状态，若已断开则触发重连流程 | 🟠 高 | 主动管理比被动等待超时快 5–10 倍 |
| WS-13 | **实现会话续期（Session Resume）**：重连握手消息中携带 openid + token + 最后已确认的服务器消息序号（seq），服务端补发断线期间丢失的消息（消息队列保留 60s） | 🟠 高 | 无续期 = 断线即掉房间，用户体验极差 |
| WS-14 | 客户端实现消息发送队列：断线期间累积待发消息，重连成功后按序重发；过期消息需有 TTL 机制 | 🟡 中 | |
| WS-15 | 微信并发 WebSocket 连接限制最多 5 个，若多个逻辑 Channel（战斗服、聊天服、匹配服）各自独立连接，需改为单条 WebSocket 多路复用（通过消息 type 字段区分业务通道） | 🟠 高 | 微信上限 5 个并发 WebSocket |

### 5.5.4 通信性能与延迟优化

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| WS-16 | 消息序列化：确认协议格式使用 Protobuf / MessagePack / FlatBuffers，**不使用 JSON**。JSON 序列化在 WebGL 单线程下每帧 50+ 消息时可能占用 2–3ms；注意 IL2CPP 裁剪需在 link.xml 中保护 Protobuf 程序集 | 🟠 高 | JSON 序列化在 WebGL 是性能热点 |
| WS-17 | **延迟基准测试**：在真机微信环境中测量 RTT（发送带时间戳的 Ping，服务端原样回显）。目标：4G ≤150ms，WiFi ≤50ms。注意微信 WebSocket 经过 Native 层代理，比标准浏览器额外多约 5–10ms | 🟡 中 | 实际测量比理论估算更重要 |

---

## 阶段 6｜微信 SDK 集成

> 接入登录、支付、分享、排行榜等微信平台能力

### 6.1 SDK 初始化与登录

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 80 | 在游戏启动时第一帧调用 `WX.InitSDK(callback)`，所有 WX API 调用须在 callback 内 | 🔴 阻塞 | |
| 81 | 实现登录流程：`WX.Login` → 获取 code → 发送到自建服务器 → 换取 openid/session_key | 🔴 阻塞 | 客户端不直接获取 openid |
| 82 | 用户信息授权：使用 `WX.CreateUserInfoButton()` 创建按钮，用户点击后获取 | 🟠 高 | 不能静默获取用户信息 |
| 83 | 实现 Token/Session 失效重新登录逻辑 | 🟡 中 | |

### 6.2 支付集成

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 84 | 申请米大师虚拟支付权限（需游戏版号，Android 端必须） | 🔴 阻塞 | |
| 85 | 实现道具直购或游戏币充值流程，前端调用 `WX.RequestMidasPayment` | 🟠 高 | |
| 86 | 服务端实现余额查询接口，支付完成后以服务端余额为准（客户端回调不可信） | 🔴 阻塞 | |
| 87 | iOS 端：不能在小游戏内发起虚拟支付，需跳转 H5 页面支付或客服消息链接 | 🟠 高 | Apple 政策限制 |

### 6.3 社交与广告

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 88 | 实现分享功能：`WX.ShowShareMenu`（右上角菜单分享）+ `WX.ShareAppMessage`（主动分享） | 🟡 中 | |
| 89 | 如需好友排行榜：在开放数据域实现数据存取，主域通过 SharedCanvas 渲染结果 | 🟡 中 | |
| 90 | 广告集成：按需接入 BannerAd / RewardedVideoAd / InterstitialAd | 🟡 中 | |
| 91 | 实现广告加载失败的降级处理（加载失败时隐藏广告入口，避免空白区域） | 🟡 中 | |

---

## 阶段 7｜质量保证与上线审核

> 全面测试、性能达标、一次性通过微信审核

### 7.1 测试矩阵

| 测试类型 | 工具 | 覆盖设备 | 通过标准 |
|----------|------|----------|----------|
| 功能回归 | 微信开发者工具 + 真机 | 体验版扫码 | 所有核心功能无异常 |
| 性能测试（Android） | 胶囊工具 / PerfDog | ≥3 款中端设备 | 帧率 ≥30fps，峰值内存 <500MB |
| 性能测试（iOS） | Xcode Instruments | iPhone 8 / XR / 13 | 帧率 ≥30fps，峰值内存 <900MB |
| 内存泄漏测试 | 堆快照对比（前后对比） | Android + iOS | 玩 30 分钟后内存无单调增长 |
| 网络异常测试 | 限速 / 断网模拟 | 真机 | 断网有提示；恢复后资源重新加载正常 |
| WebSocket 断线测试 | 飞行模式切换 + WiFi→4G 切换 | Android + iOS | 断线 3 次内重连成功，房间状态恢复正常 |
| 安全合规审查 | 人工审查 | 代码 Review | 无敏感 API 调用，无违规内容 |

### 7.2 上线前审核检查

| # | 待办事项 | 优先级 | 说明 |
|---|----------|--------|------|
| 92 | 游戏版号已获批（国内商业游戏必须） | 🔴 阻塞 | 无版号必被拒审 |
| 93 | 关闭微信开发者工具的"不校验合法域名"开关 | 🔴 阻塞 | |
| 94 | 所有图片/音频/文案不含违规内容，不存在未经授权的 IP 素材 | 🔴 阻塞 | |
| 95 | 隐私政策页面可正常访问，链接填写到小游戏基本信息中 | 🔴 阻塞 | |
| 96 | 首屏加载时间 <3s（弱网 4G 环境） | 🟠 高 | |
| 97 | 游戏类目、标签、简介与实际内容一致 | 🟠 高 | |
| 98 | 上传代码，提交"体验版"让测试团队完整回归一遍 | 🔴 阻塞 | |
| 99 | 确认体验版稳定后提交审核，准备好审核人员演示路径 | 🟠 高 | |

---

## 项目风险矩阵

| 风险项 | 影响程度 | 发生概率 | 应对策略 |
|--------|----------|----------|----------|
| Burst 缺失导致帧率不达标 | 严重 | 较高（80%） | 提前 P1 评估；为 WebGL 构建独立维护低复杂度算法分支；考虑减少场景规模 |
| iOS 内存 OOM 崩溃 | 严重 | 中（50%） | ASTC 纹理 + 及时 WXUnload + 分帧加载；iPhone 8 专项测试 |
| CDN 域名 ICP 备案拒绝/过期 | 高 | 低（20%） | 提前 3 个月准备；备选腾讯云 CDN（已备案） |
| async/await 改造遗漏导致线上崩溃 | 高 | 中（40%） | 建立静态代码扫描规则；完整覆盖 Task 关键字的单测 |
| 微信审核被拒（内容/版号） | 高 | 中（40%） | 提前准备版号；内容提前过合规自查清单 |
| iOS WebGL 2.0 渲染兼容性问题 | 中 | 中（50%） | iOS 15+ 实机优先测试；GPU Instancing 矩阵数 ≤32 |
| AB 加载内存溢出（泄漏） | 高 | 低（30%） | 所有加载代码 Code Review；Profiler 专项内存泄漏测试 |
| URP Deferred 路径黑屏 | 严重 | 确定（若未切换） | P1 强制确认渲染路径；为 WebGL 单独创建 Forward URP Asset |
| Shader 变体过多导致构建超时 | 高 | 中（50%） | P1 先跑一次构建统计变体数；启用 Shader Stripping + Variant Collection |
| WebSocket 迁移遗漏 UDP 帧同步路径 | 严重 | 较高（60%） | P1 全量排查 Socket 调用；UDP 帧同步需专项方案（降频或状态同步替代） |
| 移动端断线重连逻辑缺失导致大量用户投诉 | 高 | 较高（70%） | 上线前专项断网测试；实现指数退避重连 + WX.OnShow 主动重连 |
| 服务端未支持 WSS 导致线上连接失败 | 严重 | 中（40%） | P1 确认服务端 WebSocket 排期；TLS 证书与 wss:// 域名提前配置 |

---

## 参考资源

- 微信官方转换插件文档：<https://wechat-miniprogram.github.io/minigame-unity-webgl-transform/>
- UniTask GitHub：<https://github.com/Cysharp/UniTask>
- NativeWebSocket GitHub：<https://github.com/endel/NativeWebSocket>
- 微信开放文档：<https://developers.weixin.qq.com/minigame/dev/guide/>
