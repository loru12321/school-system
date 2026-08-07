# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `eb593c740fa7`
- Recorded at: 2026-08-07T14:25:58.750Z
- Total smoke time: 29262 ms (+4783 ms vs previous)
- Login: 9712 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 56, max end-to-end 208.2 ms, max derived network wait 12.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 31.70000000001164 ms | 708 ms | 739.7000000000116 ms |
| `progress-analysis` | 67.60000000003492 ms | 641 ms | 708.6000000000349 ms |
| `report-generator` | 19.400000000023283 ms | 685 ms | 704.4000000000233 ms |
| `student-overview` | 37 ms | 560 ms | 597 ms |
| `subject-balance` | 33.90000000002328 ms | 449 ms | 482.9000000000233 ms |
| `teacher-township-ranking` | 3.7999999999883585 ms | 464 ms | 467.79999999998836 ms |
| `indicator` | 28.699999999953434 ms | 439 ms | 467.69999999995343 ms |
| `cohort-growth` | 11.699999999953434 ms | 432 ms | 443.69999999995343 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `eb593c740fa7` | 29262 ms | 9712 ms | 4 ms | 0 | 56 | 0 | 0 |
| `2e91afdaeb53` | 24479 ms | 4766 ms | 4 ms | 0 | 55 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
