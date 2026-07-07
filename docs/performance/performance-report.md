# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `bac5cb4c65cc`
- Recorded at: 2026-07-07T09:47:55.762Z
- Total smoke time: 35065 ms (-670 ms vs previous)
- Login: 6669 ms
- App ready: 1355 ms
- Long tasks: 2, max 991 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 371 ms | 1708 ms | 2079 ms |
| `summary` | 268 ms | 1588 ms | 1856 ms |
| `report-generator` | 222 ms | 982 ms | 1204 ms |
| `progress-analysis` | 240 ms | 742 ms | 982 ms |
| `student-overview` | 251 ms | 573 ms | 824 ms |
| `teacher-detail-comparison` | 272 ms | 455 ms | 727 ms |
| `county-teacher-portrait` | 216 ms | 425 ms | 641 ms |
| `grade-scheduler` | 257 ms | 376 ms | 633 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `bac5cb4c65cc` | 35065 ms | 6669 ms | 1355 ms | 2 | 0 | 0 |
| `8f70f0965e65` | 35735 ms | 6537 ms | 1350 ms | 1 | 0 | 0 |
| `558b31224351` | 35623 ms | 6436 ms | 1864 ms | 1 | 0 | 0 |
| `ffcc7fa99b07` | 40147 ms | 7468 ms | 794 ms | 1 | 0 | 0 |
| `7f520bbb3b26` | 39040 ms | 7197 ms | 925 ms | 1 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
