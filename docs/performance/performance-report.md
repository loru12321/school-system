# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `4bb0d34effaa`
- Recorded at: 2026-08-28T13:41:51.605Z
- Total smoke time: 20466 ms (-466 ms vs previous)
- Login: 2842 ms
- App ready: 1008 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 64, max end-to-end 161.2 ms, max derived network wait 9.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 36.90000000000873 ms | 630 ms | 666.9000000000087 ms |
| `student-overview` | 33.19999999999709 ms | 518 ms | 551.1999999999971 ms |
| `freshman-simulator` | 50.19999999999709 ms | 416 ms | 466.1999999999971 ms |
| `subject-balance` | 40 ms | 369 ms | 409 ms |
| `report-generator` | 17.59999999999127 ms | 355 ms | 372.59999999999127 ms |
| `exam-arranger` | 14.5 ms | 343 ms | 357.5 ms |
| `cohort-growth` | 17.19999999999709 ms | 317 ms | 334.1999999999971 ms |
| `teacher-analysis` | 41.39999999999418 ms | 262 ms | 303.3999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `4bb0d34effaa` | 20466 ms | 2842 ms | 1008 ms | 0 | 64 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
