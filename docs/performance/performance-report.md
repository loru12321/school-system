# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `896c67c59fe0`
- Recorded at: 2026-08-31T02:07:10.791Z
- Total smoke time: 21312 ms (-533 ms vs previous)
- Login: 2373 ms
- App ready: 1055 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 63, max end-to-end 185.8 ms, max derived network wait 10.3 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 33.19999999999709 ms | 948 ms | 981.1999999999971 ms |
| `student-overview` | 53.30000000000291 ms | 586 ms | 639.3000000000029 ms |
| `freshman-simulator` | 69.40000000000873 ms | 518 ms | 587.4000000000087 ms |
| `subject-balance` | 41.69999999999709 ms | 380 ms | 421.6999999999971 ms |
| `report-generator` | 20.10000000000582 ms | 399 ms | 419.1000000000058 ms |
| `cohort-growth` | 22.19999999999709 ms | 391 ms | 413.1999999999971 ms |
| `exam-arranger` | 18.80000000000291 ms | 350 ms | 368.8000000000029 ms |
| `progress-analysis` | 68.19999999999709 ms | 174 ms | 242.1999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `896c67c59fe0` | 21312 ms | 2373 ms | 1055 ms | 0 | 63 | 0 | 0 |
| `b80c87a81689` | 21845 ms | 2476 ms | 1055 ms | 0 | 60 | 0 | 0 |
| `bc42a749b7d3` | 21950 ms | 5839 ms | 7 ms | 0 | 61 | 0 | 0 |
| `ba14d4a1b141` | 22684 ms | 3254 ms | 1025 ms | 0 | 62 | 0 | 0 |
| `c08652add921` | 21753 ms | 2211 ms | 1022 ms | 0 | 64 | 0 | 0 |
| `a85c047c121a` | 22209 ms | 3032 ms | 1238 ms | 0 | 60 | 0 | 0 |
| `3286409ab233` | 21063 ms | 2331 ms | 1066 ms | 0 | 62 | 0 | 0 |
| `3269ee00ab56` | 22474 ms | 3033 ms | 1030 ms | 0 | 62 | 0 | 0 |
| `b513653633e4` | 21932 ms | 2698 ms | 1051 ms | 0 | 68 | 0 | 0 |
| `57444f2d7993` | 20284 ms | 2483 ms | 1060 ms | 0 | 68 | 0 | 0 |
| `efea6ba0a46c` | 21994 ms | 2939 ms | 1025 ms | 0 | 64 | 0 | 0 |
| `99a079912bd3` | 19870 ms | 3109 ms | 1018 ms | 0 | 64 | 0 | 0 |
| `81041f8efa78` | 21198 ms | 2720 ms | 1034 ms | 0 | 58 | 0 | 0 |
| `ef6a2bf6405e` | 20569 ms | 2409 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `36797b65331a` | 22329 ms | 2701 ms | 1137 ms | 0 | 59 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
