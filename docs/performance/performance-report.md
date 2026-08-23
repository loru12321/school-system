# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `6f8e50cf50a9`
- Recorded at: 2026-08-23T03:45:49.630Z
- Total smoke time: 21475 ms (-366 ms vs previous)
- Login: 3660 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 64.7 ms, max derived network wait 6.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 31.80000000000291 ms | 707 ms | 738.8000000000029 ms |
| `student-overview` | 28.39999999999418 ms | 558 ms | 586.3999999999942 ms |
| `subject-balance` | 26 ms | 453 ms | 479 ms |
| `report-generator` | 11.39999999999418 ms | 373 ms | 384.3999999999942 ms |
| `exam-arranger` | 9.30000000000291 ms | 350 ms | 359.3000000000029 ms |
| `freshman-simulator` | 51.69999999999709 ms | 296 ms | 347.6999999999971 ms |
| `cohort-growth` | 11.89999999999418 ms | 328 ms | 339.8999999999942 ms |
| `progress-analysis` | 44.10000000000582 ms | 201 ms | 245.10000000000582 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `572793d773c2` | 20790 ms | 3420 ms | 179 ms | 0 | 70 | 0 | 0 |
| `85c7a835e83b` | 21120 ms | 5840 ms | 123 ms | 0 | 69 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
