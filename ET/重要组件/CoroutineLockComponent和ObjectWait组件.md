---
tags:
  - ET
---
# CoroutineLockComponent协程锁
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
