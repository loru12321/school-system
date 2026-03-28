const DEFAULT_SUPABASE_ORIGIN = 'https://okwcciujnfvobbwaydiv.supabase.co';
const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com';
const DEFAULT_AI_MODEL = 'deepseek-chat';
const SYSTEM_DATA_PATH = '/sb/rest/v1/system_data';
const SYSTEM_DATA_TABLE = 'cloud_system_data';
const SYSTEM_DATA_COMPARE_PREFIXES = [
  'STUDENT_COMPARE_',
  'MACRO_COMPARE_',
  'TEACHER_COMPARE_',
  'TOWN_SUB_COMPARE_'
];
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

function getSystemDataDb(env) {
  return env.CLOUD_SYSTEM_DATA_DB || null;
}

function hasSystemDataStorage(env) {
  return !!getSystemDataDb(env);
}

function getSystemDataMode(env) {
  const mode = normalizeText(env.CLOUD_SYSTEM_DATA_MODE).toLowerCase();
  return mode === 'primary' ? 'primary' : 'hybrid';
}

function normalizeText(value) {
  return String(value || '').trim();
}

function parseSystemDataFilterValue(value) {
  return normalizeText(value);
}

function extractSystemDataCohortId(key) {
  const text = normalizeText(key);
  if (!text) return '';
  let match = text.match(/^cohort::(\d{4})/i);
  if (match) return match[1];
  match = text.match(/^TEACHERS_(\d{4})/i);
  if (match) return match[1];
  match = text.match(/^(\d{4})级/);
  if (match) return match[1];
  match = text.match(/(\d{4})级/);
  if (match) return match[1];
  match = text.match(/(\d{4})/);
  return match ? match[1] : '';
}

function inferSystemDataMeta(key) {
  const text = normalizeText(key);
  const cohortId = extractSystemDataCohortId(text);
  let kind = 'generic';
  let keyPrefix = '';
  let projectKey = '';
  let termId = '';

  if (/^cohort::/i.test(text)) {
    kind = 'workspace';
    keyPrefix = 'cohort';
    projectKey = text;
  } else if (/^TEACHERS_/i.test(text)) {
    kind = 'teacher_map';
    keyPrefix = 'TEACHERS';
    const parts = text.split('_').filter(Boolean);
    termId = parts.slice(2).join('_');
  } else if (SYSTEM_DATA_COMPARE_PREFIXES.some((prefix) => text.startsWith(prefix))) {
    kind = 'compare';
    keyPrefix = text.split('_').slice(0, 2).join('_') || 'compare';
  } else if (/^\d{4}级/i.test(text)) {
    kind = 'exam';
    keyPrefix = `${cohortId || ''}级`;
    const parts = text.split('_').filter(Boolean);
    termId = parts.slice(1, 4).join('_');
  }

  return {
    keyPrefix,
    kind,
    cohortId,
    projectKey,
    termId
  };
}

function parseSystemDataSelect(searchParams) {
  const raw = normalizeText(searchParams.get('select'));
  if (!raw || raw === '*') return new Set(['key', 'content', 'created_at', 'updated_at']);
  return new Set(raw.split(',').map((item) => normalizeText(item)).filter(Boolean));
}

function wantsSingleSystemDataObject(request) {
  const accept = String(request.headers.get('accept') || '').toLowerCase();
  return accept.includes('application/vnd.pgrst.object+json');
}

function parseSystemDataKeyFilter(rawFilter) {
  const raw = String(rawFilter || '');
  if (!raw) return null;
  if (raw.startsWith('eq.')) {
    return { op: 'eq', value: parseSystemDataFilterValue(raw.slice(3)) };
  }
  if (raw.startsWith('like.')) {
    return { op: 'like', value: parseSystemDataFilterValue(raw.slice(5)) };
  }
  if (raw.startsWith('in.(') && raw.endsWith(')')) {
    const values = raw
      .slice(4, -1)
      .split(',')
      .map((item) => parseSystemDataFilterValue(item))
      .map((item) => normalizeText(item))
      .filter(Boolean);
    return { op: 'in', values };
  }
  return null;
}

