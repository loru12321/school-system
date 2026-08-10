# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `e79a53175bfe`
- Recorded at: 2026-08-10T11:38:05.116Z
- Total smoke time: 26355 ms (+1625 ms vs previous)
- Login: 4657 ms
- App ready: 8 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 50, max end-to-end 203.1 ms, max derived network wait 11.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 19.80000000000291 ms | 1040 ms | 1059.800000000003 ms |
| `progress-analysis` | 75 ms | 792 ms | 867 ms |
| `grade-scheduler` | 23 ms | 718 ms | 741 ms |
| `student-overview` | 36.30000000000291 ms | 646 ms | 682.3000000000029 ms |
| `teacher-township-ranking` | 6.099999999991269 ms | 545 ms | 551.0999999999913 ms |
| `subject-balance` | 35.80000000000291 ms | 481 ms | 516.8000000000029 ms |
| `teacher-analysis` | 58.89999999999418 ms | 377 ms | 435.8999999999942 ms |
| `cohort-growth` | 14.30000000000291 ms | 405 ms | 419.3000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `e00fc5099dfa` | 21713 ms | 3699 ms | 16 ms | 0 | 54 | 0 | 0 |
| `1f135b2caae4` | 25404 ms | 5125 ms | 13 ms | 0 | 51 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
