import { handleManagedRestRequest } from './worker-gateway-d1.js';
import { resolveSession, hasAnyRole, isAdmin } from './worker-auth.js';
import {
  normalizeText,
  normalizeOrigin,
  fetchWithTimeout,
  buildCorsHeaders,
  jsonResponse,
  buildForwardHeaders,
  proxyRequest,
  readRequestBody,
  PROXY_TIMEOUT_MS
} from './worker-http-helpers.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_LEGACY_GATEWAY_ORIGIN = '';
export const SYSTEM_DATA_PATH = '/sb/rest/v1/system_data';
export const SYSTEM_DATA_API_PATH = '/api/system-data';
// Cold-login bootstrap: one request that batches the workspace row + latest
// same-cohort exam metadata + (optionally) the current exam shard so a fresh
// device pays a single trans-Pacific round-trip instead of 4-6 serial ones.
export const SYSTEM_DATA_BOOTSTRAP_API_PATH = '/api/system-data-bootstrap';
const SYSTEM_DATA_TABLE = 'cloud_system_data';
const SYSTEM_DATA_READ_CACHE_CONTROL = 'public, s-maxage=20, stale-while-revalidate=60';
const SYSTEM_DATA_COMPARE_PREFIXES = [
  'STUDENT_COMPARE_',
  'MACRO_COMPARE_',
  'TEACHER_COMPARE_',
  'TOWN_SUB_COMPARE_'
];
const PROTECTED_REST_PATHS = new Set([
  '/sb/rest/v1/issues',
  '/sb/rest/v1/system_logs'
]);
const PROTECTED_REST_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// ---------------------------------------------------------------------------
// Environment accessors
// ---------------------------------------------------------------------------

function getLegacyGatewayOrigin(env) {
  return normalizeOrigin(env.LEGACY_GATEWAY_ORIGIN || env.SUPABASE_ORIGIN || DEFAULT_LEGACY_GATEWAY_ORIGIN);
}

function getLegacyGatewayApiKey(env) {
  return normalizeText(
    env.SUPABASE_REST_API_KEY
    || env.LEGACY_GATEWAY_API_KEY
    || env.LEGACY_SUPABASE_KEY
  );
}

function getSupabaseRestOrigin(env) {
  return getLegacyGatewayOrigin(env);
}

function getSupabaseRestApiKey(env) {
  return getLegacyGatewayApiKey(env);
}

function hasSupabaseRestOrigin(env) {
  return !!getSupabaseRestOrigin(env);
}

function getSystemDataDb(env) {
  return env.CLOUD_SYSTEM_DATA_DB || null;
}

function hasSystemDataStorage(env) {
  return !!getSystemDataDb(env);
}

function getGatewayDataDb(env) {
  return env.GATEWAY_DATA_DB || null;
}

export function hasGatewayDataStorage(env) {
  return !!getGatewayDataDb(env);
}

function getSystemDataMode(env) {
  const mode = normalizeText(env.CLOUD_SYSTEM_DATA_MODE).toLowerCase();
  if (mode === 'primary') return 'primary';
  if (mode === 'supabase') return 'supabase';
  return 'hybrid';
}

function requiresRestWriteSession(method) {
  return PROTECTED_REST_METHODS.has(String(method || 'GET').toUpperCase());
}

async function requireRestWriteSession(request, env) {
  const resolved = await resolveSession(request, env);
  if (resolved?.error) return resolved.error;
  return null;
}

async function requireSystemDataSession(request, env) {
  const resolved = await resolveSession(request, env);
  if (resolved?.error) return { error: resolved.error };
  return { session: resolved.session };
}

function canWriteSystemData(session) {
  // system_data contains packed score archives. Only the account holder that
  // owns the archive lifecycle may mutate it; directors use the dedicated
  // managed gateway actions for scoped operational records.
  return isAdmin(session);
}

function canWriteSystemDataKey(session, key) {
  return isAdmin(session) && !!normalizeText(key);
}

function canReadSystemData(session) {
  // Teachers, parents, and students must never receive an entire packed
  // cohort through the generic REST surface. Leadership roles retain the
  // existing analytics read path until the per-school shard migration lands.
  return hasAnyRole(session, ['admin', 'director', 'grade_director']);
}

function authorizeSystemDataRead(request, session) {
  if (canReadSystemData(session)) return null;
  return jsonResponse(403, { ok: false, error: 'INSUFFICIENT_ROLE' }, request);
}

