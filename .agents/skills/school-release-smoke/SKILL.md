---
name: school-release-smoke
description: Build, release, and verify the school-system repository safely. Use when Codex needs to validate the repo, regenerate dist/lt.html, run local or production smoke tests, verify the AI gateway, or follow the repo's commit-and-push flow before or after deployment.
---

# School Release Smoke

Use the existing project scripts instead of inventing new release steps.

## Quick flow

1. Run `npm run validate` for the full baseline.
2. Run `npm run smoke:ai-gateway` when the change can touch `/api/ai/*`, Worker routing, or AI config.
3. Run `npm run smoke:modules:local` after rebuilding `dist/`.
4. Run `node scripts/smoke-all-modules.js` against `file:///.../lt.html` when the single-file build matters.
5. Run `node scripts/smoke-all-modules.js` against `https://schoolsystem.com.cn/` after deploy.

## Required environment values for smoke scripts

Use these defaults unless the task clearly needs different credentials or cohort:

```powershell
$env:SMOKE_USER='admin'
$env:SMOKE_PASS='admin123'
$env:SMOKE_COHORT_YEAR='2022'
```

For production:

```powershell
$env:SMOKE_URL='https://schoolsystem.com.cn/'
```

For local `dist/` smoke:

```powershell
cmd /c npm run smoke:modules:local
```

For `lt.html`:

```powershell
$env:SMOKE_URL='file:///C:/Users/loru/Desktop/system/lt.html'
node scripts/smoke-all-modules.js
```

## Release guardrails

- Prefer `npm run validate` over cherry-picking individual tests unless the task is narrowly scoped.
- Treat `dist/index.html`, `dist/assets/**`, and `lt.html` as release artifacts that must stay aligned with source changes.
- If the repo change affects runtime loading, build output size, or `lt.html`, re-run the full validate chain.
- If production deploy is expected, verify the live site after push instead of assuming the deploy succeeded.

## Git flow

This repo already has a release helper:

```powershell
powershell -ExecutionPolicy Bypass -File ./deploy.ps1 -Message "<commit message>"
```

When not using `deploy.ps1`, mirror its behavior:

1. Stage source files and release artifacts.
2. Commit with a clear message.
3. Push `main`.
4. Re-run production smoke checks.
