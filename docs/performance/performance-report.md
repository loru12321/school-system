# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `9a3abeae82d4`
- Recorded at: 2026-07-07T15:42:12.060Z
- Total smoke time: 36733 ms (-314 ms vs previous)
- Login: 6524 ms
- App ready: 1361 ms
- Long tasks: 2, max 1017 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 254 ms | 1910 ms | 2164 ms |
| `summary` | 224 ms | 1574 ms | 1798 ms |
| `report-generator` | 214 ms | 1002 ms | 1216 ms |
| `progress-analysis` | 264 ms | 852 ms | 1116 ms |
| `teacher-detail-comparison` | 379 ms | 454 ms | 833 ms |
| `student-overview` | 254 ms | 559 ms | 813 ms |
| `teacher-pairing` | 239 ms | 471 ms | 710 ms |
| `county-teacher-portrait` | 230 ms | 419 ms | 649 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `e9348edcb09a` | 32479 ms | 5839 ms | 65 ms | 0 | 0 | 0 |
| `eb47ab0b48a0` | 33947 ms | 6448 ms | 1788 ms | 1 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
