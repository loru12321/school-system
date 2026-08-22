# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `32a455985ff7`
- Recorded at: 2026-08-22T15:36:38.091Z
- Total smoke time: 19957 ms (-278 ms vs previous)
- Login: 3237 ms
- App ready: 9 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 64, max end-to-end 159.9 ms, max derived network wait 8.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 29.699999999982538 ms | 798 ms | 827.6999999999825 ms |
| `student-overview` | 30.79999999998836 ms | 526 ms | 556.7999999999884 ms |
| `subject-balance` | 31.70000000001164 ms | 461 ms | 492.70000000001164 ms |
| `report-generator` | 11 ms | 379 ms | 390 ms |
| `freshman-simulator` | 49.10000000000582 ms | 310 ms | 359.1000000000058 ms |
| `exam-arranger` | 9.10000000000582 ms | 346 ms | 355.1000000000058 ms |
| `cohort-growth` | 15.60000000000582 ms | 328 ms | 343.6000000000058 ms |
| `teacher-analysis` | 52.70000000001164 ms | 278 ms | 330.70000000001164 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `32a455985ff7` | 19957 ms | 3237 ms | 9 ms | 0 | 64 | 0 | 0 |
| `bd3555a4d128` | 20235 ms | 3434 ms | 28 ms | 0 | 65 | 0 | 0 |
| `6b0534f544de` | 21431 ms | 3671 ms | 7 ms | 0 | 66 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
