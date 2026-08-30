# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `1a502dd07262`
- Recorded at: 2026-08-30T10:37:42.752Z
- Total smoke time: 22321 ms (+914 ms vs previous)
- Login: 3880 ms
- App ready: 1098 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 64, max end-to-end 76.1 ms, max derived network wait 6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 40.5 ms | 755 ms | 795.5 ms |
| `student-overview` | 40.90000000000873 ms | 505 ms | 545.9000000000087 ms |
| `freshman-simulator` | 92 ms | 437 ms | 529 ms |
| `subject-balance` | 39.39999999999418 ms | 395 ms | 434.3999999999942 ms |
| `report-generator` | 18.90000000000873 ms | 362 ms | 380.90000000000873 ms |
| `cohort-growth` | 20.19999999999709 ms | 342 ms | 362.1999999999971 ms |
| `exam-arranger` | 1 ms | 339 ms | 340 ms |
| `teacher-analysis` | 52.40000000000873 ms | 187 ms | 239.40000000000873 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `fd48304b73d7` | 23162 ms | 2785 ms | 1022 ms | 0 | 69 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
