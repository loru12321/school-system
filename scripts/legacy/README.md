# Legacy Operations Scripts

These scripts are retained for historical recovery only. The recommended production path is:

```bash
npm run build
npx wrangler deploy
npm run verify:prod-minimal
```

Current production hosting is Cloudflare Workers + Assets. Prefer `npx wrangler deploy` for static assets, Worker code, headers, and route updates.

Archived categories:

- `deploy-oss.js`, `debug-oss.js`, `create-hk-bucket.js`: old OSS release helpers.
- `update-dns*.js`, `update-ns.js`: old DNS/NS helpers.
- `generate-cert*.js`, `bind-cert-sdk.js`, `list-certs.js`: old certificate helpers.
- `direct-deploy-cloudflare.*`: pre-Wrangler direct deploy helpers kept only for emergency reference.

Do not add new release automation here. If a legacy script must be used, record the reason and verification output in `docs/optimization-backlog.md` or a dated optimization pass note.