function parseSystemDataOrder(searchParams) {
  const raw = normalizeText(searchParams.get('order'));
  if (!raw) return { column: 'updated_at', direction: 'DESC' };
  const [column, direction] = raw.split('.').map((item) => normalizeText(item).toLowerCase());
  const safeColumn = ['key', 'updated_at', 'created_at'].includes(column) ? column : 'updated_at';
  const safeDirection = direction === 'asc' ? 'ASC' : 'DESC';
  return { column: safeColumn, direction: safeDirection };
}

function parseSystemDataLimit(searchParams, fallback = 100) {
  const raw = Number(searchParams.get('limit') || fallback);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(Math.floor(raw), 1000);
}

async function readStoredSystemDataContent(env, row) {
  if (row && typeof row.content_text === 'string' && row.content_text.length > 0) {
    return row.content_text;
  }
  const bucket = env.CLOUD_SYSTEM_DATA_BUCKET;
  const objectKey = normalizeText(row?.object_key);
  if (!bucket || !objectKey) return '';
  const object = await bucket.get(objectKey);
  if (!object) return '';
  return object.text();
}

function mapSystemDataResponseRow(row, selectSet, content) {
  const out = {};
  if (selectSet.has('key')) out.key = row.key;
  if (selectSet.has('created_at')) out.created_at = row.created_at;
  if (selectSet.has('updated_at')) out.updated_at = row.updated_at;
  if (selectSet.has('size_bytes')) out.size_bytes = Number(row.size_bytes || 0);
  if (selectSet.has('content')) out.content = content;
  return out;
}

async function querySystemDataRows(env, request, url) {
  const db = getSystemDataDb(env);
  if (!db) return { rows: [], selectSet: new Set(['key', 'content', 'created_at', 'updated_at']) };

  const selectSet = parseSystemDataSelect(url.searchParams);
  const keyFilter = parseSystemDataKeyFilter(url.searchParams.get('key'));
  const order = parseSystemDataOrder(url.searchParams);
  const limit = wantsSingleSystemDataObject(request) ? 2 : parseSystemDataLimit(url.searchParams, 100);
  const whereClauses = [];
  const bindings = [];

  if (keyFilter?.op === 'eq') {
    whereClauses.push('key = ?');
    bindings.push(keyFilter.value);
  } else if (keyFilter?.op === 'like') {
    whereClauses.push('key LIKE ?');
    bindings.push(keyFilter.value);
  } else if (keyFilter?.op === 'in' && Array.isArray(keyFilter.values) && keyFilter.values.length) {
    whereClauses.push(`key IN (${keyFilter.values.map(() => '?').join(', ')})`);
    bindings.push(...keyFilter.values);
  }

  const sql = [
    'SELECT key, created_at, updated_at, size_bytes, content_text, object_key',
    `FROM ${SYSTEM_DATA_TABLE}`,
    whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '',
    `ORDER BY ${order.column} ${order.direction}`,
    'LIMIT ?'
  ].filter(Boolean).join(' ');

  const result = await db.prepare(sql).bind(...bindings, limit).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return { rows, selectSet };
}

function buildSystemDataObjectKey(key) {
  return `system-data/${encodeURIComponent(normalizeText(key))}.json`;
}

