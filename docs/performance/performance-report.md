# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c79a68fffdba`
- Recorded at: 2026-07-28T16:20:29.327Z
- Total smoke time: 27800 ms (+1642 ms vs previous)
- Login: 6812 ms
- App ready: 17 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 48.30000000000291 ms | 749 ms | 797.3000000000029 ms |
| `report-generator` | 16.79999999998836 ms | 657 ms | 673.7999999999884 ms |
| `student-overview` | 23.29999999998836 ms | 617 ms | 640.2999999999884 ms |
| `subject-balance` | 39.40000000000873 ms | 558 ms | 597.4000000000087 ms |
| `freshman-simulator` | 97.39999999999418 ms | 493 ms | 590.3999999999942 ms |
| `teacher-township-ranking` | 2.3999999999941792 ms | 485 ms | 487.3999999999942 ms |
| `grade-scheduler` | 27.19999999999709 ms | 386 ms | 413.1999999999971 ms |
| `cohort-growth` | 9.10000000000582 ms | 354 ms | 363.1000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `c79a68fffdba` | 27800 ms | 6812 ms | 17 ms | 0 | 0 | 0 |
| `9a881a1275e8` | 26158 ms | 4225 ms | 4 ms | 0 | 0 | 0 |
| `12a006cb7712` | 27592 ms | 5519 ms | 18 ms | 0 | 0 | 0 |
| `53422df1149f` | 27059 ms | 4906 ms | 349 ms | 0 | 0 | 0 |
| `bb6db0dddc6e` | 25272 ms | 5201 ms | 20 ms | 0 | 0 | 0 |
| `dfc2e6d479be` | 24205 ms | 4813 ms | 12 ms | 0 | 0 | 0 |
| `d0755a9cf3cc` | 22818 ms | 4661 ms | 18 ms | 0 | 0 | 0 |
| `6d5c10e71888` | 25733 ms | 5326 ms | 353 ms | 0 | 0 | 0 |
| `71d42f773ada` | 24588 ms | 4670 ms | 41 ms | 0 | 0 | 0 |
| `6c6b7bd3d76a` | 25096 ms | 5014 ms | 17 ms | 0 | 0 | 0 |
| `41f24f60531e` | 31204 ms | 5790 ms | 203 ms | 0 | 0 | 0 |
| `e88b660de44c` | 29430 ms | 6133 ms | 86 ms | 0 | 0 | 0 |
| `a95a5b1bb7c3` | 31530 ms | 7359 ms | 116 ms | 0 | 0 | 0 |
| `21af61136c7e` | 22857 ms | 4577 ms | 128 ms | 0 | 0 | 0 |
| `d0a432c00594` | 30684 ms | 6080 ms | 14 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
