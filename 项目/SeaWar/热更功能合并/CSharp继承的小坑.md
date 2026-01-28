---
tags:
  - SeaWar/热更功能合并/CSharp继承的小坑
---
```CSharp
public abstract class A  
{  
    public bool BoolField = false;  
    public bool BoolProperty => BoolField;  
}  
  
public class B : A  
{  
    public new bool BoolField = true;  
    public bool BoolProperty => true;  
}  
  
class Program  
{  
    static void Main(string[] args)  
    {        
	    var b = new B();  
        Console.WriteLine($"b.BoolField = {b.BoolField}, b.BoolProperty = {b.BoolProperty}"); 
        // 输出：b.BoolField = True, b.BoolProperty = True
		A a = b;  
        Console.WriteLine($"a.BoolField = {a.BoolField}, a.BoolProperty = {a.BoolProperty}"); 
        // 输出：a.BoolField = False, a.BoolProperty = False
    }
}
```

在你的代码中，`a.BoolField` 和 `a.BoolProperty` 都是 `false` 的原因与 C# 的继承和隐藏机制有关。

1. **`a.BoolField` 是 `false`**:
   - 在 `B` 类中，`BoolField` 使用了 `new` 关键字，这意味着它隐藏了基类 `A` 中的 `BoolField`。
   - 当你将 `B` 的实例赋值给 `A` 类型的变量 `a` 时，访问的是基类 `A` 中的 `BoolField`，而不是 `B` 中的隐藏字段。
   - 因此，`a.BoolField` 的值是 `A` 类中定义的默认值 `false`。

2. **`a.BoolProperty` 是 `false`**:
   - `BoolProperty` 在 `A` 类中是一个只读属性，返回的是 `A` 类中的 `BoolField`。
   - 即使 `a` 实际上引用的是 `B` 的实例，`a.BoolProperty` 调用的仍然是 `A` 类的实现，因为 `BoolProperty` 在 `A` 中没有被 `override`，而是被 `B` 中重新定义（隐藏）。
   - 因此，`a.BoolProperty` 返回的是 `A` 类中 `BoolField` 的值，也就是 `false`。

总结：
- `a.BoolField` 和 `a.BoolProperty` 都基于 `A` 类的实现。
- `B` 中的 `BoolField` 和 `BoolProperty` 被隐藏，只有通过 `B` 类型的变量（如 `b`）才能访问。




