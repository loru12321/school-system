# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0584365ea6f9`
- Recorded at: 2026-08-27T13:06:01.937Z
- Total smoke time: 21948 ms (+2827 ms vs previous)
- Login: 4792 ms
- App ready: 1013 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 72, max end-to-end 150.9 ms, max derived network wait 5.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 23.80000000000291 ms | 651 ms | 674.8000000000029 ms |
| `student-overview` | 27.60000000000582 ms | 473 ms | 500.6000000000058 ms |
| `freshman-simulator` | 53.5 ms | 348 ms | 401.5 ms |
| `subject-balance` | 30.20000000001164 ms | 312 ms | 342.20000000001164 ms |
| `exam-arranger` | 1.3999999999941792 ms | 336 ms | 337.3999999999942 ms |
| `report-generator` | 14.30000000000291 ms | 322 ms | 336.3000000000029 ms |
| `cohort-growth` | 12.69999999999709 ms | 293 ms | 305.6999999999971 ms |
| `correlation-analysis` | 16.40000000000873 ms | 178 ms | 194.40000000000873 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `0584365ea6f9` | 21948 ms | 4792 ms | 1013 ms | 0 | 72 | 0 | 0 |
| `9f0de5d1e372` | 19121 ms | 2534 ms | 1008 ms | 0 | 69 | 0 | 0 |
| `7dfdf2de331f` | 21569 ms | 3028 ms | 1016 ms | 0 | 66 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
