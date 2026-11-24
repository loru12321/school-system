# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0bb3b1fb48d1`
- Recorded at: 2026-11-24T14:11:29.136Z
- Total smoke time: 22893 ms (-1742 ms vs previous)
- Login: 7129 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 55, max end-to-end 50.4 ms, max derived network wait 19.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 10.400000000008731 ms | 1057 ms | 1067.4000000000087 ms |
| `freshman-simulator` | 40.39999999999418 ms | 457 ms | 497.3999999999942 ms |
| `student-overview` | 28.90000000000873 ms | 453 ms | 481.90000000000873 ms |
| `report-generator` | 14.400000000008731 ms | 296 ms | 310.40000000000873 ms |
| `cohort-growth` | 18.19999999999709 ms | 274 ms | 292.1999999999971 ms |
| `exam-arranger` | 18 ms | 224 ms | 242 ms |
| `correlation-analysis` | 13.200000000011642 ms | 217 ms | 230.20000000001164 ms |
| `teacher-analysis` | 30.19999999999709 ms | 181 ms | 211.1999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `0bb3b1fb48d1` | 22893 ms | 7129 ms | 3 ms | 0 | 55 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
