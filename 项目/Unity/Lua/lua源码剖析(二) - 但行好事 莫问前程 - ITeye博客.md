---
link: https://www.iteye.com/blog/simohayha-540546
excerpt: "这次紧接着上次的，将gc类型的数据分析完毕。   谢谢老朱同学的指正,这里CClosure和LClosure理解有误.   先来看闭包:  \
  可以看到闭包也是会有两种类型，这是因为在lua中，函数不过是一种特殊的闭包而已。  更新:这里CClosure表示是c函数,也就是和lua外部交互传递进来\
  的c函数以及内部所使用的c函数.  LClosure表示lua的函数,这些函数是由lua虚拟机进行管理的.. ..."
tags:
  - slurp/Lua
  - slurp/C
  - slurp/lua
slurped: 2025-03-15T15:39
title: lua源码剖析(二) - 但行好事 莫问前程 - ITeye博客
---

这次紧接着上次的，将gc类型的数据分析完毕。
谢谢[老朱](http://www.zhuzhaoyuan.com/)同学的指正,这里CClosure和LClosure理解有误.
先来看闭包：
可以看到闭包也是会有两种类型，这是因为在lua中，函数不过是一种特殊的闭包而已。
<font color="#c00000">更新：这里CClosure表示是c函数,也就是和lua外部交互传递进来的c函数以及内部所使用的c函数.</font>
<font color="#c00000">LClosure表示lua的函数,这些函数是由lua虚拟机进行管理的..</font>
```java
typedef union Closure {
  CClosure c;
  LClosure l;
} Closure;
```

接下来来看这个两个结构。
在看着两个结构之前，先来看宏ClosureHeader，这个也就是每个闭包(函数的头).它包括了一些全局的东西：
<font color="#c00000">更新 :  </font>
<font color="#c00000">isC:如果是c函数这个值为1,为lua的函数则为0.  </font>
nupvalues:表示upvalue或者upvals的大小(闭包和函数里面的)。  
gclist:链接到全局的gc链表。  
env:环境，可以看到它是一个table类型的，他里面保存了一些全局变量等。
```java
#define ClosureHeader \
	CommonHeader; lu_byte isC; lu_byte nupvalues; GCObject *gclist; \
	struct Table *env
```

ok接下来先来看 CClosure的实现.他很简单,就是保存了一个函数原型,以及一个参数列表

<font color="#c00000">更新:  </font>
<font color="#c00000">lua_CFunction f: 这个表示所要执行的c函数的原型.  </font>
<font color="#c00000">TValue upvalue[1]:这个表示函数运行所需要的一些参数(比如string 的match函数,它所需要的几个参数都会保存在upvalue里面</font>
```java
typedef struct CClosure {
  ClosureHeader;
  lua_CFunction f;
  TValue upvalue[1];
} CClosure;
```
<font color="#c00000">更新:  </font>
<font color="#c00000">这里我们只简要的介绍CClosure，主要精力我们还是放在LClosure上。我来简要介绍下CClosure 的操作。一般当我们将CClosure 压栈，然后还有一些对应的调用函数f所需要的一些参数，此时我们会将参数都放到upvalue中，然后栈中只保存cclosure本身，这样当我们调用函数的时候（有一个全局的指针指向当前的调用函数），能够直接得到所需参数,然后调用函数。</font>
```java
LUA_API void lua_pushcclosure (lua_State *L, lua_CFunction fn, int n) {
  Closure *cl;
  lua_lock(L);
  luaC_checkGC(L);
  api_checknelems(L, n);
///new一个cclosure
  cl = luaF_newCclosure(L, n, getcurrenv(L));
  cl->c.f = fn;
  L->top -= n;
///开始将参数值放到upvalue中.
  while (n--)
    setobj2n(L, &cl->c.upvalue[n], L->top+n);
  setclvalue(L, L->top, cl);
  lua_assert(iswhite(obj2gco(cl)));
  api_incr_top(L);
  lua_unlock(L);
}
```

然后来看LClosure 的实现。
在lua中闭包和函数是原型是一样的,只不过函数的upvalue为空罢了,而闭包upvalue包含了它所需要的局部变量值.
这里我们要知道在lua中闭包的实现。Lua 用一种称为upvalue 的结构来实现闭包。对任何外层局部变量的存取间接地通过upvalue来进行，也就是说当函数创建的时候会有一个局部变量表upvals（下面会介绍到).然后当闭包创建完毕，它就会复制upvals的值到upvalue。详细的描述可以看the implementation of lua 5.0(云风的blog上有提供下载).
```java
struct Proto *p：这个指针包含了很多的属性，比如变量，比如嵌套函数等等。  
UpVal *upvals[1]：这个数组保存了指向外部的变量也就是我们闭包所需要的局部变量。

下面会详细分析这个东西。

typedef struct LClosure {
  ClosureHeader;
  struct Proto *p;
  UpVal *upvals[1];
} LClosure;

这里我摘录一段the implementation of lua 5.0里面的描述：

引用

通过为每个变量至少创建一个upvalue 并按所需情况进行重复利用，保证了未决状态（是否超过生存期）的局部变量（pending vars）能够在闭包间正确地  
共享。为了保证这种唯一性，Lua 为整个运行栈保存了一个链接着所有正打开着  
的upvalue（那些当前正指向栈内局部变量的upvalue）的链表（图4 中未决状态  
的局部变量的链表）。当Lua 创建一个新的闭包时，它开始遍历所有的外层局部  
变量，对于其中的每一个，若在上述upvalue 链表中找到它，就重用此upvalue，  
否则，Lua 将创建一个新的upvalue 并加入链表中。注意，一般情况下这种遍历  
过程在探查了少数几个节点后就结束了，因为对于每个被内层函数用到的外层局  
部变量来说，该链表至少包含一个与其对应的入口（upvalue）。一旦某个关闭的  
upvalue 不再被任何闭包所引用，那么它的存储空间就立刻被回收。

下面是示意图：

![](http://dl.iteye.com/upload/attachment/176044/f558a896-89f0-321a-a9da-8fd1adb76467.jpg)

这里的未决状态（是否超过生存期）的局部变量指的就是我们下面的UpVal，其中：  
TValue *v:指向栈内的自己的位置或者自己(这里根据是否这个uvalue被关闭）。  
union u:这里可以看到如果是被关闭则直接保存value。如果打开则为一个链表。

typedef struct UpVal {
  CommonHeader;
  TValue *v;  /* points to stack or to its own value */
  union {
    TValue value;  /* the value (when closed) */
    struct {  /* double linked list (when open) */
      struct UpVal *prev;
      struct UpVal *next;
    } l;
  } u;
} UpVal;

然后来看luaF_newLclosure的实现，它与cclosure类似。

Closure *luaF_newLclosure (lua_State *L, int nelems, Table *e) {
  Closure *c = cast(Closure *, luaM_malloc(L, sizeLclosure(nelems)));
  luaC_link(L, obj2gco(c), LUA_TFUNCTION);
  c->l.isC = 0;
  c->l.env = e;
///更新upvals。
  c->l.nupvalues = cast_byte(nelems);
  while (nelems--) c->l.upvals[nelems] = NULL;
  return c;
}

ok，接下来我们就通过一些函数来更详细的理解闭包的实现。

先分析CClosure。我们来看luaF_newCclosure的实现，这个函数创建一个CClosure,也就是创建一个所需要执行的c函数.

这个函数实现比较简单，就是malloc一个Closure，然后链接到全局gc，最后初始化Closure 。

Closure *luaF_newCclosure (lua_State *L, int nelems, Table *e) {
///分配内存
  Closure *c = cast(Closure *, luaM_malloc(L, sizeCclosure(nelems)));
///链接到全局的gc链表
  luaC_link(L, obj2gco(c), LUA_TFUNCTION);
///开始初始化。
  c->c.isC = 1;
  c->c.env = e;
  c->c.nupvalues = cast_byte(nelems);
  return c;
}

在lua_State中它里面包含有GCObject 类型的域叫openupval，这个域也就是当前的栈上的所有open的uvalue。可以看到这里是gcobject类型的，这里我们就知道为什么gcobvject中为什么还要包含struct UpVal uv了。而在global_State中的UpVal uvhead则是整个lua虚拟机里面所有栈的upvalue链表的头。

然后我们来看lua中如何new一个upval。

它很简单就是malloc一个UpVal然后链接到gc链表里面。这边要注意，每次new的upval都是close的。

UpVal *luaF_newupval (lua_State *L) {
///new一个upval
  UpVal *uv = luaM_new(L, UpVal);
///链接到全局的gc中
  luaC_link(L, obj2gco(uv), LUA_TUPVAL);
///可以看到这里的upval是close的。
  uv->v = &uv->u.value;
  setnilvalue(uv->v);
  return uv;
}

接下来我们来看闭包如何来查找到对应的upval，所有的实现就在函数luaF_findupval中。我们接下来来看这个函数的实现。  
这个函数的流程是这样的。

1 首先遍历lua_state的openupval，也就是当前栈的upval，然后如果能找到对应的值，则直接返回这个upval。

2 否则新建一个upval（这里注意new的是open的)，然后链接到openupval以及uvhead中。而且每次新的upval的插入都是插入到链表头的。而且这里插入了两次。这里为什么要有两个链表，那是因为有可能会有多个栈，而uvhead就是用来管理多个栈的upvalue的（也就是多个openupval)。

UpVal *luaF_findupval (lua_State *L, StkId level) {
  global_State *g = G(L);
///得到openupval链表
  GCObject **pp = &L->openupval;
  UpVal *p;
  UpVal *uv;
///开始遍历open upvalue。
  while (*pp != NULL && (p = ngcotouv(*pp))->v >= level) {
    lua_assert(p->v != &p->u.value);
///发现已存在。
    if (p->v == level) {  
      if (isdead(g, obj2gco(p)))  /* is it dead? */
        changewhite(obj2gco(p));  /* ressurect it */
///直接返回
      return p;
    }
    pp = &p->next;
  }
///否则new一个新的upvalue
  uv = luaM_new(L, UpVal);  /* not found: create a new one */
  uv->tt = LUA_TUPVAL;
  uv->marked = luaC_white(g);
///设置值
  uv->v = level;  /* current value lives in the stack */
///首先插入到lua_state的openupval域
  uv->next = *pp;  /* chain it in the proper position */
  *pp = obj2gco(uv);
///然后插入到global_State的uvhead（这个也就是双向链表的头)
  uv->u.l.prev = &g->uvhead;  /* double link it in `uvhead' list */
  uv->u.l.next = g->uvhead.u.l.next;
  uv->u.l.next->u.l.prev = uv;
  g->uvhead.u.l.next = uv;
  lua_assert(uv->u.l.next->u.l.prev == uv && uv->u.l.prev->u.l.next == uv);
  return uv;
}

