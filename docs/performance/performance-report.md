# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `58e25cc1f1c5`
- Recorded at: 2026-07-26T12:22:02.698Z
- Total smoke time: 31227 ms (+898 ms vs previous)
- Login: 8622 ms
- App ready: 3 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 26.39999999999418 ms | 2035 ms | 2061.399999999994 ms |
| `high-score` | 5.80000000000291 ms | 1810 ms | 1815.800000000003 ms |
| `teacher-analysis` | 55.40000000000873 ms | 1511 ms | 1566.4000000000087 ms |
| `teacher-township-ranking` | 2.6999999999970896 ms | 794 ms | 796.6999999999971 ms |
| `report-generator` | 12.5 ms | 747 ms | 759.5 ms |
| `progress-analysis` | 74 ms | 595 ms | 669 ms |
| `analysis` | 7.19999999999709 ms | 607 ms | 614.1999999999971 ms |
| `student-overview` | 34.39999999999418 ms | 553 ms | 587.3999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `4f463a542e02` | 30609 ms | 8174 ms | 70 ms | 0 | 0 | 0 |
| `960fb517b18f` | 31355 ms | 7124 ms | 9 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
