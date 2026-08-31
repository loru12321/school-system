# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `796892d71b1e`
- Recorded at: 2026-08-31T06:18:19.049Z
- Total smoke time: 22064 ms (-747 ms vs previous)
- Login: 2540 ms
- App ready: 1032 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 62, max end-to-end 191.4 ms, max derived network wait 7.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 44.19999999998254 ms | 1154 ms | 1198.1999999999825 ms |
| `student-overview` | 43.80000000001746 ms | 528 ms | 571.8000000000175 ms |
| `freshman-simulator` | 114 ms | 423 ms | 537 ms |
| `subject-balance` | 43.60000000000582 ms | 474 ms | 517.6000000000058 ms |
| `report-generator` | 20.5 ms | 424 ms | 444.5 ms |
| `exam-arranger` | 24.79999999998836 ms | 344 ms | 368.79999999998836 ms |
| `cohort-growth` | 19.79999999998836 ms | 309 ms | 328.79999999998836 ms |
| `correlation-analysis` | 23.79999999998836 ms | 228 ms | 251.79999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
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
| `b80c87a81689` | 21845 ms | 2476 ms | 1055 ms | 0 | 60 | 0 | 0 |
| `bc42a749b7d3` | 21950 ms | 5839 ms | 7 ms | 0 | 61 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
