# Verification and release workflow

Run commands from the repository root. Prefer the smallest focused check first, then expand according to risk.

## Required release checks

```powershell
npm run check:release-fast
npm run test:student-details-rank-index
npm run test:cohort-growth-worker
npm run verify:prod-minimal
```

`verify:prod-minimal` targets production, so run it after deployment or when the user explicitly asks to inspect the live system. For a calculation-sensitive release, also run `npm run check:calculation` and compare snapshots.

## Build and local browser smoke

```powershell
npm run build
npm run smoke:modules:local
```

For a focused production smoke after deployment:

```powershell
$env:SMOKE_MODULE_IDS='starter-hub,cohort-growth,student-details'
npm run smoke:modules:prod
```

Clear temporary environment overrides after the check when they could affect later commands.

## Deploy and verify

Only deploy when authorized:

```powershell
npm run build
npx wrangler deploy
npm run verify:prod-minimal
```

Then check the affected modules in a real logged-in Chrome session and record console errors, failed requests, interaction feedback time, usable time, and the deployed Cloudflare version.

## Risk-based additions

- Runtime ordering, initial assets, service worker, or caching: run runtime hygiene, runtime order, cache-version, build-size, and local module smoke checks.
- Student development or ranking: run rank-index, calculation snapshot, Worker equivalence, and focused student module smoke checks.
- Teacher timetable or data manager: run the relevant data-manager/term-sync tests and cover first entry, semester switch, local restore, cloud restore, and empty data.
- Cloud refresh: cover duplicate request reuse, failure/retry, fast filter switching, cache invalidation, and stale-response rejection.

## Known calculation-harness caveat

The isolated `test:calculation-snapshot` path has historically reported fewer than 80 county teacher rows even against the pre-optimization production system. Do not ignore it silently, but distinguish this known harness path from a product regression. Full module smoke has rendered 159 county teacher rows correctly, while dedicated rank-boundary and Worker-equivalence tests pass. Re-investigate if those corroborating checks change.

## Release evidence

Report:

- focused and release checks executed, with pass/fail status;
- calculation-equivalence result;
- local and production smoke scope;
- measured interaction and usable timings;
- deployment URL and Cloudflare version, when deployed;
- any known harness-only failure separately from confirmed product failures.
