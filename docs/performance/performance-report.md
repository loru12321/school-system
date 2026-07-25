# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `9c7dbbf5a641`
- Recorded at: 2026-07-25T01:42:48.737Z
- Total smoke time: 31630 ms (+102 ms vs previous)
- Login: 7574 ms
- App ready: 5 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 41.89999999999418 ms | 2086 ms | 2127.899999999994 ms |
| `progress-analysis` | 35.69999999998254 ms | 1023 ms | 1058.6999999999825 ms |
| `report-generator` | 15.199999999982538 ms | 1039 ms | 1054.1999999999825 ms |
| `teacher-township-ranking` | 9 ms | 1004 ms | 1013 ms |
| `seat-adjustment` | 35.59999999997672 ms | 903 ms | 938.5999999999767 ms |
| `indicator` | 30.5 ms | 654 ms | 684.5 ms |
| `analysis` | 7.30000000000291 ms | 627 ms | 634.3000000000029 ms |
| `potential-analysis` | 27.20000000001164 ms | 576 ms | 603.2000000000116 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `9c7dbbf5a641` | 31630 ms | 7574 ms | 5 ms | 0 | 0 | 0 |
| `a6abb59bb458` | 31528 ms | 7879 ms | 84 ms | 0 | 0 | 0 |
| `0d2d9d06ff27` | 31579 ms | 7042 ms | 4 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