function authorizeSystemDataMutationKeys(request, session, keys) {
  if (!canWriteSystemData(session)) {
    return jsonResponse(403, { ok: false, error: 'INSUFFICIENT_ROLE' }, request);
  }
  const normalizedKeys = Array.isArray(keys)
    ? keys.map((key) => normalizeText(key)).filter(Boolean)
    : [];
  if (!normalizedKeys.length) {
    return jsonResponse(400, { ok: false, error: 'SYSTEM_DATA_ROWS_MISSING' }, request);
  }
  const blockedKey = normalizedKeys.find((key) => !canWriteSystemDataKey(session, key));
  if (blockedKey) {
    return jsonResponse(403, { ok: false, error: 'OUT_OF_SCOPE', key: blockedKey }, request);
  }
  return null;
}

async function authorizeSystemDataWriteRequest(request, session) {
  let payload = null;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse(400, { ok: false, error: 'INVALID_JSON_BODY' }, request);
  }

  const rows = Array.isArray(payload) ? payload : [payload];
  return authorizeSystemDataMutationKeys(request, session, rows.map((row) => row?.key));
}

function authorizeSystemDataDeleteRequest(request, session, url) {
  const keyFilter = parseSystemDataKeyFilter(url.searchParams.get('key'));
  let keys = [];
  if (keyFilter?.op === 'eq') {
    keys = [keyFilter.value];
  } else if (keyFilter?.op === 'in' && Array.isArray(keyFilter.values) && keyFilter.values.length) {
    keys = keyFilter.values;
  }

  if (!keys.length) {
    return jsonResponse(400, { ok: false, error: 'SYSTEM_DATA_DELETE_FILTER_MISSING' }, request);
  }
  return authorizeSystemDataMutationKeys(request, session, keys);
}

function isSystemDataHybridMode(env) {
  return getSystemDataMode(env) === 'hybrid';
}

/**
 * Expose relevant system-data backend status fields for /api/health.
 */
export function getSystemDataHealthInfo(env) {
  const cloudSystemDataMode = getSystemDataMode(env);
  const proxying = shouldProxySystemDataToSupabase(env);
  const cloudSystemDataBackend = proxying
    ? 'supabase'
    : (isSystemDataHybridMode(env) ? 'hybrid' : (hasSystemDataStorage(env) ? 'd1' : 'unavailable'));
  const gatewayDataBackend = shouldProxyManagedRestToSupabase(env)
    ? 'supabase'
    : (hasGatewayDataStorage(env) ? 'd1' : 'unavailable');
  return {
    cloudSystemDataBackend,
    cloudSystemDataReady: cloudSystemDataBackend === 'supabase'
      ? hasSupabaseRestOrigin(env)
      : (cloudSystemDataBackend === 'hybrid'
        ? hasSystemDataStorage(env) && hasSupabaseRestOrigin(env)
        : hasSystemDataStorage(env)),
    cloudSystemDataMode,
    cloudSystemDataD1Bound: hasSystemDataStorage(env),
    cloudSystemDataSupabaseReady: hasSupabaseRestOrigin(env),
    gatewayDataBackend,
    gatewayDataReady: gatewayDataBackend === 'supabase' ? hasSupabaseRestOrigin(env) : hasGatewayDataStorage(env),
    gatewayAuthFallback: gatewayDataBackend === 'supabase' ? 'supabase-edge' : 'cloudflare-only'
  };
}

// ---------------------------------------------------------------------------
// Key metadata inference
// ---------------------------------------------------------------------------

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

  if (/^cohort::\d{4}::exam::/i.test(text)) {
    kind = 'exam';
    keyPrefix = 'cohort_exam';
    projectKey = cohortId ? `cohort::${cohortId}` : '';
    termId = text.split('::exam::').slice(1).join('::exam::');
  } else if (/^cohort::/i.test(text)) {
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
  } else if (/^\d{4}/i.test(text)) {
    kind = 'exam';
    keyPrefix = text.match(/^\d{4}级/i) ? `${cohortId || ''}级` : (cohortId || '');
    const parts = text.split('_').filter(Boolean);
    termId = parts.slice(1, 4).join('_');
  }

  return { keyPrefix, kind, cohortId, projectKey, termId };
}

// ---------------------------------------------------------------------------
// Query parameter parsers
// ---------------------------------------------------------------------------

function parseSystemDataFilterValue(value) {
  return normalizeText(value);
}

function parseSystemDataSelect(searchParams) {
  const raw = normalizeText(searchParams.get('select'));
  if (!raw || raw === '*') return new Set(['key', 'content', 'created_at', 'updated_at']);
  return new Set(raw.split(',').map((item) => normalizeText(item)).filter(Boolean));
}

function buildSystemDataSelectColumns(selectSet) {
  const columns = new Set(['key']);
  if (selectSet.has('created_at')) columns.add('created_at');
  if (selectSet.has('updated_at')) columns.add('updated_at');
  if (selectSet.has('size_bytes')) columns.add('size_bytes');
  if (selectSet.has('content')) {
    columns.add('content_text');
    columns.add('object_key');
  }
  return Array.from(columns).join(', ');
}

