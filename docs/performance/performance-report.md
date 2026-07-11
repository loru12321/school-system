# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `664620b00ecd`
- Recorded at: 2026-07-11T01:13:55.170Z
- Total smoke time: 26845 ms (+441 ms vs previous)
- Login: 6625 ms
- App ready: 13 ms
- Long tasks: 2, max 1045 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 1160 ms | 1273 ms | 2433 ms |
| `progress-analysis` | 1235 ms | 307 ms | 1542 ms |
| `correlation-analysis` | 238 ms | 354 ms | 592 ms |
| `summary` | 557 ms | 29 ms | 586 ms |
| `indicator` | 226 ms | 353 ms | 579 ms |
| `bottom3` | 202 ms | 329 ms | 531 ms |
| `subject-balance` | 252 ms | 157 ms | 409 ms |
| `marginal-push` | 284 ms | 119 ms | 403 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `eb2485edbcc1` | 39998 ms | 8312 ms | 336 ms | 0 | 0 | 0 |
| `7c951f6db428` | 38533 ms | 7454 ms | 335 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
