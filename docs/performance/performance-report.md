# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `4b7e7a7b89e6`
- Recorded at: 2026-08-22T18:44:56.778Z
- Total smoke time: 19327 ms (-1478 ms vs previous)
- Login: 4155 ms
- App ready: 8 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 79, max end-to-end 169.6 ms, max derived network wait 6.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 16.900000000023283 ms | 654 ms | 670.9000000000233 ms |
| `student-overview` | 18.5 ms | 454 ms | 472.5 ms |
| `cohort-growth` | 8.5 ms | 357 ms | 365.5 ms |
| `exam-arranger` | 6.099999999976717 ms | 342 ms | 348.0999999999767 ms |
| `report-generator` | 8.699999999953434 ms | 303 ms | 311.69999999995343 ms |
| `subject-balance` | 18.20000000001164 ms | 289 ms | 307.20000000001164 ms |
| `freshman-simulator` | 33.90000000002328 ms | 273 ms | 306.9000000000233 ms |
| `progress-analysis` | 38.79999999998836 ms | 192 ms | 230.79999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `6b0534f544de` | 21431 ms | 3671 ms | 7 ms | 0 | 66 | 0 | 0 |
| `11c67389016e` | 20029 ms | 3499 ms | 8 ms | 0 | 63 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
