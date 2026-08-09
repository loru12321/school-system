# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `755442d252bd`
- Recorded at: 2026-08-09T11:29:11.357Z
- Total smoke time: 25467 ms (+2931 ms vs previous)
- Login: 4815 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 50, max end-to-end 227.2 ms, max derived network wait 11.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 17.5 ms | 969 ms | 986.5 ms |
| `grade-scheduler` | 32.90000000002328 ms | 761 ms | 793.9000000000233 ms |
| `student-overview` | 33.899999999965075 ms | 680 ms | 713.8999999999651 ms |
| `indicator` | 21.800000000046566 ms | 588 ms | 609.8000000000466 ms |
| `subject-balance` | 36.100000000034925 ms | 536 ms | 572.1000000000349 ms |
| `teacher-township-ranking` | 2.6000000000349246 ms | 523 ms | 525.6000000000349 ms |
| `progress-analysis` | 90 ms | 434 ms | 524 ms |
| `teacher-analysis` | 42.5 ms | 417 ms | 459.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `755442d252bd` | 25467 ms | 4815 ms | 3 ms | 0 | 50 | 0 | 0 |
| `dff221e6c627` | 22536 ms | 3240 ms | 3 ms | 0 | 48 | 0 | 0 |
| `e00fc5099dfa` | 21713 ms | 3699 ms | 16 ms | 0 | 54 | 0 | 0 |
| `1f135b2caae4` | 25404 ms | 5125 ms | 13 ms | 0 | 51 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
