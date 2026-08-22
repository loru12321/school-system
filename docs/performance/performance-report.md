# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f8d528735600`
- Recorded at: 2026-08-22T00:28:43.826Z
- Total smoke time: 22217 ms (+1110 ms vs previous)
- Login: 5959 ms
- App ready: 8 ms
- Native long tasks: 1, max 618 ms
- Scheduled task samples: 63, max end-to-end 115.4 ms, max derived network wait 6.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `freshman-simulator` | 43.60000000000582 ms | 744 ms | 787.6000000000058 ms |
| `grade-scheduler` | 21.30000000000291 ms | 661 ms | 682.3000000000029 ms |
| `student-overview` | 22 ms | 617 ms | 639 ms |
| `exam-arranger` | 7.80000000000291 ms | 335 ms | 342.8000000000029 ms |
| `report-generator` | 12.30000000000291 ms | 312 ms | 324.3000000000029 ms |
| `subject-balance` | 22.70000000001164 ms | 299 ms | 321.70000000001164 ms |
| `cohort-growth` | 10.5 ms | 306 ms | 316.5 ms |
| `teacher-analysis` | 38.69999999999709 ms | 232 ms | 270.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `f8d528735600` | 22217 ms | 5959 ms | 8 ms | 1 | 63 | 0 | 0 |
| `efd0222ff5cc` | 21107 ms | 4037 ms | 7 ms | 0 | 63 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
