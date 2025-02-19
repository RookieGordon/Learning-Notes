---
tags:
  - ET
---
>[!Improtant]
> `ObjectWait`主要用于开发场景中的A等B的情况，这种等待情况不存在于同一个逻辑链条上，因此不能简单使用Task来等待。以往的开发中，可以通过使用事件系统来标记B是否完成，ET提供的`ObjectWait`使用一致性的任务来实现这种情况

# 等待
当我们在A出等待B完成时，那么就使用`Wait`方法
```CSharp
public static async ETTask<T> Wait<T>(this ObjectWait self, 
                            int timeout, 
                            ETCancellationToken cancellationToken = null) 
                            where T : struct, IWaitType
{
    ResultCallback<T> tcs = new ResultCallback<T>();
    Type type = typeof(T);
    async ETTask WaitTimeout()
    {
        // 超时设置
    }
    WaitTimeout().Coroutine();
    self.Add(type, tcs);
    void CancelAction()
    {
        self.Notify(new T() { Error = WaitTypeError.Cancel });
    }
    T ret;
    try
    {
        cancellationToken?.Add(CancelAction);
        ret = await tcs.Task;
    }
    finally
    {
        cancellationToken?.Remove(CancelAction);    
    }
    return ret;
}
```
`ResultCallback`会将`T`封装成一个可以等待的任务。`Add`方法，会将该等待的任务，按照类型，添加到字典中去。`Notify`方法用于取消等待，即通知A，B已经完成了。