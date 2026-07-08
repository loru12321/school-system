# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c04b5a2834fb`
- Recorded at: 2026-07-08T20:36:49.045Z
- Total smoke time: 34588 ms (-1499 ms vs previous)
- Login: 6954 ms
- App ready: 174 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `county-teacher-portrait` | 1571 ms | 803 ms | 2374 ms |
| `cohort-growth` | 259 ms | 1239 ms | 1498 ms |
| `high-score` | 1191 ms | 0 ms | 1191 ms |
| `upload` | 258 ms | 856 ms | 1114 ms |
| `data-quality` | 800 ms | 0 ms | 800 ms |
| `report-generator` | 270 ms | 518 ms | 788 ms |
| `analysis` | 198 ms | 565 ms | 763 ms |
| `student-overview` | 254 ms | 501 ms | 755 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `c04b5a2834fb` | 34588 ms | 6954 ms | 174 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
