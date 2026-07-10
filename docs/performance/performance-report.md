# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `9f20dd64cf21`
- Recorded at: 2026-07-10T16:46:42.181Z
- Total smoke time: 25469 ms (+687 ms vs previous)
- Login: 6095 ms
- App ready: 5 ms
- Long tasks: 1, max 1146 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 1078 ms | 1293 ms | 2371 ms |
| `starter-hub` | 1230 ms | 58 ms | 1288 ms |
| `progress-analysis` | 637 ms | 238 ms | 875 ms |
| `summary` | 539 ms | 41 ms | 580 ms |
| `correlation-analysis` | 223 ms | 320 ms | 543 ms |
| `indicator` | 215 ms | 293 ms | 508 ms |
| `marginal-push` | 398 ms | 21 ms | 419 ms |
| `bottom3` | 198 ms | 199 ms | 397 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `eb2485edbcc1` | 39998 ms | 8312 ms | 336 ms | 0 | 0 | 0 |
| `7c951f6db428` | 38533 ms | 7454 ms | 335 ms | 0 | 0 | 0 |
| `d060942e4922` | 37997 ms | 6192 ms | 806 ms | 0 | 0 | 0 |
| `1290e3f6c556` | 38562 ms | 9821 ms | 87 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
