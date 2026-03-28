import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { registerAppTool } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

type StaticDoc = {
  id: string;
  title: string;
  repoPath: string;
  url: string;
  kind: "markdown" | "code" | "skill";
  keywords: string[];
  description: string;
  priority: number;
};

type LiveDoc = {
  id: "live-health";
  title: string;
  url: string;
  kind: "live";
  keywords: string[];
  description: string;
  priority: number;
};

type DocDescriptor = StaticDoc | LiveDoc;
type RunbookTopic = "release" | "browser_regression" | "gateway" | "ops_app";
type StatusArea = "overview" | "production" | "gateway" | "skills";

const APP_NAME = "school-ops-chatgpt-app";
const APP_VERSION = "0.1.0";
const APP_ARCHETYPE = "tool-only";
const TOOL_NAMES = ["search", "fetch", "status", "runbook"] as const;
const MCP_PATH = "/mcp";
const PORT = Number(process.env.PORT ?? "8788");
const APP_TOKEN = String(process.env.SCHOOL_OPS_APP_TOKEN || "").trim();
const AUTH_MODE = APP_TOKEN ? "token" : "localhost-only";
const LIVE_HEALTH_URL = "https://schoolsystem.com.cn/api/health";
const GITHUB_BASE_URL = "https://github.com/loru12321/school-system/blob/main";
const MAX_FETCH_CHARS = 18000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(APP_ROOT, "..", "..");

const STATIC_DOCS: StaticDoc[] = [
  {
    id: "repo-readme",
    title: "Repository overview and release baseline",
    repoPath: "README.md",
    url: `${GITHUB_BASE_URL}/README.md`,
    kind: "markdown",
    keywords: ["overview", "release", "smoke", "build", "ai gateway", "school-system"],
    description: "Main repository overview, release flow, smoke-test guidance, and current baselines.",
    priority: 10
  },
  {
    id: "deploy-guide",
    title: "Deployment guide",
    repoPath: "DEPLOY.md",
    url: `${GITHUB_BASE_URL}/DEPLOY.md`,
    kind: "markdown",
    keywords: ["deploy", "cloudflare", "worker", "pages", "domain", "production"],
    description: "Deployment notes for GitHub, Cloudflare Pages, Workers, and domain binding.",
    priority: 20
  },
  {
    id: "system-architecture",
    title: "System architecture",
    repoPath: "SYSTEM_ARCHITECTURE.md",
    url: `${GITHUB_BASE_URL}/SYSTEM_ARCHITECTURE.md`,
    kind: "markdown",
    keywords: ["architecture", "module", "analytics", "portal", "system"],
    description: "High-level architecture, module layout, and capability map for the system.",
    priority: 30
  },
  {
    id: "version-markers",
    title: "Version markers and milestones",
    repoPath: "VERSION_MARKERS.md",
    url: `${GITHUB_BASE_URL}/VERSION_MARKERS.md`,
    kind: "markdown",
    keywords: ["version", "milestone", "history", "release notes", "marker"],
    description: "Version marker log and maintenance milestones.",
    priority: 40
  },
  {
    id: "worker-proxy",
    title: "Cloudflare same-origin worker proxy",
    repoPath: "src/worker-dummy.js",
    url: `${GITHUB_BASE_URL}/src/worker-dummy.js`,
    kind: "code",
    keywords: ["worker", "api", "health", "proxy", "ai", "supabase", "sb"],
    description: "Cloudflare Worker that proxies same-origin API, Supabase, AI, and health routes.",
    priority: 15
  },
  {
    id: "edge-gateway-setup",
    title: "Supabase edge gateway setup",
    repoPath: "supabase/EDGE_GATEWAY_SETUP.md",
    url: `${GITHUB_BASE_URL}/supabase/EDGE_GATEWAY_SETUP.md`,
    kind: "markdown",
    keywords: ["supabase", "gateway", "login", "session", "account", "rls", "sql"],
    description: "Gateway-first guidance for login, accounts, SQL order, and same-origin routing.",
    priority: 5
  },
  {
    id: "edu-gateway-function",
    title: "edu-gateway function source",
    repoPath: "supabase/functions/edu-gateway/index.ts",
    url: `${GITHUB_BASE_URL}/supabase/functions/edu-gateway/index.ts`,
    kind: "code",
    keywords: ["edu-gateway", "action", "login", "account", "warning", "rectify", "version"],
    description: "Supabase Edge Function that handles login, session verification, account actions, and management tasks.",
    priority: 12
  },
  {
    id: "skill-browser-regression",
    title: "Repo skill: school-browser-regression",
    repoPath: ".agents/skills/school-browser-regression/SKILL.md",
    url: `${GITHUB_BASE_URL}/.agents/skills/school-browser-regression/SKILL.md`,
    kind: "skill",
    keywords: ["skill", "browser", "playwright", "regression", "smoke", "production", "codex"],
    description: "Repo-level Codex skill for browser smoke checks, module switching, and production regression.",
    priority: 7
  },
  {
    id: "skill-release-smoke",
    title: "Repo skill: school-release-smoke",
    repoPath: ".agents/skills/school-release-smoke/SKILL.md",
    url: `${GITHUB_BASE_URL}/.agents/skills/school-release-smoke/SKILL.md`,
    kind: "skill",
    keywords: ["skill", "release", "smoke", "validate", "deploy", "codex"],
    description: "Repo-level Codex skill that captures the safe validate, smoke, and push workflow.",
    priority: 8
  },
  {
    id: "skill-supabase-gateway",
    title: "Repo skill: school-supabase-gateway",
    repoPath: ".agents/skills/school-supabase-gateway/SKILL.md",
    url: `${GITHUB_BASE_URL}/.agents/skills/school-supabase-gateway/SKILL.md`,
    kind: "skill",
    keywords: ["skill", "supabase", "gateway", "edge", "sql", "codex"],
    description: "Repo-level Codex skill that captures the safe Supabase and edge gateway workflow.",
    priority: 9
  }
];

