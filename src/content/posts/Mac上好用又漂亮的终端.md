---
title: Mac上好用又漂亮的终端
slug: mac上好用又漂亮的终端
date: 2020-10-19
updated: 2024-02-12
tags: [macOS, 终端, zsh]
views: 1247
readMinutes: 3
---



由于zsh可使用插件，并且Github上有很多搭配iTerm的开源项目，由此iTerm + zsh是Mac 终端利器一点不为过。

![](https://xtvj.github.io/images/Iterm2.png)

#### iTerm2

安装brew：

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```

安装iTerm2：

```
brew install iterm2
```

或去官网下载安装：https://iterm2.com/downloads.html

#### 代码配色

使用 [iTerm2-Color-Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes) 的配色合集

```
mkdir ~/.iterm2 && cd ~/.iterm2
git clone https://github.com/mbadolato/iTerm2-Color-Schemes
```

#### 导入配色方案

Preferences...→Profiles→Colors→Color Presets...→Import...→选择刚才.iterm2的子文件夹schemes下的所有文件。

导入后重新打开iTerm2再在Colors Presets中选择想用的配色。上图所用配色为Dracula

#### 字体

如果不装字体，配置中有非ascii字符编码，会显示问号乱码，这两个问号本来是好看的箭头，但是箭头在当前字体中是不会被显示的……所以解决方法是重新下载一个支持非ascii编码的字体。

```
# git clone
cd ~/.iterm2
git clone https://github.com/powerline/fonts.git

# install
cd fonts
./install.sh
```

然后按照下面的设置（记得选一个名字后面有for Powerline的字体）

![](https://xtvj.github.io/images/%E5%AD%97%E4%BD%93.png)

#### 设置默认窗口大小：

Preferences...→Profiles→Window→Settings for New Windows ：120：30

#### 安装zsh

```
brew install zsh
```

默认的 shell 是 bash，需要修改为 zsh：

```
sudo sh -c "echo $(which zsh) >> /etc/shells"
chsh -s $(which zsh)
```

使用[oh-my-zsh](https://github.com/robbyrussell/oh-my-zsh)配置zsh

```
sh -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)"
```

安装好后可以看到界面发生了变化，同时会在用户根目录下面产生一个名为 `.zshrc` 的配置文件，以后主要就是修改它了。

#### 配置主题

主题文件存储在 `~/.oh-my-zsh/themes` 目录下，你也可以使用其他的。

推荐 [powerlevel9k](https://github.com/bhilburn/powerlevel9k) 的高颜值主题

```
git clone https://github.com/bhilburn/powerlevel9k.git ~/.oh-my-zsh/custom/themes/powerlevel9k
```

然后修改 `zsh` 主题配置：

```
//修改.zshrc文件（在Mac用户根目录）
ZSH_THEME="powerlevel9k/powerlevel9k"
```

修改配置文件后一定要记得让配置生效，使用 `source` 命令：

```
source ~/.zshrc
```

#### zsh 插件

**插件使用方式：编辑.zshrc文件，文件中有一行plugins=(git)，在括号中添加想使用的插件名，记得加空格分开**

##### extract

用于解压，不用另行安装，直接在plugins中加就行 [官方说明](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/extract)


##### zsh-syntax-highlighting

亮亮功能，安装

```
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

##### zsh-autosuggestions

安装：

```
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

自动提示。历史记录可在用户根目录.zsh_history文件内查看到。

##### macos

Mac下快捷命令应用，参考[官方说明](https://github.com/ohmyzsh/ohmyzsh/tree/master/plugins/macos)，可实现在终端快速定位到访达目录等操作。

---

自用.zshrc中的plugins字段：
```
plugins=(git extract zsh-syntax-highlighting zsh-autosuggestions macos)
```

最后再执行一次

```
source ~/.zshrc
```



参考文章：

[打造 Mac 下高颜值好用的终端环境](https://blog.biezhi.me/2018/11/build-a-beautiful-mac-terminal-environment.html)

[Mac terminal终端或iterm2出现问号解决方案](https://blog.csdn.net/gggg989898/article/details/108882880)
