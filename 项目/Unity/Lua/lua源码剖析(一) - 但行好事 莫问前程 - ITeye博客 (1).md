---
link: https://www.iteye.com/blog/simohayha-517748
excerpt: "先来看lua中值的表示方式。 #define TValuefields Value value; int tt    typedef
  struct lua_TValue {    TValuefields;  }
  TValue;  其中tt表示类型，value也就是lua中对象的表示。   ..."
tags:
  - slurp/Lua
  - slurp/
  - slurp/Go-lua
slurped: 2025-03-15T15:38
title: lua源码剖析(一) - 但行好事 莫问前程 - ITeye博客
---
先来看lua中值的表示方式。
```JAVA
#define TValuefields Value value; int tt
typedef struct lua_TValue {
  TValuefields;
} TValue;
```
其中tt表示类型，value也就是lua中对象的表示。
```JAVA
typedef union {
  GCObject *gc;
  void *p;
  lua_Number n;
  int b;
} Value;
```
gc用于表示需要垃圾回收的一些值，比如string，table等等。  
p用于表示 light userdata它是不会被gc的。  
n表示double  
b表示boolean

tvalue这样表示会有空间的浪费。可是由于要完全符合c99,因此只能这么做.否则我们为了效率可以这么做.由于在大多数机器上,指针都是严格对齐(4或者8字节对齐).因此后面的2,3位就是0,因此我们可以将类型存储在这几位,从而极大地压缩了Value的大小。

更新：这里经的[老朱](http://www.zhuzhaoyuan.com/)同学的提醒,其实tvalue之所以不使用指针的后几位来存储类型,更重要的时候由于和c的交互.因为那样的话,我们就必须强制和lua交互的c模块也必须保持和我们一样的内存模型了.

lua_state表示一个lua虚拟机，它是per-thread的，也就是一个协程（多个和lua交互的c程序，那自然也会有多个lua-state)一个lua_state，然后来看它的几个比较重要的域：
1. StkId top这个域表示在这个栈上的第一个空闲的slot。  
2. StkId base 这个域表示当前所在函数的base。这个base可以说就是栈底。只不过是当前函数的。
3. StkId stack_last 在栈上的最后一个空闲的slot  
4. StkId stack  栈的base，这个是整个栈的栈底。  
StkId是一个Tvalue类型的指针。

在 lstrlib中，基本上所有的str函数都是首先调用luaL_checklstring来得到所需要处理的字符串然后再进行处理。如果是需要改变字符串的话，那么都会首先生成一个luaL_Buffer对象(主要原因是在lua中，都会做一个传递进来的字符串的副本的)，然后最终将处理的结果通过调用luaL_pushXXX放到栈中。

luaL_checklstring 函数，这个函数只是简单的对lua_tolstring进行了一层简单的封装。而luaL_tolstring也是对index2adr函数做了一层简单封装，然后判断所得到的值是否为字符串，是的话返回字符串，并修改len为字符串长度。
```java
LUALIB_API const char *luaL_checklstring (lua_State *L, int narg, size_t *len) {
///通过luaL_tolstring得到字符串s
  const char *s = lua_tolstring(L, narg, len);
  if (!s) tag_error(L, narg, LUA_TSTRING);
  return s;
}
```
因此我们详细来看index2adr这个函数，这个函数目的很简单，就是通过索引得到对应的值的指针。第一个参数lua_state，第二个参数为索引值。

我们首先要知道在lua中，索引值可以为负数也可以为正数，当为负数的话，top为-1，当为正数第一个压入栈的元素为1,依此类推.

而且有些类型的对象当转换时还需要一些特殊处理，比如闭包中的变量。

除去特殊的，一般的存取很简单，当index>0则我们只需要用base+i -1来取得这个指针，为什么要用base而不是top呢，我们上面已经说过了，当index为正数，所取得的是第一个值，因此也就是栈的最下面那个值，而 base表示当前函数在栈里面的位置，因此我们加上i -1 就可以了。当index<0则更简单，我们用top+index就可以了。
```java
static TValue *index2adr (lua_State *L, int idx) {
  if (idx > 0) {
///索引为正值时，通过base取得value
    TValue *o = L->base + (idx - 1);
    api_check(L, idx <= L->ci->top - L->base);
///如果超过top，则返回nil，否则返回o。
    if (o >= L->top) return cast(TValue *, luaO_nilobject);
    else return o;
  }
  else if (idx > LUA_REGISTRYINDEX) {
///正常的小于0的索引。则直接通过top+idx取得对象。
    api_check(L, idx != 0 && -idx <= L->top - L->base);
    return L->top + idx;
  }
///下面省略的部分是取得闭包以及其他一些类型的值,等我们后面分析完所有类型后，会再次回到这个函数
..............................
}
```
而lmathlib.c中处理数字更简单，因为数字不需要转换，因此基本都是直接调用lua_pushnumber来压入栈。

