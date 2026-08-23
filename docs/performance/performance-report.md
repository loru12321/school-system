# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `42ce86fd21c6`
- Recorded at: 2026-08-23T06:28:55.379Z
- Total smoke time: 22248 ms (+1282 ms vs previous)
- Login: 3662 ms
- App ready: 3 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 61, max end-to-end 68.6 ms, max derived network wait 5.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 27.70000000001164 ms | 743 ms | 770.7000000000116 ms |
| `student-overview` | 30 ms | 521 ms | 551 ms |
| `freshman-simulator` | 47.5 ms | 482 ms | 529.5 ms |
| `subject-balance` | 40.39999999999418 ms | 482 ms | 522.3999999999942 ms |
| `report-generator` | 10.599999999976717 ms | 406 ms | 416.5999999999767 ms |
| `cohort-growth` | 15.39999999999418 ms | 380 ms | 395.3999999999942 ms |
| `exam-arranger` | 9.89999999999418 ms | 372 ms | 381.8999999999942 ms |
| `teacher-analysis` | 35.20000000001164 ms | 190 ms | 225.20000000001164 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `42ce86fd21c6` | 22248 ms | 3662 ms | 3 ms | 0 | 61 | 0 | 0 |
| `59dc68065fc8` | 20966 ms | 4071 ms | 4 ms | 0 | 66 | 0 | 0 |
| `761a7d6a9790` | 20072 ms | 3310 ms | 4 ms | 0 | 69 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
