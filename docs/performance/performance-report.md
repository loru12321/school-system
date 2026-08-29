# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `a7e525a61e35`
- Recorded at: 2026-08-29T23:46:25.082Z
- Total smoke time: 19645 ms (+126 ms vs previous)
- Login: 2618 ms
- App ready: 1030 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 147.7 ms, max derived network wait 6.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 28.5 ms | 690 ms | 718.5 ms |
| `student-overview` | 36 ms | 493 ms | 529 ms |
| `freshman-simulator` | 55.59999999999127 ms | 389 ms | 444.59999999999127 ms |
| `subject-balance` | 33.19999999999709 ms | 355 ms | 388.1999999999971 ms |
| `cohort-growth` | 15 ms | 355 ms | 370 ms |
| `report-generator` | 18.60000000000582 ms | 330 ms | 348.6000000000058 ms |
| `exam-arranger` | 11.30000000000291 ms | 337 ms | 348.3000000000029 ms |
| `correlation-analysis` | 13.69999999999709 ms | 207 ms | 220.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `a7e525a61e35` | 19645 ms | 2618 ms | 1030 ms | 0 | 65 | 0 | 0 |
| `f5a4138f4cb7` | 19519 ms | 2011 ms | 1176 ms | 0 | 66 | 0 | 0 |
| `312e60a949af` | 21483 ms | 3013 ms | 1009 ms | 0 | 65 | 0 | 0 |
| `2ba83ac63dd0` | 23250 ms | 5057 ms | 1018 ms | 0 | 69 | 0 | 0 |
| `e2a4ad0982d7` | 20970 ms | 2914 ms | 1015 ms | 0 | 63 | 0 | 0 |
| `3cd419a94b71` | 23695 ms | 2415 ms | 1008 ms | 0 | 68 | 0 | 0 |
| `3ca4f007112d` | 21061 ms | 2386 ms | 1029 ms | 0 | 69 | 0 | 0 |
| `d19c25b6e9ca` | 21644 ms | 2815 ms | 1013 ms | 0 | 65 | 0 | 0 |
| `54a9d03dcc6d` | 21099 ms | 2624 ms | 1010 ms | 0 | 65 | 0 | 0 |
| `23dea5ac7d5a` | 21575 ms | 2886 ms | 1007 ms | 0 | 59 | 0 | 0 |
| `e2ef1db0a1d2` | 20959 ms | 2615 ms | 1011 ms | 0 | 66 | 0 | 0 |
| `8ea3683723e1` | 22571 ms | 2321 ms | 1059 ms | 0 | 66 | 0 | 0 |
| `68025019baa2` | 21381 ms | 2311 ms | 1016 ms | 0 | 69 | 0 | 0 |
| `b41e4ca7da27` | 21329 ms | 2245 ms | 1029 ms | 0 | 61 | 0 | 0 |
| `b109866efafa` | 21338 ms | 2933 ms | 1012 ms | 0 | 62 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
