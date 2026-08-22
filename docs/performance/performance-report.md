# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `572793d773c2`
- Recorded at: 2026-08-22T18:19:17.955Z
- Total smoke time: 20790 ms (-330 ms vs previous)
- Login: 3420 ms
- App ready: 179 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 193.2 ms, max derived network wait 8.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 24.699999999982538 ms | 755 ms | 779.6999999999825 ms |
| `student-overview` | 40.5 ms | 531 ms | 571.5 ms |
| `subject-balance` | 40.40000000002328 ms | 400 ms | 440.4000000000233 ms |
| `report-generator` | 10.5 ms | 379 ms | 389.5 ms |
| `freshman-simulator` | 67.09999999997672 ms | 314 ms | 381.0999999999767 ms |
| `exam-arranger` | 8 ms | 341 ms | 349 ms |
| `cohort-growth` | 13.39999999999418 ms | 331 ms | 344.3999999999942 ms |
| `progress-analysis` | 79 ms | 253 ms | 332 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `46e9dfb` | 18517 ms | 3502 ms | 7 ms | 0 | 67 | 0 | 0 |
| `a914350a1bf3` | 18517 ms | 3502 ms | 7 ms | 0 | 67 | 0 | 0 |
| `20fe677e1e15` | 21069 ms | 3400 ms | 3 ms | 0 | 65 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
