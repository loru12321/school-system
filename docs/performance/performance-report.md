# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `1c5505435dcc`
- Recorded at: 2026-08-07T09:38:36.890Z
- Total smoke time: 26971 ms (-11 ms vs previous)
- Login: 7403 ms
- App ready: 20 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 52, max end-to-end 173.2 ms, max derived network wait 95.1 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 15.900000000023283 ms | 896 ms | 911.9000000000233 ms |
| `grade-scheduler` | 25.099999999976717 ms | 660 ms | 685.0999999999767 ms |
| `indicator` | 28.900000000023283 ms | 597 ms | 625.9000000000233 ms |
| `student-overview` | 28.099999999976717 ms | 590 ms | 618.0999999999767 ms |
| `freshman-simulator` | 49.5 ms | 477 ms | 526.5 ms |
| `subject-balance` | 38 ms | 455 ms | 493 ms |
| `teacher-township-ranking` | 5.400000000023283 ms | 455 ms | 460.4000000000233 ms |
| `teacher-analysis` | 37.300000000046566 ms | 401 ms | 438.30000000004657 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `1c5505435dcc` | 26971 ms | 7403 ms | 20 ms | 0 | 52 | 0 | 0 |
| `2615a828f476` | 26982 ms | 5743 ms | 18 ms | 0 | 58 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
