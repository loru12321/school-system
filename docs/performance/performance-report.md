# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ee8f156a0b48`
- Recorded at: 2026-08-27T10:40:52.364Z
- Total smoke time: 21539 ms (+136 ms vs previous)
- Login: 4201 ms
- App ready: 1005 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 67, max end-to-end 126.2 ms, max derived network wait 5.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 29 ms | 651 ms | 680 ms |
| `student-overview` | 28.60000000000582 ms | 470 ms | 498.6000000000058 ms |
| `freshman-simulator` | 46.89999999999418 ms | 376 ms | 422.8999999999942 ms |
| `exam-arranger` | 11.799999999988358 ms | 341 ms | 352.79999999998836 ms |
| `subject-balance` | 26.39999999999418 ms | 313 ms | 339.3999999999942 ms |
| `cohort-growth` | 17.5 ms | 313 ms | 330.5 ms |
| `report-generator` | 14.799999999988358 ms | 314 ms | 328.79999999998836 ms |
| `seat-adjustment` | 284 ms | 37 ms | 321 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `898ea89eb8ca` | 20831 ms | 2941 ms | 1022 ms | 0 | 74 | 0 | 0 |
| `4dcc9214f763` | 20617 ms | 2446 ms | 1020 ms | 0 | 67 | 0 | 0 |
| `3a0b38029e08` | 21868 ms | 2732 ms | 1030 ms | 0 | 69 | 0 | 0 |
| `8c9d54cfbb32` | 21488 ms | 2803 ms | 1041 ms | 0 | 69 | 0 | 0 |
| `3329a0445fb8` | 21854 ms | 3706 ms | 1006 ms | 0 | 69 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
