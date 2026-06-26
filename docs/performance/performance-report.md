# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c70db2cc35ed`
- Recorded at: 2026-06-26T02:47:40.593Z
- Total smoke time: 32109 ms (-1578 ms vs previous)
- Login: 2303 ms
- App ready: 2108 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `summary` | 552 ms | 498 ms | 1050 ms |
| `cohort-growth` | 552 ms | 473 ms | 1025 ms |
| `student-overview` | 520 ms | 503 ms | 1023 ms |
| `potential-analysis` | 1016 ms | 0 ms | 1016 ms |
| `marginal-push` | 531 ms | 448 ms | 979 ms |
| `progress-analysis` | 855 ms | 81 ms | 936 ms |
| `freshman-simulator` | 538 ms | 386 ms | 924 ms |
| `grade-scheduler` | 526 ms | 379 ms | 905 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `b4c725678c08` | 39177 ms | 3348 ms | 5691 ms | 1 | 0 | 0 |
| `cd6382c07ed7` | 36774 ms | 2673 ms | 3772 ms | 1 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
