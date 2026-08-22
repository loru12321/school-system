# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d033d198ca83`
- Recorded at: 2026-08-22T19:00:23.590Z
- Total smoke time: 21116 ms (+1039 ms vs previous)
- Login: 4119 ms
- App ready: 150 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 69, max end-to-end 209.1 ms, max derived network wait 19.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 20.60000000000582 ms | 694 ms | 714.6000000000058 ms |
| `student-overview` | 35.60000000000582 ms | 476 ms | 511.6000000000058 ms |
| `subject-balance` | 24.400000000023283 ms | 470 ms | 494.4000000000233 ms |
| `cohort-growth` | 12.10000000000582 ms | 426 ms | 438.1000000000058 ms |
| `report-generator` | 11.60000000000582 ms | 366 ms | 377.6000000000058 ms |
| `freshman-simulator` | 48.5 ms | 320 ms | 368.5 ms |
| `exam-arranger` | 7.7999999999883585 ms | 344 ms | 351.79999999998836 ms |
| `progress-analysis` | 62.19999999998254 ms | 184 ms | 246.19999999998254 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `bd3555a4d128` | 20235 ms | 3434 ms | 28 ms | 0 | 65 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
