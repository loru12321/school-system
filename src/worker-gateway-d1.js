// Managed D1 account/data gateway implementation imported by src/worker-dummy.js.
// It is not the Wrangler main entrypoint; keep production routing in worker-dummy.js.
import { buildCorsHeaders, normalizeText } from './worker-http-helpers.js';
import { signLocalSession } from './worker-crypto.js';
import {
  jsonResponse, badRequest,
  buildSessionPayload, ensureLoginSessionsTable,
  resolveSession, performGatewayLogin,
  buildSessionCookie, clearSessionCookie
} from './worker-auth.js';
import {
  handleAccountSearch, handleLoginSessionList,
  handleAccountUpdate, handleAccountResetPassword, handleAccountChangePassword,
  handleAccountExport, handleAccountUpsertMany,
  handleAccountDeleteNonAdmin, handleAccountMigrationStatus
} from './worker-accounts.js';
import {
  handleAliasList, handleAliasSave,
  handleWarningList, handleWarningIgnore,
  handleRectifyList, handleRectifySave, handleRectifyUpdate
} from './worker-data-quality.js';
import {
  handleVersionList, handleVersionCreate,
  handleVersionUpdate, handleVersionDelete
} from './worker-versions.js';
import { handleAssessmentScoreSync, handleAssessmentSyncSettingsGet } from './worker-assessment.js';

const REST_META_KEYS = new Set(['select', 'order', 'limit', 'offset', 'or']);

function getGatewayDb(env) {
  return env.GATEWAY_DATA_DB || null;
}

function readSelectFields(url, defaultFields) {
  const raw = normalizeText(url.searchParams.get('select'));
  if (!raw || raw === '*') return defaultFields.slice();
  return raw.split(',').map((field) => normalizeText(field)).filter(Boolean);
}

function parseOrder(url, fallbackColumn) {
  const raw = normalizeText(url.searchParams.get('order'));
  if (!raw) return { column: fallbackColumn, direction: 'DESC' };
  const [column, direction] = raw.split('.').map((item) => normalizeText(item));
  return {
    column: column || fallbackColumn,
    direction: String(direction || 'desc').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
  };
}

function parseLimit(url, fallbackValue = 100) {
  const value = Number(url.searchParams.get('limit') || fallbackValue);
  if (!Number.isFinite(value) || value <= 0) return fallbackValue;
  return Math.min(Math.floor(value), 1000);
}

