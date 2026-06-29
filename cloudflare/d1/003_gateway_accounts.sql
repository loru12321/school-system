CREATE TABLE IF NOT EXISTS system_users (
  username TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'guest',
  roles_json TEXT NOT NULL DEFAULT '[]',
  school TEXT,
  class_name TEXT,
  teacher_name TEXT,
  password_hash TEXT,
  password_scheme TEXT NOT NULL DEFAULT '',
  password_source TEXT NOT NULL DEFAULT '',
  has_password INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_users_role_school
  ON system_users(role, school, class_name, is_active);

CREATE INDEX IF NOT EXISTS idx_system_users_teacher_name
  ON system_users(teacher_name, is_active);

CREATE TABLE IF NOT EXISTS login_sessions (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  school TEXT,
  class_name TEXT,
  session_id TEXT NOT NULL,
  device_label TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  platform TEXT,
  language TEXT,
  timezone TEXT,
  screen TEXT,
  user_agent TEXT,
  ip_address TEXT,
  login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  session_expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS idx_login_sessions_username_login
  ON login_sessions(username, login_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_sessions_status_login
  ON login_sessions(status, login_at DESC);
