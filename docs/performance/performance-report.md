# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ead744659d2d`
- Recorded at: 2026-08-23T12:26:48.024Z
- Total smoke time: 20857 ms (-911 ms vs previous)
- Login: 2515 ms
- App ready: 1040 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 190.4 ms, max derived network wait 5.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 26.20000000006985 ms | 747 ms | 773.2000000000698 ms |
| `subject-balance` | 36.300000000046566 ms | 497 ms | 533.3000000000466 ms |
| `student-overview` | 34 ms | 479 ms | 513 ms |
| `cohort-growth` | 11.400000000023283 ms | 383 ms | 394.4000000000233 ms |
| `report-generator` | 11.099999999976717 ms | 368 ms | 379.0999999999767 ms |
| `freshman-simulator` | 66 ms | 307 ms | 373 ms |
| `exam-arranger` | 1 ms | 342 ms | 343 ms |
| `progress-analysis` | 55 ms | 196 ms | 251 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ead744659d2d` | 20857 ms | 2515 ms | 1040 ms | 0 | 70 | 0 | 0 |
| `94729a67d133` | 21768 ms | 2207 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `cbaa222490aa` | 18970 ms | 2666 ms | 1023 ms | 0 | 73 | 0 | 0 |
| `c7d1cf5eea79` | 18768 ms | 2280 ms | 1007 ms | 0 | 70 | 0 | 0 |
| `dd63dd8aec68` | 21531 ms | 2352 ms | 1005 ms | 0 | 66 | 0 | 0 |
| `d465f6f96d3d` | 18373 ms | 2244 ms | 1003 ms | 0 | 62 | 0 | 0 |
| `7d22361ff97c` | 20727 ms | 2737 ms | 1062 ms | 0 | 67 | 0 | 0 |
| `adbdf7f5aa25` | 20297 ms | 2943 ms | 1031 ms | 0 | 65 | 0 | 0 |
| `555607b85f0d` | 19568 ms | 3102 ms | 1119 ms | 0 | 72 | 0 | 0 |
| `4516c36a30cc` | 20385 ms | 2791 ms | 1006 ms | 0 | 67 | 0 | 0 |
| `43fd396da074` | 20604 ms | 3399 ms | 3 ms | 0 | 71 | 0 | 0 |
| `d185c74694b7` | 21550 ms | 3258 ms | 4 ms | 0 | 58 | 0 | 0 |
| `6cffbae8c0b9` | 18485 ms | 3000 ms | 2 ms | 0 | 69 | 0 | 0 |
| `42ce86fd21c6` | 22248 ms | 3662 ms | 3 ms | 0 | 61 | 0 | 0 |
| `59dc68065fc8` | 20966 ms | 4071 ms | 4 ms | 0 | 66 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
