# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `dd63dd8aec68`
- Recorded at: 2026-08-23T10:56:38.537Z
- Total smoke time: 21531 ms (+3158 ms vs previous)
- Login: 2352 ms
- App ready: 1005 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 53 ms, max derived network wait 5.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 28.19999999999709 ms | 754 ms | 782.1999999999971 ms |
| `student-overview` | 33.19999999999709 ms | 509 ms | 542.1999999999971 ms |
| `freshman-simulator` | 45 ms | 475 ms | 520 ms |
| `subject-balance` | 46.09999999999127 ms | 472 ms | 518.0999999999913 ms |
| `cohort-growth` | 11.599999999991269 ms | 366 ms | 377.59999999999127 ms |
| `report-generator` | 10.5 ms | 366 ms | 376.5 ms |
| `exam-arranger` | 10.900000000008731 ms | 354 ms | 364.90000000000873 ms |
| `progress-analysis` | 47.5 ms | 219 ms | 266.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `af85084f695e` | 21734 ms | 3901 ms | 3 ms | 0 | 67 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
