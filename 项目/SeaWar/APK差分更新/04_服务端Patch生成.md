# 服务端 Patch 生成指南

## 1. 工具准备

从 ApkDiffPatch 仓库编译或下载以下工具：

| 工具 | 作用 |
|------|------|
| `apk_diff` | 生成 patch |
| `apk_patch` | 验证 patch（可选） |

### 1.1 Python 脚本（推荐）

我们提供了开箱即用的 Python 脚本 `scripts/apk_diff_server.py`，封装了完整的 Patch 生成流程。

#### 配置常量（首次使用需修改）

打开脚本文件，修改顶部的配置区域：

```python
# ============================================================
# 配置区域 - 根据实际环境修改以下常量
# ============================================================

# ApkDiffPatch 工具目录（绝对路径或相对路径）
# 如果工具已加入系统 PATH，可设为 None
TOOLS_DIR: Optional[str] = "D:/tools/ApkDiffPatch/bin"

# CDN 基础 URL，用于生成 manifest.json 中的 patch_url
CDN_BASE_URL: str = "https://cdn.example.com/patches"

# 默认输出目录
DEFAULT_OUTPUT_DIR: str = "./patches"

# 是否默认验证 Patch（推荐开启）
DEFAULT_VERIFY: bool = True
```

配置好后即可直接使用：

```bash
# 安装依赖（可选，用于版本号排序）
pip install packaging

# 查看帮助
python scripts/apk_diff_server.py --help
```

---

## 2. Patch 生成流程

### 2.1 生成 patch

```bash
./apk_diff old.norm.apk new.norm.apk update.patch
```

**输出**：`update.patch`

### 2.2 Patch 校验（强烈建议）

```bash
./apk_patch old.apk update.patch test_new.apk
```

**验证**：

- 本地是否能成功合成
- `test_new.apk` 与 `new.apk` 的 hash 是否一致
- 安装是否通过签名校验

---

## 3. 完整脚本示例

```bash
#!/bin/bash

OLD_APK=$1
NEW_APK=$2
OUTPUT_DIR=$3

# 生成 patch
./apk_diff "$OUTPUT_DIR/old.apk" "$OUTPUT_DIR/new.apk" "$OUTPUT_DIR/update.patch"

# 验证
./apk_patch "$OLD_APK" "$OUTPUT_DIR/update.patch" "$OUTPUT_DIR/test_new.apk"

# 比较 hash
NEW_HASH=$(sha256sum "$NEW_APK" | cut -d' ' -f1)
TEST_HASH=$(sha256sum "$OUTPUT_DIR/test_new.apk" | cut -d' ' -f1)

if [ "$NEW_HASH" == "$TEST_HASH" ]; then
    echo "✅ Patch verification passed!"
    echo "Patch file: $OUTPUT_DIR/update.patch"
    echo "Patch size: $(stat -f%z "$OUTPUT_DIR/update.patch") bytes"
else
    echo "❌ Patch verification failed!"
    echo "Expected: $NEW_HASH"
    echo "Got: $TEST_HASH"
    exit 1
fi
```

### 3.2 Python 脚本使用（推荐）

使用 `scripts/apk_diff_server.py` 可以一键完成上述所有步骤：

#### 单个 Patch 生成

```bash
# 基本用法
python scripts/apk_diff_server.py --old app-1.0.0.apk --new app-1.0.1.apk --output ./patches

# 指定工具目录
python scripts/apk_diff_server.py --old old.apk --new new.apk --output ./patches --tools ./bin

# 指定 CDN URL（用于 manifest.json）
python scripts/apk_diff_server.py --old old.apk --new new.apk --output ./patches \
    --cdn https://cdn.example.com/patches

# 跳过验证（不推荐）
python scripts/apk_diff_server.py --old old.apk --new new.apk --output ./patches --no-verify
```

#### 批量生成

