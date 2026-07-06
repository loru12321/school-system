# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ccf3f665a827`
- Recorded at: 2026-07-06T16:27:44.284Z
- Total smoke time: 30559 ms (-8791 ms vs previous)
- Login: 4548 ms
- App ready: 1431 ms
- Long tasks: 1, max 813 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `summary` | 254 ms | 1461 ms | 1715 ms |
| `cohort-growth` | 295 ms | 1284 ms | 1579 ms |
| `report-generator` | 198 ms | 681 ms | 879 ms |
| `student-overview` | 203 ms | 577 ms | 780 ms |
| `progress-analysis` | 228 ms | 494 ms | 722 ms |
| `teacher-detail-comparison` | 203 ms | 454 ms | 657 ms |
| `grade-scheduler` | 201 ms | 400 ms | 601 ms |
| `exam-arranger` | 216 ms | 339 ms | 555 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `3247e7e98ae0` | 39301 ms | 5757 ms | 3 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
