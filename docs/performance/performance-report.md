# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `590d01a9cf27`
- Recorded at: 2026-08-21T16:01:37.183Z
- Total smoke time: 20930 ms (-955 ms vs previous)
- Login: 3547 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 69, max end-to-end 180.7 ms, max derived network wait 25.8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 31.60000000000582 ms | 751 ms | 782.6000000000058 ms |
| `subject-balance` | 37.80000000000291 ms | 519 ms | 556.8000000000029 ms |
| `student-overview` | 34.20000000001164 ms | 522 ms | 556.2000000000116 ms |
| `report-generator` | 12.5 ms | 405 ms | 417.5 ms |
| `cohort-growth` | 12.69999999999709 ms | 387 ms | 399.6999999999971 ms |
| `freshman-simulator` | 75.89999999999418 ms | 320 ms | 395.8999999999942 ms |
| `exam-arranger` | 10.400000000008731 ms | 364 ms | 374.40000000000873 ms |
| `teacher-analysis` | 56.19999999999709 ms | 313 ms | 369.1999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `590d01a9cf27` | 20930 ms | 3547 ms | 4 ms | 0 | 69 | 0 | 0 |
| `f6d6290fe962` | 21885 ms | 3885 ms | 9 ms | 0 | 65 | 0 | 0 |
| `17c9b76c2e0a` | 22610 ms | 4583 ms | 8 ms | 0 | 70 | 0 | 0 |
| `721a51c8d56e` | 20885 ms | 4700 ms | 8 ms | 0 | 69 | 0 | 0 |
| `e7f5c31e2ab0` | 24697 ms | 4949 ms | 12 ms | 0 | 66 | 0 | 0 |
| `d3a0e64607cf` | 22850 ms | 3202 ms | 3 ms | 0 | 70 | 0 | 0 |
| `df408db5e1df` | 24457 ms | 4236 ms | 351 ms | 0 | 65 | 0 | 0 |
| `bb2717062748` | 29423 ms | 3500 ms | 11 ms | 0 | 58 | 0 | 0 |
| `e62c6fb95614` | 29905 ms | 3822 ms | 367 ms | 0 | 59 | 0 | 0 |
| `adade4a9461a` | 26404 ms | 4925 ms | 3 ms | 0 | 48 | 0 | 0 |
| `9d26ba4b5d52` | 25386 ms | 6131 ms | 17 ms | 0 | 54 | 0 | 0 |
| `e79a53175bfe` | 26355 ms | 4657 ms | 8 ms | 0 | 50 | 0 | 0 |
| `7d4a5e69aca7` | 24730 ms | 3194 ms | 4 ms | 0 | 56 | 0 | 0 |
| `ba4249944228` | 24685 ms | 4281 ms | 5 ms | 0 | 42 | 0 | 0 |
| `b70aeb427c61` | 24160 ms | 4036 ms | 14 ms | 0 | 51 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
