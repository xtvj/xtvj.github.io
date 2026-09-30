---
title: 使用youtube dl下载视频、音频、播放列表中的多个视频或音频
slug: 使用youtube-dl下载视频音频播放列表中的多个视频或音频
date: 2020-11-22
updated: 2024-02-12
tags: [macOS, 命令行, 视频]
views: 1341
readMinutes: 3
---



以前找某个歌曲的音频文件找不到的时候就用网页版的工具下载过Youtube上的音乐。前几天Github封杀了youtbe-dl我才知道有这么个开源的命令行工具。使用了下感觉很好，打算当成日常使用工具特此记录下使用技巧。

​ 官网：https://github.com/ytdl-org/youtube-dl

提示：以下代码是在MacOS环境测试，Windows下可能需要换单引号为双引号

### 安装**

```
//安装
brew install youtube-dl 
```

### **常用视频下载步骤**

#### 默认下载方式

```
//直接使用youtube-dl+网址的方式执行
//会默认下载分辨率最高的视频和音频，下载完成后会自动合并
youtube-dl 网址
```

#### 自定义下载视频质量

1. 列中视频可用音/视频格式

```
//两种方式
youtube-dl -F 网址
youtube-dl --list-formats  网址
```

2. 选择要下载的格式

```
//选择编号为136的格式
youtube-dl -f 136 网址
```

![](https://xtvj.github.io/images/youtube-dl%E5%B8%B8%E7%94%A8%E4%B8%8B%E8%BD%BD%E6%AD%A5%E9%AA%A4.png)

### 以最优格式下载视频**

```
//以最优格式下载youtube视频，其它网站暂未测试，官方说Windows下换单引号为双引号
youtube-dl -f 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' 网址

//或者直接使用默认设置，一般会下载两个webm文件，分别为视频和音频，
//再自动合并成附带音轨的webm格式视频，测试发现也是最高分辨率，有4K就下4K版本
youtube-dl 网址
```

### 以最优格式下载音频**

```
//默认下载音频为opus格式
youtube-dl -x 网址

//下载mp3格式的音频
youtube-dl -x --audio-format mp3 网址

//最优格式下载音频
youtube-dl -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 网址
```

![](https://xtvj.github.io/images/youttube-dl%E4%B8%8B%E8%BD%BD%E6%9C%80%E4%BC%98%E9%9F%B3%E9%A2%91.png)

### 下载播放列表中的视频**

```
//使用默认，与下载单个视频格式一样
youtbue-dl 播放列表网址

//可以使用选项--playlist-start, --playlist-end或者指定某个视频 --playlist-items
//--playlist-items 可设置多个值.如："--playlist-items 1,2,5 下载1、2、5项

//下载列表第二个及以后的所有视频
youtube-dl --playstart-start 2 播放列表网址
```

### **限定分辨率下载播放列表中的视频**

```
//以最高480P下载列表第22个及以后的所有视频
youtube-dl --playlist-start 22 -f 'bestvideo[height<=480]+bestaudio/best[height<=480]' 播放列表网址
```

### 下载播放列表中视频的音轨**

```
//使用--playlist-start、--playlist-end、--playlist-items来限定

//最优格式下载播放列表中3-6这四个视频的音频文件，并转换成mp3格式
youtube-dl -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 --playlist-start 3 --playlist-end 6 播放列表网址
```

![](https://xtvj.github.io/images/youtube-dl%E4%B8%8B%E8%BD%BD3-6%E9%9F%B3%E9%A2%91.png)

### Update:2021/02/20

调用aria2加速下载

​ 解决使用youtube-dl默认下载时常常断开连接的问题。前提是已经安装好aria2

`youtube-dl https://www.youtube.com/*** --external-downloader aria2c --external-downloader-args "-x 16 -k 1M"`

**参数说明**

--external-downloader aria2c //调用外部下载工具 --external-downloader-args //外部下载工具指定参数 -x 16 //启用aria2 16个线程，最多就支持16线程 -K 1M //指定块的大小

### Update:2021/11/02

下载速度慢的最新解决方式

发现在YouTube-dl的官方Issues里有非常多关于下载速度慢的提问

#### 解决方式：

网友推荐解决方式之一：使用youtube-dl的二次开发工具[**yt-dlp**](https://github.com/yt-dlp/yt-dlp)

#### 安装方式：

MacOS `brew install yt-dlp/taps/yt-dlp`

官方包发布地址：https://github.com/yt-dlp/yt-dlp/releases

#### 使用方式

和YouTube-dl基本一样，只是把参数`YouTube-dl 网址`换成`yt-dlp 网址`

### Update:2022/04/13

youtube-dl已死

youtube-dl从2021.12.17到现在没发布新版本，只是提交了少许仓库代码，看很多人评价也是youtube-dl已死，推荐使用[**yt-dlp**](https://github.com/yt-dlp/yt-dlp)

### 参考

[以最优格式下载音频](https://xtvj.github.io/posts/%E4%BD%BF%E7%94%A8youtube-dl%E4%B8%8B%E8%BD%BD%E8%A7%86%E9%A2%91%E9%9F%B3%E9%A2%91%E6%92%AD%E6%94%BE%E5%88%97%E8%A1%A8%E4%B8%AD%E7%9A%84%E5%A4%9A%E4%B8%AA%E8%A7%86%E9%A2%91%E6%88%96%E9%9F%B3%E9%A2%91/#%E4%BB%A5%E6%9C%80%E4%BC%98%E6%A0%BC%E5%BC%8F%E4%B8%8B%E8%BD%BD%E9%9F%B3%E9%A2%91) [how-to-download-youtube-videos-as-a-best-quality-audio-mp3-using-youtube-dl](https://askubuntu.com/questions/634584/how-to-download-youtube-videos-as-a-best-quality-audio-mp3-using-youtube-dl)

[Youtube 专业下载工具，Youtube-dl 详细使用教程与初学上手示例](https://www.sysgeek.cn/youtube-dl-examples/)

[Youtube-dl调用外部Aria2多线程加速下载](https://blog.csdn.net/u014389734/article/details/86751840)
