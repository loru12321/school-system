# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `13902f0b2831`
- Recorded at: 2026-07-28T00:20:01.814Z
- Total smoke time: 32261 ms (+3131 ms vs previous)
- Login: 6364 ms
- App ready: 190 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 80.29999999998836 ms | 1852 ms | 1932.2999999999884 ms |
| `analysis` | 50.40000000002328 ms | 984 ms | 1034.4000000000233 ms |
| `seat-adjustment` | 48.90000000002328 ms | 946 ms | 994.9000000000233 ms |
| `student-overview` | 25.70000000001164 ms | 866 ms | 891.7000000000116 ms |
| `teacher-township-ranking` | 5.100000000005821 ms | 854 ms | 859.1000000000058 ms |
| `report-generator` | 15.89999999999418 ms | 716 ms | 731.8999999999942 ms |
| `county-teacher-portrait` | 21 ms | 524 ms | 545 ms |
| `subject-balance` | 30.5 ms | 485 ms | 515.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `13902f0b2831` | 32261 ms | 6364 ms | 190 ms | 0 | 0 | 0 |
| `7569f10964ab` | 29130 ms | 7009 ms | 67 ms | 0 | 0 | 0 |
| `6f074373881d` | 24362 ms | 5543 ms | 23 ms | 0 | 0 | 0 |
| `980174581551` | 28491 ms | 5258 ms | 14 ms | 0 | 0 | 0 |
| `844bf654595e` | 33930 ms | 6964 ms | 4 ms | 0 | 0 | 0 |
| `fbbbd197f6a6` | 30173 ms | 6017 ms | 112 ms | 0 | 0 | 0 |
| `7b1221233932` | 35289 ms | 6208 ms | 115 ms | 0 | 0 | 0 |
| `4c8befffbafe` | 29139 ms | 5502 ms | 7 ms | 0 | 0 | 0 |
| `19cb7ffa4b94` | 31202 ms | 6296 ms | 7 ms | 0 | 0 | 0 |
| `60c6b7d71108` | 29706 ms | 6464 ms | 112 ms | 0 | 0 | 0 |
| `a040600ea190` | 29815 ms | 7251 ms | 189 ms | 0 | 0 | 0 |
| `b46765e47b61` | 31143 ms | 6334 ms | 17 ms | 0 | 0 | 0 |
| `fea9fdd61441` | 31359 ms | 6425 ms | 9 ms | 0 | 0 | 0 |
| `6ec525149f8e` | 29568 ms | 6149 ms | 5 ms | 0 | 0 | 0 |
| `a674b8c17958` | 30795 ms | 7538 ms | 188 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
