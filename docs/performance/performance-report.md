# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `2ba83ac63dd0`
- Recorded at: 2026-08-29T22:27:26.692Z
- Total smoke time: 23250 ms (+2280 ms vs previous)
- Login: 5057 ms
- App ready: 1018 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 69, max end-to-end 202.3 ms, max derived network wait 5.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 33.5 ms | 721 ms | 754.5 ms |
| `freshman-simulator` | 97.5 ms | 464 ms | 561.5 ms |
| `subject-balance` | 39.89999999999418 ms | 502 ms | 541.8999999999942 ms |
| `student-overview` | 37.29999999998836 ms | 477 ms | 514.2999999999884 ms |
| `report-generator` | 18.29999999998836 ms | 372 ms | 390.29999999998836 ms |
| `exam-arranger` | 16.60000000000582 ms | 338 ms | 354.6000000000058 ms |
| `cohort-growth` | 16.79999999998836 ms | 320 ms | 336.79999999998836 ms |
| `progress-analysis` | 82.60000000000582 ms | 191 ms | 273.6000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `53881a676629` | 20567 ms | 3925 ms | 1017 ms | 0 | 71 | 0 | 0 |
| `5788b21fb6c0` | 20858 ms | 2847 ms | 1051 ms | 0 | 70 | 0 | 0 |
| `b2894b341c6d` | 23318 ms | 2997 ms | 1013 ms | 0 | 72 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
