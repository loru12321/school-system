# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `8af55229fd71`
- Recorded at: 2026-08-27T12:29:01.059Z
- Total smoke time: 21477 ms (+142 ms vs previous)
- Login: 3248 ms
- App ready: 1012 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 202 ms, max derived network wait 7.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 32.29999999998836 ms | 696 ms | 728.2999999999884 ms |
| `student-overview` | 43.09999999999127 ms | 492 ms | 535.0999999999913 ms |
| `freshman-simulator` | 62.5 ms | 428 ms | 490.5 ms |
| `subject-balance` | 34.10000000000582 ms | 395 ms | 429.1000000000058 ms |
| `report-generator` | 18.09999999999127 ms | 376 ms | 394.09999999999127 ms |
| `cohort-growth` | 16.40000000000873 ms | 331 ms | 347.40000000000873 ms |
| `exam-arranger` | 1.2999999999883585 ms | 340 ms | 341.29999999998836 ms |
| `progress-analysis` | 45.80000000000291 ms | 183 ms | 228.8000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `8af55229fd71` | 21477 ms | 3248 ms | 1012 ms | 0 | 66 | 0 | 0 |
| `a9d4ac0ee0cd` | 21335 ms | 2793 ms | 1124 ms | 0 | 67 | 0 | 0 |
| `2de0149d6ebe` | 21230 ms | 2952 ms | 1174 ms | 0 | 64 | 0 | 0 |
| `0e5ca925d29e` | 25530 ms | 5538 ms | 1115 ms | 0 | 65 | 0 | 0 |
| `cedfd9cef31c` | 20164 ms | 3180 ms | 1014 ms | 0 | 74 | 0 | 0 |
| `7dde7e6bfb23` | 19652 ms | 2685 ms | 1031 ms | 0 | 71 | 0 | 0 |
| `09fe790c6f82` | 17438 ms | 2018 ms | 1012 ms | 0 | 76 | 0 | 0 |
| `ce014f676c78` | 22028 ms | 3692 ms | 1008 ms | 0 | 70 | 0 | 0 |
| `20fe286b821b` | 21408 ms | 3152 ms | 1044 ms | 0 | 69 | 0 | 0 |
| `3ecd24b48bd4` | 23137 ms | 6247 ms | 1024 ms | 0 | 73 | 0 | 0 |
| `c3a1d4ab8cbc` | 22069 ms | 3823 ms | 1086 ms | 0 | 64 | 0 | 0 |
| `d490f413d304` | 19816 ms | 2748 ms | 1093 ms | 0 | 69 | 0 | 0 |
| `760ebff7a61e` | 19974 ms | 2702 ms | 1007 ms | 0 | 69 | 0 | 0 |
| `ee8f156a0b48` | 21539 ms | 4201 ms | 1005 ms | 0 | 67 | 0 | 0 |
| `012c524c58a2` | 21403 ms | 2299 ms | 1048 ms | 0 | 70 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
