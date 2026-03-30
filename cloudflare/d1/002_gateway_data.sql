CREATE TABLE IF NOT EXISTS issues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL DEFAULT '',
  student_class TEXT NOT NULL DEFAULT '',
  school TEXT NOT NULL DEFAULT '',
  issue_type TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  contact_info TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_issues_status_created
  ON issues(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_issues_school_class_status
  ON issues(school, student_class, status, created_at DESC);

CREATE TABLE IF NOT EXISTS system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator TEXT,
  action TEXT NOT NULL DEFAULT '',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'normal',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_logs_status_created
  ON system_logs(status, created_at DESC);

CREATE TABLE IF NOT EXISTS config_alias_rules (
  id TEXT PRIMARY KEY,
  rule_type TEXT NOT NULL,
  standard_name TEXT NOT NULL,
  alias_name TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'global',
  project_key TEXT,
  cohort_id TEXT,
  school_name TEXT,
  grade_range TEXT,
  priority INTEGER NOT NULL DEFAULT 100,
  is_active INTEGER NOT NULL DEFAULT 1,
  remark TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_config_alias_rules_scope
  ON config_alias_rules(rule_type, alias_name, IFNULL(project_key, ''), IFNULL(cohort_id, ''));

CREATE INDEX IF NOT EXISTS idx_config_alias_rules_type
  ON config_alias_rules(rule_type, is_active, updated_at DESC);

CREATE TABLE IF NOT EXISTS warning_records (
  id TEXT PRIMARY KEY,
  warning_type TEXT NOT NULL,
  warning_code TEXT NOT NULL,
  warning_level TEXT NOT NULL DEFAULT 'medium',
  project_key TEXT,
  cohort_id TEXT,
  snapshot_key TEXT,
  exam_id TEXT,
  school_name TEXT,
  grade_name TEXT,
  class_name TEXT,
  subject_name TEXT,
  teacher_name TEXT,
  student_name TEXT,
  source_module TEXT,
  metric_name TEXT,
  metric_value REAL,
  threshold_value REAL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warning_records_scope
  ON warning_records(project_key, cohort_id, exam_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_warning_records_status
  ON warning_records(status, warning_level, updated_at DESC);

CREATE TABLE IF NOT EXISTS rectify_tasks (
  id TEXT PRIMARY KEY,
  source_warning_id TEXT,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  project_key TEXT,
  cohort_id TEXT,
  exam_id TEXT,
  school_name TEXT,
  grade_name TEXT,
  class_name TEXT,
  subject_name TEXT,
  teacher_name TEXT,
  student_name TEXT,
  problem_desc TEXT,
  action_plan TEXT,
  owner_name TEXT,
  assist_users_json TEXT NOT NULL DEFAULT '[]',
  due_date TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  progress INTEGER NOT NULL DEFAULT 0,
  review_result TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rectify_tasks_scope
  ON rectify_tasks(project_key, cohort_id, exam_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rectify_tasks_status
  ON rectify_tasks(status, priority, due_date);

CREATE TABLE IF NOT EXISTS snapshot_versions (
  id TEXT PRIMARY KEY,
  version_name TEXT NOT NULL,
  project_key TEXT NOT NULL,
  cohort_id TEXT NOT NULL,
  snapshot_key TEXT,
  exam_scope TEXT,
  score_hash TEXT,
  teacher_hash TEXT,
  target_hash TEXT,
  alias_hash TEXT,
  config_hash TEXT,
  summary_json TEXT NOT NULL DEFAULT '{}',
  is_stable INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_snapshot_versions_scope
  ON snapshot_versions(project_key, cohort_id, created_at DESC);

CREATE TABLE IF NOT EXISTS system_users_staging (
  username TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'guest',
  roles_json TEXT NOT NULL DEFAULT '[]',
  school TEXT,
  class_name TEXT,
  teacher_name TEXT,
  has_password INTEGER NOT NULL DEFAULT 0,
  password_display TEXT,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_system_users_staging_role_school
  ON system_users_staging(role, school, class_name);

CREATE TABLE IF NOT EXISTS migration_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  dataset_name TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  detail_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_migration_runs_source_dataset
  ON migration_runs(source_name, dataset_name, created_at DESC);
