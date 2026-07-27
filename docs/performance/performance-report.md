# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `a674b8c17958`
- Recorded at: 2026-07-27T09:10:43.331Z
- Total smoke time: 30795 ms (+75 ms vs previous)
- Login: 7538 ms
- App ready: 188 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 27.30000000000291 ms | 2136 ms | 2163.300000000003 ms |
| `teacher-analysis` | 51.59999999999127 ms | 1395 ms | 1446.5999999999913 ms |
| `report-generator` | 14 ms | 888 ms | 902 ms |
| `teacher-township-ranking` | 2.1999999999970896 ms | 727 ms | 729.1999999999971 ms |
| `student-overview` | 35.39999999999418 ms | 649 ms | 684.3999999999942 ms |
| `subject-balance` | 31.70000000001164 ms | 588 ms | 619.7000000000116 ms |
| `progress-analysis` | 53.79999999998836 ms | 543 ms | 596.7999999999884 ms |
| `analysis` | 8.900000000008731 ms | 584 ms | 592.9000000000087 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `a674b8c17958` | 30795 ms | 7538 ms | 188 ms | 0 | 0 | 0 |
| `bf6748f3d345` | 30720 ms | 6019 ms | 110 ms | 0 | 0 | 0 |
| `f9c9672712db` | 25358 ms | 5448 ms | 11 ms | 0 | 0 | 0 |
| `5c53c94df346` | 31935 ms | 6683 ms | 11 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
