---
tags:
  - ET8/Unit
  - ET8/Player
---


> 本文深入分析 ET 框架中两个最核心的游戏业务实体 —— Player 和 Unit 的设计。它们分别代表了"账号/连接层面的玩家"和"游戏世界中的角色"，分布在不同的 Fiber 中，通过消息通信协作。

---

# 目录

- [一、Player 与 Unit 的关系概述](#一player-与-unit-的关系概述)
- [二、Player — 网关层的玩家代表](#二player--网关层的玩家代表)
- [三、Unit — 地图中的游戏实体](#三unit--地图中的游戏实体)
- [四、登录 → 进入地图完整流程](#四登录--进入地图完整流程)
- [五、Unit 的跨场景传送](#五unit-的跨场景传送)
- [六、消息路由 — 客户端 ↔ Gate ↔ Map](#六消息路由)
- [七、AOI 与视野管理](#七aoi-与视野管理)
- [八、数值组件设计](#八数值组件设计)
- [九、断线处理](#九断线处理)
- [十、客户端的 Unit 创建](#十客户端的-unit-创建)
- [十一、设计总结与知识点](#十一设计总结与知识点)

---

# 一、Player 与 Unit 的关系概述

## 1.1 为什么要分成两个对象？

在游戏服务器中，"玩家" 其实有两层含义：

| 层面 | 对应对象 | 所在位置 | 职责 |
|---|---|---|---|
| **连接/账号层** | Player | Gate Fiber | 管理客户端连接、账号信息、登录状态 |
| **游戏世界层** | Unit | Map Fiber | 管理角色位置、属性、战斗、移动等游戏逻辑 |

> **对前端的类比**：Player 相当于 "登录管理器"，Unit 相当于 "游戏角色的 GameObject"。你在游戏大厅时只有 Player，进入地图后才有 Unit。

## 1.2 核心设计：Player.Id == Unit.Id

ET 中一个关键设计：**Player 和 Unit 使用相同的 Id**。

```csharp
// Gate 中创建 Player
Player player = playerComponent.AddChild<Player, string>(account);
// player.Id = 自动生成的唯一 Id，假设是 10001

// Map 中创建 Unit
Unit unit = unitComponent.AddChildWithId<Unit, int>(player.Id, 1001);
// unit.Id = 10001 ← 与 Player 相同！
```

这使得通过一个 Id 就能同时找到 Gate 上的 Player 和 Map 上的 Unit，大大简化了消息路由。

## 1.3 组件结构全景图

```
Gate Scene
├── PlayerComponent (管理所有在线 Player)
│   └── Player (Account="test", Id=10001)
│       ├── PlayerSessionComponent → Session (持有客户端连接)
│       │   └── MailBoxComponent (GateSession) ← Location: GateSession
│       ├── GateMapComponent → 临时 GateMap Scene
│       └── MailBoxComponent (UnOrdered) ← Location: Player
├── GateSessionKeyComponent (LoginKey 临时管理)
└── Session (网络连接实体)
    └── SessionPlayerComponent → Player (反向引用)

Map Scene
├── UnitComponent (管理所有 Unit)
│   └── Unit (Id=10001, ConfigId=1001, Position, Rotation)
│       ├── MoveComponent (移动)
│       ├── NumericComponent (数值属性, ITransfer)
│       ├── PathfindingComponent (寻路)
│       ├── AOIEntity (视野管理)
│       └── MailBoxComponent (OrderedMessage) ← Location: Unit
└── AOIManagerComponent (全局 AOI 网格管理)
```

---

# 二、Player — 网关层的玩家代表

## 2.1 Player 实体

```csharp
[ChildOf(typeof(PlayerComponent))]
public sealed class Player : Entity, IAwake<string>
{
    public string Account { get; set; }
}
```

Player 极其简洁 —— 只有一个 `Account` 字段。它的主要价值在于**作为组件容器**，承载了多个重要组件。

## 2.2 PlayerComponent — 在线玩家管理器

```csharp
[ComponentOf(typeof(Scene))]
public class PlayerComponent : Entity, IAwake, IDestroy
{
    public Dictionary<string, EntityRef<Player>> dictionary = new();
}
```

挂在 Gate Scene 上，以 Account 为 key 管理所有在线 Player：

```csharp
public static void Add(this PlayerComponent self, Player player)
{
    self.dictionary.Add(player.Account, player);
}

public static Player GetByAccount(this PlayerComponent self, string account)
{
    self.dictionary.TryGetValue(account, out EntityRef<Player> playerRef);
    return playerRef;  // EntityRef 自动解引用
}

public static void Remove(this PlayerComponent self, Player player)
{
    self.dictionary.Remove(player.Account);
    player.Dispose();  // 移除时同时销毁 Player 及其所有组件
}
```

> **注意 `EntityRef<Player>`**：不直接持有 Player 引用，而是用 `EntityRef` 包装。这是一种安全引用模式 — 如果 Player 已被 Dispose，`EntityRef` 会自动返回 null，避免访问已销毁对象。

## 2.3 PlayerSessionComponent — 双向关联 Player ↔ Session

```csharp
[ComponentOf(typeof(Player))]
public class PlayerSessionComponent : Entity, IAwake
{
    private EntityRef<Session> session;
    
    public Session Session
    {
        get => this.session;
        set => this.session = value;
    }
}
```

**挂在 Player 上**，持有该 Player 当前的客户端 Session 引用。

**它还有一个关键子组件**：

```csharp
// 在登录时添加
playerSessionComponent.AddComponent<MailBoxComponent, MailBoxType>(MailBoxType.GateSession);
await playerSessionComponent.AddLocation(LocationType.GateSession);
```

`MailBoxType.GateSession` 是一种特殊的邮箱类型，其处理逻辑是：**收到消息后直接通过 Session 转发给客户端**：

```csharp
[Invoke((long)MailBoxType.GateSession)]
public class MailBoxType_GateSessionHandler : AInvokeHandler<MailBoxInvoker>
{
    public override void Handle(MailBoxInvoker args)
    {
        if (args.MailBoxComponent.Parent is PlayerSessionComponent psc)
        {
            psc.Session?.Send(args.MessageObject);
        }
    }
}
```

这实现了 **Map → Gate → 客户端** 的消息路由链。

## 2.4 SessionPlayerComponent — 反向引用

```csharp
[ComponentOf(typeof(Session))]
public class SessionPlayerComponent : Entity, IAwake, IDestroy
{
    private EntityRef<Player> player;
    public Player Player { get; set; }
}
```

**挂在 Session 上**，持有 Player 的引用。当 Session 断开连接时触发 Destroy：

```csharp
[EntitySystem]
private static void Destroy(this SessionPlayerComponent self)
{
    // Session 断开 → 通知 Map 上的 Unit
    self.Root().GetComponent<MessageLocationSenderComponent>()
        .Get(LocationType.Unit)
        .Send(self.Player.Id, G2M_SessionDisconnect.Create());
}
```

## 2.5 GateSessionKeyComponent — 登录 Key 管理

```csharp
[ComponentOf(typeof(Scene))]
public class GateSessionKeyComponent : Entity, IAwake
{
    public readonly Dictionary<long, string> sessionKey = new();
}
```

存储临时登录密钥（Key → Account 映射），20 秒超时自动清除：

```csharp
public static void Add(this GateSessionKeyComponent self, long key, string account)
{
    self.sessionKey.Add(key, account);
    self.TimeoutRemoveKey(key).Coroutine(); // 20秒后自动删除
}
```

## 2.6 GateMapComponent — 临时地图场景

```csharp
[ComponentOf(typeof(Player))]
public class GateMapComponent : Entity, IAwake
{
    public Scene Scene { get; set; }
}
```

在 Gate 上创建一个**临时的 Map Scene**，用于在进入地图前创建 Unit。这是一个非常精巧的设计 — 让"登录创建角色"和"跨场景传送"使用同一套逻辑（见第四章）。

---

# 三、Unit — 地图中的游戏实体

## 3.1 Unit 实体定义

```csharp
[ChildOf(typeof(UnitComponent))]
public partial class Unit : Entity, IAwake<int>
{
    public int ConfigId { get; set; }  // 配置表 Id（决定是什么怪、什么NPC等）

    [BsonElement]
    private float3 position;           // 可序列化的位置

    [BsonIgnore]
    public float3 Position             // 公开属性，setter 触发事件
    {
        get => this.position;
        set
        {
            float3 oldPos = this.position;
            this.position = value;
            EventSystem.Instance.Publish(this.Scene(), 
                new ChangePosition() { Unit = this, OldPos = oldPos });
        }
    }

    [BsonElement]
    private quaternion rotation;

    [BsonIgnore]
    public float3 Forward
    {
        get => math.mul(this.Rotation, math.forward());
        set => this.Rotation = quaternion.LookRotation(value, math.up());
    }

    [BsonIgnore]
    public quaternion Rotation
    {
        get => this.rotation;
        set
        {
            this.rotation = value;
            EventSystem.Instance.Publish(this.Scene(), 
                new ChangeRotation() { Unit = this });
        }
    }
}
```

**设计亮点**：

1. **事件驱动**：`Position` 和 `Rotation` 的 setter 自动发布事件。AOI 系统订阅 `ChangePosition` 来更新视野，客户端同步系统订阅来广播位置
2. **Bson 标注分离**：私有字段 `[BsonElement]` 参与存储，公开属性 `[BsonIgnore]` 不重复存储但有逻辑
3. **配置驱动**：`ConfigId` 关联配置表，通过 `unit.Config()` 获取 `UnitConfig`（类型、名称、模型等）

## 3.2 UnitType — 实体类型枚举

```csharp
public enum UnitType : byte
{
    Player = 1,   // 玩家
    Monster = 2,  // 怪物
    NPC = 3,      // NPC
}
```

Unit 是**通用的游戏实体**，不仅代表玩家角色，也代表怪物和 NPC。通过 ConfigId 区分：

```csharp
public static UnitType Type(this Unit self) => (UnitType)self.Config().Type;
```

## 3.3 UnitComponent — 地图上的实体管理器

```csharp
[ComponentOf(typeof(Scene))]
public class UnitComponent : Entity, IAwake, IDestroy { }
```

挂在 Map Scene 上，管理该地图中的所有 Unit。使用 Entity 的父子关系存储：

```csharp
public static void Add(this UnitComponent self, Unit unit) { }
public static Unit Get(this UnitComponent self, long id)
{
    return self.GetChild<Unit>(id);   // 利用 Entity 父子关系按 Id 查找
}
public static void Remove(this UnitComponent self, long id)
{
    Unit unit = self.GetChild<Unit>(id);
    unit?.Dispose();
}
```

## 3.4 Unit 的核心组件

### MoveComponent — 移动系统

```csharp
[ComponentOf(typeof(Unit))]
public class MoveComponent : Entity, IAwake, IDestroy
{
    public long BeginTime;          // 移动开始时间
    public float3 StartPos;         // 起始位置
    public long NeedTime;           // 移动总需时间
    public float Speed;             // 移动速度
    public List<float3> Targets;    // 路径点列表
    public int N;                   // 当前路径段索引
    public ETTask<bool> tcs;        // 异步等待完成
    public long MoveTimer;          // 定时器 Id
}
```

**核心 API**：

```csharp
// 异步移动到目标（返回是否到达）
ETTask<bool> MoveToAsync(List<float3> targets, float speed);

// 停止移动
void Stop(bool isArrive);

// 每帧前移（由定时器驱动，不是 UpdateSystem）
void MoveForward(bool ret);
```

**设计要点**：移动不是靠 `UpdateSystem` 每帧计算的，而是通过 `TimerComponent` 的重复定时器驱动。这避免了在没有移动的 Unit 上浪费每帧 CPU。

### NumericComponent — 数值属性系统

```csharp
[ComponentOf(typeof(Unit))]
public class NumericComponent : Entity, IAwake, ITransfer  // ITransfer: 传送时携带
{
    [BsonDictionaryOptions(DictionaryRepresentation.ArrayOfArrays)]
    public Dictionary<int, long> NumericDic = new();
}
```

**五维数值公式**：

$$\text{final} = \left(\left(\text{base} + \text{add}\right) \times \frac{100 + \text{pct}}{100}\right) \times \frac{100 + \text{finalPct}}{100} + \text{finalAdd}$$

每个属性值由 5 个子值组成：

| NumericType | 计算 | 示例（Speed = 1000） |
|---|---|---|
| `Base` (1000 × 10 + 1) | 基础值 | `SpeedBase = 10001` |
| `Add` (1000 × 10 + 2) | 加法加成 | `SpeedAdd = 10002` |
| `Pct` (1000 × 10 + 3) | 百分比加成 | `SpeedPct = 10003` |
| `FinalAdd` (1000 × 10 + 4) | 最终加法 | `SpeedFinalAdd = 10004` |
| `FinalPct` (1000 × 10 + 5) | 最终百分比 | `SpeedFinalPct = 10005` |
| **最终值** (1000) | 自动计算 | `Speed = 1000` |

```csharp
// 设置基础速度
numericComponent.Set(NumericType.SpeedBase, 6000);  // 6米/秒（整数存储，1000=1）

// 增加 20% 速度 buff
numericComponent.Set(NumericType.SpeedPct, 20);     // +20%

// 最终速度自动计算：6000 * (100+20)/100 = 7200
long finalSpeed = numericComponent.Get(NumericType.Speed);  // 7200
```

设置子属性时会自动重新计算最终值，并发布 `NumbericChange` 事件通知相关系统。

### AOIEntity — 视野管理组件（服务端专属）

```csharp
[ComponentOf(typeof(Unit))]
public class AOIEntity : Entity, IAwake<int, float3>, IDestroy
{
    public Unit Unit => this.GetParent<Unit>();
    public int ViewDistance;                              // 视野距离
    public Cell Cell { get; set; }                       // 所在网格
    public Dictionary<long, EntityRef<AOIEntity>> SeeUnits;      // 我看得见的
    public Dictionary<long, EntityRef<AOIEntity>> BeSeeUnits;     // 看见我的
    public Dictionary<long, EntityRef<AOIEntity>> SeePlayers;     // 我看得见的玩家
    public Dictionary<long, EntityRef<AOIEntity>> BeSeePlayers;   // 看见我的玩家
}
```

> **`SeePlayers` vs `BeSeePlayers`**：`SeePlayers` 是"我能看到哪些玩家"，`BeSeePlayers` 是"哪些玩家能看到我"。广播消息时（如怪物移动），需要通知 `BeSeePlayers` 中的所有玩家。

### PathfindingComponent — 寻路组件

```csharp
[ComponentOf(typeof(Unit))]
public class PathfindingComponent : Entity, IAwake<string>, IDestroy
{
    public string Name;            // 地图名（加载对应的导航网格）
    public DtNavMesh navMesh;      // Recast 导航网格
    public DtNavMeshQuery query;   // 寻路查询对象
}
```

基于 Recast/Detour 的服务端寻路。

### MailBoxComponent — 使 Unit 成为 Actor

```csharp
unit.AddComponent<MailBoxComponent, MailBoxType>(MailBoxType.OrderedMessage);
```

这是 Unit 能接收内部消息的关键。`OrderedMessage` 类型保证消息串行处理，避免并发修改 Unit 状态。

---

# 四、登录 → 进入地图完整流程

## 阶段一：客户端 → Realm（登录验证）

```csharp
// C2R_LoginHandler (Realm Fiber)
protected override async ETTask Run(Session session, C2R_Login request, R2C_Login response)
{
    // 1. 验证账号密码（此处简化，实际可查数据库）
    
    // 2. 根据 Account 哈希选择一个 Gate
    StartSceneConfig gateConfig = RealmGateAddressHelper.GetGate(session.Zone(), request.Account);
    
    // 3. 向 Gate 请求临时 LoginKey
    G2R_GetLoginKey g2r = await MessageSender.Call(gateConfig.ActorId, 
        new R2G_GetLoginKey { Account = request.Account });

    // 4. 返回 Gate 地址和 Key 给客户端
    response.Address = gateConfig.InnerIPPort.ToString();
    response.Key = g2r.Key;
    
    // 5. 1秒后关闭 Realm Session（验证完成，不再需要）
    CloseSession(session).Coroutine();
}
```

**要点**：Realm 只负责验证，不维护长连接。验证通过后客户端切换到 Gate。

## 阶段二：客户端 → Gate（登录网关）

```csharp
// C2G_LoginGateHandler (Gate Fiber)
protected override async ETTask Run(Session session, C2G_LoginGate request, G2C_LoginGate response)
{
    // 1. 验证 Key
    string account = root.GetComponent<GateSessionKeyComponent>().Get(request.Key);
    if (account == null) { response.Error = ErrorCode.ERR_ConnectGateKeyError; return; }

    // 2. 创建 Player
    Player player = playerComponent.AddChild<Player, string>(account);
    playerComponent.Add(player);

    // 3. 给 Player 添加组件
    // PlayerSessionComponent 持有 Session 引用，其子组件 MailBox(GateSession) 负责转发消息给客户端
    PlayerSessionComponent psc = player.AddComponent<PlayerSessionComponent>();
    psc.AddComponent<MailBoxComponent, MailBoxType>(MailBoxType.GateSession);
    await psc.AddLocation(LocationType.GateSession);  // 注册到 Location Server

    // Player 自身也是 Actor，用于接收服务器间消息
    player.AddComponent<MailBoxComponent, MailBoxType>(MailBoxType.UnOrderedMessage);
    await player.AddLocation(LocationType.Player);

    // 4. Session ↔ Player 双向关联
    session.AddComponent<SessionPlayerComponent>().Player = player;
    psc.Session = session;

    response.PlayerId = player.Id;
}
```

**登录后的 Location 注册**：

| Location 类型 | 注册的 Entity | 用途 |
|---|---|---|
| `LocationType.Player` | Player | 服务器间向 Player 发消息 |
| `LocationType.GateSession` | PlayerSessionComponent | Map → Gate → 客户端 的消息路由 |
| `LocationType.Unit`（后续） | Unit | 向地图中的 Unit 发消息 |

## 阶段三：客户端 → Gate（进入地图）

```csharp
// C2G_EnterMapHandler (Gate Fiber)
protected override async ETTask Run(Session session, C2G_EnterMap request, G2C_EnterMap response)
{
    Player player = session.GetComponent<SessionPlayerComponent>().Player;

    // 1. 在 Gate 上创建临时 GateMap Scene
    GateMapComponent gateMapComponent = player.AddComponent<GateMapComponent>();
    gateMapComponent.Scene = await GateMapFactory.Create(gateMapComponent, player.Id, ...);

    // 2. 在临时 Scene 中创建 Unit
    Unit unit = UnitFactory.Create(scene, player.Id, UnitType.Player);

    // 3. 等到帧末尾，将 Unit 传送到真正的 Map
    TransferHelper.TransferAtFrameFinish(unit, mapActorId, mapName).Coroutine();
}
```

## 阶段四：UnitFactory — 创建 Unit

```csharp
// UnitFactory.Create (服务端)
public static Unit Create(Scene scene, long id, UnitType unitType)
{
    UnitComponent unitComponent = scene.GetComponent<UnitComponent>();
    
    switch (unitType)
    {
        case UnitType.Player:
        {
            // 注意：Id = Player.Id（使用 AddChildWithId）
            Unit unit = unitComponent.AddChildWithId<Unit, int>(id, 1001);
            
            unit.AddComponent<MoveComponent>();
            unit.Position = new float3(-10, 0, -10);  // 初始位置
            
            NumericComponent nc = unit.AddComponent<NumericComponent>();
            nc.Set(NumericType.Speed, 6f);      // 移动速度 6m/s
            nc.Set(NumericType.AOI, 15000);     // AOI 视野 15m
            
            unitComponent.Add(unit);
            
            // 加入 AOI 系统
            unit.AddComponent<AOIEntity, int, float3>(9 * 1000, unit.Position);
            
            return unit;
        }
    }
}
```

## 为什么先在 Gate 创建 Unit 再传送？

这是 ET 一个非常精巧的设计：

```
方案 A（传统做法）：
  登录 → Gate 直接通知 Map "创建 Unit" → Map 创建
  传送 → Map A 通知 Map B "创建 Unit" → Map B 创建
  ↑ 两套不同的创建逻辑

方案 B（ET 的做法）：
  登录 → Gate 创建临时 Unit → 传送到 Map（使用传送逻辑）
  传送 → Map A 的 Unit → 传送到 Map B（使用同一套传送逻辑）
  ↑ 统一的传送逻辑，登录只是"从 Gate 传送到 Map"
```

**好处**：登录和传送共用一套代码，减少重复逻辑，降低 bug 风险。

---

## 五、Unit 的跨场景传送

## 5.1 TransferHelper 核心逻辑

```csharp
public static async ETTask Transfer(Unit unit, ActorId sceneInstanceId, string sceneName)
{
    // 1. 序列化 Unit 本体
    M2M_UnitTransferRequest request = M2M_UnitTransferRequest.Create();
    request.Unit = unit.ToBson();
    
    // 2. 序列化所有 ITransfer 组件
    foreach (Entity entity in unit.Components.Values)
    {
        if (entity is ITransfer)
            request.Entitys.Add(entity.ToBson());
    }
    
    // 3. 销毁本地 Unit
    unit.Dispose();
    
    // 4. Location 加锁 → 发送到目标 → 目标解锁
    await LocationProxy.Lock(LocationType.Unit, unitId, oldActorId);
    await MessageSender.Call(sceneInstanceId, request);
}
```

## 5.2 目标 Map 接收 Unit

```csharp
// M2M_UnitTransferRequestHandler
protected override async ETTask Run(Scene scene, M2M_UnitTransferRequest request, ...)
{
    // 1. 反序列化 Unit
    Unit unit = MongoHelper.Deserialize<Unit>(request.Unit);
    unitComponent.AddChild(unit);
    unitComponent.Add(unit);

    // 2. 恢复 ITransfer 组件（如 NumericComponent）
    foreach (byte[] bytes in request.Entitys)
    {
        Entity entity = MongoHelper.Deserialize<Entity>(bytes);
        unit.AddComponent(entity);
    }

    // 3. 重建不可传送的组件
    unit.AddComponent<MoveComponent>();                    // 新的移动组件
    unit.AddComponent<PathfindingComponent, string>(scene.Name); // 新地图的寻路
    unit.AddComponent<MailBoxComponent, MailBoxType>(MailBoxType.OrderedMessage); // 重新成为 Actor

    // 4. 通知客户端
    MapMessageHelper.SendToClient(unit, new M2C_StartSceneChange { ... });
    MapMessageHelper.SendToClient(unit, new M2C_CreateUnits { ... });

    // 5. 加入 AOI
    unit.AddComponent<AOIEntity, int, float3>(9 * 1000, unit.Position);

    // 6. 解锁 Location（更新映射到新地址）
    await LocationProxy.UnLock(LocationType.Unit, unit.Id, 
        request.OldActorId, unit.GetActorId());
}
```

## 5.3 哪些组件参与传送？

| 组件 | 是否传送 | 原因 |
|---|---|---|
| Unit 自身 | **是** | 包含 Id、Position、Rotation 等核心数据 |
| NumericComponent | **是**（ITransfer） | 数值属性必须保持 |
| MoveComponent | **否** | 新场景重建，旧的移动状态无意义 |
| PathfindingComponent | **否** | 依赖新地图的导航网格 |
| AOIEntity | **否** | 依赖新场景的 AOI 网格 |
| MailBoxComponent | **否** | 重建后获得新的 InstanceId，Location 重新注册 |

---

# 六、消息路由

## 6.1 客户端 → Map（通过 Gate 中转）

```
客户端发送 ILocationMessage / ILocationRequest
    ↓
Gate 的 NetComponent 收到消息
    ↓
Gate 判断消息类型
    ↓ 是 ILocationMessage / ILocationRequest
Gate 通过 MessageLocationSender 发送:
    unitId = session.GetComponent<SessionPlayerComponent>().Player.Id
    MessageLocationSender.Send(LocationType.Unit, unitId, message)
    ↓
Location Server 查询 unitId 的 ActorId
    ↓
消息路由到 Map Fiber → Unit 的 MailBox → Handler
```

核心代码（Gate 消息路由逻辑）：

```csharp
// Gate 的消息读取处理器
case ILocationMessage actorLocationMessage:
{
    long unitId = session.GetComponent<SessionPlayerComponent>().Player.Id;
    root.GetComponent<MessageLocationSenderComponent>()
        .Get(LocationType.Unit)
        .Send(unitId, actorLocationMessage);
    break;
}
```

## 6.2 Map → 客户端（通过 Gate 中转）

```
Map 上的逻辑需要通知客户端（如怪物移动）
    ↓
MapMessageHelper.SendToClient(unit, message)
    ↓
MessageLocationSender.Send(LocationType.GateSession, unit.Id, message)
    ↓
Location Server 查找 unit.Id 的 GateSession 位置
    ↓
消息路由到 Gate Fiber → PlayerSessionComponent 的 MailBox (GateSession 类型)
    ↓
MailBoxType_GateSessionHandler 处理:
    playerSessionComponent.Session.Send(message)  // 通过网络发给客户端
```

## 6.3 消息路由总结

```
客户端 → Gate → [Location查询Unit] → Map Unit
   ↑                                      |
   └── Gate ← [Location查询GateSession] ←─┘
```

**三种 Location 类型的作用**：

| LocationType | Entity | 注册位置 | 用途 |
|---|---|---|---|
| `Unit` | Unit (Map) | Map Fiber | 客户端/服务器 → Unit |
| `GateSession` | PlayerSessionComponent (Gate) | Gate Fiber | Map → 客户端 |
| `Player` | Player (Gate) | Gate Fiber | 服务器 → Player |

---

# 七、AOI 与视野管理

## 7.1 基本原理

AOI（Area of Interest）通过**网格划分**实现高效的视野管理：

```
地图被划分为 9m × 9m 的网格 (Cell)

┌────┬────┬────┬────┐
│ C1 │ C2 │ C3 │ C4 │
├────┼────┼────┼────┤
│ C5 │ C6 │ C7 │ C8 │  玩家A在C6，视野覆盖C1-C11的九宫格
├────┼────┼────┼────┤
│ C9 │C10 │C11 │C12 │
└────┴────┴────┴────┘
```

## 7.2 AOIEntity 的四组字典

```csharp
SeeUnits       // 我能看见的所有 Unit（包含怪物、NPC）
BeSeeUnits     // 能看见我的所有 Unit
SeePlayers     // 我能看见的玩家 Unit
BeSeePlayers   // 能看见我的玩家 Unit
```

为什么区分 Players 和 Units？
- **广播优化**：怪物移动只需通知 `BeSeePlayers`（能看见它的玩家），不需要通知其他怪物
- **下发优化**：只有 Player 类型的 Unit 需要接收视野数据

## 7.3 事件触发链

```
Unit.Position 变化
  → 发布 ChangePosition 事件
    → ChangePosition_NotifyAOI 订阅者
      → AOI 系统检查是否跨越 Cell 边界
        → 如果跨越: 重新计算九宫格
          → 新进入视野: 发布 UnitEnterSightRange 事件
            → UnitEnterSightRange_NotifyClient
              → MapMessageHelper.NoticeUnitAdd(玩家, 新Unit)
          → 离开视野: 发布 UnitLeaveSightRange 事件
            → UnitLeaveSightRange_NotifyClient
              → MapMessageHelper.NoticeUnitRemove(玩家, 旧Unit)
```

## 7.4 广播消息

```csharp
public static void Broadcast(Unit unit, IMessage message)
{
    // 获取所有能看见我的玩家
    Dictionary<long, EntityRef<AOIEntity>> dict = unit.GetBeSeePlayers();
    foreach (AOIEntity u in dict.Values)
    {
        // 通过 Location 路由给每个观察者的客户端
        locationSender.Send(u.Unit.Id, message);
    }
}
```

---

# 八、数值组件设计

## 8.1 为什么用 Dictionary<int, long>？

```csharp
public Dictionary<int, long> NumericDic = new();
```

- **int key**：数值类型编号（如 Speed=1000, Hp=1001）
- **long value**：用整数存储，避免浮点精度问题（1000 = 1.0）

### 8.2 五维计算公式

每个属性有 5 个子值（Base/Add/Pct/FinalAdd/FinalPct），修改任一子值都会自动重新计算最终值：

```csharp
public static void Update(this NumericComponent self, int numericType)
{
    int final = numericType / 10;         // 最终值类型 (如 Speed = 1000/10 = 100... 实际是1000)
    int sub = numericType % 10;           // 子类型编号
    
    long bas = self.GetByKey(final * 10 + 1);     // Base
    long add = self.GetByKey(final * 10 + 2);     // Add
    long pct = self.GetByKey(final * 10 + 3);     // Pct
    long finalAdd = self.GetByKey(final * 10 + 4); // FinalAdd
    long finalPct = self.GetByKey(final * 10 + 5); // FinalPct
    
    long result = (long)((bas + add) * (100 + pct) / 100f * (100 + finalPct) / 100f) + finalAdd;
    
    self.Set(final, result);  // 设置最终值
}
```

### 8.3 适用场景

这个设计非常适合 **RPG / MMORPG 类游戏** 的属性系统：

```
基础攻击力 = 100 (Base)
装备加成   = +50 (Add)
技能 buff  = +20% (Pct)
光环加成   = +10 (FinalAdd)
全局减益   = -5% (FinalPct)

最终攻击力 = ((100 + 50) * (100 + 20) / 100) * (100 - 5) / 100 + 10
           = (150 * 120 / 100) * 95 / 100 + 10
           = 180 * 0.95 + 10
           = 171 + 10 = 181
```

---

## 九、断线处理

```
客户端断开连接
    ↓
Gate: Session 销毁
    → SessionPlayerComponent.Destroy 触发
      → MessageLocationSender.Send(LocationType.Unit, player.Id, G2M_SessionDisconnect)
    ↓
Map: G2M_SessionDisconnectHandler 处理
    → 可在此保存数据、启动断线重连计时器、或直接销毁 Unit
```

当前 ET Demo 中断线处理器是空实现，开发者可以在此添加：
- 保存玩家数据到 MongoDB
- 设置断线重连超时（如 5 分钟内可重连）
- 超时后销毁 Unit 并移除 Location 注册

---

## 十、客户端的 Unit 创建

当服务器通知客户端创建 Unit 时（如进入视野、切换场景）：

```csharp
// 客户端 UnitFactory.Create
public static Unit Create(Scene currentScene, UnitInfo unitInfo)
{
    UnitComponent uc = currentScene.GetComponent<UnitComponent>();
    
    // 创建 Unit（Id = 服务器的 Unit.Id）
    Unit unit = uc.AddChildWithId<Unit, int>(unitInfo.UnitId, unitInfo.ConfigId);
    unit.Position = unitInfo.Position;
    unit.Forward = unitInfo.Forward;
    
    // 恢复数值属性
    NumericComponent nc = unit.AddComponent<NumericComponent>();
    foreach (var kv in unitInfo.KV)
        nc.Set(kv.Key, kv.Value);
    
    // 添加客户端组件
    unit.AddComponent<MoveComponent>();
    unit.AddComponent<ObjectWait>();
    
    // 发布事件 → View 层创建 GameObject 和动画
    EventSystem.Instance.Publish(unit.Scene(), new AfterUnitCreate() { Unit = unit });
    
    return unit;
}
```

**UnitInfo 数据结构**（服务端构建，通过网络发送）：

```csharp
static UnitInfo CreateUnitInfo(Unit unit)
{
    UnitInfo info = new UnitInfo();
    info.UnitId = unit.Id;
    info.ConfigId = unit.ConfigId;
    info.Type = (int)unit.Type();
    info.Position = unit.Position;
    info.Forward = unit.Forward;
    
    // NumericComponent 的所有数值
    foreach (var kv in unit.GetComponent<NumericComponent>().NumericDic)
        info.KV.Add(kv.Key, kv.Value);
    
    // 如果正在移动，附带移动路径信息
    if (unit.GetComponent<MoveComponent>()?.IsMoving)
        info.MoveInfo = /* 路径点数据 */;
    
    return info;
}
```

**便捷方法获取自己的 Unit**：

```csharp
public static Unit GetMyUnitFromClientScene(Scene root)
{
    long myId = root.GetComponent<PlayerComponent>().MyId;
    Scene currentScene = root.GetComponent<CurrentScenesComponent>().Scene;
    return currentScene.GetComponent<UnitComponent>().Get(myId);
}
```

---

## 十一、设计总结与知识点

### 11.1 核心设计原则

| 原则 | 体现 |
|---|---|
| **关注点分离** | Player 管连接，Unit 管游戏逻辑，各在自己的 Fiber |
| **Id 统一** | Player.Id == Unit.Id，简化跨服务消息路由 |
| **组件化** | Unit 的能力由组件决定，按需组装 |
| **事件驱动** | Position 变化自动触发 AOI、同步等链式反应 |
| **传送即序列化** | ITransfer 标记决定哪些组件跟着传送 |
| **登录即传送** | Gate 创建临时 Unit 再传送到 Map，复用传送逻辑 |

### 11.2 Player 和 Unit 的生命周期对比

```
Player          Unit
  |               |
  | 登录 Gate      |
  |←─创建─→       |
  |               |
  | 进入地图       |
  |           创建(Gate临时)
  |           传送到Map─→|
  |               |      |
  |               | (在Map运行)
  |               |      |
  | 传送地图       |      |
  |           序列化──→销毁
  |           反序列化──→新Map创建
  |               |      |
  | 断线          |      |
  |           收到通知──→保存/销毁
  |←─销毁─→       |
```

### 11.3 关键 Location 注册时机

| 事件 | Location 操作 |
|---|---|
| 登录 Gate | `AddLocation(Player)`, `AddLocation(GateSession)` |
| 传送到 Map | `Lock(Unit)` → 传送 → `UnLock(Unit, newActorId)` |
| 跨 Map 传送 | 同上 |
| 下线 | `RemoveLocation(Player)`, `RemoveLocation(GateSession)`, `RemoveLocation(Unit)` |

### 11.4 前端程序员需要了解的关键差异

| 前端概念 | 服务端对应 |
|---|---|
| `GameObject.AddComponent<T>()` | `entity.AddComponent<T>()` — 几乎一样 |
| `transform.position = pos` | `unit.Position = pos` — setter 触发事件 |
| 用 Unity 消息发送位置 | 通过 AOI `Broadcast` 只发给看得见的玩家 |
| 客户端直接创建角色 | 服务端 `UnitFactory.Create` 后通知客户端创建 |
| 客户端移动是每帧计算 | 服务端移动是定时器驱动 |
| 切换 Unity Scene | 服务端 TransferHelper 序列化 → 销毁 → 目标反序列化 → 重建 |
