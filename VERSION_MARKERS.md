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

- Release tag: `school-system-v2026.03.26-upload-status-ui-v13`
  - Meaning: add a compact upload summary strip and a clearer feedback board so data-hub readiness, sync state, archive state, and backup state can be read at a glance

- Release tag: `school-system-v2026.03.26-upload-action-guidance-v14`
  - Meaning: make the upload action area itself more self-explanatory and persistent by adding step copy, next-step guidance, and page-level status messaging

- Release tag: `school-system-v2026.03.26-template-upload-flow-v15`
  - Meaning: merge template download and score upload into one clearer intake flow so "download template -> upload data -> continue" reads as a single path

- Release tag: `school-system-v2026.03.26-backup-snapshot-ui-v16`
  - Meaning: reshape backup, restore, and auto-snapshot controls into clearer workflow cards with stronger rollback visibility

- Release tag: `school-system-v2026.03.26-analysis-shell-ui-v17`
  - Meaning: unify the first-screen hierarchy of macro analysis, summary, and teacher analysis so the three highest-frequency analysis surfaces share the same workspace shell, guidance strips, and comparison panel language

- Release tag: `school-system-v2026.03.26-analysis-results-rail-v18`
  - Meaning: reshape the lower analysis work area with a clearer navigation rail, flow banner, and continuous result panels so macro analysis and teacher analysis read as one guided workspace instead of disconnected blocks

- Release tag: `school-system-v2026.03.26-analysis-dynamic-panels-v19`
  - Meaning: restyle runtime-generated subject detail tables and teacher township ranking panels so dynamic output inherits the same panel headers, empty states, table labels, and density rules as the static analysis workspace

- Release tag: `school-system-v2026.03.26-analysis-compare-feedback-v20`
  - Meaning: unify macro compare and teacher compare result containers so empty states, validation errors, success hints, and generated comparison panels all follow the same analysis workspace language

- Release tag: `school-system-v2026.03.26-analysis-support-layer-v21`
  - Meaning: unify help entry styling, export guidance, and analysis explain panels so macro analysis, summary, and teacher analysis share one clearer support layer around their main working surfaces

- Release tag: `school-system-v2026.03.26-analysis-table-density-v22`
  - Meaning: tighten the main analysis tables and add print/export guidance notes around core result panels so macro totals, summary results, teacher detail tables, and township ranking exports are easier to scan and easier to export intentionally

- Release tag: `school-system-v2026.03.26-analysis-print-layout-v23`
  - Meaning: make printed analysis pages cleaner by hiding interactive guidance layers and converting the analysis workspace into a report-first layout with clean section heads and printable tables

- Release tag: `school-system-v2026.03.26-analysis-cluster-ui-v24`
  - Meaning: bring high-score, bottom3, and indicator into the same analysis workspace language so their help panels, action zones, dense tables, and export guidance match the rest of the analysis cluster

- Release tag: `school-system-v2026.03.26-macro-watch-ui-v25`
  - Meaning: align the township warning and highlight board with the analysis workspace shell so its KPI summary cards, red/yellow/green lanes, and rule guidance read like one continuous macro-analysis experience

- Release tag: `school-system-v2026.03.26-progress-analysis-ui-v26`
  - Meaning: reshape progress-analysis into the same analysis workspace shell so collective value-added results, multi-period compare, charts, filters, and student detail tables read as one continuous progress-analysis workbench

- Release tag: `school-system-v2026.03.26-report-generator-ui-v27`
  - Meaning: align report-generator with the analysis workspace shell so student report query, compare settings, PDF actions, and marginal-student analysis read like one continuous class-report workbench

- Release tag: `school-system-v2026.03.26-student-details-ui-v28`
  - Meaning: align student-details with the student analysis workspace so detail queries, student multi-period compare, export actions, and the main detail table read as one continuous student-detail workbench

- Release tag: `school-system-v2026.03.27-student-overview-ui-v29`
  - Meaning: align student-overview with the student analysis workspace so readiness checks, insight cards, quick-entry actions, and summary blocks read like one continuous student-analysis command page

- Release tag: `school-system-v2026.03.27-student-analysis-cluster-v30`
  - Meaning: align subject-balance and potential-analysis with the student analysis workspace so subject-strength mapping, cluster guidance, and potential-student mining follow the same support, action, and result language as the rest of the student-analysis chain

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

- Roll back to the latest upload status UI release:
  - `git checkout school-system-v2026.03.26-upload-status-ui-v13`

- Roll back to the latest upload action guidance release:
  - `git checkout school-system-v2026.03.26-upload-action-guidance-v14`

- Roll back to the latest template/upload flow release:
  - `git checkout school-system-v2026.03.26-template-upload-flow-v15`

- Roll back to the latest backup/snapshot UI release:
  - `git checkout school-system-v2026.03.26-backup-snapshot-ui-v16`

- Roll back to the latest analysis shell UI release:
  - `git checkout school-system-v2026.03.26-analysis-shell-ui-v17`

- Roll back to the latest analysis results rail UI release:
  - `git checkout school-system-v2026.03.26-analysis-results-rail-v18`

- Roll back to the latest analysis dynamic panels UI release:
  - `git checkout school-system-v2026.03.26-analysis-dynamic-panels-v19`

- Roll back to the latest analysis compare feedback UI release:
  - `git checkout school-system-v2026.03.26-analysis-compare-feedback-v20`

- Roll back to the latest analysis support layer UI release:
  - `git checkout school-system-v2026.03.26-analysis-support-layer-v21`

- Roll back to the latest analysis table density UI release:
  - `git checkout school-system-v2026.03.26-analysis-table-density-v22`

- Roll back to the latest analysis print layout UI release:
  - `git checkout school-system-v2026.03.26-analysis-print-layout-v23`

- Roll back to the latest analysis cluster UI release:
  - `git checkout school-system-v2026.03.26-analysis-cluster-ui-v24`

- Roll back to the latest macro-watch UI release:
  - `git checkout school-system-v2026.03.26-macro-watch-ui-v25`

- Roll back to the latest progress-analysis UI release:
  - `git checkout school-system-v2026.03.26-progress-analysis-ui-v26`

- Roll back to the latest report-generator UI release:
  - `git checkout school-system-v2026.03.26-report-generator-ui-v27`

- Roll back to the latest student-details UI release:
  - `git checkout school-system-v2026.03.26-student-details-ui-v28`

- Roll back to the latest student-overview UI release:
  - `git checkout school-system-v2026.03.27-student-overview-ui-v29`

- Roll back to the latest student analysis cluster UI release:
  - `git checkout school-system-v2026.03.27-student-analysis-cluster-v30`