接下来就来看lua_pushXXX这些函数。这些函数都是用来从C->stack的。
我们先来看不需要gc的类型，不需要gc的类型的话都是比较简单。比如lua_pushinteger.内部实现都是调用setnvalue来将值set进栈顶。
```java
#define setnvalue(obj,x) \
  { TValue *i_o=(obj); i_o->value.n=(x); i_o->tt=LUA_TNUMBER; }
```
可以看到很简单的实现，就是给value赋值，然后给类型也赋值。
而这里我们要知道基本上每个类型都会有一个setXXvalue的宏来设置相应的值。  
这里还要注意一个就是nil值，在lua中，nil有一个专门的类型就是LUA_TNIL,下面就是lua中的值的类型。
```java
#define LUA_TNIL        0
#define LUA_TBOOLEAN        1
#define LUA_TLIGHTUSERDATA    2
#define LUA_TNUMBER        3
#define LUA_TSTRING        4
#define LUA_TTABLE        5
#define LUA_TFUNCTION        6
#define LUA_TUSERDATA        7
#define LUA_TTHREAD        8
```

接下来我们先来看lua中gc的结构，在lua中包括table，string，function等等都是需要gc的。因此gc的union也就包含了这几个类型：
```java
union GCObject {
  GCheader gch;
  union TString ts; /*string*/
  union Udata u;   /*user data*/
  union Closure cl; /* 闭包 */
  struct Table h; /*表*/
  struct Proto p; /*函数*/
  struct UpVal uv;
  struct lua_State th;  /* thread */
};
```

而这里gc的头主要就是用来实现gc算法，它包括了next(指向下一个gc对象),tt 表示类型，marked用来标记这个对象的使用。
```java
#define CommonHeader    GCObject *next; lu_byte tt; lu_byte marked
```

接下来我们就来详细分析下这几种需要gc的类型的结构。

首先来看TSring:
```java
typedef union TString {
  L_Umaxalign dummy;  /* ensures maximum alignment for strings */
  struct {
    CommonHeader;
    lu_byte reserved;
    unsigned int hash;
    size_t len;
  } tsv;
} TString;
```

我们知道在lua中会将字符串通过一定的算法计算出散列值，并保存这个散列值到hash域中，然后以后的操作，都是通过这个散列值来进行操作。

而TSring其实只是字符串的一个头，而字符串的值会紧跟在头的后面，详细可以看newlstr函数。

在lus_state中的global_State *l_G也就是全局状态中有一个 stringtable strt的域，所有的字符串都是保存在这个散列表中。
```java
typedef struct stringtable {
  GCObject **hash;
  lu_int32 nuse;  /* number of elements */
  int size;
} stringtable;
```
可以看到hash也就是保存了所有的字符串。这里size表示为hash桶的大小。

在luaS_newlstr中会先计算字符串的hash值，然后遍历stringtable这个全局hash表，如果查找到对应的字符串就返回ts，否则调用newlstr重新生成一个。

