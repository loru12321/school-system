# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `e6ec2d0e1222`
- Recorded at: 2026-07-26T13:22:46.567Z
- Total smoke time: 31549 ms (+1392 ms vs previous)
- Login: 8583 ms
- App ready: 4 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 24.10000000000582 ms | 2218 ms | 2242.100000000006 ms |
| `teacher-analysis` | 51.19999999999709 ms | 1775 ms | 1826.199999999997 ms |
| `teacher-township-ranking` | 5.900000000008731 ms | 885 ms | 890.9000000000087 ms |
| `report-generator` | 11.60000000000582 ms | 743 ms | 754.6000000000058 ms |
| `analysis` | 10.89999999999418 ms | 599 ms | 609.8999999999942 ms |
| `progress-analysis` | 39.10000000000582 ms | 560 ms | 599.1000000000058 ms |
| `student-overview` | 24.10000000000582 ms | 557 ms | 581.1000000000058 ms |
| `subject-balance` | 28.80000000000291 ms | 462 ms | 490.8000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `e6ec2d0e1222` | 31549 ms | 8583 ms | 4 ms | 0 | 0 | 0 |
| `51a5f224ba1d` | 30157 ms | 7927 ms | 5 ms | 0 | 0 | 0 |
| `58e25cc1f1c5` | 31227 ms | 8622 ms | 3 ms | 0 | 0 | 0 |
| `f1fcb0e99f93` | 30329 ms | 8146 ms | 3 ms | 0 | 0 | 0 |
| `3b0a3ddff687` | 30900 ms | 7452 ms | 7 ms | 0 | 0 | 0 |
| `846ddaa117ca` | 30990 ms | 7057 ms | 4 ms | 0 | 0 | 0 |
| `c2f1b337914f` | 24104 ms | 4542 ms | 6 ms | 0 | 0 | 0 |
| `f1e095df659a` | 33153 ms | 8109 ms | 6 ms | 0 | 0 | 0 |
| `8e63c614161d` | 32288 ms | 7533 ms | 8 ms | 0 | 0 | 0 |
| `5138f729213a` | 29754 ms | 6657 ms | 7 ms | 0 | 0 | 0 |
| `0d58d0beb4d4` | 31133 ms | 7115 ms | 4 ms | 0 | 0 | 0 |
| `7c80807fa81e` | 33530 ms | 7063 ms | 3 ms | 0 | 0 | 0 |
| `39c1a4829c06` | 24789 ms | 4950 ms | 5 ms | 0 | 0 | 0 |
| `8f533534eb80` | 30217 ms | 7436 ms | 5 ms | 0 | 0 | 0 |
| `9c6715d4a475` | 32206 ms | 7369 ms | 5 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
