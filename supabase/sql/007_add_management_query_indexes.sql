-- Add composite indexes to cover the common query patterns used by edu-gateway.
-- handleWarningList filters on: project_key, cohort_id, warning_level, status
-- handleRectifyList filters on: project_key, cohort_id, status

create index if not exists idx_warning_records_query
  on public.warning_records (project_key, cohort_id, status, warning_level);

create index if not exists idx_rectify_tasks_query
  on public.rectify_tasks (project_key, cohort_id, status);
