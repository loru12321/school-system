# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `898ea89eb8ca`
- Recorded at: 2026-08-25T05:45:11.141Z
- Total smoke time: 20831 ms (+214 ms vs previous)
- Login: 2941 ms
- App ready: 1022 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 74, max end-to-end 195.5 ms, max derived network wait 8.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 21.80000000000291 ms | 724 ms | 745.8000000000029 ms |
| `student-overview` | 34.20000000001164 ms | 483 ms | 517.2000000000116 ms |
| `subject-balance` | 26.60000000000582 ms | 427 ms | 453.6000000000058 ms |
| `report-generator` | 9.80000000000291 ms | 367 ms | 376.8000000000029 ms |
| `freshman-simulator` | 63.40000000000873 ms | 310 ms | 373.40000000000873 ms |
| `cohort-growth` | 11.099999999991269 ms | 338 ms | 349.09999999999127 ms |
| `exam-arranger` | 1.5 ms | 342 ms | 343.5 ms |
| `progress-analysis` | 52.69999999999709 ms | 190 ms | 242.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `7d22361ff97c` | 20727 ms | 2737 ms | 1062 ms | 0 | 67 | 0 | 0 |
| `adbdf7f5aa25` | 20297 ms | 2943 ms | 1031 ms | 0 | 65 | 0 | 0 |
| `555607b85f0d` | 19568 ms | 3102 ms | 1119 ms | 0 | 72 | 0 | 0 |
| `4516c36a30cc` | 20385 ms | 2791 ms | 1006 ms | 0 | 67 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