const LIVE_DOC: LiveDoc = {
  id: "live-health",
  title: "Production API health",
  url: LIVE_HEALTH_URL,
  kind: "live",
  keywords: ["live", "health", "production", "gateway", "worker", "supabase", "api"],
  description: "Fetches the current JSON payload from the production same-origin health route.",
  priority: 1
};

const RUNBOOKS: Record<
  RunbookTopic,
  {
    title: string;
    summary: string;
    steps: string[];
    validation: string[];
    documents: string[];
    notes?: string[];
  }
> = {
  release: {
    title: "Release and deploy",
    summary: "Follow the repo validate, smoke, deploy, and production verification order.",
    steps: [
      "Run `cmd /c npm run validate` to rebuild artifacts and verify the baseline.",
      "Run `cmd /c npm run smoke:modules:local` to verify the built `dist/` site in a browser.",
      "If the single-file artifact matters, set `SMOKE_URL=file:///C:/Users/loru/Desktop/system/lt.html` and run `node scripts/smoke-all-modules.js`.",
      "Commit and push only the intended source and release artifacts.",
      "After deploy, set `SMOKE_URL=https://schoolsystem.com.cn/` and run `node scripts/smoke-all-modules.js`."
    ],
    validation: [
      "Use `cmd /c npm run smoke:ai-gateway` when Worker or AI routes changed.",
      "Treat production browser smoke as the final release gate."
    ],
    documents: ["repo-readme", "skill-release-smoke", "deploy-guide", "live-health"]
  },
  browser_regression: {
    title: "Browser regression",
    summary: "Use the existing Playwright-backed smoke scripts for login, cohort entry, and module switching.",
    steps: [
      "Use the default smoke credentials unless the task clearly requires different ones.",
      "Run `cmd /c npm run smoke:modules:local` for local `dist/` browser verification.",
      "Run `node scripts/smoke-all-modules.js` against `lt.html` when single-file behavior matters.",
      "Run the same smoke script against `https://schoolsystem.com.cn/` after deploy.",
      "When a failure appears, report the failing module id or browser step instead of a generic summary."
    ],
    validation: [
      "Pair this with `cmd /c npm run smoke:ai-gateway` if the change touched auth, Worker routing, or gateway paths.",
      "Capture screenshots only after reproducing the failing step consistently."
    ],
    documents: ["skill-browser-regression", "skill-release-smoke", "repo-readme"]
  },
  gateway: {
    title: "Gateway and Supabase path",
    summary: "Follow the gateway-first architecture and safe deployment order for auth and account changes.",
    steps: [
      "Update `supabase/functions/edu-gateway/index.ts` first.",
      "Deploy `edu-gateway-v2` before any browser-side hardening or SQL migration that depends on it.",
      "Run SQL in order: `001_management_tables.sql`, `002_management_rls_minimal.sql`, `003_system_users_password_hardening.sql`.",
      "Retest `login`, `session.verify`, `account.search`, and `account.change_password`.",
      "Finish with browser smoke locally and on production."
    ],
    validation: [
      "Do not move account operations back to direct browser table access.",
      "Confirm same-origin proxy routes still work through `/api/edu-gateway` and `/sb/*`."
    ],
    documents: ["edge-gateway-setup", "edu-gateway-function", "skill-supabase-gateway", "live-health"]
  },
  ops_app: {
    title: "Ops app setup",
    summary: "Start the local tool-only app securely, verify auth, and connect it to ChatGPT Developer Mode.",
    steps: [
      "Set `SCHOOL_OPS_APP_TOKEN` if the app will be accessed from anything other than localhost-only development.",
      "Start the app with `npm run dev` inside `apps/school-ops-chatgpt-app`.",
      "Verify `/health` locally, first expecting `401` without a token when token mode is enabled, then `200` with the bearer token.",
      "Connect ChatGPT Developer Mode to `http://localhost:8788/mcp` and include the same auth header when token mode is enabled.",
      "Test `search`, `fetch`, `status`, and `runbook` before relying on the connector."
    ],
    validation: [
      "Run `npm run check` after any server change.",
      "Keep the app read-only unless auth, audit, and rollback expectations are redesigned explicitly."
    ],
    documents: ["repo-readme", "skill-browser-regression", "skill-release-smoke", "live-health"]
  }
};

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenizeQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return [];
  }

  const tokens = normalized.split(/[\s/_.:-]+/).filter(Boolean);
  if (!tokens.includes(normalized)) {
    tokens.unshift(normalized);
  }
  return [...new Set(tokens)];
}

