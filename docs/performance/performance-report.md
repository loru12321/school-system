# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ffc2a5480d9b`
- Recorded at: 2026-10-07T19:31:36.829Z
- Total smoke time: 23041 ms (+2299 ms vs previous)
- Login: 4371 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 64, max end-to-end 86.9 ms, max derived network wait 8.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 17.10000000000582 ms | 1659 ms | 1676.1000000000058 ms |
| `student-overview` | 45 ms | 500 ms | 545 ms |
| `exam-arranger` | 15.299999999988358 ms | 367 ms | 382.29999999998836 ms |
| `freshman-simulator` | 50.89999999999418 ms | 317 ms | 367.8999999999942 ms |
| `report-generator` | 15.39999999999418 ms | 314 ms | 329.3999999999942 ms |
| `subject-balance` | 36.70000000001164 ms | 268 ms | 304.70000000001164 ms |
| `cohort-growth` | 14.299999999988358 ms | 276 ms | 290.29999999998836 ms |
| `teacher-analysis` | 33.20000000001164 ms | 217 ms | 250.20000000001164 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `7d2d70d87ff1` | 22502 ms | 3512 ms | 1011 ms | 0 | 62 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
