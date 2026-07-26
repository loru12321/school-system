# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c2f1b337914f`
- Recorded at: 2026-07-26T09:07:40.054Z
- Total smoke time: 24104 ms (-9049 ms vs previous)
- Login: 4542 ms
- App ready: 6 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 18.30000000000291 ms | 1665 ms | 1683.300000000003 ms |
| `teacher-detail-comparison` | 25.69999999999709 ms | 1280 ms | 1305.699999999997 ms |
| `teacher-analysis` | 40 ms | 1157 ms | 1197 ms |
| `report-generator` | 9.5 ms | 632 ms | 641.5 ms |
| `student-overview` | 19.09999999999127 ms | 525 ms | 544.0999999999913 ms |
| `analysis` | 10.80000000000291 ms | 516 ms | 526.8000000000029 ms |
| `teacher-township-ranking` | 5 ms | 491 ms | 496 ms |
| `correlation-analysis` | 30.69999999999709 ms | 437 ms | 467.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `0a00c3cea83d` | 29310 ms | 6515 ms | 6 ms | 0 | 0 | 0 |
| `e1e116ff08eb` | 30135 ms | 7121 ms | 73 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
