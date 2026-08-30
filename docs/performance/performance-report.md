# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `57444f2d7993`
- Recorded at: 2026-08-30T23:23:03.870Z
- Total smoke time: 20284 ms (-1710 ms vs previous)
- Login: 2483 ms
- App ready: 1060 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 68, max end-to-end 148.9 ms, max derived network wait 4.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 30.29999999998836 ms | 903 ms | 933.2999999999884 ms |
| `student-overview` | 47 ms | 530 ms | 577 ms |
| `freshman-simulator` | 66.5 ms | 434 ms | 500.5 ms |
| `teacher-detail-comparison` | 10.799999999988358 ms | 455 ms | 465.79999999998836 ms |
| `exam-arranger` | 17.70000000001164 ms | 341 ms | 358.70000000001164 ms |
| `report-generator` | 16.300000000017462 ms | 336 ms | 352.30000000001746 ms |
| `subject-balance` | 29.60000000000582 ms | 300 ms | 329.6000000000058 ms |
| `cohort-growth` | 18.39999999999418 ms | 298 ms | 316.3999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `7ebb3d03bbc4` | 22446 ms | 3068 ms | 1133 ms | 0 | 67 | 0 | 0 |
| `ca86032b2989` | 23080 ms | 4272 ms | 1225 ms | 0 | 66 | 0 | 0 |
| `7528b21aca4c` | 21653 ms | 2607 ms | 1012 ms | 0 | 60 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
