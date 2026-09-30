---
title: 不Root手机禁用系统应用
slug: 不root手机禁用系统应用
date: 2018-06-27
updated: 2024-02-12
tags: [Android, ADB]
views: 807
readMinutes: 2
---

用的三星S7edge升级到了官方的Android8.0系统，更新后原来的Packages disabler pro不能用了，现在又没有Root的方案，想要禁用那些臃肿的系统软件就只能用adb方式了。

手机打开开发者模式，打开usb调试，手机连接电脑，电脑上配置好ADB环境。 执行以下命令 （注:由于禁用了系统自带的文件夹浏览器和网络浏览器，禁用前请先安装一个浏览器或文件管理器，以方便以后安装应用。也可用adb install安装应用。）

```
adb shell
pm disable-user com.mobeam.barcodeService
pm disable-user com.sec.android.widgetapp.samsungapps
pm disable-user com.samsung.android.app.galaxyfinder
pm disable-user com.samsung.android.themestore
pm disable-user com.samsung.android.app.cocktailbarservice
pm disable-user com.samsung.svoice.sync
pm disable-user com.osp.app.signin
pm disable-user com.google.android.onetimeinitializer
pm disable-user com.google.android.ext.shared
pm disable-user com.android.wallpapercropper
pm disable-user com.samsung.android.app.withtv
pm disable-user com.samsung.android.smartmirroring
pm disable-user org.simalliance.openmobileapi.service
pm disable-user com.samsung.android.easysetup
pm disable-user com.sec.android.easyonehand
pm disable-user com.sec.factory
pm disable-user com.samsung.android.app.sbrowseredge
pm disable-user com.samsung.android.wechatwifiservice
pm disable-user com.sec.android.easyMover.Agent
pm disable-user com.samsung.faceservice
pm disable-user com.sec.android.widgetapp.easymodecontactswidget
pm disable-user com.sec.android.app.samsungapps
pm disable-user com.oupeng.max.sdk
pm disable-user com.google.android.configupdater
pm disable-user com.sec.android.app.billing
pm disable-user com.sec.android.daemonapp
pm disable-user com.sec.sve
pm disable-user com.dsi.ant.service.socket
pm disable-user com.sec.android.AutoPreconfig
pm disable-user com.sec.android.app.soundalive
pm disable-user com.samsung.android.securitylogagent
pm disable-user com.samsung.SMT
pm disable-user com.samsung.android.drivelink.stub
pm disable-user com.samsung.hongbaoassistant
pm disable-user com.dsi.ant.sample.acquirechannels
pm disable-user com.android.backupconfirm
pm disable-user com.sec.android.app.SecSetupWizard
pm disable-user com.sec.bcservice
pm disable-user com.sec.android.uibcvirtualsoftkey
pm disable-user com.samsung.android.sdk.professionalaudio.utility.jammonitor
pm disable-user com.android.sharedstoragebackup
pm disable-user com.android.printspooler
pm disable-user com.samsung.android.hmt.vrsvc
pm disable-user com.samsung.storyservice
pm disable-user com.android.dreams.basic
pm disable-user com.sec.android.app.dictionary
pm disable-user com.samsung.android.app.talkback
pm disable-user com.android.bips
pm disable-user com.samsung.android.game.gametools
pm disable-user com.samsung.android.app.simplesharing
pm disable-user com.samsung.android.service.peoplestripe
pm disable-user com.samsung.app.slowmotion
pm disable-user com.sec.enterprise.mdm.vpn
pm disable-user com.samsung.android.weather
pm disable-user com.dsi.ant.plugins.antplus
pm disable-user com.samsung.android.personalpage.service
pm disable-user com.samsung.android.app.taskedge
pm disable-user com.samsung.advp.imssettings
pm disable-user com.sec.android.inputmethod
pm disable-user com.samsung.android.app.advsounddetector
pm disable-user com.samsung.android.app.mirrorlink
pm disable-user com.samsung.android.opencalendar
pm disable-user com.samsung.android.sm
pm disable-user com.google.android.partnersetup
pm disable-user com.sec.android.diagmonagent
pm disable-user com.trustonic.tuiservice
pm disable-user com.samsung.hidden.china
pm disable-user com.sec.spp.push
pm disable-user com.dsi.ant.server
pm disable-user com.sec.android.app.myfiles
pm disable-user com.samsung.android.allshare.service.fileshare
pm disable-user com.sec.android.app.apex
pm disable-user com.google.android.syncadapters.calendar
pm disable-user com.sec.android.app.sbrowser
pm disable-user com.android.dreams.phototable
pm disable-user com.sec.android.service.health
pm disable-user com.samsung.safetyinformation
pm disable-user com.samsung.app.highlightplayer
pm disable-user com.sec.android.app.vepreload
pm disable-user com.samsung.android.keyguardwallpaperupdator
pm disable-user com.android.wallpaper.livepicker
pm disable-user com.samsung.android.beaconmanager
pm disable-user com.sec.enterprise.mdm.services.simpin
pm disable-user com.android.apps.tag
pm disable-user com.samsung.networkui
pm disable-user com.sec.android.soagent
pm disable-user com.sec.android.app.quicktool
pm disable-user com.samsung.android.fmm
pm disable-user com.samsung.android.mdm
pm disable-user com.baidu.map.location
pm disable-user com.mobilesrepublic.sohu.launcher
pm disable-user com.google.android.backuptransport
pm disable-user com.sec.android.yellowpage
pm disable-user com.samsung.android.scloud
pm disable-user com.sec.app.RilErrorNotifier
pm disable-user com.samsung.android.spayfw
pm disable-user com.samsung.android.svoice
pm disable-user com.android.bookmarkprovider
pm disable-user com.samsung.app.newtrim
pm disable-user com.samsung.android.spay
pm disable-user com.samsung.android.bluelightfilter
pm disable-user com.samsung.android.bbc.bbcagent
pm disable-user com.samsung.android.voicewakeup
pm disable-user com.sec.android.splitsound
pm disable-user com.samsung.android.productsearch
pm disable-user com.wssnps
pm disable-user com.samsung.android.app.watchmanagerstub
pm disable-user com.policydm
pm disable-user com.samsung.android.svoiceime
pm disable-user com.samsung.android.mateagent
pm disable-user com.google.android.apps.pdfviewer
pm disable-user com.samsung.android.widgetapp.briefing
pm disable-user com.android.wallpaperbackup
pm disable-user com.sec.enterprise.knox.cloudmdm.smdms
pm disable-user com.samsung.android.app.camera.sticker.stamp.preload
pm disable-user com.android.emergency
pm disable-user com.sec.svoice.lang.en_US
pm disable-user com.wssyncmldm
pm disable-user com.sec.svoice.lang.zh_CN
pm disable-user com.samsung.android.app.appsedge
pm disable-user com.samsung.voiceserviceplatform
pm disable-user com.samsung.aasaservice
pm disable-user com.samsung.android.allshare.service.mediashare
pm disable-user com.android.bluetooth
pm disable-user com.samsung.android.app.clipboardedge
pm disable-user com.sec.android.app.magnifier
pm disable-user com.sec.android.widgetapp.webmanual
pm disable-user com.samsung.android.coreapps
pm disable-user com.samsung.android.video
```

如果想重新启用某个软件，找到软件的包名，执行“pm enable 包名”就可以启用软件了。 如：

```
adb shell pm enable com.sec.android.inputmethod
```

把包名换成你想恢复的包名就行了。

如果你的手机是安卓7.0以前的版本，在禁用手机应用的时候用pm disable，如果是7.0或7.0以上，就用pm disable-user。

附：ADB和Fastboot for Windows 工具下载 https://dl.google.com/android/repository/platform-tools-latest-windows.zip 可以直接解压，在得到的文件夹内按shift+ 右键。选“在此处打开命令窗口”，打开cmd执行代码。 也可参考网上的教程： https://blog.csdn.net/u013250071/article/details/78416274 https://blog.csdn.net/class_brick/article/details/72512982
