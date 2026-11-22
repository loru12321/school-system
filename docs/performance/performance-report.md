# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ad5de2fcd0a1`
- Recorded at: 2026-11-22T04:24:13.237Z
- Total smoke time: 23660 ms (+1775 ms vs previous)
- Login: 6168 ms
- App ready: 2 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 56, max end-to-end 72.2 ms, max derived network wait 10.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 15.599999999976717 ms | 1615 ms | 1630.5999999999767 ms |
| `freshman-simulator` | 42.70000000001164 ms | 586 ms | 628.7000000000116 ms |
| `student-overview` | 44.60000000000582 ms | 486 ms | 530.6000000000058 ms |
| `subject-balance` | 36.60000000000582 ms | 279 ms | 315.6000000000058 ms |
| `report-generator` | 14.199999999982538 ms | 291 ms | 305.19999999998254 ms |
| `cohort-growth` | 13.700000000011642 ms | 262 ms | 275.70000000001164 ms |
| `progress-analysis` | 28.5 ms | 234 ms | 262.5 ms |
| `exam-arranger` | 21.10000000000582 ms | 236 ms | 257.1000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ad5de2fcd0a1` | 23660 ms | 6168 ms | 2 ms | 0 | 56 | 0 | 0 |
| `d8377d317cd2` | 21885 ms | 6285 ms | 2 ms | 0 | 61 | 0 | 0 |
| `b30c3b11ce02` | 25388 ms | 8350 ms | 4 ms | 0 | 58 | 0 | 0 |
| `ccac6beb8719` | 21746 ms | 6312 ms | 2 ms | 0 | 58 | 0 | 0 |
| `c6120f55ebd5` | 21509 ms | 6460 ms | 3 ms | 0 | 64 | 0 | 0 |
| `cb1d9c28652e` | 21337 ms | 6682 ms | 2 ms | 0 | 67 | 0 | 0 |
| `b73e495d78f1` | 24211 ms | 8317 ms | 8 ms | 0 | 58 | 0 | 0 |
| `5e50dbb0020f` | 22487 ms | 6651 ms | 1 ms | 0 | 55 | 0 | 0 |
| `4550809f303a` | 21528 ms | 6762 ms | 2 ms | 0 | 62 | 0 | 0 |
| `11731faf0797` | 20289 ms | 4965 ms | 6 ms | 0 | 60 | 0 | 0 |
| `ee093bec2e4c` | 24818 ms | 6754 ms | 2 ms | 0 | 54 | 0 | 0 |
| `ee656d49dea8` | 24703 ms | 6372 ms | 4 ms | 0 | 55 | 0 | 0 |
| `1751463d2efd` | 24611 ms | 7044 ms | 3 ms | 0 | 61 | 0 | 0 |
| `d16135dc7528` | 25192 ms | 7124 ms | 3 ms | 0 | 63 | 0 | 0 |
| `9cb24d6aead9` | 20318 ms | 5331 ms | 2 ms | 0 | 66 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
