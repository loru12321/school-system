# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b70aeb427c61`
- Recorded at: 2026-08-10T10:22:21.449Z
- Total smoke time: 24160 ms (-2899 ms vs previous)
- Login: 4036 ms
- App ready: 14 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 51, max end-to-end 205.4 ms, max derived network wait 8.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 13.5 ms | 936 ms | 949.5 ms |
| `progress-analysis` | 55.90000000000873 ms | 734 ms | 789.9000000000087 ms |
| `grade-scheduler` | 22.30000000000291 ms | 698 ms | 720.3000000000029 ms |
| `student-overview` | 27.70000000001164 ms | 582 ms | 609.7000000000116 ms |
| `teacher-township-ranking` | 6.30000000000291 ms | 536 ms | 542.3000000000029 ms |
| `subject-balance` | 35.79999999998836 ms | 417 ms | 452.79999999998836 ms |
| `freshman-simulator` | 55.80000000000291 ms | 396 ms | 451.8000000000029 ms |
| `cohort-growth` | 39 ms | 355 ms | 394 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `2e91afdaeb53` | 24479 ms | 4766 ms | 4 ms | 0 | 55 | 0 | 0 |
| `1c5505435dcc` | 26971 ms | 7403 ms | 20 ms | 0 | 52 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
