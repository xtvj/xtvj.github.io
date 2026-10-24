-- Apply to the existing D1 database before setting the first admin password.
CREATE TABLE IF NOT EXISTS admin_auth (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  iterations INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at INTEGER NOT NULL
);

-- Comments awaiting approval under the old workflow become public.
UPDATE comments SET status = 'approved' WHERE status = 'pending';
