# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c96ee5d15470`
- Recorded at: 2026-10-31T01:40:43.487Z
- Total smoke time: 19911 ms (+963 ms vs previous)
- Login: 3427 ms
- App ready: 2 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 57, max end-to-end 31.5 ms, max derived network wait 5.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 8.799999999988358 ms | 1293 ms | 1301.7999999999884 ms |
| `student-overview` | 42.40000000002328 ms | 487 ms | 529.4000000000233 ms |
| `freshman-simulator` | 64.39999999996508 ms | 294 ms | 358.3999999999651 ms |
| `cohort-growth` | 14 ms | 276 ms | 290 ms |
| `report-generator` | 16.600000000034925 ms | 273 ms | 289.6000000000349 ms |
| `subject-balance` | 36.5 ms | 228 ms | 264.5 ms |
| `exam-arranger` | 14.399999999965075 ms | 242 ms | 256.3999999999651 ms |
| `progress-analysis` | 88.39999999996508 ms | 138 ms | 226.39999999996508 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `c96ee5d15470` | 19911 ms | 3427 ms | 2 ms | 0 | 57 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
