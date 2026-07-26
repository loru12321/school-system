# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `33d86b0cc9ce`
- Recorded at: 2026-07-26T13:44:08.919Z
- Total smoke time: 26294 ms (-5255 ms vs previous)
- Login: 6146 ms
- App ready: 11 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 35.10000000000582 ms | 1607 ms | 1642.1000000000058 ms |
| `seat-adjustment` | 85.39999999999418 ms | 767 ms | 852.3999999999942 ms |
| `starter-hub` | 2.6999999999970896 ms | 795 ms | 797.6999999999971 ms |
| `report-generator` | 9.69999999999709 ms | 593 ms | 602.6999999999971 ms |
| `progress-analysis` | 23.90000000000873 ms | 561 ms | 584.9000000000087 ms |
| `student-overview` | 21.30000000000291 ms | 560 ms | 581.3000000000029 ms |
| `teacher-township-ranking` | 2.8000000000029104 ms | 512 ms | 514.8000000000029 ms |
| `analysis` | 8.200000000011642 ms | 461 ms | 469.20000000001164 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `33d86b0cc9ce` | 26294 ms | 6146 ms | 11 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
