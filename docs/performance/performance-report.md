# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `2f675c0b6169`
- Recorded at: 2026-07-29T00:31:41.214Z
- Total smoke time: 30094 ms (+3090 ms vs previous)
- Login: 5285 ms
- App ready: 5 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 18.29999999998836 ms | 810 ms | 828.2999999999884 ms |
| `student-overview` | 35.5 ms | 616 ms | 651.5 ms |
| `freshman-simulator` | 69.30000000001746 ms | 489 ms | 558.3000000000175 ms |
| `progress-analysis` | 57.70000000001164 ms | 454 ms | 511.70000000001164 ms |
| `subject-balance` | 32.29999999998836 ms | 477 ms | 509.29999999998836 ms |
| `grade-scheduler` | 30.79999999998836 ms | 461 ms | 491.79999999998836 ms |
| `analysis` | 52.79999999998836 ms | 356 ms | 408.79999999998836 ms |
| `teacher-analysis` | 51.5 ms | 343 ms | 394.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `2f675c0b6169` | 30094 ms | 5285 ms | 5 ms | 0 | 0 | 0 |
| `e9fbe0d7ba17` | 27004 ms | 4365 ms | 334 ms | 0 | 0 | 0 |
| `8a0bc4cccf75` | 25869 ms | 5521 ms | 20 ms | 0 | 0 | 0 |
| `c79a68fffdba` | 27800 ms | 6812 ms | 17 ms | 0 | 0 | 0 |
| `9a881a1275e8` | 26158 ms | 4225 ms | 4 ms | 0 | 0 | 0 |
| `12a006cb7712` | 27592 ms | 5519 ms | 18 ms | 0 | 0 | 0 |
| `53422df1149f` | 27059 ms | 4906 ms | 349 ms | 0 | 0 | 0 |
| `bb6db0dddc6e` | 25272 ms | 5201 ms | 20 ms | 0 | 0 | 0 |
| `dfc2e6d479be` | 24205 ms | 4813 ms | 12 ms | 0 | 0 | 0 |
| `d0755a9cf3cc` | 22818 ms | 4661 ms | 18 ms | 0 | 0 | 0 |
| `6d5c10e71888` | 25733 ms | 5326 ms | 353 ms | 0 | 0 | 0 |
| `71d42f773ada` | 24588 ms | 4670 ms | 41 ms | 0 | 0 | 0 |
| `6c6b7bd3d76a` | 25096 ms | 5014 ms | 17 ms | 0 | 0 | 0 |
| `41f24f60531e` | 31204 ms | 5790 ms | 203 ms | 0 | 0 | 0 |
| `e88b660de44c` | 29430 ms | 6133 ms | 86 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
