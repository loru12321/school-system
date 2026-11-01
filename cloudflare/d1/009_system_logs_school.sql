-- Scope audit logs by school so a director only reads their own school's logs.
-- The Worker (src/worker-gateway-d1.js ensureSystemLogsSchoolColumn) adds the
-- column lazily as well, so production does not depend on this file having
-- been applied; rows written before the column existed keep school = NULL and
-- remain visible to administrators only.

ALTER TABLE system_logs ADD COLUMN school TEXT;

CREATE INDEX IF NOT EXISTS idx_system_logs_school_created
  ON system_logs(school, created_at DESC);
