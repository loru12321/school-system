# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `11c67389016e`
- Recorded at: 2026-08-22T13:48:11.815Z
- Total smoke time: 20029 ms (+1512 ms vs previous)
- Login: 3499 ms
- App ready: 8 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 63, max end-to-end 145.2 ms, max derived network wait 19.8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 26.79999999998836 ms | 689 ms | 715.7999999999884 ms |
| `student-overview` | 33.69999999999709 ms | 483 ms | 516.6999999999971 ms |
| `subject-balance` | 31.19999999999709 ms | 427 ms | 458.1999999999971 ms |
| `freshman-simulator` | 42.09999999999127 ms | 372 ms | 414.09999999999127 ms |
| `report-generator` | 10.30000000000291 ms | 376 ms | 386.3000000000029 ms |
| `exam-arranger` | 7.5 ms | 353 ms | 360.5 ms |
| `cohort-growth` | 10.69999999999709 ms | 310 ms | 320.6999999999971 ms |
| `progress-analysis` | 48.60000000000582 ms | 258 ms | 306.6000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `11c67389016e` | 20029 ms | 3499 ms | 8 ms | 0 | 63 | 0 | 0 |
| `46e9dfb` | 18517 ms | 3502 ms | 7 ms | 0 | 67 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
