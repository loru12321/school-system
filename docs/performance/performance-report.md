# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0e5ca925d29e`
- Recorded at: 2026-08-27T12:06:42.153Z
- Total smoke time: 25530 ms (+5366 ms vs previous)
- Login: 5538 ms
- App ready: 1115 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 88.6 ms, max derived network wait 6.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 34.5 ms | 766 ms | 800.5 ms |
| `freshman-simulator` | 75.70000000001164 ms | 531 ms | 606.7000000000116 ms |
| `subject-balance` | 63.20000000001164 ms | 516 ms | 579.2000000000116 ms |
| `student-overview` | 41.09999999997672 ms | 534 ms | 575.0999999999767 ms |
| `report-generator` | 23.70000000001164 ms | 452 ms | 475.70000000001164 ms |
| `exam-arranger` | 41.09999999997672 ms | 365 ms | 406.0999999999767 ms |
| `cohort-growth` | 17.099999999976717 ms | 366 ms | 383.0999999999767 ms |
| `correlation-analysis` | 14.799999999988358 ms | 237 ms | 251.79999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `1a7c0f42fc8b` | 20010 ms | 3171 ms | 1010 ms | 0 | 68 | 0 | 0 |
| `c1f08c558b65` | 19971 ms | 3230 ms | 1081 ms | 0 | 75 | 0 | 0 |
| `23bde74614a1` | 21266 ms | 2695 ms | 1060 ms | 0 | 67 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
