# Maintenance Runbook

This project is a production school analytics system. Treat every change as a release candidate, even when the patch looks small.

## Priority Levels

### P0: production correctness

Use P0 for issues that can break login, data access, deployability, downloads, visible core reports, or security posture.

Required checks:

```bash
npm run build
npm run check:release-fast
npm run test:ui-copy-integrity
```

After deployment, verify:

- `https://schoolsystem.com.cn/` returns `200`
- `https://schoolsystem.com.cn/api/health` returns `ok: true`
- Critical static files do not contain replacement characters
- Download links still return the expected package content type

### P1: release quality and user experience

Use P1 for non-blocking issues that still affect real users: cache refresh drift, metadata readability, service worker behavior, UI copy clarity, browser install metadata, or workflow regressions.

Required checks:

```bash
npm run build
npm run test:html-hygiene
npm run test:service-worker-contract
npm run test:release-surface
npm run check:release-fast
```

Watch especially for:

- `src/index.html` runtime refresh version matching `service-worker-runtime.js`
- `public/sw.js` cache version being bumped when app shell behavior changes
- HTML responses declaring `Content-Type: text/html; charset=utf-8`
- `site.webmanifest` keeping readable Chinese names and shortcuts

### P2: sustainable maintenance

Use P2 for changes that reduce future mistakes: clearer documentation, stricter tests, smaller repeated release steps, better runbooks, and guardrails around deployment configuration.

Required checks:

```bash
npm run test:docs-hygiene
npm run test:release-automation
npm run test:release-hardening
npm run check:release-fast
```

Good P2 work should make the next P0 or P1 patch easier to validate.

## Release Checklist

1. Run `npm run build`.
2. Run `npm run check:release-fast`.
3. If copy, metadata, or visible report text changed, run `npm run test:ui-copy-integrity`.
4. Commit and push `main`.
5. Deploy with `npx wrangler deploy`.
6. Verify production:

```bash
node -e "fetch('https://schoolsystem.com.cn/').then(r => console.log(r.status, r.headers.get('content-type')))"
node -e "fetch('https://schoolsystem.com.cn/api/health').then(r => r.text()).then(console.log)"
```

## Cache And Metadata Rules

- Bump `SERVICE_WORKER_VERSION` in `public/assets/js/service-worker-runtime.js` when service worker registration behavior changes.
- Bump `CACHE_VERSION` in `public/sw.js` when app shell caching behavior changes.
- Keep the early refresh version in `src/index.html` aligned with `SERVICE_WORKER_VERSION`.
- Keep `/` and `/index.html` covered by UTF-8 HTML response headers in `public/_headers`.
- Keep `README.md`, `docs/maintenance-runbook.md`, and release automation docs free of mojibake and local machine paths.

## Safe Deployment Notes

- Do not embed Supabase publishable keys or Cloudflare secrets in browser code.
- Do not remove the legacy auth fallback until `docs/cloudflare-auth-cutover.md` readiness conditions are met.
- Do not deploy a build that fails `check:release-fast`, even if the change is documentation-only.
- If Cloudflare says no assets changed but deploys a new Worker version, still verify production headers and `/api/health`.
