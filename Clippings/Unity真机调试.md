---
title: "Unity真机调试"
source: "https://zhuanlan.zhihu.com/p/616063381"
author:
  - "[[创世者取上求中]]"
published:
created: 2025-06-19
description: "近期项目出现了不少性能问题，真机环境下与Editor差异很大，需要对真机环境的程序状态做监控。这些内容不复杂但比较零碎，因此做一些记录。（此章节会持续更新） 一、环境设置1.1 Building SettingDevelopment Bui…"
tags:
  - "clippings"
---
对真机环境的程序状态做监控。这些内容不复杂但比较零碎，因此做一些记录。（此章节会持续更新）

## 一、环境设置

### 1.1 Building Setting

![](https://pic1.zhimg.com/v2-94db52388e0aafdcafd02cc9fdfe2fd4_1440w.jpg)

- Development Build - 启用此设置后，Unity 会设置宏 `DEVELOPMENT_BUILD` ，在构建版本中包含脚本调试符号和性能分析器
- Autoconnect Profiler - 启动程序时自动连接Unity Profiler
- Deep Profiling Support - 详细的Profiler数据
- Script Debugging - 真机代码调试
![](https://pic3.zhimg.com/v2-b6a7c85a4136a8099ca4f29aafe00eea_1440w.jpg)

渲染相关设置

需要统一Color Space与图形API，以免出现Unity Editor与真机渲染效果不一致。

![](https://pic1.zhimg.com/v2-bc55062cb7353469ab4dd436d26f82fe_1440w.jpg)

推荐使用 [IL2CPP](https://zhida.zhihu.com/search?content_id=225034464&content_type=Article&match_order=1&q=IL2CPP&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NTA0MTk4MzIsInEiOiJJTDJDUFAiLCJ6aGlkYV9zb3VyY2UiOiJlbnRpdHkiLCJjb250ZW50X2lkIjoyMjUwMzQ0NjQsImNvbnRlbnRfdHlwZSI6IkFydGljbGUiLCJtYXRjaF9vcmRlciI6MSwiemRfdG9rZW4iOm51bGx9.q22CEfh5NF1g8uy-9wH9V0cxw_pf83oZpsD4J4Vo3SQ&zhida_source=entity) 下的ARM64架构，ARMv7对于内存以及兼容性会有一些问题，容易出现崩溃。当然如果项目需求支持ARMv7就是另外一件事了。

### 1.2 Andorid Tools

![](https://pica.zhimg.com/v2-122e0d9284ae64a823a6d4d4d4af6fb2_1440w.jpg)

需要下载好JDK、SDK以及NDK，Unity有给到默认的版本，也可以使用自己本地版本。

ADB的全称为 [Android Debug Bridge](https://zhida.zhihu.com/search?content_id=225034464&content_type=Article&match_order=1&q=Android+Debug+Bridge&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NTA0MTk4MzIsInEiOiJBbmRyb2lkIERlYnVnIEJyaWRnZSIsInpoaWRhX3NvdXJjZSI6ImVudGl0eSIsImNvbnRlbnRfaWQiOjIyNTAzNDQ2NCwiY29udGVudF90eXBlIjoiQXJ0aWNsZSIsIm1hdGNoX29yZGVyIjoxLCJ6ZF90b2tlbiI6bnVsbH0.viwnglzQYSZC7d_pDvYBq6rgB6_DbzeTUVZ8rQk8F3U&zhida_source=entity) ，是用来调试Android程序的工具。可以使用SDK Platform Tools安装，或者下载Android Studio来安装。使用adb help命令查看是否安装成功。

  

## 二、获取日志

### 2.1 常用adb接口

- 卸载|覆盖安装apk：adb uninstall com.xxx.yyy.zzz | adb install -r xx.apk
- 断开连接 | 启用连接：adb kill-server | adb start-server
- 查看设备分辨率：adb shell - wm size
- 清理缓存日志： adb logcat -c
- 保存日志： adb logcat -v \*:E time > D:\\Logcat\\logcat.log
- 输出崩溃日志： adb shell dumpsys dropbox --print > log-crash.txt
![](https://pic4.zhimg.com/v2-47d95ca5ddf3100cbe7bd14de7976a43_1440w.jpg)

若出现adb连接失败需要检查：（1）手机是否开启USB调试；（2）USB连接是否稳定；（3）是否存在多个设备连接，若存在可以指定安装设备（adb devices查看设备id，adb -s xxx installl xxx.apk）

小米手机安装apk失败时，检查USB设置。第一次开启USB安装apk，会检测网络连接和SIM（好坑）

![](https://pic1.zhimg.com/v2-58ecb7ea032bea0173824dab4ca9b8c2_1440w.jpg)

若出现adb.exe: failed to check server version: protocol fault (couldn’t read status): Connection reset by peer，表示adb使用的5037号端口被占用。使用以下命令处理

```
// 查看使用的服务连接
netstat -aon|findstr "5037"

// 查看连接对应的exe
tasklist|findstr "XXPID"

// 关闭使用的进程
taskkill /pid XXPID /f
```

  

### 2.2 模拟器

在模拟器中即使开启了Profiler的相关设置，可能仍然无法与Unity连接，就需要手动将日志保存下来。不同模拟器处理可能略有不同，一般都会给到处理方式。此处以Mumu模拟器为例

![](https://pic2.zhimg.com/v2-296f8d43d7ffab2baae2b3d11c3d479d_1440w.jpg)

Mumu模拟器教程入口

![](https://pic4.zhimg.com/v2-023f930da6d94593190530c325c0d8c3_1440w.jpg)

模拟器adb服务路径：~\\emulator\\nemu\\vmonitor\\bin

可以使用bat文件快捷处理，只需替换相关文件路径：

```
@Echo off
chcp 65001

start "C:\windows\explorer.exe" "D:\快捷工具"
cd /d "D:\Program Files\MuMu\emulator\nemu\vmonitor\bin"
adb_server.exe connect localhost:7555
adb_server.exe logcat -c
adb_server.exe logcat>D:\快捷工具\log.txt

pause
```

  

### 2.3 Android真机

开启Profiler相关选项，可以直接在Unity Console中获取Android日志。但若没有开启相关选项，可以通过上面提到的Adb接口来保存日志。可以配合Unity Profiler、Memory Profiler、Lua Profiler使用。这里给到Bat脚本，清理并保存Android日志。

```
@Echo off
chcp 65001
start "C:\windows\explorer.exe" "D:\快捷工具\"
adb kill-server
adb start-server
adb logcat -c
adb logcat *:E > log.txt
pause
```

当开启Develop选项，但调式时真机没有连接Unity，可尝试输入以下命令，再从Unity中选择指定的端口

```
adb kill-server
adb start-server
adb forward tcp:34999 localabstract:Unity-com.xx.xxx
```
![](https://pic1.zhimg.com/v2-819aa60cd77725a26dfef6f12bfab228_1440w.jpg)

## 三、Android堆栈还原

### 3.1 手动还原

Android的崩溃问题往往只有Native日志，无法直接定位Script。这样就需要将Native日志还原为Script堆栈信息，便于追查问题根源。这里给到某次真机Crash日志，但无法直接根据日志定位问题

```
signal 11 (SIGSEGV), code 1 (SEGV_MAPERR), fault addr 0x0
Cause: null pointer dereference
    x0  00000071f003b5d0  x1  00000071f003f830  x2  00000071f003b938  x3  00000071f003f830
    x4  000000000000000a  x5  00000072776f5718  x6  0000000000000000  x7  0000000080808080
    x8  00000071f00400d0  x9  00000071f003b930  x10 0000000000000000  x11 00000071f003b630
    x12 00000071f003b588  x13 0000000000000001  x14 0000000000000001  x15 0000000000000000
    x16 0000007277a2c1d8  x17 0000007395125540  x18 0000007276828000  x19 0000007210005840
    x20 00000071f003f830  x21 0000007fec818280  x22 00000071a06686f0  x23 0000007276d4b1e4
    x24 0000007272a71028  x25 00000071a06686f0  x26 0000007399069020  x27 0000000000000000
    x28 0000007fec818870  x29 0000007fec8186b0
    sp  0000007fec818250  lr  0000007276c31fc8  pc  0000007276b33904

#00 pc 0xde904 libunity.so 
#01 pc 0x1dcfc4 libunity.so 
#02 pc 0x1dcf80 libunity.so 
#03 pc 0x1da29c libunity.so 
#04 pc 0x2f6828 libunity.so 
#05 pc 0x2f6300 libunity.so 
#06 pc 0x2f8224 libunity.so 
#07 pc 0x2f85e8 libunity.so 
#08 pc 0x3893f0 libunity.so 
#09 pc 0x138702c libil2cpp.so 
#10 pc 0x138473c libil2cpp.so 
#11 pc 0x138529c libil2cpp.so 
#12 pc 0x138d704 libil2cpp.so 
#13 pc 0xe43054 libil2cpp.so 
#14 pc 0xe43054 libil2cpp.so 
#15 pc 0x57c738 libil2cpp.so 
#16 pc 0x4e4044 libil2cpp.so 
#17 pc 0x4e8edc libil2cpp.so 
#18 pc 0x4be484 libil2cpp.so 
#19 pc 0xb64928 libil2cpp.so 
#20 pc 0x129fb40 libil2cpp.so 
#21 pc 0x12a2d88 libil2cpp.so 
#22 pc 0x58fac4 libil2cpp.so 
#23 pc 0x4e4044 libil2cpp.so 
#24 pc 0x2df794 libunity.so 
#25 pc 0x2e2fc4 libunity.so 
#26 pc 0x18a45c libunity.so 
#27 pc 0x1bf390 base.odex
```

想要还原日志需要用到： **[addr2line.exe](https://zhida.zhihu.com/search?content_id=225034464&content_type=Article&match_order=1&q=addr2line.exe&zd_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ6aGlkYV9zZXJ2ZXIiLCJleHAiOjE3NTA0MTk4MzIsInEiOiJhZGRyMmxpbmUuZXhlIiwiemhpZGFfc291cmNlIjoiZW50aXR5IiwiY29udGVudF9pZCI6MjI1MDM0NDY0LCJjb250ZW50X3R5cGUiOiJBcnRpY2xlIiwibWF0Y2hfb3JkZXIiOjEsInpkX3Rva2VuIjpudWxsfQ.hmgiDCJOKBIEi3rVkStNC2sugM7BW5ra2I2FQ-_HM7U&zhida_source=entity) 和相关的so文件**

libunity.sym.so是Unity提供的 [制表符文件](https://link.zhihu.com/?target=https%3A//docs.unity3d.com/cn/current/Manual/android-symbols.html) ，其中包含本地 Unity 库的符号文件。符号文件包含一个表，该表将活动内存地址转换为您可以使用的信息，例如方法名称。其相对安装路径为Data\\PlaybackEngines\\AndroidPlayer\\Variations\\il2cpp\\Release\\Symbols，根据之前提到的Target Architectures选中需要的版本。

如果使用了IL2CPP，Unity在构建时会生成 **libil2cpp.sym.so。** Unity 2021.3打包时提供了生成symbols.zip的功能，打包时可调用 [EditorUserBuildSettings.androidCreateSymbols](https://link.zhihu.com/?target=https%3A//docs.unity3d.com/ScriptReference/EditorUserBuildSettings-androidCreateSymbols.html) 进行设置。

![](https://pic4.zhimg.com/v2-604c0725f411b755e749b731665662eb_1440w.jpg)

![](https://pic2.zhimg.com/v2-88509e0026e07156ae9cc23ccbec4e55_1440w.jpg)

Unity安装目录下的libunity.sym.so

![](https://pic1.zhimg.com/v2-8998d1c33b5dc71ac390eb21b5383616_1440w.jpg)

项目生成的libil2cpp.sym.so

![](https://pic4.zhimg.com/v2-ed24507f48892ce19649af413ff73077_1440w.jpg)

打包生成的libil2cpp符号表文件

addr2line.exe是打包apk时，NDK提供的工具，可以通过读取符号表来解析崩溃堆栈。通常使用64位工具处理，相对路径为toolchains\\aarch64-linux-android-4.9\\prebuilt\\windows-x86\_64\\bin

![](https://pic4.zhimg.com/v2-17867cb1503054e327bfc821e0be79b1_1440w.jpg)

准备好之后就可以调用addr2line.exe，根据内存地址还原堆栈，具体格式为：addr2line.exe libunity.sym.so 内存地址1 内存地址2...，那么还原上面的Crash日志，调用的Bat代码如下

```
@Echo off

"aarch64-linux-android-addr2line.exe" -f -C -e "libunity.sym.so" 0xde904 0x1dcfc4 0x1dcf80 0x1da29c 0x2f6828 0x2f6300 0x2f8224 0x2f85e8 0x3893f0
"aarch64-linux-android-addr2line.exe" -f -C -e "libil2cpp.sym.so" 0x138702c 0x138473c 0x138529c 0x138d704 0xe43054 0xe43054 0x57c738 0x4e4044 0x4e8edc 0x4be484 0xb64928 0x129fb40 0x12a2d88 0x58fac4 0x4e4044 
"aarch64-linux-android-addr2line.exe" -f -C -e "libunity.sym.so" 0x2df794 0x2e2fc4 0x18a45c

pause
```

  

### 3.2 脚本还原

手动还原日志需要将Crash的内存地址一个一个复制到调用参数中，费时费力。因此编写一个自动解析工具就有些必要了,核心就是提取内存地址。下面是解析日志的关键代码

```csharp
public string ParseFile(string logPath)
{
    var lines = File.ReadAllLines(logPath);
    StringBuilder sb = new StringBuilder();
    foreach (var line in lines)
    {
        var nline = line.Trim();
        var items = nline.Split(' ').ToList();
        items.RemoveAll(s => string.IsNullOrWhiteSpace(s));

        var t1 = items.ToArray();
        int index1 = Array.FindIndex(t1, 0, t1.Length, x => x.Contains("libunity.so"));
        if (index1 > 0)
        {
            string stack = Exclute(textSOPath.Text, t1[index1 - 1]);
            sb.Append(stack);
            continue;
        }

        int index2 = Array.FindIndex(t1, 0, t1.Length, x => x.Contains("libil2cpp.so"));
        if (index2 > 0)
        {
            string stack = Exclute(textILPath.Text, t1[index2 - 1]);
            sb.Append(stack);
            continue;
        }
    }
    return sb.ToString();
}

public string Exclute(string soPath, string address)
{
    string args = $"-f -C -e \"{soPath}\" {address}";
    Console.WriteLine(args);

    ProcessStartInfo info = new ProcessStartInfo(textExePath.Text, args);
    info.CreateNoWindow = false;
    info.UseShellExecute = false;
    info.RedirectStandardError = true;
    info.RedirectStandardOutput = true;
    info.Verb = "runas";

    Process process = new Process
    {
        StartInfo = info
    };
    process.Start();

    string output = process.StandardOutput.ReadToEnd();
    string errors = process.StandardError.ReadToEnd();
    return output;
}
```
![](https://picx.zhimg.com/v2-8883ad3599851137c69ce75770c0f0d1_1440w.jpg)

## 四、相关插件

### 4.1 Unity Profiler & Lua Profiler & Memory Profiler

  

### 4.2 Render Doc

  

## 参考

- [Developing for Android](https://link.zhihu.com/?target=https%3A//docs.unity3d.com/Manual/android-developing.html)
- [support.unity.com/hc/en](https://link.zhihu.com/?target=https%3A//support.unity.com/hc/en-us/articles/115000292166-Symbolicate-Android-crash)

编辑于 2025-05-15 17:32・上海[Unity（游戏引擎）](https://www.zhihu.com/topic/19568806)[Android 手机](https://www.zhihu.com/topic/19556388)