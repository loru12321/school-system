# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `a3e8fcc34e33`
- Recorded at: 2026-06-26T05:53:55.730Z
- Total smoke time: 33499 ms (-4481 ms vs previous)
- Login: 1421 ms
- App ready: 2185 ms
- Long tasks: 1, max 909 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `cohort-growth` | 641 ms | 1457 ms | 2098 ms |
| `upload` | 906 ms | 413 ms | 1319 ms |
| `bottom3` | 514 ms | 675 ms | 1189 ms |
| `report-generator` | 521 ms | 629 ms | 1150 ms |
| `summary` | 539 ms | 476 ms | 1015 ms |
| `student-overview` | 515 ms | 496 ms | 1011 ms |
| `county-analysis` | 505 ms | 488 ms | 993 ms |
| `grade-scheduler` | 521 ms | 372 ms | 893 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `682103a73ee1` | 32802 ms | 3705 ms | 2129 ms | 0 | 0 | 0 |
| `99531e601775` | 32409 ms | 2796 ms | 2207 ms | 0 | 0 | 0 |
| `db221177bb7e` | 32858 ms | 3834 ms | 2334 ms | 0 | 0 | 0 |
| `c38d91262d48` | 37498 ms | 2728 ms | 4462 ms | 1 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
