-- 010: Teacher self-service change requests, deletion tombstones, and email
-- verification codes (inspired by space-ledger governance patterns).
-- Fully idempotent and replayable on a fresh database.

CREATE TABLE IF NOT EXISTS teacher_change_requests (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  teacher_name TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  current_class_name TEXT NOT NULL DEFAULT '',
  proposed_class_name TEXT NOT NULL DEFAULT '',
  current_subjects_json TEXT NOT NULL DEFAULT '[]',
  proposed_subjects_json TEXT NOT NULL DEFAULT '[]',
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_username TEXT NOT NULL DEFAULT '',
  review_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teacher_change_requests_status_school
  ON teacher_change_requests(status, school, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_teacher_change_requests_username
  ON teacher_change_requests(username, created_at DESC);

CREATE TABLE IF NOT EXISTS deletion_tombstones (
  id TEXT PRIMARY KEY,
  resource_type TEXT NOT NULL,
  resource_key TEXT NOT NULL,
  school TEXT NOT NULL DEFAULT '',
  actor_username TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deletion_tombstones_type_key
  ON deletion_tombstones(resource_type, resource_key);

CREATE INDEX IF NOT EXISTS idx_deletion_tombstones_deleted_at
  ON deletion_tombstones(deleted_at DESC);

CREATE TABLE IF NOT EXISTS email_verification_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL DEFAULT '',
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'password_reset',
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TEXT NOT NULL,
  consumed_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email_created
  ON email_verification_codes(email, created_at DESC);
