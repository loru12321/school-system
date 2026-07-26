# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `bd59bf00f838`
- Recorded at: 2026-07-26T00:15:26.122Z
- Total smoke time: 21755 ms (-7555 ms vs previous)
- Login: 4683 ms
- App ready: 5 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-detail-comparison` | 3.8999999999941792 ms | 1742 ms | 1745.8999999999942 ms |
| `indicator` | 33.19999999999709 ms | 1293 ms | 1326.199999999997 ms |
| `teacher-analysis` | 36 ms | 970 ms | 1006 ms |
| `teacher-township-ranking` | 3.3999999999941792 ms | 725 ms | 728.3999999999942 ms |
| `report-generator` | 9.5 ms | 623 ms | 632.5 ms |
| `student-overview` | 27.39999999999418 ms | 512 ms | 539.3999999999942 ms |
| `subject-balance` | 27.69999999999709 ms | 414 ms | 441.6999999999971 ms |
| `progress-analysis` | 22.19999999999709 ms | 412 ms | 434.1999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `bd59bf00f838` | 21755 ms | 4683 ms | 5 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
