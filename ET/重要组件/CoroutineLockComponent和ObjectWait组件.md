---
tags:
  - ET
---
# CoroutineLockComponent协程锁
协程锁是因为异步编程总会引起逻辑上一些先后关系给破坏掉了。为了保证逻辑上先后关系 引入协程锁。就跟线程的lock一样。
协程锁原理很简单，同一个key只有一个协程能执行，其它同一个key的协程将队列，这个协程执行完会唤醒下一个协程。

>[!Important]
>这里先说一下结论：
>1. 上锁和解锁的整个逻辑流程是反着的。上锁的顺序是`CoroutineLockComponent`->`CoroutineLockQueueType`->`CoroutineLock`。解锁的顺序则是`CoroutineLock`->`CoroutineLockComponent`->`CoroutineLockQueueType`->`CoroutineLockQueue`。
>2. 一般是在外层上锁，使用`using`语句。语句结束，自动解锁。或者等待超时解锁。

## CoroutineLock、CoroutineLockQueue和CoroutineLockQueueType
`CoroutineLock`记录了锁的信息，包括锁的类型，锁的Key和该锁被锁了多少次
```CSharp
public class CoroutineLock: Entity, IAwake<int, long, int>, IDestroy
{
    public int type;
    public long key;
    public int level;
}
```
还有一个`WaitCoroutineLock`类型，这个类将`CoroutineLock`封装成一个可以被等待的任务。
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
`CoroutineLockQueueType`是`CoroutineLockComponent`子节点，以`coroutineLockType`为key，存储在`CoroutineLockComponent.Children`字典中。`CoroutineLockQueueType.Id`是用户指定的锁的Key。
`CoroutineLockQueue`是`CoroutineLockQueueType`的子节点，以锁的Key为Key，存在`CoroutineLockQueueType.Children`中

## 加锁
`CoroutineLockComponent.Wait`方法会根据锁的类型`coroutineLockType`，添加一个`CoroutineLockQueueType`对象。
```CSharp
public static async ETTask<CoroutineLock> Wait(this CoroutineLockComponent self, int coroutineLockType, long key, int time = 60000)
{
    CoroutineLockQueueType coroutineLockQueueType 
        = self.GetChild<CoroutineLockQueueType>(coroutineLockType) 
        ?? self.AddChildWithId<CoroutineLockQueueType>(coroutineLockType);
    return await coroutineLockQueueType.Wait(key, time);
}
```
`CoroutineLockQueueType.Wait`方法，会根据锁的Key，判断是否需要新增一个该种Key的锁队列（`CoroutineLockQueue`）
```CSharp
public static async ETTask<CoroutineLock> Wait(this CoroutineLockQueueType self, long key, int time)
{
    CoroutineLockQueue queue = self.Get(key) ?? self.New(key);
    return await queue.Wait(time);
}
```
`CoroutineLockQueue.Wait`方法中，如果是第一次加锁，那么就直接返回一个`CoroutineLock`对象。否则，将`WaitCoroutineLock`对象加入到队列中，等待唤醒。
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
## 解锁
解锁有两种情况，一种是超时解锁，一种是正常解锁。正常解锁，是通过`CoroutineLock.Destroy`方法实现的。`CoroutineLockComponent.Wait`外层使用`using`语句，语句执行完毕后，自动执行`CoroutineLock.Dispose`方法，`Dispose`中调用`Destroy`方法。
`CoroutineLock.Destroy`方法会调用`CoroutineLockComponent.RunNextCoroutine`方法，该方法会将锁信息，添加到`nextFrameRun`队列中，等待下一帧执行。这里有个细节，在将锁信息添加到`nextFrameRun`队列中时，`level`的值增加了1
`CoroutineLockComponent.Update`每帧轮询`nextFrameRun`队列，如果有元素，那么就执行`CoroutineLockComponent.Notify`方法。
```CSharp
private static void Notify(this CoroutineLockComponent self, int coroutineLockType, long key, int level)
{
    CoroutineLockQueueType coroutineLockQueueType 
                                    = self.GetChild<CoroutineLockQueueType>(coroutineLockType);
    if (coroutineLockQueueType == null)
    {
        return;
    }
    coroutineLockQueueType.Notify(key, level);
}
```
通过`CoroutineLockQueueType.Notify`方法，调用到`CoroutineLockQueue.Notify`方法
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

        CoroutineLock coroutineLock = self.AddChild<CoroutineLock, int, long, int>(self.type, self.Id, level, true);
        waitCoroutineLock.SetResult(coroutineLock);
        return true;
    }
    return false;
}
```
这里会创建一个新的`CoroutineLock`对象，设置为任务的结果。此时`CoroutineLockQueue`中是没有`CoroutineLock`节点的，因为第一个锁`CoroutineLock`已经被销毁了。


