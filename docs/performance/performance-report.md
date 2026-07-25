# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0fe7fa926a35`
- Recorded at: 2026-07-25T23:12:38.779Z
- Total smoke time: 23913 ms (-7974 ms vs previous)
- Login: 5231 ms
- App ready: 75 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 22.09999999999127 ms | 1664 ms | 1686.0999999999913 ms |
| `teacher-township-ranking` | 2.3999999999941792 ms | 1565 ms | 1567.3999999999942 ms |
| `teacher-analysis` | 34.80000000000291 ms | 1078 ms | 1112.800000000003 ms |
| `report-generator` | 10.69999999999709 ms | 642 ms | 652.6999999999971 ms |
| `student-overview` | 17.69999999999709 ms | 537 ms | 554.6999999999971 ms |
| `subject-balance` | 32.89999999999418 ms | 437 ms | 469.8999999999942 ms |
| `analysis` | 5.5 ms | 463 ms | 468.5 ms |
| `correlation-analysis` | 19 ms | 414 ms | 433 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `0fe7fa926a35` | 23913 ms | 5231 ms | 75 ms | 0 | 0 | 0 |
| `d0efe509c86f` | 31887 ms | 6395 ms | 7 ms | 0 | 0 | 0 |
| `2bde8021c911` | 23831 ms | 4388 ms | 7 ms | 0 | 0 | 0 |
| `8ed5962b3ddb` | 23637 ms | 4787 ms | 3 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
