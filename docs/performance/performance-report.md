# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0a00c3cea83d`
- Recorded at: 2026-07-26T00:03:05.753Z
- Total smoke time: 29310 ms (-825 ms vs previous)
- Login: 6515 ms
- App ready: 6 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 69.19999999999709 ms | 1783 ms | 1852.199999999997 ms |
| `seat-adjustment` | 59.60000000000582 ms | 949 ms | 1008.6000000000058 ms |
| `teacher-township-ranking` | 3.099999999991269 ms | 858 ms | 861.0999999999913 ms |
| `report-generator` | 12.39999999999418 ms | 704 ms | 716.3999999999942 ms |
| `analysis` | 8.19999999999709 ms | 604 ms | 612.1999999999971 ms |
| `student-overview` | 32.40000000000873 ms | 544 ms | 576.4000000000087 ms |
| `subject-balance` | 35.69999999999709 ms | 523 ms | 558.6999999999971 ms |
| `indicator` | 27.60000000000582 ms | 468 ms | 495.6000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `0a00c3cea83d` | 29310 ms | 6515 ms | 6 ms | 0 | 0 | 0 |
| `e1e116ff08eb` | 30135 ms | 7121 ms | 73 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
