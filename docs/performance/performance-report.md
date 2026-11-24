# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `28a19dc5a1c6`
- Recorded at: 2026-11-24T08:01:30.563Z
- Total smoke time: 22454 ms (-271 ms vs previous)
- Login: 6313 ms
- App ready: 2 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 58, max end-to-end 58.4 ms, max derived network wait 4.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 10.69999999999709 ms | 1189 ms | 1199.699999999997 ms |
| `student-overview` | 24 ms | 461 ms | 485 ms |
| `freshman-simulator` | 35.90000000000873 ms | 318 ms | 353.90000000000873 ms |
| `report-generator` | 13.80000000000291 ms | 306 ms | 319.8000000000029 ms |
| `cohort-growth` | 22.30000000000291 ms | 275 ms | 297.3000000000029 ms |
| `exam-arranger` | 0.8999999999941792 ms | 235 ms | 235.89999999999418 ms |
| `correlation-analysis` | 18.60000000000582 ms | 203 ms | 221.60000000000582 ms |
| `teacher-analysis` | 38.39999999999418 ms | 177 ms | 215.39999999999418 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `ee093bec2e4c` | 24818 ms | 6754 ms | 2 ms | 0 | 54 | 0 | 0 |
| `ee656d49dea8` | 24703 ms | 6372 ms | 4 ms | 0 | 55 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
