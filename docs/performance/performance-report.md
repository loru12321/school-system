# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0d58d0beb4d4`
- Recorded at: 2026-07-26T03:46:35.773Z
- Total smoke time: 31133 ms (-2397 ms vs previous)
- Login: 7115 ms
- App ready: 4 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 50.79999999998836 ms | 1954 ms | 2004.7999999999884 ms |
| `teacher-detail-comparison` | 4.5 ms | 1995 ms | 1999.5 ms |
| `teacher-township-ranking` | 4.5 ms | 1897 ms | 1901.5 ms |
| `seat-adjustment` | 52.10000000000582 ms | 821 ms | 873.1000000000058 ms |
| `progress-analysis` | 51.20000000001164 ms | 770 ms | 821.2000000000116 ms |
| `report-generator` | 13.699999999982538 ms | 712 ms | 725.6999999999825 ms |
| `student-overview` | 25.29999999998836 ms | 603 ms | 628.2999999999884 ms |
| `analysis` | 9 ms | 586 ms | 595 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `0d58d0beb4d4` | 31133 ms | 7115 ms | 4 ms | 0 | 0 | 0 |
| `7c80807fa81e` | 33530 ms | 7063 ms | 3 ms | 0 | 0 | 0 |
| `39c1a4829c06` | 24789 ms | 4950 ms | 5 ms | 0 | 0 | 0 |
| `8f533534eb80` | 30217 ms | 7436 ms | 5 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
