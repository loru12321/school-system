# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d84b4db93607`
- Recorded at: 2026-08-28T12:06:55.090Z
- Total smoke time: 20800 ms (-387 ms vs previous)
- Login: 2698 ms
- App ready: 1019 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 188.4 ms, max derived network wait 11.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 33.40000000000873 ms | 659 ms | 692.4000000000087 ms |
| `freshman-simulator` | 67.09999999999127 ms | 462 ms | 529.0999999999913 ms |
| `student-overview` | 32 ms | 474 ms | 506 ms |
| `subject-balance` | 53.09999999999127 ms | 438 ms | 491.09999999999127 ms |
| `report-generator` | 20.10000000000582 ms | 381 ms | 401.1000000000058 ms |
| `cohort-growth` | 18.69999999999709 ms | 361 ms | 379.6999999999971 ms |
| `exam-arranger` | 14.19999999999709 ms | 348 ms | 362.1999999999971 ms |
| `teacher-analysis` | 44.80000000000291 ms | 248 ms | 292.8000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `d84b4db93607` | 20800 ms | 2698 ms | 1019 ms | 0 | 62 | 0 | 0 |
| `0fb7cec1739b` | 21187 ms | 2294 ms | 1011 ms | 0 | 63 | 0 | 0 |
| `bd4ecfc61f28` | 20613 ms | 2306 ms | 1011 ms | 0 | 65 | 0 | 0 |
| `d9771d5f5f24` | 20921 ms | 2881 ms | 1015 ms | 0 | 61 | 0 | 0 |
| `d6709b910875` | 21112 ms | 2436 ms | 1075 ms | 0 | 61 | 0 | 0 |
| `2bce27eb8e65` | 21295 ms | 2944 ms | 1008 ms | 0 | 62 | 0 | 0 |
| `fdf7e2b152a8` | 21015 ms | 2591 ms | 1023 ms | 0 | 64 | 0 | 0 |
| `14b76c7c11fc` | 21819 ms | 2294 ms | 1012 ms | 0 | 59 | 0 | 0 |
| `abed8b54cf3c` | 21900 ms | 2870 ms | 1057 ms | 0 | 61 | 0 | 0 |
| `b2a35275df1e` | 21391 ms | 2637 ms | 1005 ms | 0 | 63 | 0 | 0 |
| `b22ff9c5bce2` | 20816 ms | 2476 ms | 1026 ms | 0 | 63 | 0 | 0 |
| `c67a6c0d9cb1` | 21126 ms | 2231 ms | 1007 ms | 0 | 62 | 0 | 0 |
| `05caed724bbf` | 22933 ms | 5395 ms | 1217 ms | 0 | 62 | 0 | 0 |
| `60ecfdb43703` | 21942 ms | 2905 ms | 1154 ms | 0 | 57 | 0 | 0 |
| `a595157f11ed` | 22255 ms | 3130 ms | 1022 ms | 0 | 71 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
