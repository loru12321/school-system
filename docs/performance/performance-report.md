# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `f342ac4f7e29`
- Recorded at: 2026-08-28T13:29:23.120Z
- Total smoke time: 20932 ms (-1011 ms vs previous)
- Login: 2511 ms
- App ready: 1086 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 63, max end-to-end 195.8 ms, max derived network wait 7.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 33.30000000000291 ms | 639 ms | 672.3000000000029 ms |
| `student-overview` | 53.30000000000291 ms | 535 ms | 588.3000000000029 ms |
| `subject-balance` | 36 ms | 431 ms | 467 ms |
| `freshman-simulator` | 64.5 ms | 402 ms | 466.5 ms |
| `cohort-growth` | 22.5 ms | 391 ms | 413.5 ms |
| `report-generator` | 18.80000000000291 ms | 382 ms | 400.8000000000029 ms |
| `exam-arranger` | 14.5 ms | 352 ms | 366.5 ms |
| `teacher-township-ranking` | 6.69999999999709 ms | 259 ms | 265.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `f342ac4f7e29` | 20932 ms | 2511 ms | 1086 ms | 0 | 63 | 0 | 0 |
| `c7b81d1ea43e` | 21943 ms | 3004 ms | 1227 ms | 0 | 59 | 0 | 0 |
| `bc678c2512dc` | 21089 ms | 2866 ms | 1011 ms | 0 | 64 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
