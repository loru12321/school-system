# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d5c6012cd4cd`
- Recorded at: 2026-08-22T19:09:55.319Z
- Total smoke time: 21196 ms (+80 ms vs previous)
- Login: 3831 ms
- App ready: 10 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 78.9 ms, max derived network wait 5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 23 ms | 712 ms | 735 ms |
| `student-overview` | 33.5 ms | 542 ms | 575.5 ms |
| `freshman-simulator` | 48.19999999999709 ms | 399 ms | 447.1999999999971 ms |
| `subject-balance` | 31.20000000001164 ms | 402 ms | 433.20000000001164 ms |
| `report-generator` | 11.39999999999418 ms | 384 ms | 395.3999999999942 ms |
| `exam-arranger` | 10.299999999988358 ms | 344 ms | 354.29999999998836 ms |
| `progress-analysis` | 44.5 ms | 301 ms | 345.5 ms |
| `cohort-growth` | 13 ms | 330 ms | 343 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `d5c6012cd4cd` | 21196 ms | 3831 ms | 10 ms | 0 | 65 | 0 | 0 |
| `d033d198ca83` | 21116 ms | 4119 ms | 150 ms | 0 | 69 | 0 | 0 |
| `0d4d7b7a119a` | 20077 ms | 4152 ms | 138 ms | 0 | 75 | 0 | 0 |
| `4b7e7a7b89e6` | 19327 ms | 4155 ms | 8 ms | 0 | 79 | 0 | 0 |
| `5499ef7be9cc` | 20805 ms | 4070 ms | 20 ms | 0 | 62 | 0 | 0 |
| `8edb413d40ec` | 19035 ms | 3705 ms | 7 ms | 0 | 69 | 0 | 0 |
| `572793d773c2` | 20790 ms | 3420 ms | 179 ms | 0 | 70 | 0 | 0 |
| `85c7a835e83b` | 21120 ms | 5840 ms | 123 ms | 0 | 69 | 0 | 0 |
| `5a5c13844692` | 21773 ms | 4056 ms | 135 ms | 0 | 72 | 0 | 0 |
| `599595361ea0` | 20731 ms | 3387 ms | 2 ms | 0 | 70 | 0 | 0 |
| `155098220955` | 21359 ms | 4450 ms | 10 ms | 0 | 62 | 0 | 0 |
| `2d972c20f746` | 21165 ms | 3730 ms | 11 ms | 0 | 72 | 0 | 0 |
| `bcce64e7b65d` | 19858 ms | 4561 ms | 5 ms | 0 | 74 | 0 | 0 |
| `local` | 19957 ms | 3237 ms | 9 ms | 0 | 64 | 0 | 0 |
| `32a455985ff7` | 19957 ms | 3237 ms | 9 ms | 0 | 64 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
