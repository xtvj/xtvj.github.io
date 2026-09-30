---
title: Android开发填坑记录
slug: android开发填坑记录
date: 2019-10-12
updated: 2024-02-12
tags: [Android, Java, 开发]
views: 7253
readMinutes: 15
---



**双冒号运算**就是Java中的[方法引用],[方法引用]的格式是 **类名::方法名。**

一般是用作Lambda表达式

**例如**

表达式:

|     | ```text<br>person -> person.getName();<br>``` |
| --- | --------------------------------------------- |

可以替换成

|     | ```text<br>Person::getName<br>``` |
| --- | --------------------------------- |

表达式

|     | ```text<br>() -> new HashMap<>();<br>``` |
| --- | ---------------------------------------- |

可以替换成

|     | ```text<br>HashMap::new<br>``` |
| --- | ------------------------------ |

这种[方法引用]或者说[双冒号运算]对应的参数类型是Function<T,R> T表示传入类型，R表示返回类型。

---

**Android studio快捷键**

| **按键**                   | **说明**           |
| -------------------------- | ------------------ |
| Shift + F2                 | 定位到错误行       |
| Ctrl(Command)+Shift+ - / + | 折叠/展开全部代码  |
| Ctrl(Command)+F12          | 显示当前文件的结构 |
| Shift + F11                | 查看书签           |
| F11                        | 添加书签           |
| Ctrl + Alt + M             | 快速抽取方法       |

---

一、启动app adb shell am start 包名/MainActivity

二、停止app adb shell am force-stop com.xxx.xxx 这种方法会强制停止APP进程，不会清除APP进程在系统中产生的数据

adb shell pm clear com.xxx.xxx 这种方法不仅会停止APP进程，而且会清除这个APP进程产生的所有数据

---

ffmpeg 卡顿问题

ffmpeg 转码H.264 High Profile的输入做直播时会有卡顿的现象；而且设定的帧率也达不到； 是因为解码H.264 HP的速度达不到造成的。 将编译时的“--disable-optimizations”去掉就可以了；

---

使用Properties做本地储存时，读取的中文为乱码，可以在android studio中进入File > Settings > Editor > File Encodings 里Project Encoding（如果右下角为打对勾，则需要勾选上）

---

指定device来执行adb shell

adb -s devicename shell

---

AtomicBoolean是java.util.concurrent.atomic包下的原子变量，这个包里面提供了一组原子类。其基本的特性就是在多线程环境下，当有多个线程同时执行这些类的实例包含的方法时，具有排他性，即当某个线程进入方法，执行其中的指令时，不会被其他线程打断，而别的线程就像自旋锁一样，一直等到该方法执行完成。

CAS，在Java并发应用中通常指CompareAndSwap或CompareAndSet，即比较并交换。CAS是一个原子操作，它比较一个内存位置的值并且只有相等时修改这个内存位置的值为新的值，保证了新的值总是基于最新的信息计算的，如果有其他线程在这期间修改了这个值则CAS失败。CAS返回是否成功或者内存位置原来的值用于判断是否CAS成功。

可以粗暴地认为是个线程锁功能。

---

Fragment重叠问题

出现这种问题的原因是：当我们旋转屏幕的时候，activity会被销毁并重新创建，并且在销毁之前执行了onSaveInstanceState(Bundle outState)这个方法。这个方法会保存activity的一些信息，其中就包括添加过的fragment，当activity被重新创建时，会初始化其中的变量，这个时候点击底部导航的话会重新去添加fragment，也就导致了重叠的问题。

问题重现：手机的 “设置” - “开发者选项” - 打开”不保留活动”(主要用于模拟Activity被及时回收) 。

解决方法：

一、通过注释掉这句话，这样主 Activity 因为种种原因被回收的时候就不会保存之前的 fragment state

```
@Override
protectedvoidonSaveInstanceState(Bundle outState) {
//如果用以下这种做法则不保存状态，再次进来的话会显示默认tab
//总是执行这句代码来调用父类去保存视图层的状态
//super.onSaveInstanceState(outState);
}
```

二、阻止系统恢复Fragment state，在FragmentActivity保存所有Fragment状态前把Fragment从FragmentManager中移除掉。（不可取，开启新的Activity也可能触发onSaveInstanceState,如果没判空就会崩溃，判空的话，返回这个界面，就是空白，因为Fragment全部被移除了。除非自行判空，没验证。）

