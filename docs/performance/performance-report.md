# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `9ab4e8d35c22`
- Recorded at: 2026-07-25T00:24:15.206Z
- Total smoke time: 29182 ms (-1516 ms vs previous)
- Login: 6795 ms
- App ready: 14 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `county-teacher-portrait` | 19 ms | 2265 ms | 2284 ms |
| `teacher-analysis` | 51.80000000000291 ms | 1921 ms | 1972.800000000003 ms |
| `teacher-township-ranking` | 5.5 ms | 1070 ms | 1075.5 ms |
| `seat-adjustment` | 67.40000000000873 ms | 986 ms | 1053.4000000000087 ms |
| `progress-analysis` | 70.80000000000291 ms | 816 ms | 886.8000000000029 ms |
| `report-generator` | 15.60000000000582 ms | 808 ms | 823.6000000000058 ms |
| `correlation-analysis` | 22.80000000000291 ms | 661 ms | 683.8000000000029 ms |
| `indicator` | 33.69999999999709 ms | 643 ms | 676.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `9ab4e8d35c22` | 29182 ms | 6795 ms | 14 ms | 0 | 0 | 0 |
| `b8b77268bd25` | 30698 ms | 8016 ms | 80 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
