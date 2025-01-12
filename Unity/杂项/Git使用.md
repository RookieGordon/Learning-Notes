---
tags:
  - git
---
# Git常用命令集合
## 提交
使用`git status`查看状态
### 简单提交所有修改（包括新增）
先使用`git add .`将所有修改（新增）的文件提交到暂存区，然后使用使用`git commit -m "描述"`提交，最后使用`git push origin <branch-name>`将更改推送到远程仓库

### 提交若干修改中的某个（某几个）文件
