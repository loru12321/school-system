# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7d0d72e02062`
- Recorded at: 2026-08-21T23:35:10.572Z
- Total smoke time: 22982 ms (+2052 ms vs previous)
- Login: 6166 ms
- App ready: 6 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 68, max end-to-end 156.8 ms, max derived network wait 13.8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 22.199999999982538 ms | 693 ms | 715.1999999999825 ms |
| `student-overview` | 28.29999999998836 ms | 497 ms | 525.2999999999884 ms |
| `subject-balance` | 28.20000000001164 ms | 428 ms | 456.20000000001164 ms |
| `report-generator` | 11.900000000008731 ms | 389 ms | 400.90000000000873 ms |
| `freshman-simulator` | 48.60000000000582 ms | 310 ms | 358.6000000000058 ms |
| `cohort-growth` | 11.60000000000582 ms | 345 ms | 356.6000000000058 ms |
| `exam-arranger` | 12.799999999988358 ms | 339 ms | 351.79999999998836 ms |
| `teacher-analysis` | 50.30000000000291 ms | 272 ms | 322.3000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `7d0d72e02062` | 22982 ms | 6166 ms | 6 ms | 0 | 68 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
