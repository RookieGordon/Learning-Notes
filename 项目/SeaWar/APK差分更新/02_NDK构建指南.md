# NDK 构建指南

## 1. JNI 封装代码

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

## 2. CMakeLists.txt（实测可用版本）

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

## 3. build.gradle.kts 配置

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

## 4. HDiffPatch 必需源码

客户端只需要 **patch 功能**，不需要 diff：

### ✅ 必须包含

```text
HDiffPatch/libHDiffPatch/HPatch/patch.c      # patch 核心算法
HDiffPatch/file_for_patch.c                   # 文件流操作
HDiffPatch/libParallel/*.cpp                  # 并行处理支持
```

### ❌ 必须排除

```text
HDiffPatch/hdiffz.cpp                         # 命令行工具
HDiffPatch/libHDiffPatch/HDiff/*              # diff 功能（服务端用）
HDiffPatch/compress_plugin_demo.h
```

---

## 5. 构建步骤

### 方式一：Android Studio

1. 打开 Android 工程
2. 选择 Build Variant = **release**，Active ABI = **arm64-v8a**
3. 点击 Build → Assemble Project

### 方式二：命令行

```bash
./gradlew clean assembleRelease
```

### 输出路径

```text
# 新版 AGP (≥ 7.0)
app/build/intermediates/cxx/Release/<hash>/obj/arm64-v8a/libapkpatch.so
```

---

## 6. 常见编译错误

### 6.1 通配符错误

```
CMake Error: Cannot find source file: src/patch/*.cpp
```

**原因**：`set()` 不支持通配符

**解决**：使用 `file(GLOB ...)`

```cmake
# ❌ 错误
set(SRC src/patch/*.cpp)

# ✅ 正确
file(GLOB SRC src/patch/*.cpp)
```

### 6.2 未定义符号 `read` / `close`

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

### 6.3 未定义符号 `hpatch_TFileStreamInput_close`

**原因**：缺少 `file_for_patch.c`

**解决**：添加到源文件列表

```cmake
set(HDIFFPATCH_HPATCH_SRC
    HDiffPatch/libHDiffPatch/HPatch/patch.c
    HDiffPatch/file_for_patch.c              # ← 添加这行
)
```

### 6.4 未定义符号 `CChannel::close`

**原因**：缺少 libParallel

**解决**：

```cmake
file(GLOB HDIFFPATCH_PARALLEL_SRC
    HDiffPatch/libParallel/*.cpp
)
```

### 6.5 未定义符号 `apk_patch`

**原因**：函数名是 `ApkPatch`（大写），不是 `apk_patch`

**解决**：修改 JNI 代码，包含 `apk_patch.h` 并调用 `ApkPatch()`

---

## 7. C++ 与 Toolchain 配置

### 推荐配置

```cmake
set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
```

### 常见误区

| 误区 | 后果 |
|------|------|
| 强制 C++17 / C++20 | 编译通过但运行风险上升 |
| 使用旧 gnustl | NDK r18+ 直接失败 |
| 手动切换 gcc | 已被官方弃用 |

---

## 下一步

- Unity 集成 → [03_Unity集成指南.md](03_Unity集成指南.md)
- 原理与排错 → [04_原理与排错.md](05_原理与排错.md)
