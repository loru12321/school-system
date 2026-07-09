# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `eb2485edbcc1`
- Recorded at: 2026-07-09T14:57:22.542Z
- Total smoke time: 39998 ms (+1465 ms vs previous)
- Login: 8312 ms
- App ready: 336 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `student-details` | 68 ms | 4077 ms | 4145 ms |
| `starter-hub` | 429 ms | 1633 ms | 2062 ms |
| `cohort-growth` | 949 ms | 805 ms | 1754 ms |
| `potential-analysis` | 997 ms | 45 ms | 1042 ms |
| `subject-balance` | 241 ms | 558 ms | 799 ms |
| `student-overview` | 238 ms | 493 ms | 731 ms |
| `report-generator` | 226 ms | 470 ms | 696 ms |
| `progress-analysis` | 470 ms | 161 ms | 631 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `eb2485edbcc1` | 39998 ms | 8312 ms | 336 ms | 0 | 0 | 0 |
| `7c951f6db428` | 38533 ms | 7454 ms | 335 ms | 0 | 0 | 0 |
| `d060942e4922` | 37997 ms | 6192 ms | 806 ms | 0 | 0 | 0 |
| `1290e3f6c556` | 38562 ms | 9821 ms | 87 ms | 0 | 0 | 0 |
| `e4de46f5002e` | 37658 ms | 6855 ms | 895 ms | 0 | 0 | 0 |
| `520364d4c1d0` | 27796 ms | 4240 ms | 57 ms | 0 | 0 | 0 |
| `4d6638892a9c` | 25441 ms | 4014 ms | 5 ms | 0 | 0 | 0 |
| `6aee08772fa3` | 47157 ms | 14844 ms | 944 ms | 0 | 0 | 0 |
| `61329cbea8e0` | 37883 ms | 7102 ms | 250 ms | 0 | 0 | 0 |
| `cf64a1c2a6f4` | 32482 ms | 5051 ms | 46 ms | 0 | 0 | 0 |
| `85686924c2ac` | 38201 ms | 6204 ms | 100 ms | 0 | 0 | 0 |
| `b9a2366a7fe3` | 33679 ms | 6766 ms | 125 ms | 0 | 0 | 0 |
| `1ed4ca96c29d` | 32415 ms | 6475 ms | 782 ms | 0 | 0 | 0 |
| `c04b5a2834fb` | 34588 ms | 6954 ms | 174 ms | 0 | 0 | 0 |
| `bbd20dcf9166` | 36087 ms | 7301 ms | 9 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
