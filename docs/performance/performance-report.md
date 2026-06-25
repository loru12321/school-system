# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f180afc06cb0`
- Recorded at: 2026-06-25T08:55:42.978Z
- Total smoke time: 38716 ms (+640 ms vs previous)
- Login: 3261 ms
- App ready: 4667 ms
- Long tasks: 1, max 898 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 552 ms | 1090 ms | 1642 ms |
| `cohort-growth` | 631 ms | 652 ms | 1283 ms |
| `marginal-push` | 556 ms | 715 ms | 1271 ms |
| `student-overview` | 527 ms | 575 ms | 1102 ms |
| `upload` | 1079 ms | 3 ms | 1082 ms |
| `summary` | 554 ms | 516 ms | 1070 ms |
| `county-analysis` | 506 ms | 556 ms | 1062 ms |
| `starter-hub` | 962 ms | 7 ms | 969 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `f180afc06cb0` | 38716 ms | 3261 ms | 4667 ms | 1 | 0 | 0 |
| `dcf381a87ded` | 38076 ms | 3180 ms | 4448 ms | 1 | 0 | 0 |
| `573a59c12100` | 37551 ms | 3090 ms | 3943 ms | 1 | 0 | 0 |
| `9ce791464039` | 70273 ms | 19624 ms | 4906 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
