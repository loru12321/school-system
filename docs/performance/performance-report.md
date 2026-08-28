# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `fdf7e2b152a8`
- Recorded at: 2026-08-28T07:45:10.994Z
- Total smoke time: 21015 ms (-804 ms vs previous)
- Login: 2591 ms
- App ready: 1023 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 64, max end-to-end 197.8 ms, max derived network wait 14.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 58.60000000000582 ms | 692 ms | 750.6000000000058 ms |
| `student-overview` | 47.10000000000582 ms | 514 ms | 561.1000000000058 ms |
| `subject-balance` | 61.39999999999418 ms | 442 ms | 503.3999999999942 ms |
| `freshman-simulator` | 58.70000000001164 ms | 432 ms | 490.70000000001164 ms |
| `report-generator` | 16.89999999999418 ms | 377 ms | 393.8999999999942 ms |
| `exam-arranger` | 1.1999999999825377 ms | 338 ms | 339.19999999998254 ms |
| `cohort-growth` | 17.699999999982538 ms | 315 ms | 332.69999999998254 ms |
| `teacher-analysis` | 41.79999999998836 ms | 198 ms | 239.79999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fdf7e2b152a8` | 21015 ms | 2591 ms | 1023 ms | 0 | 64 | 0 | 0 |
| `14b76c7c11fc` | 21819 ms | 2294 ms | 1012 ms | 0 | 59 | 0 | 0 |
| `abed8b54cf3c` | 21900 ms | 2870 ms | 1057 ms | 0 | 61 | 0 | 0 |
| `b2a35275df1e` | 21391 ms | 2637 ms | 1005 ms | 0 | 63 | 0 | 0 |
| `b22ff9c5bce2` | 20816 ms | 2476 ms | 1026 ms | 0 | 63 | 0 | 0 |
| `c67a6c0d9cb1` | 21126 ms | 2231 ms | 1007 ms | 0 | 62 | 0 | 0 |
| `05caed724bbf` | 22933 ms | 5395 ms | 1217 ms | 0 | 62 | 0 | 0 |
| `60ecfdb43703` | 21942 ms | 2905 ms | 1154 ms | 0 | 57 | 0 | 0 |
| `a595157f11ed` | 22255 ms | 3130 ms | 1022 ms | 0 | 71 | 0 | 0 |
| `427a63462f51` | 21375 ms | 4908 ms | 1091 ms | 0 | 65 | 0 | 0 |
| `e316f2adaa20` | 23204 ms | 5935 ms | 8 ms | 0 | 61 | 0 | 0 |
| `3f32d1630b91` | 22970 ms | 3949 ms | 1058 ms | 0 | 69 | 0 | 0 |
| `bab17a6797de` | 21124 ms | 2960 ms | 1027 ms | 0 | 63 | 0 | 0 |
| `e4acb94961bc` | 22567 ms | 2447 ms | 2012 ms | 0 | 74 | 0 | 0 |
| `b5a37d968000` | 21238 ms | 2234 ms | 1067 ms | 0 | 70 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