```
 protected void onSaveInstanceState(Bundle outState) {
        FragmentTransaction transaction = fm.beginTransaction();
        transaction.remove(tab1);
        transaction.remove(tab2);
        transaction.remove(tab3);
        transaction.remove(tab4);
        transaction.commitAllowingStateLoss();
        super.onSaveInstanceState(outState);
    }
```

三、在onSaveInstanceState(outState)中去保存fragment，当activity被恢复时，取出这些fragment即可。

```
//onCreate方法中
if (savedInstanceState != null) {
            /*获取保存的fragment  没有的话返回null*/
            homeFragment = (HomeFragment) getSupportFragmentManager().getFragment(savedInstanceState, HOME_FRAGMENT_KEY);
            dashboardFragment = (DashboardFragment) getSupportFragmentManager().getFragment(savedInstanceState, DASHBOARD_FRAGMENT_KEY);
            noticeFragment = (NoticeFragment) getSupportFragmentManager().getFragment(savedInstanceState, NOTICE_FRAGMENT_KEY);
            addToList(homeFragment);
            addToList(dashboardFragment);
            addToList(noticeFragment);
        } else {
            initFragment();
        }
```

---

让APP重启自己的两种方法

```
//重启应用
Intent intent = new Intent(getApplicationContext(), MainActivity.class);
intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
startActivity(intent);
android.os.Process.killProcess(android.os.Process.myPid());
```

```
 Intent intent = new Intent(getApplicationContext(), MainActivity.class);
        //重启应用，得使用PendingIntent
        PendingIntent restartIntent = PendingIntent.getActivity(
                getApplicationContext(), 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT);
        //退出程序
        AlarmManager mAlarmManager = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
        mAlarmManager.set(AlarmManager.RTC, System.currentTimeMillis() + 100,
                restartIntent); // 100毫秒后重启应用
        android.os.Process.killProcess(android.os.Process.myPid());
```

---

Android 设置Edittext获取焦点并弹出软键盘

```
        editText.setFocusable(true);
        editText.setFocusableInTouchMode(true);
        editText.requestFocus();
        //显示软键盘
    activity.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_ALWAYS_VISIBLE);
        //如果上面的代码没有弹出软键盘 可以使用下面另一种方式
        //InputMethodManager imm = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
       // imm.showSoftInput(editText, 0); 
```

---

用命令行新建指定大小的文件

在Linux环境下的实现方法

使用dd命令：功能是复制文件，并且可以通过选项指定复制方式。比如

```
dd if=/dev/zero of=test.txt bs=32 count=32
```

（源文件是/dev/zero，目标文件是test.txt，也就是需要生成的文件。复制生成文件大小的是32*32=1024字节）

在Windows环境下的实现方法

使用fsutil命令，在windows xp和win 7下应该都自带了这个命令。命令的格式是 fsutil file createnew 新文件名 文件大小。例如生成一个1K大小的文件，可以使用

```
 fsutil file createnew test.txt 1024
```

---

在activity中调用 moveTaskToBack (boolean nonRoot)方法即可将activity 退到后台，注意不是finish()退出。 参数为false代表只有当前activity是task根，指应用启动的第一个activity时，才有效; 如果为true则忽略这个限制，任何activity都可以有效。

```
//android 应用退到后台，类似最小化
moveTaskToBack(true);
```

---

ANR分析办法之一：traces.txt

```
adb pull /data/anr/traces.txt
```

在文件中使用 ctrl + F 查找包名可以快速定位相关代码。 通过log可以看出相关问题 产生新的ANR，原来的 traces.txt 文件会被覆盖

---

BottomNavigationView切换时不显示图标颜色，需要取消导航栏图标着色。

```
navigation.setItemIconTintList(null);
```

---

**JNI 数据类型映射**

- 基本数据类型：

| Java类型 | 本地类型（Native Type） | 描述                                  |
| -------- | ----------------------- | ------------------------------------- |
| boolean  | jboolean                | C/C++无符号8位整型 （unsigned char）  |
| byte     | jbyte                   | C/C++带符号8位整型 （char）           |
| char     | jchar                   | C/C+无符号16位整型 （unsigned short） |
| short    | jshort                  | C/C++带符号16位整型 （short）         |
| int      | jint                    | C/C++带符号32位整型 （int）           |
| long     | jlong                   | C/C++带符号64位整型 （long）          |
| float    | jfloat                  | C/C++32位浮点型 （float）             |
| double   | jdouble                 | C/C++64位浮点型 （double）            |

