# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `bf6748f3d345`
- Recorded at: 2026-07-27T08:38:01.249Z
- Total smoke time: 30720 ms (+5362 ms vs previous)
- Login: 6019 ms
- App ready: 110 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 37.40000000000873 ms | 2315 ms | 2352.4000000000087 ms |
| `teacher-analysis` | 41 ms | 1903 ms | 1944 ms |
| `report-generator` | 14.19999999999709 ms | 838 ms | 852.1999999999971 ms |
| `teacher-township-ranking` | 2.6999999999970896 ms | 733 ms | 735.6999999999971 ms |
| `student-overview` | 37.39999999999418 ms | 617 ms | 654.3999999999942 ms |
| `analysis` | 5.900000000008731 ms | 584 ms | 589.9000000000087 ms |
| `subject-balance` | 35.30000000000291 ms | 499 ms | 534.3000000000029 ms |
| `freshman-simulator` | 46 ms | 395 ms | 441 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `58e25cc1f1c5` | 31227 ms | 8622 ms | 3 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
