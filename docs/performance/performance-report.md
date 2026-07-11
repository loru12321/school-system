# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `9313725e8f4e`
- Recorded at: 2026-07-11T05:41:39.790Z
- Total smoke time: 21237 ms (-5396 ms vs previous)
- Login: 4704 ms
- App ready: 14 ms
- Long tasks: 1, max 937 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 215 ms | 930 ms | 1145 ms |
| `starter-hub` | 999 ms | 48 ms | 1047 ms |
| `blank-score-audit` | 333 ms | 182 ms | 515 ms |
| `summary` | 448 ms | 56 ms | 504 ms |
| `indicator` | 212 ms | 247 ms | 459 ms |
| `correlation-analysis` | 252 ms | 169 ms | 421 ms |
| `marginal-push` | 250 ms | 118 ms | 368 ms |
| `freshman-simulator` | 231 ms | 128 ms | 359 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `9313725e8f4e` | 21237 ms | 4704 ms | 14 ms | 1 | 0 | 0 |
| `95f4f0f5d0a5` | 26633 ms | 6376 ms | 89 ms | 1 | 0 | 0 |
| `14bb7216e56e` | 26628 ms | 6504 ms | 12 ms | 1 | 0 | 0 |
| `6befd25fea14` | 25208 ms | 5929 ms | 36 ms | 1 | 0 | 0 |
| `ca9e7cccc2ab` | 28754 ms | 8715 ms | 37 ms | 1 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
