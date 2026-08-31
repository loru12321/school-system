# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `0a9b46c43056`
- Recorded at: 2026-08-31T08:44:16.025Z
- Total smoke time: 21661 ms (+2121 ms vs previous)
- Login: 2546 ms
- App ready: 1027 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 66, max end-to-end 200.2 ms, max derived network wait 8.7 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 44.19999999999709 ms | 1361 ms | 1405.199999999997 ms |
| `student-overview` | 62.40000000000873 ms | 513 ms | 575.4000000000087 ms |
| `freshman-simulator` | 77 ms | 498 ms | 575 ms |
| `subject-balance` | 43.39999999999418 ms | 458 ms | 501.3999999999942 ms |
| `cohort-growth` | 22 ms | 365 ms | 387 ms |
| `report-generator` | 16.60000000000582 ms | 366 ms | 382.6000000000058 ms |
| `exam-arranger` | 16.60000000000582 ms | 342 ms | 358.6000000000058 ms |
| `progress-analysis` | 50.10000000000582 ms | 212 ms | 262.1000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `0a9b46c43056` | 21661 ms | 2546 ms | 1027 ms | 0 | 66 | 0 | 0 |
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

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