而 newlstr则就是新建一个tsring然后给相应位赋值，然后计算hash值插入到全局的global_State的stringtable中。然后每次都会比较nuse和size的大小，如果大于size则说明碰撞太严重，因此增加桶的大小。这里增加每次都是2的倍数增加。
```java
static TString *newlstr (lua_State *L, const char *str, size_t l,
                                       unsigned int h) {
  TString *ts;
  stringtable *tb;
  if (l+1 > (MAX_SIZET - sizeof(TString))/sizeof(char))
    luaM_toobig(L);
///初始化字符串。
  ts = cast(TString *, luaM_malloc(L, (l+1)*sizeof(char)+sizeof(TString)));
  ts->tsv.len = l;
  ts->tsv.hash = h;
  ts->tsv.marked = luaC_white(G(L));
  ts->tsv.tt = LUA_TSTRING;
  ts->tsv.reserved = 0;
///开始拷贝字符串数据到ts的末尾
  memcpy(ts+1, str, l*sizeof(char));
  ((char *)(ts+1))[l] = '\0';  /* ending 0 */
///取得全局的strtable
  tb = &G(L)->strt;
///计算位置
  h = lmod(h, tb->size);
///链接到相应的位置，并更新nuse。
  ts->tsv.next = tb->hash[h];  /* chain new entry */
  tb->hash[h] = obj2gco(ts);
  tb->nuse++;
///判断是否需要增加桶的大小
  if (tb->nuse > cast(lu_int32, tb->size) && tb->size <= MAX_INT/2)
    luaS_resize(L, tb->size*2);  /* too crowded */
  return ts;
}
```

还有一个就是TSring和插入到stringtable中时所要计算的hash值是不一样的。

接下来就来看这两个hash值如何生成的。先来看tsring中的hash的生成：
```java
size_t step = (l>>5)+1;
for (l1=l; l1>=step; l1-=step)  /* compute hash */
    h = h ^ ((h<<5)+(h>>2)+cast(unsigned char, str[l1-1]));
```

step表示要计算的次数，l为字符串的长度，这里主要是为了防止太长的字符串。因此右移5位并加一。

这个hash算法叫做JS Hash Function ,计算完后对桶的大小size取模然后插入到hash表。

下面来看luaS_newlstr.
```java
TString *luaS_newlstr (lua_State *L, const char *str, size_t l) {
  GCObject *o;
  unsigned int h = cast(unsigned int, l);  /* seed */
  size_t step = (l>>5)+1;  /* if string is too long, don't hash all its chars */
  size_t l1;
///计算字符串hash，
  for (l1=l; l1>=step; l1-=step)  /* compute hash */
    h = h ^ ((h<<5)+(h>>2)+cast(unsigned char, str[l1-1]));
///遍历全局的字符串表
  for (o = G(L)->strt.hash[lmod(h, G(L)->strt.size)];
       o != NULL;
       o = o->gch.next) {
    TString *ts = rawgco2ts(o);
    if (ts->tsv.len == l && (memcmp(str, getstr(ts), l) == 0)) {
      /* string may be dead */
      if (isdead(G(L), o)) changewhite(o);
      return ts;
    }
  }
  return newlstr(L, str, l, h);  /* not found */
}
```

这里要注意lua每次都会memcpy传递进来的字符串的。而且在lua内部字符串也都是以0结尾的。

