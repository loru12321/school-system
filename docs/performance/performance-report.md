# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c38d91262d48`
- Recorded at: 2026-06-25T22:11:09.538Z
- Total smoke time: 37498 ms (-1291 ms vs previous)
- Login: 2728 ms
- App ready: 4462 ms
- Long tasks: 1, max 868 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `upload` | 1854 ms | 2 ms | 1856 ms |
| `indicator` | 578 ms | 1018 ms | 1596 ms |
| `cohort-growth` | 516 ms | 673 ms | 1189 ms |
| `county-analysis` | 508 ms | 651 ms | 1159 ms |
| `summary` | 532 ms | 504 ms | 1036 ms |
| `student-overview` | 522 ms | 504 ms | 1026 ms |
| `starter-hub` | 928 ms | 4 ms | 932 ms |
| `grade-scheduler` | 541 ms | 380 ms | 921 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `c38d91262d48` | 37498 ms | 2728 ms | 4462 ms | 1 | 0 | 0 |
| `a2ea0396e059` | 38789 ms | 2472 ms | 5704 ms | 0 | 0 | 0 |
| `d8ec5f5a0994` | 38556 ms | 3281 ms | 4620 ms | 1 | 0 | 0 |
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
