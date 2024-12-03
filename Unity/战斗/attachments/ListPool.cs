using System;
using System.Collections.Generic;

// jave.lin : 下面的 ListPool<T> 类可以单独放到另一个通用的工具类下管理
// 便于外部所有地方可以使用，但是如果这么做的话，最好声明为 static 静态类

namespace SAS.QuadTree
{
    /// <summary>
    /// date    : 2020/11/11
    /// author  : jave.lin
    /// 外部大量的 new List<T> 也是导致大量 GC.Collect 频繁触发的原因
    /// 可以使用 ListPool<T>.FromPool, ToPool 来专门替代外部的 new List<T> 的临时变量
    /// 可大大降低：GC.Collect 的触发周期
    /// List<T> 的对象池管理，专用于 C# 层的处理，因为 lua 做不了 C# 编译时决定的泛型
    /// </summary>
    /// <typeparam name="T">元素类型</typeparam>
    public class ListPool<T> : IDisposable
    {
        public int num_of_max_item = 300;
        private Stack<List<T>> _list_pool = new Stack<List<T>>();

        public List<T> FromPool()
        {
            return _list_pool.Count > 0 ? _list_pool.Pop() : new List<T>();
        }

        public void ToPool(List<T> list)
        {
            list.Clear();
            if (list.Count > num_of_max_item)
                return;
            
            _list_pool.Push(list);
        }

        public void Clear()
        {
            _list_pool.Clear();
        }

        public void Dispose()
        {
            if (_list_pool != null)
            {
                _list_pool.Clear();
                _list_pool = null;
            }
        }
    }
}