# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `1feacec8ac38`
- Recorded at: 2026-07-07T04:08:06.340Z
- Total smoke time: 35337 ms (-1100 ms vs previous)
- Login: 8375 ms
- App ready: 437 ms
- Long tasks: 3, max 979 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `audio-debug` | 2041 ms | 1 ms | 2042 ms |
| `cohort-growth` | 206 ms | 1781 ms | 1987 ms |
| `summary` | 229 ms | 990 ms | 1219 ms |
| `student-overview` | 230 ms | 621 ms | 851 ms |
| `teacher-detail-comparison` | 370 ms | 453 ms | 823 ms |
| `county-teacher-portrait` | 225 ms | 566 ms | 791 ms |
| `grade-scheduler` | 253 ms | 380 ms | 633 ms |
| `report-generator` | 234 ms | 390 ms | 624 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `1feacec8ac38` | 35337 ms | 8375 ms | 437 ms | 3 | 0 | 0 |
| `ff2c2f070103` | 36437 ms | 7105 ms | 1831 ms | 2 | 0 | 0 |
| `e9348edcb09a` | 32479 ms | 5839 ms | 65 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
