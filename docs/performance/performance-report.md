# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `4550809f303a`
- Recorded at: 2026-11-21T22:25:41.019Z
- Total smoke time: 21528 ms (+1239 ms vs previous)
- Login: 6762 ms
- App ready: 2 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 25.8 ms, max derived network wait 10.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 8.200000000011642 ms | 1003 ms | 1011.2000000000116 ms |
| `student-overview` | 27.89999999999418 ms | 458 ms | 485.8999999999942 ms |
| `freshman-simulator` | 25.10000000000582 ms | 394 ms | 419.1000000000058 ms |
| `report-generator` | 12.39999999999418 ms | 270 ms | 282.3999999999942 ms |
| `cohort-growth` | 10.10000000000582 ms | 244 ms | 254.10000000000582 ms |
| `exam-arranger` | 1.2999999999883585 ms | 220 ms | 221.29999999998836 ms |
| `correlation-analysis` | 10.60000000000582 ms | 173 ms | 183.60000000000582 ms |
| `teacher-detail-comparison` | 9.299999999988358 ms | 154 ms | 163.29999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `4550809f303a` | 21528 ms | 6762 ms | 2 ms | 0 | 62 | 0 | 0 |
| `11731faf0797` | 20289 ms | 4965 ms | 6 ms | 0 | 60 | 0 | 0 |
| `ee093bec2e4c` | 24818 ms | 6754 ms | 2 ms | 0 | 54 | 0 | 0 |
| `ee656d49dea8` | 24703 ms | 6372 ms | 4 ms | 0 | 55 | 0 | 0 |
| `1751463d2efd` | 24611 ms | 7044 ms | 3 ms | 0 | 61 | 0 | 0 |
| `d16135dc7528` | 25192 ms | 7124 ms | 3 ms | 0 | 63 | 0 | 0 |
| `9cb24d6aead9` | 20318 ms | 5331 ms | 2 ms | 0 | 66 | 0 | 0 |
| `9b0d40113938` | 24540 ms | 6893 ms | 8 ms | 0 | 58 | 0 | 0 |
| `0853d67b418b` | 21516 ms | 6343 ms | 2 ms | 0 | 59 | 0 | 0 |
| `f26597c7bd27` | 23072 ms | 5421 ms | 8 ms | 0 | 64 | 0 | 0 |
| `2c647b2c30ef` | 20717 ms | 4831 ms | 2 ms | 0 | 56 | 0 | 0 |
| `c96ee5d15470` | 19911 ms | 3427 ms | 2 ms | 0 | 57 | 0 | 0 |
| `5ecbb3d7387a` | 18948 ms | 3346 ms | 3 ms | 0 | 62 | 0 | 0 |
| `4311dbda7945` | 19284 ms | 3488 ms | 2 ms | 0 | 62 | 0 | 0 |
| `1cfa90ba33e2` | 23056 ms | 3869 ms | 3 ms | 0 | 64 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
