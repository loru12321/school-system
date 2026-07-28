# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0f07eb09c46e`
- Recorded at: 2026-07-28T04:58:46.570Z
- Total smoke time: 30303 ms (-153 ms vs previous)
- Login: 6498 ms
- App ready: 194 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 47.80000000001746 ms | 1402 ms | 1449.8000000000175 ms |
| `student-overview` | 46.39999999999418 ms | 1016 ms | 1062.3999999999942 ms |
| `analysis` | 48.20000000001164 ms | 931 ms | 979.2000000000116 ms |
| `progress-analysis` | 42.79999999998836 ms | 854 ms | 896.7999999999884 ms |
| `seat-adjustment` | 43 ms | 774 ms | 817 ms |
| `subject-balance` | 41.89999999999418 ms | 615 ms | 656.8999999999942 ms |
| `report-generator` | 15.89999999999418 ms | 592 ms | 607.8999999999942 ms |
| `teacher-township-ranking` | 4.300000000017462 ms | 592 ms | 596.3000000000175 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `4c8befffbafe` | 29139 ms | 5502 ms | 7 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
