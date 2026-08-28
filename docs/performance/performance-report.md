# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `4a033a87ff55`
- Recorded at: 2026-08-28T12:38:18.471Z
- Total smoke time: 19952 ms (-848 ms vs previous)
- Login: 3311 ms
- App ready: 1007 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 63, max end-to-end 144.7 ms, max derived network wait 4.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 23.5 ms | 616 ms | 639.5 ms |
| `student-overview` | 29 ms | 463 ms | 492 ms |
| `freshman-simulator` | 63.70000000001164 ms | 284 ms | 347.70000000001164 ms |
| `exam-arranger` | 1.1000000000058208 ms | 337 ms | 338.1000000000058 ms |
| `report-generator` | 13.400000000008731 ms | 320 ms | 333.40000000000873 ms |
| `subject-balance` | 33.5 ms | 296 ms | 329.5 ms |
| `cohort-growth` | 14.099999999991269 ms | 296 ms | 310.09999999999127 ms |
| `teacher-analysis` | 38.80000000000291 ms | 154 ms | 192.8000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `4a033a87ff55` | 19952 ms | 3311 ms | 1007 ms | 0 | 63 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
