# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b88dd598e863`
- Recorded at: 2026-07-25T05:24:43.719Z
- Total smoke time: 31763 ms (+8358 ms vs previous)
- Login: 9080 ms
- App ready: 9 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 52.29999999998836 ms | 2061 ms | 2113.2999999999884 ms |
| `indicator` | 30.5 ms | 2009 ms | 2039.5 ms |
| `teacher-township-ranking` | 4.80000000000291 ms | 1789 ms | 1793.800000000003 ms |
| `report-generator` | 15.200000000011642 ms | 721 ms | 736.2000000000116 ms |
| `student-overview` | 49.40000000002328 ms | 622 ms | 671.4000000000233 ms |
| `subject-balance` | 39.5 ms | 563 ms | 602.5 ms |
| `analysis` | 9.5 ms | 578 ms | 587.5 ms |
| `progress-analysis` | 48 ms | 531 ms | 579 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `b88dd598e863` | 31763 ms | 9080 ms | 9 ms | 0 | 0 | 0 |
| `914e63a8fa20` | 23405 ms | 5016 ms | 11 ms | 0 | 0 | 0 |
| `6a6f74597c41` | 30458 ms | 7685 ms | 5 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
