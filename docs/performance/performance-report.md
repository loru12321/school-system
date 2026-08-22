# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `2d972c20f746`
- Recorded at: 2026-08-22T17:05:23.150Z
- Total smoke time: 21165 ms (+1307 ms vs previous)
- Login: 3730 ms
- App ready: 11 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 72, max end-to-end 206.2 ms, max derived network wait 8.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 24.79999999998836 ms | 745 ms | 769.7999999999884 ms |
| `student-overview` | 29.89999999999418 ms | 531 ms | 560.8999999999942 ms |
| `subject-balance` | 26 ms | 501 ms | 527 ms |
| `freshman-simulator` | 48.19999999999709 ms | 392 ms | 440.1999999999971 ms |
| `report-generator` | 12.39999999999418 ms | 386 ms | 398.3999999999942 ms |
| `cohort-growth` | 35.5 ms | 325 ms | 360.5 ms |
| `progress-analysis` | 57.5 ms | 301 ms | 358.5 ms |
| `exam-arranger` | 8.10000000000582 ms | 345 ms | 353.1000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `efd0222ff5cc` | 21107 ms | 4037 ms | 7 ms | 0 | 63 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
