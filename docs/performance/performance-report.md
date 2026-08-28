# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d9771d5f5f24`
- Recorded at: 2026-08-28T08:35:09.649Z
- Total smoke time: 20921 ms (-191 ms vs previous)
- Login: 2881 ms
- App ready: 1015 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 61, max end-to-end 205.2 ms, max derived network wait 6.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 32.10000000000582 ms | 640 ms | 672.1000000000058 ms |
| `freshman-simulator` | 74.69999999999709 ms | 449 ms | 523.6999999999971 ms |
| `student-overview` | 33.80000000001746 ms | 489 ms | 522.8000000000175 ms |
| `subject-balance` | 37.30000000000291 ms | 432 ms | 469.3000000000029 ms |
| `report-generator` | 17.89999999999418 ms | 363 ms | 380.8999999999942 ms |
| `cohort-growth` | 17.29999999998836 ms | 350 ms | 367.29999999998836 ms |
| `exam-arranger` | 1.0999999999912689 ms | 339 ms | 340.09999999999127 ms |
| `progress-analysis` | 50.5 ms | 192 ms | 242.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `d9771d5f5f24` | 20921 ms | 2881 ms | 1015 ms | 0 | 61 | 0 | 0 |
| `d6709b910875` | 21112 ms | 2436 ms | 1075 ms | 0 | 61 | 0 | 0 |
| `2bce27eb8e65` | 21295 ms | 2944 ms | 1008 ms | 0 | 62 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
