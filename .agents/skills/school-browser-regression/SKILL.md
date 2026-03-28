---
name: school-browser-regression
description: Run browser regression safely for school-system. Use when Codex needs to verify real login flows, cohort entry, module switching, local dist smoke, `lt.html` smoke, or production browser regression with Playwright-backed scripts.
---

# School Browser Regression

Use the repo's existing Playwright-backed smoke scripts before inventing new browser checks.

## Source of truth

Read these files first when the task is about browser behavior or live verification:

- `scripts/smoke-all-modules.js`
- `scripts/run-local-smoke.js`
- `package.json`

## Quick flow

1. Build current artifacts when source changed: `cmd /c npm run validate` or at least `cmd /c npm run build`.
2. Verify local `dist/` with `cmd /c npm run smoke:modules:local`.
3. Verify `lt.html` when single-file delivery matters:
   - `$env:SMOKE_URL='file:///C:/Users/loru/Desktop/system/lt.html'`
   - `node scripts/smoke-all-modules.js`
4. Verify production after push:
   - `$env:SMOKE_URL='https://schoolsystem.com.cn/'`
   - `node scripts/smoke-all-modules.js`

## Default environment

Use these unless the task clearly needs different credentials or cohort:

```powershell
$env:SMOKE_USER='admin'
$env:SMOKE_PASS='admin123'
$env:SMOKE_COHORT_YEAR='2022'
```

## What the script already covers

- login overlay restore vs fresh login
- cohort entry mask
- app-ready checks
- switching the main teaching, analysis, and student modules
- Playwright-backed browser execution on local files, local HTTP, or production URLs

## Guardrails

- Prefer the existing smoke scripts over ad-hoc browser automation.
- Do not assume local `dist/` success means production is healthy; run production smoke after deploy.
- When smoke fails, report the failing module id or step, not just "page broken".
- If the task touches auth, Worker routing, or Supabase gateway paths, pair browser regression with `npm run smoke:ai-gateway`.
- If the task changes runtime loading or build artifacts, re-run the local `dist/` smoke before checking production.
