# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ce014f676c78`
- Recorded at: 2026-08-27T11:47:10.049Z
- Total smoke time: 22028 ms (+620 ms vs previous)
- Login: 3692 ms
- App ready: 1008 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 183.7 ms, max derived network wait 6.1 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 33.40000000002328 ms | 703 ms | 736.4000000000233 ms |
| `student-overview` | 41.09999999997672 ms | 507 ms | 548.0999999999767 ms |
| `subject-balance` | 36.79999999993015 ms | 458 ms | 494.79999999993015 ms |
| `freshman-simulator` | 102 ms | 297 ms | 399 ms |
| `report-generator` | 17.400000000023283 ms | 373 ms | 390.4000000000233 ms |
| `exam-arranger` | 16.600000000093132 ms | 340 ms | 356.60000000009313 ms |
| `cohort-growth` | 18.599999999976717 ms | 325 ms | 343.5999999999767 ms |
| `correlation-analysis` | 21.5 ms | 208 ms | 229.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `941f70ec4ea3` | 22865 ms | 2736 ms | 1007 ms | 0 | 71 | 0 | 0 |
| `d85c088806a1` | 22437 ms | 3805 ms | 1069 ms | 0 | 65 | 0 | 0 |
| `09740b80861e` | 21584 ms | 2936 ms | 1126 ms | 0 | 68 | 0 | 0 |
| `0a0b9e86965c` | 20173 ms | 2300 ms | 1008 ms | 0 | 66 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
