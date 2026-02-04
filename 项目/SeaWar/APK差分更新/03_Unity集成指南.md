---
tags:
  - SeaWar/更新/APK差分合并
---
# 1. 获取生产用 .so 文件

## 1.1 调试符号说明

`intermediates/cxx/` 目录下的 .so 文件**仍包含调试符号**：

| 版本 | 体积 | 说明 |
|------|------|------|
| 带调试符号 | ~2.7 MB | intermediates 目录原始输出 |
| Strip 后 | ~760 KB | **生产环境应使用此版本** |

## 1.2 验证是否包含调试符号

```powershell
# Windows 使用 NDK 中的 llvm-readelf
D:\AndroidSDK\ndk\27.0.12077973\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-readelf.exe -S libapkpatch.so | Select-String "debug"
```

如果输出包含 `.debug_info`、`.debug_line` 等段，说明调试符号未剥离。

## 1.3 获取 Strip 后的 .so

**方法 1：手动 strip**

```powershell
# Windows
D:\AndroidSDK\ndk\27.0.12077973\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-strip.exe -o libapkpatch_stripped.so libapkpatch.so
```

```bash
# Linux / macOS
$NDK_HOME/toolchains/llvm/prebuilt/linux-x86_64/bin/llvm-strip -o libapkpatch_stripped.so libapkpatch.so
```

**方法 2：从 APK 提取**

AGP 打包 APK 时会自动 strip：

```text
app/build/outputs/apk/release/app-release.apk
  └─ lib/arm64-v8a/libapkpatch.so  # 已自动 strip
```

---

# 2. ABI 校验

## 2.1 校验命令

**Windows**

```powershell
D:\AndroidSDK\ndk\27.0.12077973\toolchains\llvm\prebuilt\windows-x86_64\bin\llvm-readelf.exe -h libapkpatch.so
```

**Linux / macOS**

```bash
readelf -h libapkpatch.so
```

## 2.2 输出解读

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

---

# 3. Unity 文件放置

使用 `.androidlib` 目录（Android 库项目）是推荐方式，所有文件集中管理，便于维护和迁移：

```
Assets/Plugins/Android/
└─ ApkPatch.androidlib/
   ├─ AndroidManifest.xml
   ├─ build.gradle
   └─ src/
      └─ main/
         ├─ java/
         │  └─ com/
         │     └─ xxx/
         │        └─ patch/
         │           └─ ApkPatch.java
         └─ jniLibs/
            └─ arm64-v8a/
               └─ libapkpatch.so    # strip 后的 .so
```

> 💡 Unity 会自动将 `.androidlib` 目录包含在 Gradle 构建中，无需额外配置。

---

# 4. Android 库项目文件

## 4.1 AndroidManifest.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.xxx.patch">
</manifest>
```

## 4.2 build.gradle

```gradle
apply plugin: 'com.android.library'

android {
	// AGP 8.0+ 必须指定，与 package 保持一致
	// 这里的xxx必须和libapkpatch.so中定义的一致
    namespace 'com.xxx.patch'
    compileSdkVersion 33
    
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 33
    }
}

dependencies {
}
```

> ⚠️ **AGP 8.0+ 要求**：必须在 `build.gradle` 中指定 `namespace`，否则会报错 "Namespace not specified"。`namespace` 的值必须与 Java 类的包名一致。

## 4.3 ApkPatch.java

```java
package com.xxx.patch;

public class ApkPatch {
    static {
        System.loadLibrary("apkpatch");
    }

    public static native int nativePatch(String oldApk, String patch, String newApk);
}
```

> ⚠️ 包名 `com.xxx.patch` 必须与 JNI 函数名 `Java_com_xxx_patch_ApkPatch_nativePatch` 一致

> 💡 `System.loadLibrary("apkpatch")` 会自动加载 `libapkpatch.so`，系统会自动添加 `lib` 前缀和 `.so` 后缀。

## 4.4 多 ABI 支持（可选）

如需支持多种 CPU 架构，在 `jniLibs` 下添加对应目录：

```
jniLibs/
├─ arm64-v8a/
│  └─ libapkpatch.so      # 64位 ARM（主流设备）
├─ armeabi-v7a/
│  └─ libapkpatch.so      # 32位 ARM（旧设备）
└─ x86_64/
   └─ libapkpatch.so      # x86_64 模拟器
