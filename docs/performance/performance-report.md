# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `6d54d4f51ae6`
- Recorded at: 2026-07-17T09:13:49.459Z
- Total smoke time: 28811 ms (+478 ms vs previous)
- Login: 6389 ms
- App ready: 5 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 54.10000000000582 ms | 1054 ms | 1108.1000000000058 ms |
| `upload` | 78.20000000001164 ms | 903 ms | 981.2000000000116 ms |
| `teacher-analysis` | 48.70000000001164 ms | 800 ms | 848.7000000000116 ms |
| `student-overview` | 66.10000000000582 ms | 634 ms | 700.1000000000058 ms |
| `subject-balance` | 40.5 ms | 652 ms | 692.5 ms |
| `teacher-township-ranking` | 15.200000000011642 ms | 635 ms | 650.2000000000116 ms |
| `analysis` | 16 ms | 608 ms | 624 ms |
| `progress-analysis` | 24.20000000001164 ms | 568 ms | 592.2000000000116 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `6d54d4f51ae6` | 28811 ms | 6389 ms | 5 ms | 0 | 0 | 0 |
| `33bd40e8566b` | 28333 ms | 7952 ms | 8 ms | 0 | 0 | 0 |
| `9a34eefffe30` | 28656 ms | 6392 ms | 6 ms | 0 | 0 | 0 |
| `fd6de82dbe00` | 23306 ms | 4573 ms | 56 ms | 0 | 0 | 0 |
| `be32009a8374` | 31084 ms | 6361 ms | 9 ms | 0 | 0 | 0 |
| `bbe09329e51b` | 29277 ms | 7198 ms | 9 ms | 1 | 0 | 0 |
| `acf51a71e2c9` | 30563 ms | 7717 ms | 42 ms | 0 | 0 | 0 |
| `d0e10a2c36ad` | 29833 ms | 6976 ms | 6 ms | 0 | 0 | 0 |
| `9ff53c8b16a6` | 29220 ms | 8075 ms | 6 ms | 0 | 0 | 0 |
| `4026ee74e5f6` | 29144 ms | 6702 ms | 91 ms | 0 | 0 | 0 |
| `d201c4ad754e` | 28897 ms | 5988 ms | 12 ms | 0 | 0 | 0 |
| `c720ac6986d4` | 24866 ms | 5326 ms | 39 ms | 0 | 0 | 0 |
| `1c50d7adb558` | 31116 ms | 6993 ms | 107 ms | 0 | 0 | 0 |
| `5e988082b308` | 28016 ms | 6515 ms | 88 ms | 0 | 0 | 0 |
| `e1a4568d9d38` | 26469 ms | 6491 ms | 307 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
