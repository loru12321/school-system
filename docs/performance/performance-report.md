# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `010ad2f5cf80`
- Recorded at: 2026-08-30T11:13:18.491Z
- Total smoke time: 21763 ms (-558 ms vs previous)
- Login: 2938 ms
- App ready: 1012 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 189.6 ms, max derived network wait 7.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 49.90000000000873 ms | 805 ms | 854.9000000000087 ms |
| `freshman-simulator` | 72.69999999999709 ms | 572 ms | 644.6999999999971 ms |
| `student-overview` | 50.60000000000582 ms | 522 ms | 572.6000000000058 ms |
| `subject-balance` | 44.69999999999709 ms | 415 ms | 459.6999999999971 ms |
| `report-generator` | 17.60000000000582 ms | 411 ms | 428.6000000000058 ms |
| `cohort-growth` | 17.30000000000291 ms | 370 ms | 387.3000000000029 ms |
| `exam-arranger` | 19.80000000000291 ms | 347 ms | 366.8000000000029 ms |
| `progress-analysis` | 61.10000000000582 ms | 226 ms | 287.1000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `010ad2f5cf80` | 21763 ms | 2938 ms | 1012 ms | 0 | 62 | 0 | 0 |
| `1a502dd07262` | 22321 ms | 3880 ms | 1098 ms | 0 | 64 | 0 | 0 |
| `58d5097a4790` | 21407 ms | 2761 ms | 1034 ms | 0 | 64 | 0 | 0 |
| `ecb56dd98be3` | 21818 ms | 2665 ms | 1026 ms | 0 | 67 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
