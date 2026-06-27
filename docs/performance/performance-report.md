# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `29426047563b`
- Recorded at: 2026-06-27T11:14:33.293Z
- Total smoke time: 38268 ms (-647 ms vs previous)
- Login: 6203 ms
- App ready: 8 ms
- Long tasks: 2, max 947 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 673 ms | 1806 ms | 2479 ms |
| `upload` | 1238 ms | 571 ms | 1809 ms |
| `student-overview` | 523 ms | 827 ms | 1350 ms |
| `report-generator` | 519 ms | 707 ms | 1226 ms |
| `county-analysis` | 508 ms | 672 ms | 1180 ms |
| `summary` | 545 ms | 500 ms | 1045 ms |
| `potential-analysis` | 970 ms | 0 ms | 970 ms |
| `grade-scheduler` | 557 ms | 374 ms | 931 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `deb2edaf0d20` | 38921 ms | 2828 ms | 3601 ms | 0 | 0 | 0 |
| `a3e8fcc34e33` | 33499 ms | 1421 ms | 2185 ms | 1 | 0 | 0 |
| `23efa25edea8` | 37980 ms | 5362 ms | 3231 ms | 1 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
