# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `07f3ba6894ee`
- Recorded at: 2026-06-25T14:56:46.341Z
- Total smoke time: 31911 ms (-7266 ms vs previous)
- Login: 2165 ms
- App ready: 3066 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `summary` | 536 ms | 466 ms | 1002 ms |
| `student-overview` | 513 ms | 474 ms | 987 ms |
| `cohort-growth` | 524 ms | 450 ms | 974 ms |
| `grade-scheduler` | 523 ms | 371 ms | 894 ms |
| `exam-arranger` | 519 ms | 334 ms | 853 ms |
| `freshman-simulator` | 522 ms | 300 ms | 822 ms |
| `county-analysis` | 504 ms | 298 ms | 802 ms |
| `starter-hub` | 797 ms | 3 ms | 800 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `07f3ba6894ee` | 31911 ms | 2165 ms | 3066 ms | 0 | 0 | 0 |
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
