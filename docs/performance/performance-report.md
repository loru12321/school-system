# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `2ff81fee0d40`
- Recorded at: 2026-08-27T13:23:51.798Z
- Total smoke time: 21463 ms (-485 ms vs previous)
- Login: 4297 ms
- App ready: 1007 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 73, max end-to-end 146.6 ms, max derived network wait 6.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 26.40000000000873 ms | 640 ms | 666.4000000000087 ms |
| `student-overview` | 25.19999999999709 ms | 472 ms | 497.1999999999971 ms |
| `freshman-simulator` | 50.90000000000873 ms | 344 ms | 394.90000000000873 ms |
| `cohort-growth` | 15.599999999991269 ms | 344 ms | 359.59999999999127 ms |
| `exam-arranger` | 11.900000000008731 ms | 340 ms | 351.90000000000873 ms |
| `report-generator` | 13.400000000008731 ms | 324 ms | 337.40000000000873 ms |
| `subject-balance` | 32.19999999999709 ms | 292 ms | 324.1999999999971 ms |
| `correlation-analysis` | 11 ms | 196 ms | 207 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `2ff81fee0d40` | 21463 ms | 4297 ms | 1007 ms | 0 | 73 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
