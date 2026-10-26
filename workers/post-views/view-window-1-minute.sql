-- Run once on databases created with the former 24-hour view window.
DROP TRIGGER IF EXISTS count_return_view;
DROP INDEX IF EXISTS idx_view_visitors_last_counted;
ALTER TABLE view_visitors RENAME COLUMN last_counted TO last_seen;
CREATE INDEX IF NOT EXISTS idx_view_visitors_last_seen ON view_visitors(last_seen);

CREATE TRIGGER count_return_view
AFTER UPDATE OF last_seen ON view_visitors
WHEN NEW.last_seen - OLD.last_seen >= 60
BEGIN
  INSERT INTO post_views (slug, views) VALUES (NEW.post_slug, 1)
  ON CONFLICT(slug) DO UPDATE SET views = views + 1;
END;
