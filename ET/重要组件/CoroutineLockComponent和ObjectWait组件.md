---
tags:
  - ET
---
# CoroutineLockComponent协程锁
协程锁是因为异步编程总会引起逻辑上一些先后关系给破坏掉了。为了保证逻辑上先后关系 引入协程锁。就跟线程的lock一样。
协程锁原理很简单，同一个key只有一个协程能执行，其它同一个key的协程将队列，这个协程执行完会唤醒下一个协程。
使用`Wait`方法去等待某个锁，使用`Notify`方法去释放某个锁。
`Wait`方法，会根据锁的类型，添加一个`CoroutineLockQueueType`对象。
```CSharp
public static async ETTask<CoroutineLock> Wait(this CoroutineLockComponent self, int coroutineLockType, long key, int time = 60000)
        {
            CoroutineLockQueueType coroutineLockQueueType 
                                                        = self.GetChild<CoroutineLockQueueType>(coroutineLockType) 
                                                        ?? self.AddChildWithId<CoroutineLockQueueType>(coroutineLockType);
            return await coroutineLockQueueType.Wait(key, time);
        }
```

## CoroutineLockQueueType