async function upsertSystemDataRows(env, rows) {
  const db = getSystemDataDb(env);
  if (!db || !Array.isArray(rows) || rows.length === 0) return [];

  const statements = [];
  for (const row of rows) {
    const key = normalizeText(row?.key);
    const content = typeof row?.content === 'string' ? row.content : '';
    if (!key) continue;
    const createdAt = normalizeText(row?.created_at);
    const updatedAt = normalizeText(row?.updated_at) || new Date().toISOString();
    const meta = inferSystemDataMeta(key);
    const sizeBytes = new TextEncoder().encode(content).length;
    const bucket = env.CLOUD_SYSTEM_DATA_BUCKET;
    const objectKey = bucket ? buildSystemDataObjectKey(key) : '';
    let contentText = content;
    let storageBackend = 'd1';

    if (bucket) {
      await bucket.put(objectKey, content, {
        httpMetadata: { contentType: 'application/json; charset=utf-8' },
        customMetadata: {
          key,
          updated_at: updatedAt,
          kind: meta.kind,
          cohort_id: meta.cohortId
        }
      });
      contentText = null;
      storageBackend = 'r2';
    }

    if (createdAt) {
      statements.push(
        db.prepare(`
          INSERT INTO ${SYSTEM_DATA_TABLE}
            (key, content_text, object_key, storage_backend, kind, key_prefix, cohort_id, project_key, term_id, created_at, updated_at, size_bytes)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            content_text = excluded.content_text,
            object_key = excluded.object_key,
            storage_backend = excluded.storage_backend,
            kind = excluded.kind,
            key_prefix = excluded.key_prefix,
            cohort_id = excluded.cohort_id,
            project_key = excluded.project_key,
            term_id = excluded.term_id,
            created_at = excluded.created_at,
            updated_at = excluded.updated_at,
            size_bytes = excluded.size_bytes
        `).bind(
          key,
          contentText,
          objectKey,
          storageBackend,
          meta.kind,
          meta.keyPrefix,
          meta.cohortId,
          meta.projectKey,
          meta.termId,
          createdAt,
          updatedAt,
          sizeBytes
        )
      );
      continue;
    }

    statements.push(
      db.prepare(`
        INSERT INTO ${SYSTEM_DATA_TABLE}
          (key, content_text, object_key, storage_backend, kind, key_prefix, cohort_id, project_key, term_id, updated_at, size_bytes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          content_text = excluded.content_text,
          object_key = excluded.object_key,
          storage_backend = excluded.storage_backend,
          kind = excluded.kind,
          key_prefix = excluded.key_prefix,
          cohort_id = excluded.cohort_id,
          project_key = excluded.project_key,
          term_id = excluded.term_id,
          updated_at = excluded.updated_at,
          size_bytes = excluded.size_bytes
      `).bind(
        key,
        contentText,
        objectKey,
        storageBackend,
        meta.kind,
        meta.keyPrefix,
        meta.cohortId,
        meta.projectKey,
        meta.termId,
        updatedAt,
        sizeBytes
      )
    );
  }

  if (!statements.length) return [];
  await db.batch(statements);
  return rows;
}

async function buildSystemDataJsonResponse(request, env, rows, selectSet) {
  const payloadRows = [];
  for (const row of rows) {
    const content = selectSet.has('content')
      ? await readStoredSystemDataContent(env, row)
      : undefined;
    payloadRows.push(mapSystemDataResponseRow(row, selectSet, content));
  }
  const single = wantsSingleSystemDataObject(request);
  const body = single ? (payloadRows[0] || null) : payloadRows;
  return jsonResponse(200, body, request);
}

async function maybeWarmSystemDataCache(env, response) {
  if (!hasSystemDataStorage(env) || !response.ok) return response;
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (!contentType.includes('application/json')) return response;

  const text = await response.text();
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (_) {
    return new Response(text, {
      status: response.status,
      headers: response.headers
    });
  }

  const rows = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
  const normalizedRows = rows
    .filter((row) => row && typeof row === 'object' && normalizeText(row.key))
    .map((row) => ({
      key: normalizeText(row.key),
      content: typeof row.content === 'string' ? row.content : '',
      created_at: normalizeText(row.created_at),
      updated_at: normalizeText(row.updated_at)
    }))
    .filter((row) => row.key && row.content);

  if (normalizedRows.length) {
    try {
      await upsertSystemDataRows(env, normalizedRows);
    } catch (error) {
      console.warn('[system-data] warm cache failed', error);
    }
  }

  return new Response(text, {
    status: response.status,
    headers: response.headers
  });
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

async function proxySupabaseRequest(request, env, url) {
  const supabaseOrigin = getSupabaseOrigin(env);
  const upstreamPath = url.pathname.replace(/^\/sb/, '') || '/';
  const bodyBuffer = await readRequestBody(request);
  const upstreamUrl = `${supabaseOrigin}${upstreamPath}${url.search}`;
  return proxyRequest(url, request, upstreamUrl, bodyBuffer);
}

async function handleSystemDataRead(request, env, url) {
  const { rows, selectSet } = await querySystemDataRows(env, request, url);
  if (!rows.length) return null;
  return buildSystemDataJsonResponse(request, env, rows, selectSet);
}

async function handleSystemDataWrite(request, env) {
  let payload = null;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse(400, { ok: false, error: 'INVALID_JSON_BODY' }, request);
  }

  const rows = (Array.isArray(payload) ? payload : [payload]).map((row) => ({
    key: normalizeText(row?.key),
    content: typeof row?.content === 'string' ? row.content : '',
    created_at: normalizeText(row?.created_at),
    updated_at: normalizeText(row?.updated_at) || new Date().toISOString()
  })).filter((row) => row.key);

  if (!rows.length) {
    return jsonResponse(400, { ok: false, error: 'SYSTEM_DATA_ROWS_MISSING' }, request);
  }

  await upsertSystemDataRows(env, rows);
  return jsonResponse(201, [], request);
}

