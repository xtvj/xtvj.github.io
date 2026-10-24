CREATE TABLE IF NOT EXISTS post_views (
  slug TEXT PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0)
);

-- 历史阅读次数。只在首次配置数据库时执行，切勿对已有统计重新覆盖。
INSERT OR IGNORE INTO post_views (slug, views) VALUES
  ('android开发填坑记录', 7253),
  ('gigabyte-z790-aorus-elite-ax黑苹果记录', 2185),
  ('mac上好用又漂亮的终端', 1247),
  ('mac使用技巧', 3541),
  ('pc使用技巧', 266),
  ('redmiac2100在macos下编译相应固件及一些使用记录', 1571),
  ('一些有道理的话', 99),
  ('不root手机禁用系统应用', 807),
  ('五笔拆字表', 136),
  ('使用youtube-dl下载视频音频播放列表中的多个视频或音频', 1341),
  ('命令行中使用git的教程记录', 622),
  ('影视观后记录', 45236),
  ('影视观后记录2', 765);
