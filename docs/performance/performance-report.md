# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ff94052ca681`
- Recorded at: 2026-07-12T02:34:05.864Z
- Total smoke time: 21632 ms (-1235 ms vs previous)
- Login: 5130 ms
- App ready: 13 ms
- Long tasks: 1, max 921 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `starter-hub` | 247 ms | 745 ms | 992 ms |
| `progress-analysis` | 462 ms | 250 ms | 712 ms |
| `student-details` | 49 ms | 595 ms | 644 ms |
| `cohort-growth` | 216 ms | 259 ms | 475 ms |
| `summary` | 436 ms | 20 ms | 456 ms |
| `indicator` | 197 ms | 246 ms | 443 ms |
| `seat-adjustment` | 367 ms | 59 ms | 426 ms |
| `correlation-analysis` | 235 ms | 166 ms | 401 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `1f6300b4d03f` | 26404 ms | 6880 ms | 207 ms | 1 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
