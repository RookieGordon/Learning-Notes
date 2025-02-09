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
# MessageSenderStruct
