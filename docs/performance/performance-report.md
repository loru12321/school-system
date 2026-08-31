# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `38c3b1571ffe`
- Recorded at: 2026-08-31T08:07:19.557Z
- Total smoke time: 19540 ms (-3839 ms vs previous)
- Login: 2700 ms
- App ready: 1020 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 70, max end-to-end 144.1 ms, max derived network wait 5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 32.70000000001164 ms | 1072 ms | 1104.7000000000116 ms |
| `student-overview` | 27.69999999999709 ms | 478 ms | 505.6999999999971 ms |
| `freshman-simulator` | 73.20000000001164 ms | 281 ms | 354.20000000001164 ms |
| `report-generator` | 15.30000000000291 ms | 328 ms | 343.3000000000029 ms |
| `subject-balance` | 29.39999999999418 ms | 309 ms | 338.3999999999942 ms |
| `exam-arranger` | 1.5 ms | 336 ms | 337.5 ms |
| `cohort-growth` | 15.700000000011642 ms | 283 ms | 298.70000000001164 ms |
| `correlation-analysis` | 12.30000000000291 ms | 195 ms | 207.3000000000029 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `38c3b1571ffe` | 19540 ms | 2700 ms | 1020 ms | 0 | 70 | 0 | 0 |
| `43e6c5ac1bbc` | 23379 ms | 3599 ms | 1007 ms | 0 | 65 | 0 | 0 |
| `15b457d48fa4` | 21189 ms | 2146 ms | 1012 ms | 0 | 67 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
