# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `5e988082b308`
- Recorded at: 2026-07-12T16:49:41.010Z
- Total smoke time: 28016 ms (+1547 ms vs previous)
- Login: 6515 ms
- App ready: 88 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 46.39999999999418 ms | 976 ms | 1022.3999999999942 ms |
| `report-generator` | 21.90000000000873 ms | 899 ms | 920.9000000000087 ms |
| `subject-balance` | 44.19999999999709 ms | 726 ms | 770.1999999999971 ms |
| `student-overview` | 36.09999999999127 ms | 670 ms | 706.0999999999913 ms |
| `analysis` | 9 ms | 671 ms | 680 ms |
| `freshman-simulator` | 50.80000000000291 ms | 623 ms | 673.8000000000029 ms |
| `teacher-township-ranking` | 2.7999999999883585 ms | 622 ms | 624.7999999999884 ms |
| `indicator` | 24.30000000000291 ms | 590 ms | 614.3000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `5e988082b308` | 28016 ms | 6515 ms | 88 ms | 0 | 0 | 0 |
| `e1a4568d9d38` | 26469 ms | 6491 ms | 307 ms | 0 | 0 | 0 |
| `89a979a363bd` | 25787 ms | 6174 ms | 80 ms | 0 | 0 | 0 |
| `c4e13ef7deb3` | 20646 ms | 4392 ms | 5 ms | 0 | 0 | 0 |
| `e4738547b0b1` | 18751 ms | 3961 ms | 230 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
