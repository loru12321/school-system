# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ce19da531240`
- Recorded at: 2026-08-07T02:17:11.117Z
- Total smoke time: 27074 ms (+1522 ms vs previous)
- Login: 7971 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 50, max end-to-end 176.9 ms, max derived network wait 135.1 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 23.10000000000582 ms | 667 ms | 690.1000000000058 ms |
| `progress-analysis` | 31 ms | 649 ms | 680 ms |
| `report-generator` | 14.799999999988358 ms | 625 ms | 639.7999999999884 ms |
| `student-overview` | 25.5 ms | 579 ms | 604.5 ms |
| `indicator` | 34.79999999998836 ms | 507 ms | 541.7999999999884 ms |
| `freshman-simulator` | 46.5 ms | 461 ms | 507.5 ms |
| `subject-balance` | 36.70000000001164 ms | 457 ms | 493.70000000001164 ms |
| `teacher-township-ranking` | 2.5 ms | 445 ms | 447.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ce19da531240` | 27074 ms | 7971 ms | 3 ms | 0 | 50 | 0 | 0 |
| `10e5632247a0` | 25552 ms | 5106 ms | 357 ms | 0 | 50 | 0 | 0 |
| `86f1e40de13c` | 21224 ms | 3918 ms | 10 ms | 0 | 51 | 0 | 0 |
| `64a5f144579f` | 25921 ms | 6121 ms | 19 ms | 0 | 55 | 0 | 0 |
| `0844aa5f9308` | 24684 ms | 5128 ms | 20 ms | 0 | 53 | 0 | 0 |
| `95440b494093` | 25002 ms | 4663 ms | 19 ms | 0 | 51 | 0 | 0 |
| `3bc7826bd1ca` | 25135 ms | 4608 ms | 30 ms | 0 | 51 | 0 | 0 |
| `3b7c14247833` | 24566 ms | 4922 ms | 349 ms | 0 | 51 | 0 | 0 |
| `6ca9652039bb` | 23762 ms | 4672 ms | 25 ms | 0 | 49 | 0 | 0 |
| `8fc75f5ea3e4` | 30319 ms | 5050 ms | 4 ms | 0 | 0 | 0 | 0 |
| `e8383c48946d` | 26544 ms | 5658 ms | 25 ms | 0 | 0 | 0 | 0 |
| `81e284d92106` | 30587 ms | 4734 ms | 2 ms | 0 | 0 | 0 | 0 |
| `518cd8ebf5b6` | 24617 ms | 4870 ms | 3 ms | 0 | 0 | 0 | 0 |
| `fa59e13453ca` | 22501 ms | 3865 ms | 22 ms | 0 | 0 | 0 | 0 |
| `99a1183abb4a` | 25152 ms | 5666 ms | 329 ms | 0 | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
