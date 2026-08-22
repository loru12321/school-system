# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `a914350a1bf3`
- Recorded at: 2026-08-22T13:39:47.125Z
- Total smoke time: 18517 ms (-2552 ms vs previous)
- Login: 3502 ms
- App ready: 7 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 67, max end-to-end 111 ms, max derived network wait 6.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 18.09999999999127 ms | 721 ms | 739.0999999999913 ms |
| `student-overview` | 21.59999999999127 ms | 455 ms | 476.59999999999127 ms |
| `exam-arranger` | 7.600000000005821 ms | 342 ms | 349.6000000000058 ms |
| `subject-balance` | 27.80000000000291 ms | 316 ms | 343.8000000000029 ms |
| `report-generator` | 8.599999999991269 ms | 326 ms | 334.59999999999127 ms |
| `cohort-growth` | 8.69999999999709 ms | 302 ms | 310.6999999999971 ms |
| `freshman-simulator` | 32.69999999999709 ms | 277 ms | 309.6999999999971 ms |
| `progress-analysis` | 44.69999999999709 ms | 195 ms | 239.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `a914350a1bf3` | 18517 ms | 3502 ms | 7 ms | 0 | 67 | 0 | 0 |
| `20fe677e1e15` | 21069 ms | 3400 ms | 3 ms | 0 | 65 | 0 | 0 |
| `e62037e7242a` | 20369 ms | 4191 ms | 7 ms | 0 | 63 | 0 | 0 |
| `bbfabd9e3da3` | 19359 ms | 4036 ms | 7 ms | 0 | 69 | 0 | 0 |
| `121e31324907` | 21877 ms | 5268 ms | 5 ms | 0 | 66 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
