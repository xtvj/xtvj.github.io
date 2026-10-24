-- Run once after comments.sql. Existing comments remain public.
ALTER TABLE comments ADD COLUMN avatar_id TEXT;
ALTER TABLE comments ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS admin_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nickname TEXT NOT NULL,
  avatar_id TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
INSERT OR IGNORE INTO admin_profile (id, nickname, avatar_id, updated_at)
VALUES (1, '博主', 'moses', unixepoch());
