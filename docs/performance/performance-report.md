# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `bbd20dcf9166`
- Recorded at: 2026-07-08T17:22:08.670Z
- Total smoke time: 36087 ms (-1616 ms vs previous)
- Login: 7301 ms
- App ready: 9 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `summary` | 354 ms | 4744 ms | 5098 ms |
| `cohort-growth` | 236 ms | 1201 ms | 1437 ms |
| `teacher-detail-comparison` | 217 ms | 1063 ms | 1280 ms |
| `upload` | 251 ms | 823 ms | 1074 ms |
| `student-overview` | 293 ms | 726 ms | 1019 ms |
| `county-teacher-portrait` | 212 ms | 631 ms | 843 ms |
| `grade-scheduler` | 282 ms | 384 ms | 666 ms |
| `student-details` | 299 ms | 367 ms | 666 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `bbd20dcf9166` | 36087 ms | 7301 ms | 9 ms | 0 | 0 | 0 |
| `35773813a657` | 37703 ms | 7562 ms | 344 ms | 0 | 0 | 0 |
| `6f1d41f295f0` | 40386 ms | 6196 ms | 82 ms | 2 | 0 | 0 |
| `4f4d8ae6250e` | 40005 ms | 12629 ms | 423 ms | 2 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
