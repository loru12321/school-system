# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `3b0a3ddff687`
- Recorded at: 2026-07-26T11:54:48.959Z
- Total smoke time: 30900 ms (-90 ms vs previous)
- Login: 7452 ms
- App ready: 7 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 21.70000000001164 ms | 1922 ms | 1943.7000000000116 ms |
| `teacher-analysis` | 47.30000000000291 ms | 1858 ms | 1905.300000000003 ms |
| `teacher-pairing` | 2.3000000000029104 ms | 1371 ms | 1373.300000000003 ms |
| `report-generator` | 11.099999999991269 ms | 823 ms | 834.0999999999913 ms |
| `student-overview` | 25.80000000000291 ms | 648 ms | 673.8000000000029 ms |
| `progress-analysis` | 54.29999999998836 ms | 561 ms | 615.2999999999884 ms |
| `subject-balance` | 35.09999999999127 ms | 528 ms | 563.0999999999913 ms |
| `analysis` | 13.299999999988358 ms | 532 ms | 545.2999999999884 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `bd59bf00f838` | 21755 ms | 4683 ms | 5 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
