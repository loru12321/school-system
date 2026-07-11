# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `407dd1e210ef`
- Recorded at: 2026-07-11T02:09:28.879Z
- Total smoke time: 25541 ms (+3271 ms vs previous)
- Login: 5013 ms
- App ready: 9 ms
- Long tasks: 1, max 909 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 1077 ms | 1294 ms | 2371 ms |
| `segment-analysis` | 1352 ms | 163 ms | 1515 ms |
| `starter-hub` | 243 ms | 1043 ms | 1286 ms |
| `correlation-analysis` | 269 ms | 392 ms | 661 ms |
| `summary` | 601 ms | 24 ms | 625 ms |
| `indicator` | 219 ms | 393 ms | 612 ms |
| `blank-score-audit` | 375 ms | 190 ms | 565 ms |
| `bottom3` | 200 ms | 318 ms | 518 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `407dd1e210ef` | 25541 ms | 5013 ms | 9 ms | 1 | 0 | 0 |
| `43e07ab2c5e5` | 22270 ms | 4770 ms | 32 ms | 0 | 0 | 0 |
| `664620b00ecd` | 26845 ms | 6625 ms | 13 ms | 2 | 0 | 0 |
| `1f6300b4d03f` | 26404 ms | 6880 ms | 207 ms | 1 | 0 | 0 |
| `9f20dd64cf21` | 25469 ms | 6095 ms | 5 ms | 1 | 0 | 0 |
| `5116409a2114` | 24782 ms | 4760 ms | 15 ms | 1 | 0 | 0 |
| `7ad5bc0bb135` | 26315 ms | 6380 ms | 43 ms | 1 | 0 | 0 |
| `13c8566a9a1f` | 26031 ms | 5814 ms | 15 ms | 2 | 0 | 0 |
| `d9d2a7184860` | 19616 ms | 3763 ms | 11 ms | 0 | 0 | 0 |
| `37075c488493` | 36594 ms | 5981 ms | 426 ms | 0 | 0 | 0 |
| `23283dfaaef5` | 37026 ms | 6347 ms | 43 ms | 0 | 0 | 0 |
| `eda1a10467d6` | 35502 ms | 6114 ms | 750 ms | 0 | 0 | 0 |
| `a8ab26ea2c8a` | 36569 ms | 6219 ms | 95 ms | 0 | 0 | 0 |
| `89dd62893206` | 38258 ms | 7353 ms | 13 ms | 0 | 0 | 0 |
| `c2428cef67cb` | 35896 ms | 6907 ms | 39 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
