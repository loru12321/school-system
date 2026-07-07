# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `92dda49301a4`
- Recorded at: 2026-07-07T17:31:13.754Z
- Total smoke time: 32666 ms (-4067 ms vs previous)
- Login: 4910 ms
- App ready: 769 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `summary` | 246 ms | 6924 ms | 7170 ms |
| `upload` | 1309 ms | 474 ms | 1783 ms |
| `cohort-growth` | 196 ms | 1011 ms | 1207 ms |
| `teacher-detail-comparison` | 369 ms | 499 ms | 868 ms |
| `student-overview` | 230 ms | 471 ms | 701 ms |
| `grade-scheduler` | 224 ms | 373 ms | 597 ms |
| `exam-arranger` | 214 ms | 342 ms | 556 ms |
| `county-teacher-portrait` | 212 ms | 316 ms | 528 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `e9348edcb09a` | 32479 ms | 5839 ms | 65 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
