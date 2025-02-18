---
tags:
  - ET
---
# CoroutineLockComponent协程锁
协程锁是因为异步编程总会引起逻辑上一些先后关系给破坏掉了。为了保证逻辑上先后关系 引入协程锁。就跟线程的lock一样。
协程锁原理很简单，同一个key只有一个协程能执行，其它同一个key的协程将队列，这个协程执行完会唤醒下一个协程。
`Wait`方法用于锁住某个Key。该方法会根据锁的类型，添加一个`CoroutineLockQueueType`对象。
```CSharp
public static async ETTask<CoroutineLock> Wait(this CoroutineLockComponent self, int coroutineLockType, long key, int time = 60000)
{
    CoroutineLockQueueType coroutineLockQueueType 
        = self.GetChild<CoroutineLockQueueType>(coroutineLockType) 
        ?? self.AddChildWithId<CoroutineLockQueueType>(coroutineLockType);
    return await coroutineLockQueueType.Wait(key, time);
}
```
## CoroutineLockQueueType和CoroutineLockQueue
`CoroutineLockQueue`才是锁的核心对象。
```CSharp
public class CoroutineLockQueue: Entity, IAwake<int>, IDestroy
{
    public int type;
    public bool isStart;
    public Queue<WaitCoroutineLock> queue = new();
    public int Count => this.queue.Count;
}
```
`type`字段代表该锁队列的类型。