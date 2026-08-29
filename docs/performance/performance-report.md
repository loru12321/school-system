# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f5a4138f4cb7`
- Recorded at: 2026-08-29T23:41:15.662Z
- Total smoke time: 19519 ms (-1964 ms vs previous)
- Login: 2011 ms
- App ready: 1176 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 160 ms, max derived network wait 6.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 31.600000000034925 ms | 671 ms | 702.6000000000349 ms |
| `student-overview` | 37.59999999997672 ms | 512 ms | 549.5999999999767 ms |
| `freshman-simulator` | 68.69999999995343 ms | 323 ms | 391.69999999995343 ms |
| `exam-arranger` | 18.599999999976717 ms | 351 ms | 369.5999999999767 ms |
| `report-generator` | 18.70000000001164 ms | 345 ms | 363.70000000001164 ms |
| `subject-balance` | 31.400000000023283 ms | 290 ms | 321.4000000000233 ms |
| `cohort-growth` | 18.899999999965075 ms | 277 ms | 295.8999999999651 ms |
| `progress-analysis` | 69.29999999998836 ms | 207 ms | 276.29999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `53881a676629` | 20567 ms | 3925 ms | 1017 ms | 0 | 71 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
