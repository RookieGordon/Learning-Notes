---
tags:
  - Cpp
  - 静态库编译
  - 动态库编译
  - CMake
---

# 使用CMake编译项目

```cardlink
url: https://cmake-doc.readthedocs.io/zh-cn/latest/guide/tutorial/index.html
title: "教程 — CMake 3.26.4 Documentation"
host: cmake-doc.readthedocs.io
favicon: ../../_static/cmake-favicon.ico
```

```cardlink
url: https://zhuanlan.zhihu.com/p/534439206
title: "全网最细的CMake教程！(强烈建议收藏)"
description: "▌什么是 CMake?你或许听过好几种 Make 工具，例如 GNU Make ，QT 的 qmake ，微软的 MS nmake，BSD Make（pmake），Makepp，等等。这些 Make 工具遵循着不同的规范和标准，所执行的 Makefile 格式也千差万别。这…"
host: zhuanlan.zhihu.com
image: https://picx.zhimg.com/v2-c57d9b99383ac9158cf640022918ef4b_720w.jpg?source=172ae18b
```

>[!INFO]
>[CMake命令](https://cmake.org/cmake/help/latest/manual/cmake-commands.7.html)

## 基本项目

CMakeLists.txt是整个CMake工程的描述文件。

``` CMake
#需求最低的cmake程序版本
cmake_minimum_required(VERSION 3.12)

#工程名称
project(Graphic)

#工程的C++版本
set(CMAKE_CXX_STANDARD 17)

#本工程主文件编译编译链接，生产exe
add_executable(softRenderer "main.cpp")
```

- [cmake_minimum_required()](https://cmake-doc.readthedocs.io/zh-cn/latest/command/cmake_minimum_required.html#command:cmake_minimum_required "cmake_minimum_required")命令指定最低 CMake 版本，必须位于CMakeList文件第一行
- `set(<variable> <value>... [PARENT_SCOPE])`此命令的签名指定一个 `<value>...` 占位符期望零个或多个参数。多个参数将作为分号分隔的列表 \<CMake Language Lists\>连接起来，以形成要设置的实际变量值。零参数将导致普通变量被取消设置。请参阅 [unset()](https://cmake-doc.readthedocs.io/zh-cn/latest/command/unset.html#command:unset "unset")命令显式取消设置变量。
- [CMAKE_CXX_STANDARD](https://cmake-doc.readthedocs.io/zh-cn/latest/variable/CMAKE_CXX_STANDARD.html#variable:CMAKE_CXX_STANDARD "CMAKE_CXX_STANDARD") 和 [`CMAKE_CXX_STANDARD_REQUIRED`](https://cmake-doc.readthedocs.io/zh-cn/latest/variable/CMAKE_CXX_STANDARD_REQUIRED.html#variable:CMAKE_CXX_STANDARD_REQUIRED "CMAKE_CXX_STANDARD_REQUIRED")这两个特殊的变量，可以一起使用来指定构建项目所需的 C++ 标准。

## 多文件项目

```CMake
#需求最低的cmake程序版本
cmake_minimum_required(VERSION 3.12)

#工程名称
project(Graphic)

#工程的C++版本
set(CMAKE_CXX_STANDARD 17)

#搜索所有的*.cpp文件，加入SRCS变量中
aux_source_directory(. SRCS)

#本工程所有cpp文件编译编译链接，生产exe
add_executable(softRenderer ${SRCS})
```

`aux_source_directory(. SRCS)`用于遍历CMakeLists所在的当前文件夹下的所有*.cpp文件，将其放入变量**`SRCS`**中，最后，再用这些文件来编译构建softRenderer.exe文件。

## 多文件夹编译

如何将不同文件夹的cpp源文件，打包成lib库，进而纳入到链接范围？
``` CMake
#需求最低的cmake程序版本
cmake_minimum_required(VERSION 3.12)

#工程名称
project(Graphic)

#工程的C++版本
set(CMAKE_CXX_STANDARD 17)

#将funcs文件夹纳入到编译中
add_subdirectory(funcs)

#搜索所有的*.cpp文件，加入SRCS变量中
aux_source_directory(. SRCS)

#本工程所有cpp文件编译编译链接，生产exe
add_executable(softRenderer ${SRCS})

#将funcs.lib链接到softRenderer中
target_link_libraries(softRenderer funcs)
```
同时，文件夹里面也必须要添加相应的CMakeLists文件才行。
``` CMake
#递归将本文件夹下所有*.cpp文件放入到FUNCS中（FUNCS变量可以根据文件夹的名字来命名）
file(GLOB_RECURSE FUNCS ./ *.cpp)

#将FUNCS中所有cpp文件编译成funcs这个lib库
add_library(funcs ${FUNCS})
```

## 工程中的资源文件拷贝
工程中的资源文件（图片，模型，音视频，动态链接库等），都需要拷贝到编译链接完成的exe所在的目录才能被正确读取，所以需要有拷贝功能

![[（图解4） CMake资源拷贝.png]]
如图，有jpg文件和一个dll文件两个资源是需要用到的

``` CMake
#把需要拷贝的资源路径都放在ASSETS里面
file(GLOB_RECURSE ASSETS "./assets" "thirdParty/assimp-vc143-mtd.dll")

#把ASSETS指代的目录集合的内容，拷贝到可执行文件目录下
file(COPY ${ASSETS} DESTINATION ${CMAKE_BINARY_DIR})
```
[`CMAKE_BINARY_DIR`](https://zhuanlan.zhihu.com/p/587553254)可以简单理解成可执行目录

# 静态库和动态库的编译过程

使用CMake可以方便的将源代码生成动态链接库，头文件，静态链接库。

![[（图解5）CMake配置.png|510]]
选择完成源代码文件夹，输出文件夹后，会自动进行工程创建。

工程创建完成后，选择[CMAKE_INSTALL_PREFIX]([CMAKE_INSTALL_PREFIX — CMake 3.26.4 Documentation (cmake-doc.readthedocs.io)](https://cmake-doc.readthedocs.io/zh-cn/latest/variable/CMAKE_INSTALL_PREFIX.html))来指定库文件的安装路径。配置完成后，依次点击Configure按钮，Generate按钮重新生成工程。

工程构建完成后，点击Open Project按钮，会调用Visual Studio打开项目，选择"INSTAULL"解决方案，进行”生成“操作，完成后，会在install目录生成动态库，静态库和头文件三个文件夹
![[（图解6）库文件目录.png|500]]

## 库的链接

```CMake
#从下述文件夹寻找头文件
include_directories(SYSTEM ${CMAKE_CURRENT_SOURCE_DIR}/thirdParty/include)

#从下述文件夹寻找静态链接库
include_directories(SYSTEM ${CMAKE_CURRENT_SOURCE_DIR}/thirdParty/lib/assimp)

# 定义一个变量包含所有需要链接的库
set(LINK_LIBS apps gpu assimp-vc143-mtd.lib)
target_link_libraries(softRenderer ${LINK_LIBS})
```