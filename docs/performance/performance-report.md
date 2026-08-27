# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `149a7af06a91`
- Recorded at: 2026-08-27T12:46:23.614Z
- Total smoke time: 21329 ms (-3794 ms vs previous)
- Login: 2354 ms
- App ready: 1019 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 76, max end-to-end 208.6 ms, max derived network wait 6.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 34 ms | 757 ms | 791 ms |
| `student-overview` | 40.80000000001746 ms | 522 ms | 562.8000000000175 ms |
| `subject-balance` | 43.29999999998836 ms | 494 ms | 537.2999999999884 ms |
| `freshman-simulator` | 79.39999999999418 ms | 449 ms | 528.3999999999942 ms |
| `report-generator` | 22 ms | 401 ms | 423 ms |
| `cohort-growth` | 20.39999999999418 ms | 386 ms | 406.3999999999942 ms |
| `exam-arranger` | 17.79999999998836 ms | 345 ms | 362.79999999998836 ms |
| `teacher-township-ranking` | 5.600000000005821 ms | 260 ms | 265.6000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `149a7af06a91` | 21329 ms | 2354 ms | 1019 ms | 0 | 76 | 0 | 0 |
| `06d882bc91e3` | 25123 ms | 6507 ms | 1099 ms | 0 | 66 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
