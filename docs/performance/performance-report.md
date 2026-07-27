# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f6ff2ecbac8f`
- Recorded at: 2026-07-27T02:44:51.009Z
- Total smoke time: 28908 ms (-1260 ms vs previous)
- Login: 6381 ms
- App ready: 7 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 20.19999999999709 ms | 2030 ms | 2050.199999999997 ms |
| `teacher-analysis` | 50.60000000000582 ms | 1482 ms | 1532.6000000000058 ms |
| `report-generator` | 17.30000000000291 ms | 779 ms | 796.3000000000029 ms |
| `student-overview` | 38.5 ms | 605 ms | 643.5 ms |
| `subject-balance` | 29.10000000000582 ms | 536 ms | 565.1000000000058 ms |
| `analysis` | 6.399999999994179 ms | 530 ms | 536.3999999999942 ms |
| `freshman-simulator` | 50.10000000000582 ms | 448 ms | 498.1000000000058 ms |
| `teacher-township-ranking` | 4.599999999991269 ms | 480 ms | 484.59999999999127 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `f6ff2ecbac8f` | 28908 ms | 6381 ms | 7 ms | 0 | 0 | 0 |
| `825f817158ce` | 30168 ms | 6859 ms | 11 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
