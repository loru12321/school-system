# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7d22361ff97c`
- Recorded at: 2026-08-23T10:52:16.942Z
- Total smoke time: 20727 ms (+430 ms vs previous)
- Login: 2737 ms
- App ready: 1062 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 67, max end-to-end 190.5 ms, max derived network wait 8.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 25.60000000000582 ms | 680 ms | 705.6000000000058 ms |
| `student-overview` | 29 ms | 487 ms | 516 ms |
| `subject-balance` | 39.10000000000582 ms | 433 ms | 472.1000000000058 ms |
| `freshman-simulator` | 46 ms | 363 ms | 409 ms |
| `report-generator` | 10.400000000008731 ms | 382 ms | 392.40000000000873 ms |
| `exam-arranger` | 8.80000000000291 ms | 354 ms | 362.8000000000029 ms |
| `cohort-growth` | 11.10000000000582 ms | 312 ms | 323.1000000000058 ms |
| `progress-analysis` | 45.10000000000582 ms | 197 ms | 242.10000000000582 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `9c11ce05d94b` | 21677 ms | 5038 ms | 8 ms | 0 | 62 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
