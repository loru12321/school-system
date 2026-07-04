export const DEFAULT_ALLOWED_CORS_ORIGINS = [
  'https://schoolsystem.com.cn',
  'https://www.schoolsystem.com.cn',
  'https://school-system.hkakjiweu.workers.dev'
];

export const DEFAULT_ALLOWED_CORS_HEADERS = [
  'authorization',
  'apikey',
  'content-type',
  'x-client-info',
  'x-school-client',
  'x-requested-with'
].join(', ');

export const HOP_BY_HOP_HEADERS = [
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade'
];

// ---------------------------------------------------------------------------
// Shared text utilities
// ---------------------------------------------------------------------------

/**
 * Trim a value to a plain string. Returns '' for null/undefined/falsy.
 * Shared by all worker files to avoid duplicate definitions.
 */
export function normalizeText(value) {
  return String(value || '').trim();
}

// ---------------------------------------------------------------------------
// Fetch with timeout
// ---------------------------------------------------------------------------

/**
 * Wraps fetch() with an AbortController-based timeout.
 * @param {string} url
 * @param {RequestInit} init
 * @param {number} timeoutMs  Milliseconds before aborting (default 15 000).
 */
export async function fetchWithTimeout(url, init, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// CORS helpers
// ---------------------------------------------------------------------------

export function normalizeOrigin(origin) {
  return String(origin || '').trim().replace(/\/+$/, '');
}

export function getAllowedCorsOrigins(env = {}) {
  const configured = String(env.ALLOWED_CORS_ORIGINS || '')
    .trim()
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_CORS_ORIGINS, ...configured]);
}

export function isLocalDevelopmentOrigin(origin) {
  try {
    const url = new URL(origin);
    return ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}

export function resolveCorsOrigin(request, env = {}) {
  const normalizedOrigin = normalizeOrigin(request.headers.get('Origin'));
  if (normalizedOrigin === 'null') return '';
  if (!normalizedOrigin) return DEFAULT_ALLOWED_CORS_ORIGINS[0];
  if (getAllowedCorsOrigins(env).has(normalizedOrigin)) return normalizedOrigin;
  if (isLocalDevelopmentOrigin(normalizedOrigin)) return normalizedOrigin;
  try {
    if (normalizedOrigin === new URL(request.url).origin) return normalizedOrigin;
  } catch {}
  return DEFAULT_ALLOWED_CORS_ORIGINS[0];
}

export function buildCorsHeaders(request, env = {}) {
  const origin = resolveCorsOrigin(request, env);
  const headers = {
    'Access-Control-Allow-Headers': DEFAULT_ALLOWED_CORS_HEADERS,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

// ---------------------------------------------------------------------------
// JSON response helper
// ---------------------------------------------------------------------------

/** Default timeout (ms) used when proxying upstream requests. */
export const PROXY_TIMEOUT_MS = 15000;

/**
 * Build a JSON Response with standard security headers and CORS headers.
 * @param {number} status HTTP status code
 * @param {*} body Value serialized with JSON.stringify
 * @param {Request} request Incoming request (for CORS origin resolution)
 * @param {object} [env] Worker env bindings
 * @param {string} [cacheControl] Cache-Control header value
 */
export function jsonResponse(status, body, request, env = {}, cacheControl = 'no-store') {
  const headers = buildCorsHeaders(request, env);
  headers['Content-Type'] = 'application/json; charset=utf-8';
  headers['Cache-Control'] = cacheControl;
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-School-System-Gateway'] = 'cloudflare-worker';
  return new Response(JSON.stringify(body), { status, headers });
}

/**
 * Copy upstream response headers, strip hop-by-hop headers, then inject
 * CORS and security headers for forwarding back to the client.
 */
export function buildForwardHeaders(upstreamHeaders, request, env = {}) {
  const headers = new Headers(upstreamHeaders || {});
  HOP_BY_HOP_HEADERS.forEach((name) => headers.delete(name));
  const corsHeaders = buildCorsHeaders(request, env);
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  headers.set('Cache-Control', 'no-store');
  headers.set('X-Content-Type-Options', 'nosniff');
  return headers;
}

// ---------------------------------------------------------------------------
// Proxy request helpers
// ---------------------------------------------------------------------------

/** Strip hop-by-hop headers from a Headers object and return the new copy. */
export function filterProxyHeaders(headers) {
  const nextHeaders = new Headers(headers);
  HOP_BY_HOP_HEADERS.forEach((name) => nextHeaders.delete(name));
  return nextHeaders;
}

/**
 * Read the request body into an ArrayBuffer.
 * Returns null for GET/HEAD, or an ArrayBuffer (possibly zero-length) otherwise.
 */
export async function readRequestBody(request) {
  const method = String(request.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') return null;
  const buffer = await request.arrayBuffer();
  return buffer.byteLength ? buffer : new ArrayBuffer(0);
}

/** Parse the request body as JSON, throwing 'INVALID_JSON_BODY' on failure. */
export async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('INVALID_JSON_BODY');
  }
}

/**
 * Build a RequestInit suitable for proxying, stripping hop-by-hop headers and
 * merging in any extra headers provided.
 */
export function buildProxyInit(request, bodyBuffer, extraHeaders = {}) {
  const method = String(request.method || 'GET').toUpperCase();
  const headers = filterProxyHeaders(request.headers);
  Object.entries(extraHeaders).forEach(([key, value]) => {
    if (value == null || value === '') {
      headers.delete(key);
      return;
    }
    headers.set(key, value);
  });
  const init = { method, headers, redirect: 'follow' };
  if (bodyBuffer !== null) {
    init.body = bodyBuffer.slice(0);
  }
  return init;
}

/**
 * Proxy a request to targetUrl, forwarding X-Forwarded-* headers and applying
 * PROXY_TIMEOUT_MS.
 */
export async function proxyRequest(url, request, targetUrl, bodyBuffer, extraHeaders = {}) {
  const proxyInit = buildProxyInit(request, bodyBuffer, extraHeaders);
  proxyInit.headers.set('x-forwarded-host', url.host);
  proxyInit.headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
  return fetchWithTimeout(targetUrl, proxyInit, PROXY_TIMEOUT_MS);
}

// ---------------------------------------------------------------------------
// Worker error response helpers
// ---------------------------------------------------------------------------

export function shouldExposeErrorDetails(env = {}) {
  return normalizeText(env.WORKER_DEBUG_ERRORS).toLowerCase() === 'true';
}

export function buildWorkerErrorBody(error, env = {}) {
  const body = {
    ok: false,
    error: 'WORKER_CRASHED',
    message: error instanceof Error ? error.message : String(error)
  };
  if (shouldExposeErrorDetails(env) && error instanceof Error && error.stack) {
    body.stack = error.stack;
  }
  return body;
}

export function buildWorkerErrorHeaders() {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-School-System-Gateway': 'cloudflare-worker'
  };
}

// ---------------------------------------------------------------------------
// JSON parse utility
// ---------------------------------------------------------------------------

/**
 * Parse a JSON string without throwing.  Returns fallbackValue on any error.
 */
export function safeJsonParse(value, fallbackValue = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
}