接下来来看lua中最重要的一个结构Table.
```java
typedef union TKey {
  struct {
    TValuefields;
    struct Node *next;  /* for chaining */
  } nk;
  TValue tvk;
} TKey;


typedef struct Node {
  TValue i_val;
  TKey i_key;
} Node;

typedef struct Table {
  CommonHeader;
  lu_byte flags;  /* 1<<p means tagmethod(p) is not present */
  lu_byte lsizenode;  /* log2 of size of `node' array */
  struct Table *metatable;
  TValue *array;  /* array part */
  Node *node;
  Node *lastfree;  /* any free position is before this position */
  GCObject *gclist;
  int sizearray;  /* size of `array' array */
} Table;
```

这里它的头和TSring是一样的，其实所有gc的类型的头都是相同的。在lua5.0中table表示为一种混合的数据结构，包含一个数组部分和一个散列表部分，当键为整数时，他不会保存这个键而是直接保存这个值到数组中。

也就是数组保存在上面的array中，而散列表保存在node中。其中tkey保存了当前slot的下一个node的指针。

我们可以通过lapi.c来详细分析table的实现。

比较核心的函数就是luaH_get。

const TValue *luaH_get (Table *t, const TValue *key)

这个函数就是用来从表t中查找key对应的值，从而返回。因此这里我们可以看到它会通过key的类型不同，从而进行不同的处理。

1 如果是NIl 则直接返回luaO_nilobject。

2 如果是string，则调用luaH_getstr进行处理(下面会介绍)

3 如果是number，则调用luaH_getnum来处理。这里要注意如果是非int类型的话，它会跳过这里，进入default处理。

4 然后就是default了。它会计算key的hash值，然后在hash表中查找到slot，然后遍历这个链表查找到对应的key，然后返回value。如果没有找到则返回nil。

此时由于lua的lua_Number默认是double型的，而数组的下标是int的，因此这里有一个转换double到int的一个过程。在lua中是通过lua_number2int这个函数来实现的，它用了一个小技巧。

union luai_Cast { double l_d; long l_l; };
#define lua_number2int(i,d) \
  { volatile union luai_Cast u; u.l_d = (d) + 6755399441055744.0; (i) = u.l_l; }

可以看到lua是定义了一个联合，然后将要转换的d加上 6755399441055744.0。然后将l_l赋值给最终的值i。

6755399441055744.0是一个magic number ，它也就是1.5*2^52 ，而在ia-32的架构中，fraction是52位。而在浮点数加法中，首先要做的就是小数点对齐，而对齐标准就是和幂大的对齐。并且小数点前的1是忽略的。因此当相加时，就会将小数点后的四舍五入掉了。而为什么是1.5呢，主要是为了处理负数。

我这里只是简单的分析了下，详细的，自己动笔算一下就清楚了。

ok，现在我们来看luaH_getstr的实现。这个函数的实现其实很简单，就是计算hash然后得到链表，并遍历，得到对应key的值。这里我们要知道当 key为字符串时，在table中的hash不等于string本身的hash(也就是全局字符串hash的那个hash).

const TValue *luaH_getstr (Table *t, TString *key) {
///得到对应的节点。
  Node *n = hashstr(t, key);
///然后开始遍历链表。
  do {  /* check whether `key' is somewhere in the chain */
    if (ttisstring(gkey(n)) && rawtsvalue(gkey(n)) == key)
      return gval(n);  /* that's it */
    else n = gnext(n);
  } while (n);
  return luaO_nilobject;
}

然后是luaH_getnum的实现。这个函数首先判断这个key，也就是数组下标是否在范围内。如果在则直接返回相应的值。否则将这个key计算hash然后在hash链表中查找相应的值。

const TValue *luaH_getnum (Table *t, int key) {
  /* (1 <= key && key <= t->sizearray) */
///判断key的范围。
  if (cast(unsigned int, key-1) < cast(unsigned int, t->sizearray))
    return &t->array[key-1];
  else {
///如果不在，则说明在hash部分，因此开始遍历对应的node。
    lua_Number nk = cast_num(key);
    Node *n = hashnum(t, nk);
    do {  /* check whether `key' is somewhere in the chain */
      if (ttisnumber(gkey(n)) && luai_numeq(nvalue(gkey(n)), nk))
        return gval(n);  /* that's it */
      else n = gnext(n);
    } while (n);
    return luaO_nilobject;
  }
}

看完get我们来看set方法。

TValue *luaH_set (lua_State *L, Table *t, const TValue *key)

这个函数会判断是否key已经存在，如果已经存在则直接返回对应的值。否则会调用newkey来新建一个key，并返回对应的value。(这里主要并不是所有的数字的key都会加到数组里面，有一部分会加入到hash表中).可以说这个hash表中包含两个链表，一个是空的槽的链表，一个是已经填充了的槽的链表。

TValue *luaH_set (lua_State *L, Table *t, const TValue *key) {
///调用get得到对应的值（也就是在表中查找是否存在这个key）
  const TValue *p = luaH_get(t, key);
  t->flags = 0;
///不为空，则直接返回这个值
  if (p != luaO_nilobject)
    return cast(TValue *, p);
  else {
    if (ttisnil(key)) luaG_runerror(L, "table index is nil");
    else if (ttisnumber(key) && luai_numisnan(nvalue(key)))
      luaG_runerror(L, "table index is NaN");
///调用newkey，返回一个新的值。
    return newkey(L, t, key);
  }
}

然后来看newkey。

static TValue *newkey (lua_State *L, Table *t, const TValue *key)

这里lua使用的是open-address hash。不过做了一些改良。这里它会有专门的一个free position的链表（也就是所有空闲槽的一个链表)，来保存所有冲突的node，换句话说就是如果有冲突，则从free position中取得位置，然后将冲突元素放进去，并从free position中删除。

这个函数的具体流程是这样的：

