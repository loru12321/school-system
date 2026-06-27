-- Add composite indexes to cover the common query patterns used by edu-gateway.
-- handleWarningList filters on: project_key, cohort_id, warning_level, status
-- handleRectifyList filters on: project_key, cohort_id, status
--
-- IMPORTANT — run each statement SEPARATELY, NOT inside a transaction:
--   * CREATE INDEX CONCURRENTLY cannot run inside a transaction block.
--   * In the Supabase SQL editor, execute the two statements one at a time
--     (do not wrap them in BEGIN/COMMIT, and avoid the "run all" path if it
--     opens an implicit transaction).
--   * CONCURRENTLY builds the index WITHOUT taking a write lock, so live
--     warning/rectify writes are not blocked — this is the safe variant for
--     production.
--   * If a CONCURRENTLY build is interrupted it leaves an INVALID index.
--     Recover with: DROP INDEX IF EXISTS <name>;  then re-run the statement.
--     Detect invalid indexes:
--       SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;
--
-- Both statements are idempotent (IF NOT EXISTS) and can be re-run safely.

create index concurrently if not exists idx_warning_records_query
  on public.warning_records (project_key, cohort_id, status, warning_level);

create index concurrently if not exists idx_rectify_tasks_query
  on public.rectify_tasks (project_key, cohort_id, status);
