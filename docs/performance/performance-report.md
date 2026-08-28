# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `1a102f3a95a6`
- Recorded at: 2026-08-28T18:02:45.700Z
- Total smoke time: 22412 ms (+1256 ms vs previous)
- Login: 3253 ms
- App ready: 1010 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 61, max end-to-end 94.9 ms, max derived network wait 5.6 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 31.59999999999127 ms | 656 ms | 687.5999999999913 ms |
| `student-overview` | 38.89999999999418 ms | 499 ms | 537.8999999999942 ms |
| `subject-balance` | 34.39999999999418 ms | 397 ms | 431.3999999999942 ms |
| `report-generator` | 16.10000000000582 ms | 377 ms | 393.1000000000058 ms |
| `progress-analysis` | 60.10000000000582 ms | 311 ms | 371.1000000000058 ms |
| `freshman-simulator` | 70.39999999999418 ms | 295 ms | 365.3999999999942 ms |
| `exam-arranger` | 17.09999999999127 ms | 338 ms | 355.09999999999127 ms |
| `cohort-growth` | 16.90000000000873 ms | 324 ms | 340.90000000000873 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `1a102f3a95a6` | 22412 ms | 3253 ms | 1010 ms | 0 | 61 | 0 | 0 |
| `f48d1b5f066e` | 21156 ms | 2839 ms | 1014 ms | 0 | 62 | 0 | 0 |
| `73aa7b8e6c65` | 21689 ms | 3296 ms | 1008 ms | 0 | 66 | 0 | 0 |
| `ee2492176f6d` | 21526 ms | 2996 ms | 1306 ms | 0 | 63 | 0 | 0 |
| `351c86ea8cb3` | 22605 ms | 3110 ms | 1028 ms | 0 | 55 | 0 | 0 |
| `72a305f02bda` | 20431 ms | 2658 ms | 1011 ms | 0 | 60 | 0 | 0 |
| `aba8932f8f92` | 21855 ms | 2518 ms | 1092 ms | 0 | 58 | 0 | 0 |
| `89788aceb227` | 20892 ms | 2307 ms | 2033 ms | 0 | 65 | 0 | 0 |
| `7e87756601fb` | 21823 ms | 2467 ms | 1035 ms | 0 | 65 | 0 | 0 |
| `92d04a2c78db` | 21209 ms | 2359 ms | 1171 ms | 0 | 64 | 0 | 0 |
| `e333f3ea7df0` | 21727 ms | 2214 ms | 1034 ms | 0 | 63 | 0 | 0 |
| `e84b176d355e` | 22001 ms | 2431 ms | 1007 ms | 0 | 57 | 0 | 0 |
| `08c582d011f9` | 22618 ms | 3350 ms | 1028 ms | 0 | 67 | 0 | 0 |
| `8e4a6d28a1ac` | 21176 ms | 2644 ms | 1073 ms | 0 | 63 | 0 | 0 |
| `4bb0d34effaa` | 20466 ms | 2842 ms | 1008 ms | 0 | 64 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
