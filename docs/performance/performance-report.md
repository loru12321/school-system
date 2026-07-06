# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `e243403c151b`
- Recorded at: 2026-07-06T09:52:20.212Z
- Total smoke time: 38006 ms (+2777 ms vs previous)
- Login: 6604 ms
- App ready: 111 ms
- Long tasks: 3, max 1017 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 415 ms | 2037 ms | 2452 ms |
| `starter-hub` | 2358 ms | 3 ms | 2361 ms |
| `summary` | 216 ms | 1523 ms | 1739 ms |
| `report-generator` | 223 ms | 1192 ms | 1415 ms |
| `teacher-detail-comparison` | 413 ms | 522 ms | 935 ms |
| `progress-analysis` | 278 ms | 598 ms | 876 ms |
| `county-analysis` | 553 ms | 318 ms | 871 ms |
| `student-overview` | 216 ms | 549 ms | 765 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `e243403c151b` | 38006 ms | 6604 ms | 111 ms | 3 | 0 | 0 |
| `43959e6993a3` | 35229 ms | 6041 ms | 1613 ms | 2 | 0 | 0 |
| `8855664a28f9` | 39667 ms | 3878 ms | 2322 ms | 2 | 0 | 0 |
| `5a4e643fc778` | 41261 ms | 4499 ms | 2625 ms | 2 | 0 | 0 |
| `6f694388ccbb` | 38530 ms | 6132 ms | 6 ms | 2 | 0 | 0 |
| `29426047563b` | 38268 ms | 6203 ms | 8 ms | 2 | 0 | 0 |
| `44605c44bfd8` | 38915 ms | 6854 ms | 4 ms | 2 | 0 | 0 |
| `3247e7e98ae0` | 39301 ms | 5757 ms | 3 ms | 2 | 0 | 0 |
| `0b28d045637a` | 37919 ms | 5705 ms | 3 ms | 2 | 0 | 0 |
| `ae77304134f8` | 38594 ms | 6679 ms | 6 ms | 2 | 0 | 0 |
| `aecbfabdf4de` | 37587 ms | 5912 ms | 11 ms | 2 | 0 | 0 |
| `e6711c267b69` | 34527 ms | 4969 ms | 43 ms | 0 | 0 | 0 |
| `c2899c280b64` | 39570 ms | 7521 ms | 7 ms | 2 | 0 | 0 |
| `5e383a82235e` | 39323 ms | 7410 ms | 4 ms | 2 | 0 | 0 |
| `291411606b3e` | 40254 ms | 8028 ms | 2 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
