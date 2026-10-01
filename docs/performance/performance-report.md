# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7729ff643d20`
- Recorded at: 2026-10-01T22:09:06.723Z
- Total smoke time: 22344 ms (-1397 ms vs previous)
- Login: 3619 ms
- App ready: 5 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 58, max end-to-end 62 ms, max derived network wait 5.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 17.699999999982538 ms | 1538 ms | 1555.6999999999825 ms |
| `student-overview` | 48.70000000001164 ms | 497 ms | 545.7000000000116 ms |
| `freshman-simulator` | 52 ms | 491 ms | 543 ms |
| `subject-balance` | 42.20000000001164 ms | 354 ms | 396.20000000001164 ms |
| `exam-arranger` | 14.699999999982538 ms | 341 ms | 355.69999999998254 ms |
| `report-generator` | 15.900000000023283 ms | 333 ms | 348.9000000000233 ms |
| `cohort-growth` | 20.300000000017462 ms | 287 ms | 307.30000000001746 ms |
| `correlation-analysis` | 16 ms | 206 ms | 222 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `caea4a2be200` | 22237 ms | 2563 ms | 1158 ms | 0 | 65 | 0 | 0 |
| `8b25fb5e2782` | 22886 ms | 2564 ms | 1018 ms | 0 | 66 | 0 | 0 |
| `cdfe84874b8f` | 22073 ms | 2889 ms | 1025 ms | 0 | 66 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