async function handleSystemDataDelete(request, env, url) {
  const db = getSystemDataDb(env);
  if (!db) {
    return proxySupabaseRequest(request, env, url);
  }

  const keyFilter = parseSystemDataKeyFilter(url.searchParams.get('key'));
  const bindings = [];
  let whereClause = '';

  if (keyFilter?.op === 'eq') {
    whereClause = 'key = ?';
    bindings.push(keyFilter.value);
  } else if (keyFilter?.op === 'in' && Array.isArray(keyFilter.values) && keyFilter.values.length) {
    whereClause = `key IN (${keyFilter.values.map(() => '?').join(', ')})`;
    bindings.push(...keyFilter.values);
  }

  if (!whereClause) {
    return jsonResponse(400, { ok: false, error: 'SYSTEM_DATA_DELETE_FILTER_MISSING' }, request);
  }

  await db.prepare(`DELETE FROM ${SYSTEM_DATA_TABLE} WHERE ${whereClause}`).bind(...bindings).run();
  return jsonResponse(200, [], request);
}

async function handleSystemDataProxy(request, env, url) {
  if (!hasSystemDataStorage(env)) {
    return proxySupabaseRequest(request, env, url);
  }

  const method = String(request.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') {
    const mode = getSystemDataMode(env);
    const keyFilter = parseSystemDataKeyFilter(url.searchParams.get('key'));
    const shouldTryLocalFirst = mode === 'primary' || keyFilter?.op === 'eq';
    const shouldUseLocalBatchOnly = keyFilter?.op === 'in' && Array.isArray(keyFilter.values) && keyFilter.values.length > 0;

    if (shouldTryLocalFirst || shouldUseLocalBatchOnly) {
      const { rows, selectSet } = await querySystemDataRows(env, request, url);
      if (mode === 'primary' && shouldTryLocalFirst) {
        return buildSystemDataJsonResponse(request, env, rows, selectSet);
      }
      if (shouldTryLocalFirst && rows.length > 0) {
        return buildSystemDataJsonResponse(request, env, rows, selectSet);
      }
      if (shouldUseLocalBatchOnly && rows.length === keyFilter.values.length) {
        return buildSystemDataJsonResponse(request, env, rows, selectSet);
      }
    }

    const upstream = await proxySupabaseRequest(request, env, url);
    return maybeWarmSystemDataCache(env, upstream);
  }

  if (method === 'POST') {
    return handleSystemDataWrite(request, env);
  }

  if (method === 'DELETE') {
    return handleSystemDataDelete(request, env, url);
  }

  return proxySupabaseRequest(request, env, url);
}

async function handleSupabaseProxy(request, env, url) {
  if (url.pathname === SYSTEM_DATA_PATH) {
    return handleSystemDataProxy(request, env, url);
  }
  return proxySupabaseRequest(request, env, url);
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
        supabaseOrigin: getSupabaseOrigin(env),
        cloudSystemDataBackend: hasSystemDataStorage(env) ? 'd1' : 'supabase',
        cloudSystemDataReady: hasSystemDataStorage(env),
        cloudSystemDataMode: getSystemDataMode(env)
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