function getAbsolutePath(doc: StaticDoc): string {
  return path.join(REPO_ROOT, doc.repoPath);
}

function readStaticDocText(doc: StaticDoc): string {
  const filePath = getAbsolutePath(doc);
  if (!existsSync(filePath)) {
    return "";
  }
  return readFileSync(filePath, "utf8");
}

function buildSearchCorpus(doc: DocDescriptor): string {
  if (doc.kind === "live") {
    return normalizeSearchText([doc.title, doc.description, doc.keywords.join(" "), doc.url].join(" "));
  }

  return normalizeSearchText(
    [doc.title, doc.description, doc.repoPath, doc.keywords.join(" "), readStaticDocText(doc)].join(" ")
  );
}

function scoreDocument(doc: DocDescriptor, query: string): number {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return 1000 - doc.priority;
  }

  const haystack = buildSearchCorpus(doc);
  if (!haystack) {
    return 0;
  }

  let score = 0;
  const tokens = tokenizeQuery(query);

  if (haystack.includes(normalizedQuery)) {
    score += 20;
  }

  for (const token of tokens) {
    if (token.length < 2) {
      continue;
    }
    if (haystack.includes(token)) {
      score += 8;
    }
    if (normalizeSearchText(doc.title).includes(token)) {
      score += 14;
    }
    if (doc.kind !== "live" && normalizeSearchText(doc.repoPath).includes(token)) {
      score += 10;
    }
    if (doc.keywords.some((keyword) => normalizeSearchText(keyword).includes(token))) {
      score += 12;
    }
  }

  return score;
}

function listDocs(): DocDescriptor[] {
  return [...STATIC_DOCS, LIVE_DOC];
}

function getStaticDocById(id: string): StaticDoc {
  const doc = STATIC_DOCS.find((candidate) => candidate.id === id);
  if (!doc) {
    throw new Error(`Unknown static document id: ${id}`);
  }
  return doc;
}

function jsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function normalizeHostname(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("[")) {
    const closingIndex = trimmed.indexOf("]");
    if (closingIndex >= 0) {
      return trimmed.slice(1, closingIndex).toLowerCase();
    }
  }

  const firstColon = trimmed.indexOf(":");
  const lastColon = trimmed.lastIndexOf(":");
  if (firstColon >= 0 && firstColon === lastColon) {
    return trimmed.slice(0, firstColon).toLowerCase();
  }

  return trimmed.toLowerCase();
}

