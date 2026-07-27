# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `7b1221233932`
- Recorded at: 2026-07-27T12:13:45.806Z
- Total smoke time: 35289 ms (+6150 ms vs previous)
- Login: 6208 ms
- App ready: 115 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 28.5 ms | 2185 ms | 2213.5 ms |
| `teacher-township-ranking` | 4.7000000000116415 ms | 2004 ms | 2008.7000000000116 ms |
| `teacher-pairing` | 7.600000000005821 ms | 1617 ms | 1624.6000000000058 ms |
| `report-generator` | 14.300000000017462 ms | 773 ms | 787.3000000000175 ms |
| `analysis` | 7 ms | 721 ms | 728 ms |
| `progress-analysis` | 39.59999999997672 ms | 551 ms | 590.5999999999767 ms |
| `student-overview` | 28.29999999998836 ms | 544 ms | 572.2999999999884 ms |
| `subject-balance` | 30.79999999998836 ms | 528 ms | 558.7999999999884 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
| `7b1221233932` | 35289 ms | 6208 ms | 115 ms | 0 | 0 | 0 |
| `4c8befffbafe` | 29139 ms | 5502 ms | 7 ms | 0 | 0 | 0 |
| `19cb7ffa4b94` | 31202 ms | 6296 ms | 7 ms | 0 | 0 | 0 |
| `60c6b7d71108` | 29706 ms | 6464 ms | 112 ms | 0 | 0 | 0 |
| `a040600ea190` | 29815 ms | 7251 ms | 189 ms | 0 | 0 | 0 |
| `b46765e47b61` | 31143 ms | 6334 ms | 17 ms | 0 | 0 | 0 |
| `fea9fdd61441` | 31359 ms | 6425 ms | 9 ms | 0 | 0 | 0 |
| `6ec525149f8e` | 29568 ms | 6149 ms | 5 ms | 0 | 0 | 0 |
| `a674b8c17958` | 30795 ms | 7538 ms | 188 ms | 0 | 0 | 0 |
| `bf6748f3d345` | 30720 ms | 6019 ms | 110 ms | 0 | 0 | 0 |
| `f9c9672712db` | 25358 ms | 5448 ms | 11 ms | 0 | 0 | 0 |
| `5c53c94df346` | 31935 ms | 6683 ms | 11 ms | 0 | 0 | 0 |
| `dc0b5cffc357` | 31988 ms | 6463 ms | 91 ms | 0 | 0 | 0 |
| `f6ff2ecbac8f` | 28908 ms | 6381 ms | 7 ms | 0 | 0 | 0 |
| `825f817158ce` | 30168 ms | 6859 ms | 11 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
