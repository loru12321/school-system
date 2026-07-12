# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `865e7190a673`
- Recorded at: 2026-07-12T06:28:29.574Z
- Total smoke time: 26468 ms (+302 ms vs previous)
- Login: 6799 ms
- App ready: 8 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 34 ms | 1754 ms | 1788 ms |
| `student-details` | 30 ms | 1243 ms | 1273 ms |
| `starter-hub` | 126 ms | 1061 ms | 1187 ms |
| `progress-analysis` | 80 ms | 680 ms | 760 ms |
| `subject-balance` | 62 ms | 641 ms | 703 ms |
| `student-overview` | 26 ms | 656 ms | 682 ms |
| `analysis` | 10 ms | 610 ms | 620 ms |
| `freshman-simulator` | 62 ms | 555 ms | 617 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `865e7190a673` | 26468 ms | 6799 ms | 8 ms | 0 | 0 | 0 |
| `91faa33502e8` | 26166 ms | 5985 ms | 200 ms | 0 | 0 | 0 |
| `8fe831ccbb9b` | 25489 ms | 5961 ms | 239 ms | 0 | 0 | 0 |
| `75f91f62d601` | 15003 ms | 3744 ms | 221 ms | 0 | 0 | 0 |
| `5e39bbe5e6e2` | 21005 ms | 6088 ms | 8 ms | 1 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