function isLoopbackValue(value: string | undefined): boolean {
  const normalized = normalizeHostname(String(value || ""));
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1" || normalized === "::ffff:127.0.0.1";
}

function getPresentedToken(req: IncomingMessage): string {
  const authHeader = String(req.headers.authorization || "").trim();
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  return String(req.headers["x-school-ops-token"] || "").trim();
}

function isLoopbackRequest(req: IncomingMessage): boolean {
  return isLoopbackValue(req.socket.remoteAddress);
}

function isAuthorizedRequest(req: IncomingMessage): boolean {
  if (!APP_TOKEN) {
    return isLoopbackRequest(req);
  }

  return getPresentedToken(req) === APP_TOKEN;
}

function writeUnauthorizedResponse(res: ServerResponse) {
  const status = APP_TOKEN ? 401 : 403;
  const body = APP_TOKEN
    ? {
        ok: false,
        error: "UNAUTHORIZED",
        message: "Provide Authorization: Bearer <token> or x-school-ops-token."
      }
    : {
        ok: false,
        error: "LOCALHOST_ONLY",
        message: "This app accepts unauthenticated requests only from localhost. Set SCHOOL_OPS_APP_TOKEN to allow authenticated remote access."
      };
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  };

  if (APP_TOKEN) {
    headers["www-authenticate"] = 'Bearer realm="school-ops-chatgpt-app"';
  }

  res.writeHead(status, headers);
  res.end(jsonText(body));
}

function truncateText(value: string): { text: string; truncated: boolean } {
  if (value.length <= MAX_FETCH_CHARS) {
    return { text: value, truncated: false };
  }

  return {
    text: `${value.slice(0, MAX_FETCH_CHARS)}\n\n[truncated by school-ops-chatgpt-app]`,
    truncated: true
  };
}

async function fetchLiveHealth(): Promise<{
  id: string;
  title: string;
  text: string;
  url: string;
  metadata: Record<string, unknown>;
}> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(LIVE_HEALTH_URL, {
      headers: {
        accept: "application/json, text/plain;q=0.9, */*;q=0.1"
      },
      signal: controller.signal
    });

    const contentType = String(response.headers.get("content-type") || "");
    const bodyText = await response.text();
    let renderedText = bodyText;

    if (contentType.includes("application/json")) {
      try {
        renderedText = jsonText(JSON.parse(bodyText));
      } catch {
        renderedText = bodyText;
      }
    }

    return {
      id: LIVE_DOC.id,
      title: LIVE_DOC.title,
      text: renderedText,
      url: LIVE_DOC.url,
      metadata: {
        source: "production",
        fetchedAt: new Date().toISOString(),
        status: response.status,
        ok: response.ok,
        contentType: contentType || "unknown"
      }
    };
  } finally {
    clearTimeout(timeout);
  }
}

function fetchStaticDocument(doc: StaticDoc): {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata: Record<string, unknown>;
} {
  const filePath = getAbsolutePath(doc);
  if (!existsSync(filePath)) {
    throw new Error(`Missing repository document: ${doc.repoPath}`);
  }

  const rawText = readFileSync(filePath, "utf8");
  const stats = statSync(filePath);
  const { text, truncated } = truncateText(rawText);

  return {
    id: doc.id,
    title: doc.title,
    text,
    url: doc.url,
    metadata: {
      kind: doc.kind,
      repoPath: doc.repoPath,
      fetchedAt: new Date().toISOString(),
      modifiedAt: stats.mtime.toISOString(),
      bytes: Buffer.byteLength(rawText, "utf8"),
      truncated
    }
  };
}

async function fetchDocument(id: string) {
  if (id === LIVE_DOC.id) {
    return fetchLiveHealth();
  }

  const doc = STATIC_DOCS.find((candidate) => candidate.id === id);
  if (!doc) {
    throw new Error(`Unknown document id: ${id}`);
  }

  return fetchStaticDocument(doc);
}

async function searchDocuments(query: string) {
  const ranked = listDocs()
    .map((doc) => ({ doc, score: scoreDocument(doc, query) }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return left.doc.priority - right.doc.priority;
    })
    .slice(0, 8)
    .map(({ doc }) => ({
      id: doc.id,
      title: doc.title,
      url: doc.url
    }));

  return ranked;
}