更新:  
上面可以看到我们new的upvalue是open的,那么什么时候我们关闭这个upvalue呢,当函数关闭的时候,我们就会unlink掉upvalue,从全局的open upvalue表中:

void luaF_close (lua_State *L, StkId level) {
  UpVal *uv;
  global_State *g = G(L);
///开始遍历open upvalue
  while (L->openupval != NULL && (uv = ngcotouv(L->openupval))->v >= level) {
    GCObject *o = obj2gco(uv);
    lua_assert(!isblack(o) && uv->v != &uv->u.value);
    L->openupval = uv->next;  /* remove from `open' list */
    if (isdead(g, o))
      luaF_freeupval(L, uv);  /* free upvalue */
    else {
///unlink掉当前的uv.
      unlinkupval(uv);
      setobj(L, &uv->u.value, uv->v);
      uv->v = &uv->u.value;  /* now current value lives here */
      luaC_linkupval(L, uv);  /* link upvalue into `gcroot' list */
    }
  }
}

static void unlinkupval (UpVal *uv) {
  lua_assert(uv->u.l.next->u.l.prev == uv && uv->u.l.prev->u.l.next == uv);
  uv->u.l.next->u.l.prev = uv->u.l.prev;  /* remove from `uvhead' list */
  uv->u.l.prev->u.l.next = uv->u.l.next;
}

