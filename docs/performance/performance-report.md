# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7569f10964ab`
- Recorded at: 2026-07-27T23:43:12.356Z
- Total smoke time: 29130 ms (+4768 ms vs previous)
- Login: 7009 ms
- App ready: 67 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `starter-hub` | 45.70000000001164 ms | 1716 ms | 1761.7000000000116 ms |
| `teacher-analysis` | 53 ms | 1411 ms | 1464 ms |
| `analysis` | 46.40000000000873 ms | 920 ms | 966.4000000000087 ms |
| `seat-adjustment` | 44.90000000000873 ms | 877 ms | 921.9000000000087 ms |
| `teacher-township-ranking` | 2.7000000000116415 ms | 827 ms | 829.7000000000116 ms |
| `report-generator` | 17 ms | 810 ms | 827 ms |
| `student-overview` | 55.59999999999127 ms | 563 ms | 618.5999999999913 ms |
| `progress-analysis` | 41.90000000000873 ms | 523 ms | 564.9000000000087 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `bf6748f3d345` | 30720 ms | 6019 ms | 110 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
