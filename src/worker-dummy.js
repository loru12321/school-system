const DEFAULT_SUPABASE_ORIGIN = 'https://okwcciujnfvobbwaydiv.supabase.co';
const GATEWAY_PATHS = ['/functions/v1/edu-gateway-v2', '/functions/v1/edu-gateway'];
const PROXY_TIMEOUT_MS = 15000;
const HOP_BY_HOP_HEADERS = [
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

function normalizeOrigin(origin) {
  return String(origin || '').trim().replace(/\/+$/, '');
}

function getSupabaseOrigin(env) {
  return normalizeOrigin(env.SUPABASE_ORIGIN || DEFAULT_SUPABASE_ORIGIN);
}

function buildCorsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  };
}

function filterProxyHeaders(headers) {
  const nextHeaders = new Headers(headers);
  HOP_BY_HOP_HEADERS.forEach((name) => nextHeaders.delete(name));
  return nextHeaders;
}

async function readRequestBody(request) {
  const method = String(request.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') return null;
  const buffer = await request.arrayBuffer();
  return buffer.byteLength ? buffer : new ArrayBuffer(0);
}

function buildProxyInit(request, bodyBuffer, extraHeaders = {}) {
  const method = String(request.method || 'GET').toUpperCase();
  const headers = filterProxyHeaders(request.headers);
  Object.entries(extraHeaders).forEach(([key, value]) => {
    if (value == null || value === '') {
      headers.delete(key);
      return;
    }
    headers.set(key, value);
  });
  const init = {
    method,
    headers,
    redirect: 'follow'
  };
  if (bodyBuffer !== null) {
    init.body = bodyBuffer.slice(0);
  }
  return init;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function proxyRequest(url, request, targetUrl, bodyBuffer, extraHeaders = {}) {
  const proxyInit = buildProxyInit(request, bodyBuffer, extraHeaders);
  proxyInit.headers.set('x-forwarded-host', url.host);
  proxyInit.headers.set('x-forwarded-proto', url.protocol.replace(':', ''));
  return fetchWithTimeout(targetUrl, proxyInit, PROXY_TIMEOUT_MS);
}

async function handleGatewayProxy(request, env, url) {
  const supabaseOrigin = getSupabaseOrigin(env);
  const bodyBuffer = await readRequestBody(request);
  let lastResponse = null;
  let lastError = null;

  for (const path of GATEWAY_PATHS) {
    try {
      const response = await proxyRequest(url, request, `${supabaseOrigin}${path}`, bodyBuffer);
      if (response.ok || (response.status !== 404 && response.status < 500)) {
        return response;
      }
      lastResponse = response;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastResponse) return lastResponse;
  return new Response(JSON.stringify({
    ok: false,
    error: lastError ? String(lastError.message || lastError) : 'Supabase gateway unavailable'
  }), {
    status: 502,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  });
}

async function handleSupabaseProxy(request, env, url) {
  const supabaseOrigin = getSupabaseOrigin(env);
  const upstreamPath = url.pathname.replace(/^\/sb/, '') || '/';
  const bodyBuffer = await readRequestBody(request);
  const upstreamUrl = `${supabaseOrigin}${upstreamPath}${url.search}`;
  return proxyRequest(url, request, upstreamUrl, bodyBuffer);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS' && (url.pathname === '/api/edu-gateway' || url.pathname.startsWith('/sb/'))) {
      return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(request)
      });
    }

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({
        ok: true,
        supabaseOrigin: getSupabaseOrigin(env)
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      });
    }

    if (url.pathname === '/api/edu-gateway') {
      return handleGatewayProxy(request, env, url);
    }

    if (url.pathname.startsWith('/sb/')) {
      return handleSupabaseProxy(request, env, url);
    }

    try {
      return await env.ASSETS.fetch(request);
    } catch (error) {
      return new Response('Not Found', { status: 404 });
    }
  }
};