接下来来看user data。这里首先我们要知道，在lua中，创建一个userdata，其实也就是分配一块内存紧跟在Udata的后面。后面我们分析代码的时候就会看到。也就是说Udata相当于一个头。

typedef union Udata {
  L_Umaxalign dummy;  
  struct {
///gc类型的都会包含这个头，前面已经描述过了。
    CommonHeader;
///元标
    struct Table *metatable;
///环境
    struct Table *env;
///当前user data的大小。
    size_t len;
  } uv;
} Udata;

ok，接下来我们来看代码，我们知道调用lua_newuserdata能够根据指定大小分配一块内存，并将对应的userdata压入栈。

这里跳过了一些代码，跳过的代码以后会分析到。

LUA_API void *lua_newuserdata (lua_State *L, size_t size) {
  Udata *u;
  lua_lock(L);
  luaC_checkGC(L);
///new一个新的user data，然后返回地址
  u = luaS_newudata(L, size, getcurrenv(L));
///将u压入压到栈中。
  setuvalue(L, L->top, u);
///更新栈顶指针
  api_incr_top(L);
  lua_unlock(L);
///返回u+1,也就是去掉头(Udata)然后返回。
  return u + 1;
}

我们可以看到具体的实现都包含在luaS_newudata中，这个函数也满简单的，malloc一个size+sizeof(Udata)的内存，然后初始化udata。

