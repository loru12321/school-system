// Authentication, session management, permission helpers, and shared response
// utilities for the D1 gateway.  Imported by worker-gateway-d1.js and all
// downstream handler modules.
import { buildCorsHeaders, normalizeText, safeJsonParse } from './worker-http-helpers.js';
import {
  getBearerToken,
  signLocalSession,
  verifyLocalSession,
  verifyAccountPasswordHash
} from './worker-crypto.js';

// ---------------------------------------------------------------------------
// Shared gateway JSON response helpers
// (Use X-School-System-Gateway: cloudflare-d1-gateway to distinguish from the
// generic worker header set in worker-http-helpers.js.)
// ---------------------------------------------------------------------------

export function jsonResponse(status, body, request, extraHeaders = {}) {
  const headers = buildCorsHeaders(request);
  headers['Content-Type'] = 'application/json; charset=utf-8';
  headers['Cache-Control'] = 'no-store';
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-School-System-Gateway'] = 'cloudflare-d1-gateway';
  Object.entries(extraHeaders || {}).forEach(([key, value]) => {
    headers[key] = value;
  });
  return new Response(JSON.stringify(body), { status, headers });
}

export function badRequest(request, message, extra = {}) {
  return jsonResponse(400, { ok: false, error: message, ...extra }, request);
}

export function unauthorized(request, message = 'Unauthorized') {
  return jsonResponse(401, { ok: false, error: message }, request);
}

