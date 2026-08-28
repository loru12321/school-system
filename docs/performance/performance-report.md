# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `89788aceb227`
- Recorded at: 2026-08-28T15:35:21.641Z
- Total smoke time: 20892 ms (-931 ms vs previous)
- Login: 2307 ms
- App ready: 2033 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 74.8 ms, max derived network wait 24.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 28.89999999999418 ms | 659 ms | 687.8999999999942 ms |
| `student-overview` | 34.29999999998836 ms | 469 ms | 503.29999999998836 ms |
| `report-generator` | 16 ms | 350 ms | 366 ms |
| `freshman-simulator` | 73.30000000001746 ms | 282 ms | 355.30000000001746 ms |
| `exam-arranger` | 1.1999999999825377 ms | 349 ms | 350.19999999998254 ms |
| `subject-balance` | 35 ms | 314 ms | 349 ms |
| `cohort-growth` | 23.39999999999418 ms | 305 ms | 328.3999999999942 ms |
| `progress-analysis` | 65.19999999998254 ms | 190 ms | 255.19999999998254 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `0fb7cec1739b` | 21187 ms | 2294 ms | 1011 ms | 0 | 63 | 0 | 0 |
| `bd4ecfc61f28` | 20613 ms | 2306 ms | 1011 ms | 0 | 65 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