function listSkillSummaries() {
  return STATIC_DOCS.filter((doc) => doc.kind === "skill").map((doc) => ({
    id: doc.id,
    title: doc.title,
    url: doc.url
  }));
}

function extractGatewayActions(): string[] {
  const gatewaySource = readStaticDocText(getStaticDocById("edu-gateway-function"));
  const matches = [...gatewaySource.matchAll(/case\s+["']([^"']+)["']\s*:/g)];
  return [...new Set(matches.map((match) => String(match[1] || "").trim()).filter(Boolean))].sort();
}

async function getLiveHealthSummary() {
  try {
    const liveHealth = await fetchLiveHealth();
    let body: unknown = liveHealth.text;
    try {
      body = JSON.parse(liveHealth.text);
    } catch {
      body = liveHealth.text;
    }

    return {
      ok: true,
      url: liveHealth.url,
      metadata: liveHealth.metadata,
      body
    };
  } catch (error) {
    return {
      ok: false,
      url: LIVE_HEALTH_URL,
      error: String((error as Error)?.message || error || "Unknown error")
    };
  }
}

function resolveRunbookDocuments(topic: RunbookTopic) {
  return RUNBOOKS[topic].documents.map((id) => {
    if (id === LIVE_DOC.id) {
      return {
        id: LIVE_DOC.id,
        title: LIVE_DOC.title,
        url: LIVE_DOC.url
      };
    }

    const doc = getStaticDocById(id);
    return {
      id: doc.id,
      title: doc.title,
      url: doc.url
    };
  });
}

async function buildStatus(area: StatusArea, includeLiveHealth?: boolean) {
  const resolvedArea = area || "overview";
  const shouldIncludeLiveHealth =
    includeLiveHealth ?? (resolvedArea === "overview" || resolvedArea === "production");

  const status: Record<string, unknown> = {
    checkedAt: new Date().toISOString(),
    area: resolvedArea,
    app: {
      name: APP_NAME,
      version: APP_VERSION,
      archetype: APP_ARCHETYPE,
      authMode: AUTH_MODE,
      mcpPath: MCP_PATH,
      tools: [...TOOL_NAMES],
      documents: listDocs().length
    }
  };

  if (resolvedArea === "overview" || resolvedArea === "skills") {
    status.repoSkills = listSkillSummaries();
    status.availableRunbooks = Object.entries(RUNBOOKS).map(([topic, runbook]) => ({
      topic,
      title: runbook.title
    }));
  }

  if (resolvedArea === "overview" || resolvedArea === "gateway") {
    status.gateway = {
      healthUrl: LIVE_HEALTH_URL,
      actions: extractGatewayActions(),
      recommendedDocs: resolveRunbookDocuments("gateway")
    };
  }

  if (resolvedArea === "overview" || resolvedArea === "production") {
    status.browserRegression = {
      defaultCredentials: {
        SMOKE_USER: "admin",
        SMOKE_PASS: "admin123",
        SMOKE_COHORT_YEAR: "2022"
      },
      localCommand: "cmd /c npm run smoke:modules:local",
      productionCommand: "node scripts/smoke-all-modules.js with SMOKE_URL=https://schoolsystem.com.cn/",
      skill: resolveRunbookDocuments("browser_regression")[0]
    };
  }

  if (shouldIncludeLiveHealth) {
    status.productionHealth = await getLiveHealthSummary();
  }

  return status;
}

function buildRunbook(topic: RunbookTopic) {
  const runbook = RUNBOOKS[topic];
  return {
    topic,
    title: runbook.title,
    summary: runbook.summary,
    steps: runbook.steps,
    validation: runbook.validation,
    documents: resolveRunbookDocuments(topic),
    notes: runbook.notes || []
  };
}

