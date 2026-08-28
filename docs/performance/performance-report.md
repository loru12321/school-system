# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `73aa7b8e6c65`
- Recorded at: 2026-08-28T17:21:29.019Z
- Total smoke time: 21689 ms (+163 ms vs previous)
- Login: 3296 ms
- App ready: 1008 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 210.2 ms, max derived network wait 5.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 31.80000000000291 ms | 673 ms | 704.8000000000029 ms |
| `student-overview` | 37.19999999999709 ms | 531 ms | 568.1999999999971 ms |
| `subject-balance` | 33.30000000000291 ms | 376 ms | 409.3000000000029 ms |
| `report-generator` | 18.19999999999709 ms | 388 ms | 406.1999999999971 ms |
| `freshman-simulator` | 71.60000000000582 ms | 310 ms | 381.6000000000058 ms |
| `exam-arranger` | 14.39999999999418 ms | 346 ms | 360.3999999999942 ms |
| `cohort-growth` | 19.19999999999709 ms | 324 ms | 343.1999999999971 ms |
| `teacher-township-ranking` | 9.69999999999709 ms | 229 ms | 238.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `f342ac4f7e29` | 20932 ms | 2511 ms | 1086 ms | 0 | 63 | 0 | 0 |
| `c7b81d1ea43e` | 21943 ms | 3004 ms | 1227 ms | 0 | 59 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
