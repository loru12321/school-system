# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `33bd40e8566b`
- Recorded at: 2026-07-17T09:08:30.527Z
- Total smoke time: 28333 ms (-323 ms vs previous)
- Login: 7952 ms
- App ready: 8 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 50.10000000000582 ms | 1646 ms | 1696.1000000000058 ms |
| `report-generator` | 11 ms | 912 ms | 923 ms |
| `student-overview` | 49 ms | 643 ms | 692 ms |
| `analysis` | 8.89999999999418 ms | 524 ms | 532.8999999999942 ms |
| `subject-balance` | 31.5 ms | 499 ms | 530.5 ms |
| `teacher-township-ranking` | 3.3999999999941792 ms | 517 ms | 520.3999999999942 ms |
| `freshman-simulator` | 54.09999999997672 ms | 426 ms | 480.0999999999767 ms |
| `grade-scheduler` | 33.69999999998254 ms | 443 ms | 476.69999999998254 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `89a979a363bd` | 25787 ms | 6174 ms | 80 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
