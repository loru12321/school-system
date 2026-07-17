# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `fd6de82dbe00`
- Recorded at: 2026-07-17T08:32:52.049Z
- Total smoke time: 23306 ms (-7778 ms vs previous)
- Login: 4573 ms
- App ready: 56 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `segment-analysis` | 21.19999999999709 ms | 1237 ms | 1258.199999999997 ms |
| `teacher-township-ranking` | 8.19999999999709 ms | 1062 ms | 1070.199999999997 ms |
| `teacher-analysis` | 56.90000000000873 ms | 894 ms | 950.9000000000087 ms |
| `report-generator` | 10.69999999999709 ms | 918 ms | 928.6999999999971 ms |
| `indicator` | 28.90000000000873 ms | 656 ms | 684.9000000000087 ms |
| `progress-analysis` | 50.19999999999709 ms | 525 ms | 575.1999999999971 ms |
| `student-overview` | 21.70000000001164 ms | 541 ms | 562.7000000000116 ms |
| `analysis` | 10.69999999999709 ms | 489 ms | 499.6999999999971 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `fd6de82dbe00` | 23306 ms | 4573 ms | 56 ms | 0 | 0 | 0 |
| `be32009a8374` | 31084 ms | 6361 ms | 9 ms | 0 | 0 | 0 |
| `bbe09329e51b` | 29277 ms | 7198 ms | 9 ms | 1 | 0 | 0 |
| `acf51a71e2c9` | 30563 ms | 7717 ms | 42 ms | 0 | 0 | 0 |
| `d0e10a2c36ad` | 29833 ms | 6976 ms | 6 ms | 0 | 0 | 0 |
| `9ff53c8b16a6` | 29220 ms | 8075 ms | 6 ms | 0 | 0 | 0 |
| `4026ee74e5f6` | 29144 ms | 6702 ms | 91 ms | 0 | 0 | 0 |
| `d201c4ad754e` | 28897 ms | 5988 ms | 12 ms | 0 | 0 | 0 |
| `c720ac6986d4` | 24866 ms | 5326 ms | 39 ms | 0 | 0 | 0 |
| `1c50d7adb558` | 31116 ms | 6993 ms | 107 ms | 0 | 0 | 0 |
| `5e988082b308` | 28016 ms | 6515 ms | 88 ms | 0 | 0 | 0 |
| `e1a4568d9d38` | 26469 ms | 6491 ms | 307 ms | 0 | 0 | 0 |
| `89a979a363bd` | 25787 ms | 6174 ms | 80 ms | 0 | 0 | 0 |
| `c4e13ef7deb3` | 20646 ms | 4392 ms | 5 ms | 0 | 0 | 0 |
| `e4738547b0b1` | 18751 ms | 3961 ms | 230 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
