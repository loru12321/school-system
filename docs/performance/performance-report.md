# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `788ff298770b`
- Recorded at: 2026-08-27T15:35:55.226Z
- Total smoke time: 21417 ms (+552 ms vs previous)
- Login: 2486 ms
- App ready: 1010 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 188.7 ms, max derived network wait 8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 37.40000000000873 ms | 720 ms | 757.4000000000087 ms |
| `student-overview` | 48.40000000000873 ms | 517 ms | 565.4000000000087 ms |
| `freshman-simulator` | 75.80000000000291 ms | 451 ms | 526.8000000000029 ms |
| `cohort-growth` | 29.79999999998836 ms | 422 ms | 451.79999999998836 ms |
| `subject-balance` | 37.19999999999709 ms | 410 ms | 447.1999999999971 ms |
| `report-generator` | 19.10000000000582 ms | 392 ms | 411.1000000000058 ms |
| `exam-arranger` | 28.70000000001164 ms | 343 ms | 371.70000000001164 ms |
| `correlation-analysis` | 28 ms | 230 ms | 258 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `788ff298770b` | 21417 ms | 2486 ms | 1010 ms | 0 | 66 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
