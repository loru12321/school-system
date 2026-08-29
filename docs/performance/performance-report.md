# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b2894b341c6d`
- Recorded at: 2026-08-29T09:28:16.672Z
- Total smoke time: 23318 ms (+1445 ms vs previous)
- Login: 2997 ms
- App ready: 1013 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 72, max end-to-end 198.6 ms, max derived network wait 8.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 36.39999999999418 ms | 694 ms | 730.3999999999942 ms |
| `student-overview` | 35.40000000000873 ms | 501 ms | 536.4000000000087 ms |
| `freshman-simulator` | 86.80000000000291 ms | 443 ms | 529.8000000000029 ms |
| `subject-balance` | 43.19999999999709 ms | 468 ms | 511.1999999999971 ms |
| `report-generator` | 19.80000000000291 ms | 442 ms | 461.8000000000029 ms |
| `cohort-growth` | 17.60000000000582 ms | 370 ms | 387.6000000000058 ms |
| `exam-arranger` | 1.0999999999912689 ms | 350 ms | 351.09999999999127 ms |
| `teacher-township-ranking` | 10.5 ms | 252 ms | 262.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `aba8932f8f92` | 21855 ms | 2518 ms | 1092 ms | 0 | 58 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
