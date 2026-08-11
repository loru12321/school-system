# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `df408db5e1df`
- Recorded at: 2026-08-11T02:35:58.681Z
- Total smoke time: 24457 ms (-4966 ms vs previous)
- Login: 4236 ms
- App ready: 351 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 405.1 ms, max derived network wait 8.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 10.5 ms | 900 ms | 910.5 ms |
| `grade-scheduler` | 22 ms | 728 ms | 750 ms |
| `student-overview` | 32.10000000000582 ms | 626 ms | 658.1000000000058 ms |
| `progress-analysis` | 48.80000000000291 ms | 509 ms | 557.8000000000029 ms |
| `teacher-township-ranking` | 2.6999999999970896 ms | 545 ms | 547.6999999999971 ms |
| `subject-balance` | 33.29999999998836 ms | 423 ms | 456.29999999998836 ms |
| `cohort-growth` | 26.79999999998836 ms | 352 ms | 378.79999999998836 ms |
| `teacher-analysis` | 62.80000000000291 ms | 309 ms | 371.8000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `df408db5e1df` | 24457 ms | 4236 ms | 351 ms | 0 | 65 | 0 | 0 |
| `bb2717062748` | 29423 ms | 3500 ms | 11 ms | 0 | 58 | 0 | 0 |
| `e62c6fb95614` | 29905 ms | 3822 ms | 367 ms | 0 | 59 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
