# School Ops ChatGPT App

Internal tool-only ChatGPT app for `school-system`.

It gives ChatGPT a safe, read-only operations surface over this repository by exposing:

- `search`: search the key runbooks, gateway notes, repo skills, and worker/code entry points
- `fetch`: fetch a specific document by id, including a live production read of `https://schoolsystem.com.cn/api/health`
- `status`: return a compact operational snapshot for production, gateway, skills, and app state
- `runbook`: return recommended step order for release, browser regression, gateway work, and ops-app setup

## Archetype

This app intentionally uses the `tool-only` archetype. The current need is repository knowledge and live health inspection, not a widget-heavy UI.

## Data sources

- `README.md`
- `DEPLOY.md`
- `SYSTEM_ARCHITECTURE.md`
- `VERSION_MARKERS.md`
- `src/worker-dummy.js`
- `supabase/EDGE_GATEWAY_SETUP.md`
- `supabase/functions/edu-gateway/index.ts`
- `.agents/skills/school-browser-regression/SKILL.md`
- `.agents/skills/school-release-smoke/SKILL.md`
- `.agents/skills/school-supabase-gateway/SKILL.md`
- live production `https://schoolsystem.com.cn/api/health`

## Local development

```bash
cd apps/school-ops-chatgpt-app
npm install
npm run dev
```

If port `8788` is already in use, run with a different port:

```bash
PORT=8791 npm run dev
```

Useful local checks:

```bash
npm run check
```

## Authentication

By default, the app is `localhost-only`.

- If `SCHOOL_OPS_APP_TOKEN` is not set, `/mcp` and `/health` only accept loopback requests.
- If `SCHOOL_OPS_APP_TOKEN` is set, `/mcp` and `/health` require either:
  - `Authorization: Bearer <token>`
  - `x-school-ops-token: <token>`

Example:

```bash
SCHOOL_OPS_APP_TOKEN=replace-me npm run dev
```

PowerShell example:

```powershell
$env:SCHOOL_OPS_APP_TOKEN='replace-me'
npm run dev
```

Authenticated health check example:

```bash
curl -H "Authorization: Bearer replace-me" http://localhost:8788/health
```

Health route:

```text
http://localhost:8788/health
```

MCP endpoint:

```text
http://localhost:8788/mcp
```

## Connect in ChatGPT Developer Mode

1. Start the local server.
2. If you enabled `SCHOOL_OPS_APP_TOKEN`, configure the connector to send `Authorization: Bearer <token>` or `x-school-ops-token`.
3. Add a custom connector/server that points to `http://localhost:8788/mcp`.
4. Ask ChatGPT to `search` for deployment or gateway topics, then `fetch` the returned ids.

Suggested starter prompts:

- `Get status for production`
- `Get the gateway runbook`
- `Search for browser regression`
- `Fetch skill-browser-regression`

## Docs used

- https://developers.openai.com/apps-sdk/build/mcp-server/
- https://developers.openai.com/apps-sdk/build/mcp-server/#company-knowledge-compatibility
- https://developers.openai.com/apps-sdk/plan/tools/
