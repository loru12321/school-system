# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b5a37d968000`
- Recorded at: 2026-08-28T03:37:21.166Z
- Total smoke time: 21238 ms (-856 ms vs previous)
- Login: 2234 ms
- App ready: 1067 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 193.5 ms, max derived network wait 7.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 34.90000000000873 ms | 737 ms | 771.9000000000087 ms |
| `student-overview` | 37.30000000000291 ms | 533 ms | 570.3000000000029 ms |
| `subject-balance` | 41.19999999999709 ms | 509 ms | 550.1999999999971 ms |
| `freshman-simulator` | 75.60000000000582 ms | 468 ms | 543.6000000000058 ms |
| `report-generator` | 19.19999999999709 ms | 405 ms | 424.1999999999971 ms |
| `cohort-growth` | 17.09999999999127 ms | 365 ms | 382.09999999999127 ms |
| `exam-arranger` | 0.8999999999941792 ms | 352 ms | 352.8999999999942 ms |
| `progress-analysis` | 82.39999999999418 ms | 215 ms | 297.3999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `788ff298770b` | 21417 ms | 2486 ms | 1010 ms | 0 | 66 | 0 | 0 |
| `24444a7b7015` | 20865 ms | 2485 ms | 1083 ms | 0 | 66 | 0 | 0 |
| `fec8eff5a795` | 21919 ms | 2857 ms | 1199 ms | 0 | 64 | 0 | 0 |
| `1c9630f19fd5` | 24534 ms | 5681 ms | 1026 ms | 0 | 65 | 0 | 0 |
| `e519139087c7` | 22248 ms | 2417 ms | 1165 ms | 0 | 63 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
