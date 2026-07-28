# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `8c13d5a98bb7`
- Recorded at: 2026-07-28T01:05:51.122Z
- Total smoke time: 31984 ms (-277 ms vs previous)
- Login: 6653 ms
- App ready: 14 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 36.60000000000582 ms | 1645 ms | 1681.6000000000058 ms |
| `student-overview` | 41.5 ms | 1071 ms | 1112.5 ms |
| `seat-adjustment` | 45.10000000000582 ms | 957 ms | 1002.1000000000058 ms |
| `analysis` | 39.79999999998836 ms | 870 ms | 909.7999999999884 ms |
| `teacher-township-ranking` | 3.1000000000058208 ms | 828 ms | 831.1000000000058 ms |
| `progress-analysis` | 45.19999999998254 ms | 705 ms | 750.1999999999825 ms |
| `report-generator` | 15.200000000011642 ms | 645 ms | 660.2000000000116 ms |
| `subject-balance` | 45.79999999998836 ms | 514 ms | 559.7999999999884 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `8c13d5a98bb7` | 31984 ms | 6653 ms | 14 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
