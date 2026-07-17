# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `acf51a71e2c9`
- Recorded at: 2026-07-17T07:54:27.419Z
- Total smoke time: 30563 ms (+730 ms vs previous)
- Login: 7717 ms
- App ready: 42 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 30.40000000000873 ms | 2928 ms | 2958.4000000000087 ms |
| `report-generator` | 15.599999999991269 ms | 951 ms | 966.5999999999913 ms |
| `teacher-analysis` | 89.19999999999709 ms | 797 ms | 886.1999999999971 ms |
| `subject-balance` | 71.79999999998836 ms | 652 ms | 723.7999999999884 ms |
| `freshman-simulator` | 42.10000000000582 ms | 639 ms | 681.1000000000058 ms |
| `student-overview` | 24.09999999999127 ms | 617 ms | 641.0999999999913 ms |
| `analysis` | 5.600000000005821 ms | 626 ms | 631.6000000000058 ms |
| `potential-analysis` | 30.60000000000582 ms | 557 ms | 587.6000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `89895f0948b8` | 25460 ms | 7089 ms | 9 ms | 0 | 0 | 0 |
| `865e7190a673` | 26468 ms | 6799 ms | 8 ms | 0 | 0 | 0 |
| `91faa33502e8` | 26166 ms | 5985 ms | 200 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
