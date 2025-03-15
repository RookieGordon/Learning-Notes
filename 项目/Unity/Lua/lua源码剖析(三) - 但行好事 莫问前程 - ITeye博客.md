---
link: https://www.iteye.com/blog/simohayha-552391
excerpt: 这次简单的补充一下前面类型部分剩下的东西。  首先我们要知道当我们想为lua来编写扩展的时候，有时候可能需要一些全局变量。可是这样会有问题，这是因为这样的话，我们就无法用于多个lua状态(也就是new
  多个state).  于是lua提供了三种可以代替全局变量的方法。分别是注册表，环境变量和upvalue。  其中注册表和环境变量都是table。而upvalue也就是我们前面介绍的用来和指定函数关联
  ...
tags:
  - slurp/Lua
  - slurp/C
  - slurp/lua
slurped: 2025-03-15T15:39
title: lua源码剖析(三) - 但行好事 莫问前程 - ITeye博客
---
这次简单的补充一下前面类型部分剩下的东西。

首先我们要知道当我们想为lua来编写扩展的时候，有时候可能需要一些全局变量。可是这样会有问题，这是因为这样的话，我们就无法用于多个lua状态(也就是new 多个state).

于是lua提供了三种可以代替全局变量的方法。分别是注册表，环境变量和upvalue。

其中注册表和环境变量都是table。而upvalue也就是我们前面介绍的用来和指定函数关联的一些值。

由于lua统一了从虚拟的栈上存取数据的接口，而这三个值其实并不是在栈上保存，而lua为了统一接口，通过伪索引来存取他们。接下来我们就会通过函数index2adr的代码片断来分析这三个类型。

其实还有一种也是伪索引来存取的，那就是全局状态。也就是state的l_gt域。

ok，我们来看这几种伪索引的表示，每次传递给index2adr的索引就是下面这几个：
```java
#define LUA_REGISTRYINDEX	(-10000)
#define LUA_ENVIRONINDEX	(-10001)
#define LUA_GLOBALSINDEX	(-10002)

///这个就是来存取upvalue。
#define lua_upvalueindex(i)	(LUA_GLOBALSINDEX-(i))
```

来看代码,这个函数我们前面有分析过，只不过跳过了伪索引这部分，现在我们来看剩下的部分。

其实很简单，就是通过传递进来的index来确定该到哪部分处理。

这里他们几个处理有些不同，这是因为注册表是全局的（不同模块也能共享)，环境变量可以是整个lua_state共享，也可以只是这个函数所拥有。而upvalue只能属于某个函数。

看下它们所在的位置，他们的作用域就很一目了然了。

其中注册表包含在global_State中，环境变量 closure和state都有，upvalue只在closure中包含。
```java
static TValue *index2adr (lua_State *L, int idx) {
....................
  else switch (idx) {  /* pseudo-indices */
///注册表读取
    case LUA_REGISTRYINDEX: return registry(L);
///环境变量的存取
    case LUA_ENVIRONINDEX: {
///先得到当前函数
      Closure *func = curr_func(L);
///将当前函数的env设置为整个state的env。这样整个模块都可以共享。
      sethvalue(L, &L->env, func->c.env);
      return &L->env;
    }
///用来取global_State。
    case LUA_GLOBALSINDEX: return gt(L);

///取upvalue
    default: {
///取得当前函数
      Closure *func = curr_func(L);
///转换索引
      idx = LUA_GLOBALSINDEX - idx;
///从upvalue数组中取得对应的值。
      return (idx <= func->c.nupvalues)
                ? &func->c.upvalue[idx-1]
                : cast(TValue *, luaO_nilobject);
    }
  }
}
```
下面就是取得环境变量和注册表的对应的宏。
```java
#define registry(L)	(&G(L)->l_registry)
#define gt(L)	(&L->l_gt)
```
我们一个个的来看，首先是注册表。由于注册表是全局的，所以我们需要很好的选择key，尽量避免冲突，而在选择key中，不能使用数字类型的key，这是因为在lua中，数字类型的key是被引用系统所保留的。

来看引用系统，我们编写lua模块时可以看到所有的值，函数，table，都是在栈上保存着，也就是说它们都是由lua来管理，我们要存取只能通过栈来存取。可是lua为了我们能够在c这边保存一个lua的值的指针，提供了luaL_ref这个函数。

引用也就是在c这边保存lua的值对象。

来看引用的实现，可以看到它是传递LUA_REGISTRYINDEX给luaL_ref函数，也就是说引用也是全局的，保存在注册表中的。
```java
#define lua_ref(L,lock) ((lock) ? luaL_ref(L, LUA_REGISTRYINDEX) : \
      (lua_pushstring(L, "unlocked references are obsolete"), lua_error(L), 0))
```
然后来看它的key的计算。

可以看到当要引用的值是nil时，直接返回LUA_REFNIL这个常量，并不会创建新的引用。

还有一个要注意的就是这里注册表有个FREELIST_REF的key，这个key所保存的值就是我们最后一次unref掉的那个key。我们接下来看luaL_unref的时候会看到。

