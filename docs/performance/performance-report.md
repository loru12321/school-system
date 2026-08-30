# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `3ecf2232279e`
- Recorded at: 2026-08-30T00:45:27.264Z
- Total smoke time: 18920 ms (-2057 ms vs previous)
- Login: 2313 ms
- App ready: 1005 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 68, max end-to-end 145.6 ms, max derived network wait 7.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 24.30000000000291 ms | 654 ms | 678.3000000000029 ms |
| `student-overview` | 32.39999999999418 ms | 471 ms | 503.3999999999942 ms |
| `freshman-simulator` | 68.10000000000582 ms | 282 ms | 350.1000000000058 ms |
| `exam-arranger` | 2.6999999999970896 ms | 339 ms | 341.6999999999971 ms |
| `report-generator` | 13 ms | 320 ms | 333 ms |
| `subject-balance` | 27.30000000000291 ms | 301 ms | 328.3000000000029 ms |
| `cohort-growth` | 15 ms | 276 ms | 291 ms |
| `teacher-analysis` | 45.09999999999127 ms | 164 ms | 209.09999999999127 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `8ea3683723e1` | 22571 ms | 2321 ms | 1059 ms | 0 | 66 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
