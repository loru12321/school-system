# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `fe2c5df7f0b9`
- Recorded at: 2026-08-31T04:50:48.580Z
- Total smoke time: 21342 ms (-923 ms vs previous)
- Login: 2281 ms
- App ready: 1011 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 63, max end-to-end 227.3 ms, max derived network wait 5.9 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 48.09999999999127 ms | 1096 ms | 1144.0999999999913 ms |
| `student-overview` | 41 ms | 531 ms | 572 ms |
| `freshman-simulator` | 100.80000000000291 ms | 426 ms | 526.8000000000029 ms |
| `subject-balance` | 41.30000000000291 ms | 453 ms | 494.3000000000029 ms |
| `report-generator` | 23.70000000001164 ms | 428 ms | 451.70000000001164 ms |
| `cohort-growth` | 18.90000000000873 ms | 355 ms | 373.90000000000873 ms |
| `exam-arranger` | 15.80000000000291 ms | 339 ms | 354.8000000000029 ms |
| `teacher-analysis` | 45.69999999999709 ms | 208 ms | 253.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `fe2c5df7f0b9` | 21342 ms | 2281 ms | 1011 ms | 0 | 63 | 0 | 0 |
| `037047b08cb9` | 22265 ms | 3002 ms | 1070 ms | 0 | 67 | 0 | 0 |
| `758df385498d` | 22190 ms | 2906 ms | 1155 ms | 0 | 55 | 0 | 0 |
| `adbd49d7b951` | 23755 ms | 6139 ms | 1256 ms | 0 | 62 | 0 | 0 |
| `6f9869a7f3b6` | 21675 ms | 2783 ms | 1037 ms | 0 | 60 | 0 | 0 |
| `aa51d9221661` | 22542 ms | 2555 ms | 1157 ms | 0 | 52 | 0 | 0 |
| `896c67c59fe0` | 21312 ms | 2373 ms | 1055 ms | 0 | 63 | 0 | 0 |
| `b80c87a81689` | 21845 ms | 2476 ms | 1055 ms | 0 | 60 | 0 | 0 |
| `bc42a749b7d3` | 21950 ms | 5839 ms | 7 ms | 0 | 61 | 0 | 0 |
| `ba14d4a1b141` | 22684 ms | 3254 ms | 1025 ms | 0 | 62 | 0 | 0 |
| `c08652add921` | 21753 ms | 2211 ms | 1022 ms | 0 | 64 | 0 | 0 |
| `a85c047c121a` | 22209 ms | 3032 ms | 1238 ms | 0 | 60 | 0 | 0 |
| `3286409ab233` | 21063 ms | 2331 ms | 1066 ms | 0 | 62 | 0 | 0 |
| `3269ee00ab56` | 22474 ms | 3033 ms | 1030 ms | 0 | 62 | 0 | 0 |
| `b513653633e4` | 21932 ms | 2698 ms | 1051 ms | 0 | 68 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
