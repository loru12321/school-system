# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `69f591bdac2a`
- Recorded at: 2026-08-30T02:49:22.228Z
- Total smoke time: 20750 ms (-881 ms vs previous)
- Login: 2529 ms
- App ready: 1046 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 61, max end-to-end 208.2 ms, max derived network wait 6.1 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 33.60000000000582 ms | 718 ms | 751.6000000000058 ms |
| `freshman-simulator` | 91.09999999999127 ms | 486 ms | 577.0999999999913 ms |
| `student-overview` | 39.10000000000582 ms | 487 ms | 526.1000000000058 ms |
| `subject-balance` | 41.70000000001164 ms | 454 ms | 495.70000000001164 ms |
| `report-generator` | 15.19999999999709 ms | 374 ms | 389.1999999999971 ms |
| `cohort-growth` | 18 ms | 355 ms | 373 ms |
| `exam-arranger` | 14.299999999988358 ms | 338 ms | 352.29999999998836 ms |
| `teacher-analysis` | 38.5 ms | 174 ms | 212.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `69f591bdac2a` | 20750 ms | 2529 ms | 1046 ms | 0 | 61 | 0 | 0 |
| `8c204609b71a` | 21631 ms | 3071 ms | 1023 ms | 0 | 64 | 0 | 0 |
| `7d4650776aea` | 19374 ms | 2469 ms | 1006 ms | 0 | 66 | 0 | 0 |
| `5ca9a8297191` | 22730 ms | 3099 ms | 1013 ms | 0 | 62 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
