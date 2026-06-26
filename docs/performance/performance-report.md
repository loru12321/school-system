# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `61425f000c25`
- Recorded at: 2026-06-26T04:13:08.904Z
- Total smoke time: 36561 ms (+4624 ms vs previous)
- Login: 2973 ms
- App ready: 3180 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `upload` | 1325 ms | 430 ms | 1755 ms |
| `cohort-growth` | 555 ms | 1056 ms | 1611 ms |
| `bottom3` | 529 ms | 553 ms | 1082 ms |
| `summary` | 552 ms | 509 ms | 1061 ms |
| `student-overview` | 548 ms | 501 ms | 1049 ms |
| `county-analysis` | 507 ms | 539 ms | 1046 ms |
| `report-generator` | 522 ms | 429 ms | 951 ms |
| `potential-analysis` | 948 ms | 0 ms | 948 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `a2ea0396e059` | 38789 ms | 2472 ms | 5704 ms | 0 | 0 | 0 |
| `d8ec5f5a0994` | 38556 ms | 3281 ms | 4620 ms | 1 | 0 | 0 |
| `07f3ba6894ee` | 31911 ms | 2165 ms | 3066 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
