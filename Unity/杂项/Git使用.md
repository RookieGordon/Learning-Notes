---
tags:
  - git
---
# Git常用命令集合
## 提交
先使用`git pull origin <branch-name>`进行更新操作，解决冲突后，使用`git status`查看状态。
### 简单提交所有修改（包括新增）
先使用`git add .`将所有修改（新增）的文件提交到暂存区，然后使用使用`git commit -m "描述"`提交，最后使用`git push origin <branch-name>`将更改推送到远程仓库
如果提交内容中包含删除的文件，那么就需要使用到`git rm <deleted-file>`命令。
### 提交若干修改中的某个（某几个）文件
有时候，我们不需要提交所有变动，那么就需要挑选需要提交的内容。`git add <file1> <file2>`m命令可以指定哪些文件需要添加到暂存区，`git rm <deleted-file1> <deleted-file2>`可以指定哪些文件需要被删除。如果文件比较多，使用`git add -i`进行交互式添加，这样可以按交互提示来选择哪些文件要被添加。