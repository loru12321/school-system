# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `007fef382fcd`
- Recorded at: 2026-08-30T03:03:11.850Z
- Total smoke time: 21776 ms (+1026 ms vs previous)
- Login: 2140 ms
- App ready: 1066 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 4136 ms, max derived network wait 4135.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 39.10000000000582 ms | 817 ms | 856.1000000000058 ms |
| `student-overview` | 33.89999999999418 ms | 552 ms | 585.8999999999942 ms |
| `subject-balance` | 42.30000000000291 ms | 438 ms | 480.3000000000029 ms |
| `freshman-simulator` | 82.79999999998836 ms | 384 ms | 466.79999999998836 ms |
| `report-generator` | 19.19999999999709 ms | 402 ms | 421.1999999999971 ms |
| `exam-arranger` | 29.19999999999709 ms | 348 ms | 377.1999999999971 ms |
| `cohort-growth` | 16.60000000000582 ms | 329 ms | 345.6000000000058 ms |
| `progress-analysis` | 70.29999999998836 ms | 221 ms | 291.29999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `007fef382fcd` | 21776 ms | 2140 ms | 1066 ms | 0 | 70 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
