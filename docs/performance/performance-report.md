# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `bb6db0dddc6e`
- Recorded at: 2026-07-28T12:47:09.060Z
- Total smoke time: 25272 ms (+1067 ms vs previous)
- Login: 5201 ms
- App ready: 20 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `progress-analysis` | 57.70000000001164 ms | 836 ms | 893.7000000000116 ms |
| `student-overview` | 27.900000000023283 ms | 642 ms | 669.9000000000233 ms |
| `report-generator` | 12.099999999976717 ms | 652 ms | 664.0999999999767 ms |
| `cohort-growth` | 15.700000000011642 ms | 576 ms | 591.7000000000116 ms |
| `subject-balance` | 37.89999999999418 ms | 527 ms | 564.8999999999942 ms |
| `teacher-township-ranking` | 6.7000000000116415 ms | 523 ms | 529.7000000000116 ms |
| `freshman-simulator` | 51.10000000000582 ms | 422 ms | 473.1000000000058 ms |
| `grade-scheduler` | 28.60000000000582 ms | 414 ms | 442.6000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `bb6db0dddc6e` | 25272 ms | 5201 ms | 20 ms | 0 | 0 | 0 |
| `dfc2e6d479be` | 24205 ms | 4813 ms | 12 ms | 0 | 0 | 0 |
| `d0755a9cf3cc` | 22818 ms | 4661 ms | 18 ms | 0 | 0 | 0 |
| `6d5c10e71888` | 25733 ms | 5326 ms | 353 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
