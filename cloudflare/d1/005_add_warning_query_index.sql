-- Cover handleWarningList's combined filter: project_key + cohort_id + status + warning_level.
-- The existing idx_warning_records_scope covers (project_key, cohort_id, exam_id)
-- and idx_warning_records_status covers (status, warning_level) separately,
-- but neither handles the combined multi-column filter efficiently.

CREATE INDEX IF NOT EXISTS idx_warning_records_query
  ON warning_records (project_key, cohort_id, status, warning_level, updated_at DESC);
