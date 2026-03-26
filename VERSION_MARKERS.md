## Version Markers

This file records the rollback markers for the current optimization round.

- Base tag: `school-system-v2026.03.25-base`
  - Base commit: `ffe68a7`
  - Meaning: original repository baseline before the current runtime cleanup round

- Release tag: `school-system-v2026.03.25-runtime-cleanup-v1`
  - Meaning: teacher-analysis lazy loading stabilization, boot runtime de-dup, duplicate logic cleanup, stronger smoke/runtime guards

- Release tag: `school-system-v2026.03.25-legacy-cleanup-v2`
  - Meaning: remove retired school-internal legacy panel and SIG dead code, keep lightweight analysis hint, add smoke coverage for single-school-eval

- Release tag: `school-system-v2026.03.25-switchtab-cleanup-v3`
  - Meaning: remove single-school-eval switchTab monkey patch and enforce single switchTab definition via tests

- Release tag: `school-system-v2026.03.25-switchtab-cleanup-v4`
  - Meaning: sync build artifacts for the switchTab cleanup round and use this as the deployed release marker

- Release tag: `school-system-v2026.03.25-smoke-login-hardening-v6`
  - Meaning: make smoke login tolerate cached sessions and cohort-mask-first boot states, reducing false production failures

- Release tag: `school-system-v2026.03.25-sse-runtime-split-v7`
  - Meaning: move single-school-eval out of app.js into an optional runtime, add lazy loader wiring, and keep smoke/runtime-order coverage in sync

- Release tag: `school-system-v2026.03.26-entry-ui-polish-v8`
  - Meaning: refresh the login overlay and cohort-entry mask so the system entrance feels more intentional, structured, and visually consistent on desktop and mobile

- Release tag: `school-system-v2026.03.26-shell-ui-polish-v9`
  - Meaning: refine the post-login shell with a clearer sidebar, floating toolbar, and stronger workbench framing for the first screen

- Release tag: `school-system-v2026.03.26-starter-hub-ui-v10`
  - Meaning: reshape the starter-hub into a clearer workbench-style landing area with better card hierarchy and denser status presentation

- Release tag: `school-system-v2026.03.26-upload-workbench-ui-v11`
  - Meaning: reorganize the data hub into a clearer upload workbench with stronger cohort, exam archive, template, and backup panel hierarchy

- Release tag: `school-system-v2026.03.26-cohort-exam-flow-ui-v12`
  - Meaning: reshape cohort management and exam archive controls into a clearer step-by-step flow with stronger summary cards and status messaging

## Rollback

- Roll back to the original baseline:
  - `git checkout school-system-v2026.03.25-base`

- Roll back to the current optimized release:
  - `git checkout school-system-v2026.03.25-runtime-cleanup-v1`

- Roll back to the latest optimized release:
  - `git checkout school-system-v2026.03.25-legacy-cleanup-v2`

- Roll back to the newest optimized release:
  - `git checkout school-system-v2026.03.25-switchtab-cleanup-v3`

- Roll back to the final deployed release of this round:
  - `git checkout school-system-v2026.03.25-switchtab-cleanup-v4`

- Roll back to the latest smoke-hardening release:
  - `git checkout school-system-v2026.03.25-smoke-login-hardening-v6`

- Roll back to the latest SSE runtime split release:
  - `git checkout school-system-v2026.03.25-sse-runtime-split-v7`

- Roll back to the latest entry UI polish release:
  - `git checkout school-system-v2026.03.26-entry-ui-polish-v8`

- Roll back to the latest shell UI polish release:
  - `git checkout school-system-v2026.03.26-shell-ui-polish-v9`

- Roll back to the latest starter-hub UI release:
  - `git checkout school-system-v2026.03.26-starter-hub-ui-v10`

- Roll back to the latest upload workbench UI release:
  - `git checkout school-system-v2026.03.26-upload-workbench-ui-v11`

- Roll back to the latest cohort/exam flow UI release:
  - `git checkout school-system-v2026.03.26-cohort-exam-flow-ui-v12`
