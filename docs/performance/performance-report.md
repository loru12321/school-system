# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c67a6c0d9cb1`
- Recorded at: 2026-08-28T06:06:10.570Z
- Total smoke time: 21126 ms (-1807 ms vs previous)
- Login: 2231 ms
- App ready: 1007 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 196.8 ms, max derived network wait 8.8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 34.09999999997672 ms | 671 ms | 705.0999999999767 ms |
| `student-overview` | 46.600000000034925 ms | 507 ms | 553.6000000000349 ms |
| `freshman-simulator` | 64.30000000004657 ms | 398 ms | 462.30000000004657 ms |
| `subject-balance` | 44.20000000001164 ms | 406 ms | 450.20000000001164 ms |
| `report-generator` | 16.599999999976717 ms | 404 ms | 420.5999999999767 ms |
| `cohort-growth` | 18.900000000023283 ms | 400 ms | 418.9000000000233 ms |
| `exam-arranger` | 18.099999999976717 ms | 350 ms | 368.0999999999767 ms |
| `progress-analysis` | 74 ms | 191 ms | 265 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `36715d0e02bb` | 23359 ms | 5297 ms | 1155 ms | 0 | 61 | 0 | 0 |
| `720b88242911` | 20692 ms | 3219 ms | 2031 ms | 0 | 70 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
