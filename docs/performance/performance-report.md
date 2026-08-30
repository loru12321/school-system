# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `c497ce4aa276`
- Recorded at: 2026-08-30T06:55:37.001Z
- Total smoke time: 21599 ms (-207 ms vs previous)
- Login: 2288 ms
- App ready: 1085 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 60, max end-to-end 192.4 ms, max derived network wait 8.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 64 ms | 855 ms | 919 ms |
| `subject-balance` | 64 ms | 461 ms | 525 ms |
| `student-overview` | 39.89999999999418 ms | 478 ms | 517.8999999999942 ms |
| `freshman-simulator` | 103.79999999998836 ms | 362 ms | 465.79999999998836 ms |
| `report-generator` | 18 ms | 442 ms | 460 ms |
| `cohort-growth` | 19.59999999999127 ms | 352 ms | 371.59999999999127 ms |
| `progress-analysis` | 96.5 ms | 268 ms | 364.5 ms |
| `exam-arranger` | 1.0999999999912689 ms | 349 ms | 350.09999999999127 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `c497ce4aa276` | 21599 ms | 2288 ms | 1085 ms | 0 | 60 | 0 | 0 |
| `1983b7334100` | 21806 ms | 2612 ms | 1026 ms | 0 | 61 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
