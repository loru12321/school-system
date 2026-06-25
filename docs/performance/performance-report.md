# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `cd6382c07ed7`
- Recorded at: 2026-06-25T12:32:22.999Z
- Total smoke time: 36774 ms (-633 ms vs previous)
- Login: 2673 ms
- App ready: 3772 ms
- Long tasks: 1, max 855 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `upload` | 1847 ms | 2 ms | 1849 ms |
| `indicator` | 580 ms | 1058 ms | 1638 ms |
| `cohort-growth` | 554 ms | 660 ms | 1214 ms |
| `county-analysis` | 508 ms | 581 ms | 1089 ms |
| `student-overview` | 528 ms | 538 ms | 1066 ms |
| `summary` | 534 ms | 505 ms | 1039 ms |
| `potential-analysis` | 908 ms | 0 ms | 908 ms |
| `grade-scheduler` | 530 ms | 374 ms | 904 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
