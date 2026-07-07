# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `eb47ab0b48a0`
- Recorded at: 2026-07-07T01:46:00.490Z
- Total smoke time: 33947 ms (-929 ms vs previous)
- Login: 6448 ms
- App ready: 1788 ms
- Long tasks: 1, max 984 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `upload` | 681 ms | 1994 ms | 2675 ms |
| `cohort-growth` | 219 ms | 1661 ms | 1880 ms |
| `summary` | 271 ms | 1556 ms | 1827 ms |
| `student-overview` | 231 ms | 605 ms | 836 ms |
| `teacher-detail-comparison` | 262 ms | 507 ms | 769 ms |
| `county-teacher-portrait` | 215 ms | 479 ms | 694 ms |
| `student-details` | 40 ms | 576 ms | 616 ms |
| `grade-scheduler` | 205 ms | 384 ms | 589 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `eb47ab0b48a0` | 33947 ms | 6448 ms | 1788 ms | 1 | 0 | 0 |
| `b4d8371e4eb7` | 34876 ms | 6055 ms | 1667 ms | 1 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
