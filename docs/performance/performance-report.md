# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ee093bec2e4c`
- Recorded at: 2026-11-21T16:35:02.773Z
- Total smoke time: 24818 ms (+115 ms vs previous)
- Login: 6754 ms
- App ready: 2 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 54, max end-to-end 91.3 ms, max derived network wait 10.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 11.099999999976717 ms | 1425 ms | 1436.0999999999767 ms |
| `freshman-simulator` | 69.10000000003492 ms | 597 ms | 666.1000000000349 ms |
| `student-overview` | 31.5 ms | 568 ms | 599.5 ms |
| `report-generator` | 19.199999999953434 ms | 313 ms | 332.19999999995343 ms |
| `cohort-growth` | 17 ms | 282 ms | 299 ms |
| `progress-analysis` | 57.59999999997672 ms | 239 ms | 296.5999999999767 ms |
| `subject-balance` | 27.400000000023283 ms | 266 ms | 293.4000000000233 ms |
| `correlation-analysis` | 17.5 ms | 257 ms | 274.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ee093bec2e4c` | 24818 ms | 6754 ms | 2 ms | 0 | 54 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
