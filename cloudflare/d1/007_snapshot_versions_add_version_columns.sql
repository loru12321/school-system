-- Migration 007: add updated_at and version columns to snapshot_versions
-- Required for optimistic-locking fix to the is_stable race condition.

ALTER TABLE snapshot_versions ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
ALTER TABLE snapshot_versions ADD COLUMN version INTEGER NOT NULL DEFAULT 0;

-- Back-fill updated_at with created_at for existing rows
UPDATE snapshot_versions SET updated_at = created_at WHERE updated_at = '';

-- Index to support stable-version lookups by scope
CREATE INDEX IF NOT EXISTS idx_snapshot_versions_stable
  ON snapshot_versions(project_key, cohort_id, is_stable, version);
