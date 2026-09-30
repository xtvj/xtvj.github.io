---
title: Mac使用技巧
slug: mac使用技巧
date: 2020-10-29
updated: 2024-03-24
tags: [macOS, 软件]
views: 3541
readMinutes: 8
---

之前很多东西都懒得记录，现在发现改的东西多了，很多细节很容易就忘，故做此流水记录。

首选AppStore  >次选Brew >再者Dmg >最后PKG。

由于我不用appstore安装应用，固能用brew方式安装的应用**尽量用brew安装**。

### 软件：

注：软件名带删除线的为备用软件，需要时再安装。

| 软件                          | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Homebrew                      | [https://brew.sh/](https://brew.sh/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Chrome                        | 下载Chrome使用[国外地址](https://www.google.com/intl/zh-CN/chrome/)，国内地址下来的是国内版，已经与国际版有区别。<br>1、在同步设置使用自定义同步，关闭同步“打开的标签页”，可以取消右键的“发送页面到XX设备”。<br>2、DOH设置自定义：https://94.140.14.140/dns-query                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Ungoogled Chromium            | `brew install --cask eloston-chromium`<br>[开源](https://github.com/Eloston/ungoogled-chromium)去谷歌化的Chromium<br>需要安装[chromium-web-store](https://github.com/NeverDecaf/chromium-web-store)<br>并且`chrome://flags/#extension-mime-request-handling` 改为 `Always prompt for install`<br>才能安装谷歌商店里的插件                                                                                                                                                                                                                                                                                                                                                                                   |
| 扩展uBlacklist                | 订阅中导入：<br>[uBlacklist_sub](https://github.com/xtvj/uBlocklist-additional-settings/raw/master/uBlacklist_sub.txt) 列表仅自用<br>常规中添加通配符<br>https://github.com/xtvj/uBlocklist-additional-settings                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 扩展Tampermonkey              | [Bilibili Evolved](https://github.com/the1812/Bilibili-Evolved)<br>[知乎美化](https://greasyfork.org/zh-CN/scripts/402808-%E7%9F%A5%E4%B9%8E%E7%BE%8E%E5%8C%96)<br>[redirect 外链跳转](https://greasyfork.org/scripts/416338)<br>[知乎增强](https://greasyfork.org/zh-CN/scripts/419081-%E7%9F%A5%E4%B9%8E%E5%A2%9E%E5%BC%BA)<br>                                                                                                                                                                                                                                                                                                                                                                           |
| ~~Rime~~                      | ~~https://rime.im/download/ 、[五笔设置教程](https://segmentfault.com/a/1190000018344603)、[macOS安装配置RIME](https://www.xiebruce.top/1235.html)、[设置默认英文输入](https://github.com/rime/weasel/issues/20)~~ 已切换为系统自带五笔输入法。                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 终端iTerm                     | [Mac上好用又漂亮的终端](https://xtvj.github.io/2020/10/19/Mac%E4%B8%8A%E5%A5%BD%E7%94%A8%E5%8F%88%E6%BC%82%E4%BA%AE%E7%9A%84%E7%BB%88%E7%AB%AF/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ~~Sublime Text 4~~            | `brew install sublime-text`<br>[官网](https://www.sublimetext.com/download)<br>[使用GBK编码中文乱码问题](https://blog.csdn.net/zhanglong_4444/article/details/104464070)<br>[在命令行中打开Sublime Text 3](https://www.jianshu.com/p/426745ad9fed)<br>注册码太难找，Mac版本一直也有小问题。弃用。                                                                                                                                                                                                                                                                                                                                                                                                           |
| vscode                        | [https://code.visualstudio.com/](https://code.visualstudio.com/)<br>替代文本编辑器，不用来当IDE。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 科学上网                      | [ClashX](https://github.com/yichengchen/clashX/releases)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| NeatDownloadManager           | http://neatdownloadmanager.com/index.php/en/<br>下载工具，非常简洁                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Dopamine                      | 开源跨平台的音乐播放器<br>https://github.com/digimezzo/dopamine/releases                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ~~LyricsX~~                   | https://github.com/ddddxxx/LyricsX<br>目前使用体验不好<br>总是自动优先匹配质量很差且不对版的酷狗歌词<br>`brew install lyricsx`<br>歌词显示<br>LyricsX偏好设置--通用--跟随播放器启动和退出                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| AndroidStudio                 | https://developer.android.com/studio<br>或使用cn地址访问，下载后的SHA-256值相同<br>安装后点击Help > Edit Custom VM Options来修改默认最大内存占用，6G（6144m）以上。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| IINA                          | 视频播放器，由于IINA是[开源免费](https://github.com/iina/iina)的，方便[下载安装](https://iina.io/download/)。4K播放稍弱。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Office                        | MicroSoft Office，别的不考虑。<br>官方下载地址集合贴：[https://macadmins.software/](https://macadmins.software/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| PhotoShop                     | 目前使用Adobe_Zii激活。<br>Adobe_Zii没有官方网址。<br>使用[开源工具](https://github.com/Drovosek01/adobe-packager)可以从Adobe官方下载特定版本的程序。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| MarkDown编辑                  | [MarkText](https://github.com/marktext/marktext)<br>目前凑合用。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| qbittorrent                   | 使用[官方原版](https://www.qbittorrent.org/download.php)下载，可手动添加[trackers](https://trackerslist.com/all.txt)或[trackers_all_ip](https://cdn.jsdelivr.net/gh/ngosang/trackerslist@master/trackers_all_ip.txt)<br>或[增强版](https://github.com/c0re100/qBittorrent-Enhanced-Edition)<br>记得打开<br>首选项-连接-IP过滤-勾选匹配tracker<br>首选项-高级-启用内置Tracker-勾选<br>首选项-高级-总是向同级的所有Tracker汇报、总是向所有等级的Tracker汇报-勾选<br>如果经过以上设置后，下载速度还是很慢或无速度，可能原因有三：<br>1、冷门资源无上传者分享(换个种子)。<br>2、Tracker列表不合适此网络环境(更换Tracker列表)<br>3、运营商屏蔽了bt(可在设置-连接中使用代理服务器连接tracker，不用代理连接用户)。 |
| Rectangle                     | `brew install cask rectangle`<br>https://github.com/rxhanson/Rectangle<br>窗口管理工具                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ~~Loopback~~                  | https://rogueamoeba.com/loopback/<br>音频管理工具，配合command + shift + 5等热键可录屏，附带系统和外部麦克的声音。付费应用。<br>[B站视频教程](https://www.bilibili.com/video/BV1LJ411E7cm)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Nodejs + Hexo                 | `brew install node`<br>`sudo npm install hexo-cli -g`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ~~scrcpy~~                    | 安卓手机投屏工具<br>[开源地址](https://github.com/Genymobile/scrcpy)<br>`brew install scrcpy`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| adb                           | `brew install --cask android-platform-tools`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Meld                          | `brew install meld`<br>文件比对工具                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| yt-dlp                        | `brew install yt-dlp/taps/yt-dlp`<br>[命令行工具](https://github.com/yt-dlp/yt-dlp)，无GUI视图。下载命令`yt-dlp 视频网址`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| insomnia                      | 免费好看接口调试工具<br>https://github.com/Kong/insomnia<br>                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| OBS Studio                    | 屏幕录像<br>https://github.com/obsproject/obs-studio<br>开源工具，性能很好，录制视频质量很高。<br>可使用窗口采集，在采集栏右键后选择“**调整输出大小（到源大小）**”录制单个窗口。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ~~Android File Transfer~~     | ~~https://www.android.com/filetransfer/<br>Android与Mac之间文件传输（不使用工具的话可以用adb push或adb pull来操作，不过感觉有点麻烦）~~<br>使用adb操作替代                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Keka                          | 开源解压工具<br>https://github.com/aonez/Keka                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| python3                       | `brew install python`<br>.zshrc文件中添加<br>`alias python=/usr/local/bin/python3`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| OmniGraffle                   | 思维导图<br>https://www.omnigroup.com/omnigraffle                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Calibre                       | 书籍管理<br>https://github.com/kovidgoyal/calibre/releases                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| App Cleaner & Uninstaller Pro | 卸载清理App，付费应用。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| VMware Fusion                 | 虚拟机<br>官方下载地址：<br>https://www.vmware.com/go/getfusion                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ffmpeg                        | `brew install ffmpeg`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Joplin                        | 开源支持Markdown的笔记应用。<br>https://github.com/laurent22/joplin <br>替代OneNote<br>支持使用OneDrive同步数据<br>支持端到端加密                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| FileZilla                     | https://filezilla-project.org/download.php?type=client <br>结合iPhone上的Foobar2000从Mac传大量文件到手机                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Github                        | [https://desktop.github.com](https://desktop.github.com/)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| localsend                     | [localsend](https://github.com/localsend/localsend)开源局域网文件传速                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

### GIt设置代理及配置

配置

```
ssh-keygen -t rsa -C "xtvj@users.noreply.github.com"
```

代理在终端中：

```
git config --global http.proxy 'socks5://127.0.0.1:7890'
git config --global --unset http.proxy
```

如果使用的是Github Desktop，在设置用户根目录下的**.gitconfig**文件

```
[https]
    proxy = http:/127.0.0.1:7890
[http]
    proxy = http://127.0.0.1:7890
[git]
    proxy = socks5://127.0.0.1:7890
```

### 快捷键

| 快捷键                             | 说明                                                            |
| ---------------------------------- | --------------------------------------------------------------- |
| ⌃（control）+ ⌘（command）+ 空格键 | 调出“显示表情与符号”窗口，快速输入Emoji表情或符号               |
| ⌃（control）+ ⌘（command）+ Esc    | 停止录制                                                        |
| ⌘（command）+ u                    | 终端中快速删除当前行                                            |
| ⌘（command）+ Tab                  | 程序切换窗口                                                    |
| ⌘（command）+ `                    | 在当前应用程序内切换窗口                                        |
| Option + ↑，即 Alt + ↑             | 选中当前光标位置内容，或扩大选中内容，Option +  ↓为缩小选中内容 |

### Mac自动隐藏/显示程序坞是默认有1s延迟

终端输入：

```
defaults write com.apple.Dock autohide-delay -float 0 && killall Dock
```

恢复默认：

```
defaults delete com.apple.Dock autohide-delay && killall Dock
```

### 命令行技巧记录

| 问题             | 方案                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| 终端中文件名太长 | 用**Tab键**选择，不用把文件名全部输入。甚至不用输入文件名，输入cd或vim等命令后空格再按Tab就可以选择文件夹或文件了。 |
| curl             | curl -o 文件名 https://***/1.zip 下载并保存文件                                                                     |
| 计算sha256       | shasum -a 256 文件名<br>或者sha256sum 文件名                                                                        |

### 使用终端下载Mac原版系统

使用开源项目[macadmin-scripts](https://github.com/munki/macadmin-scripts)下载原版系统，使用[apple-installer-checksums](https://github.com/notpeter/apple-installer-checksums)里的信息来验证下载内容的SHA1值。

使用 **/Users/Shared或子目录**作为此工具的工作空间，使用Python在终端运行macadmin-scripts里的installinstallmacos.py脚本，如图

![](https://xtvj.github.io/images/%E8%BF%90%E8%A1%8C%E8%84%9A%E6%9C%AC.png)

然后选择要下载的版本

![](https://xtvj.github.io/images/%E9%80%89%E6%8B%A9%E4%B8%8B%E8%BD%BD%E5%B7%A5%E7%89%88%E6%9C%AC.png)

下载完成后等待转换

![](https://xtvj.github.io/images/%E4%B8%8B%E8%BD%BD%E8%BD%AC%E6%8D%A2%E5%AE%8C%E6%88%90.png)

然后到脚本的目录里找下载的文件和[apple-installer-checksums](https://github.com/notpeter/apple-installer-checksums)比对SHA1值，比对正确说明可用转换成功的镜像了。

![](https://xtvj.github.io/images/%E6%AF%94%E5%AF%B9SHA%E5%80%BC.png)

### 删除系统自带的ABC输入法

使用[PlistEditPro](https://www.fatcatsoftware.com/plisteditpro/)工具打开com.apple.HIToolbox.plist文件

```
sudo open ~/Library/Preferences/com.apple.HIToolbox.plist
```

找到选中“ Root ”—“ AppleEnabledInputSources ”下面有 0，1，2 等文件夹，找到第1个文件夹，待找到出现“ ABC ”关键字样的文件夹时，删除整个以数字命名的文件。

### 不使用第三方工具从iPhone传文件到Mac

- 从Apple菜单中，打开系统偏好设置。
- 单击共享选项卡。
- 找到文件共享列，打开文件共享。
- 在iPhone文件中点击右上角的三点图标打开菜单。
- 点击连接服务器，输入Mac上显示的共享地址。
- 在iPhone中输入Mac电脑的账号密码进行连接。

### Adobe genuine message 版权弹窗

1. 关闭所有 Adobe 软件
2. sudo rm /Library/Application\ Support/Adobe/AdobeGCClient/AdobeGCClient.app/Contents/MacOS/AdobeGCClient
3. sudo chmod 0444 /Library/Application\ Support/Adobe/AdobeGCClient
4. 上一行代码如果提示找不到文件夹可新建一个
5. mkdir /Library/Application\ Support/Adobe/AdobeGCClient

### 使用Android Studio自带JDK设置JAVA_HOME

适用版本：Android Studio Flamingo | 2022.2.1 Patch 1

如果使用zsh则在.zshrc文件中添加：

```
export JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home
```

### 全局添加.DS_Store文件到.gitignore

```
touch ~/.gitignore_global
vim ~/.gitignore_global
```

添加以下内容（可自选部分需要的）

```
# Logs and databases #
######################
*.log
*.sql
*.sqlite

# OS generated files #
######################
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
```

之后将文件配置到git

```
git config --global core.excludesfile ~/.gitignore_global
```

### macOS开机iterm2 + oh my zsh会显示xcodebuild

终端延迟三四秒才正常显示，通过查看Git版本发现Git被换成了Apple的Git，可能是安装了Xcode的原因。可通过`brew install git`重新安装Git，然后退出终端再打开就可以了。

### 去掉截图的阴影

```
defaults write com.apple.screencapture disable-shadow -bool TRUE
```

### 设置不自动挂载NTFS盘

1. 执行命令查找不需要挂载的磁盘信息

```
\\列出电脑磁盘的列表
diskutil list
\\显示不需要挂载的磁盘具体信息，主要看UUID，disk0s3换为具体要看的磁盘
diskutil info disk0s3
\\如果没有fstab这个文件就新建一个
touch /etc/fstab
sudo vim /etc/fstab
\\编辑此文件加入，记得更换UUID为自己不想显示的那个磁盘的UUID
UUID=3B87FF76-C6DA-49BF-B911-61DE2331E9F5 none ntfs noauto 0 0
```

### 参考：

1. [XPS15 9550 黑苹果折腾记录](https://www.sqlsec.com/2020/08/xps15.html)
2. [删除自带ABC输入法](https://blog.csdn.net/zhangvalue/article/details/89736604)
3. [Guide to disable adobe genuine message on macos](https://www.reddit.com/r/AdobeZii/comments/ga47c1/guide_to_disable_adobe_genuine_message_on_macos/)
4. [Using JDK that is bundled inside Android Studio as JAVA_HOME on Mac](https://stackoverflow.com/a/43237101)
5. [macOS开机iterm2 + oh my zsh会显示xcodebuild](https://blog.csdn.net/lxyoucan/article/details/116259842)
