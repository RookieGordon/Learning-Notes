---
link: https://www.cnblogs.com/iwiniwin/p/15307368.html
byline: iwiniwin
site: 博客园
date: 2021-09-18T10:12
excerpt: xLua是腾讯的一个开源项目，为Unity、 .Net、
  Mono等C#环境增加Lua脚本编程的能力。本文主要是探讨xLua下Lua调用C#的实现原理。 Lua与C#数据通信机制
  无论是Lua调用C#，还是C#调用Lua，都需要一个通信机制，来完成数据的传递。而Lua本身就是由C语言编写的，所以它出
tags:
  - slurp/C
  - slurp/Lua
  - slurp/Unity
slurped: 2025-03-20T21:53
title: 深入xLua实现原理之Lua如何调用C#
---

[xLua](https://github.com/Tencent/xLua)是腾讯的一个开源项目，为Unity、 .Net、 Mono等C#环境增加Lua脚本编程的能力。本文主要是探讨xLua下Lua调用C#的实现原理。

### Lua与C#数据通信机制

无论是Lua调用C#，还是C#调用Lua，都需要一个通信机制，来完成数据的传递。而Lua本身就是由C语言编写的，所以它出生自带一个和C/C++的通信机制。

Lua和C/C++的数据交互通过栈进行，操作数据时，首先将数据拷贝到"栈"上，然后获取数据，栈中的每个数据通过索引值进行定位，索引值为正时表示相对于栈底的偏移索引，索引值为负时表示相对于栈顶的偏移索引，索引值以1或-1为起始值，因此栈顶索引值永远为-1, 栈底索引值永远为1 。 “栈"相当于数据在Lua和C/C++之间的中转地。每种数据都有相应的存取接口。

而C#可以通过P/Invoke方式调用Lua的dll，通过这个dll执行Lua的C API。换言之C#可以借助C/C++来与Lua进行数据通信。在xLua的LuaDLL.cs文件中可以找到许多DllImport修饰的数据入栈与获取的接口。

```
// LuaDLL.cs
[DllImport(LUADLL,CallingConvention=CallingConvention.Cdecl)]
public static extern void lua_pushnumber(IntPtr L, double number);

[DllImport(LUADLL,CallingConvention=CallingConvention.Cdecl)]
public static extern void lua_pushboolean(IntPtr L, bool value);

[DllImport(LUADLL, CallingConvention = CallingConvention.Cdecl)]
public static extern void xlua_pushinteger(IntPtr L, int value);

[DllImport(LUADLL, CallingConvention = CallingConvention.Cdecl)]
public static extern double lua_tonumber(IntPtr L, int index);

[DllImport(LUADLL, CallingConvention = CallingConvention.Cdecl)]
public static extern int xlua_tointeger(IntPtr L, int index);

[DllImport(LUADLL, CallingConvention = CallingConvention.Cdecl)]
public static extern uint xlua_touint(IntPtr L, int index);

[DllImport(LUADLL,CallingConvention=CallingConvention.Cdecl)]
public static extern bool lua_toboolean(IntPtr L, int index);
```

### 传递C#对象到Lua

对于bool，int这样简单的值类型可以直接通过C API传递。但对于C#对象就不同了，Lua这边没有能与之对应的类型，因此传递到Lua的只是C#对象的一个索引，具体实现请看下面的代码

```
// ObjectTranslator.cs
public void Push(RealStatePtr L, object o)
{
    // ...
    int index = -1;
    Type type = o.GetType();
#if !UNITY_WSA || UNITY_EDITOR
    bool is_enum = type.IsEnum;
    bool is_valuetype = type.IsValueType;
#else
    bool is_enum = type.GetTypeInfo().IsEnum;
    bool is_valuetype = type.GetTypeInfo().IsValueType;
#endif
    bool needcache = !is_valuetype || is_enum;  // 如果是引用或枚举，会进行缓存
    if (needcache && (is_enum ? enumMap.TryGetValue(o, out index) : reverseMap.TryGetValue(o, out index)))  // 如果有缓存
    {
        if (LuaAPI.xlua_tryget_cachedud(L, index, cacheRef) == 1)  
        {
            return;
        }
        //这里实在太经典了，weaktable先删除，然后GC会延迟调用，当index会循环利用的时候，不注释这行将会导致重复释放
        //collectObject(index);
    }

    bool is_first;
    int type_id = getTypeId(L, type, out is_first);

    //如果一个type的定义含本身静态readonly实例时，getTypeId会push一个实例，这时候应该用这个实例
    if (is_first && needcache && (is_enum ? enumMap.TryGetValue(o, out index) : reverseMap.TryGetValue(o, out index))) 
    {
        if (LuaAPI.xlua_tryget_cachedud(L, index, cacheRef) == 1)   
        {
            return;
        }
    }
    // C#侧进行缓存
    index = addObject(o, is_valuetype, is_enum);
    // 将代表对象的索引push到lua
    LuaAPI.xlua_pushcsobj(L, index, type_id, needcache, cacheRef);
}
```

代码中的两个if语句主要是对缓存的判断，如果要传递的对象已经被缓存过了就直接使用缓存的。如果这个对象是被第一次传递，则进行以下两步操作

1. 通过addObject将对象缓存在objects对象池中，并得到一个索引（通过这个索引可以获取到该对象）
    
    ```
    // ObjectTranslator.cs
    int addObject(object obj, bool is_valuetype, bool is_enum)
    {
        int index = objects.Add(obj);
        if (is_enum)
        {
            enumMap[obj] = index;
        }
        else if (!is_valuetype)
        {
            reverseMap[obj] = index;
        }
        
        return index;
    }
    ```
    
2. 通过xlua_pushcsobj将代表对象的索引传递到Lua。
    
    参数key表示代表对象的索引，参数meta_ref表示代表对象类型的表的索引，它的值是通过getTypeId函数获得的，后面会详细讲到。参数need_cache表示是否需要在Lua侧进行缓存，参数cache_ref表示Lua侧缓存表的索引
    
    ```
    // xlua.c
    LUA_API void xlua_pushcsobj(lua_State *L, int key, int meta_ref, int need_cache, int cache_ref) {
        int* pointer = (int*)lua_newuserdata(L, sizeof(int));
        *pointer = key;
        
        if (need_cache) cacheud(L, key, cache_ref);  // Lua侧缓存
    
        lua_rawgeti(L, LUA_REGISTRYINDEX, meta_ref);
    
        lua_setmetatable(L, -2);  // 为userdata设置元表
    }
    
    // 将 key = userdata 存入缓存表
    static void cacheud(lua_State *L, int key, int cache_ref) {
        lua_rawgeti(L, LUA_REGISTRYINDEX, cache_ref);
        lua_pushvalue(L, -2);
        lua_rawseti(L, -2, key);
        lua_pop(L, 1);
    }
    ```
    
    xlua_pushcsobj的主要逻辑是，代表对象的索引被push到Lua后，Lua会为其创建一个userdata，并将这个userdata指向对象索引，如果需要缓存则将userdata保存到缓存表中， 最后为userdata设置了元表。也就是说，C#对象在Lua这边对应的就是一个userdata，利用对象索引保持与C#对象的联系。
    

### 注册C#类型信息到Lua

为userdata（特指C#对象在Lua这边对应的代理userdata，后面再出现的userdata也是同样的含义，就不再赘述了）设置的元表，表示的实际是对象的类型信息。在将C#对象传递到Lua以后，还需要告知Lua该对象的类型信息，比如对象类型有哪些成员方法，属性或是静态方法等。将这些都注册到Lua后，Lua才能正确的调用。这个元表是通过getTypeId函数生成的

```
// ObjectTranslator.cs
internal int getTypeId(RealStatePtr L, Type type, out bool is_first, LOGLEVEL log_level = LOGLEVEL.WARN)
{
    int type_id;
    is_first = false;
    if (!typeIdMap.TryGetValue(type, out type_id)) // no reference
    {
        // ...
        is_first = true;
        Type alias_type = null;
        aliasCfg.TryGetValue(type, out alias_type);
        LuaAPI.luaL_getmetatable(L, alias_type == null ? type.FullName : alias_type.FullName);

        if (LuaAPI.lua_isnil(L, -1)) //no meta yet, try to use reflection meta
        {
            LuaAPI.lua_pop(L, 1);

            if (TryDelayWrapLoader(L, alias_type == null ? type : alias_type))
            {
                LuaAPI.luaL_getmetatable(L, alias_type == null ? type.FullName : alias_type.FullName);
            }
            else
            {
                throw new Exception("Fatal: can not load metatable of type:" + type);
            }
        }

        //循环依赖，自身依赖自己的class，比如有个自身类型的静态readonly对象。
        if (typeIdMap.TryGetValue(type, out type_id))
        {
            LuaAPI.lua_pop(L, 1);
        }
        else
        {
            // ...
            LuaAPI.lua_pushvalue(L, -1);
            type_id = LuaAPI.luaL_ref(L, LuaIndexes.LUA_REGISTRYINDEX);  // 将元表添加到注册表中
            LuaAPI.lua_pushnumber(L, type_id);
            LuaAPI.xlua_rawseti(L, -2, 1);   // 元表[1] = type_id
            LuaAPI.lua_pop(L, 1);

            if (type.IsValueType())
            {
                typeMap.Add(type_id, type);
            }

            typeIdMap.Add(type, type_id);
        }
    }
    return type_id;
}
```

函数主要逻辑是以类的名称为key通过luaL_getmetatable获取类对应的元表，如果获取不到，则通过TryDelayWrapLoader函数生成。然后调用luaL_ref将获取到的元表添加到Lua注册表中，并返回type_id。type_id表示的就是元表在Lua注册表中的索引，通过这个索引可以在Lua注册表中取回元表。前面提到的xlua_pushcsobj函数就是利用type_id即meta_ref，获取到元表，然后为userdata设置的元表。

下面来看元表具体是怎样生成的

```
// ObjectTranslator.cs
public bool TryDelayWrapLoader(RealStatePtr L, Type type)
{
    // ...
    LuaAPI.luaL_newmetatable(L, type.FullName); //先建一个metatable，因为加载过程可能会需要用到
    LuaAPI.lua_pop(L, 1);

    Action<RealStatePtr> loader;
    int top = LuaAPI.lua_gettop(L);
    if (delayWrap.TryGetValue(type, out loader))  // 如果有预先注册的类型元表生成器，则直接使用
    {
        delayWrap.Remove(type);
        loader(L);
    }
    else
    {
#if !GEN_CODE_MINIMIZE && !ENABLE_IL2CPP && (UNITY_EDITOR || XLUA_GENERAL) && !FORCE_REFLECTION && !NET_STANDARD_2_0
        if (!DelegateBridge.Gen_Flag && !type.IsEnum() && !typeof(Delegate).IsAssignableFrom(type) && Utils.IsPublic(type))
        {
            Type wrap = ce.EmitTypeWrap(type);
            MethodInfo method = wrap.GetMethod("__Register", BindingFlags.Static | BindingFlags.Public);
            method.Invoke(null, new object[] { L });
        }
        else
        {
            Utils.ReflectionWrap(L, type, privateAccessibleFlags.Contains(type));
        }
#else
        Utils.ReflectionWrap(L, type, privateAccessibleFlags.Contains(type));
#endif
        // ...
    }
    if (top != LuaAPI.lua_gettop(L))
    {
        throw new Exception("top change, before:" + top + ", after:" + LuaAPI.lua_gettop(L));
    }

    foreach (var nested_type in type.GetNestedTypes(BindingFlags.Public))
    {
        if (nested_type.IsGenericTypeDefinition())  // 过滤泛型类型定义
        {
            continue;
        }
        GetTypeId(L, nested_type);
    }
    
    return true;
}
```

TryDelayWrapLoader主要用来处理两种情况

1. 通过delayWrap判断，是否有为该类生成代码，如果有，直接使用生成函数进行填充元表（loader方法）。在xLua的生成代码中有一个XLuaGenAutoRegister.cs文件，在这个文件中会为对应的类注册初始化器，而这个初始化器负责将类对应的元表生成函数添加到delayWrap中。
    
    ```
    // XLuaGenAutoRegister.cs
    public class XLua_Gen_Initer_Register__
    {
        static void wrapInit0(LuaEnv luaenv, ObjectTranslator translator)
        {
            // ...
            translator.DelayWrapLoader(typeof(TestXLua), TestXLuaWrap.__Register);  // 将类型对应的元表填充函数__Register添加到delayWrap中
            // ...
        }
        
        static void Init(LuaEnv luaenv, ObjectTranslator translator)
        {
            wrapInit0(luaenv, translator);
            translator.AddInterfaceBridgeCreator(typeof(System.Collections.IEnumerator), SystemCollectionsIEnumeratorBridge.__Create);
        }
        
        static XLua_Gen_Initer_Register__()
        {
    	    XLua.LuaEnv.AddIniter(Init);  // 注册初始化器
    	}
    }
    ```
    
2. 如果没有生成代码，通过反射填充元表（ReflectionWrap方法）

#### 使用生成函数填充元表

以LuaCallCSharp修饰的TestXLua类为例来查看生成函数是如何生成的

```
// TestXLua.cs
[LuaCallCSharp]
public class TestXLua
{
    public string Name;
    public void Test1(int a){
    }
    public static void Test2(int a, bool b, string c)
    {
    }
}
```

Generate Code之后生成的TestXLuaWrap.cs如下所示

```
public class TestXLuaWrap 
{
    public static void __Register(RealStatePtr L)
    {
        ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
        System.Type type = typeof(TestXLua);
        Utils.BeginObjectRegister(type, L, translator, 0, 1, 1, 1);
        Utils.RegisterFunc(L, Utils.METHOD_IDX, "Test1", _m_Test1);
        Utils.RegisterFunc(L, Utils.GETTER_IDX, "Name", _g_get_Name);
        Utils.RegisterFunc(L, Utils.SETTER_IDX, "Name", _s_set_Name);
        Utils.EndObjectRegister(type, L, translator, null, null,
            null, null, null);
        Utils.BeginClassRegister(type, L, __CreateInstance, 2, 0, 0);
        Utils.RegisterFunc(L, Utils.CLS_IDX, "Test2", _m_Test2_xlua_st_);
        Utils.EndClassRegister(type, L, translator);
    }
    
    [MonoPInvokeCallbackAttribute(typeof(LuaCSFunction))]
    static int __CreateInstance(RealStatePtr L)
    {
        try {
            ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
            if(LuaAPI.lua_gettop(L) == 1)
            {
                TestXLua gen_ret = new TestXLua();
                translator.Push(L, gen_ret);
                return 1;
            }
        }
        catch(System.Exception gen_e) {
            return LuaAPI.luaL_error(L, "c# exception:" + gen_e);
        }
        return LuaAPI.luaL_error(L, "invalid arguments to TestXLua constructor!");
        
    }

    [MonoPInvokeCallbackAttribute(typeof(LuaCSFunction))]
    static int _m_Test1(RealStatePtr L)
    {
        try {
            ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
            TestXLua gen_to_be_invoked = (TestXLua)translator.FastGetCSObj(L, 1);
            {
                int _a = LuaAPI.xlua_tointeger(L, 2);
                gen_to_be_invoked.Test1( _a );
                return 0;
            }
        } catch(System.Exception gen_e) {
            return LuaAPI.luaL_error(L, "c# exception:" + gen_e);
        }
    }
    
    [MonoPInvokeCallbackAttribute(typeof(LuaCSFunction))]
    static int _m_Test2_xlua_st_(RealStatePtr L)
    {
        try {
            {
                int _a = LuaAPI.xlua_tointeger(L, 1);
                bool _b = LuaAPI.lua_toboolean(L, 2);
                string _c = LuaAPI.lua_tostring(L, 3);
                TestXLua.Test2( _a, _b, _c );
                return 0;
            }
        } catch(System.Exception gen_e) {
            return LuaAPI.luaL_error(L, "c# exception:" + gen_e);
        }
    }
    
    [MonoPInvokeCallbackAttribute(typeof(LuaCSFunction))]
    static int _g_get_Name(RealStatePtr L)
    {
        try {
            ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
        
            TestXLua gen_to_be_invoked = (TestXLua)translator.FastGetCSObj(L, 1);
            LuaAPI.lua_pushstring(L, gen_to_be_invoked.Name);
        } catch(System.Exception gen_e) {
            return LuaAPI.luaL_error(L, "c# exception:" + gen_e);
        }
        return 1;
    }
    
    [MonoPInvokeCallbackAttribute(typeof(LuaCSFunction))]
    static int _s_set_Name(RealStatePtr L)
    {
        try {
            ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
        
            TestXLua gen_to_be_invoked = (TestXLua)translator.FastGetCSObj(L, 1);
            gen_to_be_invoked.Name = LuaAPI.lua_tostring(L, 2);
        
        } catch(System.Exception gen_e) {
            return LuaAPI.luaL_error(L, "c# exception:" + gen_e);
        }
        return 0;
    }
}
```

生成函数__Register主要是这样一个框架

1. Utils.BeginObjectRegister，在对类的非静态值（例如成员变量，成员方法等）进行注册前做一些准备工作。主要是为元表添加__gc和__tostring元方法，以及准备好method表、getter表、setter表，后面调用RegisterFunc时，可以选择插入到对应的表中
    
    ```
    // Utils.cs
    public static void BeginObjectRegister(Type type, RealStatePtr L, ObjectTranslator translator, int meta_count, int method_count, int getter_count,
        int setter_count, int type_id = -1)
    {
        if (type == null)
        {
            if (type_id == -1) throw new Exception("Fatal: must provide a type of type_id");
            LuaAPI.xlua_rawgeti(L, LuaIndexes.LUA_REGISTRYINDEX, type_id);
        }
        else
        {
            LuaAPI.luaL_getmetatable(L, type.FullName);
            // 如果type.FullName对应的元表是空，则创建一个新的元表，并设置到注册表中
            if (LuaAPI.lua_isnil(L, -1))
            {
                LuaAPI.lua_pop(L, 1);
                LuaAPI.luaL_newmetatable(L, type.FullName);
            }
        }
        LuaAPI.lua_pushlightuserdata(L, LuaAPI.xlua_tag());
        LuaAPI.lua_pushnumber(L, 1);
        LuaAPI.lua_rawset(L, -3);  // 为元表设置标志
    
        if ((type == null || !translator.HasCustomOp(type)) && type != typeof(decimal))
        {
            LuaAPI.xlua_pushasciistring(L, "__gc");
            LuaAPI.lua_pushstdcallcfunction(L, translator.metaFunctions.GcMeta);
            LuaAPI.lua_rawset(L, -3);  // 为元表设置__gc方法
        }
    
        LuaAPI.xlua_pushasciistring(L, "__tostring");
        LuaAPI.lua_pushstdcallcfunction(L, translator.metaFunctions.ToStringMeta);
        LuaAPI.lua_rawset(L, -3);  // 为元表设置__tostring方法
    
        if (method_count == 0)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            LuaAPI.lua_createtable(L, 0, method_count);  // 创建method表
        }
    
        if (getter_count == 0)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            LuaAPI.lua_createtable(L, 0, getter_count);  // 创建getter表
        }
    
        if (setter_count == 0)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            LuaAPI.lua_createtable(L, 0, setter_count);  // 创建setter表
        }
    }
    ```
    
2. 多个Utils.RegisterFunc，将类的每个非静态值对应的包裹方法注册到不同的Lua表中。包裹方法是Generate Code时动态生成的，对于类的属性会生成两个包裹方法，分别是get和set包裹方法。
    
    例如成员方法Test1对应的包裹方法是_m_Test1，并被注册到了method表中。Name变量的_g_get_Name包裹方法被注册到getter表，而_s_set_Name包裹方法被注册到setter表。这个包裹方法只是对原来方法的一层包裹，调用这个包裹方法本质上就是调用原来的方法。至于为什么需要生成包裹方法，后面会再讲到
    
    ```
    // Utils.cs RegisterFunc根据不同的宏定义会有不同的版本，但大同小异
    public static void RegisterFunc(RealStatePtr L, int idx, string name, LuaCSFunction func)
    {
        idx = abs_idx(LuaAPI.lua_gettop(L), idx);
        LuaAPI.xlua_pushasciistring(L, name);
        LuaAPI.lua_pushstdcallcfunction(L, func);
        LuaAPI.lua_rawset(L, idx);  // 将idx指向的表中添加键值对 name = func
    }
    ```
    
3. Utils.EndObjectRegister，结束对类的非静态值的注册。主要逻辑是为元表生成__index元方法和__newindex元方法，这也是Lua调用C#的核心所在
    
    ```
    // Utils.cs
    public static void EndObjectRegister(Type type, RealStatePtr L, ObjectTranslator translator, LuaCSFunction csIndexer,
        LuaCSFunction csNewIndexer, Type base_type, LuaCSFunction arrayIndexer, LuaCSFunction arrayNewIndexer)
    {
        int top = LuaAPI.lua_gettop(L);
        int meta_idx = abs_idx(top, OBJ_META_IDX);
        int method_idx = abs_idx(top, METHOD_IDX);
        int getter_idx = abs_idx(top, GETTER_IDX);
        int setter_idx = abs_idx(top, SETTER_IDX);
    
        //begin index gen
        LuaAPI.xlua_pushasciistring(L, "__index");
        LuaAPI.lua_pushvalue(L, method_idx);  // 1. 压入methods表
        LuaAPI.lua_pushvalue(L, getter_idx);  // 2. 压入getters表
    
        if (csIndexer == null)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            // ...
            LuaAPI.lua_pushstdcallcfunction(L, csIndexer);  // 3. 压入csindexer
            // ...
        }
    
        translator.Push(L, type == null ? base_type : type.BaseType());  // 4. 压入base
    
        LuaAPI.xlua_pushasciistring(L, LuaIndexsFieldName);
        LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);  // 5. 压入indexfuncs
        if (arrayIndexer == null)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            // ...
            LuaAPI.lua_pushstdcallcfunction(L, arrayIndexer);  // 6. 压入arrayindexer
            // ...
        }
    
        LuaAPI.gen_obj_indexer(L);  // 生成__index元方法
    
        if (type != null)
        {
            LuaAPI.xlua_pushasciistring(L, LuaIndexsFieldName);
            LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);//store in lua indexs function tables
            translator.Push(L, type);
            LuaAPI.lua_pushvalue(L, -3);
            LuaAPI.lua_rawset(L, -3);  // 注册表[LuaIndexs][type] = __index函数
            LuaAPI.lua_pop(L, 1);
        }
    
        LuaAPI.lua_rawset(L, meta_idx);
        //end index gen
    
        //begin newindex gen
        LuaAPI.xlua_pushasciistring(L, "__newindex");
        LuaAPI.lua_pushvalue(L, setter_idx);
    
        if (csNewIndexer == null)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            // ...
            LuaAPI.lua_pushstdcallcfunction(L, csNewIndexer);
            // ...
        }
    
        translator.Push(L, type == null ? base_type : type.BaseType());
    
        LuaAPI.xlua_pushasciistring(L, LuaNewIndexsFieldName);
        LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
    
        if (arrayNewIndexer == null)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            // ...
            LuaAPI.lua_pushstdcallcfunction(L, arrayNewIndexer);
            // ...
        }
    
        LuaAPI.gen_obj_newindexer(L);  // 生成__newindex元方法
    
        if (type != null)
        {
            LuaAPI.xlua_pushasciistring(L, LuaNewIndexsFieldName);
            LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);//store in lua newindexs function tables
            translator.Push(L, type);
            LuaAPI.lua_pushvalue(L, -3);
            LuaAPI.lua_rawset(L, -3);  // 注册表[LuaNewIndexs][type] = __newindex函数
            LuaAPI.lua_pop(L, 1);
        }
    
        LuaAPI.lua_rawset(L, meta_idx);
        //end new index gen
        LuaAPI.lua_pop(L, 4);
    }
    ```
    
    __index元方法是通过调用gen_obj_indexer获得的，在调用该方法前会依次压入6个参数（代码注释中有标注），gen_obj_indexer内部又会再压入一个nil值，用于为baseindex提前占位。共7个参数会作为upvalue关联到闭包obj_indexer。obj_indexer函数就是__index元方法，它的逻辑是当访问userdata[key]时，先依次查询之前通过RegisterFunc填充的methods，getters等表中是否存有对应key的包裹方法，如果有则直接使用，如果没有则递归在父类中查找。__newindex元方法是通过调用gen_obj_newindexer获得的，与__index的获得原理类似，这里就不再列出了。
    
    ```
    // xlua.c
    LUA_API int gen_obj_indexer(lua_State *L) {
        lua_pushnil(L);
        lua_pushcclosure(L, obj_indexer, 7);
        return 0;
    }
    
    //upvalue --- [1]: methods, [2]:getters, [3]:csindexer, [4]:base, [5]:indexfuncs, [6]:arrayindexer, [7]:baseindex
    //param   --- [1]: obj, [2]: key
    LUA_API int obj_indexer(lua_State *L) {	
        if (!lua_isnil(L, lua_upvalueindex(1))) {  // 如果methods中有key，则使用methods[key]
            lua_pushvalue(L, 2);
            lua_gettable(L, lua_upvalueindex(1));
            if (!lua_isnil(L, -1)) {//has method
                return 1;
            }
            lua_pop(L, 1);
        }
        
        if (!lua_isnil(L, lua_upvalueindex(2))) {  // 如果getters中key，则调用getters[key]
            lua_pushvalue(L, 2);
            lua_gettable(L, lua_upvalueindex(2));
            if (!lua_isnil(L, -1)) {//has getter
                lua_pushvalue(L, 1);
                lua_call(L, 1, 1);
                return 1;
            }
            lua_pop(L, 1);
        }
        
        
        if (!lua_isnil(L, lua_upvalueindex(6)) && lua_type(L, 2) == LUA_TNUMBER) {  // 如果arrayindexer中有key且key是数字，则调用arrayindexer[key]
            lua_pushvalue(L, lua_upvalueindex(6));
            lua_pushvalue(L, 1);
            lua_pushvalue(L, 2);
            lua_call(L, 2, 1);
            return 1;
        }
        
        if (!lua_isnil(L, lua_upvalueindex(3))) {  // 如果csindexer中有key，则调用csindexer[key]
            lua_pushvalue(L, lua_upvalueindex(3));
            lua_pushvalue(L, 1);
            lua_pushvalue(L, 2);
            lua_call(L, 2, 2);
            if (lua_toboolean(L, -2)) {
                return 1;
            }
            lua_pop(L, 2);
        }
        
        if (!lua_isnil(L, lua_upvalueindex(4))) {  // 递归向上在base中查找
            lua_pushvalue(L, lua_upvalueindex(4));
            while(!lua_isnil(L, -1)) {
                lua_pushvalue(L, -1);
                lua_gettable(L, lua_upvalueindex(5));
                if (!lua_isnil(L, -1)) // found
                {
                    lua_replace(L, lua_upvalueindex(7)); //baseindex = indexfuncs[base]
                    lua_pop(L, 1);
                    break;
                }
                lua_pop(L, 1);
                lua_getfield(L, -1, "BaseType");
                lua_remove(L, -2);
            }
            lua_pushnil(L);
            lua_replace(L, lua_upvalueindex(4));//base = nil
        }
        
        if (!lua_isnil(L, lua_upvalueindex(7))) {  
            lua_settop(L, 2);
            lua_pushvalue(L, lua_upvalueindex(7));  
            lua_insert(L, 1);
            lua_call(L, 2, 1);  // 调用父类的__index，indexfuncs[base](obj, key)
            return 1;
        } else {
            return 0;
        }
    }
    ```
    
4. Utils.BeginClassRegister，在对类的静态值（例如静态变量，静态方法等）进行注册前做一些准备工作。主要是为类生成对应的cls_table表，以及提前创建好static_getter表与static_setter表，后续用来存放静态字段对应的get和set包裹方法。注意这里还会为cls_table设置元表meta_table
    
    ```
    // Utils.cs
    public static void BeginClassRegister(Type type, RealStatePtr L, LuaCSFunction creator, int class_field_count,
        int static_getter_count, int static_setter_count)
    {
        ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
        LuaAPI.lua_createtable(L, 0, class_field_count);
    
        LuaAPI.xlua_pushasciistring(L, "UnderlyingSystemType");
        translator.PushAny(L, type);
        LuaAPI.lua_rawset(L, -3);
    
        int cls_table = LuaAPI.lua_gettop(L);
    
        SetCSTable(L, type, cls_table);
    
        LuaAPI.lua_createtable(L, 0, 3);
        int meta_table = LuaAPI.lua_gettop(L);
        if (creator != null)
        {
            LuaAPI.xlua_pushasciistring(L, "__call");
    #if GEN_CODE_MINIMIZE
            translator.PushCSharpWrapper(L, creator);
    #else
            LuaAPI.lua_pushstdcallcfunction(L, creator);
    #endif
            LuaAPI.lua_rawset(L, -3);
        }
    
        if (static_getter_count == 0)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            LuaAPI.lua_createtable(L, 0, static_getter_count);   // 创建好static_getter表
        }
    
        if (static_setter_count == 0)
        {
            LuaAPI.lua_pushnil(L);
        }
        else
        {
            LuaAPI.lua_createtable(L, 0, static_setter_count);  // 创建好static_setter表
        }
        LuaAPI.lua_pushvalue(L, meta_table);
        LuaAPI.lua_setmetatable(L, cls_table);  // 设置元表
    }
    ```
    
    cls_table表是根据类的命名空间名逐层添加到注册表中的，主要是通过SetCSTable实现。
    
    ```
    // Utils.cs
    public static void SetCSTable(RealStatePtr L, Type type, int cls_table)
    {
        int oldTop = LuaAPI.lua_gettop(L);
        cls_table = abs_idx(oldTop, cls_table);
        LuaAPI.xlua_pushasciistring(L, LuaEnv.CSHARP_NAMESPACE);
        LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
    
        List<string> path = getPathOfType(type);
    
        // 对于A.B.C来说
    
        // for循环处理A.B
        // 1. 注册表[xlua_csharp_namespace][A] = {} 且出栈 注册表[xlua_csharp_namespace]
        // 2. 注册表[xlua_csharp_namespace][A][B] = {} 且出栈 注册表[xlua_csharp_namespace][A]
    
        for (int i = 0; i < path.Count - 1; ++i)
        {
            LuaAPI.xlua_pushasciistring(L, path[i]);
            if (0 != LuaAPI.xlua_pgettable(L, -2))
            {
                var err = LuaAPI.lua_tostring(L, -1);
                LuaAPI.lua_settop(L, oldTop);
                throw new Exception("SetCSTable for [" + type + "] error: " + err);
            }
            if (LuaAPI.lua_isnil(L, -1))  // 如果 注册表[xlua_csharp_namespace] 中没有key path[i] , 则添加一个 path[i] = {} 键值对
            {
                LuaAPI.lua_pop(L, 1);
                LuaAPI.lua_createtable(L, 0, 0);
                LuaAPI.xlua_pushasciistring(L, path[i]);
                LuaAPI.lua_pushvalue(L, -2);
                LuaAPI.lua_rawset(L, -4);
            }
            else if (!LuaAPI.lua_istable(L, -1))
            {
                LuaAPI.lua_settop(L, oldTop);
                throw new Exception("SetCSTable for [" + type + "] error: ancestors is not a table!");
            }
            LuaAPI.lua_remove(L, -2);
        }
    
        // 处理C
        // 注册表[xlua_csharp_namespace][A][B][C] = cls_table 且出栈 [xlua_csharp_namespace][A][B][C]
        LuaAPI.xlua_pushasciistring(L, path[path.Count - 1]);
        LuaAPI.lua_pushvalue(L, cls_table);
        LuaAPI.lua_rawset(L, -3);  
        LuaAPI.lua_pop(L, 1);
    
        // 在 注册表[xlua_csharp_namespace] 中添加键值对 [type对应的lua代理userdata] = cls_table
        LuaAPI.xlua_pushasciistring(L, LuaEnv.CSHARP_NAMESPACE);
        LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
        ObjectTranslatorPool.Instance.Find(L).PushAny(L, type);
        LuaAPI.lua_pushvalue(L, cls_table);
        LuaAPI.lua_rawset(L, -3);
        LuaAPI.lua_pop(L, 1);
    }
    ```
    
    以A.B.C类为例，将在Lua注册表中添加以下表结构，而Lua注册表[xlua_csharp_namespace]实际上对应的就是CS全局表，所以要在xLua中访问C#类时才可以直接使用CS.A.B.C这样的形式
    
    ```
    Lua注册表 = {
        xlua_csharp_namespace = {  -- 就是CS全局表
            A = {
                B = {
                    C = cls_table
                }
            },
        },
    }
    ```
    
5. 多个Utils.RegisterFunc，与BeginObjectRegister到EndObjectRegister之间的RegisterFunc作用相同，将类的每个静态值对应的包裹方法注册到对应的Lua表中。静态变量对应的get和set包裹方法会被分别注册到static_getter表和static_setter表（只读的静态变量除外）
    
6. Utils.EndClassRegister，结束对类的静态值的注册。与EndObjectRegister类似，但它是为cls_table的元表meta_tabl设置__index元方法和__newindex元方法
    
    ```
    // Utils.cs
    public static void EndClassRegister(Type type, RealStatePtr L, ObjectTranslator translator)
    {
        int top = LuaAPI.lua_gettop(L);
        int cls_idx = abs_idx(top, CLS_IDX);
        int cls_getter_idx = abs_idx(top, CLS_GETTER_IDX);
        int cls_setter_idx = abs_idx(top, CLS_SETTER_IDX);
        int cls_meta_idx = abs_idx(top, CLS_META_IDX);
    
        //begin cls index
        LuaAPI.xlua_pushasciistring(L, "__index");
        LuaAPI.lua_pushvalue(L, cls_getter_idx);
        LuaAPI.lua_pushvalue(L, cls_idx);
        translator.Push(L, type.BaseType());
        LuaAPI.xlua_pushasciistring(L, LuaClassIndexsFieldName);
        LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);  
        LuaAPI.gen_cls_indexer(L);
    
        LuaAPI.xlua_pushasciistring(L, LuaClassIndexsFieldName);
        LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);//store in lua indexs function tables  
        translator.Push(L, type);
        LuaAPI.lua_pushvalue(L, -3);
        LuaAPI.lua_rawset(L, -3);  // 注册表[LuaClassIndexs][type] = __index函数
        LuaAPI.lua_pop(L, 1);
    
        LuaAPI.lua_rawset(L, cls_meta_idx);
        //end cls index
    
        //begin cls newindex
        LuaAPI.xlua_pushasciistring(L, "__newindex");
        LuaAPI.lua_pushvalue(L, cls_setter_idx);
        translator.Push(L, type.BaseType());
        LuaAPI.xlua_pushasciistring(L, LuaClassNewIndexsFieldName);
        LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
        LuaAPI.gen_cls_newindexer(L);
    
        LuaAPI.xlua_pushasciistring(L, LuaClassNewIndexsFieldName);
        LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);//store in lua newindexs function tables
        translator.Push(L, type);
        LuaAPI.lua_pushvalue(L, -3);
        LuaAPI.lua_rawset(L, -3);  // 注册表[LuaClassNewIndexs][type] = __newindex函数
        LuaAPI.lua_pop(L, 1);
    
        LuaAPI.lua_rawset(L, cls_meta_idx);
        //end cls newindex
    
        LuaAPI.lua_pop(L, 4);
    }
    ```
    

上述6个部分的代码量比较大，逻辑也比较复杂，到这里有必要做一个总结。

生成代码会为类的非静态值都生成对应的包裹方法，并将包裹方法以 key = func 的形式注册到不同的表中。userdata元表的__index和__newindex负责从这不同的表中找到对应key的包裹方法，最终通过调用包裹方法实现对C#对象的控制

```
-- lua测试代码
local obj = CS.TestXLua()
obj.Name = "test"  -- 赋值操作将触发obj元表的__newindex，__newindex在setter表中找到Name对应的set包裹方法_s_set_Name，然后通过调用_s_set_Name方法设置了TestXLua对象的Name属性为"test"
```

生成代码还会为每个类以命名空间为层次结构生成cls_table表。与类的非静态值相同，生成代码也会为类的静态值都生成对应的包裹方法并注册到不同的表中（注意这里有些区别，类的静态方法会被直接注册到cls_table表中）。而cls_table元表的__index和__newindex负责从这不同的表中找到对应key的包裹方法，最终通过调用包裹方法实现对C#类的控制

```
-- lua测试代码
CS.TestXLua.Test2()  -- CS.TestXLua获取到TestXLua类对应的cls_table，由于Test2是静态方法，在cls_table中可以直接拿到其对应的包裹方法_m_Test2_xlua_st_，然后通过调用_m_Test2_xlua_st_而间接调用了TestXLua类的Test2方法
```

#### 使用反射填充元表

当没有生成代码时，会使用反射进行注册，与生成代码进行注册的逻辑基本相同。通过反射获取到类的各个静态值和非静态值，然后分别注册到不同的表中，以及填充__index和__newindex元方法

```
// Utils.cs
public static void ReflectionWrap(RealStatePtr L, Type type, bool privateAccessible)
{
    LuaAPI.lua_checkstack(L, 20);

    int top_enter = LuaAPI.lua_gettop(L);
    ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
    //create obj meta table
    LuaAPI.luaL_getmetatable(L, type.FullName);
    if (LuaAPI.lua_isnil(L, -1))
    {
        LuaAPI.lua_pop(L, 1);
        LuaAPI.luaL_newmetatable(L, type.FullName);
    }
    // 为元表添加xlua_tag标志
    LuaAPI.lua_pushlightuserdata(L, LuaAPI.xlua_tag());
    LuaAPI.lua_pushnumber(L, 1);
    LuaAPI.lua_rawset(L, -3);  // 元表[xlua_tag] = 1
    int obj_meta = LuaAPI.lua_gettop(L);  

    LuaAPI.lua_newtable(L);
    int cls_meta = LuaAPI.lua_gettop(L);

    LuaAPI.lua_newtable(L);
    int obj_field = LuaAPI.lua_gettop(L);
    LuaAPI.lua_newtable(L);
    int obj_getter = LuaAPI.lua_gettop(L);
    LuaAPI.lua_newtable(L);
    int obj_setter = LuaAPI.lua_gettop(L);
    LuaAPI.lua_newtable(L);
    int cls_field = LuaAPI.lua_gettop(L);
    //set cls_field to namespace
    SetCSTable(L, type, cls_field);
    //finish set cls_field to namespace
    LuaAPI.lua_newtable(L);
    int cls_getter = LuaAPI.lua_gettop(L);
    LuaAPI.lua_newtable(L);
    int cls_setter = LuaAPI.lua_gettop(L);

    LuaCSFunction item_getter;
    LuaCSFunction item_setter;
    makeReflectionWrap(L, type, cls_field, cls_getter, cls_setter, obj_field, obj_getter, obj_setter, obj_meta,
        out item_getter, out item_setter, privateAccessible ? (BindingFlags.Public | BindingFlags.NonPublic) : BindingFlags.Public);

    // init obj metatable
    LuaAPI.xlua_pushasciistring(L, "__gc");
    LuaAPI.lua_pushstdcallcfunction(L, translator.metaFunctions.GcMeta);
    LuaAPI.lua_rawset(L, obj_meta);

    LuaAPI.xlua_pushasciistring(L, "__tostring");
    LuaAPI.lua_pushstdcallcfunction(L, translator.metaFunctions.ToStringMeta);
    LuaAPI.lua_rawset(L, obj_meta);

    LuaAPI.xlua_pushasciistring(L, "__index");
    LuaAPI.lua_pushvalue(L, obj_field);  // 1.upvalue methods = obj_field
    LuaAPI.lua_pushvalue(L, obj_getter);  // 2.upvalue getters = obj_getter
    translator.PushFixCSFunction(L, item_getter);  // 3.upvalue csindexer = item_getter
    translator.PushAny(L, type.BaseType());  // 压入BaseType，4.upvalue base
    LuaAPI.xlua_pushasciistring(L, LuaIndexsFieldName);
    LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);  // 5.upvalue indexfuncs = 注册表[LuaIndexs]
    LuaAPI.lua_pushnil(L);  // 6.upvalue arrayindexer = nil
    LuaAPI.gen_obj_indexer(L);  // 生成__index函数
    //store in lua indexs function tables
    LuaAPI.xlua_pushasciistring(L, LuaIndexsFieldName);
    LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);  
    translator.Push(L, type);  // 压入type
    LuaAPI.lua_pushvalue(L, -3);
    LuaAPI.lua_rawset(L, -3);  // 注册表[LuaIndexs][type] = __index函数
    LuaAPI.lua_pop(L, 1);
    LuaAPI.lua_rawset(L, obj_meta); // set __index  即 obj_meta["__index"] = 生成的__index函数

    LuaAPI.xlua_pushasciistring(L, "__newindex");
    LuaAPI.lua_pushvalue(L, obj_setter);
    translator.PushFixCSFunction(L, item_setter);
    translator.Push(L, type.BaseType());
    LuaAPI.xlua_pushasciistring(L, LuaNewIndexsFieldName);
    LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
    LuaAPI.lua_pushnil(L);
    LuaAPI.gen_obj_newindexer(L);
    //store in lua newindexs function tables
    LuaAPI.xlua_pushasciistring(L, LuaNewIndexsFieldName);
    LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
    translator.Push(L, type);
    LuaAPI.lua_pushvalue(L, -3);
    LuaAPI.lua_rawset(L, -3);  // 注册表[LuaNewIndexs][type] = __newindex函数
    LuaAPI.lua_pop(L, 1);
    LuaAPI.lua_rawset(L, obj_meta); // set __newindex
                                    //finish init obj metatable

    LuaAPI.xlua_pushasciistring(L, "UnderlyingSystemType");
    translator.PushAny(L, type);
    LuaAPI.lua_rawset(L, cls_field);  // cls_field["UnderlyingSystemType"] = type  ， 记录类的基础类型

    if (type != null && type.IsEnum())
    {
        LuaAPI.xlua_pushasciistring(L, "__CastFrom");
        translator.PushFixCSFunction(L, genEnumCastFrom(type));
        LuaAPI.lua_rawset(L, cls_field);
    }

    //init class meta
    LuaAPI.xlua_pushasciistring(L, "__index");
    LuaAPI.lua_pushvalue(L, cls_getter);
    LuaAPI.lua_pushvalue(L, cls_field);
    translator.Push(L, type.BaseType());
    LuaAPI.xlua_pushasciistring(L, LuaClassIndexsFieldName);
    LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
    LuaAPI.gen_cls_indexer(L);
    //store in lua indexs function tables
    LuaAPI.xlua_pushasciistring(L, LuaClassIndexsFieldName);
    LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
    translator.Push(L, type);
    LuaAPI.lua_pushvalue(L, -3);
    LuaAPI.lua_rawset(L, -3);  // 注册表[LuaClassIndexs][type] = __index函数
    LuaAPI.lua_pop(L, 1);
    LuaAPI.lua_rawset(L, cls_meta); // set __index 

    LuaAPI.xlua_pushasciistring(L, "__newindex");
    LuaAPI.lua_pushvalue(L, cls_setter);
    translator.Push(L, type.BaseType());
    LuaAPI.xlua_pushasciistring(L, LuaClassNewIndexsFieldName);
    LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
    LuaAPI.gen_cls_newindexer(L);
    //store in lua newindexs function tables
    LuaAPI.xlua_pushasciistring(L, LuaClassNewIndexsFieldName);
    LuaAPI.lua_rawget(L, LuaIndexes.LUA_REGISTRYINDEX);
    translator.Push(L, type);
    LuaAPI.lua_pushvalue(L, -3);
    LuaAPI.lua_rawset(L, -3);  // // 注册表[LuaClassNewIndexs][type] = __newindex函数
    LuaAPI.lua_pop(L, 1);
    LuaAPI.lua_rawset(L, cls_meta); // set __newindex
    // ...
}
```

### 调用C#方法时参数的传递

先来解决前面遗留的一个问题，对于类的静态值或是非静态值为什么都需要生成对应的包裹方法？其实包裹方法就是用来处理参数传递问题的。

为了正确的和Lua通讯，C函数已经定义好了协议。这个协议定义了参数以及返回值传递方法：C函数通过Lua中的栈来接受参数，参数以正序入栈（第一个参数首先入栈）。因此，当函数开始的时候，lua_gettop(L)可以返回函数收到的参数个数。第一个参数（如果有的话）在索引1的地方，而最后一个参数在索引lua_gettop(L)处。当需要向Lua返回值的时候，C函数只需要把它们以正序压到堆栈上（第一个返回值最先压入），然后返回这些返回值的个数。在这些返回值之下的，堆栈上的东西都会被Lua丢掉。和Lua函数一样，从Lua中调用C函数可以有很多返回值。

也就是说，Lua这边调用C函数时的参数会被自动的压栈，这套机制Lua内部已经实现好了。文章开头也提到，C#可以借助C/C++来与Lua进行数据通信，所以C#需要通过C API获取到Lua传递过来的参数，而这个逻辑就被封装在了包裹方法中。以TestXLua的Test1方法为例，它需要一个int参数。所以它的包裹方法需要通过C API获取到一个int参数，然后再使用这个参数去调用真正的方法

```
[MonoPInvokeCallbackAttribute(typeof(LuaCSFunction))]
static int _m_Test1(RealStatePtr L)
{
    try {
        ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
        TestXLua gen_to_be_invoked = (TestXLua)translator.FastGetCSObj(L, 1);
        {
            int _a = LuaAPI.xlua_tointeger(L, 2);  // 获取到int参数
            gen_to_be_invoked.Test1( _a );  // 调用真正的Test1方法
            return 0;
        }
    } catch(System.Exception gen_e) {
        return LuaAPI.luaL_error(L, "c# exception:" + gen_e);
    }
}
```

这也解释了为什么需要为类的属性生成对应的get和set方法，因为只有将Lua的访问或赋值操作转换成函数调用形式时，参数才能利用函数调用机制被自动的压栈，从而传递给C#

```
-- lua测试代码
obj.Name = "test"  -- 赋值操作
setter["Name"]("test")  -- 函数调用形式
```

这里再提一下函数重载的问题，因为C#是支持重载的，所以会存在多个同名函数，但参数不同的情况。对于这种情况，只能通过同名函数被调用时传递的参数情况来判断到底应该调用哪个函数

```
[LuaCallCSharp]
public class TestXLua
{
    // 函数重载Test1
    public void Test1(int a){
    }
    // 函数重载Test1
    public void Test1(bool b){
    }
}

// 为Test1生成的包裹方法
[MonoPInvokeCallbackAttribute(typeof(LuaCSFunction))]
static int _m_Test1(RealStatePtr L)
{
    try {
        ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
        TestXLua gen_to_be_invoked = (TestXLua)translator.FastGetCSObj(L, 1);
        int gen_param_count = LuaAPI.lua_gettop(L);
        if(gen_param_count == 2&& LuaTypes.LUA_TNUMBER == LuaAPI.lua_type(L, 2))  // 根据参数数量与类型判断调用哪个方法
        {
            int _a = LuaAPI.xlua_tointeger(L, 2);
            gen_to_be_invoked.Test1( _a );
            return 0;
        }
        if(gen_param_count == 2&& LuaTypes.LUA_TBOOLEAN == LuaAPI.lua_type(L, 2))  // 根据参数数量与类型判断调用哪个方法
        { 
            bool _b = LuaAPI.lua_toboolean(L, 2);
            gen_to_be_invoked.Test1( _b );
            return 0;
        }
    } catch(System.Exception gen_e) {
        return LuaAPI.luaL_error(L, "c# exception:" + gen_e);
    }
    return LuaAPI.luaL_error(L, "invalid arguments to TestXLua.Test1!");
}
```

### GC

C#和Lua都是有自动垃圾回收机制的，并且相互是无感知的。如果传递到Lua的C#对象被C#自动回收掉了，而Lua这边仍毫不知情继续使用，则必然会导致无法预知的错误。所以基本原则是传递到Lua的C#对象，C#不能自动回收，只能Lua在确定不再使用后通知C#进行回收

为了保证C#不会自动回收对象，所有传递给Lua的对象都会被objects保持引用。真实传递给Lua的对象索引就是对象在objects中的索引

Lua这边为对象索引建立的userdata会被保存在缓存表中，而缓存表的引用模式被设置为弱引用

```
// ObjectTranslator.cs
LuaAPI.lua_newtable(L);  // 创建缓存表
LuaAPI.lua_newtable(L);  // 创建元表
LuaAPI.xlua_pushasciistring(L, "__mode");
LuaAPI.xlua_pushasciistring(L, "v");
LuaAPI.lua_rawset(L, -3);  // 元表[__mode] = v，表示这张表的所有值皆为弱引用
LuaAPI.lua_setmetatable(L, -2);  // 为缓存表设置元表
cacheRef = LuaAPI.luaL_ref(L, LuaIndexes.LUA_REGISTRYINDEX);
```

当Lua这边不再引用这个userdata时，userdata会被从缓存表中移除，Lua GC时会回收这个userdata，回收之前又会调用userdata元表的__gc方法，以此来通知C#，"我Lua这边不再使用这个对象了，你该回收可以回收了"。在BeginObjectRegister方法内部，会为userdata的元表添加__gc方法

```
// Utils.cs BeginObjectRegister方法
if ((type == null || !translator.HasCustomOp(type)) && type != typeof(decimal))
{
    LuaAPI.xlua_pushasciistring(L, "__gc");
    LuaAPI.lua_pushstdcallcfunction(L, translator.metaFunctions.GcMeta);
    LuaAPI.lua_rawset(L, -3);  // 为元表设置__gc方法
}
```

translator.metaFunctions.GcMeta实际上就是StaticLuaCallbacks的LuaGC方法

```
// StaticLuaCallbacks.cs
[MonoPInvokeCallback(typeof(LuaCSFunction))]
public static int LuaGC(RealStatePtr L)
{
    try
    {
        int udata = LuaAPI.xlua_tocsobj_safe(L, 1);
        if (udata != -1)
        {
            ObjectTranslator translator = ObjectTranslatorPool.Instance.Find(L);
            if ( translator != null )
            {
                translator.collectObject(udata);
            }
        }
        return 0;
    }
    catch (Exception e)
    {
        return LuaAPI.luaL_error(L, "c# exception in LuaGC:" + e);
    }
}
```

LuaGC方法又会调用collectObject方法。在collectObject方法内部会将对象从objects移除，从而使对象不再被固定引用，能够被C# GC正常回收

```
// ObjectTranslator.cs
internal void collectObject(int obj_index_to_collect)
{
    object o;
    
    if (objects.TryGetValue(obj_index_to_collect, out o))
    {
        objects.Remove(obj_index_to_collect);
        
        if (o != null)
        {
            int obj_index;
            //lua gc是先把weak table移除后再调用__gc，这期间同一个对象可能再次push到lua，关联到新的index
            bool is_enum = o.GetType().IsEnum();
            if ((is_enum ? enumMap.TryGetValue(o, out obj_index) : reverseMap.TryGetValue(o, out obj_index))
                && obj_index == obj_index_to_collect)
            {
                if (is_enum)
                {
                    enumMap.Remove(o);
                }
                else
                {
                    reverseMap.Remove(o);
                }
            }
        }
    }
}
```

### 参考

- [添加了中文注释的xLua源码](https://github.com/iwiniwin/source-code/tree/master/xLua)
- [注册C#类到Lua中后Lua注册表的模拟结构](https://github.com/iwiniwin/source-code/blob/master/xLua/Assets/XLua/Doc/lua_registry.lua)
- [看懂Xlua实现原理](https://blog.csdn.net/zhongjiezhesyt/article/details/106585594)