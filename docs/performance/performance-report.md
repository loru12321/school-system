# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f14a38ea9b99`
- Recorded at: 2026-07-07T18:07:07.228Z
- Total smoke time: 37952 ms (+5286 ms vs previous)
- Login: 7617 ms
- App ready: 51 ms
- Long tasks: 1, max 1001 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 366 ms | 2036 ms | 2402 ms |
| `summary` | 360 ms | 1530 ms | 1890 ms |
| `starter-hub` | 1549 ms | 4 ms | 1553 ms |
| `report-generator` | 224 ms | 979 ms | 1203 ms |
| `progress-analysis` | 237 ms | 756 ms | 993 ms |
| `student-overview` | 211 ms | 577 ms | 788 ms |
| `county-teacher-portrait` | 217 ms | 485 ms | 702 ms |
| `teacher-detail-comparison` | 248 ms | 454 ms | 702 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `f14a38ea9b99` | 37952 ms | 7617 ms | 51 ms | 1 | 0 | 0 |
| `92dda49301a4` | 32666 ms | 4910 ms | 769 ms | 0 | 0 | 0 |
| `9a3abeae82d4` | 36733 ms | 6524 ms | 1361 ms | 2 | 0 | 0 |
| `b40a1b5f9609` | 37047 ms | 7367 ms | 1413 ms | 3 | 0 | 0 |
| `e1ab80421f25` | 36203 ms | 8282 ms | 321 ms | 2 | 0 | 0 |
| `a61e699fc972` | 34586 ms | 6351 ms | 1454 ms | 1 | 0 | 0 |
| `f85736232d19` | 41669 ms | 8776 ms | 147 ms | 1 | 0 | 0 |
| `d282b8a3aada` | 34629 ms | 7511 ms | 611 ms | 1 | 0 | 0 |
| `bac5cb4c65cc` | 35065 ms | 6669 ms | 1355 ms | 2 | 0 | 0 |
| `8f70f0965e65` | 35735 ms | 6537 ms | 1350 ms | 1 | 0 | 0 |
| `558b31224351` | 35623 ms | 6436 ms | 1864 ms | 1 | 0 | 0 |
| `ffcc7fa99b07` | 40147 ms | 7468 ms | 794 ms | 1 | 0 | 0 |
| `7f520bbb3b26` | 39040 ms | 7197 ms | 925 ms | 1 | 0 | 0 |
| `1feacec8ac38` | 35337 ms | 8375 ms | 437 ms | 3 | 0 | 0 |
| `ff2c2f070103` | 36437 ms | 7105 ms | 1831 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
