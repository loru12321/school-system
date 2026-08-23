# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `2f24b55344cd`
- Recorded at: 2026-08-23T02:26:00.572Z
- Total smoke time: 22617 ms (+1635 ms vs previous)
- Login: 3599 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 188.4 ms, max derived network wait 7.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 30.599999999976717 ms | 758 ms | 788.5999999999767 ms |
| `student-overview` | 31.20000000001164 ms | 619 ms | 650.2000000000116 ms |
| `subject-balance` | 31.100000000034925 ms | 463 ms | 494.1000000000349 ms |
| `report-generator` | 11.099999999976717 ms | 456 ms | 467.0999999999767 ms |
| `freshman-simulator` | 54.59999999997672 ms | 397 ms | 451.5999999999767 ms |
| `progress-analysis` | 32 ms | 348 ms | 380 ms |
| `exam-arranger` | 10.5 ms | 345 ms | 355.5 ms |
| `cohort-growth` | 19.399999999965075 ms | 335 ms | 354.3999999999651 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `2f24b55344cd` | 22617 ms | 3599 ms | 4 ms | 0 | 70 | 0 | 0 |
| `4742340a8122` | 20982 ms | 3421 ms | 3 ms | 0 | 69 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
