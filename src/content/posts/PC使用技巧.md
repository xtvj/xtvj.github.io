---
title: PC使用技巧
slug: pc使用技巧
date: 2020-04-08
updated: 2024-02-12
tags: [Windows, ffmpeg, 命令行]
views: 266
readMinutes: 1
---

- ##### Excel移动列

  选中列，按住shift键，当鼠标变成十字型时候，可以拖拽到任意指定列

- ##### Win10设置右键打开cmd

  https://blog.csdn.net/mooneve/article/details/78821843

  https://blog.csdn.net/hiudawn/article/details/80701935

- ##### ffmpeg提取字幕流

  ```
  //原始文本输出
  ffmpeg -i output.mkv -an -vn -bsf:s mov2textsub -scodec copy -f rawvideo sub.txt
  ffmpeg -i output.mkv -an -vn -c:s copy -f rawvideo -map 0:s sub2.txt
  //ass格式输出
  ffmpeg -i output.mkv -an -vn -scodec copy sub3.ass
  ```

- ##### Windows自带MD5、SHA1、SHA256命令

  ```
  //certutil -hashfile  <文件名>  <hash类型>
  certutil -hashfile  3.mp4 SHA256
  ```

- ##### ffmpeg合并音频和视频

  ```
  ffmpeg -i video.mp4 -i audio.wav  -c:v copy -c:a aac -strict experimental output.mp4
  ```

  复制音频而无需重新编码，如果您的输出容器可以（几乎）处理任何编解码器（例如MKV），那么您只需复制音频和视频流即可：

  ```
  ffmpeg -i video.mp4 -i audio.wav -c copy output.mkv
  ```
