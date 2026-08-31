# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b80c87a81689`
- Recorded at: 2026-08-31T02:01:02.716Z
- Total smoke time: 21845 ms (-105 ms vs previous)
- Login: 2476 ms
- App ready: 1055 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 60, max end-to-end 216.4 ms, max derived network wait 9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 44.19999999999709 ms | 1013 ms | 1057.199999999997 ms |
| `freshman-simulator` | 71.89999999999418 ms | 553 ms | 624.8999999999942 ms |
| `student-overview` | 62.5 ms | 507 ms | 569.5 ms |
| `subject-balance` | 56.80000000000291 ms | 482 ms | 538.8000000000029 ms |
| `report-generator` | 20.5 ms | 418 ms | 438.5 ms |
| `cohort-growth` | 17.69999999999709 ms | 395 ms | 412.6999999999971 ms |
| `exam-arranger` | 21.69999999999709 ms | 367 ms | 388.6999999999971 ms |
| `correlation-analysis` | 36.69999999999709 ms | 264 ms | 300.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `b80c87a81689` | 21845 ms | 2476 ms | 1055 ms | 0 | 60 | 0 | 0 |
| `bc42a749b7d3` | 21950 ms | 5839 ms | 7 ms | 0 | 61 | 0 | 0 |
| `ba14d4a1b141` | 22684 ms | 3254 ms | 1025 ms | 0 | 62 | 0 | 0 |
| `c08652add921` | 21753 ms | 2211 ms | 1022 ms | 0 | 64 | 0 | 0 |
| `a85c047c121a` | 22209 ms | 3032 ms | 1238 ms | 0 | 60 | 0 | 0 |
| `3286409ab233` | 21063 ms | 2331 ms | 1066 ms | 0 | 62 | 0 | 0 |
| `3269ee00ab56` | 22474 ms | 3033 ms | 1030 ms | 0 | 62 | 0 | 0 |
| `b513653633e4` | 21932 ms | 2698 ms | 1051 ms | 0 | 68 | 0 | 0 |
| `57444f2d7993` | 20284 ms | 2483 ms | 1060 ms | 0 | 68 | 0 | 0 |
| `efea6ba0a46c` | 21994 ms | 2939 ms | 1025 ms | 0 | 64 | 0 | 0 |
| `99a079912bd3` | 19870 ms | 3109 ms | 1018 ms | 0 | 64 | 0 | 0 |
| `81041f8efa78` | 21198 ms | 2720 ms | 1034 ms | 0 | 58 | 0 | 0 |
| `ef6a2bf6405e` | 20569 ms | 2409 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `36797b65331a` | 22329 ms | 2701 ms | 1137 ms | 0 | 59 | 0 | 0 |
| `9adaebb3485c` | 22300 ms | 2932 ms | 1013 ms | 0 | 63 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
