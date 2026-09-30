---
title: RedmiAC2100在MacOS下编译相应固件及一些使用记录
slug: redmiac2100在macos下编译相应固件及一些使用记录
date: 2021-06-29
updated: 2024-02-12
tags: [路由器, macOS, 命令行]
views: 1571
readMinutes: 4
---

## 坏块和刷机教程

在淘宝上买的，到手后检测是东芝的闪存有三个坏块，直接找客服换货才发来一个**ESMT闪存没坏块**的。

检测和刷机教程网上一大堆，我用的是：[红米(小米)AC2100无需Telnet刷入Breed和Padavan固件教程](https://www.right.com.cn/forum/thread-4054150-1-1.html)。

#### 使用终端连接路由器

```
ssh root@192.168.1.1
```

#### 终端与路由器之间传文件

scp命令是在没连ssh状态下操作的。输入后要输入路由器的密码。

```
//复制当前目录下本地文件1到路由器tmp目录下并保存为文件2。
scp 文件1 root@192.168.1.1:/tmp/文件2
```

```
//复制路由器tmp目录下文件2到当前目录并保存为文件1
scp root@192.168.1.1:/tmp/文件2 文件1
```

如果出现：ash: /usr/libexec/sftp-server: not found

在scp等命令后加-O，如

```
scp -O root@192.168.2.1:/opt/accelerated-domains.china.conf.txt ac.txt
```

#### Openwrt官方固件

RedmiAC2100(**架构ramips、处理器mt7621**)：https://downloads.openwrt.org/

#### Luci

有无Luci的区别就是能不能在浏览器输入192.168.1.1来操作路由器

在终端里刷入**squashfs-kernel1.bin和squashfs-rootfs0.bin**的则**没有Luci**

使用Breed刷入**initramfs-kernel.bin**的，则**有Luci**。

如果没有Luci又不会使用终端配置拨号上网的话，要用别的路由拨号正常上网，AC2100用网线连接介于正常路由与电脑之间后，再用ssh连接ac2100通过`opkg update && opkg install luci`来安装Luci。

#### Mac环境编译Openwrt

**官网目前没把MacOS放在支持的列表中**。但自己喜欢这系统，决定试试，换到MacOS环境编译(11.4)

1. 使用**磁盘工具**创建一个**区分大小写**的虚拟盘
2. clone代码
3. **make工具换成GNU的make**。
4. 执行`./scripts/feeds update -a`后会在终端提示配置环境缺少哪些工具，我目前环境提示少了四个，使用brew search搜索这四个工具再安装就行了。
5. `./scripts/feeds install -a`
6. `make menuconfig`
7. `make`

##### 报错一：

```
No rule to make target `.config',blablablabla. Stop.
```

找到一个[说是依赖的东西没成功](https://www.right.com.cn/forum/thread-742118-1-1.html)下载。

在最后一步之前**执行`make download V=s`等待下载完依赖**，再执行make就能~~*成功编译*~~了。

##### 报错二：

使用make -j1 V=sc来编译并查看log发现提示说**与VMware Fusion的环境变量冲突**，期间还看到有人几年前用[MacOS编译](https://p3terx.com/archives/compiling-openwrt-with-macos.html)过，于是卸载了虚拟机再试着~~*编译成功了。*~~

##### 报错三：

看了下生成的文件是默认的ath79架构，没有生成我需要的固件。

重新下载重新配置并编译，报错如图

![](https://xtvj.github.io/images/toplevel_error.jpg)

根据[网友的方法](https://github.com/coolsnowwolf/lede/issues/4815)，试了下。成功编译并生成相应的固件了。

![](https://xtvj.github.io/images/ac2100_success.png)

#### 安装Adguard Home：

由于luci-app-adguard长时间不更新，使用时经常出问题，切换使用官方包安装，不再使用图形界面。

官方下载地址：https://github.com/AdguardTeam/AdGuardHome/releases

英文安装教程地址：https://forum.openwrt.org/t/howto-running-adguard-home-on-openwrt/51678

下载版本为： AdGuardHome_linux_mipsle_softfloat.tar.gz

##### 备忘：添加自定义防火墙

```
iptables -t nat -A PREROUTING -i br-lan -p udp --dport 53 -j DNAT --to 192.168.1.1:5353
iptables -t nat -A PREROUTING -i br-lan -p tcp --dport 53 -j DNAT --to 192.168.1.1:5353
```

#### OpenWrt设置web管理页面的ip地址

web管理地址也就是输入地址在浏览器中管理路由器的那个ip地址，一般为192.168.1.1

但是如果光猫是**自动拨号**的话，**路由器就不用拨号**，需要改成**dhcp协议**连接网络，此时，路由器的管理ip与光猫的管理ip就相同了，会有冲突。

配置文件位置为 /etc/config/network ，改字段ipaddr的地址为你想要的地址，然后重启路由器即可。

```#
# vim /etc/config/network
config interface 'lan'
        option ifname 'eth0.1'
        option type 'bridge'
        option force_link '1'
        option proto 'static'
        option netmask '255.255.255.0'
        option ipaddr '192.168.2.1'
        option ip6assign '60'
```

参考地址：https://www.openwrt.pro/post-618.html

#### 开启160MHz带宽

国家代码改为：US

信道改为36-44或之间的值
