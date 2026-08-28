# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b2a35275df1e`
- Recorded at: 2026-08-28T06:41:42.012Z
- Total smoke time: 21391 ms (+575 ms vs previous)
- Login: 2637 ms
- App ready: 1005 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 63, max end-to-end 195.4 ms, max derived network wait 5.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 35.80000000000291 ms | 694 ms | 729.8000000000029 ms |
| `student-overview` | 43.59999999999127 ms | 526 ms | 569.5999999999913 ms |
| `subject-balance` | 41.80000000000291 ms | 505 ms | 546.8000000000029 ms |
| `report-generator` | 21.10000000000582 ms | 402 ms | 423.1000000000058 ms |
| `freshman-simulator` | 87.69999999999709 ms | 309 ms | 396.6999999999971 ms |
| `cohort-growth` | 19.80000000000291 ms | 361 ms | 380.8000000000029 ms |
| `exam-arranger` | 0.8999999999941792 ms | 348 ms | 348.8999999999942 ms |
| `teacher-township-ranking` | 10.400000000008731 ms | 233 ms | 243.40000000000873 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `57a81a74f43a` | 22094 ms | 3726 ms | 1011 ms | 0 | 62 | 0 | 0 |
| `23e50869c1ae` | 23382 ms | 4214 ms | 2276 ms | 0 | 65 | 0 | 0 |
| `67239e3ccaba` | 20372 ms | 2326 ms | 1010 ms | 0 | 68 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
