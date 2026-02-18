---
tags:
  - ET8/MongoDB
  - ET8/数据库
---


> 本文深入分析 ET 框架中"直接存储 Entity 对象"这一核心设计，以及围绕它构建的数据库访问层、序列化机制和缓存策略。

---

# 目录

- [一、设计总览 — Entity 就是数据库文档](#一设计总览)
- [二、为什么选择 MongoDB](#二为什么选择-mongodb)
- [三、数据库访问层](#三数据库访问层)
- [四、Entity 序列化机制（核心重点）](#四entity-序列化机制)
- [五、ISerializeToEntity — 精确控制持久化范围](#五iserializetoentity)
- [六、ITransfer — 跨场景传送的序列化](#六itransfer)
- [七、Serialize / Deserialize System — 自定义钩子](#七serialize--deserialize-system)
- [八、"Entity 树即缓存"的设计哲学](#八entity-树即缓存的设计哲学)
- [九、协程锁保证数据一致性](#九协程锁保证数据一致性)
- [十、与传统游戏服务器数据架构的对比](#十与传统游戏服务器数据架构的对比)

---

# 一、设计总览

ET 框架中最具特色的数据设计是：**Entity 对象可以直接存到 MongoDB，也可以直接从 MongoDB 读回来**。不需要 ORM 映射，不需要 DAO 层，Entity 本身就是数据库文档。

```
┌──────── 内存 ────────┐       ┌──── MongoDB ────┐
│ Player (Entity)       │       │ Collection:      │
│   Id: 10001           │ ←──→  │ "ET.Server.Player"|
│   Account: "test"     │ Save  │ { _id: 10001,    │
│   componentsDB: [     │ Query │   Account: "test",│
│     BagComponent,     │       │   C: [...],       │
│     ...               │       │   Children: [...] │
│   ]                   │       │ }                 │
└───────────────────────┘       └──────────────────┘
```

**这是怎么做到的？** Entity 基类通过 MongoDB.Bson 的标注（`[BsonId]`、`[BsonElement]`、`[BsonIgnore]`）以及 .NET 标准接口 `ISupportInitialize`，在序列化/反序列化时自动完成运行时数据结构和存储格式之间的转换。

---

# 二、为什么选择 MongoDB

| 特性 | 对游戏开发的意义 |
|---|---|
| **Schema-free（无模式）** | 游戏迭代快，频繁增删字段。MongoDB 不需要 ALTER TABLE，直接存就行 |
| **BSON 格式** | 与 ET 的 Entity 序列化天然兼容，Entity 的 `ToBson()` 直接就是 BSON |
| **文档模型** | 一个玩家的所有数据（背包、属性、任务...）存为一个文档，一次读写完成 |
| **高性能写入** | 游戏需要频繁自动保存，MongoDB 的写入性能优秀 |
| **多态序列化** | MongoDB.Bson 库支持继承多态，Entity 的不同子类可以存在同一个 Collection 中 |

> **对比关系型数据库**：如果用 MySQL，每个组件要单独建表、写 SQL、做 JOIN 查询。ET 的 "Entity = 文档" 设计让这些全部消失了。

---

# 三、数据库访问层

## 3.1 层次结构

```
Scene (Root)
└── DBManagerComponent (组件，挂在 Scene 上)
    ├── DBComponent (子实体，Id = Zone 1)
    │   ├── MongoClient
    │   └── IMongoDatabase
    ├── DBComponent (子实体，Id = Zone 2)
    │   ├── MongoClient
    │   └── IMongoDatabase
    └── ...
```

## 3.2 DBManagerComponent — 按区服管理连接

```csharp
[ComponentOf(typeof(Scene))]
public class DBManagerComponent : Entity, IAwake { }
```

核心方法 `GetZoneDB(zone)` 实现了**懒加载**：

```csharp
public static DBComponent GetZoneDB(this DBManagerComponent self, int zone)
{
    DBComponent dbComponent = self.GetChild<DBComponent>(zone);
    if (dbComponent != null) return dbComponent;  // 已创建直接复用
    
    // 首次访问：从配置读取连接串，创建 DBComponent
    StartZoneConfig config = StartZoneConfigCategory.Instance.Get(zone);
    dbComponent = self.AddChildWithId<DBComponent, string, string>(
        zone, config.DBConnection, config.DBName);
    return dbComponent;
}
```

**巧妙之处**：`DBComponent` 的 `Id` = `zone` 编号，直接利用 Entity 父子关系的 `GetChild<T>(id)` 来按 zone 索引，不需要额外的字典。

## 3.3 DBComponent — 完整的 CRUD API

```csharp
[ChildOf(typeof(DBManagerComponent))]
public class DBComponent : Entity, IAwake<string, string>
{
    public const int TaskCount = 32;  // 协程锁分桶数
    public MongoClient mongoClient;
    public IMongoDatabase database;
}
```

**API 一览**：

| 方法 | 签名 | 说明 |
|---|---|---|
| **Query** | `Query<T>(long id)` | 按 Id 查询单个 Entity |
| **Query** | `Query<T>(Expression<Func<T,bool>> filter)` | Lambda 表达式条件查询 |
| **QueryJson** | `QueryJson<T>(string json)` | JSON 格式条件查询 |
| **Save** | `Save<T>(T entity)` | **Upsert**：存在则替换，不存在则插入 |
| **SaveNotWait** | `SaveNotWait<T>(T entity, long taskId)` | Save 的非阻塞版本 |
| **InsertBatch** | `InsertBatch<T>(IEnumerable<T> list)` | 批量插入 |
| **Remove** | `Remove<T>(long id)` | 按 Id 删除 |
| **Remove** | `Remove<T>(Expression<Func<T,bool>> filter)` | 按条件删除 |

**使用示例**：

```csharp
// 直接存一个 Entity 对象
Player player = ...; // 内存中的 Player 实体
await dbComponent.Save(player);  // 整个 Entity 树序列化到 MongoDB

// 直接读回一个 Entity 对象
Player loaded = await dbComponent.Query<Player>(playerId);
// loaded 就是一个完整的 Player 实体，可以直接 AddChild 到场景中使用
```

## 3.4 Collection 命名策略

```csharp
private static IMongoCollection<T> GetCollection<T>(this DBComponent self, string collection = null)
{
    return self.database.GetCollection<T>(collection ?? typeof(T).FullName);
}
```

默认用 **C# 类型的全名** 作为 MongoDB Collection 名。例如：
- `ET.Server.Player` → Collection 名 `ET.Server.Player`
- `ET.Unit` → Collection 名 `ET.Unit`

也支持传入自定义名称。

## 3.5 Save 的核心实现 — Upsert 模式

```csharp
public static async ETTask Save<T>(this DBComponent self, T entity, string collection = null) 
    where T : Entity
{
    using (await self.Root().GetComponent<CoroutineLockComponent>()
        .Wait(CoroutineLockType.DB, entity.Id % DBComponent.TaskCount))
    {
        await self.GetCollection(collection)
            .ReplaceOneAsync(
                d => d.Id == entity.Id,          // 按 Id 匹配
                entity,                          // 直接存 Entity 对象！
                new ReplaceOptions { IsUpsert = true }  // 不存在则插入
            );
    }
}
```

**三个关键点**：
1. **CoroutineLock**：`entity.Id % 32` 分桶，保证同一 Entity 的并发写入串行化
2. **Upsert**：无需区分 Insert 和 Update，框架自动处理
3. **直接存 Entity**：MongoDB.Bson 库自动调用 `BeginInit()` 准备序列化数据

---

# 四、Entity 序列化机制

这是 ET 最精妙的设计之一。Entity 基类通过**双容器策略**，在运行时高效数据结构和可序列化格式之间自动转换。

## 4.1 双容器设计

Entity 中有两对容器：

```csharp
// === 运行时容器（高效查找）===
[BsonIgnore]  // 不参与序列化
private SortedDictionary<long, Entity> components;  // 组件字典

[BsonIgnore]  // 不参与序列化
private SortedDictionary<long, Entity> children;     // 子实体字典

// === 序列化容器（可被 MongoDB/MemoryPack 序列化）===
[BsonElement("C")]           // 序列化为 "C" 字段
[BsonIgnoreIfNull]
protected List<Entity> componentsDB;   // 组件列表

[BsonElement("Children")]    // 序列化为 "Children" 字段
[BsonIgnoreIfNull]
protected List<Entity> childrenDB;     // 子实体列表
```

**为什么需要两套？**

| | 运行时（Dictionary） | 序列化（List） |
|---|---|---|
| **查找** | O(log n)，按 type hash 或 id 直接查 | O(n)，需遍历 |
| **序列化** | MongoDB.Bson 不好序列化 Dict 的 key | List 天然可序列化 |
| **选择性** | 包含所有组件/子实体 | 只包含标记了 `ISerializeToEntity` 的 |

## 4.2 BeginInit() — 序列化的入口

当 MongoDB.Bson 序列化器准备序列化一个 Entity 时，它会先调用 `ISupportInitialize.BeginInit()`：

```csharp
public override void BeginInit()
{
    // 1. 触发自定义的 SerializeSystem 钩子
    EntitySystemSingleton.Instance.Serialize(this);
    
    if (!this.IsCreated) return;

    // 2. components(Dict) → componentsDB(List)，只选择标记了 ISerializeToEntity 的
    this.componentsDB?.Clear();
    if (this.components != null)
    {
        foreach (Entity entity in this.components.Values)
        {
            if (entity is not ISerializeToEntity) continue;  // ← 关键过滤
            this.componentsDB ??= ObjectPool.Fetch<List<Entity>>();
            this.componentsDB.Add(entity);
            entity.BeginInit();  // 递归处理子组件
        }
    }

    // 3. children(Dict) → childrenDB(List)，同样过滤
    this.childrenDB?.Clear();
    if (this.children != null)
    {
        foreach (Entity entity in this.children.Values)
        {
            if (entity is not ISerializeToEntity) continue;
            this.childrenDB ??= ObjectPool.Fetch<List<Entity>>();
            this.childrenDB.Add(entity);
            entity.BeginInit();  // 递归
        }
    }
}
```

**整个序列化流程**：

```
DB.Save(entity)
  → MongoDB.Bson 序列化器启动
    → ISupportInitialize.BeginInit()
      → SerializeSystem 钩子（自定义预处理）
      → components(Dict) 过滤 ISerializeToEntity → componentsDB(List)
      → children(Dict) 过滤 ISerializeToEntity → childrenDB(List)
      → 递归子实体
    → Bson 序列化器序列化所有 [BsonElement] 标记的字段
      → Id → _id
      → componentsDB → "C"
      → childrenDB → "Children"
      → 业务字段 → 各自的 BsonElement 名
    → 写入 MongoDB
```

## 4.3 反序列化恢复 — IScene setter

从 MongoDB 读回 Entity 后，需要恢复运行时的数据结构。这在设置 `IScene` 时自动完成：

```csharp
public IScene IScene
{
    set
    {
        this.iScene = value;

        if (preScene == null)  // 首次设置 = 反序列化恢复
        {
            // 1. 生成新的运行时 InstanceId
            this.InstanceId = IdGenerater.Instance.GenerateInstanceId();
            this.IsRegister = true;

            // 2. componentsDB(List) → components(Dict)
            if (this.componentsDB != null)
            {
                foreach (Entity component in this.componentsDB)
                {
                    component.IsComponent = true;
                    this.Components.Add(GetLongHashCode(component.GetType()), component);
                    component.parent = this;
                }
            }

            // 3. childrenDB(List) → children(Dict)
            if (this.childrenDB != null)
            {
                foreach (Entity child in this.childrenDB)
                {
                    child.IsComponent = false;
                    this.Children.Add(child.Id, child);
                    child.parent = this;
                }
            }
        }

        // 4. 递归设置子实体/子组件的 IScene
        // ...

        if (!this.IsCreated)
        {
            this.IsCreated = true;
            // 5. 触发 DeserializeSystem 钩子
            EntitySystemSingleton.Instance.Deserialize(this);
        }
    }
}
```

**整个反序列化流程**：

```
DB.Query<Player>(id)
  → MongoDB Driver 查询
    → Bson 反序列化器
      → 创建 Player 对象
      → 填充 Id、componentsDB、childrenDB、业务字段
      → ISupportInitialize.EndInit()
    → 返回 Player 对象
  → 手动将 Player 添加到场景（设置 IScene）
    → 生成新 InstanceId
    → componentsDB(List) → components(Dict)
    → childrenDB(List) → children(Dict)
    → 递归恢复整棵子树
    → 触发 DeserializeSystem 钩子
  → Player 完全可用
```

## 4.4 Bson 标注策略详解

Entity 基类中各字段的标注：

| 字段 | Bson 标注 | 存储？ | 说明 |
|---|---|---|---|
| `Id` | `[BsonId]` `[BsonElement]` | **存** | 映射为 MongoDB 的 `_id` |
| `componentsDB` | `[BsonElement("C")]` | **存** | 组件列表 |
| `childrenDB` | `[BsonElement("Children")]` | **存** | 子实体列表 |
| `InstanceId` | `[BsonIgnore]` | 不存 | 运行时标识，每次启动重新生成 |
| `parent` | `[BsonIgnore]` | 不存 | 父引用，避免循环引用 |
| `iScene` | `[BsonIgnore]` | 不存 | 场景引用，运行时设置 |
| `status` | `[BsonIgnore]` | 不存 | 状态位，运行时管理 |
| `components` | `[BsonIgnore]` | 不存 | 运行时字典 |
| `children` | `[BsonIgnore]` | 不存 | 运行时字典 |

业务实体（如 Unit）中的典型标注模式：

```csharp
// 私有字段 → [BsonElement] → 参与序列化
[BsonElement]
private float3 position;

// 公共属性 → [BsonIgnore] → 不参与序列化（避免重复），但有事件逻辑
[BsonIgnore]
public float3 Position
{
    get => this.position;
    set
    {
        float3 oldPos = this.position;
        this.position = value;
        // 发布位置变更事件（通知 AOI 等系统）
        EventSystem.Instance.Publish(this.Scene(), new ChangePosition() { Unit = this, OldPos = oldPos });
    }
}
```

---

# 五、ISerializeToEntity

## 5.1 设计思想

`ISerializeToEntity` 是一个**空标记接口**：

```csharp
public interface ISerializeToEntity { }
```

只有实现了此接口的 Entity/Component 才会在 `BeginInit()` 时被收集到 `componentsDB`/`childrenDB`，从而参与数据库持久化。

## 5.2 为什么需要选择性持久化？

一个 Unit 实体可能有很多组件：

```
Unit (Entity)
├── NumericComponent     ← 数值属性（HP、攻击力）→ 需要存库
├── BagComponent         ← 背包数据 → 需要存库
├── MoveComponent        ← 移动状态（当前速度、路径）→ 不需要存库
├── PathfindingComponent ← 寻路实例 → 不需要存库（含C++资源）
├── AOIEntity            ← AOI 视野数据 → 不需要存库
└── MailBoxComponent     ← Actor 邮箱 → 不需要存库
```

如果全部序列化：
- **体积膨胀**：很多运行时临时数据不需要持久化
- **恢复困难**：有些组件依赖运行时资源（如寻路网格），反序列化后也无法直接使用
- **性能浪费**：每次 Save 都序列化大量无用数据

通过 `ISerializeToEntity` 标记，开发者可以**精确控制**哪些组件需要存储。

## 5.3 使用示例

```csharp
// 需要持久化的组件：实现 ISerializeToEntity
[ComponentOf(typeof(Unit))]
public class BagComponent : Entity, IAwake, ISerializeToEntity
{
    public Dictionary<long, Item> Items;
}

// 不需要持久化的组件：不实现 ISerializeToEntity
[ComponentOf(typeof(Unit))]
public class MoveComponent : Entity, IAwake, IDestroy
{
    public float Speed;
    public List<float3> Targets;
}
```

---

# 六、ITransfer

## 6.1 与 ISerializeToEntity 的区别

ET 中有两种序列化标记接口：

| 接口 | 用途 | 序列化方式 |
|---|---|---|
| `ISerializeToEntity` | **数据库持久化** | BeginInit() 收集到 componentsDB/childrenDB，通过 Bson 存 MongoDB |
| `ITransfer` | **跨场景传送** | TransferHelper 中手动遍历 `unit.Components`，通过 `ToBson()` 序列化 |

## 6.2 传送序列化流程

当 Unit 跨 Map 传送时（如切换地图）：

```csharp
// TransferHelper.Transfer
M2M_UnitTransferRequest request = M2M_UnitTransferRequest.Create();

// 1. 序列化 Unit 自身
request.Unit = unit.ToBson();

// 2. 序列化所有标记了 ITransfer 的组件
foreach (Entity entity in unit.Components.Values)
{
    if (entity is ITransfer)
        request.Entitys.Add(entity.ToBson());
}

// 3. 销毁本地 Unit
unit.Dispose();
```

目标 Map 接收后：

```csharp
// M2M_UnitTransferRequestHandler
// 1. 反序列化 Unit
Unit unit = MongoHelper.Deserialize<Unit>(request.Unit);

// 2. 恢复 ITransfer 组件
foreach (byte[] bytes in request.Entitys)
{
    Entity entity = MongoHelper.Deserialize<Entity>(bytes);
    unit.AddComponent(entity);  // 重新挂载
}

// 3. 重建非 Transfer 组件（这些需要在新场景中重新创建）
unit.AddComponent<MoveComponent>();
unit.AddComponent<PathfindingComponent, string>(scene.Name);
unit.AddComponent<MailBoxComponent, MailBoxType>(MailBoxType.OrderedMessage);
```

## 6.3 当前标记了 ITransfer 的组件

```csharp
// NumericComponent — 数值属性需要跟着玩家走
[ComponentOf(typeof(Unit))]
public class NumericComponent : Entity, IAwake, ITransfer
{
    public Dictionary<int, long> NumericDic;
}
```

> 比如玩家的 HP、攻击力等数值属性在传送前后必须保持一致，所以需要 `ITransfer`。而 MoveComponent（移动状态）在新场景中会被重新创建。

---

## 七、Serialize / Deserialize System

## 7.1 SerializeSystem — 存储前的自定义钩子

```csharp
// Entity 标记接口
public interface ISerialize { }

// System 实现
[EntitySystem]
public abstract class SerializeSystem<T> : SystemObject, ISerializeSystem 
    where T : Entity, ISerialize
{
    protected abstract void Serialize(T self);
}
```

**触发时机**：`EntitySystemSingleton.Serialize(entity)` 在 `BeginInit()` 的最开头调用。

**用途**：在持久化前做数据准备。例如将运行时计算的缓存值写入可序列化字段。

## 7.2 DeserializeSystem — 加载后的自定义钩子

```csharp
// Entity 标记接口
public interface IDeserialize { }

// System 实现
[EntitySystem]
public abstract class DeserializeSystem<T> : SystemObject, IDeserializeSystem 
    where T : Entity, IDeserialize
{
    protected abstract void Deserialize(T self);
}
```

**触发时机**：`IScene` setter 的末尾，在整个实体树恢复完毕后调用。

**用途**：在反序列化后重建运行时状态。例如从序列化的原始数据重建高效的查找索引。

## 7.3 使用示例

```csharp
// 标记 Entity 需要 Serialize/Deserialize 钩子
public class SkillComponent : Entity, IAwake, ISerialize, IDeserialize, ISerializeToEntity
{
    [BsonElement]
    public List<SkillData> skillList;          // 存库的原始数据
    
    [BsonIgnore]
    public Dictionary<int, SkillData> skillDict; // 运行时快速查找（不存库）
}

// Serialize 钩子：存库前无需特殊处理（skillList 已是最新）
[EntitySystem]
public class SkillComponentSerializeSystem : SerializeSystem<SkillComponent>
{
    protected override void Serialize(SkillComponent self) { }
}

// Deserialize 钩子：从库加载后重建字典
[EntitySystem]
public class SkillComponentDeserializeSystem : DeserializeSystem<SkillComponent>
{
    protected override void Deserialize(SkillComponent self)
    {
        self.skillDict = new Dictionary<int, SkillData>();
        foreach (var skill in self.skillList)
            self.skillDict[skill.Id] = skill;
    }
}
```

---

# 八、"Entity 树即缓存" 的设计哲学

## 8.1 传统游戏服务器的数据架构

```
客户端 ← → 游戏逻辑 ← → Cache层(Redis等) ← → 数据库(MySQL)
```

传统架构中通常有三层：
1. **数据库层**：持久化存储（MySQL/PostgreSQL）
2. **缓存层**：Redis/Memcached，加速读取
3. **内存数据**：游戏逻辑操作的对象

这意味着同一份数据存在三个副本，需要处理**缓存一致性**、**脏数据刷回**等复杂问题。

## 8.2 ET 的"无缓存层"设计

```
客户端 ← → Entity 树(内存,即运行时对象) ← → MongoDB
```

ET 的理念：**Entity 树本身就是缓存。**

- 玩家上线：`DB.Query<Player>(id)` → 反序列化到内存 Entity 树
- 运行时操作：直接修改内存中的 Entity/Component 字段（零延迟）
- 需要持久化：`DB.Save(entity)` → 序列化整个 Entity 写入 MongoDB
- 玩家下线：Entity Dispose → 内存释放（自动"缓存过期"）

**没有 Redis，没有 DAO，没有 ORM** — Entity 就是数据的唯一载体。

## 8.3 这样做的优劣

**优势**：
- **架构极其简洁**：无需维护缓存一致性，不存在脏读/缓存穿透问题
- **开发效率极高**：`DB.Save(player)` 一行代码完成持久化，不需要写 SQL/映射
- **数据一定一致**：内存中的 Entity 就是最新数据，不存在"缓存和DB不一致"
- **零延迟读取**：运行时直接访问内存对象

**局限**：
- **内存占用**：所有在线玩家数据全在内存中（但现代服务器内存充足，通常不是瓶颈）
- **持久化策略需自行实现**：框架不提供自动定时保存，需要业务层决定何时 `DB.Save`
- **不适合海量离线数据查询**：如果需要查询不在线的玩家数据，仍需直接查 MongoDB

## 8.4 推荐的持久化策略

虽然 ET 框架没有内置自动保存，但常见的做法是：

```csharp
// 1. 关键操作后立即保存
await dbComponent.Save(player);

// 2. 定时自动保存（如每 5 分钟）
TimerComponent.NewRepeatedTimer(5 * 60 * 1000, TimerInvokeType.AutoSave, player);

// 3. 玩家下线时保存
protected override async ETTask Run(Unit unit, G2M_SessionDisconnect message)
{
    await dbComponent.Save(unit);
    unit.Dispose();
}
```

---

# 九、协程锁保证数据一致性

## 9.1 问题场景

ET 是"单线程异步"模型，`await` 会让出执行权：

```csharp
// 两个消息同时处理同一个玩家
async ETTask Handler1(Player player) {
    var data = await DB.Query(player.Id);   // await 让出
    data.Gold += 100;                        // Handler2 可能在此间修改了 Gold
    await DB.Save(data);                     // 覆盖了 Handler2 的修改！
}
```

## 9.2 CoroutineLock 解决方案

所有 DB 操作都在协程锁保护下执行：

```csharp
public static async ETTask Save<T>(this DBComponent self, T entity, ...) where T : Entity
{
    // 按 entity.Id % 32 分桶加锁
    using (await self.Root().GetComponent<CoroutineLockComponent>()
        .Wait(CoroutineLockType.DB, entity.Id % DBComponent.TaskCount))
    {
        // 同一个 Entity 的 DB 操作在此串行执行
        await self.GetCollection(collection)
            .ReplaceOneAsync(d => d.Id == entity.Id, entity, 
                new ReplaceOptions { IsUpsert = true });
    }
}
```

**分桶策略**：`id % 32` 将不同 Entity 的锁分散到 32 个桶中，避免所有 DB 操作都排队。同一个 Entity 的操作会排队（正确），不同 Entity 的操作大概率并发（高效）。

---

# 十、与传统游戏服务器数据架构的对比

| 维度 | 传统架构 (MySQL + Redis) | ET 架构 (MongoDB + Entity 树) |
|---|---|---|
| **存储层** | MySQL（关系型） | MongoDB（文档型） |
| **缓存层** | Redis | 无（Entity 树即缓存） |
| **ORM** | 需要（MyBatis/EF 等） | **不需要**（Entity = 文档） |
| **Schema 变更** | ALTER TABLE + 数据迁移 | **直接改代码**，MongoDB 无模式 |
| **缓存一致性** | 需要处理（双写/失效策略） | **不存在**此问题 |
| **持久化方式** | INSERT/UPDATE SQL | `DB.Save(entity)` 一行代码 |
| **数据读取** | SQL JOIN + 缓存查找 | **直接访问内存对象** |
| **复杂查询** | SQL 灵活 | MongoDB 查询语法 |
| **内存管理** | Redis TTL 自动过期 | 玩家下线 Entity Dispose |
| **适用场景** | 通用 | 游戏（实体状态管理为主） |

## MongoHelper 工具类

ET 提供了统一的序列化入口：

```csharp
public static class MongoHelper
{
    // 序列化（内部自动调用 BeginInit）
    public static byte[] Serialize(object obj);
    public static void Serialize(object message, MemoryStream stream);
    
    // 反序列化（内部自动调用 EndInit）
    public static T Deserialize<T>(byte[] bytes);
    
    // JSON 转换
    public static string ToJson(object obj);
    public static T FromJson<T>(string str);
    
    // 深拷贝（序列化 → 反序列化）
    public static T Clone<T>(T t);
}
```

> **总结**：ET 的 "Entity 直接存 MongoDB" 设计是一种**面向游戏场景的极简数据架构**。通过 `ISupportInitialize`、`ISerializeToEntity`、`ITransfer` 三个核心接口和 MongoDB.Bson 的深度集成，实现了"运行时高效操作 + 持久化零门槛"的完美平衡。没有 ORM，没有 Cache 层，没有 SQL — 就是这么简单直接。
