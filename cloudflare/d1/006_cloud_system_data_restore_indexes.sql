CREATE INDEX IF NOT EXISTS idx_cloud_system_data_cohort_kind_updated
  ON cloud_system_data(cohort_id, kind, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_cloud_system_data_prefix_cohort_updated
  ON cloud_system_data(key_prefix, cohort_id, updated_at DESC);
