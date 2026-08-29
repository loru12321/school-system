# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `8ea3683723e1`
- Recorded at: 2026-08-29T11:55:14.780Z
- Total smoke time: 22571 ms (+1190 ms vs previous)
- Login: 2321 ms
- App ready: 1059 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 194.7 ms, max derived network wait 5.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 39.5 ms | 678 ms | 717.5 ms |
| `student-overview` | 38.40000000000873 ms | 528 ms | 566.4000000000087 ms |
| `subject-balance` | 41.80000000000291 ms | 437 ms | 478.8000000000029 ms |
| `freshman-simulator` | 81.59999999999127 ms | 358 ms | 439.59999999999127 ms |
| `report-generator` | 19.19999999999709 ms | 395 ms | 414.1999999999971 ms |
| `cohort-growth` | 19 ms | 381 ms | 400 ms |
| `exam-arranger` | 24.5 ms | 354 ms | 378.5 ms |
| `correlation-analysis` | 19.30000000000291 ms | 242 ms | 261.3000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `8ea3683723e1` | 22571 ms | 2321 ms | 1059 ms | 0 | 66 | 0 | 0 |
| `68025019baa2` | 21381 ms | 2311 ms | 1016 ms | 0 | 69 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
