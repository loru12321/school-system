# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c9d1231914cb`
- Recorded at: 2026-11-24T08:59:28.849Z
- Total smoke time: 22013 ms (-441 ms vs previous)
- Login: 5735 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 33 ms, max derived network wait 6.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 11.099999999976717 ms | 1216 ms | 1227.0999999999767 ms |
| `freshman-simulator` | 50.09999999997672 ms | 594 ms | 644.0999999999767 ms |
| `student-overview` | 14.299999999988358 ms | 466 ms | 480.29999999998836 ms |
| `subject-balance` | 34.40000000002328 ms | 278 ms | 312.4000000000233 ms |
| `report-generator` | 15 ms | 283 ms | 298 ms |
| `cohort-growth` | 19.399999999965075 ms | 268 ms | 287.3999999999651 ms |
| `exam-arranger` | 1.7999999999883585 ms | 238 ms | 239.79999999998836 ms |
| `progress-analysis` | 46.600000000034925 ms | 170 ms | 216.60000000003492 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `ee093bec2e4c` | 24818 ms | 6754 ms | 2 ms | 0 | 54 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
