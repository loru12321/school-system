# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `4b68d6c1eda4`
- Recorded at: 2026-08-30T05:33:43.481Z
- Total smoke time: 18946 ms (-4216 ms vs previous)
- Login: 2313 ms
- App ready: 1004 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 129.6 ms, max derived network wait 5.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 25.10000000000582 ms | 658 ms | 683.1000000000058 ms |
| `student-overview` | 22.59999999999127 ms | 462 ms | 484.59999999999127 ms |
| `freshman-simulator` | 60.19999999999709 ms | 379 ms | 439.1999999999971 ms |
| `exam-arranger` | 12.900000000008731 ms | 337 ms | 349.90000000000873 ms |
| `report-generator` | 16.80000000000291 ms | 317 ms | 333.8000000000029 ms |
| `cohort-growth` | 29.80000000000291 ms | 281 ms | 310.8000000000029 ms |
| `subject-balance` | 27.70000000001164 ms | 271 ms | 298.70000000001164 ms |
| `correlation-analysis` | 18.59999999999127 ms | 177 ms | 195.59999999999127 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `4b68d6c1eda4` | 18946 ms | 2313 ms | 1004 ms | 0 | 62 | 0 | 0 |
| `fd48304b73d7` | 23162 ms | 2785 ms | 1022 ms | 0 | 69 | 0 | 0 |
| `d7efe5b13a0e` | 21472 ms | 2114 ms | 1011 ms | 0 | 62 | 0 | 0 |
| `137eb18576e2` | 21288 ms | 2527 ms | 1061 ms | 0 | 62 | 0 | 0 |
| `599f8aaac207` | 21329 ms | 2902 ms | 1018 ms | 0 | 59 | 0 | 0 |
| `71323638dc7e` | 22686 ms | 2493 ms | 1012 ms | 0 | 63 | 0 | 0 |
| `444e3b92b267` | 21573 ms | 2012 ms | 1007 ms | 0 | 64 | 0 | 0 |
| `007fef382fcd` | 21776 ms | 2140 ms | 1066 ms | 0 | 70 | 0 | 0 |
| `69f591bdac2a` | 20750 ms | 2529 ms | 1046 ms | 0 | 61 | 0 | 0 |
| `8c204609b71a` | 21631 ms | 3071 ms | 1023 ms | 0 | 64 | 0 | 0 |
| `7d4650776aea` | 19374 ms | 2469 ms | 1006 ms | 0 | 66 | 0 | 0 |
| `5ca9a8297191` | 22730 ms | 3099 ms | 1013 ms | 0 | 62 | 0 | 0 |
| `2b2cd4f07bae` | 20199 ms | 2371 ms | 1022 ms | 0 | 63 | 0 | 0 |
| `3ecf2232279e` | 18920 ms | 2313 ms | 1005 ms | 0 | 68 | 0 | 0 |
| `1e579cfa0dcd` | 20977 ms | 2927 ms | 1012 ms | 0 | 59 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
