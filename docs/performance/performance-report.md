# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `5ecbb3d7387a`
- Recorded at: 2026-10-30T20:46:59.648Z
- Total smoke time: 18948 ms (-336 ms vs previous)
- Login: 3346 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 38.8 ms, max derived network wait 3.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 9.300000000017462 ms | 1101 ms | 1110.3000000000175 ms |
| `freshman-simulator` | 29.70000000001164 ms | 529 ms | 558.7000000000116 ms |
| `student-overview` | 31.89999999999418 ms | 446 ms | 477.8999999999942 ms |
| `report-generator` | 12.89999999999418 ms | 261 ms | 273.8999999999942 ms |
| `cohort-growth` | 17.29999999998836 ms | 246 ms | 263.29999999998836 ms |
| `exam-arranger` | 17.39999999999418 ms | 233 ms | 250.39999999999418 ms |
| `subject-balance` | 23.199999999982538 ms | 184 ms | 207.19999999998254 ms |
| `correlation-analysis` | 12 ms | 172 ms | 184 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `5ecbb3d7387a` | 18948 ms | 3346 ms | 3 ms | 0 | 62 | 0 | 0 |
| `4311dbda7945` | 19284 ms | 3488 ms | 2 ms | 0 | 62 | 0 | 0 |
| `1cfa90ba33e2` | 23056 ms | 3869 ms | 3 ms | 0 | 64 | 0 | 0 |
| `0ff8e234b569` | 20955 ms | 3844 ms | 3 ms | 0 | 63 | 0 | 0 |
| `3aad6cb0955a` | 19379 ms | 3160 ms | 3 ms | 0 | 67 | 0 | 0 |
| `14eed2ebfcf8` | 23355 ms | 5095 ms | 2 ms | 0 | 59 | 0 | 0 |
| `ffc2a5480d9b` | 23041 ms | 4371 ms | 3 ms | 0 | 64 | 0 | 0 |
| `310ed2597364` | 20742 ms | 4889 ms | 2 ms | 0 | 67 | 0 | 0 |
| `f2b5c8fe3d15` | 22800 ms | 4625 ms | 3 ms | 0 | 60 | 0 | 0 |
| `7729ff643d20` | 22344 ms | 3619 ms | 5 ms | 0 | 58 | 0 | 0 |
| `f49128342e12` | 23741 ms | 6235 ms | 3 ms | 0 | 63 | 0 | 0 |
| `04913bbc080f` | 24902 ms | 7479 ms | 3 ms | 0 | 59 | 0 | 0 |
| `3dcaf2a3d3dc` | 25981 ms | 8341 ms | 2 ms | 0 | 63 | 0 | 0 |
| `6a980b7cdc68` | 22106 ms | 5922 ms | 5 ms | 0 | 62 | 0 | 0 |
| `08c7f9be9ae8` | 26024 ms | 7078 ms | 8 ms | 0 | 59 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
