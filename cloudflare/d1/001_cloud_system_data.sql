CREATE TABLE IF NOT EXISTS cloud_system_data (
  key TEXT PRIMARY KEY,
  content_text TEXT,
  object_key TEXT NOT NULL DEFAULT '',
  storage_backend TEXT NOT NULL DEFAULT 'd1',
  kind TEXT NOT NULL DEFAULT 'generic',
  key_prefix TEXT NOT NULL DEFAULT '',
  cohort_id TEXT NOT NULL DEFAULT '',
  project_key TEXT NOT NULL DEFAULT '',
  term_id TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cloud_system_data_updated_at
  ON cloud_system_data(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cloud_system_data_cohort_updated
  ON cloud_system_data(cohort_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cloud_system_data_kind_updated
  ON cloud_system_data(kind, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cloud_system_data_key_prefix_updated
  ON cloud_system_data(key_prefix, updated_at DESC);
