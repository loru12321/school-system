# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `555607b85f0d`
- Recorded at: 2026-08-23T10:46:10.829Z
- Total smoke time: 19568 ms (-817 ms vs previous)
- Login: 3102 ms
- App ready: 1119 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 72, max end-to-end 158.6 ms, max derived network wait 4.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 18.699999999982538 ms | 651 ms | 669.6999999999825 ms |
| `student-overview` | 24.699999999982538 ms | 472 ms | 496.69999999998254 ms |
| `subject-balance` | 20.300000000017462 ms | 323 ms | 343.30000000001746 ms |
| `exam-arranger` | 6.2000000000116415 ms | 337 ms | 343.20000000001164 ms |
| `report-generator` | 8.300000000017462 ms | 314 ms | 322.30000000001746 ms |
| `freshman-simulator` | 43.89999999999418 ms | 275 ms | 318.8999999999942 ms |
| `cohort-growth` | 9.900000000023283 ms | 277 ms | 286.9000000000233 ms |
| `teacher-analysis` | 51.5 ms | 131 ms | 182.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `9c11ce05d94b` | 21677 ms | 5038 ms | 8 ms | 0 | 62 | 0 | 0 |
| `469589f5bb52` | 21692 ms | 3375 ms | 3 ms | 0 | 67 | 0 | 0 |
| `515a7d3ac601` | 21874 ms | 3533 ms | 4 ms | 0 | 67 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