function wantsSingleSystemDataObject(request) {
  const accept = String(request.headers.get('accept') || '').toLowerCase();
  return accept.includes('application/vnd.pgrst.object+json');
}

function parseSystemDataKeyFilter(rawFilter) {
  const raw = String(rawFilter || '');
  if (!raw) return null;
  if (raw.startsWith('eq.')) return { op: 'eq', value: parseSystemDataFilterValue(raw.slice(3)) };
  if (raw.startsWith('neq.')) return { op: 'neq', value: parseSystemDataFilterValue(raw.slice(4)) };
  if (raw.startsWith('like.')) return { op: 'like', value: parseSystemDataFilterValue(raw.slice(5)) };
  if (raw.startsWith('ilike.')) {
    return { op: 'ilike', value: parseSystemDataFilterValue(raw.slice(6)).replace(/\*/g, '%') };
  }
  if (raw.startsWith('not.like.')) return { op: 'not_like', value: parseSystemDataFilterValue(raw.slice(9)) };
  if (raw.startsWith('not.ilike.')) {
    return { op: 'not_ilike', value: parseSystemDataFilterValue(raw.slice(10)).replace(/\*/g, '%') };
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
  const safeColumn = ['key', 'updated_at', 'created_at', 'size_bytes'].includes(column) ? column : 'updated_at';
  const safeDirection = direction === 'asc' ? 'ASC' : 'DESC';
  return { column: safeColumn, direction: safeDirection };
}

function parseSystemDataLimit(searchParams, fallback = 100) {
  const raw = Number(searchParams.get('limit') || fallback);
  if (!Number.isFinite(raw) || raw <= 0) return fallback;
  return Math.min(Math.floor(raw), 1000);
}

function parseSystemDataOffset(searchParams) {
  const raw = Number(searchParams.get('offset') || 0);
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(Math.floor(raw), 100000);
}

// ---------------------------------------------------------------------------
// SQL clause builders
// ---------------------------------------------------------------------------

function appendSystemDataFilterClause(clauses, bindings, filter, column = 'key') {
  if (!filter || !column) return;
  if (filter.op === 'eq') { clauses.push(`${column} = ?`); bindings.push(filter.value); return; }
  if (filter.op === 'neq') { clauses.push(`${column} <> ?`); bindings.push(filter.value); return; }
  if (filter.op === 'like') { clauses.push(`${column} LIKE ?`); bindings.push(filter.value); return; }
  if (filter.op === 'ilike') { clauses.push(`LOWER(${column}) LIKE LOWER(?)`); bindings.push(filter.value); return; }
  if (filter.op === 'not_like') { clauses.push(`${column} NOT LIKE ?`); bindings.push(filter.value); return; }
  if (filter.op === 'not_ilike') { clauses.push(`LOWER(${column}) NOT LIKE LOWER(?)`); bindings.push(filter.value); return; }
  if (filter.op === 'in' && Array.isArray(filter.values) && filter.values.length) {
    clauses.push(`${column} IN (${filter.values.map(() => '?').join(', ')})`);
    bindings.push(...filter.values);
  }
}

function buildSystemDataKeyFilterClause(filter) {
  if (filter?.op === 'like') {
    const value = normalizeText(filter.value);
    const cohortMatch = value.match(/^(\d{4})%$/);
    if (cohortMatch) {
      return { clauses: ['cohort_id = ?', "kind = 'exam'"], bindings: [cohortMatch[1]], optimized: 'cohort_exam_prefix' };
    }
    const teacherMatch = value.match(/^TEACHERS_(\d{4})%$/i);
    if (teacherMatch) {
      return { clauses: ['key_prefix = ?', 'cohort_id = ?'], bindings: ['TEACHERS', teacherMatch[1]], optimized: 'teacher_cohort_prefix' };
    }
  }
  const clauses = [];
  const bindings = [];
  appendSystemDataFilterClause(clauses, bindings, filter, 'key');
  return { clauses, bindings, optimized: '' };
}

function appendSystemDataMetadataFilter(clauses, bindings, url, paramName, columnName) {
  const allowedColumns = new Set(['kind', 'key_prefix', 'cohort_id', 'project_key', 'term_id']);
  if (!allowedColumns.has(columnName)) return;
  const filter = parseSystemDataKeyFilter(url.searchParams.get(paramName));
  appendSystemDataFilterClause(clauses, bindings, filter, columnName);
}

function buildSystemDataOrClause(rawOr) {
  const text = normalizeText(rawOr);
  if (!text) return { clause: '', bindings: [] };
  const clauses = [];
  const bindings = [];
  for (const item of text.split(',')) {
    const parts = String(item || '').split('.');
    if (parts.length < 3) continue;
    const [column, ...rest] = parts;
    if (column !== 'key') continue;
    const filter = parseSystemDataKeyFilter(rest.join('.'));
    appendSystemDataFilterClause(clauses, bindings, filter, column);
  }
  return { clause: clauses.length ? `(${clauses.join(' OR ')})` : '', bindings };
}

// ---------------------------------------------------------------------------
// D1 query layer
// ---------------------------------------------------------------------------

async function querySystemDataRows(env, request, url) {
  const db = getSystemDataDb(env);
  if (!db) return { rows: [], selectSet: new Set(['key', 'content', 'created_at', 'updated_at']) };

  const selectSet = parseSystemDataSelect(url.searchParams);
  const keyFilter = parseSystemDataKeyFilter(url.searchParams.get('key'));
  const order = parseSystemDataOrder(url.searchParams);
  const limit = wantsSingleSystemDataObject(request) ? 2 : parseSystemDataLimit(url.searchParams, 100);
  const offset = wantsSingleSystemDataObject(request) ? 0 : parseSystemDataOffset(url.searchParams);
  const whereClauses = [];
  const bindings = [];

  const keyWhere = buildSystemDataKeyFilterClause(keyFilter);
  whereClauses.push(...keyWhere.clauses);
  bindings.push(...keyWhere.bindings);
  appendSystemDataMetadataFilter(whereClauses, bindings, url, 'kind', 'kind');
  appendSystemDataMetadataFilter(whereClauses, bindings, url, 'key_prefix', 'key_prefix');
  appendSystemDataMetadataFilter(whereClauses, bindings, url, 'cohort_id', 'cohort_id');
  appendSystemDataMetadataFilter(whereClauses, bindings, url, 'project_key', 'project_key');
  appendSystemDataMetadataFilter(whereClauses, bindings, url, 'term_id', 'term_id');
  const orClause = buildSystemDataOrClause(url.searchParams.get('or'));
  if (orClause.clause) { whereClauses.push(orClause.clause); bindings.push(...orClause.bindings); }

  const sql = [
    `SELECT ${buildSystemDataSelectColumns(selectSet)}`,
    `FROM ${SYSTEM_DATA_TABLE}`,
    whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '',
    `ORDER BY ${order.column} ${order.direction}`,
    'LIMIT ? OFFSET ?'
  ].filter(Boolean).join(' ');

  const result = await db.prepare(sql).bind(...bindings, limit, offset).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return { rows, selectSet };
}

// ---------------------------------------------------------------------------
// D1 upsert layer
// ---------------------------------------------------------------------------

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
        customMetadata: { key, updated_at: updatedAt, kind: meta.kind, cohort_id: meta.cohortId }
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
            content_text = excluded.content_text, object_key = excluded.object_key,
            storage_backend = excluded.storage_backend, kind = excluded.kind,
            key_prefix = excluded.key_prefix, cohort_id = excluded.cohort_id,
            project_key = excluded.project_key, term_id = excluded.term_id,
            created_at = excluded.created_at, updated_at = excluded.updated_at,
            size_bytes = excluded.size_bytes
        `).bind(key, contentText, objectKey, storageBackend, meta.kind, meta.keyPrefix,
          meta.cohortId, meta.projectKey, meta.termId, createdAt, updatedAt, sizeBytes)
      );
      continue;
    }

    statements.push(
      db.prepare(`
        INSERT INTO ${SYSTEM_DATA_TABLE}
          (key, content_text, object_key, storage_backend, kind, key_prefix, cohort_id, project_key, term_id, updated_at, size_bytes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          content_text = excluded.content_text, object_key = excluded.object_key,
          storage_backend = excluded.storage_backend, kind = excluded.kind,
          key_prefix = excluded.key_prefix, cohort_id = excluded.cohort_id,
          project_key = excluded.project_key, term_id = excluded.term_id,
          updated_at = excluded.updated_at, size_bytes = excluded.size_bytes
      `).bind(key, contentText, objectKey, storageBackend, meta.kind, meta.keyPrefix,
        meta.cohortId, meta.projectKey, meta.termId, updatedAt, sizeBytes)
    );
  }

  if (!statements.length) return [];
  await db.batch(statements);
  return rows;
}

// ---------------------------------------------------------------------------
// Response building + edge cache
// ---------------------------------------------------------------------------

async function readStoredSystemDataContent(env, row) {
  if (row && typeof row.content_text === 'string' && row.content_text.length > 0) return row.content_text;
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

async function buildSystemDataJsonResponse(request, env, rows, selectSet, cacheControl = SYSTEM_DATA_READ_CACHE_CONTROL) {
  // Read all R2 objects concurrently instead of awaiting each one serially.
  const contents = await Promise.all(
    rows.map((row) =>
      selectSet.has('content') ? readStoredSystemDataContent(env, row) : Promise.resolve(undefined)
    )
  );
  const payloadRows = rows.map((row, index) => mapSystemDataResponseRow(row, selectSet, contents[index]));
  const single = wantsSingleSystemDataObject(request);
  const body = single ? (payloadRows[0] || null) : payloadRows;
  return jsonResponse(200, body, request, {}, cacheControl);
}

function isSystemDataEdgeCacheEligible(request, url) {
  const method = String(request.method || 'GET').toUpperCase();
  if (method !== 'GET') return false;
  if (!url || url.pathname !== SYSTEM_DATA_API_PATH) return false;
  const searchParams = url.searchParams;
  const selectSet = parseSystemDataSelect(searchParams);
  if (selectSet.has('content')) {
    const version = normalizeText(searchParams.get('cache_version') || searchParams.get('v'));
    return !!version && /^eq\./i.test(normalizeText(searchParams.get('key')));
  }
  return searchParams.has('select') && (searchParams.has('key') || searchParams.has('limit'));
}

function getSystemDataEdgeCacheKey(request, url) {
  const cacheUrl = new URL(url.toString());
  cacheUrl.searchParams.set('__accept', String(request.headers.get('accept') || 'application/json'));
  return new Request(cacheUrl.toString(), { method: 'GET' });
}

function withSystemDataCacheStatus(response, cacheStatus) {
  if (!response || !cacheStatus) return response;
  const headers = new Headers(response.headers);
  headers.set('X-School-System-Cache', cacheStatus);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function handleCachedSystemDataRead(request, env, url) {
  if (!isSystemDataEdgeCacheEligible(request, url)) {
    const { rows, selectSet } = await querySystemDataRows(env, request, url);
    const versionedContent = selectSet.has('content') && normalizeText(url.searchParams.get('cache_version') || url.searchParams.get('v'));
    const cacheControl = selectSet.has('content') && !versionedContent ? 'no-store' : SYSTEM_DATA_READ_CACHE_CONTROL;
    return withSystemDataCacheStatus(
      await buildSystemDataJsonResponse(request, env, rows, selectSet, cacheControl), 'BYPASS'
    );
  }

  const cache = globalThis.caches && globalThis.caches.default;
  const cacheKey = getSystemDataEdgeCacheKey(request, url);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return withSystemDataCacheStatus(cached, 'HIT');
  }

  const { rows, selectSet } = await querySystemDataRows(env, request, url);
  const response = await buildSystemDataJsonResponse(request, env, rows, selectSet);
  if (cache && response.ok) await cache.put(cacheKey, response.clone());
  return withSystemDataCacheStatus(response, cache ? 'MISS' : 'BYPASS');
}

// ---------------------------------------------------------------------------
// system_data CRUD handlers (D1 mode)
// ---------------------------------------------------------------------------

async function handleSystemDataRead(request, env, url) {
  const { rows, selectSet } = await querySystemDataRows(env, request, url);
  if (!rows.length) return null;
  return buildSystemDataJsonResponse(request, env, rows, selectSet);
}

// ---------------------------------------------------------------------------
// Cold-login bootstrap (batched read)
// ---------------------------------------------------------------------------

/**
 * POST /api/system-data-bootstrap
 *
 * Body: { cohortKey, cohortId?, currentExamKey?, latestExamLimit? }
 *
 * Runs three reads in a single db.batch() and returns them together so a cold
 * device restores its workspace in ONE round-trip:
 *   - workspaceRow: the cohort workspace snapshot row (content + updated_at)
 *   - examMeta:     latest same-cohort exam rows (key + updated_at), newest first
 *   - currentShard: the current exam's content, ONLY when currentExamKey both
 *                   belongs to the cohort and is the newest exam row — otherwise
 *                   null, so the client keeps its "restore the latest exam"
 *                   contract and picks the shard itself.
 *
 * Read-only: no writes, no cache mutation. Falls back (501) when D1 storage is
 * absent (e.g. supabase-only deployments) so the client reverts to the legacy
 * multi-request path.
 */
export async function handleSystemDataBootstrapProxy(request, env) {
  const method = String(request.method || 'POST').toUpperCase();
  if (method !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'SYSTEM_DATA_METHOD_NOT_ALLOWED' }, request);
  }
  const auth = await requireSystemDataSession(request, env);
  if (auth.error) return auth.error;
  // Batched read → read authorization (never mutates), regardless of the POST verb.
  const authorizationError = authorizeSystemDataRead(request, auth.session);
  if (authorizationError) return authorizationError;
  // Supabase-only deployments have no local D1 to batch against → let the client
  // fall back to the legacy multi-request path.
  if (shouldProxySystemDataToSupabase(env)) {
    return jsonResponse(501, { ok: false, error: 'SYSTEM_DATA_BOOTSTRAP_UNAVAILABLE' }, request);
  }
  return handleSystemDataBootstrap(request, env);
}

async function handleSystemDataBootstrap(request, env) {
  const db = getSystemDataDb(env);
  if (!db || typeof db.batch !== 'function') {
    return jsonResponse(501, { ok: false, error: 'SYSTEM_DATA_BOOTSTRAP_UNAVAILABLE' }, request);
  }

  let payload = null;
  try {
    payload = await request.json();
  } catch (error) {
    return jsonResponse(400, { ok: false, error: 'INVALID_JSON_BODY' }, request);
  }

  const cohortKey = normalizeText(payload?.cohortKey);
  if (!cohortKey) return jsonResponse(400, { ok: false, error: 'SYSTEM_DATA_BOOTSTRAP_KEY_MISSING' }, request);
  const cohortId = normalizeText(payload?.cohortId) || extractSystemDataCohortId(cohortKey);
  const rawLimit = Number(payload?.latestExamLimit);
  const latestExamLimit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 24) : 12;

  // Phase 1 (one in-region D1 batch): workspace row + latest same-cohort exam
  // metadata. Selection stays 100% client-side (compareWorkspaceExamRows scoring),
  // so we only ORDER BY updated_at here to bound the candidate window — never to
  // decide which exam wins.
  const statements = [
    db.prepare(`SELECT key, updated_at, content_text, object_key FROM ${SYSTEM_DATA_TABLE} WHERE key = ?`).bind(cohortKey)
  ];
  if (cohortId) {
    statements.push(
      db.prepare(`SELECT key, updated_at FROM ${SYSTEM_DATA_TABLE} WHERE cohort_id = ? AND kind = 'exam' ORDER BY updated_at DESC LIMIT ?`).bind(cohortId, latestExamLimit)
    );
  }

  let results;
  try {
    results = await db.batch(statements);
  } catch (error) {
    return jsonResponse(500, { ok: false, error: 'SYSTEM_DATA_BOOTSTRAP_BATCH_FAILED' }, request);
  }
  const firstRow = (res) => (res && Array.isArray(res.results) ? res.results[0] : null) || null;
  const allRows = (res) => (res && Array.isArray(res.results) ? res.results : []);

  const workspaceRaw = firstRow(results[0]);
  const examMetaRows = allRows(results[1]).map((row) => ({ key: row.key, updated_at: row.updated_at }));

  // Prefetch the newest exam's shard (by updated_at) so the common case — the
  // client's compareWorkspaceExamRows pick equals the newest row — restores in a
  // single client round-trip. The client re-runs its own selection and only uses
  // this shard when its pick matches shard.key; otherwise it discards it and
  // fetches the correct shard, so this is a hint, never an authority.
  const newestExamKey = examMetaRows.length ? normalizeText(examMetaRows[0].key) : '';
  let currentShard = null;
  if (newestExamKey) {
    const shardRes = await db
      .prepare(`SELECT key, updated_at, content_text, object_key FROM ${SYSTEM_DATA_TABLE} WHERE key = ?`)
      .bind(newestExamKey)
      .all()
      .catch(() => null);
    const shardRaw = firstRow(shardRes);
    if (shardRaw) {
      const shardContent = await readStoredSystemDataContent(env, shardRaw);
      if (shardContent) currentShard = { key: shardRaw.key, updated_at: shardRaw.updated_at, content: shardContent };
    }
  }

  const workspaceContent = workspaceRaw ? await readStoredSystemDataContent(env, workspaceRaw) : '';
  const workspaceRow = workspaceRaw
    ? { key: workspaceRaw.key, updated_at: workspaceRaw.updated_at, content: workspaceContent }
    : null;

  return jsonResponse(200, {
    ok: true,
    mode: 'batch',
    workspaceRow,
    examMeta: examMetaRows,
    currentShard
  }, request);
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

  if (!rows.length) return jsonResponse(400, { ok: false, error: 'SYSTEM_DATA_ROWS_MISSING' }, request);
  await upsertSystemDataRows(env, rows);
  return jsonResponse(201, [], request);
}

async function handleSystemDataDelete(request, env, url) {
  const db = getSystemDataDb(env);
  if (!db) return jsonResponse(503, { ok: false, error: 'SYSTEM_DATA_STORAGE_UNAVAILABLE' }, request);

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

  if (!whereClause) return jsonResponse(400, { ok: false, error: 'SYSTEM_DATA_DELETE_FILTER_MISSING' }, request);
  await db.prepare(`DELETE FROM ${SYSTEM_DATA_TABLE} WHERE ${whereClause}`).bind(...bindings).run();
  return jsonResponse(200, [], request);
}

// ---------------------------------------------------------------------------
// Supabase proxy helpers
// ---------------------------------------------------------------------------

function shouldProxySystemDataToSupabase(env) {
  return getSystemDataMode(env) === 'supabase' || (!hasSystemDataStorage(env) && hasSupabaseRestOrigin(env));
}

function shouldProxyManagedRestToSupabase(env) {
  return !hasGatewayDataStorage(env) && hasSupabaseRestOrigin(env);
}

function buildSupabaseRestTargetUrl(env, url, explicitPath = '') {
  const origin = getSupabaseRestOrigin(env);
  if (!origin) return '';
  const pathname = explicitPath || String(url.pathname || '').replace(/^\/sb/, '');
  if (pathname.includes('?')) return `${origin}${pathname}`;
  return `${origin}${pathname}${url.search || ''}`;
}

async function readNormalizedSystemDataProxyBody(request) {
  let bodyBuffer = await readRequestBody(request);
  if (bodyBuffer) {
    try {
      const text = new TextDecoder().decode(bodyBuffer);
      const payload = JSON.parse(text);
      const normalizeRow = (row) => {
        if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
        const next = { ...row };
        if (next.created_at === '') delete next.created_at;
        if (next.updated_at === '') delete next.updated_at;
        return next;
      };
      const normalizedPayload = Array.isArray(payload) ? payload.map(normalizeRow) : normalizeRow(payload);
      bodyBuffer = new TextEncoder().encode(JSON.stringify(normalizedPayload));
    } catch (_) {
      // Keep the original payload if it is not JSON or cannot be normalized safely.
    }
  }
  return bodyBuffer;
}

async function proxySupabaseRestRequest(request, env, url, explicitPath = '', options = {}) {
  const targetUrl = buildSupabaseRestTargetUrl(env, url, explicitPath);
  const apikey = getSupabaseRestApiKey(env);
  if (!targetUrl || !apikey) {
    return jsonResponse(503, { ok: false, error: 'SUPABASE_REST_PROXY_UNAVAILABLE' }, request);
  }
  const bodyBuffer = options.bodyBuffer !== undefined ? options.bodyBuffer : await readRequestBody(request);
  return proxyRequest(url, request, targetUrl, bodyBuffer,
    Object.assign({ apikey, Authorization: `Bearer ${apikey}` }, options.extraHeaders || {}));
}

async function proxySystemDataReadToSupabase(request, env, url) {
  const targetUrl = new URL(buildSupabaseRestTargetUrl(env, url, '/rest/v1/system_data'));
  const apikey = getSupabaseRestApiKey(env);
  if (!apikey) return jsonResponse(503, { ok: false, error: 'SUPABASE_REST_PROXY_UNAVAILABLE' }, request);

  const selectSet = parseSystemDataSelect(url.searchParams);
  const requestedContent = selectSet.has('content');
  const requestedSizeBytes = selectSet.has('size_bytes');
  const upstreamSelect = new Set(selectSet);
  upstreamSelect.delete('size_bytes');
  if (requestedSizeBytes) upstreamSelect.add('content');
  if (!upstreamSelect.size) upstreamSelect.add('key');
  targetUrl.searchParams.set('select', Array.from(upstreamSelect).join(','));

  const response = await fetchWithTimeout(targetUrl.toString(), {
    method: 'GET',
    headers: { apikey, Authorization: `Bearer ${apikey}`, Accept: 'application/json' }
  }, PROXY_TIMEOUT_MS);

  if (!response.ok) {
    const text = await response.text();
    return new Response(text, { status: response.status, statusText: response.statusText, headers: buildForwardHeaders(response.headers, request) });
  }

  if (!requestedSizeBytes) {
    const fwdHeaders = buildForwardHeaders(response.headers, request);
    fwdHeaders.set('Cache-Control', SYSTEM_DATA_READ_CACHE_CONTROL);
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: fwdHeaders });
  }

  const text = await response.text();
  let parsed = [];
  try { parsed = text ? JSON.parse(text) : []; } catch {
    return new Response(text, { status: response.status, statusText: response.statusText, headers: buildForwardHeaders(response.headers, request) });
  }

  const rows = Array.isArray(parsed) ? parsed : (parsed ? [parsed] : []);
  const payloadRows = rows.map((row) => {
    const next = {};
    if (selectSet.has('key')) next.key = row.key;
    if (selectSet.has('created_at')) next.created_at = row.created_at;
    if (selectSet.has('updated_at')) next.updated_at = row.updated_at;
    if (requestedContent) next.content = typeof row.content === 'string' ? row.content : '';
    if (requestedSizeBytes) next.size_bytes = new TextEncoder().encode(typeof row.content === 'string' ? row.content : '').length;
    return next;
  });

  const body = wantsSingleSystemDataObject(request) ? (payloadRows[0] || null) : payloadRows;
  return jsonResponse(200, body, request, {}, SYSTEM_DATA_READ_CACHE_CONTROL);
}

async function proxySystemDataWriteToSupabase(request, env, url) {
  const targetUrl = new URL(buildSupabaseRestTargetUrl(env, url, '/rest/v1/system_data'));
  targetUrl.searchParams.set('on_conflict', 'key');
  const bodyBuffer = await readNormalizedSystemDataProxyBody(request);
  return proxySupabaseRestRequest(request, env, url, targetUrl.pathname + targetUrl.search, {
    bodyBuffer,
    extraHeaders: { Prefer: 'resolution=merge-duplicates,return=representation' }
  });
}

// ---------------------------------------------------------------------------
// Public route handlers
// ---------------------------------------------------------------------------

/**
 * Unified system_data handler — dispatches to D1, Supabase proxy, or hybrid
 * depending on env configuration.
 */
export async function handleSystemDataProxy(request, env, url) {
  const method = String(request.method || 'GET').toUpperCase();
  const auth = await requireSystemDataSession(request, env);
  if (auth.error) return auth.error;
  const session = auth.session;

  if (method === 'GET' || method === 'HEAD') {
    const authorizationError = authorizeSystemDataRead(request, session);
    if (authorizationError) return authorizationError;
  }

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    const authorizationError = await authorizeSystemDataWriteRequest(request.clone(), session);
    if (authorizationError) return authorizationError;
  }

  if (method === 'DELETE') {
    const authorizationError = authorizeSystemDataDeleteRequest(request, session, url);
    if (authorizationError) return authorizationError;
  }

  if (shouldProxySystemDataToSupabase(env)) {
    if (method === 'GET' || method === 'HEAD') return proxySystemDataReadToSupabase(request, env, url);
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') return proxySystemDataWriteToSupabase(request, env, url);
    if (method === 'DELETE') return proxySupabaseRestRequest(request, env, url, '/rest/v1/system_data');
    return jsonResponse(405, { ok: false, error: 'SYSTEM_DATA_METHOD_NOT_ALLOWED' }, request);
  }

  if (!hasSystemDataStorage(env)) return jsonResponse(503, { ok: false, error: 'SYSTEM_DATA_STORAGE_UNAVAILABLE' }, request);

  if (isSystemDataHybridMode(env)) {
    if (method === 'GET' || method === 'HEAD') {
      const d1Response = method === 'GET'
        ? await handleCachedSystemDataRead(request, env, url)
        : await handleSystemDataRead(request, env, url);
      return d1Response || proxySystemDataReadToSupabase(request, env, url);
    }
    if (method === 'POST') {
      const supabaseRequest = request.clone();
      const [d1Response, supabaseResponse] = await Promise.all([
        handleSystemDataWrite(request, env),
        proxySystemDataWriteToSupabase(supabaseRequest, env, url)
      ]);
      return supabaseResponse.ok ? d1Response : supabaseResponse;
    }
    if (method === 'DELETE') {
      const supabaseRequest = request.clone();
      const [d1Response, supabaseResponse] = await Promise.all([
        handleSystemDataDelete(request, env, url),
        proxySupabaseRestRequest(supabaseRequest, env, url, '/rest/v1/system_data')
      ]);
      return supabaseResponse.ok ? d1Response : supabaseResponse;
    }
    return jsonResponse(405, { ok: false, error: 'SYSTEM_DATA_METHOD_NOT_ALLOWED' }, request);
  }

  if (method === 'GET' || method === 'HEAD') {
    return method === 'GET' ? handleCachedSystemDataRead(request, env, url) : handleSystemDataRead(request, env, url);
  }
  if (method === 'POST') return handleSystemDataWrite(request, env);
  if (method === 'DELETE') return handleSystemDataDelete(request, env, url);
  return jsonResponse(405, { ok: false, error: 'SYSTEM_DATA_METHOD_NOT_ALLOWED' }, request);
}

/**
 * Handler for /sb/* paths — routes system_data requests locally and delegates
 * all other REST paths to the managed gateway or Supabase proxy.
 */
export async function handleCloudRestProxy(request, env, url) {
  if (url.pathname === SYSTEM_DATA_PATH) return handleSystemDataProxy(request, env, url);

  if (PROTECTED_REST_PATHS.has(url.pathname) && requiresRestWriteSession(request.method)) {
    const authError = await requireRestWriteSession(request, env);
    if (authError) return authError;
  }

  if (shouldProxyManagedRestToSupabase(env)) return proxySupabaseRestRequest(request, env, url);

  try {
    const managed = await handleManagedRestRequest(request, env, url);
    if (managed) return managed;
  } catch (error) {
    return jsonResponse(500, {
      ok: false,
      error: 'MANAGED_REST_RUNTIME_FAILED',
      detail: error instanceof Error ? error.message : String(error)
    }, request);
  }
  return jsonResponse(404, { ok: false, error: 'CLOUDFLARE_REST_PATH_NOT_SUPPORTED' }, request);
}
