# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `71d42f773ada`
- Recorded at: 2026-07-28T10:56:07.585Z
- Total smoke time: 24588 ms (-508 ms vs previous)
- Login: 4670 ms
- App ready: 41 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 54.69999999999709 ms | 804 ms | 858.6999999999971 ms |
| `student-overview` | 43.5 ms | 701 ms | 744.5 ms |
| `report-generator` | 13.30000000000291 ms | 689 ms | 702.3000000000029 ms |
| `freshman-simulator` | 51.80000000000291 ms | 417 ms | 468.8000000000029 ms |
| `subject-balance` | 28.89999999999418 ms | 423 ms | 451.8999999999942 ms |
| `teacher-analysis` | 48.70000000001164 ms | 399 ms | 447.70000000001164 ms |
| `grade-scheduler` | 26 ms | 403 ms | 429 ms |
| `exam-arranger` | 9.900000000008731 ms | 351 ms | 360.90000000000873 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `71d42f773ada` | 24588 ms | 4670 ms | 41 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
