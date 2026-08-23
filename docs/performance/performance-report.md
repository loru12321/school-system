# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `94729a67d133`
- Recorded at: 2026-08-23T12:06:48.486Z
- Total smoke time: 21768 ms (+2798 ms vs previous)
- Login: 2207 ms
- App ready: 1008 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 107.5 ms, max derived network wait 12.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 27.80000000000291 ms | 747 ms | 774.8000000000029 ms |
| `subject-balance` | 60.90000000000873 ms | 530 ms | 590.9000000000087 ms |
| `student-overview` | 45.5 ms | 533 ms | 578.5 ms |
| `freshman-simulator` | 50 ms | 406 ms | 456 ms |
| `cohort-growth` | 13.30000000000291 ms | 410 ms | 423.3000000000029 ms |
| `report-generator` | 10.900000000008731 ms | 394 ms | 404.90000000000873 ms |
| `exam-arranger` | 8.60000000000582 ms | 351 ms | 359.6000000000058 ms |
| `teacher-analysis` | 34.89999999999418 ms | 258 ms | 292.8999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `94729a67d133` | 21768 ms | 2207 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `cbaa222490aa` | 18970 ms | 2666 ms | 1023 ms | 0 | 73 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
