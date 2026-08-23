# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `4516c36a30cc`
- Recorded at: 2026-08-23T06:46:20.426Z
- Total smoke time: 20385 ms (-219 ms vs previous)
- Login: 2791 ms
- App ready: 1006 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 67, max end-to-end 203.4 ms, max derived network wait 5.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 25.099999999976717 ms | 667 ms | 692.0999999999767 ms |
| `student-overview` | 24.5 ms | 468 ms | 492.5 ms |
| `freshman-simulator` | 46.40000000002328 ms | 417 ms | 463.4000000000233 ms |
| `subject-balance` | 40.90000000002328 ms | 414 ms | 454.9000000000233 ms |
| `report-generator` | 10.20000000006985 ms | 361 ms | 371.20000000006985 ms |
| `cohort-growth` | 12 ms | 350 ms | 362 ms |
| `exam-arranger` | 7.599999999976717 ms | 351 ms | 358.5999999999767 ms |
| `progress-analysis` | 57 ms | 183 ms | 240 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `304cbb3bf011` | 22194 ms | 4542 ms | 150 ms | 0 | 67 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
