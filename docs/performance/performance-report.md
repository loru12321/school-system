# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `1290e3f6c556`
- Recorded at: 2026-07-09T12:55:44.983Z
- Total smoke time: 38562 ms (+904 ms vs previous)
- Login: 9821 ms
- App ready: 87 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `student-details` | 171 ms | 3731 ms | 3902 ms |
| `audio-debug` | 3607 ms | 20 ms | 3627 ms |
| `starter-hub` | 1630 ms | 127 ms | 1757 ms |
| `cohort-growth` | 234 ms | 1127 ms | 1361 ms |
| `student-overview` | 254 ms | 492 ms | 746 ms |
| `report-generator` | 201 ms | 478 ms | 679 ms |
| `subject-balance` | 218 ms | 425 ms | 643 ms |
| `potential-analysis` | 589 ms | 5 ms | 594 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `35773813a657` | 37703 ms | 7562 ms | 344 ms | 0 | 0 | 0 |
| `6f1d41f295f0` | 40386 ms | 6196 ms | 82 ms | 2 | 0 | 0 |
| `4f4d8ae6250e` | 40005 ms | 12629 ms | 423 ms | 2 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
