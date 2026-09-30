---
title: 命令行中使用Git的教程记录
slug: 命令行中使用git的教程记录
date: 2022-05-10
updated: 2024-02-12
tags: [Git, 命令行]
views: 622
readMinutes: 2
---



命令行才是王道，尽量摈弃GUI的Git操作。

---

### git pull：对下列文件的本地修改将被合并操作覆盖

这种情况是由于自己修改了文件未提交。

如果不想舍弃对本地的修改，请在合并前提交或贮藏您的修改

```
# 贮藏修改
git stash
```

然后

```
git pull
```

最后

```
git stash pop
```

这个过程自动合并。如果成功，则自动此备分从git stash中删除。如果有冲突，则你需要手动解决冲突。一般可用`git restore 文件`来恢复文件。

---

### 下载带有引用其他项目的代码

如果要clone的项目有其它项目的引用，可使用以下代码下载

```
git clone --recurse-submodules  git://github.com/***/**.git
```

或者在常规clone后执行

```
git submodule init 
git submodule update
```

---

### 项目A引用项目B的分支

要添加 Git 子模块，请使用“git submodule add”命令并指定要作为子模块包含的 Git 远程存储库的 URL。

```
//destination_folder为子模块的本地目录名，如果未提供，它将为远程存储库名
git submodule add <remote_url> <destination_folder>
```

**获取新的子模块提交**

请进入您的子模块文件夹并首先运行`git fetch`命令

现在，如果您再次运行“git log”命令，您将能够看到您希望集成的新提交。

```
git log --oneline origin/master -3

93360a2 (origin/master, origin/HEAD) Second commit
88db523 First commit
43d0813 (HEAD -> master) Initial commit
```

为了让您的子模块与最新提交一致，您可以运行“git checkout”命令并指定要将子模块更新到的 SHA

```
git checkout -q 93360a2
```

**删除 Git 子模块**

```
git submodule deinit <submodule> 
git rm <submodule>
```

### 强制“git pull”覆盖本地文件

```
git reset --hard HEAD
git pull
```

### 更新并覆盖本地版本

```
git fetch --all
git reset --hard origin/abranch
git checkout abranch   
```

### 引用

1、[How to "git clone" including submodules? - Stack Overflow](https://stackoverflow.com/questions/3796927/how-to-git-clone-including-submodules)

2、[How To Add and Update Git Submodules – devconnected](https://devconnected.com/how-to-add-and-update-git-submodules/#Add_a_Git_Submodule)

3、[version control - How do I force "git pull" to overwrite local files? - Stack Overflow](https://stackoverflow.com/questions/1125968/how-do-i-force-git-pull-to-overwrite-local-files)

4、[deployment - Git command to checkout any branch and overwrite local changes - Stack Overflow](https://stackoverflow.com/questions/18487089/git-command-to-checkout-any-branch-and-overwrite-local-changes)
