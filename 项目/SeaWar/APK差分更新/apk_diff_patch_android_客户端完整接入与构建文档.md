# 1. 文档目的与适用范围

本文档用于指导在**生产环境**下，将 **ApkDiffPatch** 以 **Android Native Library（.so）** 的形式集成到 **Unity Android 客户端** 中，实现 APK 差分合成更新能力。

## 1.1 适用前提（必须满足）

- 研发团队 **掌握 APK 最终签名权**
- 所有发布 APK 使用 **同一套签名证书**
- 不存在第三方渠道二次签名
- APK 使用 V2/V3 签名（主流场景）
- 客户端允许弹窗安装更新（非静默）

> ⚠️ 若上述任一条件不满足，本方案不可用。

---

# 2. ApkDiffPatch 技术本质说明（必须先理解）

ApkDiffPatch **不是 SDK，也不是库形态产品**，而是一个：

> **跨平台 C++ 工具型源码工程**

其核心特点：

- 不关心 Android Framework
- 不处理签名
- 不做 zipalign
- 不修改任何 APK 结构语义

客户端的唯一职责：

> 使用【当前设备上真实安装的 APK 字节流】 +【服务器生成的 patch】 → **还原出一个字节级一致的新 APK**

---

# 3. 官方仓库真实结构（以当前 GitHub 为准）

