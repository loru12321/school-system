# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `d16f1fd3c474`
- Recorded at: 2026-07-24T10:08:22.507Z
- Total smoke time: 30853 ms (+5386 ms vs previous)
- Login: 9809 ms
- App ready: 120 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 45.70000000001164 ms | 1735 ms | 1780.7000000000116 ms |
| `report-generator` | 23.39999999999418 ms | 907 ms | 930.3999999999942 ms |
| `seat-adjustment` | 34.19999999998254 ms | 783 ms | 817.1999999999825 ms |
| `analysis` | 6.5 ms | 609 ms | 615.5 ms |
| `student-overview` | 26.39999999999418 ms | 570 ms | 596.3999999999942 ms |
| `progress-analysis` | 33 ms | 531 ms | 564 ms |
| `indicator` | 35.20000000001164 ms | 495 ms | 530.2000000000116 ms |
| `freshman-simulator` | 31.699999999982538 ms | 488 ms | 519.6999999999825 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `d16f1fd3c474` | 30853 ms | 9809 ms | 120 ms | 0 | 0 | 0 |
| `6b76655ad4a2` | 25467 ms | 5370 ms | 125 ms | 0 | 0 | 0 |
| `4e6c824f4658` | 29720 ms | 6336 ms | 8 ms | 0 | 0 | 0 |
| `c416523e8ac8` | 32726 ms | 6799 ms | 10 ms | 0 | 0 | 0 |
| `fcce7d0df097` | 31115 ms | 6417 ms | 49 ms | 0 | 0 | 0 |
| `3586c77e396e` | 32669 ms | 6867 ms | 84 ms | 0 | 0 | 0 |
| `6806ed45609c` | 29309 ms | 5816 ms | 10 ms | 0 | 0 | 0 |
| `c3026831b94c` | 31941 ms | 6989 ms | 9 ms | 0 | 0 | 0 |
| `532a3b830020` | 34301 ms | 7057 ms | 10 ms | 0 | 0 | 0 |
| `c3d020f3c49c` | 25258 ms | 4723 ms | 60 ms | 0 | 0 | 0 |
| `6d54d4f51ae6` | 28811 ms | 6389 ms | 5 ms | 0 | 0 | 0 |
| `33bd40e8566b` | 28333 ms | 7952 ms | 8 ms | 0 | 0 | 0 |
| `9a34eefffe30` | 28656 ms | 6392 ms | 6 ms | 0 | 0 | 0 |
| `fd6de82dbe00` | 23306 ms | 4573 ms | 56 ms | 0 | 0 | 0 |
| `be32009a8374` | 31084 ms | 6361 ms | 9 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
