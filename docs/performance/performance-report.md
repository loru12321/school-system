# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `5e383a82235e`
- Recorded at: 2026-06-27T03:03:57.134Z
- Total smoke time: 39323 ms (-931 ms vs previous)
- Login: 7410 ms
- App ready: 4 ms
- Long tasks: 2, max 1050 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 670 ms | 1783 ms | 2453 ms |
| `upload` | 1227 ms | 577 ms | 1804 ms |
| `report-generator` | 520 ms | 765 ms | 1285 ms |
| `student-overview` | 531 ms | 669 ms | 1200 ms |
| `county-analysis` | 507 ms | 638 ms | 1145 ms |
| `summary` | 548 ms | 519 ms | 1067 ms |
| `potential-analysis` | 964 ms | 0 ms | 964 ms |
| `grade-scheduler` | 527 ms | 374 ms | 901 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `5e383a82235e` | 39323 ms | 7410 ms | 4 ms | 2 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
