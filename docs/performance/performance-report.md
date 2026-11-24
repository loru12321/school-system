# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `76a9f63a0af8`
- Recorded at: 2026-11-24T13:46:04.918Z
- Total smoke time: 24635 ms (-1765 ms vs previous)
- Login: 6562 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 90.1 ms, max derived network wait 10.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 11.700000000011642 ms | 1460 ms | 1471.7000000000116 ms |
| `freshman-simulator` | 51.39999999999418 ms | 624 ms | 675.3999999999942 ms |
| `student-overview` | 16 ms | 536 ms | 552 ms |
| `subject-balance` | 42.39999999999418 ms | 341 ms | 383.3999999999942 ms |
| `report-generator` | 17.10000000000582 ms | 333 ms | 350.1000000000058 ms |
| `cohort-growth` | 30.10000000000582 ms | 297 ms | 327.1000000000058 ms |
| `teacher-analysis` | 51.60000000000582 ms | 249 ms | 300.6000000000058 ms |
| `teacher-township-ranking` | 14.699999999982538 ms | 271 ms | 285.69999999998254 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `76a9f63a0af8` | 24635 ms | 6562 ms | 3 ms | 0 | 62 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
