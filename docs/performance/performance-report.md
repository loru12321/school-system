# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7ae668a78fd8`
- Recorded at: 2026-08-31T10:23:03.201Z
- Total smoke time: 23050 ms (+548 ms vs previous)
- Login: 2566 ms
- App ready: 1058 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 65, max end-to-end 205.7 ms, max derived network wait 10.5 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `grade-scheduler` | 47.5 ms | 1602 ms | 1649.5 ms |
| `student-overview` | 49.29999999998836 ms | 552 ms | 601.2999999999884 ms |
| `subject-balance` | 39.59999999997672 ms | 485 ms | 524.5999999999767 ms |
| `freshman-simulator` | 145.40000000002328 ms | 367 ms | 512.4000000000233 ms |
| `report-generator` | 19.100000000034925 ms | 425 ms | 444.1000000000349 ms |
| `cohort-growth` | 21.600000000034925 ms | 421 ms | 442.6000000000349 ms |
| `exam-arranger` | 1.3999999999650754 ms | 361 ms | 362.3999999999651 ms |
| `teacher-township-ranking` | 6.2999999999883585 ms | 261 ms | 267.29999999998836 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `7ae668a78fd8` | 23050 ms | 2566 ms | 1058 ms | 0 | 65 | 0 | 0 |
| `7d2d70d87ff1` | 22502 ms | 3512 ms | 1011 ms | 0 | 62 | 0 | 0 |
| `caea4a2be200` | 22237 ms | 2563 ms | 1158 ms | 0 | 65 | 0 | 0 |
| `8b25fb5e2782` | 22886 ms | 2564 ms | 1018 ms | 0 | 66 | 0 | 0 |
| `cdfe84874b8f` | 22073 ms | 2889 ms | 1025 ms | 0 | 66 | 0 | 0 |
| `b14f70ad742a` | 22196 ms | 2944 ms | 1024 ms | 0 | 72 | 0 | 0 |
| `0a9b46c43056` | 21661 ms | 2546 ms | 1027 ms | 0 | 66 | 0 | 0 |
| `38c3b1571ffe` | 19540 ms | 2700 ms | 1020 ms | 0 | 70 | 0 | 0 |
| `43e6c5ac1bbc` | 23379 ms | 3599 ms | 1007 ms | 0 | 65 | 0 | 0 |
| `15b457d48fa4` | 21189 ms | 2146 ms | 1012 ms | 0 | 67 | 0 | 0 |
| `7c2e8a4661bf` | 21474 ms | 3965 ms | 1250 ms | 0 | 66 | 0 | 0 |
| `f6d63c769e28` | 21447 ms | 2636 ms | 1023 ms | 0 | 66 | 0 | 0 |
| `796892d71b1e` | 22064 ms | 2540 ms | 1032 ms | 0 | 62 | 0 | 0 |
| `69309f0008f7` | 22811 ms | 4962 ms | 1361 ms | 0 | 62 | 0 | 0 |
| `67ec920b979b` | 21912 ms | 2812 ms | 1072 ms | 0 | 67 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
