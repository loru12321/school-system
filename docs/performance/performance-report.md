# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `05caed724bbf`
- Recorded at: 2026-08-28T05:53:04.204Z
- Total smoke time: 22933 ms (+991 ms vs previous)
- Login: 5395 ms
- App ready: 1217 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 41.4 ms, max derived network wait 6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 25.79999999998836 ms | 646 ms | 671.7999999999884 ms |
| `student-overview` | 32 ms | 472 ms | 504 ms |
| `cohort-growth` | 14.799999999988358 ms | 435 ms | 449.79999999998836 ms |
| `subject-balance` | 30.70000000001164 ms | 353 ms | 383.70000000001164 ms |
| `freshman-simulator` | 52.5 ms | 319 ms | 371.5 ms |
| `exam-arranger` | 12.799999999988358 ms | 341 ms | 353.79999999998836 ms |
| `report-generator` | 19 ms | 312 ms | 331 ms |
| `correlation-analysis` | 15.5 ms | 174 ms | 189.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `36715d0e02bb` | 23359 ms | 5297 ms | 1155 ms | 0 | 61 | 0 | 0 |
| `720b88242911` | 20692 ms | 3219 ms | 2031 ms | 0 | 70 | 0 | 0 |
| `442b642f6b04` | 20992 ms | 2960 ms | 1033 ms | 0 | 73 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
