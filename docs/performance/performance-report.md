# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `867098129319`
- Recorded at: 2026-08-23T02:34:59.608Z
- Total smoke time: 21856 ms (-761 ms vs previous)
- Login: 3098 ms
- App ready: 7 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 71, max end-to-end 204.6 ms, max derived network wait 6.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 29.699999999953434 ms | 755 ms | 784.6999999999534 ms |
| `student-overview` | 36.20000000001164 ms | 587 ms | 623.2000000000116 ms |
| `freshman-simulator` | 61.40000000002328 ms | 466 ms | 527.4000000000233 ms |
| `subject-balance` | 34.5 ms | 468 ms | 502.5 ms |
| `cohort-growth` | 16.400000000023283 ms | 463 ms | 479.4000000000233 ms |
| `report-generator` | 12.900000000023283 ms | 419 ms | 431.9000000000233 ms |
| `progress-analysis` | 67.60000000003492 ms | 336 ms | 403.6000000000349 ms |
| `exam-arranger` | 11.5 ms | 360 ms | 371.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `867098129319` | 21856 ms | 3098 ms | 7 ms | 0 | 71 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
