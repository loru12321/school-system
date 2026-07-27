# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `dc0b5cffc357`
- Recorded at: 2026-07-27T03:15:05.862Z
- Total smoke time: 31988 ms (+3080 ms vs previous)
- Login: 6463 ms
- App ready: 91 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 28.30000000000291 ms | 2099 ms | 2127.300000000003 ms |
| `teacher-township-ranking` | 2.900000000008731 ms | 2022 ms | 2024.9000000000087 ms |
| `teacher-analysis` | 41.39999999999418 ms | 1947 ms | 1988.3999999999942 ms |
| `teacher-detail-comparison` | 10 ms | 1720 ms | 1730 ms |
| `report-generator` | 11.599999999991269 ms | 912 ms | 923.5999999999913 ms |
| `student-overview` | 33.19999999999709 ms | 610 ms | 643.1999999999971 ms |
| `analysis` | 7.399999999994179 ms | 621 ms | 628.3999999999942 ms |
| `subject-balance` | 41.69999999999709 ms | 584 ms | 625.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `dc0b5cffc357` | 31988 ms | 6463 ms | 91 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
