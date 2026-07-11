# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ae3789371cce`
- Recorded at: 2026-07-11T03:06:53.393Z
- Total smoke time: 27367 ms (+1826 ms vs previous)
- Login: 6252 ms
- App ready: 7 ms
- Long tasks: 1, max 1195 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 1141 ms | 1250 ms | 2391 ms |
| `starter-hub` | 1286 ms | 57 ms | 1343 ms |
| `potential-analysis` | 894 ms | 2 ms | 896 ms |
| `subject-balance` | 219 ms | 594 ms | 813 ms |
| `blank-score-audit` | 430 ms | 248 ms | 678 ms |
| `analysis` | 205 ms | 436 ms | 641 ms |
| `indicator` | 220 ms | 278 ms | 498 ms |
| `correlation-analysis` | 310 ms | 176 ms | 486 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `ae3789371cce` | 27367 ms | 6252 ms | 7 ms | 1 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
