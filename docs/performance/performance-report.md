# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f7025bb9f5bd`
- Recorded at: 2026-07-11T05:47:59.199Z
- Total smoke time: 26036 ms (+4799 ms vs previous)
- Login: 6246 ms
- App ready: 33 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 216 ms | 2110 ms | 2326 ms |
| `starter-hub` | 1185 ms | 48 ms | 1233 ms |
| `summary` | 769 ms | 24 ms | 793 ms |
| `county-teacher-portrait` | 204 ms | 374 ms | 578 ms |
| `analysis` | 418 ms | 123 ms | 541 ms |
| `correlation-analysis` | 208 ms | 322 ms | 530 ms |
| `subject-balance` | 263 ms | 224 ms | 487 ms |
| `blank-score-audit` | 408 ms | 68 ms | 476 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `f7025bb9f5bd` | 26036 ms | 6246 ms | 33 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
