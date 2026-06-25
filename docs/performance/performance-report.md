# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `e75cf9a41b3b`
- Recorded at: 2026-06-25T09:26:56.754Z
- Total smoke time: 37087 ms (-1629 ms vs previous)
- Login: 2460 ms
- App ready: 4438 ms
- Long tasks: 1, max 949 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `bottom3` | 520 ms | 914 ms | 1434 ms |
| `cohort-growth` | 533 ms | 762 ms | 1295 ms |
| `upload` | 1088 ms | 189 ms | 1277 ms |
| `county-analysis` | 506 ms | 643 ms | 1149 ms |
| `student-overview` | 550 ms | 502 ms | 1052 ms |
| `summary` | 537 ms | 496 ms | 1033 ms |
| `starter-hub` | 922 ms | 5 ms | 927 ms |
| `grade-scheduler` | 541 ms | 374 ms | 915 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `e75cf9a41b3b` | 37087 ms | 2460 ms | 4438 ms | 1 | 0 | 0 |
| `f180afc06cb0` | 38716 ms | 3261 ms | 4667 ms | 1 | 0 | 0 |
| `dcf381a87ded` | 38076 ms | 3180 ms | 4448 ms | 1 | 0 | 0 |
| `573a59c12100` | 37551 ms | 3090 ms | 3943 ms | 1 | 0 | 0 |
| `9ce791464039` | 70273 ms | 19624 ms | 4906 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
