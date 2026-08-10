# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `adade4a9461a`
- Recorded at: 2026-08-10T23:52:31.403Z
- Total smoke time: 26404 ms (+1018 ms vs previous)
- Login: 4925 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 48, max end-to-end 222.6 ms, max derived network wait 10.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 58.19999999998254 ms | 990 ms | 1048.1999999999825 ms |
| `grade-scheduler` | 32.20000000001164 ms | 729 ms | 761.2000000000116 ms |
| `report-generator` | 16.5 ms | 680 ms | 696.5 ms |
| `student-overview` | 26 ms | 632 ms | 658 ms |
| `subject-balance` | 38.60000000000582 ms | 532 ms | 570.6000000000058 ms |
| `freshman-simulator` | 72.79999999998836 ms | 473 ms | 545.7999999999884 ms |
| `teacher-township-ranking` | 3.1999999999825377 ms | 517 ms | 520.1999999999825 ms |
| `cohort-growth` | 20.099999999976717 ms | 436 ms | 456.0999999999767 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `adade4a9461a` | 26404 ms | 4925 ms | 3 ms | 0 | 48 | 0 | 0 |
| `9d26ba4b5d52` | 25386 ms | 6131 ms | 17 ms | 0 | 54 | 0 | 0 |
| `e79a53175bfe` | 26355 ms | 4657 ms | 8 ms | 0 | 50 | 0 | 0 |
| `7d4a5e69aca7` | 24730 ms | 3194 ms | 4 ms | 0 | 56 | 0 | 0 |
| `ba4249944228` | 24685 ms | 4281 ms | 5 ms | 0 | 42 | 0 | 0 |
| `b70aeb427c61` | 24160 ms | 4036 ms | 14 ms | 0 | 51 | 0 | 0 |
| `18285911066e` | 27059 ms | 5838 ms | 11 ms | 0 | 55 | 0 | 0 |
| `d4cebb5220bc` | 26985 ms | 5855 ms | 18 ms | 0 | 47 | 0 | 0 |
| `377bd75aa185` | 26693 ms | 4618 ms | 36 ms | 0 | 51 | 0 | 0 |
| `b4533fb916e8` | 25719 ms | 4502 ms | 360 ms | 0 | 55 | 0 | 0 |
| `fab511e08ba8` | 27437 ms | 7899 ms | 3 ms | 0 | 52 | 0 | 0 |
| `232760539451` | 25118 ms | 4847 ms | 8 ms | 0 | 52 | 0 | 0 |
| `49fec8c21072` | 25713 ms | 4832 ms | 45 ms | 0 | 52 | 0 | 0 |
| `755442d252bd` | 25467 ms | 4815 ms | 3 ms | 0 | 50 | 0 | 0 |
| `dff221e6c627` | 22536 ms | 3240 ms | 3 ms | 0 | 48 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
