# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `304cbb3bf011`
- Recorded at: 2026-08-23T04:27:06.888Z
- Total smoke time: 22194 ms (+727 ms vs previous)
- Login: 4542 ms
- App ready: 150 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 67, max end-to-end 95.2 ms, max derived network wait 6.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 28.19999999999709 ms | 746 ms | 774.1999999999971 ms |
| `student-overview` | 29.09999999999127 ms | 504 ms | 533.0999999999913 ms |
| `subject-balance` | 39 ms | 477 ms | 516 ms |
| `freshman-simulator` | 48.5 ms | 408 ms | 456.5 ms |
| `report-generator` | 14.39999999999418 ms | 373 ms | 387.3999999999942 ms |
| `progress-analysis` | 67.39999999999418 ms | 300 ms | 367.3999999999942 ms |
| `cohort-growth` | 10.89999999999418 ms | 356 ms | 366.8999999999942 ms |
| `exam-arranger` | 8.5 ms | 347 ms | 355.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `304cbb3bf011` | 22194 ms | 4542 ms | 150 ms | 0 | 67 | 0 | 0 |
| `139611e07ffd` | 21467 ms | 4205 ms | 155 ms | 0 | 65 | 0 | 0 |
| `5255ff3b172a` | 21209 ms | 3377 ms | 2 ms | 0 | 67 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
