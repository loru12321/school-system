# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `89a979a363bd`
- Recorded at: 2026-07-12T12:05:33.244Z
- Total smoke time: 25787 ms (+5141 ms vs previous)
- Login: 6174 ms
- App ready: 80 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `starter-hub` | 4.600000000005821 ms | 1136 ms | 1140.6000000000058 ms |
| `teacher-analysis` | 50 ms | 957 ms | 1007 ms |
| `student-overview` | 15.30000000000291 ms | 674 ms | 689.3000000000029 ms |
| `subject-balance` | 40.69999999999709 ms | 646 ms | 686.6999999999971 ms |
| `analysis` | 6.7000000000116415 ms | 634 ms | 640.7000000000116 ms |
| `teacher-township-ranking` | 3.1000000000058208 ms | 636 ms | 639.1000000000058 ms |
| `report-generator` | 29 ms | 570 ms | 599 ms |
| `freshman-simulator` | 28.90000000000873 ms | 544 ms | 572.9000000000087 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `c1fc371ab953` | 25647 ms | 5155 ms | 45 ms | 0 | 0 | 0 |
| `f7025bb9f5bd` | 26036 ms | 6246 ms | 33 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
