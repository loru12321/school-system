# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c2899c280b64`
- Recorded at: 2026-06-27T03:39:40.359Z
- Total smoke time: 39570 ms (+247 ms vs previous)
- Login: 7521 ms
- App ready: 7 ms
- Long tasks: 2, max 1087 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 635 ms | 1978 ms | 2613 ms |
| `upload` | 1229 ms | 465 ms | 1694 ms |
| `report-generator` | 519 ms | 814 ms | 1333 ms |
| `county-analysis` | 507 ms | 646 ms | 1153 ms |
| `potential-analysis` | 1100 ms | 0 ms | 1100 ms |
| `student-overview` | 531 ms | 562 ms | 1093 ms |
| `summary` | 554 ms | 513 ms | 1067 ms |
| `freshman-simulator` | 547 ms | 400 ms | 947 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `c2899c280b64` | 39570 ms | 7521 ms | 7 ms | 2 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
