# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `155098220955`
- Recorded at: 2026-08-22T17:10:41.849Z
- Total smoke time: 21359 ms (+194 ms vs previous)
- Login: 4450 ms
- App ready: 10 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 59.7 ms, max derived network wait 5.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 27 ms | 705 ms | 732 ms |
| `student-overview` | 36.5 ms | 505 ms | 541.5 ms |
| `freshman-simulator` | 46.29999999998836 ms | 402 ms | 448.29999999998836 ms |
| `report-generator` | 10.69999999999709 ms | 399 ms | 409.6999999999971 ms |
| `subject-balance` | 24.10000000000582 ms | 351 ms | 375.1000000000058 ms |
| `cohort-growth` | 12.30000000000291 ms | 336 ms | 348.3000000000029 ms |
| `exam-arranger` | 1.3000000000029104 ms | 347 ms | 348.3000000000029 ms |
| `progress-analysis` | 50.39999999999418 ms | 271 ms | 321.3999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `155098220955` | 21359 ms | 4450 ms | 10 ms | 0 | 62 | 0 | 0 |
| `2d972c20f746` | 21165 ms | 3730 ms | 11 ms | 0 | 72 | 0 | 0 |
| `bcce64e7b65d` | 19858 ms | 4561 ms | 5 ms | 0 | 74 | 0 | 0 |
| `local` | 19957 ms | 3237 ms | 9 ms | 0 | 64 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
