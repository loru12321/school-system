const DEFAULT_SUPABASE_ORIGIN = 'https://okwcciujnfvobbwaydiv.supabase.co';
const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-chat';
const DEFAULT_AI_ALLOWED_HOSTS = [
  'api.deepseek.com',
  'api.openai.com',
  'api.siliconflow.cn',
  'dashscope.aliyuncs.com',
  'ark.cn-beijing.volces.com',
  'openrouter.ai'
];
const GATEWAY_PATHS = ['/functions/v1/edu-gateway-v2', '/functions/v1/edu-gateway'];
const PROXY_TIMEOUT_MS = 15000;
const AI_PROXY_TIMEOUT_MS = 120000;
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

function getAllowedAiHosts(env) {
  const allowed = new Set(DEFAULT_AI_ALLOWED_HOSTS);
  const envHosts = String(env.AI_ALLOWED_HOSTS || '').trim();
  if (envHosts) {
    envHosts
      .split(',')
      .map((host) => String(host || '').trim().toLowerCase())
      .filter(Boolean)
      .forEach((host) => allowed.add(host));
  }
  return allowed;
}

function isAllowedAiHostname(hostname, allowedHosts) {
  const normalized = String(hostname || '').trim().toLowerCase();
  if (!normalized) return false;
  if (allowedHosts.has(normalized)) return true;
  return normalized.endsWith('.openai.azure.com');
}

function resolveAiBaseUrl(rawBaseUrl, env) {
  const candidate = String(rawBaseUrl || env.AI_BASE_URL || DEFAULT_AI_BASE_URL).trim();
  if (!candidate) {
    throw new Error('AI_BASE_URL_MISSING');
  }
  let parsed = null;
  try {
    parsed = new URL(candidate);
  } catch (error) {
    throw new Error('AI_BASE_URL_INVALID');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('AI_BASE_URL_PROTOCOL_INVALID');
  }
  if (!isAllowedAiHostname(parsed.hostname, getAllowedAiHosts(env))) {
    throw new Error('AI_BASE_URL_HOST_NOT_ALLOWED');
  }
  return parsed.toString().replace(/\/+$/, '');
}

function buildAiMessages(payload, defaultSystemPrompt = '') {
  if (Array.isArray(payload.messages) && payload.messages.length) {
    return payload.messages
      .map((message) => ({
        role: String(message?.role || '').trim(),
        content: String(message?.content || '')
      }))
      .filter((message) => message.role && message.content);
  }
  const messages = [];
  const systemPrompt = String(payload.systemPrompt || defaultSystemPrompt || '').trim();
  const userPrompt = String(payload.prompt || '').trim();
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  if (userPrompt) messages.push({ role: 'user', content: userPrompt });
  return messages;
}

function buildAiRequestPayload(payload, env, defaultSystemPrompt = '') {
  const baseUrl = resolveAiBaseUrl(payload.baseURL, env);
  const apiKey = String(env.AI_API_KEY || payload.apiKey || '').trim();
  if (!apiKey) {
    throw new Error('AI_API_KEY_MISSING');
  }
  const model = String(payload.model || env.AI_MODEL || DEFAULT_AI_MODEL).trim() || DEFAULT_AI_MODEL;
  const messages = buildAiMessages(payload, defaultSystemPrompt);
  if (!messages.length) {
    throw new Error('AI_MESSAGES_MISSING');
  }
  const upstreamPayload = {
    model,
    messages,
    stream: payload.stream !== false
  };
  if (Number.isFinite(Number(payload.maxTokens))) {
    upstreamPayload.max_tokens = Number(payload.maxTokens);
  }
  if (Number.isFinite(Number(payload.temperature))) {
    upstreamPayload.temperature = Number(payload.temperature);
  }
  return { apiKey, baseUrl, upstreamPayload };
}

function buildForwardHeaders(upstreamHeaders, request) {
  const headers = new Headers(upstreamHeaders || {});
  HOP_BY_HOP_HEADERS.forEach((name) => headers.delete(name));
  const corsHeaders = buildCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
  headers.set('Cache-Control', 'no-store');
  return headers;
}

function jsonResponse(status, body, request) {
  const headers = buildCorsHeaders(request);
  headers['Content-Type'] = 'application/json; charset=utf-8';
  headers['Cache-Control'] = 'no-store';
  return new Response(JSON.stringify(body), { status, headers });
}

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch (error) {
    throw new Error('INVALID_JSON_BODY');
  }
}

async function fetchAIUpstream(payload, env, request, defaultSystemPrompt = '') {
  const { apiKey, baseUrl, upstreamPayload } = buildAiRequestPayload(payload, env, defaultSystemPrompt);
  const response = await fetchWithTimeout(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(upstreamPayload)
  }, AI_PROXY_TIMEOUT_MS);
  if (!response.ok) {
    const detailText = await response.text().catch(() => '');
    return {
      ok: false,
      response,
      detailText
    };
  }
  return {
    ok: true,
    response
  };
}

async function handleAIChatProxy(request, env) {
  let payload = null;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    return jsonResponse(400, { ok: false, error: String(error.message || error) }, request);
  }

  let upstream = null;
  try {
    upstream = await fetchAIUpstream(payload, env, request);
  } catch (error) {
    return jsonResponse(400, { ok: false, error: String(error.message || error) }, request);
  }

  if (!upstream.ok) {
    return jsonResponse(upstream.response.status || 502, {
      ok: false,
      error: `AI upstream error: ${upstream.response.status}`,
      detail: String(upstream.detailText || '').slice(0, 1000)
    }, request);
  }

  return new Response(upstream.response.body, {
    status: upstream.response.status,
    headers: buildForwardHeaders(upstream.response.headers, request)
  });
}

async function handleAIDiagnoseProxy(request, env) {
  let payload = null;
  try {
    payload = await readJsonBody(request);
  } catch (error) {
    return jsonResponse(400, { ok: false, error: String(error.message || error) }, request);
  }

  let upstream = null;
  try {
    upstream = await fetchAIUpstream(
      { ...payload, stream: false },
      env,
      request,
      payload.systemPrompt || '你是一位资深的教育诊断专家，请根据学生数据提供具体、温和、可执行的学习建议。'
    );
  } catch (error) {
    return jsonResponse(400, { ok: false, error: String(error.message || error) }, request);
  }

  if (!upstream.ok) {
    return jsonResponse(upstream.response.status || 502, {
      ok: false,
      error: `AI upstream error: ${upstream.response.status}`,
      detail: String(upstream.detailText || '').slice(0, 1000)
    }, request);
  }

  let data = null;
  try {
    data = await upstream.response.json();
  } catch (error) {
    return jsonResponse(502, { ok: false, error: 'AI_DIAGNOSE_PARSE_FAILED' }, request);
  }
  const resultText = data?.choices?.[0]?.message?.content || data?.result || data?.diagnosis || '';
  return jsonResponse(200, {
    ok: true,
    diagnosis: resultText,
    result: resultText
  }, request);
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

    if (request.method === 'OPTIONS' && (
      url.pathname === '/api/edu-gateway'
      || url.pathname.startsWith('/sb/')
      || url.pathname.startsWith('/api/ai/')
    )) {
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

    if (url.pathname === '/api/ai/chat') {
      return handleAIChatProxy(request, env);
    }

    if (url.pathname === '/api/ai/diagnose') {
      return handleAIDiagnoseProxy(request, env);
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
