---
tags:
  - ET
---
# CoroutineLockComponent协程锁
协程锁是因为异步编程总会引起逻辑上一些先后关系给破坏掉了。为了保证逻辑上先后关系 引入协程锁。就跟线程的lock一样。
协程锁原理很简单，同一个key只有一个协程能执行，其它同一个key的协程将队列，这个协程执行完会唤醒下一个协程。

>这里先说一下jie

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
## CoroutineLock、CoroutineLockQueue和CoroutineLockQueueType
`CoroutineLock`是锁的信息，记录了锁的类型，锁的Key和该锁被锁了多少次
```CSharp
public class CoroutineLock: Entity, IAwake<int, long, int>, IDestroy
{
    public int type;
    public long key;
    public int level;
}
```
当锁被销毁时，会调用`CoroutineLockComponent.RunNextCoroutine`去通知解锁。`WaitCoroutineLock`将`CoroutineLock`封装成一个可等待的Task。
`CoroutineLockQueue`中，将所有锁（`WaitCoroutineLock`）放到队列中。`CoroutineLockQueue`本身是按照锁类型（`type`字段）创建的。
```CSharp
public class CoroutineLockQueue: Entity, IAwake<int>, IDestroy
{
    public int type;
    public bool isStart;
    public Queue<WaitCoroutineLock> queue = new();
    public int Count => this.queue.Count;
}
```
`Wait`方法，用于上锁。如果该类型的锁，之前没有存在过，那么就直接解锁返回，否则就等待解锁
```CSharp
public static async ETTask<CoroutineLock> Wait(this CoroutineLockQueue self, int time)
{
    CoroutineLock coroutineLock = null;
    if (!self.isStart)
    {
        self.isStart = true;
        coroutineLock 
            = self.AddChild<CoroutineLock, int, long, int>(self.type, self.Id, 1, true);
        return coroutineLock;
    }

    WaitCoroutineLock waitCoroutineLock = WaitCoroutineLock.Create();
    self.queue.Enqueue(waitCoroutineLock);
    if (time > 0)
    {
        // 超时设置
    }
    coroutineLock = await waitCoroutineLock.Wait();
    return coroutineLock;
}
```
`Notify`方法用于解锁，
```CSharp
public static bool Notify(this CoroutineLockQueue self, int level)
{
    // 有可能WaitCoroutineLock已经超时抛出异常，所以要找到一个未处理的WaitCoroutineLock
    while (self.queue.Count > 0)
    {
        WaitCoroutineLock waitCoroutineLock = self.queue.Dequeue();
        if (waitCoroutineLock.IsDisposed())
        {
            continue;
        }
        CoroutineLock coroutineLock 
                    = self.AddChild<CoroutineLock, int, long, int>(self.type, self.Id, level, true);
        waitCoroutineLock.SetResult(coroutineLock);
        return true;
    }
    return false;
}
```