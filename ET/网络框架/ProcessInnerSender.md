---
tags:
  - ET
---
`ProcessInnerSender`是用于同一个进程内的`Fiber`间通信用的组件。
```CSharp
[ComponentOf(typeof(Scene))]
public class ProcessInnerSender: Entity, IAwake, IDestroy, IUpdate
{
    public const long TIMEOUT_TIME = 40 * 1000;
    public int RpcId;
    public readonly Dictionary<int, MessageSenderStruct> requestCallback = new();
    public readonly List<MessageInfo> list = new();
}
```
# ActorId和Adress结构体
`Address`中只有两个字段——`Fiber`和`Process`。如果这两个字段都相等，那么两个`Address`相等
```CSharp
[MemoryPackOrder(0)]
public int Process;

[MemoryPackOrder(1)]
public int Fiber;
```
`ActorId`中有`Address`和`InstanceId`两个字段，如果这两个字段都相等，那么两个`ActorId`相等
```CSharp
[MemoryPackOrder(0)]
public Address Address;

[MemoryPackOrder(1)]
public long InstanceId;
```
# MessageSenderStruct结构体
```CSharp
public ActorId ActorId { get; }
public Type RequestType { get; }
private readonly ETTask<IResponse> tcs;
public bool NeedException { get; }
```
