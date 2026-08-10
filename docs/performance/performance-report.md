# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7d4a5e69aca7`
- Recorded at: 2026-08-10T11:15:48.744Z
- Total smoke time: 24730 ms (+45 ms vs previous)
- Login: 3194 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 56, max end-to-end 215.2 ms, max derived network wait 12.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 51 ms | 703 ms | 754 ms |
| `grade-scheduler` | 25.5 ms | 673 ms | 698.5 ms |
| `report-generator` | 12.5 ms | 629 ms | 641.5 ms |
| `student-overview` | 34.30000000000291 ms | 580 ms | 614.3000000000029 ms |
| `teacher-township-ranking` | 4.100000000005821 ms | 519 ms | 523.1000000000058 ms |
| `subject-balance` | 26 ms | 425 ms | 451 ms |
| `freshman-simulator` | 49.59999999999127 ms | 399 ms | 448.59999999999127 ms |
| `teacher-analysis` | 59.5 ms | 337 ms | 396.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `eb593c740fa7` | 29262 ms | 9712 ms | 4 ms | 0 | 56 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
