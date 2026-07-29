# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `81e284d92106`
- Recorded at: 2026-07-29T03:47:15.795Z
- Total smoke time: 30587 ms (+5970 ms vs previous)
- Login: 4734 ms
- App ready: 2 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 16.900000000023283 ms | 948 ms | 964.9000000000233 ms |
| `subject-balance` | 42.5 ms | 668 ms | 710.5 ms |
| `progress-analysis` | 78.19999999998254 ms | 605 ms | 683.1999999999825 ms |
| `student-overview` | 39.70000000001164 ms | 641 ms | 680.7000000000116 ms |
| `teacher-township-ranking` | 3.5 ms | 588 ms | 591.5 ms |
| `indicator` | 40 ms | 536 ms | 576 ms |
| `freshman-simulator` | 60.39999999999418 ms | 430 ms | 490.3999999999942 ms |
| `grade-scheduler` | 28.79999999998836 ms | 397 ms | 425.79999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `81e284d92106` | 30587 ms | 4734 ms | 2 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
