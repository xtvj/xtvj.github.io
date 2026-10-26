-- Apply once to the existing D1 database. The original post_views table and counts stay intact.
CREATE TABLE IF NOT EXISTS view_visitors (
  post_slug TEXT NOT NULL,
  visitor_hash TEXT NOT NULL,
  last_seen INTEGER NOT NULL,
  PRIMARY KEY (post_slug, visitor_hash)
);

CREATE INDEX IF NOT EXISTS idx_view_visitors_last_seen ON view_visitors(last_seen);

CREATE TRIGGER IF NOT EXISTS count_first_view
AFTER INSERT ON view_visitors
BEGIN
  INSERT INTO post_views (slug, views) VALUES (NEW.post_slug, 1)
  ON CONFLICT(slug) DO UPDATE SET views = views + 1;
END;

CREATE TRIGGER IF NOT EXISTS count_return_view
AFTER UPDATE OF last_seen ON view_visitors
WHEN NEW.last_seen - OLD.last_seen >= 60
BEGIN
  INSERT INTO post_views (slug, views) VALUES (NEW.post_slug, 1)
  ON CONFLICT(slug) DO UPDATE SET views = views + 1;
END;

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_slug TEXT NOT NULL,
  parent_id INTEGER REFERENCES comments(id) ON DELETE SET NULL,
  nickname TEXT NOT NULL CHECK (length(nickname) BETWEEN 1 AND 30),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 2000),
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_comments_public ON comments(post_slug, status, id);
CREATE INDEX IF NOT EXISTS idx_comments_moderation ON comments(status, id);
