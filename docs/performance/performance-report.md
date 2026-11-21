# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ee656d49dea8`
- Recorded at: 2026-11-21T16:29:04.488Z
- Total smoke time: 24703 ms (+92 ms vs previous)
- Login: 6372 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 55, max end-to-end 93.9 ms, max derived network wait 9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 9.60000000000582 ms | 1295 ms | 1304.6000000000058 ms |
| `freshman-simulator` | 110.5 ms | 627 ms | 737.5 ms |
| `student-overview` | 37.89999999999418 ms | 489 ms | 526.8999999999942 ms |
| `cohort-growth` | 19.20000000001164 ms | 305 ms | 324.20000000001164 ms |
| `report-generator` | 22 ms | 296 ms | 318 ms |
| `teacher-analysis` | 47.20000000001164 ms | 257 ms | 304.20000000001164 ms |
| `progress-analysis` | 42.20000000001164 ms | 250 ms | 292.20000000001164 ms |
| `analysis` | 71 ms | 178 ms | 249 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ee656d49dea8` | 24703 ms | 6372 ms | 4 ms | 0 | 55 | 0 | 0 |
| `1751463d2efd` | 24611 ms | 7044 ms | 3 ms | 0 | 61 | 0 | 0 |
| `d16135dc7528` | 25192 ms | 7124 ms | 3 ms | 0 | 63 | 0 | 0 |
| `9cb24d6aead9` | 20318 ms | 5331 ms | 2 ms | 0 | 66 | 0 | 0 |
| `9b0d40113938` | 24540 ms | 6893 ms | 8 ms | 0 | 58 | 0 | 0 |
| `0853d67b418b` | 21516 ms | 6343 ms | 2 ms | 0 | 59 | 0 | 0 |
| `f26597c7bd27` | 23072 ms | 5421 ms | 8 ms | 0 | 64 | 0 | 0 |
| `2c647b2c30ef` | 20717 ms | 4831 ms | 2 ms | 0 | 56 | 0 | 0 |
| `c96ee5d15470` | 19911 ms | 3427 ms | 2 ms | 0 | 57 | 0 | 0 |
| `5ecbb3d7387a` | 18948 ms | 3346 ms | 3 ms | 0 | 62 | 0 | 0 |
| `4311dbda7945` | 19284 ms | 3488 ms | 2 ms | 0 | 62 | 0 | 0 |
| `1cfa90ba33e2` | 23056 ms | 3869 ms | 3 ms | 0 | 64 | 0 | 0 |
| `0ff8e234b569` | 20955 ms | 3844 ms | 3 ms | 0 | 63 | 0 | 0 |
| `3aad6cb0955a` | 19379 ms | 3160 ms | 3 ms | 0 | 67 | 0 | 0 |
| `14eed2ebfcf8` | 23355 ms | 5095 ms | 2 ms | 0 | 59 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
