# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b1b8693a8230`
- Recorded at: 2026-06-26T00:02:14.426Z
- Total smoke time: 31634 ms (-1168 ms vs previous)
- Login: 2371 ms
- App ready: 2011 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 645 ms | 496 ms | 1141 ms |
| `summary` | 551 ms | 496 ms | 1047 ms |
| `student-overview` | 548 ms | 476 ms | 1024 ms |
| `potential-analysis` | 956 ms | 0 ms | 956 ms |
| `seat-adjustment` | 644 ms | 309 ms | 953 ms |
| `grade-scheduler` | 530 ms | 377 ms | 907 ms |
| `freshman-simulator` | 539 ms | 361 ms | 900 ms |
| `exam-arranger` | 529 ms | 345 ms | 874 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `b1b8693a8230` | 31634 ms | 2371 ms | 2011 ms | 0 | 0 | 0 |
| `682103a73ee1` | 32802 ms | 3705 ms | 2129 ms | 0 | 0 | 0 |
| `99531e601775` | 32409 ms | 2796 ms | 2207 ms | 0 | 0 | 0 |
| `db221177bb7e` | 32858 ms | 3834 ms | 2334 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
