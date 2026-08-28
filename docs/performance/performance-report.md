# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `67239e3ccaba`
- Recorded at: 2026-08-28T02:41:01.385Z
- Total smoke time: 20372 ms (-2987 ms vs previous)
- Login: 2326 ms
- App ready: 1010 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 68, max end-to-end 189.6 ms, max derived network wait 5.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 30.699999999953434 ms | 706 ms | 736.6999999999534 ms |
| `student-overview` | 50 ms | 479 ms | 529 ms |
| `freshman-simulator` | 60.800000000046566 ms | 427 ms | 487.80000000004657 ms |
| `subject-balance` | 42 ms | 371 ms | 413 ms |
| `report-generator` | 18.099999999976717 ms | 367 ms | 385.0999999999767 ms |
| `exam-arranger` | 15.400000000023283 ms | 342 ms | 357.4000000000233 ms |
| `cohort-growth` | 23 ms | 314 ms | 337 ms |
| `teacher-analysis` | 36.90000000002328 ms | 206 ms | 242.90000000002328 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `f06e638e85c1` | 21466 ms | 3152 ms | 1012 ms | 0 | 73 | 0 | 0 |
| `2ff81fee0d40` | 21463 ms | 4297 ms | 1007 ms | 0 | 73 | 0 | 0 |
| `0584365ea6f9` | 21948 ms | 4792 ms | 1013 ms | 0 | 72 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
