# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7e87756601fb`
- Recorded at: 2026-08-28T15:26:03.889Z
- Total smoke time: 21823 ms (+614 ms vs previous)
- Login: 2467 ms
- App ready: 1035 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 204.6 ms, max derived network wait 10.4 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 31.60000000000582 ms | 667 ms | 698.6000000000058 ms |
| `student-overview` | 45.29999999998836 ms | 492 ms | 537.2999999999884 ms |
| `freshman-simulator` | 87.09999999999127 ms | 434 ms | 521.0999999999913 ms |
| `subject-balance` | 50.09999999999127 ms | 418 ms | 468.09999999999127 ms |
| `report-generator` | 20.90000000000873 ms | 416 ms | 436.90000000000873 ms |
| `cohort-growth` | 19.69999999999709 ms | 370 ms | 389.6999999999971 ms |
| `exam-arranger` | 20.60000000000582 ms | 344 ms | 364.6000000000058 ms |
| `progress-analysis` | 69.39999999999418 ms | 229 ms | 298.3999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `0fb7cec1739b` | 21187 ms | 2294 ms | 1011 ms | 0 | 63 | 0 | 0 |
| `bd4ecfc61f28` | 20613 ms | 2306 ms | 1011 ms | 0 | 65 | 0 | 0 |
| `d9771d5f5f24` | 20921 ms | 2881 ms | 1015 ms | 0 | 61 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
