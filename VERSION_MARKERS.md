## Version Markers

This file records the rollback markers for the current optimization round.

- Base tag: `school-system-v2026.03.25-base`
  - Base commit: `ffe68a7`
  - Meaning: original repository baseline before the current runtime cleanup round

- Release tag: `school-system-v2026.03.25-runtime-cleanup-v1`
  - Meaning: teacher-analysis lazy loading stabilization, boot runtime de-dup, duplicate logic cleanup, stronger smoke/runtime guards

## Rollback

- Roll back to the original baseline:
  - `git checkout school-system-v2026.03.25-base`

- Roll back to the current optimized release:
  - `git checkout school-system-v2026.03.25-runtime-cleanup-v1`
