# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `6c6b7bd3d76a`
- Recorded at: 2026-07-28T10:36:41.704Z
- Total smoke time: 25096 ms (-6108 ms vs previous)
- Login: 5014 ms
- App ready: 17 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 45.10000000000582 ms | 1215 ms | 1260.1000000000058 ms |
| `analysis` | 41.89999999999418 ms | 784 ms | 825.8999999999942 ms |
| `student-overview` | 23.10000000000582 ms | 673 ms | 696.1000000000058 ms |
| `seat-adjustment` | 41.09999999999127 ms | 650 ms | 691.0999999999913 ms |
| `progress-analysis` | 40.59999999999127 ms | 636 ms | 676.5999999999913 ms |
| `report-generator` | 12.799999999988358 ms | 483 ms | 495.79999999998836 ms |
| `teacher-township-ranking` | 3.099999999991269 ms | 476 ms | 479.09999999999127 ms |
| `county-teacher-portrait` | 15 ms | 437 ms | 452 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `6c6b7bd3d76a` | 25096 ms | 5014 ms | 17 ms | 0 | 0 | 0 |
| `41f24f60531e` | 31204 ms | 5790 ms | 203 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