这里为什么要这么做呢，这是因为在注册表中key是不能重复的，因此这里的key的选择是通过注册表这个table的大小来做key的，而这里每次unref之后我们通过设置t[FREELIST_REF]的值为上一次被unref掉的引用的key。这样当我们再次需要引用的时候，我们就不需要增长table的大小并且也不需要再次计算key，而是直接将上一次被unref掉得key返回就可以了。

而这里上上一次被unref掉得ref的key是被保存在t[ref]中的。我们先来看luaL_unref的实现。
```java
LUALIB_API void luaL_unref (lua_State *L, int t, int ref) {
  if (ref >= 0) {
///取出注册表的table
    t = abs_index(L, t);
///得到t[FREELIST_REF];
    lua_rawgeti(L, t, FREELIST_REF);
///这里可以看到如果再次unref的话t[ref]就保存就的是上上一次的key的值。
    lua_rawseti(L, t, ref);  /* t[ref] = t[FREELIST_REF] */

///将ref压入栈
    lua_pushinteger(L, ref);
///设置t[FREELIST_REF］为ref。
    lua_rawseti(L, t, FREELIST_REF);  /* t[FREELIST_REF] = ref */
  }
}
```

通过上面可以看到lua这里实现得很巧妙，通过表的t[FREELIST_REF]来保存最新的被unref掉得key，t[ref]来保存上一次被unref掉得key.然后我们就可以通过这个递归来得到所有已经被unref掉得key。接下来的luaL_ref就可以清晰的看到这个操作。也就是说t[FREELIST_REF]相当于一个表头。

来看luaL_ref,这个流程很简单，就是先取出注册表的那个table，然后将得到t[FREELIST_REF]来看是否有已经unref掉得key，如果有则进行一系列的操作(也就是上面所说的，将这个ref从freelist中remove，然后设置t[FREELIST_REF]为上上一次unref掉得值(t[ref])),最后设置t[ref]的值。这样我们就不需要遍历链表什么的。

这里要注意就是调用这个函数之前栈的最顶端保存的就是我们要引用的值。
```java
LUALIB_API int luaL_ref (lua_State *L, int t) {
  int ref;
///取得索引
  t = abs_index(L, t);
  if (lua_isnil(L, -1)) {
    lua_pop(L, 1);  /* remove from stack */
///如果为nil，则直接返回LUA_REFNIL.
    return LUA_REFNIL;  
  }
///得到t[FREELIST_REF].
  lua_rawgeti(L, t, FREELIST_REF);
///设置ref = t[FREELIST_REF] 
  ref = (int)lua_tointeger(L, -1); 
///弹出t[FREELIST_REF] 
  lua_pop(L, 1);  /* remove it from stack */

///如果ref不等于0,则说明有已经被unref掉得key。
  if (ref != 0) {  /* any free element? */
///得到t[ref]，这里t[ref]保存就是上上一次被unref掉得那个key。
    lua_rawgeti(L, t, ref);  /* remove it from list */
///设置t[FREELIST_REF] = t[ref],这样当下次再进来，我们依然可以通过freelist来直接返回key。
    lua_rawseti(L, t, FREELIST_REF); 
  }
  else {  /* no free elements */
///这里是通过注册表的大小来得到对应的key
    ref = (int)lua_objlen(L, t);
    ref++;  /* create new reference */
  }

//设置t[ref]=value;
  lua_rawseti(L, t, ref);
  return ref;
}
```
所以我们可以看到我们如果要使用注册表的话，尽量不要使用数字类型的key，不然的话就很容易和引用系统冲突。

不过在PIL中介绍了一个很好的key的选择，那就是使用代码中静态变量的地址（也就是用light userdata)，因为c链接器可以保证key的唯一性。详细的东西可以去看PIL.

然后我们来看LUA_ENVIRONINDEX,环境是可以被整个模块共享的。可以先看PIL中的例子代码：
```java
int luaopen_foo(lua_State *L)
{
     lua_newtable(L);
     lua_replace(L,LUA_ENVIRONIDEX);
     luaL_register(L,<lib name>,<func list>);
..........................................
}
```
可以看到我们一般都是为当前模块创建一个新的table，然后当register注册的所有函数就都能共享这个env了。

来看代码片断，register最终会调用luaI_openlib：
```java
LUALIB_API void luaI_openlib (lua_State *L, const char *libname,const luaL_Reg *l, int nup) {
 ...........................
///遍历模块内的所有函数。
  for (; l->name; l++) {
    int i;
    for (i=0; i<nup; i++)  /* copy upvalues to the top */
      lua_pushvalue(L, -nup);
///这里将函数压入栈，这个函数我们前面分析过，他最终会把当前state的env赋值给新建的closure，也就是说这里最终模块内的所有函数都会共享当前的state的env。
    lua_pushcclosure(L, l->func, nup);
    lua_setfield(L, -(nup+2), l->name);
  }
  lua_pop(L, nup);  /* remove upvalues */
}
```
通过我们一开始分析的代码，我们知道当我们要存取环境的时候每次都是将当前调用的函数的env指针赋值给state的env，然后返回state的env(&L->env)。这是因为state是被整个模块共享的，每个函数修改后必须与state的那个同步。

