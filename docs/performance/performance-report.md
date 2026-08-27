# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `24444a7b7015`
- Recorded at: 2026-08-27T15:21:00.661Z
- Total smoke time: 20865 ms (-1054 ms vs previous)
- Login: 2485 ms
- App ready: 1083 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 191 ms, max derived network wait 7.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 27.29999999998836 ms | 692 ms | 719.2999999999884 ms |
| `student-overview` | 38.600000000034925 ms | 493 ms | 531.6000000000349 ms |
| `subject-balance` | 40.70000000001164 ms | 410 ms | 450.70000000001164 ms |
| `freshman-simulator` | 59.399999999965075 ms | 385 ms | 444.3999999999651 ms |
| `report-generator` | 16.5 ms | 381 ms | 397.5 ms |
| `exam-arranger` | 13.700000000011642 ms | 349 ms | 362.70000000001164 ms |
| `cohort-growth` | 20.599999999976717 ms | 328 ms | 348.5999999999767 ms |
| `progress-analysis` | 45.199999999953434 ms | 181 ms | 226.19999999995343 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `24444a7b7015` | 20865 ms | 2485 ms | 1083 ms | 0 | 66 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
