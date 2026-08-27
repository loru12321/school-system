# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f06e638e85c1`
- Recorded at: 2026-08-27T13:40:05.783Z
- Total smoke time: 21466 ms (+3 ms vs previous)
- Login: 3152 ms
- App ready: 1012 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 73, max end-to-end 196.9 ms, max derived network wait 7.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 37 ms | 695 ms | 732 ms |
| `student-overview` | 39.29999999998836 ms | 481 ms | 520.2999999999884 ms |
| `subject-balance` | 51.10000000000582 ms | 440 ms | 491.1000000000058 ms |
| `freshman-simulator` | 63.39999999999418 ms | 342 ms | 405.3999999999942 ms |
| `report-generator` | 16.70000000001164 ms | 374 ms | 390.70000000001164 ms |
| `exam-arranger` | 14.200000000011642 ms | 339 ms | 353.20000000001164 ms |
| `cohort-growth` | 23.300000000017462 ms | 319 ms | 342.30000000001746 ms |
| `correlation-analysis` | 18.70000000001164 ms | 209 ms | 227.70000000001164 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `f06e638e85c1` | 21466 ms | 3152 ms | 1012 ms | 0 | 73 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
