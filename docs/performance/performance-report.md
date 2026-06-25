# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `573a59c12100`
- Recorded at: 2026-06-25T08:11:23.387Z
- Total smoke time: 37551 ms (-32722 ms vs previous)
- Login: 3090 ms
- App ready: 3943 ms
- Long tasks: 1, max 873 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `upload` | 1863 ms | 2 ms | 1865 ms |
| `indicator` | 574 ms | 1068 ms | 1642 ms |
| `cohort-growth` | 519 ms | 760 ms | 1279 ms |
| `county-analysis` | 507 ms | 592 ms | 1099 ms |
| `summary` | 535 ms | 505 ms | 1040 ms |
| `student-overview` | 530 ms | 506 ms | 1036 ms |
| `grade-scheduler` | 533 ms | 374 ms | 907 ms |
| `starter-hub` | 899 ms | 4 ms | 903 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `573a59c12100` | 37551 ms | 3090 ms | 3943 ms | 1 | 0 | 0 |
| `9ce791464039` | 70273 ms | 19624 ms | 4906 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