最后我们来看upvalue。这里指的是c函数的upvalue，我们知道在lua中closure分为两个类型，一个是c函数，一个是lua函数，我们现在主要就是来看c函数。

c函数的upvalue和lua的类似，也就是将我们以后函数调用所需要得一些值保存在upvalue中。

这里一般都是通过lua_pushcclosure这个函数来做的。下面先来看个例子代码：
```java
static int counter(lua_state *L);

int newCounter(lua_State *L)
{
    lua_pushinteger(L,0);
    lua_pushcclosure(L,&counter,1);
    return 1;
}
```

上面的代码很简单，就是先push进去一个整数0,然后再push一个closure，这里closure的第三个参数就是upvalue的个数(这里要注意在lua中的upvalue的个数只有一个字节，因此你太多upvalue会被截断)。

lua_pushcclosure的代码前面已经分析过了，我们这里简单的再介绍一下。

这个函数每次都会新建一个closure，然后将栈上的对应的value拷贝到closure的upvalue中，这里个数就是它的第三个参数来确定的。

而取得upvalue也很简单，就是通过index2adr来计算对应的upvalue中的索引值，最终返回对应的值。

然后我们来看light userdata，这种userdata和前面讲得userdata的区别就是这种userdata的管理是交给c函数这边来管理的。

这个实现很简单，由于它只是一个指针，因此只需要将这个值压入栈就可以了。
```java
LUA_API void lua_pushlightuserdata (lua_State *L, void *p) {
  lua_lock(L);
///设置对应的值。
  setpvalue(L->top, p);
  api_incr_top(L);
  lua_unlock(L);
}
```

最后我们来看元表。我们知道在lua中每个值都有一个元表，而table和userdata可以有自己独立的元表，其他类型的值共享所属类型的元表。在lua中可以使用setmetatable.而在c中我们是通过luaL_newmetatable来创建一个元表。

元表其实也就是保存了一种类型所能进行的操作。

这里要知道在lua中元表是保存在注册表中的。

因此我们来看luaL_newmetatable的实现。  
这里第二个函数就是当前所要注册的元表的名字。这里一般都是类型名字。这个是个key，因此我们一般要小心选择类型名。
```java
LUALIB_API int luaL_newmetatable (lua_State *L, const char *tname) {
///首先从注册表中取得key为tname的元表
  lua_getfield(L, LUA_REGISTRYINDEX, tname);  
///如果存在则失败，返回0
  if (!lua_isnil(L, -1))  /* name already in use? */
    return 0; 
  lua_pop(L, 1);
///创建一个元表
  lua_newtable(L);  /* create metatable */
///压入栈
  lua_pushvalue(L, -1);
///设置注册表中的对应的元表。
  lua_setfield(L, LUA_REGISTRYINDEX, tname);  
  return 1;
}
```
当我们设置完元表之后我们就可以通过调用luaL_checkudata来检测栈上的userdata的元表是否和指定的元表匹配。  
这里第二个参数是userdata的位置，tname是要匹配的元表的名字。

这里我们要知道在lua中，Table和userdata中都包含一个metatable域，这个也就是他们对应的元表，而基本类型的元表是保存在global_State的mt中的。这里mt是一个数组。

这里我们先来看lua_getmetatable,这个函数返回当前值的元表。  
这里代码很简单，就是取值，然后判断类型。最终返回设置元表。
```java
LUA_API int lua_getmetatable (lua_State *L, int objindex) {
  const TValue *obj;
  Table *mt = NULL;
  int res;
  lua_lock(L);
///取得对应索引的值
  obj = index2adr(L, objindex);
///开始判断类型。
  switch (ttype(obj)) {
///table类型
    case LUA_TTABLE:
      mt = hvalue(obj)->metatable;
      break;
///userdata类型
    case LUA_TUSERDATA:
      mt = uvalue(obj)->metatable;
      break;
    default:
///这里是基础类型
      mt = G(L)->mt[ttype(obj)];
      break;
  }
  if (mt == NULL)
    res = 0;
  else {
///设置元表到栈的top
    sethvalue(L, L->top, mt);
    api_incr_top(L);
    res = 1;
  }
  lua_unlock(L);
  return res;
}
```

接下来来看checkudata的实现。他就是取得当前值的元表，然后取得tname对应的元表，最后比较一下。
```java
LUALIB_API void *luaL_checkudata (lua_State *L, int ud, const char *tname) {
  void *p = lua_touserdata(L, ud);
  if (p != NULL) {  /* value is a userdata? */
///首先取得当前值的元表。
    if (lua_getmetatable(L, ud)) { 
///然后取得taname对应的元表。
      lua_getfield(L, LUA_REGISTRYINDEX, tname);  
//比较。
      if (lua_rawequal(L, -1, -2)) {  
        lua_pop(L, 2);  /* remove both metatables */
        return p;
      }
    }
  }
  luaL_typerror(L, ud, tname);  /* else error */
  return NULL;  /* to avoid warnings */
}
```
