# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `e8383c48946d`
- Recorded at: 2026-07-29T04:00:12.157Z
- Total smoke time: 26544 ms (-4043 ms vs previous)
- Login: 5658 ms
- App ready: 25 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 74.20000000001164 ms | 1002 ms | 1076.2000000000116 ms |
| `student-overview` | 36 ms | 639 ms | 675 ms |
| `report-generator` | 16.5 ms | 655 ms | 671.5 ms |
| `freshman-simulator` | 67.10000000000582 ms | 494 ms | 561.1000000000058 ms |
| `subject-balance` | 30.80000000000291 ms | 508 ms | 538.8000000000029 ms |
| `teacher-township-ranking` | 4.2000000000116415 ms | 525 ms | 529.2000000000116 ms |
| `cohort-growth` | 13.69999999999709 ms | 439 ms | 452.6999999999971 ms |
| `indicator` | 32.5 ms | 413 ms | 445.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `e8383c48946d` | 26544 ms | 5658 ms | 25 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
