# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b30c3b11ce02`
- Recorded at: 2026-11-22T03:22:53.090Z
- Total smoke time: 25388 ms (+3642 ms vs previous)
- Login: 8350 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 58, max end-to-end 58.5 ms, max derived network wait 6.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 13.89999999999418 ms | 1333 ms | 1346.8999999999942 ms |
| `student-overview` | 32.60000000000582 ms | 467 ms | 499.6000000000058 ms |
| `report-generator` | 15.799999999988358 ms | 356 ms | 371.79999999998836 ms |
| `freshman-simulator` | 68.79999999998836 ms | 294 ms | 362.79999999998836 ms |
| `progress-analysis` | 74 ms | 256 ms | 330 ms |
| `cohort-growth` | 19.5 ms | 288 ms | 307.5 ms |
| `subject-balance` | 29.300000000017462 ms | 262 ms | 291.30000000001746 ms |
| `exam-arranger` | 1.1999999999825377 ms | 252 ms | 253.19999999998254 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `9b0d40113938` | 24540 ms | 6893 ms | 8 ms | 0 | 58 | 0 | 0 |
| `0853d67b418b` | 21516 ms | 6343 ms | 2 ms | 0 | 59 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
