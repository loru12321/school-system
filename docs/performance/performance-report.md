# Performance Trend Report

This report is generated from browser smoke-test performance samples. It is meant to show which commit first made module switching, deep checks, or long tasks noticeably slower.

## Latest Run

- Commit: `60c6b7d71108`
- Recorded at: 2026-07-27T10:33:35.414Z
- Total smoke time: 29706 ms (-109 ms vs previous)
- Login: 6464 ms
- App ready: 112 ms
- Long tasks: 0, max 0 ms
- Budget failures: 0
- Errors: 0

## Slowest Modules In Latest Run

| Module | Switch | Deep check | Total |
| --- | --- | --- | --- |
| `teacher-analysis` | 36 ms | 1499 ms | 1535 ms |
| `seat-adjustment` | 52 ms | 936 ms | 988 ms |
| `report-generator` | 16 ms | 842 ms | 858 ms |
| `teacher-township-ranking` | 3.1999999999970896 ms | 804 ms | 807.1999999999971 ms |
| `analysis` | 12 ms | 699 ms | 711 ms |
| `progress-analysis` | 55.79999999998836 ms | 615 ms | 670.7999999999884 ms |
| `subject-balance` | 35.5 ms | 548 ms | 583.5 ms |
| `indicator` | 27.89999999999418 ms | 552 ms | 579.8999999999942 ms |

## Recent Runs

| Commit | Total | Login | App ready | Long tasks | Budget failures | Errors |
| --- | --- | --- | --- | --- | --- | --- |
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
| `8b6eb86719e6` | 27445 ms | 5963 ms | 66 ms | 0 | 0 | 0 |
| `9358cfabb063` | 30992 ms | 7511 ms | 107 ms | 0 | 0 | 0 |

## Data Files

- `latest-smoke.json`: full raw smoke output from the most recent performance workflow run.
- `performance-history.json`: compact cross-commit trend history.
- `performance-report.md`: human-readable trend report.
