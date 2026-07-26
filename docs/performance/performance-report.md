# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `9c6715d4a475`
- Recorded at: 2026-07-26T02:06:16.178Z
- Total smoke time: 32206 ms (+1597 ms vs previous)
- Login: 7369 ms
- App ready: 5 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 47.40000000000873 ms | 2123 ms | 2170.4000000000087 ms |
| `county-teacher-portrait` | 17 ms | 2054 ms | 2071 ms |
| `teacher-township-ranking` | 2.7999999999883585 ms | 2068 ms | 2070.7999999999884 ms |
| `seat-adjustment` | 65.80000000000291 ms | 914 ms | 979.8000000000029 ms |
| `report-generator` | 13 ms | 762 ms | 775 ms |
| `analysis` | 11.69999999999709 ms | 627 ms | 638.6999999999971 ms |
| `student-overview` | 24.80000000000291 ms | 568 ms | 592.8000000000029 ms |
| `progress-analysis` | 37.09999999999127 ms | 513 ms | 550.0999999999913 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `9c6715d4a475` | 32206 ms | 7369 ms | 5 ms | 0 | 0 | 0 |
| `4f463a542e02` | 30609 ms | 8174 ms | 70 ms | 0 | 0 | 0 |
| `960fb517b18f` | 31355 ms | 7124 ms | 9 ms | 0 | 0 | 0 |
| `f6d952ccdba1` | 30652 ms | 7980 ms | 84 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
