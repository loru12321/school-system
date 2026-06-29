# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `8855664a28f9`
- Recorded at: 2026-06-29T09:13:44.340Z
- Total smoke time: 39667 ms (-1594 ms vs previous)
- Login: 3878 ms
- App ready: 2322 ms
- Long tasks: 2, max 884 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 601 ms | 1619 ms | 2220 ms |
| `county-analysis` | 506 ms | 747 ms | 1253 ms |
| `report-generator` | 517 ms | 650 ms | 1167 ms |
| `student-overview` | 564 ms | 515 ms | 1079 ms |
| `summary` | 558 ms | 509 ms | 1067 ms |
| `grade-scheduler` | 530 ms | 375 ms | 905 ms |
| `freshman-simulator` | 533 ms | 359 ms | 892 ms |
| `exam-arranger` | 522 ms | 338 ms | 860 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `b318de55602b` | 38504 ms | 1944 ms | 3764 ms | 2 | 0 | 0 |
| `35517468c965` | 36684 ms | 2462 ms | 3530 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
