# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `dcf381a87ded`
- Recorded at: 2026-06-25T08:27:36.675Z
- Total smoke time: 38076 ms (+525 ms vs previous)
- Login: 3180 ms
- App ready: 4448 ms
- Long tasks: 1, max 854 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `summary` | 535 ms | 1139 ms | 1674 ms |
| `indicator` | 588 ms | 1038 ms | 1626 ms |
| `cohort-growth` | 518 ms | 657 ms | 1175 ms |
| `upload` | 1130 ms | 3 ms | 1133 ms |
| `county-analysis` | 506 ms | 613 ms | 1119 ms |
| `student-overview` | 543 ms | 504 ms | 1047 ms |
| `potential-analysis` | 911 ms | 0 ms | 911 ms |
| `starter-hub` | 902 ms | 4 ms | 906 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `dcf381a87ded` | 38076 ms | 3180 ms | 4448 ms | 1 | 0 | 0 |
| `573a59c12100` | 37551 ms | 3090 ms | 3943 ms | 1 | 0 | 0 |
| `9ce791464039` | 70273 ms | 19624 ms | 4906 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
