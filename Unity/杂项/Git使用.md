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
## 撤销提交
### 撤销（本次）提交到暂存区
如果你只是希望撤销提交但保留文件的更改（即，让这些更改处于暂存状态），可以使用`git reset --soft HEAD~1`命令，这会将最新的一次提交撤销，并将所有更改保留在暂存区。
### 撤销（本次）提交到工作区
如果你想撤销提交并将更改保留在工作目录中（而不是暂存区），可以使用`git reset --mixed HEAD~1`命令，这会取消最近的一次提交，并将更改恢复到工作目录但不包括在暂存区中。`--mixed`是默认行为，所以可以只使用`git reset HEAD~1`简化命令。
### 彻底丢弃（本次）修改
如果你想彻底撤销最近的提交，并且不需要保留任何修改（更改将被丢弃），可以使用`git reset --hard HEAD~1`命令，`这将删除最近的一次提交，并且丢弃所有与之关联的更改。这种操作不可逆，所有未提交的更改将被永久丢弃。`
### 保留记录回滚
如果你已经将更改推送到远程仓库并想保证历史记录完整，同时不影响现有分支的开发，你可以使用`git revert HEAD`命令创建一个用于撤销提交的反向提交。这将保留提交历史，但创建一个反向操作的新提交。`revert`是一种`安全`的撤销操作，尤其在已经推送到远程分支时推荐使用。
```cardlink
url: https://blog.csdn.net/qq_36125138/article/details/118606548
title: "git回滚reset、revert、四种模式，超级详细_git revert-CSDN博客"
description: "文章浏览阅读7.8w次，点赞86次，收藏429次。本文详细介绍了在Git中如何使用gitreset和gitrevert来撤销提交。gitreset通过移动HEAD指针实现版本回退，适合完全放弃后续提交；gitrevert则是创建一个新的提交来撤销指定版本，适用于保留部分提交历史。文章提供了具体操作步骤，并讨论了何时选择reset或revert，帮助开发者更好地管理版本控制。"
host: blog.csdn.net
```

```cardlink
url: https://blog.csdn.net/fly910905/article/details/88635673
title: "Git如何优雅的进行版本回退：git reset 和 git revert区别_git reset 和 git resver的区别-CSDN博客"
description: "文章浏览阅读9.9k次，点赞20次，收藏62次。在版本迭代开发过程中，相信很多人都会有过错误提交的时候（至少良许有过几次这样的体验）。这种情况下，菜鸟程序员可能就会虎驱一震，紧张得不知所措。而资深程序员就会微微一笑，摸一摸锃亮的脑门，然后默默的进行版本回退。对于版本的回退，我们经常会用到两个命令：git reset	git revert那这两个命令有何区别呢？先不急，我们后文详细介绍。git reset假如我们的系统现..._git reset 和 git resver的区别"
host: blog.csdn.net
```
