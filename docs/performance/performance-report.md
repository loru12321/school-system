# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `21a9ced46dec`
- Recorded at: 2026-11-24T09:26:07.485Z
- Total smoke time: 25495 ms (+3482 ms vs previous)
- Login: 6570 ms
- App ready: 5 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 69.3 ms, max derived network wait 6.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 11.700000000011642 ms | 1435 ms | 1446.7000000000116 ms |
| `student-overview` | 40.30000000001746 ms | 468 ms | 508.30000000001746 ms |
| `freshman-simulator` | 58.80000000001746 ms | 426 ms | 484.80000000001746 ms |
| `cohort-growth` | 13.799999999988358 ms | 348 ms | 361.79999999998836 ms |
| `report-generator` | 17.5 ms | 310 ms | 327.5 ms |
| `subject-balance` | 37.19999999998254 ms | 279 ms | 316.19999999998254 ms |
| `progress-analysis` | 75.39999999999418 ms | 214 ms | 289.3999999999942 ms |
| `exam-arranger` | 2.1000000000058208 ms | 250 ms | 252.10000000000582 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `21a9ced46dec` | 25495 ms | 6570 ms | 5 ms | 0 | 66 | 0 | 0 |
| `c9d1231914cb` | 22013 ms | 5735 ms | 3 ms | 0 | 62 | 0 | 0 |
| `28a19dc5a1c6` | 22454 ms | 6313 ms | 2 ms | 0 | 58 | 0 | 0 |
| `426fc29b16be` | 22725 ms | 7129 ms | 2 ms | 0 | 60 | 0 | 0 |
| `33a620116296` | 21583 ms | 5026 ms | 2 ms | 0 | 66 | 0 | 0 |
| `ad5de2fcd0a1` | 23660 ms | 6168 ms | 2 ms | 0 | 56 | 0 | 0 |
| `d8377d317cd2` | 21885 ms | 6285 ms | 2 ms | 0 | 61 | 0 | 0 |
| `b30c3b11ce02` | 25388 ms | 8350 ms | 4 ms | 0 | 58 | 0 | 0 |
| `ccac6beb8719` | 21746 ms | 6312 ms | 2 ms | 0 | 58 | 0 | 0 |
| `c6120f55ebd5` | 21509 ms | 6460 ms | 3 ms | 0 | 64 | 0 | 0 |
| `cb1d9c28652e` | 21337 ms | 6682 ms | 2 ms | 0 | 67 | 0 | 0 |
| `b73e495d78f1` | 24211 ms | 8317 ms | 8 ms | 0 | 58 | 0 | 0 |
| `5e50dbb0020f` | 22487 ms | 6651 ms | 1 ms | 0 | 55 | 0 | 0 |
| `4550809f303a` | 21528 ms | 6762 ms | 2 ms | 0 | 62 | 0 | 0 |
| `11731faf0797` | 20289 ms | 4965 ms | 6 ms | 0 | 60 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
