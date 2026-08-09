# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `49fec8c21072`
- Recorded at: 2026-08-09T11:53:51.208Z
- Total smoke time: 25713 ms (+246 ms vs previous)
- Login: 4832 ms
- App ready: 45 ms
- Native long tasks: 0, max 0 ms
- Scheduled task samples: 52, max end-to-end 188.3 ms, max derived network wait 12 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `report-generator` | 19.09999999999127 ms | 988 ms | 1007.0999999999913 ms |
| `progress-analysis` | 61.30000000000291 ms | 841 ms | 902.3000000000029 ms |
| `grade-scheduler` | 23.39999999999418 ms | 778 ms | 801.3999999999942 ms |
| `student-overview` | 33 ms | 719 ms | 752 ms |
| `subject-balance` | 37.19999999999709 ms | 583 ms | 620.1999999999971 ms |
| `freshman-simulator` | 59.20000000001164 ms | 461 ms | 520.2000000000116 ms |
| `indicator` | 31.5 ms | 431 ms | 462.5 ms |
| `teacher-township-ranking` | 4.600000000005821 ms | 445 ms | 449.6000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Native long tasks | Scheduled tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `49fec8c21072` | 25713 ms | 4832 ms | 45 ms | 0 | 52 | 0 | 0 |
| `755442d252bd` | 25467 ms | 4815 ms | 3 ms | 0 | 50 | 0 | 0 |
| `dff221e6c627` | 22536 ms | 3240 ms | 3 ms | 0 | 48 | 0 | 0 |
| `e00fc5099dfa` | 21713 ms | 3699 ms | 16 ms | 0 | 54 | 0 | 0 |
| `1f135b2caae4` | 25404 ms | 5125 ms | 13 ms | 0 | 51 | 0 | 0 |
| `eb593c740fa7` | 29262 ms | 9712 ms | 4 ms | 0 | 56 | 0 | 0 |
| `2e91afdaeb53` | 24479 ms | 4766 ms | 4 ms | 0 | 55 | 0 | 0 |
| `1c5505435dcc` | 26971 ms | 7403 ms | 20 ms | 0 | 52 | 0 | 0 |
| `2615a828f476` | 26982 ms | 5743 ms | 18 ms | 0 | 58 | 0 | 0 |
| `ce19da531240` | 27074 ms | 7971 ms | 3 ms | 0 | 50 | 0 | 0 |
| `10e5632247a0` | 25552 ms | 5106 ms | 357 ms | 0 | 50 | 0 | 0 |
| `86f1e40de13c` | 21224 ms | 3918 ms | 10 ms | 0 | 51 | 0 | 0 |
| `64a5f144579f` | 25921 ms | 6121 ms | 19 ms | 0 | 55 | 0 | 0 |
| `0844aa5f9308` | 24684 ms | 5128 ms | 20 ms | 0 | 53 | 0 | 0 |
| `95440b494093` | 25002 ms | 4663 ms | 19 ms | 0 | 51 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
