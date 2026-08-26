# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d85c088806a1`
- Recorded at: 2026-08-26T07:32:22.625Z
- Total smoke time: 22437 ms (+853 ms vs previous)
- Login: 3805 ms
- App ready: 1069 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 65.1 ms, max derived network wait 6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 33.80000000001746 ms | 694 ms | 727.8000000000175 ms |
| `student-overview` | 42.10000000000582 ms | 486 ms | 528.1000000000058 ms |
| `subject-balance` | 49.39999999999418 ms | 461 ms | 510.3999999999942 ms |
| `freshman-simulator` | 60.40000000002328 ms | 376 ms | 436.4000000000233 ms |
| `report-generator` | 15.299999999988358 ms | 381 ms | 396.29999999998836 ms |
| `exam-arranger` | 14.10000000000582 ms | 360 ms | 374.1000000000058 ms |
| `cohort-growth` | 17.900000000023283 ms | 321 ms | 338.9000000000233 ms |
| `teacher-analysis` | 42.30000000001746 ms | 201 ms | 243.30000000001746 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `c7d1cf5eea79` | 18768 ms | 2280 ms | 1007 ms | 0 | 70 | 0 | 0 |
| `dd63dd8aec68` | 21531 ms | 2352 ms | 1005 ms | 0 | 66 | 0 | 0 |
| `d465f6f96d3d` | 18373 ms | 2244 ms | 1003 ms | 0 | 62 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
