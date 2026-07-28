# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `582cf06ad889`
- Recorded at: 2026-07-28T02:39:08.286Z
- Total smoke time: 32291 ms (+669 ms vs previous)
- Login: 6432 ms
- App ready: 105 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 51.40000000002328 ms | 1600 ms | 1651.4000000000233 ms |
| `seat-adjustment` | 60.399999999965075 ms | 884 ms | 944.3999999999651 ms |
| `student-overview` | 32.09999999997672 ms | 904 ms | 936.0999999999767 ms |
| `teacher-township-ranking` | 2.7000000000116415 ms | 773 ms | 775.7000000000116 ms |
| `progress-analysis` | 53.5 ms | 680 ms | 733.5 ms |
| `analysis` | 59.20000000001164 ms | 647 ms | 706.2000000000116 ms |
| `report-generator` | 13.799999999988358 ms | 648 ms | 661.7999999999884 ms |
| `subject-balance` | 46 ms | 560 ms | 606 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `582cf06ad889` | 32291 ms | 6432 ms | 105 ms | 0 | 0 | 0 |
| `c8ff54e2cdfa` | 31622 ms | 6229 ms | 108 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
