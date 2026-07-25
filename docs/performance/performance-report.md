# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `2bde8021c911`
- Recorded at: 2026-07-25T10:49:30.756Z
- Total smoke time: 23831 ms (+194 ms vs previous)
- Login: 4388 ms
- App ready: 7 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 17.39999999999418 ms | 1592 ms | 1609.3999999999942 ms |
| `teacher-analysis` | 37.09999999999127 ms | 1480 ms | 1517.0999999999913 ms |
| `report-generator` | 12.89999999999418 ms | 586 ms | 598.8999999999942 ms |
| `analysis` | 4.900000000008731 ms | 534 ms | 538.9000000000087 ms |
| `student-overview` | 19 ms | 508 ms | 527 ms |
| `teacher-township-ranking` | 3 ms | 518 ms | 521 ms |
| `progress-analysis` | 41.80000000000291 ms | 415 ms | 456.8000000000029 ms |
| `subject-balance` | 25.10000000000582 ms | 371 ms | 396.1000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `4e6c824f4658` | 29720 ms | 6336 ms | 8 ms | 0 | 0 | 0 |
| `c416523e8ac8` | 32726 ms | 6799 ms | 10 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
