# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `037047b08cb9`
- Recorded at: 2026-08-31T03:30:47.385Z
- Total smoke time: 22265 ms (+75 ms vs previous)
- Login: 3002 ms
- App ready: 1070 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 67, max end-to-end 204.1 ms, max derived network wait 8.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 41.39999999999418 ms | 1048 ms | 1089.3999999999942 ms |
| `freshman-simulator` | 79.39999999999418 ms | 548 ms | 627.3999999999942 ms |
| `subject-balance` | 57.20000000001164 ms | 501 ms | 558.2000000000116 ms |
| `student-overview` | 37.59999999997672 ms | 519 ms | 556.5999999999767 ms |
| `report-generator` | 18.60000000000582 ms | 389 ms | 407.6000000000058 ms |
| `cohort-growth` | 16.699999999982538 ms | 348 ms | 364.69999999998254 ms |
| `exam-arranger` | 17.10000000000582 ms | 344 ms | 361.1000000000058 ms |
| `progress-analysis` | 67.70000000001164 ms | 224 ms | 291.70000000001164 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `57444f2d7993` | 20284 ms | 2483 ms | 1060 ms | 0 | 68 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