function parseOffset(url) {
  const value = Number(url.searchParams.get('offset') || 0);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

function parseRestFilterExpression(raw) {
  const text = String(raw || '');
  if (text.startsWith('eq.')) return { op: 'eq', value: text.slice(3) };
  if (text.startsWith('neq.')) return { op: 'neq', value: text.slice(4) };
  if (text.startsWith('ilike.')) return { op: 'ilike', value: text.slice(6).replace(/\*/g, '%') };
  if (text.startsWith('like.')) return { op: 'like', value: text.slice(5) };
  if (text.startsWith('is.')) return { op: 'is', value: text.slice(3) };
  if (text.startsWith('in.(') && text.endsWith(')')) {
    return {
      op: 'in',
      values: text.slice(4, -1).split(',').map((item) => normalizeText(item)).filter(Boolean)
    };
  }
  return null;
}

function buildRestWhereClause(url, allowedColumns) {
  const clauses = [];
  const bindings = [];

  for (const [key, rawValue] of url.searchParams.entries()) {
    if (REST_META_KEYS.has(key) || !allowedColumns.includes(key)) continue;
    const filter = parseRestFilterExpression(rawValue);
    if (!filter) continue;
    if (filter.op === 'eq') {
      clauses.push(`${key} = ?`);
      bindings.push(filter.value);
      continue;
    }
    if (filter.op === 'neq') {
      clauses.push(`${key} <> ?`);
      bindings.push(filter.value);
      continue;
    }
    if (filter.op === 'ilike' || filter.op === 'like') {
      clauses.push(`LOWER(${key}) LIKE LOWER(?)`);
      bindings.push(filter.value);
      continue;
    }
    if (filter.op === 'is') {
      if (String(filter.value).toLowerCase() === 'null') {
        clauses.push(`${key} IS NULL`);
      } else {
        clauses.push(`${key} IS ?`);
        bindings.push(filter.value);
      }
      continue;
    }
    if (filter.op === 'in' && Array.isArray(filter.values) && filter.values.length) {
      clauses.push(`${key} IN (${filter.values.map(() => '?').join(', ')})`);
      bindings.push(...filter.values);
    }
  }

  const orRaw = normalizeText(url.searchParams.get('or'));
  if (orRaw) {
    const orClauses = [];
    for (const item of orRaw.split(',')) {
      const parts = String(item || '').split('.');
      if (parts.length < 3) continue;
      const [column, op, ...rest] = parts;
      if (!allowedColumns.includes(column)) continue;
      const filter = parseRestFilterExpression(`${op}.${rest.join('.')}`);
      if (!filter) continue;
      if (filter.op === 'eq') {
        orClauses.push(`${column} = ?`);
        bindings.push(filter.value);
      } else if (filter.op === 'is' && String(filter.value).toLowerCase() === 'null') {
        orClauses.push(`${column} IS NULL`);
      }
    }
    if (orClauses.length) clauses.push(`(${orClauses.join(' OR ')})`);
  }

  return {
    clause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    bindings
  };
}

function buildContentRange(offset, count) {
  if (!count) return '*/0';
  return `${offset}-${offset + Math.max(count - 1, 0)}/${count}`;
}

function buildRestResponse(request, rows, count, offset = 0, status = 200, selectFields = []) {
  const headers = buildCorsHeaders(request);
  headers['Cache-Control'] = 'no-store';
  headers['Content-Range'] = buildContentRange(offset, count);
  headers['Range-Unit'] = 'items';
  if (request.method === 'HEAD') {
    return new Response(null, { status, headers });
  }
  headers['Content-Type'] = 'application/json; charset=utf-8';
  const payload = rows.map((row) => {
    if (!selectFields.length || selectFields.includes('*')) return row;
    const next = {};
    selectFields.forEach((field) => {
      if (field in row) next[field] = row[field];
    });
    return next;
  });
  return new Response(JSON.stringify(payload), { status, headers });
}

async function handleManagedRestTable(request, env, url, config) {
  const db = getGatewayDb(env);
  if (!db) return null;

  const method = String(request.method || 'GET').toUpperCase();
  const allowedColumns = config.columns;
  const order = parseOrder(url, config.defaultOrderColumn);
  const limit = parseLimit(url, 100);
  const offset = parseOffset(url);
  const selectFields = readSelectFields(url, config.columns);
  const where = buildRestWhereClause(url, allowedColumns);

  if (method === 'GET' || method === 'HEAD') {
    // Use LIMIT n+1 to infer "has more" without a separate COUNT(*) query,
    // saving one D1 round-trip per request.
    const fetchLimit = limit + 1;
    const rowsResult = await db.prepare(`
      SELECT ${allowedColumns.join(', ')}
      FROM ${config.tableName}
      ${where.clause}
      ORDER BY ${allowedColumns.includes(order.column) ? order.column : config.defaultOrderColumn} ${order.direction}
      LIMIT ? OFFSET ?
    `).bind(...where.bindings, fetchLimit, offset).all();
    const allRows = Array.isArray(rowsResult?.results) ? rowsResult.results : [];
    const hasMore = allRows.length > limit;
    const rows = hasMore ? allRows.slice(0, limit) : allRows;
    // Approximate total for Content-Range: reflects actual page + whether more pages exist.
    const approxTotal = offset + rows.length + (hasMore ? 1 : 0);
    return buildRestResponse(request, rows, approxTotal, offset, 200, selectFields);
  }

  if (method === 'POST') {
    const payload = await request.json().catch(() => null);
    const rows = Array.isArray(payload) ? payload : [payload];
    const statements = rows
      .filter((row) => row && typeof row === 'object')
      .map((row) => config.buildInsertStatement(db, row));
    if (!statements.length) return badRequest(request, `${config.tableName.toUpperCase()}_ROWS_MISSING`);
    await db.batch(statements);
    return buildRestResponse(request, [], statements.length, 0, 201, selectFields);
  }

  if (method === 'PATCH') {
    const payload = await request.json().catch(() => null);
    if (!payload || typeof payload !== 'object') return badRequest(request, 'INVALID_JSON_BODY');
    const patchColumns = Object.keys(payload).filter((column) => allowedColumns.includes(column) && column !== 'id' && column !== 'created_at');
    if (!patchColumns.length) return badRequest(request, 'PATCH_FIELDS_MISSING');
    if (!where.clause) return badRequest(request, 'PATCH_FILTER_MISSING');
    const setClause = patchColumns.map((column) => `${column} = ?`).join(', ');
    const values = patchColumns.map((column) => payload[column]);
    const result = await db.prepare(`
      UPDATE ${config.tableName}
      SET ${setClause}
      ${where.clause}
    `).bind(...values, ...where.bindings).run();
    return buildRestResponse(request, [], Number(result?.meta?.changes || 0), 0, 200, selectFields);
  }

  if (method === 'DELETE') {
    if (!where.clause) return badRequest(request, 'DELETE_FILTER_MISSING');
    const result = await db.prepare(`DELETE FROM ${config.tableName} ${where.clause}`).bind(...where.bindings).run();
    return buildRestResponse(request, [], Number(result?.meta?.changes || 0), 0, 200, selectFields);
  }

  return null;
}

async function routeGatewayAction(request, env, body, ctx) {
  const db = getGatewayDb(env);
  // Startup integrity check: fail loudly with 503 instead of silently degrading.
  // A missing APP_SESSION_SECRET would cause token signing to throw and logins to fail.
  if (!normalizeText(env.APP_SESSION_SECRET)) {
    console.error('[gateway] FATAL: APP_SESSION_SECRET is missing. Set it via: npx wrangler secret put APP_SESSION_SECRET');
    return jsonResponse(503, {
      ok: false,
      error: 'GATEWAY_SECRET_NOT_CONFIGURED',
      message: 'Session secret is not configured. Contact the system administrator.'
    }, request);
  }
  if (!db) {
    console.warn('[gateway] GATEWAY_DATA_DB binding is missing — D1 actions will be unavailable');
    return null;
  }
  const action = normalizeText(body?.action);
  const payload = body?.payload && typeof body.payload === 'object' ? body.payload : {};
  if (!action) return badRequest(request, 'action is required');
  if (action === 'login') return performGatewayLogin(request, env, body, ctx);
  if (action === 'session.logout') {
    return jsonResponse(200, { ok: true }, request, { 'Set-Cookie': clearSessionCookie() });
  }
  const resolved = await resolveSession(request, env);
  if (resolved.error) return resolved.error;
  const session = resolved.session;
  if (action === 'session.verify') {
    const token = await signLocalSession(env, buildSessionPayload(session));
    if (session.session_id) {
      await ensureLoginSessionsTable(db);
      await db.prepare('UPDATE login_sessions SET last_seen_at = ? WHERE session_id = ?')
        .bind(new Date().toISOString(), normalizeText(session.session_id))
        .run()
        .catch((error) => console.error('[gateway] login session heartbeat failed:', error));
    }
    return jsonResponse(200, { ok: true, session, token }, request, { 'Set-Cookie': buildSessionCookie(token) });
  }
  switch (action) {
    case 'alias.list': return handleAliasList(request, db, session, payload);
    case 'alias.save': return handleAliasSave(request, db, session, payload);
    case 'warning.list': return handleWarningList(request, db, session, payload);
    case 'warning.ignore': return handleWarningIgnore(request, db, session, payload);
    case 'rectify.list': return handleRectifyList(request, db, session, payload);
    case 'rectify.save': return handleRectifySave(request, db, session, payload);
    case 'rectify.update': return handleRectifyUpdate(request, db, session, payload);
    case 'version.list': return handleVersionList(request, db, session, payload);
    case 'version.create': return handleVersionCreate(request, db, session, payload);
    case 'version.update': return handleVersionUpdate(request, db, session, payload);
    case 'version.delete': return handleVersionDelete(request, db, session, payload);
    case 'account.search': return handleAccountSearch(request, db, session, payload);
    case 'account.login_sessions': return handleLoginSessionList(request, db, session, payload);
    case 'account.update': return handleAccountUpdate(request, db, session, payload);
    case 'account.reset_password': return handleAccountResetPassword(request, db, session, payload);
    case 'account.change_password': return handleAccountChangePassword(request, db, session, payload);
    case 'account.export': return handleAccountExport(request, db, session);
    case 'account.upsert_many': return handleAccountUpsertMany(request, db, session, payload);
    case 'account.delete_non_admin': return handleAccountDeleteNonAdmin(request, db, session);
    case 'account.migration_status': return handleAccountMigrationStatus(request, db, session);
    case 'assessment.sync_scores': return handleAssessmentScoreSync(request, env, session, payload);
    case 'assessment.get_sync_settings': return handleAssessmentSyncSettingsGet(request, env, session, payload);
    default: return null;
  }
}

export async function handleGatewayRequest(request, env, ctx) {
  const body = await request.clone().json().catch(() => null);
  if (!body) return badRequest(request, 'Invalid JSON body');
  return routeGatewayAction(request, env, body, ctx);
}

export async function handleManagedRestRequest(request, env, url) {
  const pathname = String(url.pathname || '');
  if (pathname === '/sb/rest/v1/issues') {
    return handleManagedRestTable(request, env, url, {
      tableName: 'issues',
      defaultOrderColumn: 'created_at',
      columns: ['id', 'student_name', 'student_class', 'school', 'issue_type', 'description', 'contact_info', 'status', 'created_at'],
      buildInsertStatement(db, row) {
        return db.prepare(`
          INSERT INTO issues (student_name, student_class, school, issue_type, description, contact_info, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          normalizeText(row?.student_name),
          normalizeText(row?.student_class),
          normalizeText(row?.school),
          normalizeText(row?.issue_type),
          normalizeText(row?.description),
          normalizeText(row?.contact_info) || null,
          normalizeText(row?.status) || 'pending',
          normalizeText(row?.created_at) || new Date().toISOString()
        );
      }
    });
  }
  if (pathname === '/sb/rest/v1/system_logs') {
    return handleManagedRestTable(request, env, url, {
      tableName: 'system_logs',
      defaultOrderColumn: 'created_at',
      columns: ['id', 'operator', 'action', 'details', 'status', 'created_at'],
      buildInsertStatement(db, row) {
        return db.prepare(`
          INSERT INTO system_logs (operator, action, details, status, created_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          normalizeText(row?.operator) || null,
          normalizeText(row?.action),
          normalizeText(row?.details) || null,
          normalizeText(row?.status) || 'normal',
          normalizeText(row?.created_at) || new Date().toISOString()
        );
      }
    });
  }
  return null;
}
