# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d465f6f96d3d`
- Recorded at: 2026-08-23T10:54:35.184Z
- Total smoke time: 18373 ms (-2354 ms vs previous)
- Login: 2244 ms
- App ready: 1003 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 179.8 ms, max derived network wait 3.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 20.5 ms | 651 ms | 671.5 ms |
| `student-overview` | 15.39999999999418 ms | 459 ms | 474.3999999999942 ms |
| `exam-arranger` | 0.9000000000087311 ms | 338 ms | 338.90000000000873 ms |
| `cohort-growth` | 8.30000000000291 ms | 318 ms | 326.3000000000029 ms |
| `subject-balance` | 22.89999999999418 ms | 302 ms | 324.8999999999942 ms |
| `freshman-simulator` | 42.19999999999709 ms | 282 ms | 324.1999999999971 ms |
| `report-generator` | 9.10000000000582 ms | 311 ms | 320.1000000000058 ms |
| `teacher-analysis` | 23.69999999999709 ms | 262 ms | 285.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `437352b0a1a9` | 18599 ms | 2845 ms | 4 ms | 0 | 74 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
