# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `20fe286b821b`
- Recorded at: 2026-08-27T11:32:40.840Z
- Total smoke time: 21408 ms (-1729 ms vs previous)
- Login: 3152 ms
- App ready: 1044 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 69, max end-to-end 68.4 ms, max derived network wait 5.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 28.69999999999709 ms | 674 ms | 702.6999999999971 ms |
| `student-overview` | 31.80000000000291 ms | 548 ms | 579.8000000000029 ms |
| `report-generator` | 17.30000000000291 ms | 384 ms | 401.3000000000029 ms |
| `subject-balance` | 32.89999999999418 ms | 349 ms | 381.8999999999942 ms |
| `freshman-simulator` | 61.39999999999418 ms | 309 ms | 370.3999999999942 ms |
| `exam-arranger` | 14.30000000000291 ms | 337 ms | 351.3000000000029 ms |
| `cohort-growth` | 17.69999999999709 ms | 330 ms | 347.6999999999971 ms |
| `teacher-analysis` | 52.5 ms | 180 ms | 232.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `20fe286b821b` | 21408 ms | 3152 ms | 1044 ms | 0 | 69 | 0 | 0 |
| `3ecd24b48bd4` | 23137 ms | 6247 ms | 1024 ms | 0 | 73 | 0 | 0 |
| `c3a1d4ab8cbc` | 22069 ms | 3823 ms | 1086 ms | 0 | 64 | 0 | 0 |
| `d490f413d304` | 19816 ms | 2748 ms | 1093 ms | 0 | 69 | 0 | 0 |
| `760ebff7a61e` | 19974 ms | 2702 ms | 1007 ms | 0 | 69 | 0 | 0 |
| `ee8f156a0b48` | 21539 ms | 4201 ms | 1005 ms | 0 | 67 | 0 | 0 |
| `012c524c58a2` | 21403 ms | 2299 ms | 1048 ms | 0 | 70 | 0 | 0 |
| `1a7c0f42fc8b` | 20010 ms | 3171 ms | 1010 ms | 0 | 68 | 0 | 0 |
| `c1f08c558b65` | 19971 ms | 3230 ms | 1081 ms | 0 | 75 | 0 | 0 |
| `23bde74614a1` | 21266 ms | 2695 ms | 1060 ms | 0 | 67 | 0 | 0 |
| `941f70ec4ea3` | 22865 ms | 2736 ms | 1007 ms | 0 | 71 | 0 | 0 |
| `d85c088806a1` | 22437 ms | 3805 ms | 1069 ms | 0 | 65 | 0 | 0 |
| `09740b80861e` | 21584 ms | 2936 ms | 1126 ms | 0 | 68 | 0 | 0 |
| `0a0b9e86965c` | 20173 ms | 2300 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `3d47796de14e` | 19288 ms | 2670 ms | 1005 ms | 0 | 69 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