```bash
# 将所有 APK 放入同一目录，脚本会自动按版本号排序生成连续 Patch
# apk_versions/
# ├── app-1.0.0.apk
# ├── app-1.0.1.apk
# ├── app-1.0.2.apk
# └── app-1.1.0.apk

# 生成连续版本 Patch（1.0.0→1.0.1, 1.0.1→1.0.2, 1.0.2→1.1.0）
python scripts/apk_diff_server.py --batch ./apk_versions --output ./patches

# 生成所有版本到最新版本的 Patch（1.0.0→1.1.0, 1.0.1→1.1.0, 1.0.2→1.1.0）
python scripts/apk_diff_server.py --batch ./apk_versions --output ./patches --full-chain
```

#### 输出示例

```
patches/
├── 1.0.0_to_1.0.1/
│   ├── update.patch
│   └── manifest.json
├── 1.0.1_to_1.0.2/
│   ├── update.patch
│   └── manifest.json
└── summary.json          # 批量模式生成汇总报告
```

---

## 4. 服务端部署建议

### 4.1 存储结构

```
patches/
├─ 1.0.0_to_1.0.1/
│  ├─ update.patch
│  └─ manifest.json
├─ 1.0.1_to_1.0.2/
│  ├─ update.patch
│  └─ manifest.json
└─ ...
```

### 4.2 manifest.json 示例

```json
{
    "from_version": "1.0.0",
    "to_version": "1.0.1",
    "patch_url": "https://cdn.example.com/patches/1.0.0_to_1.0.1/update.patch",
    "patch_size": 5242880,
    "patch_hash": "sha256:abc123...",
    "old_apk_hash": "sha256:def456...",
    "new_apk_hash": "sha256:ghi789...",
    "created_at": "2026-01-17T10:00:00Z"
}
```

---

## 5. 客户端合成流程

```
1. 检查更新 → 获取 manifest
         ↓
2. 下载 patch → 校验 patch_hash
         ↓
3. 获取当前 APK 路径
         ↓
4. 调用 ApkPatch() → 生成新 APK
         ↓
5. 校验 new_apk_hash
         ↓
6. 调用系统安装 Intent
```

---

## 6. 体积优化参考

| APK 大小 | 典型 Patch 大小 | 压缩比 |
|---------|----------------|--------|
| 50 MB | 5-15 MB | 70-90% |
| 100 MB | 10-30 MB | 70-85% |
| 500 MB | 30-100 MB | 80-94% |

> 实际压缩比取决于版本间改动量

---

## 7. Python 脚本详细说明

### 7.1 配置常量

脚本顶部提供了配置区域，**建议首次使用时根据环境修改**：

| 常量 | 说明 | 默认值 |
|------|------|--------|
| `TOOLS_DIR` | ApkDiffPatch 工具目录 | `None`（从 PATH 查找）|
| `CDN_BASE_URL` | CDN 基础 URL | `""`（不生成 patch_url）|
| `DEFAULT_OUTPUT_DIR` | 默认输出目录 | `"./patches"` |
| `DEFAULT_VERIFY` | 是否默认验证 Patch | `True` |

配置好常量后，日常使用只需简单命令：

```bash
# 单个 Patch（使用配置常量中的工具路径和 CDN）
python scripts/apk_diff_server.py --old old.apk --new new.apk

# 批量生成
python scripts/apk_diff_server.py --batch ./apk_versions
```

### 7.2 命令行参数

命令行参数可覆盖配置常量：

| 参数 | 说明 |
|------|------|
| `--old` | 旧版本 APK 路径 |
| `--new` | 新版本 APK 路径 |
| `--old-version` | 指定旧版本号（可选，默认从文件名提取）|
| `--new-version` | 指定新版本号（可选，默认从文件名提取）|
| `--batch` | 批量模式：指定 APK 目录 |
| `--full-chain` | 生成所有版本到最新版本的 Patch |
| `--output`, `-o` | 输出目录（覆盖 `DEFAULT_OUTPUT_DIR`）|
| `--tools` | ApkDiffPatch 工具目录（覆盖 `TOOLS_DIR`）|
| `--cdn` | CDN 基础 URL（覆盖 `CDN_BASE_URL`）|
| `--no-verify` | 跳过 Patch 验证 |
| `--workers` | 并行工作数（批量模式）|
| `--verbose`, `-v` | 详细输出 |

