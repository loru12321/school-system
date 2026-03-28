# School Ops ChatGPT App

Internal tool-only ChatGPT app for `school-system`.

It gives ChatGPT a safe, read-only operations surface over this repository by exposing:

- `search`: search the key runbooks, gateway notes, repo skills, and worker/code entry points
- `fetch`: fetch a specific document by id, including a live production read of `https://schoolsystem.com.cn/api/health`

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
2. Add a custom connector/server that points to `http://localhost:8788/mcp`.
3. Ask ChatGPT to `search` for deployment or gateway topics, then `fetch` the returned ids.

## Docs used

- https://developers.openai.com/apps-sdk/build/mcp-server/
- https://developers.openai.com/apps-sdk/build/mcp-server/#company-knowledge-compatibility
- https://developers.openai.com/apps-sdk/plan/tools/