我们还要知道在全局状态，也就是global_State中包含一个struct lua_State *mainthread，这个主要是用来管理userdata的。它也就是表示当前的栈，因此下面我们会将新建的udata链接到它上面。

Udata *luaS_newudata (lua_State *L, size_t s, Table *e) {
  Udata *u;

///首先检测size，userdata是由大小限制的。
  if (s > MAX_SIZET - sizeof(Udata))
    luaM_toobig(L);
///然后malloc一块内存。
  u = cast(Udata *, luaM_malloc(L, s + sizeof(Udata)));
///这里gc相关的东西，以后分析gc时再说。
  u->uv.marked = luaC_white(G(L));  /* is not finalized */
///设置类型
  u->uv.tt = LUA_TUSERDATA;

///设置当前udata大小
  u->uv.len = s;
  u->uv.metatable = NULL;
  u->uv.env = e;
  /* chain it on udata list (after main thread) */
///然后链接到mainthread中
  u->uv.next = G(L)->mainthread->next;
  G(L)->mainthread->next = obj2gco(u);

///然后返回。
  return u;
}

还剩下两个gc类型，一个是proto(函数包含的一些东西)一个是lua_State（也就是协程).

我们来简单看一下lua_state,顾名思义，它就代表了状态，一个lua栈(或者叫做线程也可以)，每次c与lua交互都会新建一个lua_state,然后才能互相通过交互。可以看到在new state的时候它的tt就是LUA_TTHREAD。

并且每个协程也都有自己独立的栈。

我们就来看下我们前面已经触及到的一些lua-state的域：

struct lua_State {
  CommonHeader;
 
///栈相关的
  StkId top;  /* first free slot in the stack */
  StkId base;  /* base of current function */
  StkId stack_last;  /* last free slot in the stack */
  StkId stack;  /* stack base */
///指向全局的状态。
  global_State *l_G;

///函数相关的
  CallInfo *ci;  /* call info for current function */
  const Instruction *savedpc;  /* `savedpc' of current function */
  CallInfo *end_ci;  /* points after end of ci array*/
  CallInfo *base_ci;  /* array of CallInfo's */
  lu_byte status;
///一些要用到的len，栈大小，c嵌套的数量，等。
  int stacksize;
  int size_ci;  /* size of array `base_ci' */
  unsigned short nCcalls;  /* number of nested C calls */
  unsigned short baseCcalls;  /* nested C calls when resuming coroutine */
  lu_byte hookmask;
  lu_byte allowhook;
  int basehookcount;
  int hookcount;
  lua_Hook hook;

///一些全局(这个状态)用到的东西，比如env等。
  TValue l_gt;  /* table of globals */
  TValue env;  /* temporary place for environments */

///gc相关的东西。
  GCObject *openupval;  /* list of open upvalues in this stack */
  GCObject *gclist;

///错误处理相关。
  struct lua_longjmp *errorJmp;  /* current error recover point */
  ptrdiff_t errfunc;  /* current error handling function (stack index) */
};

而global_State主要就是包含了gc相关的东西。

现在基本类型的分析就告一段落了，等到后面分析parse以及gc的时候会再回到这些类型。

分享到： ![](https://www.iteye.com/images/sina.jpg) ![](https://www.iteye.com/images/tec.jpg)

- 2009-12-04 00:22
- 浏览 8133
- [评论(1)](https://www.iteye.com/blog/simohayha-540546#comments)
- 分类:[编程语言](https://www.iteye.com/blogs/category/language)
- [查看更多](https://www.iteye.com/wiki/blog/540546)