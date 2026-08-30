# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7ebb3d03bbc4`
- Recorded at: 2026-08-30T09:23:11.440Z
- Total smoke time: 22446 ms (-634 ms vs previous)
- Login: 3068 ms
- App ready: 1133 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 67, max end-to-end 84.6 ms, max derived network wait 5.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 42.80000000000291 ms | 792 ms | 834.8000000000029 ms |
| `student-overview` | 49.60000000000582 ms | 559 ms | 608.6000000000058 ms |
| `subject-balance` | 44.40000000000873 ms | 453 ms | 497.40000000000873 ms |
| `freshman-simulator` | 80.80000000000291 ms | 340 ms | 420.8000000000029 ms |
| `report-generator` | 20.5 ms | 371 ms | 391.5 ms |
| `progress-analysis` | 58 ms | 318 ms | 376 ms |
| `exam-arranger` | 25 ms | 349 ms | 374 ms |
| `cohort-growth` | 18.40000000000873 ms | 345 ms | 363.40000000000873 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `7ebb3d03bbc4` | 22446 ms | 3068 ms | 1133 ms | 0 | 67 | 0 | 0 |
| `ca86032b2989` | 23080 ms | 4272 ms | 1225 ms | 0 | 66 | 0 | 0 |
| `7528b21aca4c` | 21653 ms | 2607 ms | 1012 ms | 0 | 60 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
