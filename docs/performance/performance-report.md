# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `279efad83dad`
- Recorded at: 2026-08-23T03:40:56.189Z
- Total smoke time: 21841 ms (+325 ms vs previous)
- Login: 3538 ms
- App ready: 9 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 69, max end-to-end 259.8 ms, max derived network wait 10.2 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 30.899999999965075 ms | 721 ms | 751.8999999999651 ms |
| `student-overview` | 24 ms | 616 ms | 640 ms |
| `subject-balance` | 25.099999999976717 ms | 493 ms | 518.0999999999767 ms |
| `freshman-simulator` | 48.09999999997672 ms | 392 ms | 440.0999999999767 ms |
| `progress-analysis` | 46.70000000001164 ms | 345 ms | 391.70000000001164 ms |
| `report-generator` | 11.299999999988358 ms | 380 ms | 391.29999999998836 ms |
| `exam-arranger` | 9.700000000011642 ms | 346 ms | 355.70000000001164 ms |
| `cohort-growth` | 10.900000000023283 ms | 337 ms | 347.9000000000233 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `279efad83dad` | 21841 ms | 3538 ms | 9 ms | 0 | 69 | 0 | 0 |
| `279298ecdd4a` | 21516 ms | 3766 ms | 4 ms | 0 | 71 | 0 | 0 |
| `197a309fd712` | 21764 ms | 3703 ms | 11 ms | 0 | 69 | 0 | 0 |
| `867098129319` | 21856 ms | 3098 ms | 7 ms | 0 | 71 | 0 | 0 |
| `2f24b55344cd` | 22617 ms | 3599 ms | 4 ms | 0 | 70 | 0 | 0 |
| `4742340a8122` | 20982 ms | 3421 ms | 3 ms | 0 | 69 | 0 | 0 |
| `d5c6012cd4cd` | 21196 ms | 3831 ms | 10 ms | 0 | 65 | 0 | 0 |
| `d033d198ca83` | 21116 ms | 4119 ms | 150 ms | 0 | 69 | 0 | 0 |
| `0d4d7b7a119a` | 20077 ms | 4152 ms | 138 ms | 0 | 75 | 0 | 0 |
| `4b7e7a7b89e6` | 19327 ms | 4155 ms | 8 ms | 0 | 79 | 0 | 0 |
| `5499ef7be9cc` | 20805 ms | 4070 ms | 20 ms | 0 | 62 | 0 | 0 |
| `8edb413d40ec` | 19035 ms | 3705 ms | 7 ms | 0 | 69 | 0 | 0 |
| `572793d773c2` | 20790 ms | 3420 ms | 179 ms | 0 | 70 | 0 | 0 |
| `85c7a835e83b` | 21120 ms | 5840 ms | 123 ms | 0 | 69 | 0 | 0 |
| `5a5c13844692` | 21773 ms | 4056 ms | 135 ms | 0 | 72 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
