# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c416523e8ac8`
- Recorded at: 2026-07-18T07:53:56.753Z
- Total smoke time: 32726 ms (+1611 ms vs previous)
- Login: 6799 ms
- App ready: 10 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-township-ranking` | 6 ms | 2086 ms | 2092 ms |
| `teacher-analysis` | 36.5 ms | 2045 ms | 2081.5 ms |
| `seat-adjustment` | 41.09999999999127 ms | 1067 ms | 1108.0999999999913 ms |
| `progress-analysis` | 74.69999999999709 ms | 901 ms | 975.6999999999971 ms |
| `report-generator` | 16.80000000000291 ms | 958 ms | 974.8000000000029 ms |
| `student-overview` | 11.200000000011642 ms | 711 ms | 722.2000000000116 ms |
| `analysis` | 8.89999999999418 ms | 649 ms | 657.8999999999942 ms |
| `indicator` | 57.39999999999418 ms | 591 ms | 648.3999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `c416523e8ac8` | 32726 ms | 6799 ms | 10 ms | 0 | 0 | 0 |
| `fcce7d0df097` | 31115 ms | 6417 ms | 49 ms | 0 | 0 | 0 |
| `3586c77e396e` | 32669 ms | 6867 ms | 84 ms | 0 | 0 | 0 |
| `6806ed45609c` | 29309 ms | 5816 ms | 10 ms | 0 | 0 | 0 |
| `c3026831b94c` | 31941 ms | 6989 ms | 9 ms | 0 | 0 | 0 |
| `532a3b830020` | 34301 ms | 7057 ms | 10 ms | 0 | 0 | 0 |
| `c3d020f3c49c` | 25258 ms | 4723 ms | 60 ms | 0 | 0 | 0 |
| `6d54d4f51ae6` | 28811 ms | 6389 ms | 5 ms | 0 | 0 | 0 |
| `33bd40e8566b` | 28333 ms | 7952 ms | 8 ms | 0 | 0 | 0 |
| `9a34eefffe30` | 28656 ms | 6392 ms | 6 ms | 0 | 0 | 0 |
| `fd6de82dbe00` | 23306 ms | 4573 ms | 56 ms | 0 | 0 | 0 |
| `be32009a8374` | 31084 ms | 6361 ms | 9 ms | 0 | 0 | 0 |
| `bbe09329e51b` | 29277 ms | 7198 ms | 9 ms | 1 | 0 | 0 |
| `acf51a71e2c9` | 30563 ms | 7717 ms | 42 ms | 0 | 0 | 0 |
| `d0e10a2c36ad` | 29833 ms | 6976 ms | 6 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
