# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `72a305f02bda`
- Recorded at: 2026-08-28T16:11:05.502Z
- Total smoke time: 20431 ms (-1424 ms vs previous)
- Login: 2658 ms
- App ready: 1011 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 60, max end-to-end 189.4 ms, max derived network wait 11.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 31.5 ms | 657 ms | 688.5 ms |
| `student-overview` | 27.10000000000582 ms | 511 ms | 538.1000000000058 ms |
| `subject-balance` | 35.29999999998836 ms | 412 ms | 447.29999999998836 ms |
| `freshman-simulator` | 71.20000000001164 ms | 332 ms | 403.20000000001164 ms |
| `cohort-growth` | 14.30000000000291 ms | 379 ms | 393.3000000000029 ms |
| `report-generator` | 18.5 ms | 361 ms | 379.5 ms |
| `exam-arranger` | 16.5 ms | 340 ms | 356.5 ms |
| `progress-analysis` | 61.89999999999418 ms | 222 ms | 283.8999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `bc678c2512dc` | 21089 ms | 2866 ms | 1011 ms | 0 | 64 | 0 | 0 |
| `4a033a87ff55` | 19952 ms | 3311 ms | 1007 ms | 0 | 63 | 0 | 0 |
| `d84b4db93607` | 20800 ms | 2698 ms | 1019 ms | 0 | 62 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
