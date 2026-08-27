# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `012c524c58a2`
- Recorded at: 2026-08-27T09:33:57.188Z
- Total smoke time: 21403 ms (+1393 ms vs previous)
- Login: 2299 ms
- App ready: 1048 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 209.8 ms, max derived network wait 7.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 38.5 ms | 706 ms | 744.5 ms |
| `student-overview` | 41.19999999999709 ms | 523 ms | 564.1999999999971 ms |
| `subject-balance` | 40.40000000000873 ms | 480 ms | 520.4000000000087 ms |
| `report-generator` | 18.5 ms | 376 ms | 394.5 ms |
| `freshman-simulator` | 71.5 ms | 308 ms | 379.5 ms |
| `cohort-growth` | 15.5 ms | 341 ms | 356.5 ms |
| `exam-arranger` | 1 ms | 341 ms | 342 ms |
| `correlation-analysis` | 16.80000000000291 ms | 208 ms | 224.8000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `ead744659d2d` | 20857 ms | 2515 ms | 1040 ms | 0 | 70 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
