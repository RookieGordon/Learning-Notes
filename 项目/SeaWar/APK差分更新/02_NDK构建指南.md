# 1. 官方仓库真实结构（以当前 GitHub 为准）

仓库地址： [https://github.com/sisong/ApkDiffPatch](https://github.com/sisong/ApkDiffPatch)

> ⚠️ **重要更正说明**：ApkDiffPatch 仓库在不同历史版本、不同文档中，目录命名存在较大差异。 以下结构以你当前看到的 **实际仓库结构** 为准，而不是早期文章中常见的 `libZip / libHDiffPatch` 命名。

## 1.1 当前仓库真实目录结构

```
ApkDiffPatch/
├─ builds/
│  ├─ android_ndk_jni_mk/   # 官方提供的 Android NDK 示例工程（ndk-build）
│  ├─ vc/
│  └─ xcode/
├─ HDiffPatch/              # ★ 底层差分算法实现（核心）
├─ lzma/                    # ★ 压缩算法实现
├─ zlib-1.3.1/              # ★ zlib 实现（已内置）
├─ src/
│  ├─ diff/                 # 差分生成逻辑（服务端为主）
│  ├─ patch/                # ★ patch 合成逻辑（客户端核心）
│  ├─ normalized/           # APK 归一化相关（服务端）
│  ├─ zip_diff.cpp
│  ├─ zip_patch.cpp         # ★ ZIP/APK 合成核心
│  ├─ apk_normalized.cpp
│  └─ ZipExtExtraDemo.cpp
└─ ...
```

---
## 1.2 客户端真正需要编译的源码范围（非常关键）
### ✅ 必须包含（缺一不可）
- `src/patch/`
- `src/zip_patch.cpp`
- `HDiffPatch/`
- `lzma/`
- `zlib-1.3.1/`
这些共同组成了：

> **apk\_patch() 的完整实现依赖闭包**

---
## 1.3 apk\_patch 的真实入口说明（以官方 NDK 示例为准）

在官方仓库中，真正提供 **apk\_patch 函数声明与 main 调用示例** 的文件是：

```
builds/android_ndk_jni_mk/apk_patch.cpp
```

需要特别说明：
- `builds/android_ndk_jni_mk/apk_patch.cpp` **不是完整实现**
- 它只是一个：
    - CLI / JNI 示例入口
    - 参数解析 + 调用封装
真正的实现分散在：
- `src/patch/`
- `src/zip_patch.cpp`
- `HDiffPatch/`
---
## 1.4 关于 builds/android_ndk_jni_mk 的说明（官方示例）

官方已经提供了：

```
builds/android_ndk_jni_mk/
```

其特点：

- 使用 **ndk-build (Android.mk)**
- 是 **最权威的 Android 编译参考**
- 但：
    - 不适合直接用于 Unity
    - 不符合现代 AGP + CMake 习惯

> ✅ 我们的 CMake 方案，本质上是 **把这个 Android.mk 逻辑平移到 CMake**。

---
# 2. Android Native Library（.so）构建完整流程
> 本章节是整个方案的**核心**，请严格按步骤执行。

## 2.1 构建环境准备（明确版本）
### 推荐环境

| 工具             | 推荐版本        | 说明        |
| -------------- | ----------- | --------- |
| Android Studio | Flamingo+   | 仅用于构建     |
| Android NDK    | r21e \~ r25 | 实测稳定      |
| CMake          | 3.10+       | 与 AGP 兼容  |
| ABI            | arm64-v8a   | 强烈推荐单 ABI |

> ⚠️ 不建议使用 ndk-build，本项目 **CMake 更稳定**。

---
## 2.2 Android 工程最小目录结构（可直接照抄，已修正）

> ⚠️ **重要修正说明**：
>
> - ApkDiffPatch 官方仓库中 **不存在** `libZip/`、`libHDiffPatch/` 这两个目录
> - 这两个名称仅是历史文章中的“逻辑模块称呼”
> - 实际工程中，必须按 **真实源码目录** 组织

### 2.2.1 正确的最小 NDK 目录结构

```
app/src/main/cpp/
├─ apk_patch.cpp             # 来自 builds/android_ndk_jni_mk（官方示例入口）
├─ src/
│  ├─ patch/                 # ★ 必须：patch 合成逻辑
│  └─ zip_patch.cpp          # ★ 必须：ZIP/APK 合成核心
├─ HDiffPatch/               # ★ 必须：差分算法核心
├─ lzma/                     # ★ 必须：压缩算法
├─ zlib-1.3.1/               # ★ 必须：zlib
├─ android_jni.cpp           # JNI 封装（你写）
└─ CMakeLists.txt
```
---
## 2.3 JNI 封装代码

### android_jni.cpp 

> ⚠️ **重要说明**：官方 `apk_patch.cpp` 中定义的函数是 `ApkPatch`（大写），不是 `apk_patch`。

```cpp
#include <jni.h>
#include "apk_patch.h"

extern "C"
JNIEXPORT jint JNICALL
// xxx可以自定义
Java_com_xxx_patch_ApkPatch_nativePatch(
        JNIEnv* env,
        jclass,
        jstring oldApk_,
        jstring patch_,
        jstring newApk_) {

    const char* oldApk = env->GetStringUTFChars(oldApk_, 0);
    const char* patch = env->GetStringUTFChars(patch_, 0);
    const char* newApk = env->GetStringUTFChars(newApk_, 0);

    // ApkPatch 参数说明:
    // - oldApkPath: 旧 APK 路径
    // - patchFilePath: patch 文件路径
    // - outNewApkPath: 输出新 APK 路径
    // - maxUncompressMemory: 0 表示使用默认值
    // - tempUncompressFilePath: nullptr 表示使用内存
    // - threadNum: 1 表示单线程
    TPatchResult ret = ApkPatch(oldApk, patch, newApk, 0, nullptr, 1);

    env->ReleaseStringUTFChars(oldApk_, oldApk);
    env->ReleaseStringUTFChars(patch_, patch);
    env->ReleaseStringUTFChars(newApk_, newApk);

    // 直接返回错误码，便于排查问题
    return static_cast<int>(ret);
}
```

### TPatchResult 错误码说明

| 错误码 | 枚举名 | 说明 |
|--------|--------|------|
| 0 | `PATCH_SUCCESS` | ✅ 成功 |
| 1 | `PATCH_OPENREAD_ERROR` | 打开文件读取失败（检查路径权限） |
| 2 | `PATCH_OPENWRITE_ERROR` | 打开文件写入失败（检查输出路径权限） |
| 3 | `PATCH_CLOSEFILE_ERROR` | 关闭文件失败 |
| 4 | `PATCH_MEM_ERROR` | 内存分配失败 |
| 5 | `PATCH_HPATCH_ERROR` | HDiffPatch 核心 patch 失败 |
| 6 | `PATCH_HDIFFINFO_ERROR` | HDiff 信息解析错误 |
| 7 | `PATCH_COMPRESSTYPE_ERROR` | 压缩类型不支持 |
| 8 | `PATCH_ZIPPATCH_ERROR` | Zip patch 过程错误 |
| 9 | `PATCH_ZIPDIFFINFO_ERROR` | Zip diff 信息解析错误 |
| 10 | `PATCH_OLDDATA_ERROR` | 旧 APK 数据错误（APK 不匹配） |
| 11 | `PATCH_OLDDECOMPRESS_ERROR` | 旧 APK 解压失败 |
| 12 | `PATCH_OLDSTREAM_ERROR` | 旧 APK 流读取错误 |
| 13 | `PATCH_NEWSTREAM_ERROR` | 新 APK 流写入错误 |
| 20 | `PATCH_SD_HDIFFINFO_ERROR` | SD HDiff 信息错误 |
| 21 | `PATCH_SD_HPATCH_ERROR` | SD HPatch 错误 |

> 💡 **常见问题排查**：
> - 错误码 1/2：检查文件路径是否正确、是否有读写权限
> - 错误码 10：旧 APK 与 patch 不匹配，确认版本对应关系
> - 错误码 11/12：旧 APK 文件可能损坏或被修改

---

## 2.4 CMakeLists.txt（实测可用版本）

> ⚠️ **CMake 语法注意**：
> - `set()` 中**不能直接使用通配符** `*.cpp`，必须通过 `file(GLOB ...)` 收集
> - zlib 目录名需与实际目录一致（可能是 `zlib-1.3.1` 或 `zlib1.3.1`）

```cmake
cmake_minimum_required(VERSION 3.10)
project(apkpatch)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

set(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -O2")
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O2")

# --- 使用 file(GLOB) 收集源文件 ---

# HDiffPatch - HPatch 核心（客户端只需要 patch，不需要 diff）
set(HDIFFPATCH_HPATCH_SRC
        HDiffPatch/libHDiffPatch/HPatch/patch.c
        HDiffPatch/file_for_patch.c
)

# HDiffPatch - libParallel（并行处理支持）
file(GLOB HDIFFPATCH_PARALLEL_SRC
        HDiffPatch/libParallel/*.cpp
)

# src/patch 目录
file(GLOB SRC_PATCH_FILES
        src/patch/*.cpp
)

# lzma 目录
file(GLOB LZMA_SRC
        lzma/*.c
)
file(GLOB LZMA_SUB_SRC
        lzma/*/*.c
)

# zlib 目录（注意：检查实际目录名）
file(GLOB ZLIB_SRC
        zlib1.3.1/*.c
)

set(SRC_FILES
        apk_patch.cpp
        android_jni.cpp
        src/zip_patch.cpp
        ${HDIFFPATCH_HPATCH_SRC}
        ${HDIFFPATCH_PARALLEL_SRC}
        ${SRC_PATCH_FILES}
        ${LZMA_SRC}
        ${LZMA_SUB_SRC}
        ${ZLIB_SRC}
)

add_library(apkpatch SHARED ${SRC_FILES})

# 编译宏定义
target_compile_definitions(apkpatch PRIVATE
        # 启用 POSIX 函数（read, close, lseek64 等）
        _LARGEFILE_SOURCE
        _LARGEFILE64_SOURCE
        _FILE_OFFSET_BITS=64
        # zlib 配置
        Z_HAVE_UNISTD_H
)

# 头文件路径
target_include_directories(apkpatch PRIVATE
        ${CMAKE_SOURCE_DIR}
        ${CMAKE_SOURCE_DIR}/src
        ${CMAKE_SOURCE_DIR}/HDiffPatch
        ${CMAKE_SOURCE_DIR}/HDiffPatch/libHDiffPatch
        ${CMAKE_SOURCE_DIR}/HDiffPatch/libHDiffPatch/HPatch
        ${CMAKE_SOURCE_DIR}/lzma
        ${CMAKE_SOURCE_DIR}/zlib1.3.1
)

# Android & log
find_library(log-lib log)
find_library(android-lib android)

target_link_libraries(apkpatch
        ${log-lib}
        ${android-lib}
)
```

---

## 2.5 构建 so 的实际步骤

### 方式一：Android Studio（推荐）

1. 打开 Android 工程
2. 选择 Build Variant = **Release**
3. 点击 Build → Make Project
4. 生成路径：
```
app/build/intermediates/cmake/release/obj/arm64-v8a/libapkpatch.so
````

### 方式二：命令行

```bash
./gradlew assembleRelease
````

---

## 2.6 ABI 校验（非常重要）

```bash
readelf -h libapkpatch.so
```

确保：

- 只包含目标 ABI
- 与 APK 构建 ABI 一致

---

## 2.7 NDK 工程 Package Name 与 SDK 版本配置说明（重要）

### 2.7.1 Package Name 是否有要求？

**结论：对 so 本身没有任何要求，但对 JNI 有约束。**

#### 1️⃣ 对 so 文件本身

- `.so` 是 **纯 Native Library**
- **与 Android package name 完全无关**
- 可以在任何 Android 工程中编译、拷贝、复用

> 你甚至可以用一个专门的 `apkpatch-builder` 工程来编译 so，再拷贝到 Unity 工程中使用。

#### 2️⃣ 对 JNI 方法签名（有要求）

唯一与 package name 相关的是：

```cpp
Java_com_xxx_patch_ApkPatch_nativePatch
```

它必须与 **Java 类的完整包名 + 类名** 完全一致。

例如：

```java
package com.company.update.patch;

public class ApkPatch {
    public static native int nativePatch(...);
}
```

则 JNI 函数名必须是：

```cpp
Java_com_company_update_patch_ApkPatch_nativePatch
```

📌 **最佳实践**

- NDK 构建工程的 applicationId 可随意
- JNI 所属 Java 包名，应*与 Unity 最终集成的 aar/jar* 保持一致

---

### 2.7.2 compileSdk / minSdk / targetSdk 要求

#### 1️⃣ compileSdkVersion

- **无硬性要求**
- 推荐：

```gradle
compileSdkVersion 33+
```

原因：

- 仅影响 Java 层编译
- 对 Native 编译无影响

---

#### 2️⃣ minSdkVersion（有最低建议）

```gradle
minSdkVersion 21
```

原因：

- ApkDiffPatch 依赖标准 libc / POSIX 文件 API
- Android 5.0 以下设备基本已无现实意义
- Unity 2021+ 默认 minSdk ≥ 21

> ⚠️ 理论最低可到 16，但 **不建议**。

---

#### 3️⃣ targetSdkVersion

- 对 so **完全无影响**
- 按 Unity / 项目要求配置即可

---

### 2.7.3 NDK 版本与 API Level 选择

在 `externalNativeBuild` 中推荐：

```gradle
android {
    defaultConfig {
        minSdkVersion 21
        ndk {
            abiFilters "arm64-v8a"
        }
        externalNativeBuild {
            cmake {
                cppFlags "-O2"
            }
        }
    }
}
```

#### NDK API Level 说明

- 实际使用的是：

```text
android-21
```

- 与 compileSdk / targetSdk **无强绑定关系**
- 只要 ≥ minSdkVersion 即可

---

### 2.7.4 C++ 版本与 Toolchain 配置说明（非常重要）

#### 2.7.4.1 C++ 版本要求

**结论：使用 C++11 即可，且这是官方源码的实际要求。**

#### 原因说明

- ApkDiffPatch / libZip / libHDiffPatch：

  - 主要使用 C++98 / C 风格代码
  - 少量使用：
    - `std::string`
    - `bool`
    - `nullptr`

- 官方源码 **不依赖**：

  - C++14 / C++17 / C++20 特性
  - STL 高级容器（vector 仅极少使用）

因此：

```cmake
set(CMAKE_CXX_STANDARD 11)
```

是：

- ✅ 最低安全版本
- ✅ 官方长期验证版本
- ❌ 不建议提升到 C++17+（没有收益，反而增加风险）

---

#### 2.7.4.2 是否可以使用 NDK 工程默认 Toolchain？

**结论：可以，而且这是推荐做法。**

#### 默认 Toolchain 指什么？

- Android Gradle Plugin + NDK
- 默认使用：
  - **LLVM / clang**
  - **libc++**

这是当前 Android 官方唯一推荐的 Toolchain。

---

#### 2.7.4.3 是否需要指定 STL？

**结论：不需要手动指定，使用默认即可。**

原因：

- NDK r18+ 已移除 gnustl
- 默认即：

```text
c++_shared / c++_static
```

ApkDiffPatch：

- 不依赖 STL ABI 稳定性
- 不跨 so 边界传递 STL 对象

因此：

- ✅ 默认 libc++
- ❌ 不要强行指定 gnustl（已废弃）

---

#### 2.7.4.4 是否需要指定 Toolchain 版本？

**不需要。**

- 使用 Android Studio + NDK 默认配置
- Gradle 会自动选择合适的 clang

仅当出现以下情况才考虑指定：

- 特殊 ROM 编译问题
- 极老 NDK 兼容问题（不推荐）

---

#### 2.7.4.5 推荐的最终 CMake / Gradle 配置示例

#### CMakeLists.txt

```cmake
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
```

#### build.gradle（节选）

```gradle
externalNativeBuild {
    cmake {
        cppFlags "-O2"
    }
}
```

---

#### 2.7.4.6 常见误区（务必避免）

| 误区               | 后果            |
| ---------------- | ------------- |
| 强制 C++17 / C++20 | 编译通过但运行风险上升   |
| 使用旧 gnustl       | NDK r18+ 直接失败 |
| 手动切换 gcc         | 已被官方弃用        |
| 打开 RTTI / 异常     | 无意义，体积变大      |

---

## 2.7.5 常见错误结论速查表

| 问题                | 是否影响 so | 说明            |
| ----------------- | ------- | ------------- |
| applicationId 不一致 | ❌ 不影响   | so 与包名无关      |
| JNI 类名不一致         | ✅ 致命    | 找不到 native 方法 |
| compileSdk 过低     | ❌ 不影响   | 仅影响 Java      |
| minSdk < 21       | ⚠️ 风险   | 老系统不建议        |
| targetSdk 提升      | ❌ 不影响   | 运行时行为不变       |

---

```bash
readelf -h libapkpatch.so
```

确保：

- 只包含目标 ABI
- 与 APK 构建 ABI 一致

---
## 2.8 常见编译错误

### 2.8.1 通配符错误

```
CMake Error: Cannot find source file: src/patch/*.cpp
```

**原因**：`set()` 不支持通配符

**解决**：使用 `file(GLOB ...)`

```cmake
## ❌ 错误
set(SRC src/patch/*.cpp)

## ✅ 正确
file(GLOB SRC src/patch/*.cpp)
```

### 2.8.2 未定义符号 `read` / `close`

```
error: call to undeclared function 'read'
```

**解决**：添加 POSIX 宏定义

```cmake
target_compile_definitions(apkpatch PRIVATE
    _LARGEFILE_SOURCE
    _LARGEFILE64_SOURCE
    _FILE_OFFSET_BITS=64
    Z_HAVE_UNISTD_H
)
```

### 2.8.3 未定义符号 `hpatch_TFileStreamInput_close`

**原因**：缺少 `file_for_patch.c`

**解决**：添加到源文件列表

```cmake
set(HDIFFPATCH_HPATCH_SRC
    HDiffPatch/libHDiffPatch/HPatch/patch.c
    HDiffPatch/file_for_patch.c              # ← 添加这行
)
```

#### 2.4.1.4 未定义符号 `CChannel::close`

**原因**：缺少 libParallel

**解决**：

```cmake
file(GLOB HDIFFPATCH_PARALLEL_SRC
    HDiffPatch/libParallel/*.cpp
)
```

#### 2.4.1.5 未定义符号 `apk_patch`

**原因**：函数名是 `ApkPatch`（大写），不是 `apk_patch`

**解决**：修改 JNI 代码，包含 `apk_patch.h` 并调用 `ApkPatch()`

# 3. build.gradle.kts 配置

```kotlin
android {
    defaultConfig {
        // NDK 配置
        ndk {
            abiFilters += listOf("arm64-v8a")
        }
        externalNativeBuild {
            cmake {
                cppFlags += "-O2"
            }
        }
    }

    buildTypes {
        release {
            // 指定 CMake 使用纯 Release 构建类型
            externalNativeBuild {
                cmake {
                    arguments += "-DCMAKE_BUILD_TYPE=Release"
                }
            }
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }
}
```

---
# 7. C++ 与 Toolchain 配置

## 推荐配置

```cmake
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
```

## 常见误区

| 误区 | 后果 |
|------|------|
| 强制 C++17 / C++20 | 编译通过但运行风险上升 |
| 使用旧 gnustl | NDK r18+ 直接失败 |
| 手动切换 gcc | 已被官方弃用 |

---

# 下一步

- Unity 集成 → [03_Unity集成指南.md](03_Unity集成指南.md)
- 原理与排错 → [04_原理与排错.md](05_原理与排错.md)
