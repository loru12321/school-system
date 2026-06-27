# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `291411606b3e`
- Recorded at: 2026-06-27T02:51:53.766Z
- Total smoke time: 40254 ms (+1750 ms vs previous)
- Login: 8028 ms
- App ready: 2 ms
- Long tasks: 2, max 1056 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 668 ms | 1962 ms | 2630 ms |
| `upload` | 1246 ms | 558 ms | 1804 ms |
| `student-overview` | 530 ms | 876 ms | 1406 ms |
| `report-generator` | 526 ms | 656 ms | 1182 ms |
| `county-analysis` | 512 ms | 663 ms | 1175 ms |
| `summary` | 557 ms | 536 ms | 1093 ms |
| `potential-analysis` | 963 ms | 0 ms | 963 ms |
| `grade-scheduler` | 529 ms | 375 ms | 904 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `291411606b3e` | 40254 ms | 8028 ms | 2 ms | 2 | 0 | 0 |
| `b318de55602b` | 38504 ms | 1944 ms | 3764 ms | 2 | 0 | 0 |
| `35517468c965` | 36684 ms | 2462 ms | 3530 ms | 0 | 0 | 0 |
| `deb2edaf0d20` | 38921 ms | 2828 ms | 3601 ms | 0 | 0 | 0 |
| `a3e8fcc34e33` | 33499 ms | 1421 ms | 2185 ms | 1 | 0 | 0 |
| `23efa25edea8` | 37980 ms | 5362 ms | 3231 ms | 1 | 0 | 0 |
| `a736667cc657` | 35390 ms | 3014 ms | 2828 ms | 1 | 0 | 0 |
| `61425f000c25` | 36561 ms | 2973 ms | 3180 ms | 0 | 0 | 0 |
| `0146c24e74bf` | 31937 ms | 2517 ms | 2175 ms | 0 | 0 | 0 |
| `c70db2cc35ed` | 32109 ms | 2303 ms | 2108 ms | 0 | 0 | 0 |
| `b8b397c23552` | 33687 ms | 3417 ms | 3164 ms | 0 | 0 | 0 |
| `8d7707f7542f` | 31464 ms | 2450 ms | 2178 ms | 0 | 0 | 0 |
| `713ca3604a33` | 31966 ms | 2919 ms | 2083 ms | 0 | 0 | 0 |
| `bf2c1db79a98` | 32145 ms | 3044 ms | 2072 ms | 0 | 0 | 0 |
| `b1b8693a8230` | 31634 ms | 2371 ms | 2011 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
