# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `5e523f32a899`
- Recorded at: 2026-07-12T02:52:49.896Z
- Total smoke time: 24977 ms (+3345 ms vs previous)
- Login: 6345 ms
- App ready: 18 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `starter-hub` | 334 ms | 1048 ms | 1382 ms |
| `student-details` | 54 ms | 832 ms | 886 ms |
| `summary` | 631 ms | 36 ms | 667 ms |
| `cohort-growth` | 322 ms | 320 ms | 642 ms |
| `county-teacher-portrait` | 224 ms | 351 ms | 575 ms |
| `indicator` | 210 ms | 316 ms | 526 ms |
| `subject-balance` | 261 ms | 257 ms | 518 ms |
| `correlation-analysis` | 203 ms | 295 ms | 498 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `5e523f32a899` | 24977 ms | 6345 ms | 18 ms | 0 | 0 | 0 |
| `ff94052ca681` | 21632 ms | 5130 ms | 13 ms | 1 | 0 | 0 |
| `9870485b122d` | 22867 ms | 4950 ms | 13 ms | 0 | 0 | 0 |
| `107ee3ff6da0` | 26449 ms | 6550 ms | 14 ms | 1 | 0 | 0 |
| `c1fc371ab953` | 25647 ms | 5155 ms | 45 ms | 0 | 0 | 0 |
| `f7025bb9f5bd` | 26036 ms | 6246 ms | 33 ms | 0 | 0 | 0 |
| `9313725e8f4e` | 21237 ms | 4704 ms | 14 ms | 1 | 0 | 0 |
| `95f4f0f5d0a5` | 26633 ms | 6376 ms | 89 ms | 1 | 0 | 0 |
| `14bb7216e56e` | 26628 ms | 6504 ms | 12 ms | 1 | 0 | 0 |
| `6befd25fea14` | 25208 ms | 5929 ms | 36 ms | 1 | 0 | 0 |
| `ca9e7cccc2ab` | 28754 ms | 8715 ms | 37 ms | 1 | 0 | 0 |
| `ae3789371cce` | 27367 ms | 6252 ms | 7 ms | 1 | 0 | 0 |
| `407dd1e210ef` | 25541 ms | 5013 ms | 9 ms | 1 | 0 | 0 |
| `43e07ab2c5e5` | 22270 ms | 4770 ms | 32 ms | 0 | 0 | 0 |
| `664620b00ecd` | 26845 ms | 6625 ms | 13 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
