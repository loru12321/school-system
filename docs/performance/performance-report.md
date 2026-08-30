# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `284c3cacee04`
- Recorded at: 2026-08-30T08:13:47.603Z
- Total smoke time: 19400 ms (+378 ms vs previous)
- Login: 2636 ms
- App ready: 1038 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 68, max end-to-end 136.5 ms, max derived network wait 6.8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 32.699999999953434 ms | 679 ms | 711.6999999999534 ms |
| `student-overview` | 32 ms | 477 ms | 509 ms |
| `freshman-simulator` | 57 ms | 422 ms | 479 ms |
| `report-generator` | 14.900000000023283 ms | 369 ms | 383.9000000000233 ms |
| `subject-balance` | 27.599999999976717 ms | 322 ms | 349.5999999999767 ms |
| `exam-arranger` | 11.599999999976717 ms | 334 ms | 345.5999999999767 ms |
| `cohort-growth` | 13.700000000011642 ms | 304 ms | 317.70000000001164 ms |
| `correlation-analysis` | 14.400000000023283 ms | 182 ms | 196.40000000002328 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `284c3cacee04` | 19400 ms | 2636 ms | 1038 ms | 0 | 68 | 0 | 0 |
| `fa01057e82fd` | 19022 ms | 2247 ms | 1068 ms | 0 | 62 | 0 | 0 |
| `6ebdb6afe76a` | 19676 ms | 2524 ms | 1124 ms | 0 | 68 | 0 | 0 |
| `396276c5274f` | 19182 ms | 2258 ms | 1036 ms | 0 | 68 | 0 | 0 |
| `6088e429c181` | 19973 ms | 2866 ms | 1059 ms | 0 | 69 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
