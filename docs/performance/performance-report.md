# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `4c8befffbafe`
- Recorded at: 2026-07-27T11:03:54.211Z
- Total smoke time: 29139 ms (-2063 ms vs previous)
- Login: 5502 ms
- App ready: 7 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `indicator` | 20.5 ms | 1959 ms | 1979.5 ms |
| `teacher-analysis` | 54.10000000000582 ms | 1849 ms | 1903.1000000000058 ms |
| `teacher-township-ranking` | 2.900000000008731 ms | 840 ms | 842.9000000000087 ms |
| `analysis` | 12.400000000008731 ms | 753 ms | 765.4000000000087 ms |
| `report-generator` | 12.200000000011642 ms | 732 ms | 744.2000000000116 ms |
| `student-overview` | 33.80000000000291 ms | 608 ms | 641.8000000000029 ms |
| `progress-analysis` | 51.80000000000291 ms | 530 ms | 581.8000000000029 ms |
| `subject-balance` | 32 ms | 530 ms | 562 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `de23ed56d79c` | 30589 ms | 6983 ms | 13 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
