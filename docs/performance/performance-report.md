# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7d071bba84aa`
- Recorded at: 2026-07-28T05:24:36.963Z
- Total smoke time: 31063 ms (+760 ms vs previous)
- Login: 5424 ms
- App ready: 103 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 52.30000000000291 ms | 1703 ms | 1755.300000000003 ms |
| `seat-adjustment` | 74.80000000000291 ms | 869 ms | 943.8000000000029 ms |
| `progress-analysis` | 48 ms | 819 ms | 867 ms |
| `teacher-township-ranking` | 2.5 ms | 857 ms | 859.5 ms |
| `student-overview` | 23.69999999999709 ms | 805 ms | 828.6999999999971 ms |
| `analysis` | 61.40000000000873 ms | 697 ms | 758.4000000000087 ms |
| `report-generator` | 17.40000000000873 ms | 584 ms | 601.4000000000087 ms |
| `indicator` | 20.59999999999127 ms | 500 ms | 520.5999999999913 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `844bf654595e` | 33930 ms | 6964 ms | 4 ms | 0 | 0 | 0 |
| `fbbbd197f6a6` | 30173 ms | 6017 ms | 112 ms | 0 | 0 | 0 |
| `7b1221233932` | 35289 ms | 6208 ms | 115 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
