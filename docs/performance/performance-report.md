# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `427a63462f51`
- Recorded at: 2026-08-28T04:51:17.655Z
- Total smoke time: 21375 ms (-1829 ms vs previous)
- Login: 4908 ms
- App ready: 1091 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 117.4 ms, max derived network wait 5.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 20.80000000000291 ms | 635 ms | 655.8000000000029 ms |
| `student-overview` | 25.09999999999127 ms | 464 ms | 489.09999999999127 ms |
| `exam-arranger` | 11.10000000000582 ms | 336 ms | 347.1000000000058 ms |
| `cohort-growth` | 17.5 ms | 314 ms | 331.5 ms |
| `freshman-simulator` | 49.69999999999709 ms | 271 ms | 320.6999999999971 ms |
| `report-generator` | 13 ms | 295 ms | 308 ms |
| `subject-balance` | 24.30000000000291 ms | 239 ms | 263.3000000000029 ms |
| `correlation-analysis` | 13.30000000000291 ms | 183 ms | 196.3000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `6d146183edd1` | 21686 ms | 2945 ms | 1269 ms | 0 | 74 | 0 | 0 |
| `fbf66250f89e` | 20490 ms | 3697 ms | 1040 ms | 0 | 73 | 0 | 0 |
| `b6fcf0384f4a` | 20972 ms | 3072 ms | 1618 ms | 0 | 72 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
