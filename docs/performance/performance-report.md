# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `3bc7826bd1ca`
- Recorded at: 2026-07-31T06:05:28.442Z
- Total smoke time: 25135 ms (+569 ms vs previous)
- Login: 4608 ms
- App ready: 30 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 51, max end-to-end 290.4 ms, max derived network wait 11.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 54 ms | 958 ms | 1012 ms |
| `report-generator` | 17 ms | 681 ms | 698 ms |
| `student-overview` | 49.89999999999418 ms | 600 ms | 649.8999999999942 ms |
| `teacher-township-ranking` | 3.3999999999941792 ms | 628 ms | 631.3999999999942 ms |
| `indicator` | 36.80000000001746 ms | 512 ms | 548.8000000000175 ms |
| `subject-balance` | 39.5 ms | 500 ms | 539.5 ms |
| `teacher-analysis` | 56.39999999999418 ms | 461 ms | 517.3999999999942 ms |
| `freshman-simulator` | 57.59999999997672 ms | 443 ms | 500.5999999999767 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `3bc7826bd1ca` | 25135 ms | 4608 ms | 30 ms | 0 | 51 | 0 | 0 |
| `3b7c14247833` | 24566 ms | 4922 ms | 349 ms | 0 | 51 | 0 | 0 |
| `6ca9652039bb` | 23762 ms | 4672 ms | 25 ms | 0 | 49 | 0 | 0 |
| `8fc75f5ea3e4` | 30319 ms | 5050 ms | 4 ms | 0 | 0 | 0 | 0 |
| `e8383c48946d` | 26544 ms | 5658 ms | 25 ms | 0 | 0 | 0 | 0 |
| `81e284d92106` | 30587 ms | 4734 ms | 2 ms | 0 | 0 | 0 | 0 |
| `518cd8ebf5b6` | 24617 ms | 4870 ms | 3 ms | 0 | 0 | 0 | 0 |
| `fa59e13453ca` | 22501 ms | 3865 ms | 22 ms | 0 | 0 | 0 | 0 |
| `99a1183abb4a` | 25152 ms | 5666 ms | 329 ms | 0 | 0 | 0 | 0 |
| `2f675c0b6169` | 30094 ms | 5285 ms | 5 ms | 0 | 0 | 0 | 0 |
| `e9fbe0d7ba17` | 27004 ms | 4365 ms | 334 ms | 0 | 0 | 0 | 0 |
| `8a0bc4cccf75` | 25869 ms | 5521 ms | 20 ms | 0 | 0 | 0 | 0 |
| `c79a68fffdba` | 27800 ms | 6812 ms | 17 ms | 0 | 0 | 0 | 0 |
| `9a881a1275e8` | 26158 ms | 4225 ms | 4 ms | 0 | 0 | 0 | 0 |
| `12a006cb7712` | 27592 ms | 5519 ms | 18 ms | 0 | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