基本数据类型的映射即在Java的基本数据类型前面添加 j 就是本地类型的基本数据类型

- 引用数据类型：

| Java类型  | 本地类型（Native Type） | 描述           |
| --------- | ----------------------- | -------------- |
| Object    | jobject                 | 任何java对象   |
| Class     | jclass                  | Class类对象    |
| String    | jstring                 | 字符串对象     |
| Object[]  | jobjectArray            | 任何对象的数组 |
| boolean[] | jbooleanArray           | 布尔型数组     |
| byte[]    | jbyteArray              | 比特型数组     |
| char[]    | jcahrArray              | 字符型数组     |
| short[]   | jshortArray             | 短整型数组     |
| int[]     | jintArray               | 整型数组       |
| long[]    | jlongArray              | 长整形数组     |
| float[]   | jfloatArray             | 浮点型数组     |
| double[]  | jdoubleArray            | 双浮点型数组   |
| void      | void                    |                |

---

沉浸式状态栏

```
    /*
    设置沉浸式状态栏sdk>21，虚拟导航栏也透明
     */
    public static void setStatusBar(Activity context) {
        View decorView = context.getWindow().getDecorView();
        int option = View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
        decorView.setSystemUiVisibility(option);
        context.getWindow().setNavigationBarColor(Color.TRANSPARENT);
        context.getWindow().setStatusBarColor(Color.TRANSPARENT);
    }

    //设置白色状态栏 color用R.color.***
    public static void setWhiteStatusBar(Activity context,int color) {
        int option = View.SYSTEM_UI_FLAG_IMMERSIVE
                | View.SYSTEM_UI_FLAG_VISIBLE;
        context.getWindow().getDecorView().setSystemUiVisibility(option);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            context.getWindow().setStatusBarColor(context.getColor(color));
context.getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
        }
    }

    //设置暗色状态栏
    public static void setDarkStatusBar(Activity context){
        int option = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
        context.getWindow().getDecorView().setSystemUiVisibility(option);
        context.getWindow().setStatusBarColor(Color.TRANSPARENT);
    }
```

---

P版本应用在sd卡根目录(getExternalCacheDir)保存的应用数据卸载时不会被清除，但是Q版本这部分数据实际保存的是应用的沙箱目录 下，卸载的时候回全部被清除；应用如果不想卸载的时候被删除数据，需要应用在manifest文件增加:，这样卸载应用的时候，系统弹出的对话框中才会有第二个勾选框出现(不增加该属性是不会有第二个勾选出现)，默认删除，勾选保留。

---

拍照、选择图片 适配7.0以上，从 Android 7.0 开始，禁止在您的应用外部公开 file:// URI

```
 //指定Uri，拍照返回的data为空
String tempImagePath = getFilesDir().getPath();
tempImageFile = File.createTempFile("image_", ".jpg", new File(tempImagePath));
Intent intent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
if (Build.VERSION.SDK_INT >= 24) {
  intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
  intent.putExtra(MediaStore.EXTRA_OUTPUT,
  FileProvider.getUriForFile(TakePhotoOrChoosePhotoActivity.this,
                                        "com.huangyuanlove.adaptationhighversion.fileprovider", tempImageFile));
} else {
  intent.putExtra(MediaStore.EXTRA_OUTPUT, Uri.fromFile(tempImageFile));
}
startActivityForResult(intent, TAKE_PHOTO_CODE);
```

当拍照返回之后

```
bitmap = BitmapFactory.decodeFile(tempImageFile.getPath());
showImage.setImageBitmap(bitmap);
```

选择图片的时候：

```
Intent albumIntent = new Intent(Intent.ACTION_PICK);
albumIntent.setDataAndType(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, "image/*");
startActivityForResult(albumIntent, CHOOSE_PHOTO_CODE);
```

选择图片返回的时候

```
if (data != null) {
  Uri selectedImage = data.getData();
  String[] filePathColumn = {MediaStore.Images.Media.DATA};
  Cursor cursor = getContentResolver().query(selectedImage,
                                             filePathColumn, null, null, null);
  cursor.moveToFirst();
  int columnIndex = cursor.getColumnIndex(filePathColumn[0]);
  String picturePath = cursor.getString(columnIndex);
  cursor.close();
  bitmap = BitmapFactory.decodeFile(picturePath);
  showImage.setImageBitmap(bitmap);
}
```

---

自定义View

https://www.gcssloop.com/category/customview

---

google flexboxlayout

