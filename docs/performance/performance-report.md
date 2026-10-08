# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `14eed2ebfcf8`
- Recorded at: 2026-10-08T01:53:03.746Z
- Total smoke time: 23355 ms (+314 ms vs previous)
- Login: 5095 ms
- App ready: 2 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 59, max end-to-end 94.4 ms, max derived network wait 11.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 19.79999999998836 ms | 1575 ms | 1594.7999999999884 ms |
| `student-overview` | 53.5 ms | 524 ms | 577.5 ms |
| `report-generator` | 16 ms | 389 ms | 405 ms |
| `progress-analysis` | 144 ms | 239 ms | 383 ms |
| `subject-balance` | 43.20000000001164 ms | 338 ms | 381.20000000001164 ms |
| `freshman-simulator` | 58.19999999998254 ms | 316 ms | 374.19999999998254 ms |
| `exam-arranger` | 1.5 ms | 340 ms | 341.5 ms |
| `cohort-growth` | 17.29999999998836 ms | 315 ms | 332.29999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `14eed2ebfcf8` | 23355 ms | 5095 ms | 2 ms | 0 | 59 | 0 | 0 |
| `ffc2a5480d9b` | 23041 ms | 4371 ms | 3 ms | 0 | 64 | 0 | 0 |
| `310ed2597364` | 20742 ms | 4889 ms | 2 ms | 0 | 67 | 0 | 0 |
| `f2b5c8fe3d15` | 22800 ms | 4625 ms | 3 ms | 0 | 60 | 0 | 0 |
| `7729ff643d20` | 22344 ms | 3619 ms | 5 ms | 0 | 58 | 0 | 0 |
| `f49128342e12` | 23741 ms | 6235 ms | 3 ms | 0 | 63 | 0 | 0 |
| `04913bbc080f` | 24902 ms | 7479 ms | 3 ms | 0 | 59 | 0 | 0 |
| `3dcaf2a3d3dc` | 25981 ms | 8341 ms | 2 ms | 0 | 63 | 0 | 0 |
| `6a980b7cdc68` | 22106 ms | 5922 ms | 5 ms | 0 | 62 | 0 | 0 |
| `08c7f9be9ae8` | 26024 ms | 7078 ms | 8 ms | 0 | 59 | 0 | 0 |
| `af83eea1181c` | 25160 ms | 6406 ms | 3 ms | 0 | 58 | 0 | 0 |
| `167bb29a09c1` | 22009 ms | 3004 ms | 1053 ms | 0 | 63 | 0 | 0 |
| `e45c33ed3c80` | 22761 ms | 4474 ms | 1080 ms | 0 | 64 | 0 | 0 |
| `b6bfe18abefd` | 20489 ms | 3628 ms | 1019 ms | 0 | 65 | 0 | 0 |
| `7ae668a78fd8` | 23050 ms | 2566 ms | 1058 ms | 0 | 65 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
