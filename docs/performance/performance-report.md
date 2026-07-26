# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f1fcb0e99f93`
- Recorded at: 2026-07-26T12:08:22.596Z
- Total smoke time: 30329 ms (-571 ms vs previous)
- Login: 8146 ms
- App ready: 3 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 24.5 ms | 1992 ms | 2016.5 ms |
| `data-quality` | 9.800000000017462 ms | 1685 ms | 1694.8000000000175 ms |
| `teacher-analysis` | 50.20000000001164 ms | 1361 ms | 1411.2000000000116 ms |
| `starter-hub` | 3.7000000000116415 ms | 1002 ms | 1005.7000000000116 ms |
| `report-generator` | 12.89999999999418 ms | 787 ms | 799.8999999999942 ms |
| `progress-analysis` | 54.80000000001746 ms | 645 ms | 699.8000000000175 ms |
| `student-overview` | 38.5 ms | 586 ms | 624.5 ms |
| `analysis` | 11.5 ms | 576 ms | 587.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `f6d952ccdba1` | 30652 ms | 7980 ms | 84 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