layout_wrapBefore：这个属性使得子 View 可以强制换行，该属性在 flex_wrap 属性值 为 nowrap（不换行）的时候是无效的。 该属性结束 boolean 变量，默认 false，即不强制换行。

layout_flexGrow：这个属性类似于 LinearLayout 中的 layout_weight 属性，如果没有指定，则将 0 设置为默认值。如果果同一 flex 行中的多个子 View 有正的 layout_flexGrow 值，那么剩余的空闲空间将根据它们声明的 layout_flexGrow 值的比例分布。

---

ROOM数据库使用填坑

引入：

```
//Room数据库
implementation "androidx.room:room-runtime:2.2.0-alpha01"
annotationProcessor "androidx.room:room-compiler:2.2.0-alpha01"
```

如果多加一行implementation "androidx.room:room-compiler:2.2.0-alpha01"，会导致项目中多出很多没用的libs，包括com.ibm.icu:icu4j等，可能使得apk整整多出15M没用的文件。

---

[让APK只包含指定平台的so库（abi）](https://blog.csdn.net/wangliblog/article/details/56834439)

第一种：对每个要生成的渠道包进行分别配置（在app下的build.gradle文件中配置） 第二种：全局配置（这种需求比较多，同样是在app下的build.gradle下配置）

---

PriorityBlockingQueue：

PriorityBlockingQueue 是一个无界的并发队列。它使用了和类 java.util.PriorityQueue 一样的排序规则。你无法向这个队列中插入 null 值。所有插入到 PriorityBlockingQueue 的元素必须实现 java.lang.Comparable 接口。因此该队列中元素的排序就取决于你自己的 Comparable 实现

---

使用SparseArray和ArrayMap代替HashMap

1、如果key的类型已经确定为int类型，那么使用SparseArray，因为它避免了自动装箱的过程，如果key为long类型，它还提供了一个LongSparseArray来确保key为long类型时的使用

2、如果key类型为其它的类型，则可使用ArrayMap

如果我们要兼容aip19以下版本的话，那么导入的包需要为v4包

---

通过以下代码可以列出设备底层支持的编码格式

```
MediaCodecList codecList = new MediaCodecList(MediaCodecList.ALL_CODECS);
for (int i = 0; i < codecList.getCodecInfos().length; i++) {  
    Log.d(TAG, "编解码器: " + codecList.getCodecInfos()[i].getName());
}
```

---

如果遇到硬编H264等一些视频编码时，编出来的数据显示正常，但晃动摄像头时数据量变大，带宽占用很高，设置低一点的码率也不起作用时。很可能是系统的编码器支持的不够好，可用上面的方式获取系统支持的编解码器有哪些，在new MediaCodec的时候使用MediaCodec.createByCodecName(“OMX.google.h264.encoder”)等一些固定的编解码器，再查看效果。(OMX.google.h264.encoder为软编)

---

getChildFragmentManager()是fragment中的方法， 返回的是管理当前fragment内部子fragments的manager。 getFragmentManager()在activity和fragment中都有。getChildFragmentManager在fragment内嵌套fragment时使用。

---

DataBinding中notifyPropertyChanged(int *)只会更新一个字段的数据，notifyChange()会更新所有字段数据。 DataBinding资源引用只限于控件本身，比如button的paddingLeft里可以用三元表达，因为paddingLeft是控件自带的，但是margin就不行，因为margin是控件组里的属性，不能使用dataBinding的功能，不然会报找不到ActivityBindingBindingImpl的错。

---

Integer类取值和 int 类型取值一致，取值范围是从-2147483648 至 2147483647 ，包括-2147483648 和 2147483647，即-$$2^{31}$$ ~$$2^{31}$$ -1。

但是对于Integer类，java为了提高效率，初始化了-128--127之间的整数对象，因此Integer类取值-128--127的时候效率最高。

---

Fork/Join 框架是java7中加入的一个并行任务框架，可以将任务分割成足够小的小任务，然后让不同的线程来做这些分割出来的小事情，然后完成之后再进行join，将小任务的结果组装成大任务的结果。

例如求一个文件夹的大小：

```
private static class FileSizeFinder extends RecursiveTask<Long> {
        final File file;
        public FileSizeFinder(final File theFile) {
            file = theFile;
        }
        @Override
        public Long compute() {
            long size = 0;
            if (file.isFile()) {
                size = file.length();
            } else {
                final File[] children = file.listFiles();
                if (children != null) {
                    List<ForkJoinTask<Long>> tasks = new ArrayList<ForkJoinTask<Long>>();
                    for (final File child : children) {
                        if (child.isFile()) {
                            size += child.length();
                        } else {
                            tasks.add(new FileSizeFinder(child));
                        }
                    }
                    for (final ForkJoinTask<Long> task : invokeAll(tasks)) {
                        size += task.join();
                    }
                }
            }
            return size;
        }
    }
    long size = new ForkJoinPool().invoke(new FileSizeFinder(new File("/home")));
```

---

Netty拆包：LengthFieldBasedFrameDecoder的使用

发送数据包长度 = 长度域的值 + lengthFieldOffset + lengthFieldLength + lengthAdjustment

lengthAdjustment： 长度域的值的补偿，长度域的值加上这个值之后的值是这个长度域后面还需要读取的字节数

使用LengthFieldBasedFrameDecoder时注意设置ByteOrder.LITTLE_ENDIAN或ByteOrder BIG_ENDIAN（默认值）

---

在ConstraintLayout中设置控件的宽高时，尽量不在比例前加W或H，这样可以在横竖屏下都可以在屏内保持宽高比，不然控件边界可能会超出屏幕。

---

Android Studio 在WiFi中启用adb工具

adb tcpip 5555 //端口设置，手机必须通过USB与电脑连接，之后可不用USB连接，也不用再次执行此命令 adb connect 192.168.1.1 //改成手机本地IP地址

在Terminal里输入即可。

从android11开始支持下面连接方式进行wifi调试：

https://wiki.lineageos.org/how-to/adb-over-wifi

- **On your phone**
1. Go to the developer settings
2. Press `Enable Wireless debugging`
3. Select `Pair device with pairing code`

You will see a dialog showing you IP address, port and a code.

- **On your computer**
1. Open a command line window

2. Type `adb pair <ip>:<port>` and replace `<ip>` and `port` with the data seen on the phone

3. You will be asked for the pairing code. Type it in and hit Enter

4. You will now see an output similar to `Successfully paired to <ip>:<port>`

   测试发现此方式只需连接一次，下次再连接时直接在手机上打开wifi调试就能自动连接电脑，重启手机后也是如此。

---

var是Java10里面的特性。用来定义局部变量

语法： **var 变量名 = 初始值；**

1，var只能在**方法内**定义变量，不允许定义类的成员变量。 2，var 定义变量必须赋初始值。

---

SQL语句中IN 操作符允许您在 WHERE 子句中规定多个值，比如选取 name 为 "Google" 或 "菜鸟" 的所有网站：

```
SELECT * FROM Websites WHERE name IN ('Google','菜鸟');
```

LIKE的意思是搜索列中的指定模式。比如：

```
SELECT * FROM Websites WHERE name LIKE 'G%';//选取 name 以字母 "G" 开始的所有客户
SELECT * FROM Websites WHERE name LIKE '%oo%';//选取 name 包含模式 "oo" 的所有客户
```

---

ViewBinding使用时如果遇到include，可以给include加一个id，然后：

```
 binding = MainFragmentBinding.inflate(inflater, container, false);
 toolbarBinding = binding.toolbar;//include里的toolbar
 return binding.getRoot();
```

---

Room数据库使用记录

| OnConflictStrategy          | 释义                             |
| --------------------------- | -------------------------------- |
| OnConflictStrategy.REPLACE  | 冲突策略是取代旧数据同时继续事务 |
| OnConflictStrategy.ROLLBACK | 冲突策略是回滚事务               |
| OnConflictStrategy.ABORT    | 冲突策略是终止事务               |
| OnConflictStrategy.FAIL     | 冲突策略是事务失败               |
| OnConflictStrategy.IGNORE   | 冲突策略是忽略冲突               |

---

TextView添加可点击网址时在String文件中加入：

|     | ```perl<br><a href="http://www.google.com">Google</a><br>``` |
| --- | ------------------------------------------------------------ |

而不是用:

|     | ```xml<br><a href="http://www.google.com">Google</a><br>``` |
| --- | ----------------------------------------------------------- |

layout中的TextView添加

|     | ```bash<br>android:linksClickable="true"<br>``` |
| --- | ----------------------------------------------- |

代码中设置

```
textView.text = HtmlCompat.fromHtml(getString(R.string.requestrootmessage),HtmlCompat.FROM_HTML_MODE_LEGACY)
textView.movementMethod = LinkMovementMethod.getInstance()
```

---

通过在 `<service>` 标签里将 `android:exported` 设置为 `false`。可以防止其他的程序来启动你的 Service。

---

前台服务

新建一个服务。

```none
public class ForegroundService extends Service {

  private static final int RESULT_CODE = 0;
  private static final int ID = 1;

  public ForegroundService() { }

  @Override
  public void onCreate() {
    super.onCreate();
    Intent intent = new Intent(this, MainActivity.class);
    PendingIntent pendingIntent = PendingIntent.getActivity(this, RESULT_CODE, 
                              intent, PendingIntent.FLAG_UPDATE_CURRENT);
    NotificationCompat.Builder builder;
    // 兼容 Android 8.0
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      String channelId = "foreground_service";
      NotificationChannel channel = new NotificationChannel(channelId, 
                              "channel_1", NotificationManager.IMPORTANCE_HIGH);
      channel.enableLights(true);
      channel.setLightColor(Color.GREEN);
      channel.setShowBadge(true);
      NotificationManager notificationManager = 
                                                    getSystemService(NotificationManager.class);
      notificationManager.createNotificationChannel(channel);
      builder = new NotificationCompat.Builder(this, channelId);
    } else {
      builder = new NotificationCompat.Builder(this);
    }
    builder.setContentIntent(pendingIntent)
      .setContentTitle("这是前台通知标题")
      .setContentText("这是内容")
      .setWhen(System.currentTimeMillis())
      .setSmallIcon(R.mipmap.ic_launcher_round)
      .setLargeIcon(BitmapFactory.decodeResource(getResources(), 
                                                 R.mipmap.ic_launcher))
      .setPriority(NotificationManager.IMPORTANCE_HIGH)
      .setDefaults(Notification.DEFAULT_SOUND);

    startForeground(ID, builder.build());
  }

  @Override
  public int onStartCommand(Intent intent, int flags,
                            int startId) {
    return super.onStartCommand(intent, flags, startId);
  }

  @Override
  public IBinder onBind(Intent intent) {
    return super.onBind(intent);
  }
}
```

启动与停止前台服务

```none
Intent foregroundIntent = new Intent(this, ForegroundService.class);
startService(foregroundIntent); // 启动前台服务
stopService(foregroundIntent); // 停止前台服务
```

---

**黑白屏产生原因**:当我们在启动一个应用时，系统会去检查是否已经存在这样一个进程，如果不存在，系统的服务会先检查startActivity中 息，然后在去创建进程，最后启动Acitivy，即冷启动。而启动出现白黑屏的问题，就是在这段时间内产生的。系统在绘制页面加载布局之 初始化窗口(Window)，而在进行这一步操作时，系统会根据我们设置的Theme来指定它的Theme 主题颜色，我们在Style中的设置就决定是白屏还是黑屏。

windowIsTranslucent和windowNoTitle，将这两个属性都设置成true (会有明显的卡顿体验，不推荐) 如果启动页只是是一张图片，那么为启动页专一设置一个新的主题，设置主题的android:windowBackground属性为启动页背景图即可 使用layer-list制作一张图片launcher_layer.xml，将其设置为启动页专一主题的背景，并将其设置为启动页布局的背景。

---

String、StringBuffer、StringBuilder区别

String:字符串常量 不适用于经常要改变值得情况，每次改变相当于生成一个新的对象 StringBuffer:字符串变量 (线程安全)  
StringBuilder:字符串变量(线程不安全) 确保单线程下可用，效率略高于StringBuffer

---

Handler的原理

Android中主线程是不能进行耗时操作的，子线程是不能进行更新UI的。所以就有了handler，它的作用就是实现线程之间的通信。 handler整个流程中，主要有四个对象，handler，Message,MessageQueue,Looper。当应用创建的时候，就会在主线程中创建handler对象， 我们通过要传送的消息保存到Message中，handler通过调用sendMessage方法将Message发送到MessageQueue中，Looper对象就会不断的调用loop不断的从MessageQueue中取出Message交给handler进行处理。从而实现线程之间的通信。

---

Flow收集数据需要放在单独协程中，因为flow.collect或collectLatest是挂起函数，执行完这个函数后后面的代码才能执行。

---

使用paging3的时候，如果对本地数据库数据修改后，列表失效并重载，表现为闪烁后跳到第一项，可尝试修改为`enablePlaceholders = true`

---

为CardView添加阴影时不起作用，可能需要添加margin才能显示。

---

执行`adb kill-server`

出现错误：`cannot connect to daemon at tcp:5037: Connection refused`

可以执行`adb reconnect`来解决。
