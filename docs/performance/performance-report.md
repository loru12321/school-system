# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `469589f5bb52`
- Recorded at: 2026-08-23T04:46:33.273Z
- Total smoke time: 21692 ms (-182 ms vs previous)
- Login: 3375 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 67, max end-to-end 181.9 ms, max derived network wait 10.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 29.39999999999418 ms | 687 ms | 716.3999999999942 ms |
| `student-overview` | 33.20000000001164 ms | 611 ms | 644.2000000000116 ms |
| `subject-balance` | 26.90000000000873 ms | 471 ms | 497.90000000000873 ms |
| `freshman-simulator` | 76.40000000000873 ms | 319 ms | 395.40000000000873 ms |
| `report-generator` | 10.80000000000291 ms | 376 ms | 386.8000000000029 ms |
| `exam-arranger` | 1 ms | 354 ms | 355 ms |
| `cohort-growth` | 13.799999999988358 ms | 317 ms | 330.79999999998836 ms |
| `progress-analysis` | 67.5 ms | 191 ms | 258.5 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `469589f5bb52` | 21692 ms | 3375 ms | 3 ms | 0 | 67 | 0 | 0 |
| `515a7d3ac601` | 21874 ms | 3533 ms | 4 ms | 0 | 67 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
