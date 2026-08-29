# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d19c25b6e9ca`
- Recorded at: 2026-08-29T14:36:58.497Z
- Total smoke time: 21644 ms (+545 ms vs previous)
- Login: 2815 ms
- App ready: 1013 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 185.1 ms, max derived network wait 5.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 32.60000000000582 ms | 697 ms | 729.6000000000058 ms |
| `student-overview` | 55.5 ms | 586 ms | 641.5 ms |
| `freshman-simulator` | 88.20000000001164 ms | 386 ms | 474.20000000001164 ms |
| `subject-balance` | 41.89999999999418 ms | 422 ms | 463.8999999999942 ms |
| `report-generator` | 17.5 ms | 405 ms | 422.5 ms |
| `exam-arranger` | 24.20000000001164 ms | 345 ms | 369.20000000001164 ms |
| `cohort-growth` | 23.300000000017462 ms | 321 ms | 344.30000000001746 ms |
| `progress-analysis` | 77.79999999998836 ms | 224 ms | 301.79999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `d19c25b6e9ca` | 21644 ms | 2815 ms | 1013 ms | 0 | 65 | 0 | 0 |
| `54a9d03dcc6d` | 21099 ms | 2624 ms | 1010 ms | 0 | 65 | 0 | 0 |
| `23dea5ac7d5a` | 21575 ms | 2886 ms | 1007 ms | 0 | 59 | 0 | 0 |
| `e2ef1db0a1d2` | 20959 ms | 2615 ms | 1011 ms | 0 | 66 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
