export const DEFAULT_ALLOWED_CORS_ORIGINS = [
  'https://schoolsystem.com.cn',
  'https://www.schoolsystem.com.cn',
  'https://school-system.hkakjiweu.workers.dev'
];

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
  if (!normalizedOrigin || normalizedOrigin === 'null') return DEFAULT_ALLOWED_CORS_ORIGINS[0];
  if (getAllowedCorsOrigins(env).has(normalizedOrigin)) return normalizedOrigin;
  if (isLocalDevelopmentOrigin(normalizedOrigin)) return normalizedOrigin;
  try {
    if (normalizedOrigin === new URL(request.url).origin) return normalizedOrigin;
  } catch {}
  return DEFAULT_ALLOWED_CORS_ORIGINS[0];
}

export function buildCorsHeaders(request, env = {}) {
  return {
    'Access-Control-Allow-Origin': resolveCorsOrigin(request, env),
    'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
