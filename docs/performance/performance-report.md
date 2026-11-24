# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `18a9dd30b0e2`
- Recorded at: 2026-11-24T13:38:03.859Z
- Total smoke time: 26400 ms (+905 ms vs previous)
- Login: 8640 ms
- App ready: 6 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 57, max end-to-end 156.6 ms, max derived network wait 16.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 9.399999999965075 ms | 1393 ms | 1402.399999999965 ms |
| `freshman-simulator` | 42.5 ms | 556 ms | 598.5 ms |
| `student-overview` | 42.399999999965075 ms | 519 ms | 561.3999999999651 ms |
| `report-generator` | 15.799999999988358 ms | 409 ms | 424.79999999998836 ms |
| `subject-balance` | 27.79999999998836 ms | 348 ms | 375.79999999998836 ms |
| `teacher-analysis` | 36.199999999953434 ms | 332 ms | 368.19999999995343 ms |
| `cohort-growth` | 15.099999999976717 ms | 297 ms | 312.0999999999767 ms |
| `progress-analysis` | 43.90000000002328 ms | 242 ms | 285.9000000000233 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `18a9dd30b0e2` | 26400 ms | 8640 ms | 6 ms | 0 | 57 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
