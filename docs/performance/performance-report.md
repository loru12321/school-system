# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0cdc386e7827`
- Recorded at: 2026-07-07T00:42:28.977Z
- Total smoke time: 36669 ms (+6110 ms vs previous)
- Login: 7965 ms
- App ready: 1949 ms
- Long tasks: 1, max 1039 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `audio-debug` | 2855 ms | 0 ms | 2855 ms |
| `cohort-growth` | 233 ms | 1792 ms | 2025 ms |
| `summary` | 218 ms | 1078 ms | 1296 ms |
| `student-overview` | 282 ms | 549 ms | 831 ms |
| `report-generator` | 227 ms | 436 ms | 663 ms |
| `teacher-detail-comparison` | 204 ms | 455 ms | 659 ms |
| `grade-scheduler` | 216 ms | 382 ms | 598 ms |
| `county-teacher-portrait` | 196 ms | 394 ms | 590 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `0cdc386e7827` | 36669 ms | 7965 ms | 1949 ms | 1 | 0 | 0 |
| `ccf3f665a827` | 30559 ms | 4548 ms | 1431 ms | 1 | 0 | 0 |
| `a84ca19c7209` | 39350 ms | 5378 ms | 88 ms | 3 | 0 | 0 |
| `8ef50e018fac` | 40300 ms | 7127 ms | 112 ms | 2 | 0 | 0 |
| `2bf506d67cd0` | 33347 ms | 6011 ms | 287 ms | 2 | 0 | 0 |
| `5a9857e87f96` | 37512 ms | 6402 ms | 1751 ms | 3 | 0 | 0 |
| `a62195f6d66e` | 39555 ms | 6134 ms | 1766 ms | 2 | 0 | 0 |
| `4cb8efd48e2c` | 47926 ms | 7105 ms | 1010 ms | 2 | 0 | 0 |
| `e243403c151b` | 38006 ms | 6604 ms | 111 ms | 3 | 0 | 0 |
| `43959e6993a3` | 35229 ms | 6041 ms | 1613 ms | 2 | 0 | 0 |
| `8855664a28f9` | 39667 ms | 3878 ms | 2322 ms | 2 | 0 | 0 |
| `5a4e643fc778` | 41261 ms | 4499 ms | 2625 ms | 2 | 0 | 0 |
| `6f694388ccbb` | 38530 ms | 6132 ms | 6 ms | 2 | 0 | 0 |
| `29426047563b` | 38268 ms | 6203 ms | 8 ms | 2 | 0 | 0 |
| `44605c44bfd8` | 38915 ms | 6854 ms | 4 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
