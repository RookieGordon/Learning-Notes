---
tags:
  - Unity/IOS/OC
---
# 一、核心概念

## 1. **C语言超集**

- Objective-C = C语言 + 面向对象特性    
- 完全兼容C语言语法和库

### Objective-C代码的文件扩展名

|   |   |
|---|---|
|扩展名|内容类型|
|.h|头文件。头文件包含类，类型，函数和常数的声明。|
|.m|源代码文件。这是典型的源代码文件扩展名，可以包含 Objective-C 和 C 代码。|
|.mm|源代码文件。带有这种扩展名的源代码文件，除了可以包含Objective-C和C代码以外还可以包含C++代码。仅在你的Objective-C代码中确实需要使用C++类或者特性的时候才用这种扩展名。|

当你需要在源代码中包含头文件的时候，你可以使用标准的 #include 编译选项，但是 Objective-C 提供了更好的方法。#import 选项和 #include 选项完全相同，只是它可以确保相同的文件只会被包含一次。Objective-C 的例子和文档都倾向于使用 #import，你的代码也应该是这样的。

## 2. **消息传递机制**

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

## 2. **属性特性（Property Attributes）**

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

```objective-c

@protocol MyProtocol <NSObject>
@required
- (void)requiredMethod;

@optional
- (void)optionalMethod;
@end

@interface MyClass : NSObject <MyProtocol>
@end

### 2. **分类（Categories）**

objectivec

// 为已有类添加方法
@interface NSString (MyCategory)
- (NSString *)reversedString;
@end

### 3. **扩展（Extensions）**

objectivec

// 私有接口（通常在.m文件中）
@interface MyClass ()
@property (nonatomic, strong) NSString *privateProperty;
- (void)privateMethod;
@end

### 4. **块（Blocks）**

objectivec

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
