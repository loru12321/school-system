# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `de23ed56d79c`
- Recorded at: 2026-07-27T01:19:25.460Z
- Total smoke time: 30589 ms (+3144 ms vs previous)
- Login: 6983 ms
- App ready: 13 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 32.70000000001164 ms | 2261 ms | 2293.7000000000116 ms |
| `teacher-township-ranking` | 3 ms | 2193 ms | 2196 ms |
| `teacher-analysis` | 45.5 ms | 2028 ms | 2073.5 ms |
| `report-generator` | 15.099999999976717 ms | 920 ms | 935.0999999999767 ms |
| `student-overview` | 35.60000000000582 ms | 663 ms | 698.6000000000058 ms |
| `analysis` | 7.800000000017462 ms | 612 ms | 619.8000000000175 ms |
| `subject-balance` | 37.60000000000582 ms | 582 ms | 619.6000000000058 ms |
| `progress-analysis` | 62.70000000001164 ms | 534 ms | 596.7000000000116 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `de23ed56d79c` | 30589 ms | 6983 ms | 13 ms | 0 | 0 | 0 |
| `8b6eb86719e6` | 27445 ms | 5963 ms | 66 ms | 0 | 0 | 0 |
| `9358cfabb063` | 30992 ms | 7511 ms | 107 ms | 0 | 0 | 0 |
| `c022fbf2822a` | 25030 ms | 5110 ms | 5 ms | 0 | 0 | 0 |
| `1b49a6a14474` | 30849 ms | 5486 ms | 192 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
