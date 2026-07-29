# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `99a1183abb4a`
- Recorded at: 2026-07-29T01:50:49.203Z
- Total smoke time: 25152 ms (-4942 ms vs previous)
- Login: 5666 ms
- App ready: 329 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 95 ms | 718 ms | 813 ms |
| `report-generator` | 18.099999999976717 ms | 606 ms | 624.0999999999767 ms |
| `student-overview` | 32.600000000034925 ms | 591 ms | 623.6000000000349 ms |
| `subject-balance` | 33.5 ms | 474 ms | 507.5 ms |
| `teacher-township-ranking` | 2.900000000023283 ms | 457 ms | 459.9000000000233 ms |
| `cohort-growth` | 12.799999999988358 ms | 447 ms | 459.79999999998836 ms |
| `freshman-simulator` | 52.100000000034925 ms | 400 ms | 452.1000000000349 ms |
| `grade-scheduler` | 23.5 ms | 382 ms | 405.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `6c6b7bd3d76a` | 25096 ms | 5014 ms | 17 ms | 0 | 0 | 0 |
| `41f24f60531e` | 31204 ms | 5790 ms | 203 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
