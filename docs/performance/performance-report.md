# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c1f08c558b65`
- Recorded at: 2026-08-26T08:51:19.928Z
- Total smoke time: 19971 ms (-1295 ms vs previous)
- Login: 3230 ms
- App ready: 1081 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 75, max end-to-end 126.3 ms, max derived network wait 6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 20.300000000017462 ms | 620 ms | 640.3000000000175 ms |
| `freshman-simulator` | 44.20000000001164 ms | 562 ms | 606.2000000000116 ms |
| `student-overview` | 26.10000000000582 ms | 472 ms | 498.1000000000058 ms |
| `exam-arranger` | 1.2000000000116415 ms | 335 ms | 336.20000000001164 ms |
| `report-generator` | 12 ms | 320 ms | 332 ms |
| `cohort-growth` | 12.900000000023283 ms | 307 ms | 319.9000000000233 ms |
| `subject-balance` | 29.39999999999418 ms | 284 ms | 313.3999999999942 ms |
| `teacher-analysis` | 56.10000000000582 ms | 154 ms | 210.10000000000582 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `c1f08c558b65` | 19971 ms | 3230 ms | 1081 ms | 0 | 75 | 0 | 0 |
| `23bde74614a1` | 21266 ms | 2695 ms | 1060 ms | 0 | 67 | 0 | 0 |
| `941f70ec4ea3` | 22865 ms | 2736 ms | 1007 ms | 0 | 71 | 0 | 0 |
| `d85c088806a1` | 22437 ms | 3805 ms | 1069 ms | 0 | 65 | 0 | 0 |
| `09740b80861e` | 21584 ms | 2936 ms | 1126 ms | 0 | 68 | 0 | 0 |
| `0a0b9e86965c` | 20173 ms | 2300 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `3d47796de14e` | 19288 ms | 2670 ms | 1005 ms | 0 | 69 | 0 | 0 |
| `898ea89eb8ca` | 20831 ms | 2941 ms | 1022 ms | 0 | 74 | 0 | 0 |
| `4dcc9214f763` | 20617 ms | 2446 ms | 1020 ms | 0 | 67 | 0 | 0 |
| `3a0b38029e08` | 21868 ms | 2732 ms | 1030 ms | 0 | 69 | 0 | 0 |
| `8c9d54cfbb32` | 21488 ms | 2803 ms | 1041 ms | 0 | 69 | 0 | 0 |
| `3329a0445fb8` | 21854 ms | 3706 ms | 1006 ms | 0 | 69 | 0 | 0 |
| `ead744659d2d` | 20857 ms | 2515 ms | 1040 ms | 0 | 70 | 0 | 0 |
| `94729a67d133` | 21768 ms | 2207 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `cbaa222490aa` | 18970 ms | 2666 ms | 1023 ms | 0 | 73 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
