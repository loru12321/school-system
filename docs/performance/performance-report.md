# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `a85c047c121a`
- Recorded at: 2026-08-31T01:09:01.529Z
- Total smoke time: 22209 ms (+1146 ms vs previous)
- Login: 3032 ms
- App ready: 1238 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 60, max end-to-end 67.4 ms, max derived network wait 4.8 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 49 ms | 1016 ms | 1065 ms |
| `freshman-simulator` | 97.89999999999418 ms | 496 ms | 593.8999999999942 ms |
| `student-overview` | 53.79999999998836 ms | 512 ms | 565.7999999999884 ms |
| `subject-balance` | 41.5 ms | 468 ms | 509.5 ms |
| `cohort-growth` | 15.299999999988358 ms | 391 ms | 406.29999999998836 ms |
| `report-generator` | 17.89999999999418 ms | 370 ms | 387.8999999999942 ms |
| `exam-arranger` | 15.39999999999418 ms | 343 ms | 358.3999999999942 ms |
| `teacher-analysis` | 39.29999999998836 ms | 209 ms | 248.29999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `a85c047c121a` | 22209 ms | 3032 ms | 1238 ms | 0 | 60 | 0 | 0 |
| `3286409ab233` | 21063 ms | 2331 ms | 1066 ms | 0 | 62 | 0 | 0 |
| `3269ee00ab56` | 22474 ms | 3033 ms | 1030 ms | 0 | 62 | 0 | 0 |
| `b513653633e4` | 21932 ms | 2698 ms | 1051 ms | 0 | 68 | 0 | 0 |
| `57444f2d7993` | 20284 ms | 2483 ms | 1060 ms | 0 | 68 | 0 | 0 |
| `efea6ba0a46c` | 21994 ms | 2939 ms | 1025 ms | 0 | 64 | 0 | 0 |
| `99a079912bd3` | 19870 ms | 3109 ms | 1018 ms | 0 | 64 | 0 | 0 |
| `81041f8efa78` | 21198 ms | 2720 ms | 1034 ms | 0 | 58 | 0 | 0 |
| `ef6a2bf6405e` | 20569 ms | 2409 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `36797b65331a` | 22329 ms | 2701 ms | 1137 ms | 0 | 59 | 0 | 0 |
| `9adaebb3485c` | 22300 ms | 2932 ms | 1013 ms | 0 | 63 | 0 | 0 |
| `7ea504b9b8a3` | 23660 ms | 5051 ms | 1069 ms | 0 | 64 | 0 | 0 |
| `010ad2f5cf80` | 21763 ms | 2938 ms | 1012 ms | 0 | 62 | 0 | 0 |
| `1a502dd07262` | 22321 ms | 3880 ms | 1098 ms | 0 | 64 | 0 | 0 |
| `58d5097a4790` | 21407 ms | 2761 ms | 1034 ms | 0 | 64 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
