# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `720b88242911`
- Recorded at: 2026-08-28T02:30:04.817Z
- Total smoke time: 20692 ms (-300 ms vs previous)
- Login: 3219 ms
- App ready: 2031 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 66.2 ms, max derived network wait 15.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 24.30000000000291 ms | 652 ms | 676.3000000000029 ms |
| `student-overview` | 28.60000000000582 ms | 467 ms | 495.6000000000058 ms |
| `exam-arranger` | 12.69999999999709 ms | 343 ms | 355.6999999999971 ms |
| `freshman-simulator` | 55.79999999998836 ms | 295 ms | 350.79999999998836 ms |
| `cohort-growth` | 13.299999999988358 ms | 321 ms | 334.29999999998836 ms |
| `report-generator` | 15.900000000008731 ms | 313 ms | 328.90000000000873 ms |
| `subject-balance` | 26.69999999999709 ms | 277 ms | 303.6999999999971 ms |
| `progress-analysis` | 47.30000000000291 ms | 171 ms | 218.3000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `f06e638e85c1` | 21466 ms | 3152 ms | 1012 ms | 0 | 73 | 0 | 0 |
| `2ff81fee0d40` | 21463 ms | 4297 ms | 1007 ms | 0 | 73 | 0 | 0 |
| `0584365ea6f9` | 21948 ms | 4792 ms | 1013 ms | 0 | 72 | 0 | 0 |
| `9f0de5d1e372` | 19121 ms | 2534 ms | 1008 ms | 0 | 69 | 0 | 0 |
| `7dfdf2de331f` | 21569 ms | 3028 ms | 1016 ms | 0 | 66 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
