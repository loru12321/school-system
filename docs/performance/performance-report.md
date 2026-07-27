# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `825f817158ce`
- Recorded at: 2026-07-27T02:10:22.877Z
- Total smoke time: 30168 ms (-421 ms vs previous)
- Login: 6859 ms
- App ready: 11 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `seat-adjustment` | 45.40000000000873 ms | 1180 ms | 1225.4000000000087 ms |
| `teacher-township-ranking` | 3.3000000000029104 ms | 944 ms | 947.3000000000029 ms |
| `report-generator` | 16.60000000000582 ms | 897 ms | 913.6000000000058 ms |
| `progress-analysis` | 48.09999999999127 ms | 619 ms | 667.0999999999913 ms |
| `indicator` | 40 ms | 580 ms | 620 ms |
| `analysis` | 7.899999999994179 ms | 610 ms | 617.8999999999942 ms |
| `student-overview` | 31.60000000000582 ms | 561 ms | 592.6000000000058 ms |
| `subject-balance` | 33.79999999998836 ms | 434 ms | 467.79999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `f1e095df659a` | 33153 ms | 8109 ms | 6 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
