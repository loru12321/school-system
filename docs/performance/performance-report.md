# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `397529892917`
- Recorded at: 2026-08-23T04:05:16.520Z
- Total smoke time: 21746 ms (+1844 ms vs previous)
- Login: 3506 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 188 ms, max derived network wait 10.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 27.19999999999709 ms | 688 ms | 715.1999999999971 ms |
| `student-overview` | 31.40000000000873 ms | 636 ms | 667.4000000000087 ms |
| `subject-balance` | 31.90000000000873 ms | 475 ms | 506.90000000000873 ms |
| `cohort-growth` | 16.90000000000873 ms | 370 ms | 386.90000000000873 ms |
| `report-generator` | 10.599999999991269 ms | 367 ms | 377.59999999999127 ms |
| `freshman-simulator` | 64.30000000000291 ms | 296 ms | 360.3000000000029 ms |
| `exam-arranger` | 1 ms | 342 ms | 343 ms |
| `teacher-analysis` | 44.29999999998836 ms | 203 ms | 247.29999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `397529892917` | 21746 ms | 3506 ms | 4 ms | 0 | 66 | 0 | 0 |
| `569146786054` | 19902 ms | 3586 ms | 5 ms | 0 | 68 | 0 | 0 |
| `6f8e50cf50a9` | 21475 ms | 3660 ms | 4 ms | 0 | 65 | 0 | 0 |
| `279efad83dad` | 21841 ms | 3538 ms | 9 ms | 0 | 69 | 0 | 0 |
| `279298ecdd4a` | 21516 ms | 3766 ms | 4 ms | 0 | 71 | 0 | 0 |
| `197a309fd712` | 21764 ms | 3703 ms | 11 ms | 0 | 69 | 0 | 0 |
| `867098129319` | 21856 ms | 3098 ms | 7 ms | 0 | 71 | 0 | 0 |
| `2f24b55344cd` | 22617 ms | 3599 ms | 4 ms | 0 | 70 | 0 | 0 |
| `4742340a8122` | 20982 ms | 3421 ms | 3 ms | 0 | 69 | 0 | 0 |
| `d5c6012cd4cd` | 21196 ms | 3831 ms | 10 ms | 0 | 65 | 0 | 0 |
| `d033d198ca83` | 21116 ms | 4119 ms | 150 ms | 0 | 69 | 0 | 0 |
| `0d4d7b7a119a` | 20077 ms | 4152 ms | 138 ms | 0 | 75 | 0 | 0 |
| `4b7e7a7b89e6` | 19327 ms | 4155 ms | 8 ms | 0 | 79 | 0 | 0 |
| `5499ef7be9cc` | 20805 ms | 4070 ms | 20 ms | 0 | 62 | 0 | 0 |
| `8edb413d40ec` | 19035 ms | 3705 ms | 7 ms | 0 | 69 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
