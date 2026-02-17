---
tags:
  - ET8
  - ET8/网络框架/Actor模型
---
# 一、设计思路

ET 的 Actor 模型围绕一个核心问题展开：**在多纤程（Fiber）、多进程的分布式架构中，如何让业务代码像调用本地方法一样简单地进行跨纤程、跨进程通信？**

其解法是构建三层抽象：

```
业务层      统一接口（MessageSender / ClientSenderComponent）
               │  对业务透明，不关心目标在哪
路由层      自动判断 同纤程 / 跨纤程 / 跨进程，选择投递路径
               │
传输层      MessageQueue（进程内）/ ProcessOuterSender + TCP/KCP（跨进程）
```

---

# 二、Actor

## Actor的三级寻址

每个 Actor 通过 `ActorId` 唯一标识，结构为三级寻址：

- 
- 
- 
- 

|层级|含义|作用|
|---|---|---|
|**Process**|目标所在的操作系统进程|决定走本地投递还是网络传输|
|**Fiber**|进程内的逻辑纤程|决定投递到哪个消息队列|
|**InstanceId**|纤程内挂有 `MailBoxComponent` 的 Entity|最终定位到具体的 Actor 实体|

获取一个 Entity 的 ActorId 非常简单（见 [Fiber.cs](vscode-file://vscode-app/c:/Program%20Files/Microsoft%20VS%20Code/c3a26841a8/resources/app/out/vs/code/electron-browser/workbench/workbench.html)）：

- 
- 
- 
- 

---

### 二、


# 二、六个关键设计点

**1. 三级寻址 ActorId = Process + Fiber + InstanceId**

- 用一个结构体精确定位到"哪个进程、哪个纤程、哪个实体"
- 路由决策只需比较 `Process` 是否相同，即可决定走本地队列还是网络传输

**2. MessageQueue：纤程间通信的无锁中枢**

- 全局单例，每个 Fiber 一个 `ConcurrentQueue`
- 发送方塞入，接收方每帧 `Fetch` 拉取——**生产者随意投递，消费者单线程处理**
- 这个设计让纤程内的业务代码完全不需要加锁，天然线程安全

**3. MailBoxComponent：将 Entity 变成 Actor 的标记**

- 挂上此组件 = 注册为可寻址的 Actor
- 通过 `MailBoxType` 策略分发：有序（协程锁）、无序（高吞吐）、网关转发（GateSession）
- 没有它的 Entity 无法被 Actor 消息找到（返回 `ERR_NotFoundActor`）

**4. 二次封装消息，隔离网络与业务**

| 场景 | 包装消息 | 作用 |
|------|---------|------|
| 客户端 Main ↔ NetClient Fiber | `A2NetClient_Request/Response` | 隔离业务线程与网络IO线程 |
| 服务器 业务Fiber ↔ NetInner Fiber | `A2NetInner_Message/Request/Response` | 隔离业务逻辑与跨进程传输 |

业务代码只关心原始的 `IRequest/IResponse`，包装和解包由框架自动完成。

**5. async/await 风格的 Actor RPC**

- `Call()` 发送请求时注册 RpcId + 超时协程（40s）
- 收到 `IResponse` 时按 RpcId 匹配，`SetResult()` 唤醒 ETTask
- 业务代码写法：`var response = await MessageSender.Call(actorId, request);`
- **把经典 Actor 的异步回调模式，升级为 C# 原生的 async/await 体验**

**6. 统一路由，位置透明**

- `MessageSender`（服务器）和 `ClientSenderComponent`（客户端）封装了全部路由逻辑
- 同进程 → `ProcessInnerSender` → `MessageQueue` 直投
- 跨进程 → 包装为 `A2NetInner_*` → `MessageQueue` → NetInner Fiber → `ProcessOuterSender` → TCP/KCP
- **业务代码只需要一个 ActorId，框架自动选择最优路径**

---

# 三、整体架构一图流

```
                        ┌─ Process 1 ─────────────────────────────┐
                        │                                          │
 客户端                  │   Fiber A (业务)    Fiber B (业务)        │
 Main Fiber ◄──────►   │     ▲      │          ▲                  │
    │  A2NetClient_*     │     │      │          │                  │
    ▼                    │     └──MessageQueue───┘                  │
 NetClient Fiber         │              │                           │
    │  Session(KCP)      │     NetInner Fiber                      │
    ▼                    │   ProcessOuterSender                    │
  服务器 ◄──────────────│     │  TCP Session                      │
                        │     ▼                                    │
                        └─────┼────────────────────────────────────┘
                              │  TCP/KCP
                        ┌─────┼── Process 2 ──────────────────────┐
                        │     ▼                                    │
                        │   NetInner Fiber                         │
                        │   ProcessOuterSender.OnRead()            │
                        │     │ ProcessInnerSender                 │
                        │     ▼                                    │
                        │   MessageQueue → 目标 Fiber              │
                        │                    │                     │
                        │              MailBoxComponent             │
                        │                    │                     │
                        │              业务 Handler                │
                        └──────────────────────────────────────────┘
```

---

# 四、一句话概括

> ET 的 Actor 模型 = **ActorId 三级寻址** + **MessageQueue 无锁队列** + **MailBoxComponent 信箱标记** + **二次封装位置透明** + **async/await RPC**，让开发者用同步思维写分布式代码。

```cardlink
url: https://github.com/egametang/ET/blob/release8.1/Book/5.4Actor%E6%A8%A1%E5%9E%8B.md
title: "ET/Book/5.4Actor模型.md at release8.1 · egametang/ET"
description: "Unity3D Client And C# Server Framework. Contribute to egametang/ET development by creating an account on GitHub."
host: github.com
favicon: https://github.githubassets.com/favicons/favicon.svg
image: https://opengraph.githubassets.com/51900eb35a4d441be22e6c7486f0b7cce5c94b385ea2cfcb0ccd4f81fa0c2a6e/egametang/ET
```

```cardlink
url: https://github.com/egametang/ET/blob/release8.1/Book/5.5Actor%20Location-ZH.md
title: "ET/Book/5.5Actor Location-ZH.md at release8.1 · egametang/ET"
description: "Unity3D Client And C# Server Framework. Contribute to egametang/ET development by creating an account on GitHub."
host: github.com
favicon: https://github.githubassets.com/favicons/favicon.svg
image: https://opengraph.githubassets.com/51900eb35a4d441be22e6c7486f0b7cce5c94b385ea2cfcb0ccd4f81fa0c2a6e/egametang/ET
```
