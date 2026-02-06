---
tags:
  - Unity/IOS开发/OC
---
# 一、核心概念

## 1. **C语言超集**

- Objective-C = C语言 + 面向对象特性    
- 完全兼容C语言语法和库

## 2. **Objective-C代码的文件扩展名**

|   |   |
|---|---|
|扩展名|内容类型|
|.h|头文件。头文件包含类，类型，函数和常数的声明。|
|.m|源代码文件。这是典型的源代码文件扩展名，可以包含 Objective-C 和 C 代码。|
|.mm|源代码文件。带有这种扩展名的源代码文件，除了可以包含Objective-C和C代码以外还可以包含C++代码。仅在你的Objective-C代码中确实需要使用C++类或者特性的时候才用这种扩展名。|

当你需要在源代码中包含头文件的时候，你可以使用标准的 #include 编译选项，但是 Objective-C 提供了更好的方法。#import 选项和 #include 选项完全相同，只是它可以确保相同的文件只会被包含一次。Objective-C 的例子和文档都倾向于使用 #import，你的代码也应该是这样的。

## 3. **消息传递机制**

Objective-C，类别与消息的关系比较松散，调用方法视为对对象发送消息，所有方法都被视为对消息的回应。所有消息处理直到运行时（runtime）才会动态决定，并交由类别自行决定如何处理收到的消息。也就是说，一个类别不保证一定会回应收到的消息，如果类别收到了一个无法处理的消息，程序只会抛出异常，不会出错或崩溃。

```c
// 不是方法调用，而是消息发送
[对象 消息];
[对象 消息:参数];
[对象 消息:参数1 with参数:参数2];
```

# 二、基础语法

## 1. **类定义**

```objective-c
// .h 头文件（接口声明）
@interface ClassName : ParentClass <Protocol1, Protocol2>
{
    // 实例变量（现在较少用）
    int _age;
}

// 属性声明
@property (nonatomic, strong) NSString *name;
@property (nonatomic, assign) NSInteger age;

// 方法声明
- (instancetype)initWithName:(NSString *)name;
+ (ClassName *)sharedInstance;

@end

// .m 实现文件
@implementation ClassName

// 方法实现
- (instancetype)initWithName:(NSString *)name {
    self = [super init];
    if (self) {
        _name = name;
    }
    return self;
}

@end
```

1. 类声明总是由 @interface 编译选项开始，由 @end 编译选项结束
2. 方法前面的 +/- 号代表函数的类型：加号（+）代表类方法（class method），不需要实例就可以调用，与C++ 的静态函数（static member function）相似。减号（-）即是一般的实例方法（instance method）。
3. 方法名称内的冒号（:）代表参数传递，参数可以夹杂于名称中间，不必全部附缀于方法名称的尾端，可以提高程序可读性
```objective-c
// 这个方法的签名是setColorToRed:Green:Blue:。每个冒号后面都带着一个float类别的参数，分别代表红，绿，蓝三色。
- (void) setColorToRed: (float)red Green: (float)green Blue:(float)blue; /* 宣告方法*/

[myColor setColorToRed: 1.0 Green: 0.8 Blue: 0.2]; /* 呼叫方法*/

```
4. 实现区块以关键字@implementation作为区块起头，@end结尾

## 2. 方法

下图展示 insertObject:atIndex: 实例方法的声明。声明由一个减号(-)开始，这表明这是一个实例方法。方法实际的名字(insertObject:atIndex:)是所有方法标识关键的级联，包含了冒号。冒号表明了参数的出现。如果方法没有参数，你可以省略第一个(也是唯一的)方法标识关键字后面的冒号。本例中，这个方法有两个参数。
![[（图解1）OC声明方法.png|540]]
当你想调用一个方法，你传递消息到对应的对象。这里消息就是方法标识符，以及传递给方法的参数信息。发送给对象的所有消息都会动态分发，这样有利于实现Objective-C类的多态行为。

消息被中括号( [ 和 ] )包括。中括号中间，接收消息的对象在左边，消息（包括消息需要的任何参数）在右边。例如，给myArray变量传递消息insertObject:atIndex:消息，你需要使用如下的语法：
```objective-c
[myArray insertObject:anObj atIndex:0];
```


## 3. **属性特性（Property Attributes）**

```objective-c
@property (nonatomic, strong) NSString *name;  // 强引用
@property (nonatomic, weak) id delegate;       // 弱引用（防循环引用）
@property (nonatomic, copy) NSString *text;    // 拷贝（用于NSString等）
@property (nonatomic, assign) NSInteger count; // 基本类型
@property (nonatomic, readonly) BOOL isActive; // 只读
@property (nonatomic, getter=isEnabled) BOOL enabled; // 自定义getter名
```

# 三、独特特性

## 1. **协议（Protocols）**

协议是一组没有实现的方法列表，任何的类均可采纳协议并具体实现这组方法。协议类似于Java与C#语言中的"接口"。

```objective-c

@protocol MyProtocol <NSObject>
@required
- (void)requiredMethod;

@optional
- (void)optionalMethod;
@end

@interface MyClass : NSObject <MyProtocol>
@end
```

## 2. **分类（Categories）**

```objective-c

// 为已有类添加方法
@interface NSString (MyCategory)
- (NSString *)reversedString;
@end
```

## 3. **扩展（Extensions）**

