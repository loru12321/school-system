# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ae2b526ea430`
- Recorded at: 2026-08-30T11:05:15.751Z
- Total smoke time: 22057 ms (-264 ms vs previous)
- Login: 3389 ms
- App ready: 1011 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 192.5 ms, max derived network wait 5.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 40.800000000046566 ms | 768 ms | 808.8000000000466 ms |
| `student-overview` | 68.30000000004657 ms | 547 ms | 615.3000000000466 ms |
| `freshman-simulator` | 80.40000000002328 ms | 517 ms | 597.4000000000233 ms |
| `report-generator` | 19.79999999998836 ms | 402 ms | 421.79999999998836 ms |
| `subject-balance` | 41.5 ms | 371 ms | 412.5 ms |
| `exam-arranger` | 1.7000000000116415 ms | 343 ms | 344.70000000001164 ms |
| `cohort-growth` | 18.79999999998836 ms | 324 ms | 342.79999999998836 ms |
| `progress-analysis` | 45.100000000034925 ms | 202 ms | 247.10000000003492 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ae2b526ea430` | 22057 ms | 3389 ms | 1011 ms | 0 | 65 | 0 | 0 |
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
