# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `64a5f144579f`
- Recorded at: 2026-07-31T06:59:31.670Z
- Total smoke time: 25921 ms (+1237 ms vs previous)
- Login: 6121 ms
- App ready: 19 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 55, max end-to-end 199.6 ms, max derived network wait 9.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 14.80000000000291 ms | 895 ms | 909.8000000000029 ms |
| `progress-analysis` | 54.39999999999418 ms | 685 ms | 739.3999999999942 ms |
| `student-overview` | 36.5 ms | 685 ms | 721.5 ms |
| `subject-balance` | 40.20000000001164 ms | 509 ms | 549.2000000000116 ms |
| `indicator` | 29.5 ms | 501 ms | 530.5 ms |
| `freshman-simulator` | 66.40000000000873 ms | 394 ms | 460.40000000000873 ms |
| `grade-scheduler` | 25.5 ms | 426 ms | 451.5 ms |
| `teacher-township-ranking` | 3.5 ms | 444 ms | 447.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `2f675c0b6169` | 30094 ms | 5285 ms | 5 ms | 0 | 0 | 0 | 0 |
| `e9fbe0d7ba17` | 27004 ms | 4365 ms | 334 ms | 0 | 0 | 0 | 0 |
| `8a0bc4cccf75` | 25869 ms | 5521 ms | 20 ms | 0 | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
