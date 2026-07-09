# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `6aee08772fa3`
- Recorded at: 2026-07-09T08:18:35.512Z
- Total smoke time: 47157 ms (+9274 ms vs previous)
- Login: 14844 ms
- App ready: 944 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `student-details` | 53 ms | 3944 ms | 3997 ms |
| `high-score` | 3550 ms | 22 ms | 3572 ms |
| `cohort-growth` | 699 ms | 873 ms | 1572 ms |
| `analysis` | 301 ms | 614 ms | 915 ms |
| `potential-analysis` | 852 ms | 10 ms | 862 ms |
| `student-overview` | 277 ms | 462 ms | 739 ms |
| `indicator` | 557 ms | 175 ms | 732 ms |
| `subject-balance` | 221 ms | 500 ms | 721 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `6aee08772fa3` | 47157 ms | 14844 ms | 944 ms | 0 | 0 | 0 |
| `61329cbea8e0` | 37883 ms | 7102 ms | 250 ms | 0 | 0 | 0 |
| `cf64a1c2a6f4` | 32482 ms | 5051 ms | 46 ms | 0 | 0 | 0 |
| `85686924c2ac` | 38201 ms | 6204 ms | 100 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
