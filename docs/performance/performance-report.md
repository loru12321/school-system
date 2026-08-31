# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `adbd49d7b951`
- Recorded at: 2026-08-31T03:04:04.626Z
- Total smoke time: 23755 ms (+2080 ms vs previous)
- Login: 6139 ms
- App ready: 1256 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 42.1 ms, max derived network wait 4.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 34.29999999998836 ms | 965 ms | 999.2999999999884 ms |
| `freshman-simulator` | 73.09999999997672 ms | 413 ms | 486.0999999999767 ms |
| `student-overview` | 24 ms | 462 ms | 486 ms |
| `exam-arranger` | 12.399999999965075 ms | 341 ms | 353.3999999999651 ms |
| `report-generator` | 16.70000000001164 ms | 309 ms | 325.70000000001164 ms |
| `subject-balance` | 32.90000000002328 ms | 287 ms | 319.9000000000233 ms |
| `cohort-growth` | 15.400000000023283 ms | 298 ms | 313.4000000000233 ms |
| `correlation-analysis` | 12 ms | 178 ms | 190 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `57444f2d7993` | 20284 ms | 2483 ms | 1060 ms | 0 | 68 | 0 | 0 |
| `efea6ba0a46c` | 21994 ms | 2939 ms | 1025 ms | 0 | 64 | 0 | 0 |
| `99a079912bd3` | 19870 ms | 3109 ms | 1018 ms | 0 | 64 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
