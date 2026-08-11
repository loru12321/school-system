# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `721a51c8d56e`
- Recorded at: 2026-08-11T05:44:52.243Z
- Total smoke time: 20885 ms (-3812 ms vs previous)
- Login: 4700 ms
- App ready: 8 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 69, max end-to-end 153 ms, max derived network wait 8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 23.099999999976717 ms | 685 ms | 708.0999999999767 ms |
| `student-overview` | 24.300000000017462 ms | 479 ms | 503.30000000001746 ms |
| `subject-balance` | 25.300000000017462 ms | 401 ms | 426.30000000001746 ms |
| `freshman-simulator` | 35.39999999999418 ms | 385 ms | 420.3999999999942 ms |
| `report-generator` | 12.400000000023283 ms | 391 ms | 403.4000000000233 ms |
| `exam-arranger` | 6.300000000017462 ms | 346 ms | 352.30000000001746 ms |
| `cohort-growth` | 9.799999999988358 ms | 315 ms | 324.79999999998836 ms |
| `teacher-analysis` | 44.5 ms | 251 ms | 295.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `721a51c8d56e` | 20885 ms | 4700 ms | 8 ms | 0 | 69 | 0 | 0 |
| `e7f5c31e2ab0` | 24697 ms | 4949 ms | 12 ms | 0 | 66 | 0 | 0 |
| `d3a0e64607cf` | 22850 ms | 3202 ms | 3 ms | 0 | 70 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
