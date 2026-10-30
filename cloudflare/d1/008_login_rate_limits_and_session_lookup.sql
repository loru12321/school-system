-- Tables/indexes that were previously only created lazily by the Worker
-- (src/worker-auth.js ensureLoginRateLimitTable / ensureLoginSessionsTable).
-- Applying this migration keeps fresh databases identical to production; the
-- Worker keeps its IF NOT EXISTS guards as a safety net.

CREATE TABLE IF NOT EXISTS login_rate_limits (
  scope_key TEXT PRIMARY KEY,
  failed_count INTEGER NOT NULL DEFAULT 0,
  first_failed_at TEXT NOT NULL,
  last_failed_at TEXT NOT NULL,
  locked_until TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_rate_limits_locked_until
  ON login_rate_limits(locked_until);

-- resolveSession checks login_sessions.status by session_id for revocation.
CREATE INDEX IF NOT EXISTS idx_login_sessions_session_id
  ON login_sessions(session_id);
