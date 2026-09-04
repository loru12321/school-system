# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `08c7f9be9ae8`
- Recorded at: 2026-09-04T08:45:46.619Z
- Total smoke time: 26024 ms (+864 ms vs previous)
- Login: 7078 ms
- App ready: 8 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 59, max end-to-end 79.6 ms, max derived network wait 6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 46.699999999953434 ms | 1438 ms | 1484.6999999999534 ms |
| `subject-balance` | 50.5 ms | 492 ms | 542.5 ms |
| `student-overview` | 36.79999999993015 ms | 489 ms | 525.7999999999302 ms |
| `freshman-simulator` | 83.19999999995343 ms | 402 ms | 485.19999999995343 ms |
| `progress-analysis` | 104.40000000002328 ms | 306 ms | 410.4000000000233 ms |
| `exam-arranger` | 17 ms | 346 ms | 363 ms |
| `report-generator` | 20.100000000093132 ms | 333 ms | 353.10000000009313 ms |
| `cohort-growth` | 19.79999999993015 ms | 326 ms | 345.79999999993015 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `b14f70ad742a` | 22196 ms | 2944 ms | 1024 ms | 0 | 72 | 0 | 0 |
| `0a9b46c43056` | 21661 ms | 2546 ms | 1027 ms | 0 | 66 | 0 | 0 |
| `38c3b1571ffe` | 19540 ms | 2700 ms | 1020 ms | 0 | 70 | 0 | 0 |
| `43e6c5ac1bbc` | 23379 ms | 3599 ms | 1007 ms | 0 | 65 | 0 | 0 |
| `15b457d48fa4` | 21189 ms | 2146 ms | 1012 ms | 0 | 67 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
