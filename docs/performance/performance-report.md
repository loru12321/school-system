# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c720ac6986d4`
- Recorded at: 2026-07-13T04:06:05.425Z
- Total smoke time: 24866 ms (-6250 ms vs previous)
- Login: 5326 ms
- App ready: 39 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 31.60000000000582 ms | 1057 ms | 1088.6000000000058 ms |
| `teacher-analysis` | 52 ms | 965 ms | 1017 ms |
| `analysis` | 13.299999999988358 ms | 834 ms | 847.2999999999884 ms |
| `teacher-township-ranking` | 2.3000000000029104 ms | 814 ms | 816.3000000000029 ms |
| `progress-analysis` | 32.09999999999127 ms | 777 ms | 809.0999999999913 ms |
| `student-overview` | 21.80000000000291 ms | 602 ms | 623.8000000000029 ms |
| `indicator` | 18.90000000000873 ms | 589 ms | 607.9000000000087 ms |
| `grade-scheduler` | 23.10000000000582 ms | 511 ms | 534.1000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `c720ac6986d4` | 24866 ms | 5326 ms | 39 ms | 0 | 0 | 0 |
| `1c50d7adb558` | 31116 ms | 6993 ms | 107 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
