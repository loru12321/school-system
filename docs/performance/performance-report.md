# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `a6c8e5c25eb2`
- Recorded at: 2026-07-28T03:20:34.335Z
- Total smoke time: 30435 ms (-1856 ms vs previous)
- Login: 7082 ms
- App ready: 224 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 42.30000000000291 ms | 1659 ms | 1701.300000000003 ms |
| `analysis` | 48.10000000000582 ms | 975 ms | 1023.1000000000058 ms |
| `seat-adjustment` | 31.60000000000582 ms | 944 ms | 975.6000000000058 ms |
| `teacher-township-ranking` | 8.89999999999418 ms | 889 ms | 897.8999999999942 ms |
| `student-overview` | 23.39999999999418 ms | 798 ms | 821.3999999999942 ms |
| `progress-analysis` | 40.59999999999127 ms | 666 ms | 706.5999999999913 ms |
| `report-generator` | 11.30000000000291 ms | 663 ms | 674.3000000000029 ms |
| `county-teacher-portrait` | 23.89999999999418 ms | 523 ms | 546.8999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `a6c8e5c25eb2` | 30435 ms | 7082 ms | 224 ms | 0 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
