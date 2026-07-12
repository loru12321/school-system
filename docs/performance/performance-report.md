# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `89895f0948b8`
- Recorded at: 2026-07-12T09:37:54.470Z
- Total smoke time: 25460 ms (-1008 ms vs previous)
- Login: 7089 ms
- App ready: 9 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 49.40000000000873 ms | 734 ms | 783.4000000000087 ms |
| `report-generator` | 28.30000000000291 ms | 665 ms | 693.3000000000029 ms |
| `subject-balance` | 37.40000000000873 ms | 645 ms | 682.4000000000087 ms |
| `student-overview` | 43.39999999999418 ms | 633 ms | 676.3999999999942 ms |
| `freshman-simulator` | 48.60000000000582 ms | 574 ms | 622.6000000000058 ms |
| `analysis` | 6.80000000000291 ms | 598 ms | 604.8000000000029 ms |
| `teacher-township-ranking` | 5.099999999991269 ms | 568 ms | 573.0999999999913 ms |
| `indicator` | 26.19999999999709 ms | 523 ms | 549.1999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `89895f0948b8` | 25460 ms | 7089 ms | 9 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
