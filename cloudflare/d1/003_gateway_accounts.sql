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
  password_display TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_users_role_school
  ON system_users(role, school, class_name, is_active);

CREATE INDEX IF NOT EXISTS idx_system_users_teacher_name
  ON system_users(teacher_name, is_active);