export function forbidden(request, message = 'Forbidden') {
  return jsonResponse(403, { ok: false, error: message }, request);
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const LOCAL_SESSION_TTL_SECONDS = 60 * 60 * 8;
export const SESSION_COOKIE_NAME = '__Host-school-session';
const LOGIN_MAX_FAILURES = 5;
const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCK_MS = 15 * 60 * 1000;
// Schools commonly share one public IP.  Keep the strict per-account lock,
// but only apply an IP-wide lock to a clearly abnormal burst.  This prevents
// one teacher's mistyped password from blocking every colleague on campus.
const LOGIN_IP_MAX_FAILURES = 30;
const LOGIN_IP_FAILURE_WINDOW_MS = 5 * 60 * 1000;
const LOGIN_IP_LOCK_MS = 15 * 60 * 1000;

const ensuredLoginRateLimitDbs = new WeakSet();

function readCookieValue(request, name) {
  const target = `${String(name || '').trim()}=`;
  const pairs = String(request?.headers?.get('Cookie') || '').split(';');
  const pair = pairs.map((item) => item.trim()).find((item) => item.startsWith(target));
  if (!pair) return '';
  try {
    return decodeURIComponent(pair.slice(target.length));
  } catch (_) {
    return '';
  }
}

export function readSessionToken(request) {
  return getBearerToken(request) || readCookieValue(request, SESSION_COOKIE_NAME);
}

export function buildSessionCookie(token) {
  const value = encodeURIComponent(normalizeText(token));
  return `${SESSION_COOKIE_NAME}=${value}; Path=/; Max-Age=${LOCAL_SESSION_TTL_SECONDS}; Secure; HttpOnly; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Strict`;
}

function getLoginRateLimitKeys(request, username) {
  const normalizedUsername = normalizeText(username).toLowerCase();
  const ip = readRequestIp(request);
  const keys = normalizedUsername ? [`user:${normalizedUsername}`] : [];
  if (ip) keys.push(`ip:${ip}`);
  return Array.from(new Set(keys));
}

function getLoginRateLimitPolicy(scopeKey) {
  if (String(scopeKey || '').startsWith('ip:')) {
    return {
      maxFailures: LOGIN_IP_MAX_FAILURES,
      failureWindowMs: LOGIN_IP_FAILURE_WINDOW_MS,
      lockMs: LOGIN_IP_LOCK_MS
    };
  }
  return {
    maxFailures: LOGIN_MAX_FAILURES,
    failureWindowMs: LOGIN_FAILURE_WINDOW_MS,
    lockMs: LOGIN_LOCK_MS
  };
}

function isLoginRateLimitRowLocked(row, now = Date.now()) {
  const policy = getLoginRateLimitPolicy(row?.scope_key);
  const failedCount = Number(row?.failed_count || 0);
  const lockedUntil = Date.parse(String(row?.locked_until || ''));
  return failedCount >= policy.maxFailures
    && Number.isFinite(lockedUntil)
    && lockedUntil > now;
}

export async function ensureLoginRateLimitTable(db) {
  if (!db || typeof db !== 'object' || ensuredLoginRateLimitDbs.has(db)) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS login_rate_limits (
      scope_key TEXT PRIMARY KEY,
      failed_count INTEGER NOT NULL DEFAULT 0,
      first_failed_at TEXT NOT NULL,
      last_failed_at TEXT NOT NULL,
      locked_until TEXT
    )
  `).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_login_rate_limits_locked_until ON login_rate_limits(locked_until)').run();
  ensuredLoginRateLimitDbs.add(db);
}

export async function getLoginRateLimit(request, db, username) {
  await ensureLoginRateLimitTable(db);
  const keys = getLoginRateLimitKeys(request, username);
  if (!keys.length) return { locked: false, retryAfterSeconds: 0 };
  const placeholders = keys.map(() => '?').join(', ');
  const rows = await db.prepare(`SELECT scope_key, failed_count, locked_until FROM login_rate_limits WHERE scope_key IN (${placeholders})`)
    .bind(...keys)
    .all();
  const now = Date.now();
  const lockedUntil = (Array.isArray(rows?.results) ? rows.results : [])
    .filter((row) => isLoginRateLimitRowLocked(row, now))
    .map((row) => Date.parse(String(row?.locked_until || '')))
    .sort((left, right) => right - left)[0] || 0;
  return {
    locked: lockedUntil > now,
    retryAfterSeconds: lockedUntil > now ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : 0
  };
}

export async function recordFailedLogin(request, db, username) {
  await ensureLoginRateLimitTable(db);
  const keys = getLoginRateLimitKeys(request, username);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const rows = await Promise.all(keys.map(async (scopeKey) => {
    const policy = getLoginRateLimitPolicy(scopeKey);
    const existing = await db.prepare('SELECT failed_count, first_failed_at FROM login_rate_limits WHERE scope_key = ? LIMIT 1')
      .bind(scopeKey)
      .first();
    const firstFailedAt = Date.parse(String(existing?.first_failed_at || ''));
    const inWindow = Number.isFinite(firstFailedAt) && now - firstFailedAt < policy.failureWindowMs;
    const failedCount = (inWindow ? Number(existing?.failed_count || 0) : 0) + 1;
    const lockedUntil = failedCount >= policy.maxFailures ? new Date(now + policy.lockMs).toISOString() : null;
    await db.prepare(`
      INSERT INTO login_rate_limits (scope_key, failed_count, first_failed_at, last_failed_at, locked_until)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(scope_key) DO UPDATE SET
        failed_count = excluded.failed_count,
        first_failed_at = excluded.first_failed_at,
        last_failed_at = excluded.last_failed_at,
        locked_until = excluded.locked_until
    `).bind(scopeKey, failedCount, inWindow ? existing.first_failed_at : nowIso, nowIso, lockedUntil).run();
    return { scopeKey, failedCount, lockedUntil };
  }));
  const lockedUntil = rows
    .filter((row) => isLoginRateLimitRowLocked({
      scope_key: row.scopeKey,
      failed_count: row.failedCount,
      locked_until: row.lockedUntil
    }, now))
    .map((row) => Date.parse(String(row.lockedUntil || '')))
    .sort((left, right) => right - left)[0] || 0;
  return {
    locked: lockedUntil > now,
    retryAfterSeconds: lockedUntil > now ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : 0
  };
}

export async function clearLoginRateLimit(request, db, username) {
  await ensureLoginRateLimitTable(db);
  const usernameKey = `user:${normalizeText(username).toLowerCase()}`;
  if (!usernameKey || usernameKey === 'user:') return;
  // A successful sign-in should clear only that person's retry state.  Do not
  // let a valid login erase an IP-wide abuse signal accumulated by other
  // accounts on the same network.
  await db.prepare('DELETE FROM login_rate_limits WHERE scope_key = ?').bind(usernameKey).run();
}

// ---------------------------------------------------------------------------
// Login audit scheduling
// ---------------------------------------------------------------------------

export function scheduleLoginAuditWrite(ctx, task) {
  if (ctx && typeof ctx.waitUntil === 'function') {
    ctx.waitUntil(task.catch((error) => {
      console.error('[gateway] login audit write failed:', error);
    }));
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Role / session normalizers
// ---------------------------------------------------------------------------

export function normalizeRoles(row) {
  const role = normalizeText(row?.role) || 'guest';
  const rawRoles = Array.isArray(row?.roles)
    ? row.roles
    : safeJsonParse(row?.roles_json, Array.isArray(row?.roles_json) ? row.roles_json : [role]);
  const roles = Array.isArray(rawRoles) ? rawRoles.map((item) => normalizeText(item)).filter(Boolean) : [role];
  return Array.from(new Set([role, ...roles]));
}

export function getPrimaryRoleFromRoles(roles) {
  const hierarchy = ['admin', 'director', 'grade_director', 'class_teacher', 'teacher', 'parent', 'student', 'guest'];
  for (const role of hierarchy) {
    if (roles.includes(role)) return role;
  }
  return roles[0] || 'guest';
}

export function extractGradeName(className) {
  const text = normalizeText(className);
  const direct = text.match(/^(\d{1,2})/);
  if (direct) return direct[1];
  const dotted = text.match(/^(\d{1,2})\./);
  return dotted ? dotted[1] : '';
}

export function buildSessionPayload(row) {
  const roles = normalizeRoles(row);
  const role = getPrimaryRoleFromRoles(roles);
  const school = normalizeText(row?.school);
  const className = normalizeText(row?.class_name);
  const teacherName = normalizeText(row?.teacher_name || row?.display_name || row?.name || row?.username);
  return {
    session_id: normalizeText(row?.session_id) || crypto.randomUUID(),
    username: normalizeText(row?.username || row?.name),
    role,
    roles,
    school,
    class_name: className,
    grade_name: roles.includes('grade_director') ? className : extractGradeName(className),
    teacher_name: teacherName,
    exp: Math.floor(Date.now() / 1000) + LOCAL_SESSION_TTL_SECONDS
  };
}

export function normalizeGatewaySession(payload) {
  const normalized = payload && typeof payload === 'object' ? { ...payload } : {};
  normalized.username = normalizeText(normalized.username || normalized.name);
  normalized.roles = normalizeRoles(normalized);
  normalized.role = getPrimaryRoleFromRoles(normalized.roles);
  normalized.school = normalizeText(normalized.school);
  normalized.class_name = normalizeText(normalized.class_name || normalized.class);
  normalized.grade_name = normalizeText(normalized.grade_name) || (normalized.roles.includes('grade_director') ? normalized.class_name : extractGradeName(normalized.class_name));
  normalized.teacher_name = normalizeText(normalized.teacher_name || normalized.username);
  normalized.exp = Number(normalized.exp || 0);
  return normalized;
}

// ---------------------------------------------------------------------------
// Device / request info parsers
// ---------------------------------------------------------------------------

export function parseClientDeviceInfo(payload = {}) {
  const device = payload?.device && typeof payload.device === 'object' ? payload.device : {};
  return {
    device_label: normalizeText(device.device_label || device.label).slice(0, 120),
    device_type: normalizeText(device.device_type || device.type).slice(0, 40),
    browser: normalizeText(device.browser).slice(0, 80),
    os: normalizeText(device.os).slice(0, 80),
    platform: normalizeText(device.platform).slice(0, 120),
    language: normalizeText(device.language).slice(0, 40),
    timezone: normalizeText(device.timezone).slice(0, 80),
    screen: normalizeText(device.screen).slice(0, 60),
    user_agent: normalizeText(device.user_agent || device.userAgent).slice(0, 500)
  };
}

export function readRequestIp(request) {
  return normalizeText(
    request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')
    || ''
  ).split(',')[0].trim();
}

// ---------------------------------------------------------------------------
// Login session table helpers
// ---------------------------------------------------------------------------

const ensuredLoginSessionDbs = new WeakSet();

export async function ensureLoginSessionsTable(db) {
  if (db && typeof db === 'object' && ensuredLoginSessionDbs.has(db)) return;
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS login_sessions (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT '',
      school TEXT,
      class_name TEXT,
      session_id TEXT NOT NULL,
      device_label TEXT,
      device_type TEXT,
      browser TEXT,
      os TEXT,
      platform TEXT,
      language TEXT,
      timezone TEXT,
      screen TEXT,
      user_agent TEXT,
      ip_address TEXT,
      login_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      session_expires_at TEXT,
      status TEXT NOT NULL DEFAULT 'active'
    )
  `).run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_login_sessions_username_login ON login_sessions(username, login_at DESC)').run();
  await db.prepare('CREATE INDEX IF NOT EXISTS idx_login_sessions_status_login ON login_sessions(status, login_at DESC)').run();
  if (db && typeof db === 'object') ensuredLoginSessionDbs.add(db);
}