1 首先调用mainposition返回一个node，然后判断node的value是否为空，如果为空，则给value赋值,然后返回这个node的value。

2 如果node的value非空，或者说这个node就是空的，则先通过getfreepo从空的槽的链表得到一个空的槽，如果没有空着的槽，则说明hash表已满，此时扩容hash表，然后继续调用luaH-set.

3 如果此时有空着的槽，再次计算mainposition,通过key的value.(这是因为我们是开地址散列，每次冲突的元素都会放到free position中）。如果得到的node和第一步计算的node相同，则将空着的槽(也就是链表）n链接到第一步得到的node后面，这个也就是将当前要插入的key的node到free position，然后移动node指针到n的位置，然后赋值并返回。

4 如果和第一步计算的node不同，则将新的node插入到这个node。然后将本身这个node移动到free position。

接下来来看源码。

static TValue *newkey (lua_State *L, Table *t, const TValue *key) {
///得到主位置的值。
  Node *mp = mainposition(t, key);
  if (!ttisnil(gval(mp)) || mp == dummynode) {
    Node *othern;
///得到freee position的node。
    Node *n = getfreepos(t);  /* get a free place */
    if (n == NULL) {  /* cannot find a free place? */
///如果为空，则说明table需要增长，因此rehash
      rehash(L, t, key);  /* grow table */
      return luaH_set(L, t, key);  /* re-insert key into grown table */
    }
    lua_assert(n != dummynode);
///得到mp的主位置。
    othern = mainposition(t, key2tval(mp));
///如果不等，则说明mp本身就是一个冲突元素。
    if (othern != mp) {  /* is colliding node out of its main position? */
///链接冲突元素到free position
      while (gnext(othern) != mp) othern = gnext(othern);  /* find previous */
      gnext(othern) = n;  /* redo the chain with `n' in place of `mp' */
      *n = *mp;  /* copy colliding node into free pos. (mp->next also goes) */
      gnext(mp) = NULL;  /* now `mp' is free */
      setnilvalue(gval(mp));
    }
    else {  /* colliding node is in its own main position */
      /* new node will go into free position */
///这个说明我们当前的key是冲突元素。
      gnext(n) = gnext(mp);  /* chain new position */
      gnext(mp) = n;
      mp = n;
    }
  }
///赋值。
  gkey(mp)->value = key->value; gkey(mp)->tt = key->tt;
  luaC_barriert(L, t, key);
  lua_assert(ttisnil(gval(mp)));
///返回value
  return gval(mp);
}

接下来来看rehash的实现。每次表满了之后，都会重新计算散列值。

具体的函数是  
static void rehash (lua_State *L, Table *t, const TValue *ek)

再散列的流程很简单。第一步是确定新数组部分和新散列部分的尺寸。所以，Lua遍历所有条目，计数并分类它们，每次满的时候，都会是最接近数组当前大小的值的次幂(0->1,3->4,9->16等等)，它使得数组部分超过半数的元素被填充。然后散列尺寸是能容纳所有剩余条目的2的最小乘幂。

lua为了提高效率，尽量不去做rehash，因为rehash非常非常耗时，因此看下面的代码：

local a={}
print("-----------\n")
a.x=1
a.y=2
a.z=3
a.u=4
a.o=5
for i = 1, 1 do
    print(i)
    print("==============\n")
    a[i]=1
    print("==============\n")
end

当a.o之后表的散列部分大小为8,因此下面的a[i]=1,尽管属于数组部分，可是不会进行rehash，而是暂时放到hash部分中。而当必须要rehash表的时候，计算数组大小时，会将放到hash部分中的数组重新插入到数组部分。

来看代码，这里注释很详细，我就简单的介绍下。

我们知道在lua中，数组部分有个最大值（为2^26)，而这里它准备了一个数组，大小为26+1,然后数组每一个的值都表示了在某一个段的范围内的值得多少：

nums[i] = number出表示了在  2^(i-1) 和 2^i之间的数组部分的有多少值。

这样做的目的主要是为了防止数组部分过于稀疏，太过于稀疏的话，会将一些值放到hash部分中，我们下面分析computesizes时，会详细介绍这个。

///这里表示数组部分的最大容量为2^26
#define MAXBITS		26
static void rehash (lua_State *L, Table *t, const TValue *ek) {
  int nasize, na;
  int nums[MAXBITS+1];  /* nums[i] = number of keys between 2^(i-1) and 2^i */
  int i;
  int totaluse;
///首先初始化每部分都为0
  for (i=0; i<=MAXBITS; i++) nums[i] = 0;  /* reset counts */
///计算array部分的元素个数
  nasize = numusearray(t, nums);  /* count keys in array part */
  totaluse = nasize;  /* all those keys are integer keys */
///计算hash部分的元素个数
  totaluse += numusehash(t, nums, &nasize);  /* count keys in hash part */
  /* count extra key */
  nasize += countint(ek, nums);
  totaluse++;
///计算新的数组部分的大小
  na = computesizes(nums, &nasize);
  /* resize the table to new computed sizes */
///调用resize调整table的大小。
  resize(L, t, nasize, totaluse - na);
}

这里比较关键就是上面几个计算函数，我们一个个来分析：  
numusearray 计算当前的数组部分的元素个数，并且给num赋值。

static int numusearray (const Table *t, int *nums) {
  int lg;
  int ttlg;  /* 2^lg */
  int ause = 0;  /* summation of `nums' */
  int i = 1;  /* count to traverse all array keys */
  for (lg=0, ttlg=1; lg<=MAXBITS; lg++, ttlg*=2) {  /* for each slice */
    int lc = 0;  /* counter */
    int lim = ttlg;
..........................
    /* count elements in range (2^(lg-1), 2^lg] */
    for (; i <= lim; i++) {
      if (!ttisnil(&t->array[i-1]))
        lc++;
    }
///得到相应的段的个数
    nums[lg] += lc;
///计算总的元素个数。
    ause += lc;
  }
  return ause;
}

然后是numusehash ，这个函数计算hash部分的元素个数。

static int numusehash (const Table *t, int *nums, int *pnasize) {
  int totaluse = 0;  /* total number of elements */
  int ause = 0;  /* summation of `nums' */
  int i = sizenode(t);
///遍历node。(由于是开地址散列，因此遍历很简单)
  while (i--) {
    Node *n = &t->node[i];
///判断是否为nil
    if (!ttisnil(gval(n))) {
///countint就是判断n是否可以进入数组部分，是的话返回1,否则为0
      ause += countint(key2tval(n), nums);
///总得大小加一
      totaluse++;
    }
  }
///更新数组部分的大小
  *pnasize += ause;
  return totaluse;
}

接下来是computesizes,它用来计算新的数组部分的大小。这里扩展的大小也就是最接近数组当前的大小的2的次幂。

这里遍历也就是每次一个段的遍历。

如果数组的利用率小于50%的话，大的元素就不会计算到数组部分，也就是会放到hash部分。

static int computesizes (int nums[], int *narray) {
  int i;
  int twotoi;  /* 2^i */
  int a = 0;  /* number of elements smaller than 2^i */
  int na = 0;  /* number of elements to go to array part */
  int n = 0;  /* optimal size for array part */
  for (i = 0, twotoi = 1; twotoi/2 < *narray; i++, twotoi *= 2) {
///如果大于0,说明这个段中有数据
    if (nums[i] > 0) {
      a += nums[i];
      if (a > twotoi/2) {  
///如果多于一半，则设置数组当前的大小为twotoi(2^i)
        n = twotoi;  /* optimal size (till now) */
        na = a;  /* all elements smaller than n will go to array part */
      }
///如果少于一半，则这个值将不会计算到数组部分，也就是n值不会更新
    }
    if (a == *narray) break;  /* all elements already counted */
  }
  *narray = n;
  lua_assert(*narray/2 <= na && na <= *narray);
  return na;
}

resize就不介绍了，这个函数比较简单，就是重新分配数组部分和hash部分的大小，这里用realloc来调整大小，然后重新插入值。

- [查看图片附件](https://www.iteye.com/blog/simohayha-517748#)

分享到： ![](https://www.iteye.com/images/sina.jpg) ![](https://www.iteye.com/images/tec.jpg)

- 2009-11-15 21:38
- 浏览 24617
- [评论(3)](https://www.iteye.com/blog/simohayha-517748#comments)
- 分类:[编程语言](https://www.iteye.com/blogs/category/language)
- [查看更多](https://www.iteye.com/wiki/blog/517748)