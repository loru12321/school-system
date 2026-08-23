# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c7d1cf5eea79`
- Recorded at: 2026-08-23T11:11:15.563Z
- Total smoke time: 18768 ms (-2763 ms vs previous)
- Login: 2280 ms
- App ready: 1007 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 172.5 ms, max derived network wait 15.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 18.69999999999709 ms | 665 ms | 683.6999999999971 ms |
| `student-overview` | 19.69999999999709 ms | 492 ms | 511.6999999999971 ms |
| `freshman-simulator` | 32.5 ms | 375 ms | 407.5 ms |
| `exam-arranger` | 7 ms | 339 ms | 346 ms |
| `report-generator` | 8.799999999988358 ms | 326 ms | 334.79999999998836 ms |
| `subject-balance` | 27.09999999999127 ms | 300 ms | 327.09999999999127 ms |
| `cohort-growth` | 14.30000000000291 ms | 300 ms | 314.3000000000029 ms |
| `analysis` | 27.69999999999709 ms | 279 ms | 306.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `c7d1cf5eea79` | 18768 ms | 2280 ms | 1007 ms | 0 | 70 | 0 | 0 |
| `dd63dd8aec68` | 21531 ms | 2352 ms | 1005 ms | 0 | 66 | 0 | 0 |
| `d465f6f96d3d` | 18373 ms | 2244 ms | 1003 ms | 0 | 62 | 0 | 0 |
| `7d22361ff97c` | 20727 ms | 2737 ms | 1062 ms | 0 | 67 | 0 | 0 |
| `adbdf7f5aa25` | 20297 ms | 2943 ms | 1031 ms | 0 | 65 | 0 | 0 |
| `555607b85f0d` | 19568 ms | 3102 ms | 1119 ms | 0 | 72 | 0 | 0 |
| `4516c36a30cc` | 20385 ms | 2791 ms | 1006 ms | 0 | 67 | 0 | 0 |
| `43fd396da074` | 20604 ms | 3399 ms | 3 ms | 0 | 71 | 0 | 0 |
| `d185c74694b7` | 21550 ms | 3258 ms | 4 ms | 0 | 58 | 0 | 0 |
| `6cffbae8c0b9` | 18485 ms | 3000 ms | 2 ms | 0 | 69 | 0 | 0 |
| `42ce86fd21c6` | 22248 ms | 3662 ms | 3 ms | 0 | 61 | 0 | 0 |
| `59dc68065fc8` | 20966 ms | 4071 ms | 4 ms | 0 | 66 | 0 | 0 |
| `761a7d6a9790` | 20072 ms | 3310 ms | 4 ms | 0 | 69 | 0 | 0 |
| `b75080d12c41` | 22024 ms | 3150 ms | 151 ms | 0 | 65 | 0 | 0 |
| `99761384c81e` | 22624 ms | 3686 ms | 7 ms | 0 | 65 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
