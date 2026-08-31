# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `3286409ab233`
- Recorded at: 2026-08-31T00:44:42.556Z
- Total smoke time: 21063 ms (-1411 ms vs previous)
- Login: 2331 ms
- App ready: 1066 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 179 ms, max derived network wait 7.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 45.30000000000291 ms | 1005 ms | 1050.300000000003 ms |
| `student-overview` | 44.09999999999127 ms | 514 ms | 558.0999999999913 ms |
| `freshman-simulator` | 66.5 ms | 348 ms | 414.5 ms |
| `report-generator` | 21.19999999999709 ms | 377 ms | 398.1999999999971 ms |
| `exam-arranger` | 28 ms | 347 ms | 375 ms |
| `subject-balance` | 34.80000000000291 ms | 340 ms | 374.8000000000029 ms |
| `cohort-growth` | 22.69999999999709 ms | 332 ms | 354.6999999999971 ms |
| `progress-analysis` | 82.80000000000291 ms | 230 ms | 312.8000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `ecb56dd98be3` | 21818 ms | 2665 ms | 1026 ms | 0 | 67 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
