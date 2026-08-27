# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `fec8eff5a795`
- Recorded at: 2026-08-27T15:08:03.158Z
- Total smoke time: 21919 ms (-2615 ms vs previous)
- Login: 2857 ms
- App ready: 1199 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 64, max end-to-end 58.1 ms, max derived network wait 22.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 34.90000000002328 ms | 743 ms | 777.9000000000233 ms |
| `student-overview` | 38.20000000001164 ms | 518 ms | 556.2000000000116 ms |
| `subject-balance` | 38.59999999997672 ms | 440 ms | 478.5999999999767 ms |
| `freshman-simulator` | 59.40000000002328 ms | 340 ms | 399.4000000000233 ms |
| `report-generator` | 20 ms | 374 ms | 394 ms |
| `progress-analysis` | 78.40000000002328 ms | 301 ms | 379.4000000000233 ms |
| `cohort-growth` | 17.599999999976717 ms | 353 ms | 370.5999999999767 ms |
| `exam-arranger` | 16.29999999998836 ms | 344 ms | 360.29999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fec8eff5a795` | 21919 ms | 2857 ms | 1199 ms | 0 | 64 | 0 | 0 |
| `1c9630f19fd5` | 24534 ms | 5681 ms | 1026 ms | 0 | 65 | 0 | 0 |
| `e519139087c7` | 22248 ms | 2417 ms | 1165 ms | 0 | 63 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
