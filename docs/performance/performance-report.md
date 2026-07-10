# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `a8ab26ea2c8a`
- Recorded at: 2026-07-10T03:14:51.511Z
- Total smoke time: 36569 ms (-1689 ms vs previous)
- Login: 6219 ms
- App ready: 95 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `student-details` | 40 ms | 3849 ms | 3889 ms |
| `analysis` | 1999 ms | 1389 ms | 3388 ms |
| `cohort-growth` | 249 ms | 1132 ms | 1381 ms |
| `starter-hub` | 1092 ms | 10 ms | 1102 ms |
| `report-generator` | 355 ms | 645 ms | 1000 ms |
| `teacher-detail-comparison` | 617 ms | 197 ms | 814 ms |
| `high-score` | 287 ms | 516 ms | 803 ms |
| `county-teacher-portrait` | 401 ms | 393 ms | 794 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `a8ab26ea2c8a` | 36569 ms | 6219 ms | 95 ms | 0 | 0 | 0 |
| `89dd62893206` | 38258 ms | 7353 ms | 13 ms | 0 | 0 | 0 |
| `c2428cef67cb` | 35896 ms | 6907 ms | 39 ms | 0 | 0 | 0 |
| `eb2485edbcc1` | 39998 ms | 8312 ms | 336 ms | 0 | 0 | 0 |
| `7c951f6db428` | 38533 ms | 7454 ms | 335 ms | 0 | 0 | 0 |
| `d060942e4922` | 37997 ms | 6192 ms | 806 ms | 0 | 0 | 0 |
| `1290e3f6c556` | 38562 ms | 9821 ms | 87 ms | 0 | 0 | 0 |
| `e4de46f5002e` | 37658 ms | 6855 ms | 895 ms | 0 | 0 | 0 |
| `520364d4c1d0` | 27796 ms | 4240 ms | 57 ms | 0 | 0 | 0 |
| `4d6638892a9c` | 25441 ms | 4014 ms | 5 ms | 0 | 0 | 0 |
| `6aee08772fa3` | 47157 ms | 14844 ms | 944 ms | 0 | 0 | 0 |
| `61329cbea8e0` | 37883 ms | 7102 ms | 250 ms | 0 | 0 | 0 |
| `cf64a1c2a6f4` | 32482 ms | 5051 ms | 46 ms | 0 | 0 | 0 |
| `85686924c2ac` | 38201 ms | 6204 ms | 100 ms | 0 | 0 | 0 |
| `b9a2366a7fe3` | 33679 ms | 6766 ms | 125 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
