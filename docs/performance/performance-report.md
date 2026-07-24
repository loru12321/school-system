# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `dbceb8746f0d`
- Recorded at: 2026-07-24T10:28:57.369Z
- Total smoke time: 28182 ms (-2671 ms vs previous)
- Login: 5754 ms
- App ready: 6 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `county-teacher-portrait` | 16.100000000034925 ms | 2204 ms | 2220.100000000035 ms |
| `teacher-analysis` | 98.59999999997672 ms | 1648 ms | 1746.5999999999767 ms |
| `teacher-township-ranking` | 2.400000000023283 ms | 1212 ms | 1214.4000000000233 ms |
| `report-generator` | 13.299999999988358 ms | 877 ms | 890.2999999999884 ms |
| `correlation-analysis` | 9.900000000023283 ms | 671 ms | 680.9000000000233 ms |
| `progress-analysis` | 45.90000000002328 ms | 625 ms | 670.9000000000233 ms |
| `analysis` | 16.20000000001164 ms | 635 ms | 651.2000000000116 ms |
| `indicator` | 25.5 ms | 594 ms | 619.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `dbceb8746f0d` | 28182 ms | 5754 ms | 6 ms | 0 | 0 | 0 |
| `d16f1fd3c474` | 30853 ms | 9809 ms | 120 ms | 0 | 0 | 0 |
| `6b76655ad4a2` | 25467 ms | 5370 ms | 125 ms | 0 | 0 | 0 |
| `4e6c824f4658` | 29720 ms | 6336 ms | 8 ms | 0 | 0 | 0 |
| `c416523e8ac8` | 32726 ms | 6799 ms | 10 ms | 0 | 0 | 0 |
| `fcce7d0df097` | 31115 ms | 6417 ms | 49 ms | 0 | 0 | 0 |
| `3586c77e396e` | 32669 ms | 6867 ms | 84 ms | 0 | 0 | 0 |
| `6806ed45609c` | 29309 ms | 5816 ms | 10 ms | 0 | 0 | 0 |
| `c3026831b94c` | 31941 ms | 6989 ms | 9 ms | 0 | 0 | 0 |
| `532a3b830020` | 34301 ms | 7057 ms | 10 ms | 0 | 0 | 0 |
| `c3d020f3c49c` | 25258 ms | 4723 ms | 60 ms | 0 | 0 | 0 |
| `6d54d4f51ae6` | 28811 ms | 6389 ms | 5 ms | 0 | 0 | 0 |
| `33bd40e8566b` | 28333 ms | 7952 ms | 8 ms | 0 | 0 | 0 |
| `9a34eefffe30` | 28656 ms | 6392 ms | 6 ms | 0 | 0 | 0 |
| `fd6de82dbe00` | 23306 ms | 4573 ms | 56 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