function createAppServer(): McpServer {
  const server = new McpServer({
    name: APP_NAME,
    version: APP_VERSION
  });

  registerAppTool(
    server,
    "search",
    {
      title: "Search school-system operations knowledge",
      description:
        "Use this when you need to search the school-system repository runbooks, release skills, gateway notes, or production health entry point.",
      inputSchema: {
        query: z.string().describe("Natural-language query for repo operations knowledge.")
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true
      },
      _meta: {
        "openai/toolInvocation/invoking": "Searching school-system operations knowledge",
        "openai/toolInvocation/invoked": "Search results ready"
      }
    },
    async ({ query }) => ({
      content: [
        {
          type: "text" as const,
          text: jsonText({
            results: await searchDocuments(query)
          })
        }
      ]
    })
  );

  registerAppTool(
    server,
    "fetch",
    {
      title: "Fetch a school-system operations document",
      description:
        "Use this when you already have a document id from search and need the full text, metadata, or the live production health payload.",
      inputSchema: {
        id: z.string().describe("Document id returned by the search tool.")
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
        idempotentHint: true
      },
      _meta: {
        "openai/toolInvocation/invoking": "Fetching school-system document",
        "openai/toolInvocation/invoked": "Document ready"
      }
    },
    async ({ id }) => ({
      content: [
        {
          type: "text" as const,
          text: jsonText(await fetchDocument(id))
        }
      ]
    })
  );

  registerAppTool(
    server,
    "status",
    {
      title: "Get a compact school-system ops status",
      description:
        "Use this when you want a concise operations snapshot for the repo, production health route, gateway surface, or available repo skills.",
      inputSchema: {
        area: z
          .enum(["overview", "production", "gateway", "skills"])
          .optional()
          .describe("Optional focus area. Defaults to overview."),
        includeLiveHealth: z
          .boolean()
          .optional()
          .describe("When true, include a live read of the production /api/health payload.")
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: true,
        idempotentHint: true
      },
      _meta: {
        "openai/toolInvocation/invoking": "Collecting school-system ops status",
        "openai/toolInvocation/invoked": "Ops status ready"
      }
    },
    async ({ area, includeLiveHealth }) => ({
      content: [
        {
          type: "text" as const,
          text: jsonText(await buildStatus((area || "overview") as StatusArea, includeLiveHealth))
        }
      ]
    })
  );

  registerAppTool(
    server,
    "runbook",
    {
      title: "Get a school-system operations runbook",
      description:
        "Use this when you need the recommended step order for release, browser regression, gateway changes, or local ops-app setup.",
      inputSchema: {
        topic: z
          .enum(["release", "browser_regression", "gateway", "ops_app"])
          .describe("Runbook topic to retrieve.")
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false,
        idempotentHint: true
      },
      _meta: {
        "openai/toolInvocation/invoking": "Loading school-system runbook",
        "openai/toolInvocation/invoked": "Runbook ready"
      }
    },
    async ({ topic }) => ({
      content: [
        {
          type: "text" as const,
          text: jsonText(buildRunbook(topic as RunbookTopic))
        }
      ]
    })
  );

  return server;
}

function writeJson(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(jsonText(body));
}

const httpServer = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400).end("Missing URL");
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
  const isMcpRoute = url.pathname === MCP_PATH || url.pathname.startsWith(`${MCP_PATH}/`);

  if (req.method === "OPTIONS" && isMcpRoute) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "authorization, content-type, mcp-session-id, x-school-ops-token",
      "Access-Control-Expose-Headers": "Mcp-Session-Id"
    });
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/") {
    res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
    res.end(`${APP_NAME} (${APP_ARCHETYPE}) MCP server`);
    return;
  }

  if (req.method === "GET" && url.pathname === "/health") {
    if (!isAuthorizedRequest(req)) {
      writeUnauthorizedResponse(res);
      return;
    }

    writeJson(res, 200, {
      ok: true,
      name: APP_NAME,
      version: APP_VERSION,
      archetype: APP_ARCHETYPE,
      authMode: AUTH_MODE,
      mcpPath: MCP_PATH,
      documents: listDocs().length,
      tools: [...TOOL_NAMES]
    });
    return;
  }

  const transportMethods = new Set(["GET", "POST", "DELETE"]);
  if (isMcpRoute && req.method && transportMethods.has(req.method)) {
    if (!isAuthorizedRequest(req)) {
      writeUnauthorizedResponse(res);
      return;
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createAppServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Failed to handle MCP request:", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.on("error", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Re-run with PORT=<free-port>.`);
    process.exit(1);
  }

  console.error("school-ops-chatgpt-app failed to start:", error);
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`${APP_NAME} listening on http://localhost:${PORT}${MCP_PATH}`);
  console.log(`${APP_NAME} auth mode: ${AUTH_MODE}`);
});
