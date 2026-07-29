# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `518cd8ebf5b6`
- Recorded at: 2026-07-29T03:17:04.168Z
- Total smoke time: 24617 ms (+2116 ms vs previous)
- Login: 4870 ms
- App ready: 3 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 40.10000000000582 ms | 923 ms | 963.1000000000058 ms |
| `student-overview` | 39.5 ms | 757 ms | 796.5 ms |
| `report-generator` | 14.5 ms | 684 ms | 698.5 ms |
| `subject-balance` | 40.69999999999709 ms | 527 ms | 567.6999999999971 ms |
| `freshman-simulator` | 68.89999999999418 ms | 448 ms | 516.8999999999942 ms |
| `indicator` | 29.90000000000873 ms | 449 ms | 478.90000000000873 ms |
| `exam-arranger` | 13.60000000000582 ms | 446 ms | 459.6000000000058 ms |
| `grade-scheduler` | 29.10000000000582 ms | 400 ms | 429.1000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `518cd8ebf5b6` | 24617 ms | 4870 ms | 3 ms | 0 | 0 | 0 |
| `fa59e13453ca` | 22501 ms | 3865 ms | 22 ms | 0 | 0 | 0 |
| `99a1183abb4a` | 25152 ms | 5666 ms | 329 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
