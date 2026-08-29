# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `5788b21fb6c0`
- Recorded at: 2026-08-29T09:43:49.603Z
- Total smoke time: 20858 ms (-2460 ms vs previous)
- Login: 2847 ms
- App ready: 1051 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 141.3 ms, max derived network wait 14.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 26.89999999999418 ms | 658 ms | 684.8999999999942 ms |
| `student-overview` | 42.5 ms | 531 ms | 573.5 ms |
| `freshman-simulator` | 69.30000000001746 ms | 438 ms | 507.30000000001746 ms |
| `cohort-growth` | 14.700000000011642 ms | 446 ms | 460.70000000001164 ms |
| `subject-balance` | 27.70000000001164 ms | 358 ms | 385.70000000001164 ms |
| `exam-arranger` | 16.10000000000582 ms | 348 ms | 364.1000000000058 ms |
| `report-generator` | 24.10000000000582 ms | 329 ms | 353.1000000000058 ms |
| `correlation-analysis` | 20.10000000000582 ms | 217 ms | 237.10000000000582 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `ee2492176f6d` | 21526 ms | 2996 ms | 1306 ms | 0 | 63 | 0 | 0 |
| `351c86ea8cb3` | 22605 ms | 3110 ms | 1028 ms | 0 | 55 | 0 | 0 |
| `72a305f02bda` | 20431 ms | 2658 ms | 1011 ms | 0 | 60 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
