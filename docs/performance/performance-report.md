# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `e88b660de44c`
- Recorded at: 2026-07-28T09:49:31.526Z
- Total smoke time: 29430 ms (-2100 ms vs previous)
- Login: 6133 ms
- App ready: 86 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 42.59999999999127 ms | 1425 ms | 1467.5999999999913 ms |
| `analysis` | 39.90000000000873 ms | 869 ms | 908.9000000000087 ms |
| `student-overview` | 29.30000000000291 ms | 848 ms | 877.3000000000029 ms |
| `seat-adjustment` | 36.19999999999709 ms | 798 ms | 834.1999999999971 ms |
| `report-generator` | 13.400000000008731 ms | 707 ms | 720.4000000000087 ms |
| `teacher-township-ranking` | 3.900000000008731 ms | 600 ms | 603.9000000000087 ms |
| `subject-balance` | 25.10000000000582 ms | 559 ms | 584.1000000000058 ms |
| `county-teacher-portrait` | 19.80000000000291 ms | 513 ms | 532.8000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `e88b660de44c` | 29430 ms | 6133 ms | 86 ms | 0 | 0 | 0 |
| `a95a5b1bb7c3` | 31530 ms | 7359 ms | 116 ms | 0 | 0 | 0 |
| `21af61136c7e` | 22857 ms | 4577 ms | 128 ms | 0 | 0 | 0 |
| `d0a432c00594` | 30684 ms | 6080 ms | 14 ms | 0 | 0 | 0 |
| `85c7834a8faa` | 30334 ms | 6821 ms | 12 ms | 0 | 0 | 0 |
| `c172df95375b` | 30578 ms | 6732 ms | 104 ms | 0 | 0 | 0 |
| `36f1e54d3545` | 23158 ms | 5453 ms | 3 ms | 0 | 0 | 0 |
| `7d071bba84aa` | 31063 ms | 5424 ms | 103 ms | 0 | 0 | 0 |
| `0f07eb09c46e` | 30303 ms | 6498 ms | 194 ms | 0 | 0 | 0 |
| `988c98f3702a` | 30456 ms | 7120 ms | 81 ms | 0 | 0 | 0 |
| `0e68f00d44a9` | 32522 ms | 7491 ms | 77 ms | 0 | 0 | 0 |
| `a6c8e5c25eb2` | 30435 ms | 7082 ms | 224 ms | 0 | 0 | 0 |
| `582cf06ad889` | 32291 ms | 6432 ms | 105 ms | 0 | 0 | 0 |
| `c8ff54e2cdfa` | 31622 ms | 6229 ms | 108 ms | 0 | 0 | 0 |
| `8c13d5a98bb7` | 31984 ms | 6653 ms | 14 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