export function normalizeLoginSessionRow(row) {
  return {
    id: normalizeText(row?.id),
    username: normalizeText(row?.username),
    role: normalizeText(row?.role),
    school: normalizeText(row?.school),
    class_name: normalizeText(row?.class_name),
    session_id: normalizeText(row?.session_id),
    device_label: normalizeText(row?.device_label),
    device_type: normalizeText(row?.device_type),
    browser: normalizeText(row?.browser),
    os: normalizeText(row?.os),
    platform: normalizeText(row?.platform),
    language: normalizeText(row?.language),
    timezone: normalizeText(row?.timezone),
    screen: normalizeText(row?.screen),
    user_agent: normalizeText(row?.user_agent),
    ip_address: normalizeText(row?.ip_address),
    login_at: normalizeText(row?.login_at),
    last_seen_at: normalizeText(row?.last_seen_at),
    session_expires_at: normalizeText(row?.session_expires_at),
    status: normalizeText(row?.status) || 'active'
  };
}

export async function recordLoginSession(db, request, session, payload) {
  await ensureLoginSessionsTable(db);
  const now = new Date().toISOString();
  const device = parseClientDeviceInfo(payload);
  await db.prepare(`
    INSERT INTO login_sessions (
      id, username, role, school, class_name, session_id, device_label,
      device_type, browser, os, platform, language, timezone, screen,
      user_agent, ip_address, login_at, last_seen_at, session_expires_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    normalizeText(session.username),
    normalizeText(session.role),
    normalizeText(session.school) || null,
    normalizeText(session.class_name) || null,
    normalizeText(session.session_id),
    device.device_label || null,
    device.device_type || null,
    device.browser || null,
    device.os || null,
    device.platform || null,
    device.language || null,
    device.timezone || null,
    device.screen || null,
    device.user_agent || null,
    readRequestIp(request) || null,
    now,
    now,
    session.exp ? new Date(Number(session.exp) * 1000).toISOString() : null,
    'active'
  ).run();
}

// ---------------------------------------------------------------------------
// Password helpers
// ---------------------------------------------------------------------------

export function shouldForceManagedPasswordChange(row) {
  const role = normalizeText(row?.role);
  if (role === 'admin') return false;
  const source = normalizeText(row?.password_source);
  return source !== 'cloudflare_change';
}

// ---------------------------------------------------------------------------
// Permission predicates
// ---------------------------------------------------------------------------

export function hasRole(session, role) {
  return Array.isArray(session?.roles) && session.roles.includes(role);
}

export function hasAnyRole(session, roles) {
  return Array.isArray(roles) && roles.some((role) => hasRole(session, role));
}

export function isAdmin(session) {
  return hasRole(session, 'admin');
}

export function isAdminLike(session) {
  return hasAnyRole(session, ['admin', 'director']);
}

export function sameDirectorSchool(session, schoolName) {
  return hasRole(session, 'director') && normalizeText(schoolName) === normalizeText(session?.school);
}

export function sameGrade(session, schoolName, gradeName, className) {
  return isAdmin(session)
    || (
      hasRole(session, 'grade_director')
      && normalizeText(schoolName) === normalizeText(session?.school)
      && (
        normalizeText(gradeName) === normalizeText(session?.grade_name)
        || extractGradeName(className) === normalizeText(session?.grade_name)
      )
    );
}

export function sameClass(session, schoolName, className) {
  return isAdmin(session)
    || (
      hasRole(session, 'class_teacher')
      && normalizeText(schoolName) === normalizeText(session?.school)
      && normalizeText(className) === normalizeText(session?.class_name)
    );
}

export function sameTeacher(session, schoolName, teacherName) {
  return isAdmin(session)
    || (
      hasRole(session, 'teacher')
      && normalizeText(schoolName) === normalizeText(session?.school)
      && normalizeText(teacherName) === normalizeText(session?.teacher_name)
    );
}

export function taskParticipant(session, ownerName, assistUsers, schoolName = '') {
  if (isAdmin(session) || sameDirectorSchool(session, schoolName)) return true;
  if (normalizeText(ownerName) === normalizeText(session?.teacher_name)) return true;
  const users = Array.isArray(assistUsers) ? assistUsers : [];
  return users.map((item) => normalizeText(item)).includes(normalizeText(session?.teacher_name));
}

export function warningVisible(session, row) {
  const schoolName = normalizeText(row?.school_name);
  return isAdmin(session)
    || sameDirectorSchool(session, schoolName)
    || sameGrade(session, schoolName, row?.grade_name, row?.class_name)
    || sameClass(session, schoolName, row?.class_name)
    || sameTeacher(session, schoolName, row?.teacher_name);
}

export function rectifyVisible(session, row) {
  const schoolName = normalizeText(row?.school_name);
  return isAdmin(session)
    || sameDirectorSchool(session, schoolName)
    || sameGrade(session, schoolName, row?.grade_name, row?.class_name)
    || sameClass(session, schoolName, row?.class_name)
    || sameTeacher(session, schoolName, row?.teacher_name)
    || taskParticipant(session, row?.owner_name, row?.assist_users, schoolName);
}

// ---------------------------------------------------------------------------
// Account record helpers (shared with worker-accounts.js)
// ---------------------------------------------------------------------------

export function sanitizeAccountRecord(row) {
  const roles = normalizeRoles(row);
  const hasPassword = Boolean(row?.password_hash) || Number(row?.has_password || 0) > 0;
  return {
    username: normalizeText(row?.username),
    role: getPrimaryRoleFromRoles(roles),
    roles,
    school: normalizeText(row?.school),
    class_name: normalizeText(row?.class_name),
    teacher_name: normalizeText(row?.teacher_name || row?.username),
    has_password: hasPassword
  };
}

export function accountVisible(session, row) {
  const role = normalizeText(row?.role) || 'guest';
  const school = normalizeText(row?.school);
  const className = normalizeText(row?.class_name);
  if (isAdmin(session)) return true;
  if (sameDirectorSchool(session, school)) return true;
  if (hasRole(session, 'grade_director') && school === normalizeText(session?.school)) {
    const gradePrefix = normalizeText(session?.class_name || session?.grade_name);
    if (!gradePrefix) return false;
    if (role === 'teacher') return true;
    return role === 'parent' && className.startsWith(gradePrefix);
  }
  if (hasRole(session, 'class_teacher') && school === normalizeText(session?.school)) {
    return role === 'parent' && className === normalizeText(session?.class_name);
  }
  return false;
}

export function accountEditable(session, row) {
  if (!accountVisible(session, row)) return false;
  const role = normalizeText(row?.role);
  const username = normalizeText(row?.username);
  if (isAdmin(session)) {
    return role !== 'admin' || username === normalizeText(session?.username);
  }
  if (hasRole(session, 'director')) {
    return role !== 'admin' && role !== 'director';
  }
  if (hasRole(session, 'grade_director')) {
    return role === 'parent' || role === 'teacher';
  }
  if (hasRole(session, 'class_teacher')) {
    return role === 'parent';
  }
  return false;
}

export function canSearchAccounts(session) {
  return hasAnyRole(session, ['admin', 'director', 'grade_director', 'class_teacher']);
}

export function canBulkManageAccounts(session) {
  return hasAnyRole(session, ['admin', 'director']);
}

export function canSyncAssessmentScores(session) {
  return hasAnyRole(session, ['admin', 'director', 'grade_director']);
}

export function normalizeAccountUpsertRow(input, session) {
  const role = normalizeText(input?.role) || 'teacher';
  const username = normalizeText(input?.username);
  const password = normalizeText(input?.password);
  let school = normalizeText(input?.school);
  let className = normalizeText(input?.class_name);
  if (role === 'teacher' && !className) className = '教师';
  if (role === 'director' || role === 'admin') className = '';
  if (role !== 'admin' && !school && !isAdmin(session)) {
    school = normalizeText(session?.school);
  }
  if (role === 'admin') school = '系统';
  const roles = Array.isArray(input?.roles) && input.roles.length
    ? Array.from(new Set(input.roles.map((item) => normalizeText(item)).filter(Boolean)))
    : [role];
  return {
    username,
    password,
    role,
    roles,
    school,
    class_name: className,
    teacher_name: normalizeText(input?.teacher_name || input?.display_name || input?.name || input?.username) || username
  };
}

export function validateAccountUpsertRow(session, row) {
  if (!row.username || !row.password || !row.role) return 'username、password、role 不能为空';
  if (row.role !== 'admin' && !row.school) return 'school 不能为空';
  if ((row.role === 'parent' || row.role === 'class_teacher') && !row.class_name) return '班级不能为空';
  if (row.role === 'grade_director' && !row.class_name) return '级部/年级不能为空';
  if (hasRole(session, 'director')) {
    if (row.role === 'admin' || row.role === 'director') return '教务主任不能创建或覆盖管理员/主任账号';
    if (normalizeText(row.school) !== normalizeText(session?.school)) return '教务主任只能管理本校账号';
  }
  return '';
}

// ---------------------------------------------------------------------------
// D1 system_users table helpers
// ---------------------------------------------------------------------------

export function normalizeDbAccountRow(row) {
  const roles = safeJsonParse(row?.roles_json, []);
  return {
    username: normalizeText(row?.username),
    role: normalizeText(row?.role) || 'guest',
    roles: Array.isArray(roles) ? roles : [],
    school: normalizeText(row?.school),
    class_name: normalizeText(row?.class_name),
    teacher_name: normalizeText(row?.teacher_name),
    password_hash: normalizeText(row?.password_hash),
    password_scheme: normalizeText(row?.password_scheme),
    password_source: normalizeText(row?.password_source),
    has_password: Number(row?.has_password || 0) > 0,
    is_active: Number(row?.is_active ?? 1) !== 0,
    last_login_at: normalizeText(row?.last_login_at),
    created_at: normalizeText(row?.created_at),
    updated_at: normalizeText(row?.updated_at)
  };
}

export async function getSystemUserRow(db, username, options = {}) {
  const normalizedUsername = normalizeText(username);
  if (!normalizedUsername) return null;
  const includeInactive = options.includeInactive === true;
  const accountColumns = [
    'username', 'role', 'roles_json', 'school', 'class_name', 'teacher_name',
    'password_hash', 'password_scheme', 'password_source', 'has_password',
    'is_active', 'last_login_at', 'created_at', 'updated_at'
  ].join(', ');
  const sql = includeInactive
    ? `SELECT ${accountColumns} FROM system_users WHERE username = ? LIMIT 1`
    : `SELECT ${accountColumns} FROM system_users WHERE username = ? AND is_active = 1 LIMIT 1`;
  const row = await db.prepare(sql).bind(normalizedUsername).first();
  return row ? normalizeDbAccountRow(row) : null;
}

export async function upsertSystemUser(db, row) {
  const normalized = {
    username: normalizeText(row?.username),
    role: normalizeText(row?.role) || 'guest',
    roles_json: JSON.stringify(Array.isArray(row?.roles) ? Array.from(new Set(row.roles.map((item) => normalizeText(item)).filter(Boolean))) : [normalizeText(row?.role) || 'guest']),
    school: normalizeText(row?.school) || null,
    class_name: normalizeText(row?.class_name) || null,
    teacher_name: normalizeText(row?.teacher_name || row?.username) || null,
    password_hash: normalizeText(row?.password_hash) || null,
    password_scheme: normalizeText(row?.password_scheme) || '',
    password_source: normalizeText(row?.password_source) || '',
    has_password: row?.has_password ? 1 : 0,
    is_active: row?.is_active === false ? 0 : 1,
    last_login_at: normalizeText(row?.last_login_at) || null,
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: normalizeText(row?.updated_at) || new Date().toISOString()
  };
  if (!normalized.username) throw new Error('SYSTEM_USER_USERNAME_REQUIRED');
  await db.prepare(`
    INSERT INTO system_users (
      username, role, roles_json, school, class_name, teacher_name,
      password_hash, password_scheme, password_source, has_password,
      is_active, last_login_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(username) DO UPDATE SET
      role = excluded.role,
      roles_json = excluded.roles_json,
      school = excluded.school,
      class_name = excluded.class_name,
      teacher_name = excluded.teacher_name,
      password_hash = COALESCE(excluded.password_hash, system_users.password_hash),
      password_scheme = CASE WHEN excluded.password_hash IS NOT NULL AND excluded.password_hash <> '' THEN excluded.password_scheme ELSE system_users.password_scheme END,
      password_source = CASE WHEN excluded.password_hash IS NOT NULL AND excluded.password_hash <> '' THEN excluded.password_source ELSE system_users.password_source END,
      has_password = CASE WHEN excluded.password_hash IS NOT NULL AND excluded.password_hash <> '' THEN 1 ELSE excluded.has_password END,
      is_active = excluded.is_active,
      last_login_at = COALESCE(excluded.last_login_at, system_users.last_login_at),
      created_at = system_users.created_at,
      updated_at = excluded.updated_at
  `).bind(
    normalized.username,
    normalized.role,
    normalized.roles_json,
    normalized.school,
    normalized.class_name,
    normalized.teacher_name,
    normalized.password_hash,
    normalized.password_scheme,
    normalized.password_source,
    normalized.has_password,
    normalized.is_active,
    normalized.last_login_at,
    normalized.created_at,
    normalized.updated_at
  ).run();
}

// ---------------------------------------------------------------------------
// Session resolution
// ---------------------------------------------------------------------------

export async function resolveSession(request, env) {
  const token = readSessionToken(request);
  if (!token) return { error: unauthorized(request, 'Missing bearer token') };

  const localSession = await verifyLocalSession(env, token);
  if (localSession) {
    return { session: normalizeGatewaySession(localSession), source: 'local' };
  }

  return { error: unauthorized(request, 'Invalid or expired app session token') };
}

// ---------------------------------------------------------------------------
// Login handler
// ---------------------------------------------------------------------------

export async function performGatewayLogin(request, env, body, ctx) {
  const db = env.GATEWAY_DATA_DB || null;
  if (!db) return null;

  const username = normalizeText(body?.payload?.username);
  const password = normalizeText(body?.payload?.password);
  if (!username || !password) return badRequest(request, 'username and password are required');

  if (!normalizeText(env.APP_SESSION_SECRET)) {
    console.error('[gateway] APP_SESSION_SECRET is missing, cannot perform local login');
    return null;
  }

  const rateLimit = await getLoginRateLimit(request, db, username);
  if (rateLimit.locked) {
    return jsonResponse(429, {
      ok: false,
      error: 'LOGIN_TEMPORARILY_LOCKED',
      retry_after_seconds: rateLimit.retryAfterSeconds
    }, request, { 'Retry-After': String(rateLimit.retryAfterSeconds) });
  }

  const existing = await getSystemUserRow(db, username, { includeInactive: true });
  if (existing && !existing.is_active) {
    return forbidden(request, 'Account disabled');
  }

  if (!existing?.password_hash) {
    await recordFailedLogin(request, db, username);
    return jsonResponse(401, { ok: false, error: 'Invalid username or password' }, request);
  }

  const localMatch = await verifyAccountPasswordHash(existing.password_hash, password);
  if (!localMatch) {
    await recordFailedLogin(request, db, username);
    return jsonResponse(401, { ok: false, error: 'Invalid username or password' }, request);
  }
  await clearLoginRateLimit(request, db, username);
  const session = buildSessionPayload(existing);
  const token = await signLocalSession(env, session);
  const auditWrite = Promise.all([
    upsertSystemUser(db, {
      ...existing,
      last_login_at: new Date().toISOString(),
      has_password: true,
      updated_at: new Date().toISOString()
    }),
    recordLoginSession(db, request, session, body?.payload || {})
  ]);
  if (!scheduleLoginAuditWrite(ctx, auditWrite)) {
    await auditWrite.catch((error) => {
      console.error('[gateway] login audit write failed:', error);
    });
  }
  return jsonResponse(200, {
    ok: true,
    token,
    user: {
      session_id: session.session_id,
      username: session.username,
      role: session.role,
      roles: session.roles,
      school: session.school,
      class_name: session.class_name,
      grade_name: session.grade_name,
      teacher_name: session.teacher_name,
      expires_at: session.exp,
      must_change_password: shouldForceManagedPasswordChange(existing)
    }
  }, request, { 'Set-Cookie': buildSessionCookie(token) });
}

// ---------------------------------------------------------------------------
// Shared D1 query helpers (used by all handler modules)
// ---------------------------------------------------------------------------

export async function queryRows(db, sql, bindings = [], normalizeRow = null) {
  const result = await db.prepare(sql).bind(...bindings).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return normalizeRow ? rows.map((row) => normalizeRow(row)) : rows;
}

export async function querySingleRow(db, sql, bindings = [], normalizeRow = null) {
  const row = await db.prepare(sql).bind(...bindings).first();
  return row ? (normalizeRow ? normalizeRow(row) : row) : null;
}
