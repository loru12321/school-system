# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `ba14d4a1b141`
- Recorded at: 2026-08-31T01:28:09.113Z
- Total smoke time: 22684 ms (+931 ms vs previous)
- Login: 3254 ms
- App ready: 1025 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 201.4 ms, max derived network wait 5.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 47.40000000000873 ms | 997 ms | 1044.4000000000087 ms |
| `student-overview` | 39.19999999999709 ms | 548 ms | 587.1999999999971 ms |
| `subject-balance` | 36.59999999999127 ms | 487 ms | 523.5999999999913 ms |
| `freshman-simulator` | 89.59999999999127 ms | 383 ms | 472.59999999999127 ms |
| `report-generator` | 21.40000000000873 ms | 408 ms | 429.40000000000873 ms |
| `cohort-growth` | 26.59999999999127 ms | 383 ms | 409.59999999999127 ms |
| `exam-arranger` | 26 ms | 359 ms | 385 ms |
| `progress-analysis` | 94.19999999999709 ms | 209 ms | 303.1999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ba14d4a1b141` | 22684 ms | 3254 ms | 1025 ms | 0 | 62 | 0 | 0 |
| `c08652add921` | 21753 ms | 2211 ms | 1022 ms | 0 | 64 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
