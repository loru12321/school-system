# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `377bd75aa185`
- Recorded at: 2026-08-09T13:18:02.769Z
- Total smoke time: 26693 ms (+974 ms vs previous)
- Login: 4618 ms
- App ready: 36 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 51, max end-to-end 260 ms, max derived network wait 10.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 15.100000000034925 ms | 966 ms | 981.1000000000349 ms |
| `grade-scheduler` | 27.399999999965075 ms | 779 ms | 806.3999999999651 ms |
| `student-overview` | 33.5 ms | 630 ms | 663.5 ms |
| `teacher-township-ranking` | 2.7000000000116415 ms | 616 ms | 618.7000000000116 ms |
| `subject-balance` | 37.399999999965075 ms | 487 ms | 524.3999999999651 ms |
| `teacher-analysis` | 41.800000000046566 ms | 467 ms | 508.80000000004657 ms |
| `analysis` | 92.79999999998836 ms | 374 ms | 466.79999999998836 ms |
| `progress-analysis` | 75.89999999996508 ms | 341 ms | 416.8999999999651 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `377bd75aa185` | 26693 ms | 4618 ms | 36 ms | 0 | 51 | 0 | 0 |
| `b4533fb916e8` | 25719 ms | 4502 ms | 360 ms | 0 | 55 | 0 | 0 |
| `fab511e08ba8` | 27437 ms | 7899 ms | 3 ms | 0 | 52 | 0 | 0 |
| `232760539451` | 25118 ms | 4847 ms | 8 ms | 0 | 52 | 0 | 0 |
| `49fec8c21072` | 25713 ms | 4832 ms | 45 ms | 0 | 52 | 0 | 0 |
| `755442d252bd` | 25467 ms | 4815 ms | 3 ms | 0 | 50 | 0 | 0 |
| `dff221e6c627` | 22536 ms | 3240 ms | 3 ms | 0 | 48 | 0 | 0 |
| `e00fc5099dfa` | 21713 ms | 3699 ms | 16 ms | 0 | 54 | 0 | 0 |
| `1f135b2caae4` | 25404 ms | 5125 ms | 13 ms | 0 | 51 | 0 | 0 |
| `eb593c740fa7` | 29262 ms | 9712 ms | 4 ms | 0 | 56 | 0 | 0 |
| `2e91afdaeb53` | 24479 ms | 4766 ms | 4 ms | 0 | 55 | 0 | 0 |
| `1c5505435dcc` | 26971 ms | 7403 ms | 20 ms | 0 | 52 | 0 | 0 |
| `2615a828f476` | 26982 ms | 5743 ms | 18 ms | 0 | 58 | 0 | 0 |
| `ce19da531240` | 27074 ms | 7971 ms | 3 ms | 0 | 50 | 0 | 0 |
| `10e5632247a0` | 25552 ms | 5106 ms | 357 ms | 0 | 50 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
