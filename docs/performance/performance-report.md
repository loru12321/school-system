# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `9ce791464039`
- Recorded at: 2026-05-20T08:21:06.084Z
- Total smoke time: 70273 ms 
- Login: 19624 ms
- App ready: 4906 ms
- Long tasks: 2, max 1274 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 547 ms | 5282 ms | 5829 ms |
| `starter-hub` | 4465 ms | 2 ms | 4467 ms |
| `student-overview` | 518 ms | 2076 ms | 2594 ms |
| `upload` | 1816 ms | 232 ms | 2048 ms |
| `student-details` | 2012 ms | 3 ms | 2015 ms |
| `progress-analysis` | 1578 ms | 57 ms | 1635 ms |
| `analysis` | 583 ms | 1034 ms | 1617 ms |
| `indicator` | 591 ms | 925 ms | 1516 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `9ce791464039` | 70273 ms | 19624 ms | 4906 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
