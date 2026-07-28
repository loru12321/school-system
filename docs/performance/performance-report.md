# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `85c7834a8faa`
- Recorded at: 2026-07-28T06:27:33.222Z
- Total smoke time: 30334 ms (-244 ms vs previous)
- Login: 6821 ms
- App ready: 12 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 85.39999999999418 ms | 1428 ms | 1513.3999999999942 ms |
| `student-overview` | 37.70000000001164 ms | 1081 ms | 1118.7000000000116 ms |
| `teacher-township-ranking` | 2.2999999999883585 ms | 818 ms | 820.2999999999884 ms |
| `report-generator` | 16 ms | 766 ms | 782 ms |
| `progress-analysis` | 50 ms | 716 ms | 766 ms |
| `subject-balance` | 39.39999999999418 ms | 525 ms | 564.3999999999942 ms |
| `potential-analysis` | 61.19999999999709 ms | 493 ms | 554.1999999999971 ms |
| `county-teacher-portrait` | 23.09999999999127 ms | 492 ms | 515.0999999999913 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `85c7834a8faa` | 30334 ms | 6821 ms | 12 ms | 0 | 0 | 0 |
| `c172df95375b` | 30578 ms | 6732 ms | 104 ms | 0 | 0 | 0 |
| `36f1e54d3545` | 23158 ms | 5453 ms | 3 ms | 0 | 0 | 0 |
| `7d071bba84aa` | 31063 ms | 5424 ms | 103 ms | 0 | 0 | 0 |
| `0f07eb09c46e` | 30303 ms | 6498 ms | 194 ms | 0 | 0 | 0 |
| `988c98f3702a` | 30456 ms | 7120 ms | 81 ms | 0 | 0 | 0 |
| `0e68f00d44a9` | 32522 ms | 7491 ms | 77 ms | 0 | 0 | 0 |
| `a6c8e5c25eb2` | 30435 ms | 7082 ms | 224 ms | 0 | 0 | 0 |
| `582cf06ad889` | 32291 ms | 6432 ms | 105 ms | 0 | 0 | 0 |
| `c8ff54e2cdfa` | 31622 ms | 6229 ms | 108 ms | 0 | 0 | 0 |
| `8c13d5a98bb7` | 31984 ms | 6653 ms | 14 ms | 0 | 0 | 0 |
| `13902f0b2831` | 32261 ms | 6364 ms | 190 ms | 0 | 0 | 0 |
| `7569f10964ab` | 29130 ms | 7009 ms | 67 ms | 0 | 0 | 0 |
| `6f074373881d` | 24362 ms | 5543 ms | 23 ms | 0 | 0 | 0 |
| `980174581551` | 28491 ms | 5258 ms | 14 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
