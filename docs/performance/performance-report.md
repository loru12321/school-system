# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `a2ea0396e059`
- Recorded at: 2026-06-25T15:26:38.850Z
- Total smoke time: 38789 ms (+233 ms vs previous)
- Login: 2472 ms
- App ready: 5704 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `summary` | 1125 ms | 523 ms | 1648 ms |
| `cohort-growth` | 545 ms | 934 ms | 1479 ms |
| `county-analysis` | 506 ms | 952 ms | 1458 ms |
| `upload` | 1072 ms | 3 ms | 1075 ms |
| `student-overview` | 523 ms | 542 ms | 1065 ms |
| `starter-hub` | 1056 ms | 3 ms | 1059 ms |
| `potential-analysis` | 990 ms | 0 ms | 990 ms |
| `report-generator` | 518 ms | 426 ms | 944 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
