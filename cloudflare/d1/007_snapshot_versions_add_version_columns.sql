-- Migration 007: add updated_at and version columns to snapshot_versions
-- Required for optimistic-locking fix to the is_stable race condition.

ALTER TABLE snapshot_versions ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';
ALTER TABLE snapshot_versions ADD COLUMN version INTEGER NOT NULL DEFAULT 0;

-- Back-fill updated_at with created_at for existing rows
UPDATE snapshot_versions SET updated_at = created_at WHERE updated_at = '';

-- Ensure the partial unique index can be created even if historical data
-- already contains multiple stable versions in the same scope.
UPDATE snapshot_versions
SET is_stable = 0
WHERE is_stable = 1
  AND id NOT IN (
    SELECT keep.id
    FROM snapshot_versions keep
    WHERE keep.project_key = snapshot_versions.project_key
      AND keep.cohort_id = snapshot_versions.cohort_id
      AND keep.is_stable = 1
    ORDER BY keep.created_at DESC, keep.id DESC
    LIMIT 1
  );

-- Index to support stable-version lookups by scope
CREATE UNIQUE INDEX IF NOT EXISTS uq_snapshot_versions_single_stable
  ON snapshot_versions(project_key, cohort_id)
  WHERE is_stable = 1;

CREATE INDEX IF NOT EXISTS idx_snapshot_versions_stable
  ON snapshot_versions(project_key, cohort_id, is_stable, version);
