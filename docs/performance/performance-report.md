# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `5e50dbb0020f`
- Recorded at: 2026-11-21T22:43:19.730Z
- Total smoke time: 22487 ms (+959 ms vs previous)
- Login: 6651 ms
- App ready: 1 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 55, max end-to-end 42.2 ms, max derived network wait 6.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 8.5 ms | 1078 ms | 1086.5 ms |
| `freshman-simulator` | 44.90000000002328 ms | 500 ms | 544.9000000000233 ms |
| `student-overview` | 38.29999999993015 ms | 459 ms | 497.29999999993015 ms |
| `cohort-growth` | 10.20000000006985 ms | 321 ms | 331.20000000006985 ms |
| `report-generator` | 13.29999999993015 ms | 283 ms | 296.29999999993015 ms |
| `exam-arranger` | 1.7000000000698492 ms | 240 ms | 241.70000000006985 ms |
| `subject-balance` | 29.300000000046566 ms | 179 ms | 208.30000000004657 ms |
| `correlation-analysis` | 10.199999999953434 ms | 184 ms | 194.19999999995343 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `5e50dbb0020f` | 22487 ms | 6651 ms | 1 ms | 0 | 55 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
