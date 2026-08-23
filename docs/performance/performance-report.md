# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `b75080d12c41`
- Recorded at: 2026-08-23T05:46:37.253Z
- Total smoke time: 22024 ms (-600 ms vs previous)
- Login: 3150 ms
- App ready: 151 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 201.5 ms, max derived network wait 8.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 26 ms | 709 ms | 735 ms |
| `student-overview` | 35.30000000000291 ms | 508 ms | 543.3000000000029 ms |
| `freshman-simulator` | 68.29999999998836 ms | 452 ms | 520.2999999999884 ms |
| `subject-balance` | 36.69999999999709 ms | 472 ms | 508.6999999999971 ms |
| `report-generator` | 12.69999999999709 ms | 408 ms | 420.6999999999971 ms |
| `exam-arranger` | 8.400000000008731 ms | 355 ms | 363.40000000000873 ms |
| `cohort-growth` | 10.80000000000291 ms | 352 ms | 362.8000000000029 ms |
| `progress-analysis` | 65.30000000000291 ms | 212 ms | 277.3000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `b75080d12c41` | 22024 ms | 3150 ms | 151 ms | 0 | 65 | 0 | 0 |
| `99761384c81e` | 22624 ms | 3686 ms | 7 ms | 0 | 65 | 0 | 0 |
| `af85084f695e` | 21734 ms | 3901 ms | 3 ms | 0 | 67 | 0 | 0 |
| `437352b0a1a9` | 18599 ms | 2845 ms | 4 ms | 0 | 74 | 0 | 0 |
| `9c11ce05d94b` | 21677 ms | 5038 ms | 8 ms | 0 | 62 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