```objective-c

// 私有接口（通常在.m文件中）
@interface MyClass ()
@property (nonatomic, strong) NSString *privateProperty;
- (void)privateMethod;
@end
```

## 4. **块（Blocks）**

```objective-c

// 类似匿名函数/闭包
// 定义
void (^simpleBlock)(void) = ^{
    NSLog(@"This is a block");
};

// 带参数和返回值
int (^multiplyBlock)(int, int) = ^(int a, int b) {
    return a * b;
};

// 作为方法参数
- (void)doSomethingWithCompletion:(void (^)(BOOL success))completion;
```

## 5. 转发

Objective-C允许对一个对象发送消息，不管它是否能够响应之。除了响应或丢弃消息以外，对象也可以将消息转发到可以响应该消息的对象。转发可以用于简化特定的设计模式，例如观测器模式或代理模式。

Objective-C运行时在Object中定义了一对方法：

### 转发方法：
```Objective-c

- (retval_t) forward:(SEL) sel :(arglist_t) args; // with GCC
- (id) forward:(SEL) sel :(marg_list) args; // with NeXT/Apple systems
```
### 响应方法：
```Objective-c
- (retval_t) performv:(SEL) sel :(arglist_t) args;  // with GCC
- (id) performv:(SEL) sel :(marg_list) args; // with NeXT/Apple systems
```
希望实现转发的对象只需用新的方法覆盖以上方法来定义其转发行为。无需重写响应方法performv::，由于该方法只是单纯的对响应对象发送消息并传递参数。其中，SEL类型是Objective-C中消息的类型。

以下代码演示了转发的基本概念：
#### Forwarder.h 文件代码：
```objective-c
#import <objc/Object.h>

@interface Forwarder : Object
{
    id recipient; //该对象是我们希望转发到的对象。
}

@property (assign, nonatomic) id recipient;

@end
```
#### Forwarder.m 文件代码：
```objective-c
#import "Forwarder.h"

@implementation Forwarder

@synthesize recipient;

- (retval_t) forward: (SEL) sel : (arglist_t) args
{
    /*
     *检查转发对象是否响应该消息。
     *若转发对象不响应该消息，则不会转发，而产生一个错误。
     */
    if([recipient respondsTo:sel])
       return [recipient performv: sel : args];
    else
       return [self error:"Recipient does not respond"];
}
```
#### Recipient.h 文件代码：
```objective-c
#import <objc/Object.h>

// A simple Recipient object.
@interface Recipient : Object
- (id) hello;
@end
```
#### Recipient.m 文件代码：
```objective-c
#import "Recipient.h"

@implementation Recipient

- (id) hello
{
    printf("Recipient says hello!\n");

    return self;
}

@end
```
#### main.m 文件代码：
```objective-c
#import "Forwarder.h"
#import "Recipient.h"

int main(void)
{
    Forwarder *forwarder = [Forwarder new];
    Recipient *recipient = [Recipient new];

    forwarder.recipient = recipient; //Set the recipient.
    /*
     *转发者不响应hello消息！该消息将被转发到转发对象。
     *（若转发对象响应该消息）
     */
    [forwarder hello];

    return 0;
}
```

# 四、Objective-C中的一些常用操作

## 1. 属性的规范声明

```objective-c
// ✅ 对象类型 - 通常组合
@property (nonatomic, strong) UIView *mainView;  // 强引用，拥有对象
@property (nonatomic, weak) id<DelegateProtocol> delegate;  // 弱引用，防循环引用
@property (nonatomic, copy) NSString *name;  // 拷贝，防外部修改

// ✅ 基本类型 - assign是必须的
@property (nonatomic, assign) int age;
@property (nonatomic, assign) BOOL isLoading;
@property (nonatomic, assign) NSUInteger count;

// ✅ 结构体 - assign是必须的
@property (nonatomic, assign) CGRect frame;
@property (nonatomic, assign) UIEdgeInsets insets;
```

### **黄金法则**：

1. **总是使用 `nonatomic`**，除非有特殊线程安全需求
2. **对象类型**：根据所有权选择 `strong`、`weak` 或 `copy`
3. **非对象类型**：使用 `assign`
4. **结构体**：使用 `assign`
5. **永远不要对对象使用 `assign`**（用 `weak` 替代）

### 函数指针属性

```objective-c
@property (nonatomic, assign, nullable) IOSBackgroundTaskFailedCallback backgroundTaskFailedCallback;
```

为什么使用`assign`:
- 函数指针不是 Objective-C 对象，不需要内存管理
- 不能使用 strong、weak、copy（这些用于对象）
- assign 表示简单赋值，适用于基本类型和指针

## 2. 类的扩展声明

在.h文件中声明的类及其字段，属性和方法都是公开的。当我们需要声明私有的时，可以在.mm文件中，通过声明扩展类来实现

**xxx.h**文件中定义公共接口
```objective-c
@interface DownloadBackgroundManager : NSObject  
// 这里声明的是 公开的 属性和方法  
// 其他文件 import 这个 .h 后可以访问这些成员  
+ (instancetype)sharedManager;  
- (BOOL)isBackgroundModeActive;  
@end
```

**xxx.mm**文件中定义私有扩展
```objective-c
@interface DownloadBackgroundManager ()  // 注意这里有一对空括号 ()  
// 这里声明的是 私有的 属性和方法  
// 只有当前 .mm 文件内部可以访问  
@property (nonatomic, assign) BOOL isBackgroundModeActive;  
@end
```