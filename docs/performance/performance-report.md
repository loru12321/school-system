# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b9a2366a7fe3`
- Recorded at: 2026-07-09T04:57:30.356Z
- Total smoke time: 33679 ms (+1264 ms vs previous)
- Login: 6766 ms
- App ready: 125 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-detail-comparison` | 1481 ms | 390 ms | 1871 ms |
| `starter-hub` | 1616 ms | 8 ms | 1624 ms |
| `cohort-growth` | 259 ms | 1262 ms | 1521 ms |
| `teacher-pairing` | 267 ms | 695 ms | 962 ms |
| `county-teacher-portrait` | 311 ms | 473 ms | 784 ms |
| `analysis` | 191 ms | 580 ms | 771 ms |
| `student-overview` | 225 ms | 487 ms | 712 ms |
| `student-details` | 275 ms | 313 ms | 588 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `b9a2366a7fe3` | 33679 ms | 6766 ms | 125 ms | 0 | 0 | 0 |
| `1ed4ca96c29d` | 32415 ms | 6475 ms | 782 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
