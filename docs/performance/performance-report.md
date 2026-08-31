# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7c2e8a4661bf`
- Recorded at: 2026-08-31T07:28:30.068Z
- Total smoke time: 21474 ms (+27 ms vs previous)
- Login: 3965 ms
- App ready: 1250 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 59.5 ms, max derived network wait 5.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 30.899999999965075 ms | 869 ms | 899.8999999999651 ms |
| `student-overview` | 22.899999999965075 ms | 485 ms | 507.8999999999651 ms |
| `freshman-simulator` | 57.70000000001164 ms | 419 ms | 476.70000000001164 ms |
| `exam-arranger` | 13.799999999988358 ms | 340 ms | 353.79999999998836 ms |
| `cohort-growth` | 14.5 ms | 310 ms | 324.5 ms |
| `report-generator` | 14.099999999976717 ms | 307 ms | 321.0999999999767 ms |
| `subject-balance` | 28.800000000046566 ms | 291 ms | 319.80000000004657 ms |
| `progress-analysis` | 48.199999999953434 ms | 224 ms | 272.19999999995343 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `7c2e8a4661bf` | 21474 ms | 3965 ms | 1250 ms | 0 | 66 | 0 | 0 |
| `f6d63c769e28` | 21447 ms | 2636 ms | 1023 ms | 0 | 66 | 0 | 0 |
| `796892d71b1e` | 22064 ms | 2540 ms | 1032 ms | 0 | 62 | 0 | 0 |
| `69309f0008f7` | 22811 ms | 4962 ms | 1361 ms | 0 | 62 | 0 | 0 |
| `67ec920b979b` | 21912 ms | 2812 ms | 1072 ms | 0 | 67 | 0 | 0 |
| `97743a30dd67` | 22523 ms | 2809 ms | 1064 ms | 0 | 62 | 0 | 0 |
| `40adf7c3f360` | 22255 ms | 3144 ms | 1015 ms | 0 | 63 | 0 | 0 |
| `301cf4d1ece5` | 21528 ms | 2529 ms | 1085 ms | 0 | 58 | 0 | 0 |
| `fe2c5df7f0b9` | 21342 ms | 2281 ms | 1011 ms | 0 | 63 | 0 | 0 |
| `037047b08cb9` | 22265 ms | 3002 ms | 1070 ms | 0 | 67 | 0 | 0 |
| `758df385498d` | 22190 ms | 2906 ms | 1155 ms | 0 | 55 | 0 | 0 |
| `adbd49d7b951` | 23755 ms | 6139 ms | 1256 ms | 0 | 62 | 0 | 0 |
| `6f9869a7f3b6` | 21675 ms | 2783 ms | 1037 ms | 0 | 60 | 0 | 0 |
| `aa51d9221661` | 22542 ms | 2555 ms | 1157 ms | 0 | 52 | 0 | 0 |
| `896c67c59fe0` | 21312 ms | 2373 ms | 1055 ms | 0 | 63 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
