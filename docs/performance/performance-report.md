# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d185c74694b7`
- Recorded at: 2026-08-23T06:39:19.337Z
- Total smoke time: 21550 ms (+3065 ms vs previous)
- Login: 3258 ms
- App ready: 4 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 58, max end-to-end 81.4 ms, max derived network wait 6.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 28.100000000034925 ms | 718 ms | 746.1000000000349 ms |
| `student-overview` | 33.59999999997672 ms | 621 ms | 654.5999999999767 ms |
| `subject-balance` | 28.70000000001164 ms | 460 ms | 488.70000000001164 ms |
| `report-generator` | 10.200000000011642 ms | 389 ms | 399.20000000001164 ms |
| `freshman-simulator` | 71.29999999998836 ms | 327 ms | 398.29999999998836 ms |
| `exam-arranger` | 1.5 ms | 345 ms | 346.5 ms |
| `cohort-growth` | 11.599999999976717 ms | 332 ms | 343.5999999999767 ms |
| `progress-analysis` | 41.90000000002328 ms | 224 ms | 265.9000000000233 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `d185c74694b7` | 21550 ms | 3258 ms | 4 ms | 0 | 58 | 0 | 0 |
| `6cffbae8c0b9` | 18485 ms | 3000 ms | 2 ms | 0 | 69 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