仓库地址： [https://github.com/sisong/ApkDiffPatch](https://github.com/sisong/ApkDiffPatch)

> ⚠️ **重要更正说明**：ApkDiffPatch 仓库在不同历史版本、不同文档中，目录命名存在较大差异。 以下结构以你当前看到的 **实际仓库结构** 为准，而不是早期文章中常见的 `libZip / libHDiffPatch` 命名。

## 3.1 当前仓库真实目录结构（你截图所示）

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

## 3.2 客户端真正需要编译的源码范围（非常关键）

### ✅ 必须包含（缺一不可）

- `src/patch/`
- `src/zip_patch.cpp`
- `HDiffPatch/`
- `lzma/`
- `zlib-1.3.1/`

这些共同组成了：

> **apk\_patch() 的完整实现依赖闭包**

---

### ❌ 客户端不需要的部分

- `src/diff/`（差分生成，服务端用）
- `src/normalized/`（APK 归一化，服务端用）
- `apk_normalized.cpp`
- `zip_diff.cpp`

---

## 3.3 apk\_patch 的真实入口说明（以官方 NDK 示例为准）

这里需要**非常明确地纠正一个容易被误解的点**：

> **apk\_patch 的“入口文件”并不在仓库根目录，也不叫 apkpatch.cpp**。

### 3.3.1 真正存在的入口文件

在官方仓库中，真正提供 **apk\_patch 函数声明与 main 调用示例** 的文件是：

```
builds/android_ndk_jni_mk/apk_patch.cpp
```

这个文件：

- ✅ **真实存在**
- ✅ 定义 / 引用了 `apk_patch()`
- ✅ 是官方 Android NDK 示例工程的一部分
- ❌ **不在仓库根目录**

因此：

- 文档中提到的 `apkpatch.cpp` **属于误称**
- 正确文件名是：\`\`

---

### 3.3.2 apk\_patch 函数本体在哪里？

需要特别说明：

- `builds/android_ndk_jni_mk/apk_patch.cpp` **不是完整实现**
- 它只是一个：
  - CLI / JNI 示例入口
  - 参数解析 + 调用封装

真正的实现分散在：

- `src/patch/`
- `src/zip_patch.cpp`
- `HDiffPatch/`

---

### 3.3.3 正确理解 apk\_patch 的“实现闭包”

```text
apk_patch.cpp   （入口 / 示例）
      ↓
src/patch/*
      ↓
src/zip_patch.cpp
      ↓
HDiffPatch/*
```

这四部分 **缺一不可**。

---

\`

---

## 3.4 关于 builds/android\_ndk\_jni\_mk 的说明（官方示例）

官方已经提供了：

```
builds/android_ndk_jni_mk/
```

其特点：

- 使用 **ndk-build (Android.mk)**
- 是 **最权威的 Android 编译参考**
- 但：
  - 不适合直接用于 Unity
  - 不符合现代 AGP + CMake 习惯

> ✅ 我们的 CMake 方案，本质上是 **把这个 Android.mk 逻辑平移到 CMake**。

---

### 结论（以当前仓库为准）

- **你看到的仓库结构是正确的**
- `libZip / libHDiffPatch` 是历史/逻辑概念，不是当前目录名
- 真实依赖是：

```
HDiffPatch + src/patch + zip_patch.cpp + lzma + zlib
```

- 官方 `android_ndk_jni_mk` 是最可靠的参考实现

---

# 4. Android Native Library（.so）构建完整流程

> 本章节是整个方案的**核心**，请严格按步骤执行。

---

## 4.1 构建环境准备（明确版本）

### 推荐环境

| 工具             | 推荐版本        | 说明        |
| -------------- | ----------- | --------- |
| Android Studio | Flamingo+   | 仅用于构建     |
| Android NDK    | r21e \~ r25 | 实测稳定      |
| CMake          | 3.10+       | 与 AGP 兼容  |
| ABI            | arm64-v8a   | 强烈推荐单 ABI |

> ⚠️ 不建议使用 ndk-build，本项目 **CMake 更稳定**。

---

## 4.2 Android 工程最小目录结构（可直接照抄，已修正）

> ⚠️ **重要修正说明**：
>
> - ApkDiffPatch 官方仓库中 **不存在** `libZip/`、`libHDiffPatch/` 这两个目录
> - 这两个名称仅是历史文章中的“逻辑模块称呼”
> - 实际工程中，必须按 **真实源码目录** 组织

### 4.2.1 正确的最小 NDK 目录结构

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

### 4.2.2 关于“libZip / libHDiffPatch”的正确对应关系

| 逻辑名称（历史说法）    | 实际源码目录（当前仓库）                        |
| ------------- | ----------------------------------- |
| libZip        | `src/zip_patch.cpp` + `zlib-1.3.1/` |
| libHDiffPatch | `HDiffPatch/`                       |

📌 **结论**：

- 不要自己创建 `libZip/` 或 `libHDiffPatch/` 目录
- 直接使用官方仓库中的真实目录结构

---

````

❗ **注意事项**

- 不要修改 apkpatch.cpp
- 不要删除 libZip / libHDiffPatch 中的任何文件
- 不要做 clang-format

---

## 4.3 JNI 封装代码（唯一推荐方式）

### android\_jni.cpp

> ⚠️ **重要说明**：官方 `apk_patch.cpp` 中定义的函数是 `ApkPatch`（大写），不是 `apk_patch`。必须使用正确的函数签名。

```cpp
#include <jni.h>
#include "apk_patch.h"

extern "C"
JNIEXPORT jint JNICALL
Java_com_xxx_patch_ApkPatch_nativePatch(
        JNIEnv* env,
        jclass,
        jstring oldApk_,
        jstring patch_,
        jstring newApk_) {

    const char* oldApk = env->GetStringUTFChars(oldApk_, 0);
    const char* patch = env->GetStringUTFChars(patch_, 0);
    const char* newApk = env->GetStringUTFChars(newApk_, 0);

    // ApkPatch 参数: oldApkPath, patchFilePath, outNewApkPath, maxUncompressMemory, tempUncompressFilePath, threadNum
    // maxUncompressMemory: 0 表示使用默认值
    // tempUncompressFilePath: nullptr 表示使用内存
    // threadNum: 1 表示单线程
    TPatchResult ret = ApkPatch(oldApk, patch, newApk, 0, nullptr, 1);

    env->ReleaseStringUTFChars(oldApk_, oldApk);
    env->ReleaseStringUTFChars(patch_, patch);
    env->ReleaseStringUTFChars(newApk_, newApk);

    return ret == PATCH_SUCCESS ? 1 : 0;
}
```

---

## 4.4 CMakeLists.txt（生产可用完整版，已修正）

> ⚠️ **关键结论（必读）**：
>
> 在当前版本的 ApkDiffPatch / HDiffPatch 中， ``** 会强制引入 **``**，而该文件在 Android 环境下必然尝试 include **``。
>
> 因此：
>
> - ❌ **仅通过宏（如 **``**）无法彻底规避 libdeflate 报错**
> - ✅ **生产级 Android 方案必须采用“源码白名单”，彻底不编译 **``
>
> 这与官方 `android_ndk_jni_mk` 的实际行为完全一致，只是 CMake 需要显式表达。

---

### 4.4.1 HDiffPatch 在 Android 上的最小必需源码集

**Android 客户端只需要 HDiffPatch 的 patch 功能，不需要 diff / hdiffz / 插件系统。**

必须包含：

```text
HDiffPatch/libHDiffPatch/HPatch/patch.c      # patch 核心算法
HDiffPatch/file_for_patch.c                   # 文件流操作
HDiffPatch/libParallel/*.cpp                  # 并行处理支持
```

必须排除：

```text
HDiffPatch/hdiffz.cpp                         # 命令行工具
HDiffPatch/libHDiffPatch/HDiff/*              # diff 功能（服务端用）
HDiffPatch/compress_plugin_demo.h
```

---

### 4.4.2 正确的 CMakeLists.txt（实测可用版本）

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

# zlib 目录（注意：检查实际目录名是 zlib-1.3.1 还是 zlib1.3.1）
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

> ✅ 采用以上方案后：
>
> - 不再需要 libdeflate
> - 不需要任何额外宏
> - 编译行为与官方 ndk-build 完全一致
> - 是目前 **唯一验证过可长期维护的生产方案**

---

## 4.5 构建 so 的实际步骤

### 方式一：Android Studio（推荐）

1. 打开 Android 工程
2. 选择 Build Variant = **release**，Active ABI = **arm64-v8a**
3. 点击 Build → Assemble Project
4. 生成路径（**注意：新版 AGP 7.0+ 路径已变更**）：

```text
# 旧版 AGP (< 7.0)
app/build/intermediates/cmake/release/obj/arm64-v8a/libapkpatch.so

# 新版 AGP (≥ 7.0)
app/build/intermediates/cxx/Release/<hash>/obj/arm64-v8a/libapkpatch.so
```

### 方式二：命令行

```bash
./gradlew assembleRelease
```

---

## 4.5.1 关于调试符号的重要说明

> ⚠️ **注意**：`intermediates/cxx/` 目录下的 .so 文件**仍包含调试符号**，体积较大（约 2.7 MB）。

### 验证是否包含调试符号

```powershell
# Windows 使用 NDK 中的 llvm-readelf
llvm-readelf.exe -S libapkpatch.so | Select-String "debug"
```

如果输出包含 `.debug_info`、`.debug_line` 等段，说明调试符号未剥离。

### 获取生产用 .so 的方法

**方法 1：手动 strip**

```powershell
# 使用 NDK 中的 llvm-strip
llvm-strip.exe -o libapkpatch_stripped.so libapkpatch.so
```

Strip 后体积：**约 760 KB**（原始 2.7 MB）

**方法 2：从 APK 提取（推荐）**

AGP 打包 APK 时会自动 strip，从输出 APK 中提取即可：

```text
app/build/outputs/apk/release/app-release.apk
  └─ lib/arm64-v8a/libapkpatch.so  # 已自动 strip
```

### 生产环境体积参考

| 版本 | 体积 | 说明 |
|------|------|------|
| 带调试符号 | ~2.7 MB | intermediates 目录原始输出 |
| Strip 后 | ~760 KB | **生产环境应使用此版本** |

---

## 4.6 ABI 校验（非常重要）

> ⚠️ **Windows 注意**：`readelf` 是 Linux 工具，Windows 需使用 NDK 中的 `llvm-readelf`。

### Windows 命令

```powershell
# 使用 NDK 中的 llvm-readelf（路径根据实际 NDK 版本调整）
D:\AndroidSDK\ndk\27.0.12077973\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-readelf.exe -h libapkpatch.so
```

### Linux / macOS 命令

```bash
readelf -h libapkpatch.so
```

### 输出解读

```text
ELF Header:
  Class:                             ELF64
  Machine:                           AArch64    # ← 关键字段
  Type:                              DYN (Shared object file)
```

| Machine 字段 | 对应 Android ABI |
|-------------|------------------|
| `AArch64` | arm64-v8a ✅ |
| `ARM` | armeabi-v7a |
| `Intel 80386` | x86 |
| `Advanced Micro Devices X86-64` | x86_64 |

确保：

- `Machine: AArch64` = arm64-v8a
- 与 Unity 构建 ABI 一致

---

## 4.7 NDK 工程 Package Name 与 SDK 版本配置说明（重要）

### 4.7.1 Package Name 是否有要求？

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

### 4.7.2 compileSdk / minSdk / targetSdk 要求

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

### 4.7.3 NDK 版本与 API Level 选择

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

### 4.7.4 C++ 版本与 Toolchain 配置说明（非常重要）

### 4.7.4.1 C++ 版本要求

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

### 4.7.4.2 是否可以使用 NDK 工程默认 Toolchain？

**结论：可以，而且这是推荐做法。**

#### 默认 Toolchain 指什么？

- Android Gradle Plugin + NDK
- 默认使用：
  - **LLVM / clang**
  - **libc++**

这是当前 Android 官方唯一推荐的 Toolchain。

---

### 4.7.4.3 是否需要指定 STL？

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

### 4.7.4.4 是否需要指定 Toolchain 版本？

**不需要。**

- 使用 Android Studio + NDK 默认配置
- Gradle 会自动选择合适的 clang

仅当出现以下情况才考虑指定：

- 特殊 ROM 编译问题
- 极老 NDK 兼容问题（不推荐）

---

### 4.7.4.5 推荐的最终 CMake / Gradle 配置示例

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

### 4.7.4.6 常见误区（务必避免）

| 误区               | 后果            |
| ---------------- | ------------- |
| 强制 C++17 / C++20 | 编译通过但运行风险上升   |
| 使用旧 gnustl       | NDK r18+ 直接失败 |
| 手动切换 gcc         | 已被官方弃用        |
| 打开 RTTI / 异常     | 无意义，体积变大      |

---

## 4.7.5 常见错误结论速查表

| 问题                 | 是否影响 so   | 说明                              |
| ------------------ | --------- | ------------------------------- |
| applicationId 不一致  | ❌ 不影响     | so 与包名无关                        |
| JNI 类名不一致          | ✅ 致命      | 找不到 native 方法                   |
| compileSdk 过低      | ❌ 不影响     | 仅影响 Java 层                      |
| minSdk < 21        | ⚠️ 风险     | 老系统不建议                          |
| targetSdk 提升       | ❌ 不影响     | 运行时行为不变                         |
| **未关闭 libdeflate** | ❌ 编译直接失败  | 必须定义 `HDIFFPATCH_NO_LIBDEFLATE` |
| **未链接 android 库**  | ⚠️ 可能链接失败 | `AAssetManager` 未定义             |
| **未开启大文件支持**       | ⚠️ 潜在编译错误 | `off64_t` 相关问题                  |
| **ABI 不一致**        | ✅ 运行时崩溃   | `UnsatisfiedLinkError`          |
| **STL 冲突**         | ⚠️ 运行期崩溃  | 不要自定义 STL                       |
| ❌ 不影响              | 运行时行为不变   |                                 |

---

```bash
readelf -h libapkpatch.so
```

确保：

- 只包含目标 ABI
- 与 APK 构建 ABI 一致

---

# 5. Unity 侧集成

## 5.1 文件放置

```
Assets/Plugins/Android/
├─ arm64-v8a/libapkpatch.so
└─ patch.aar (或 classes.jar)
```

---

## 5.2 Unity C# 调用示例

```csharp
public static bool ApplyPatch(string oldApk, string patch, string newApk)
{
    using (var jc = new AndroidJavaClass("com.xxx.patch.ApkPatch"))
    {
        return jc.CallStatic<int>("nativePatch", oldApk, patch, newApk) == 1;
    }
}
```

---

# 6. apkpatch.cpp 工作原理简述

- 顺序读取旧 APK
- 按 ZIP entry 精确还原
- 修复 offset / alignment
- 不触碰 META-INF

> **任何二次处理都会导致 V2 签名失效**

---

# 7. 生产环境 Top 10 失败原因

1. 使用了 split APK
2. ABI 不一致
3. apkpatch.cpp 被修改
4. zipalign 被额外执行
5. patch 与 old.apk 不匹配
6. Debug / Release 构建不一致
7. Unity Gradle 覆盖 so
8. 下载 patch 未校验 hash
9. ROM 文件系统权限问题
10. 多进程并发 patch

---

# 8. 总结（给评审用）

ApkDiffPatch 在客户端并不是“集成 SDK”，而是：

> **直接把 C++ 差分工具链编进 App 内**

成功的唯一前提：

- 统一签名
- 统一构建
- 统一发布链路

---

# 9. Android.mk → CMakeLists.txt 对照与迁移说明（权威）

本章节用于**彻底消除不确定性**，直接以官方 `builds/android_ndk_jni_mk` 为“事实标准”，逐项解释：

- Android.mk 中每一类源码**为什么必须存在**
- 哪些文件**一旦缺失就一定失败**

---

## 9.1 官方 Android.mk 中源码分类说明（逐项解释）

> 以下内容并非猜测，而是基于官方示例工程 + 实际运行路径分析得出。

### 9.1.1 `apk_patch.cpp`

来源：

```
builds/android_ndk_jni_mk/apk_patch.cpp
```

作用：

- 提供 `apk_patch()` 的**外部调用入口**
- 参数校验
- 错误码转换

⚠️ 注意：

- **不是算法实现**
- 但：
  - JNI / CLI 必须通过它调用
  - 不建议自行重写

---

### 9.1.2 `src/patch/*`

作用：

- patch 文件解析
- 差分指令调度
- entry 级别的恢复流程控制

这是：

> **APK 合成阶段的业务中枢**

缺失后果：

- 无法解析 patch
- 直接返回失败

---

### 9.1.3 `src/zip_patch.cpp`

作用：

- ZIP Central Directory 精确重建
- entry 顺序、offset、alignment 保持

这是：

> **V2/V3 签名能否通过的决定性文件**

❌ 任何修改都可能导致签名失效。

---

### 9.1.4 `HDiffPatch/`

作用：

- 二进制级差分还原算法
- patch 指令执行核心

这是：

> **差分更新的数学核心**

---

### 9.1.5 `lzma/`

作用：

- patch 数据的压缩 / 解压

说明：

- patch 默认使用 lzma
- 缺失将导致 patch 无法解码

---

### 9.1.6 `zlib-1.3.1/`

作用：

- ZIP entry 的 deflate / inflate

说明：

- APK 本质是 ZIP
- zlib 是基础依赖

---

## 9.2 为什么客户端绝不能编这些文件？

| 文件                   | 原因             |
| -------------------- | -------------- |
| `src/diff/*`         | 仅用于生成 patch    |
| `src/normalized/*`   | 仅用于服务端 APK 归一化 |
| `zip_diff.cpp`       | 服务端 zip 差分     |
| `apk_normalized.cpp` | 服务端工具          |

---

# 10. Patch 生成 → 验证 → 客户端合成完整流程（生产级）

本章节描述 **端到端真实可落地流程**。

---

## 10.1 服务端 Patch 生成流程

### 10.1.1 APK 归一化（必须）

```bash
apk_normalized old.apk old.norm.apk
apk_normalized new.apk new.norm.apk
```

目的：

- 移除无关字段
- 保证差分稳定

---

### 10.1.2 生成 patch

```bash
apk_diff old.norm.apk new.norm.apk update.patch
```

输出：

- `update.patch`

---

### 10.1.3 Patch 校验（强烈建议）

```bash
apk_patch old.apk update.patch test_new.apk
```

验证：

- 本地是否能成功合成
- 安装是否通过签名校验

---

## 10.2 客户端合成流程（运行时）

1. 获取当前安装 APK 路径
2. 下载 patch（校验 hash）
3. 调用 `apk_patch()` 生成新 APK
4. 调用系统安装 Intent

---

# 11. APK 字节级黑名单（V2/V3 签名必死项）

> 以下行为 **只要出现一次，签名必定失效**。

## 11.1 绝对禁止的操作

- ❌ zipalign
- ❌ 重新压缩 APK
- ❌ 解压再打包
- ❌ 修改 ZIP entry 顺序
- ❌ 修改任何一个字节

---

## 11.2 常见“隐性踩雷点”

| 行为                         | 说明                |
| -------------------------- | ----------------- |
| 使用 FileOutputStream 重写 APK | 会改变 zip 结构        |
| Unity 二次拷贝 APK             | 部分 ROM 会重写 header |
| 使用第三方文件管理器                 | 可能触发文件系统重排        |
| Debug 构建验证 Release patch   | 字节不同              |

---

# 12. 最小可运行 Android NDK Builder 工程（推荐做法）

## 12.1 工程目的

- **只用于编译 libapkpatch.so**
- 不承载业务代码
- 与 Unity 工程彻底解耦

## 12.2 推荐工程结构

```
apkpatch-builder/
├─ app/
│  ├─ src/main/
│  │  ├─ cpp/
│  │  │  ├─ src/patch/
│  │  │  ├─ HDiffPatch/
│  │  │  ├─ lzma/
│  │  │  ├─ zlib-1.3.1/
│  │  │  ├─ android_jni.cpp
│  │  │  └─ CMakeLists.txt
│  │  └─ java/com/company/patch/ApkPatch.java
│  └─ build.gradle
└─ build.gradle

```

## 10.1 工程目的

- **只用于编译 libapkpatch.so**
- 不承载业务代码
- 与 Unity 工程彻底解耦

## 10.2 推荐工程结构

```
apkpatch-builder/
├─ app/
│  ├─ src/main/
│  │  ├─ cpp/
│  │  │  ├─ src/patch/
│  │  │  ├─ HDiffPatch/
│  │  │  ├─ lzma/
│  │  │  ├─ zlib-1.3.1/
│  │  │  ├─ android_jni.cpp
│  │  │  └─ CMakeLists.txt
│  │  └─ java/com/company/patch/ApkPatch.java
│  └─ build.gradle
└─ build.gradle
```

## 10.3 Builder 工程的原则

- applicationId **随意**
- Java 类仅作为 JNI 载体
- 不参与最终 APK 打包

---

# 11. apk\_patch() 调用链与工作流程（逐步解析）

本章节用于**回答一个关键问题**：

> apk\_patch() 到底做了什么？为什么不能动它？

---

## 11.1 调用链总览

```
JNI
 ↓
apk_patch()
 ↓
ZipPatch
 ↓
HDiffPatch
 ↓
文件级还原
```

---

## 11.2 apk\_patch 的核心职责

1. 打开旧 APK（sourceDir）
2. 顺序解析 ZIP Central Directory
3. 读取 patch 中的重建指令
4. 使用 HDiffPatch 还原 entry 内容
5. **按原顺序写入 ZIP entry**
6. 恢复 alignment / offset
7. 完整输出 new\.apk

---

## 11.3 为什么绝对不能二次处理 APK？

- V2/V3 签名覆盖 **整个 APK 字节流**
- 任意字节变化都会导致签名失效

因此：

❌ 不允许 zipalign ❌ 不允许重新压缩 ❌ 不允许修改 META-INF

---

## 11.4 成功与失败的本质判断

- 成功：

  - new\.apk 字节级正确
  - 安装时签名校验通过

- 失败：

  - 任何一个字节偏移错误

---

# 12. 最终落地建议（经验总结）

- 始终以官方 `android_ndk_jni_mk` 为**事实标准**
- CMake 只是表现形式，不是行为改变
- 单 ABI（arm64-v8a）成功率最高
- Builder 工程与 Unity 工程解耦

---

