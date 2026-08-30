# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `fd48304b73d7`
- Recorded at: 2026-08-30T05:07:29.134Z
- Total smoke time: 23162 ms (+1690 ms vs previous)
- Login: 2785 ms
- App ready: 1022 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 69, max end-to-end 198 ms, max derived network wait 9.8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 43.89999999999418 ms | 823 ms | 866.8999999999942 ms |
| `freshman-simulator` | 85.69999999999709 ms | 552 ms | 637.6999999999971 ms |
| `student-overview` | 48.70000000001164 ms | 524 ms | 572.7000000000116 ms |
| `subject-balance` | 57.19999999999709 ms | 477 ms | 534.1999999999971 ms |
| `report-generator` | 34.90000000000873 ms | 435 ms | 469.90000000000873 ms |
| `cohort-growth` | 26.69999999999709 ms | 366 ms | 392.6999999999971 ms |
| `exam-arranger` | 33.30000000000291 ms | 356 ms | 389.3000000000029 ms |
| `progress-analysis` | 73.69999999999709 ms | 225 ms | 298.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `2d1a0fb7c9c0` | 22068 ms | 2329 ms | 1024 ms | 0 | 60 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
