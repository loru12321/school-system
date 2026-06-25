# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `858703653c40`
- Recorded at: 2026-06-25T11:51:14.420Z
- Total smoke time: 37407 ms (+320 ms vs previous)
- Login: 3162 ms
- App ready: 4729 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `marginal-push` | 538 ms | 722 ms | 1260 ms |
| `cohort-growth` | 559 ms | 647 ms | 1206 ms |
| `upload` | 1085 ms | 4 ms | 1089 ms |
| `student-overview` | 532 ms | 554 ms | 1086 ms |
| `county-analysis` | 505 ms | 530 ms | 1035 ms |
| `summary` | 536 ms | 491 ms | 1027 ms |
| `potential-analysis` | 1023 ms | 0 ms | 1023 ms |
| `report-generator` | 518 ms | 422 ms | 940 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
