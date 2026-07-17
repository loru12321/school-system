# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `bbe09329e51b`
- Recorded at: 2026-07-17T08:12:25.967Z
- Total smoke time: 29277 ms (-1286 ms vs previous)
- Login: 7198 ms
- App ready: 9 ms
- Long tasks: 1, max 568 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-pairing` | 4.5 ms | 1455 ms | 1459.5 ms |
| `report-generator` | 20.5 ms | 1037 ms | 1057.5 ms |
| `teacher-analysis` | 47.70000000001164 ms | 913 ms | 960.7000000000116 ms |
| `progress-analysis` | 45 ms | 705 ms | 750 ms |
| `student-overview` | 62 ms | 666 ms | 728 ms |
| `potential-analysis` | 28.10000000000582 ms | 605 ms | 633.1000000000058 ms |
| `cohort-growth` | 36.30000000001746 ms | 576 ms | 612.3000000000175 ms |
| `teacher-township-ranking` | 6.600000000005821 ms | 591 ms | 597.6000000000058 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `89895f0948b8` | 25460 ms | 7089 ms | 9 ms | 0 | 0 | 0 |
| `865e7190a673` | 26468 ms | 6799 ms | 8 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