### 7.3 版本号自动提取

脚本支持从文件名自动提取版本号，支持以下格式：

- `app-1.0.0.apk`
- `app_v1.0.0.apk`
- `1.0.0.apk`
- `app-release-1.0.0.apk`

### 7.4 汇总报告

批量模式会在输出目录生成 `summary.json`：

```json
{
  "generated_at": "2026-01-19T10:00:00+00:00",
  "total": 3,
  "success": 3,
  "failed": 0,
  "patches": [
    {
      "from": "1.0.0",
      "to": "1.0.1",
      "success": true,
      "patch_size": 5242880,
      "compression_ratio": "85.0%",
      "error": null
    }
  ]
}
```

---

## 8. 常见问题

### 8.1 Patch 过大

**可能原因**：

- 资源文件大量变化
- 压缩方式改变
- 未做 APK 归一化

**解决方案**：

- 确保执行了归一化
- 检查资源打包方式是否一致
- 考虑分包更新

### 8.2 客户端合成失败

**排查步骤**：

1. 确认客户端 APK 与服务端 `old.apk` 完全一致
2. 确认 patch 文件下载完整（校验 hash）
3. 确认存储空间充足
4. 查看 ApkPatch 返回值

### 8.3 签名校验失败

**可能原因**：

- 服务端生成 patch 时使用了错误的旧 APK
- 客户端 APK 被渠道二次签名
- 合成过程中文件被修改

### 8.4 Python 脚本报错

**工具未找到**：
```
以下工具未找到: ['apk_normalized', 'apk_diff', 'apk_patch']
```

解决方案：
1. 确保工具在系统 PATH 中
2. 或使用 `--tools` 参数指定工具目录

**版本号提取失败**：

使用 `--old-version` 和 `--new-version` 手动指定版本号

---

## 9. 安全建议

1. **传输加密**：使用 HTTPS 传输 patch
2. **完整性校验**：客户端验证 patch hash
3. **签名验证**：安装前验证 APK 签名
4. **回滚机制**：保留原 APK 以便回滚
5. **灰度发布**：新版本先小范围测试

---

## 10. CI/CD 集成示例

### 10.1 GitHub Actions

```yaml
name: Generate APK Patch

on:
  release:
    types: [published]

jobs:
  generate-patch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: pip install packaging
      
      - name: Download ApkDiffPatch tools
        run: |
          # 下载预编译工具或自行编译
          wget https://github.com/sisong/ApkDiffPatch/releases/download/v1.0/tools-linux.tar.gz
          tar -xzf tools-linux.tar.gz -C ./bin
          chmod +x ./bin/*
      
      - name: Generate Patch
        run: |
          python scripts/apk_diff_server.py \
            --old ./releases/app-${{ github.event.release.previous_tag }}.apk \
            --new ./releases/app-${{ github.event.release.tag_name }}.apk \
            --output ./patches \
            --tools ./bin \
            --cdn https://cdn.example.com/patches
      
      - name: Upload Patch
        uses: actions/upload-artifact@v4
        with:
          name: patch-${{ github.event.release.tag_name }}
          path: ./patches/
```

### 10.2 Jenkins Pipeline

```groovy
pipeline {
    agent any
    
    parameters {
        string(name: 'OLD_VERSION', description: '旧版本号')
        string(name: 'NEW_VERSION', description: '新版本号')
    }
    
    stages {
        stage('Generate Patch') {
            steps {
                sh """
                    python3 scripts/apk_diff_server.py \\
                        --old ./apks/app-${params.OLD_VERSION}.apk \\
                        --new ./apks/app-${params.NEW_VERSION}.apk \\
                        --output ./patches \\
                        --cdn https://cdn.example.com/patches
                """
            }
        }
        
        stage('Upload to CDN') {
            steps {
                sh """
                    aws s3 sync ./patches/ s3://your-bucket/patches/ --acl public-read
                """
            }
        }
    }
}
