# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `2b2cd4f07bae`
- Recorded at: 2026-08-30T01:00:04.585Z
- Total smoke time: 20199 ms (+1279 ms vs previous)
- Login: 2371 ms
- App ready: 1022 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 63, max end-to-end 190.9 ms, max derived network wait 7.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 34.09999999997672 ms | 784 ms | 818.0999999999767 ms |
| `student-overview` | 52 ms | 496 ms | 548 ms |
| `subject-balance` | 33.399999999965075 ms | 384 ms | 417.3999999999651 ms |
| `report-generator` | 19.100000000034925 ms | 372 ms | 391.1000000000349 ms |
| `freshman-simulator` | 71.39999999996508 ms | 302 ms | 373.3999999999651 ms |
| `exam-arranger` | 15.799999999988358 ms | 344 ms | 359.79999999998836 ms |
| `cohort-growth` | 21.600000000034925 ms | 333 ms | 354.6000000000349 ms |
| `progress-analysis` | 72.90000000002328 ms | 196 ms | 268.9000000000233 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `2b2cd4f07bae` | 20199 ms | 2371 ms | 1022 ms | 0 | 63 | 0 | 0 |
| `3ecf2232279e` | 18920 ms | 2313 ms | 1005 ms | 0 | 68 | 0 | 0 |
| `1e579cfa0dcd` | 20977 ms | 2927 ms | 1012 ms | 0 | 59 | 0 | 0 |
| `2d1a0fb7c9c0` | 22068 ms | 2329 ms | 1024 ms | 0 | 60 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
