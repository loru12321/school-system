# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b41e4ca7da27`
- Recorded at: 2026-08-29T10:28:23.290Z
- Total smoke time: 21329 ms (-9 ms vs previous)
- Login: 2245 ms
- App ready: 1029 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 61, max end-to-end 196.2 ms, max derived network wait 8.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 36.59999999999127 ms | 682 ms | 718.5999999999913 ms |
| `student-overview` | 38.5 ms | 584 ms | 622.5 ms |
| `subject-balance` | 44.59999999999127 ms | 433 ms | 477.59999999999127 ms |
| `report-generator` | 21.69999999999709 ms | 387 ms | 408.6999999999971 ms |
| `freshman-simulator` | 71.5 ms | 315 ms | 386.5 ms |
| `exam-arranger` | 24.59999999999127 ms | 351 ms | 375.59999999999127 ms |
| `cohort-growth` | 19.80000000000291 ms | 328 ms | 347.8000000000029 ms |
| `correlation-analysis` | 26 ms | 212 ms | 238 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `b41e4ca7da27` | 21329 ms | 2245 ms | 1029 ms | 0 | 61 | 0 | 0 |
| `b109866efafa` | 21338 ms | 2933 ms | 1012 ms | 0 | 62 | 0 | 0 |
| `53881a676629` | 20567 ms | 3925 ms | 1017 ms | 0 | 71 | 0 | 0 |
| `5788b21fb6c0` | 20858 ms | 2847 ms | 1051 ms | 0 | 70 | 0 | 0 |
| `b2894b341c6d` | 23318 ms | 2997 ms | 1013 ms | 0 | 72 | 0 | 0 |
| `6c688b3ab66b` | 21873 ms | 2871 ms | 1020 ms | 0 | 68 | 0 | 0 |
| `5353132871fa` | 21616 ms | 2635 ms | 1073 ms | 0 | 71 | 0 | 0 |
| `b524701a6236` | 21044 ms | 3990 ms | 1025 ms | 0 | 62 | 0 | 0 |
| `1a12a819d928` | 21498 ms | 2657 ms | 1059 ms | 0 | 62 | 0 | 0 |
| `92a668ed9af9` | 21546 ms | 2499 ms | 1080 ms | 0 | 63 | 0 | 0 |
| `2f65b6f6ef75` | 21790 ms | 2542 ms | 1127 ms | 0 | 62 | 0 | 0 |
| `426c06a6d078` | 19607 ms | 2385 ms | 1160 ms | 0 | 67 | 0 | 0 |
| `1a102f3a95a6` | 22412 ms | 3253 ms | 1010 ms | 0 | 61 | 0 | 0 |
| `f48d1b5f066e` | 21156 ms | 2839 ms | 1014 ms | 0 | 62 | 0 | 0 |
| `73aa7b8e6c65` | 21689 ms | 3296 ms | 1008 ms | 0 | 66 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
