# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `4b416ae745e7`
- Recorded at: 2026-07-07T18:27:08.139Z
- Total smoke time: 36990 ms (-962 ms vs previous)
- Login: 6614 ms
- App ready: 1423 ms
- Long tasks: 2, max 1040 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 338 ms | 1851 ms | 2189 ms |
| `summary` | 425 ms | 1671 ms | 2096 ms |
| `starter-hub` | 1804 ms | 4 ms | 1808 ms |
| `report-generator` | 214 ms | 973 ms | 1187 ms |
| `progress-analysis` | 262 ms | 724 ms | 986 ms |
| `teacher-detail-comparison` | 273 ms | 607 ms | 880 ms |
| `student-overview` | 255 ms | 609 ms | 864 ms |
| `upload` | 270 ms | 568 ms | 838 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `4b416ae745e7` | 36990 ms | 6614 ms | 1423 ms | 2 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
