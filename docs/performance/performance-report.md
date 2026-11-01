# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `1751463d2efd`
- Recorded at: 2026-11-01T07:01:39.317Z
- Total smoke time: 24611 ms (-581 ms vs previous)
- Login: 7044 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 61, max end-to-end 44.1 ms, max derived network wait 10.1 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 12.299999999988358 ms | 1434 ms | 1446.2999999999884 ms |
| `freshman-simulator` | 72.19999999998254 ms | 625 ms | 697.1999999999825 ms |
| `student-overview` | 32.69999999998254 ms | 480 ms | 512.6999999999825 ms |
| `report-generator` | 14.89999999999418 ms | 308 ms | 322.8999999999942 ms |
| `progress-analysis` | 70.5 ms | 251 ms | 321.5 ms |
| `cohort-growth` | 17.60000000000582 ms | 279 ms | 296.6000000000058 ms |
| `subject-balance` | 30.39999999999418 ms | 253 ms | 283.3999999999942 ms |
| `exam-arranger` | 19.5 ms | 233 ms | 252.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `ffc2a5480d9b` | 23041 ms | 4371 ms | 3 ms | 0 | 64 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