```

---

# 5. Unity C# 调用示例

```csharp
using UnityEngine;

public static class ApkPatchHelper
{
    /// <summary>
    /// 应用增量补丁
    /// </summary>
    /// <param name="oldApkPath">当前安装的 APK 路径</param>
    /// <param name="patchPath">下载的 patch 文件路径</param>
    /// <param name="newApkPath">输出的新 APK 路径</param>
    /// <returns>返回码</returns>
    public static int ApplyPatch(string oldApkPath, string patchPath, string newApkPath)
    {
#if UNITY_ANDROID && !UNITY_EDITOR
        try
        {
            using (var jc = new AndroidJavaClass("com.xxx.patch.ApkPatch"))
            {
                return jc.CallStatic<int>("nativePatch", oldApkPath, patchPath, newApkPath);
            }
        }
        catch (System.Exception e)
        {
            Debug.LogError($"ApkPatch failed: {e.Message}");
            return 1;
        }
#endif
    }

    /// <summary>
    /// 调用系统安装器安装 APK
    /// </summary>
    public static void InstallApk(string apkPath)
    {
#if UNITY_ANDROID && !UNITY_EDITOR
        using (var unityPlayer = new AndroidJavaClass("com.unity3d.player.UnityPlayer"))
        using (var activity = unityPlayer.GetStatic<AndroidJavaObject>("currentActivity"))
        using (var intent = new AndroidJavaObject("android.content.Intent", "android.intent.action.VIEW"))
        using (var uri = new AndroidJavaClass("android.net.Uri").CallStatic<AndroidJavaObject>("fromFile", 
            new AndroidJavaObject("java.io.File", apkPath)))
        {
            intent.Call<AndroidJavaObject>("setDataAndType", uri, "application/vnd.android.package-archive");
            intent.Call<AndroidJavaObject>("addFlags", 1); // FLAG_GRANT_READ_URI_PERMISSION
            activity.Call("startActivity", intent);
        }
#endif
    }
}
```

---

# 6. 完整更新流程示例

```csharp
public class UpdateManager : MonoBehaviour
{
    public async void CheckAndUpdate()
    {
        // 1. 检查更新
        var updateInfo = await CheckUpdate();
        if (!updateInfo.hasUpdate) return;

        // 2. 下载 patch
        string patchPath = Path.Combine(Application.persistentDataPath, "update.patch");
        await DownloadFile(updateInfo.patchUrl, patchPath);

        // 3. 验证 patch hash
        if (!VerifyHash(patchPath, updateInfo.patchHash))
        {
            Debug.LogError("Patch hash mismatch!");
            return;
        }

        // 4. 获取当前 APK 路径
        string oldApkPath = ApkPatchHelper.GetCurrentApkPath();

        // 5. 执行 patch
        string newApkPath = Path.Combine(Application.persistentDataPath, "new.apk");
        bool success = ApkPatchHelper.ApplyPatch(oldApkPath, patchPath, newApkPath);

        if (success)
        {
            // 6. 验证新 APK hash（可选但推荐）
            if (VerifyHash(newApkPath, updateInfo.newApkHash))
            {
                // 7. 安装新 APK
                ApkPatchHelper.InstallApk(newApkPath);
            }
        }
        else
        {
            Debug.LogError("Patch failed!");
        }
    }
}
```

---

# 7. 常见问题

## 7.1 UnsatisfiedLinkError

```
java.lang.UnsatisfiedLinkError: No implementation found for int com.xxx.patch.ApkPatch.nativePatch
```

**原因**：
- JNI 函数名与 Java 类包名不匹配
- .so 文件 ABI 不正确
- .so 未正确放置在 Plugins/Android 目录

## 7.2 签名校验失败

合成后的 APK 安装时提示签名无效。

**原因**：
- 旧 APK 与 patch 不匹配
- patch 文件下载不完整
- 文件系统修改了 APK 字节

**解决**：
- 验证 patch 文件 hash
- 使用二进制模式读写文件
- 检查是否有其他程序修改了文件

---

# 下一步

- 服务端 Patch 生成 → [04_服务端Patch生成.md](04_服务端Patch生成.md)
- 原理与排错 → [05_原理与排错.md](05_原理与排错.md)
