# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b4c725678c08`
- Recorded at: 2026-06-25T12:54:49.090Z
- Total smoke time: 39177 ms (+2403 ms vs previous)
- Login: 3348 ms
- App ready: 5691 ms
- Long tasks: 1, max 961 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `marginal-push` | 532 ms | 805 ms | 1337 ms |
| `upload` | 1080 ms | 4 ms | 1084 ms |
| `cohort-growth` | 570 ms | 502 ms | 1072 ms |
| `summary` | 546 ms | 516 ms | 1062 ms |
| `county-analysis` | 506 ms | 538 ms | 1044 ms |
| `student-overview` | 526 ms | 506 ms | 1032 ms |
| `report-generator` | 522 ms | 467 ms | 989 ms |
| `starter-hub` | 965 ms | 3 ms | 968 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `b4c725678c08` | 39177 ms | 3348 ms | 5691 ms | 1 | 0 | 0 |
| `cd6382c07ed7` | 36774 ms | 2673 ms | 3772 ms | 1 | 0 | 0 |
| `858703653c40` | 37407 ms | 3162 ms | 4729 ms | 0 | 0 | 0 |
| `e75cf9a41b3b` | 37087 ms | 2460 ms | 4438 ms | 1 | 0 | 0 |
| `f180afc06cb0` | 38716 ms | 3261 ms | 4667 ms | 1 | 0 | 0 |
| `dcf381a87ded` | 38076 ms | 3180 ms | 4448 ms | 1 | 0 | 0 |
| `573a59c12100` | 37551 ms | 3090 ms | 3943 ms | 1 | 0 | 0 |
| `9ce791464039` | 70273 ms | 19624 ms | 4906 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
