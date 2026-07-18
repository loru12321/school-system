# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `6806ed45609c`
- Recorded at: 2026-07-18T00:40:52.564Z
- Total smoke time: 29309 ms (-2632 ms vs previous)
- Login: 5816 ms
- App ready: 10 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 48.19999999999709 ms | 1813 ms | 1861.199999999997 ms |
| `progress-analysis` | 78.5 ms | 886 ms | 964.5 ms |
| `analysis` | 55.80000000000291 ms | 906 ms | 961.8000000000029 ms |
| `report-generator` | 26.30000000000291 ms | 909 ms | 935.3000000000029 ms |
| `seat-adjustment` | 53.39999999999418 ms | 867 ms | 920.3999999999942 ms |
| `indicator` | 34.59999999999127 ms | 688 ms | 722.5999999999913 ms |
| `correlation-analysis` | 27.20000000001164 ms | 681 ms | 708.2000000000116 ms |
| `student-overview` | 40.5 ms | 561 ms | 601.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `9ff53c8b16a6` | 29220 ms | 8075 ms | 6 ms | 0 | 0 | 0 |
| `4026ee74e5f6` | 29144 ms | 6702 ms | 91 ms | 0 | 0 | 0 |
| `d201c4ad754e` | 28897 ms | 5988 ms | 12 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
