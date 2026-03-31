const DEFAULT_SUPABASE_ORIGIN = 'https://okwcciujnfvobbwaydiv.supabase.co';
const LOCAL_SESSION_TTL_SECONDS = 60 * 60 * 12;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_SCHEME = 'pbkdf2-sha256';
const GATEWAY_PATHS = ['/functions/v1/edu-gateway-v2', '/functions/v1/edu-gateway'];
const PROXY_TIMEOUT_MS = 15000;
const REST_META_KEYS = new Set(['select', 'order', 'limit', 'offset', 'or']);

const textEncoder = new TextEncoder();

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeOrigin(origin) {
  return normalizeText(origin).replace(/\/+$/, '');
}

function getSupabaseOrigin(env) {
  return normalizeOrigin(env.SUPABASE_ORIGIN || DEFAULT_SUPABASE_ORIGIN);
}

function getGatewayDb(env) {
  return env.GATEWAY_DATA_DB || null;
}

function buildCorsHeaders(request) {
  return {
    'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
    'Access-Control-Allow-Headers': request.headers.get('Access-Control-Request-Headers') || 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  };
}

function jsonResponse(status, body, request, extraHeaders = {}) {
  const headers = buildCorsHeaders(request);
  headers['Content-Type'] = 'application/json; charset=utf-8';
  headers['Cache-Control'] = 'no-store';
  Object.entries(extraHeaders || {}).forEach(([key, value]) => {
    headers[key] = value;
  });
  return new Response(JSON.stringify(body), { status, headers });
}

function badRequest(request, message, extra = {}) {
  return jsonResponse(400, { ok: false, error: message, ...extra }, request);
}

function unauthorized(request, message = 'Unauthorized') {
  return jsonResponse(401, { ok: false, error: message }, request);
}

function forbidden(request, message = 'Forbidden') {
  return jsonResponse(403, { ok: false, error: message }, request);
}

function safeJsonParse(value, fallbackValue = null) {
  try {
    return JSON.parse(value);
  } catch {
    return fallbackValue;
  }
}

function toBase64Url(input) {
  const bytes = typeof input === 'string' ? textEncoder.encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }
  return output;
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function signLocalSession(env, payload) {
  const secret = normalizeText(env.APP_SESSION_SECRET);
  if (!secret) throw new Error('APP_SESSION_SECRET_MISSING');
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(content));
  return `${content}.${toBase64Url(new Uint8Array(signature))}`;
}

async function verifyLocalSession(env, token) {
  const secret = normalizeText(env.APP_SESSION_SECRET);
  if (!secret) return null;
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, providedSignature] = parts;
  const content = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(content));
  const expected = toBase64Url(new Uint8Array(signature));
  if (!timingSafeEqual(expected, providedSignature)) return null;
  const payload = safeJsonParse(new TextDecoder().decode(fromBase64Url(encodedPayload)), null);
  if (!payload || !payload.exp || Number(payload.exp) < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function getBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

async function derivePbkdf2Bits(password, saltBytes, iterations) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(normalizeText(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBytes,
      iterations
    },
    baseKey,
    256
  );
}

async function hashAccountPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derivedBits = await derivePbkdf2Bits(password, salt, PBKDF2_ITERATIONS);
  const hashBytes = new Uint8Array(derivedBits);
  return `${PBKDF2_SCHEME}$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hashBytes)}`;
}

async function verifyAccountPasswordHash(storedHash, password) {
  const parts = normalizeText(storedHash).split('$');
  if (parts.length !== 4) return false;
  const [scheme, iterationsText, saltText, hashText] = parts;
  if (scheme !== PBKDF2_SCHEME) return false;
  const iterations = Number(iterationsText);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const salt = fromBase64Url(saltText);
  const expected = fromBase64Url(hashText);
  const derivedBits = await derivePbkdf2Bits(password, salt, iterations);
  const candidate = new Uint8Array(derivedBits);
  return timingSafeEqual(
    Array.from(candidate, (byte) => String.fromCharCode(byte)).join(''),
    Array.from(expected, (byte) => String.fromCharCode(byte)).join('')
  );
}

function normalizeRoles(row) {
  const role = normalizeText(row?.role) || 'guest';
  const rawRoles = Array.isArray(row?.roles)
    ? row.roles
    : safeJsonParse(row?.roles_json, Array.isArray(row?.roles_json) ? row.roles_json : [role]);
  const roles = Array.isArray(rawRoles) ? rawRoles.map((item) => normalizeText(item)).filter(Boolean) : [role];
  return Array.from(new Set([role, ...roles]));
}

function getPrimaryRoleFromRoles(roles) {
  const hierarchy = ['admin', 'director', 'grade_director', 'class_teacher', 'teacher', 'parent', 'student', 'guest'];
  for (const role of hierarchy) {
    if (roles.includes(role)) return role;
  }
  return roles[0] || 'guest';
}

function extractGradeName(className) {
  const text = normalizeText(className);
  const direct = text.match(/^(\d{1,2})/);
  if (direct) return direct[1];
  const dotted = text.match(/^(\d{1,2})\./);
  return dotted ? dotted[1] : '';
}

function buildSessionPayload(row) {
  const roles = normalizeRoles(row);
  const role = getPrimaryRoleFromRoles(roles);
  const school = normalizeText(row?.school);
  const className = normalizeText(row?.class_name);
  const teacherName = normalizeText(row?.teacher_name || row?.display_name || row?.name || row?.username);
  return {
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

function hasRole(session, role) {
  return Array.isArray(session?.roles) && session.roles.includes(role);
}

function hasAnyRole(session, roles) {
  return Array.isArray(roles) && roles.some((role) => hasRole(session, role));
}

function isAdmin(session) {
  return hasRole(session, 'admin');
}

function isAdminLike(session) {
  return hasAnyRole(session, ['admin', 'director']);
}

function sameDirectorSchool(session, schoolName) {
  return hasRole(session, 'director') && normalizeText(schoolName) === normalizeText(session?.school);
}

function sameGrade(session, schoolName, gradeName, className) {
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

function sameClass(session, schoolName, className) {
  return isAdmin(session)
    || (
      hasRole(session, 'class_teacher')
      && normalizeText(schoolName) === normalizeText(session?.school)
      && normalizeText(className) === normalizeText(session?.class_name)
    );
}

function sameTeacher(session, schoolName, teacherName) {
  return isAdmin(session)
    || (
      hasRole(session, 'teacher')
      && normalizeText(schoolName) === normalizeText(session?.school)
      && normalizeText(teacherName) === normalizeText(session?.teacher_name)
    );
}

function taskParticipant(session, ownerName, assistUsers, schoolName = '') {
  if (isAdmin(session) || sameDirectorSchool(session, schoolName)) return true;
  if (normalizeText(ownerName) === normalizeText(session?.teacher_name)) return true;
  const users = Array.isArray(assistUsers) ? assistUsers : [];
  return users.map((item) => normalizeText(item)).includes(normalizeText(session?.teacher_name));
}

function warningVisible(session, row) {
  const schoolName = normalizeText(row?.school_name);
  return isAdmin(session)
    || sameDirectorSchool(session, schoolName)
    || sameGrade(session, schoolName, row?.grade_name, row?.class_name)
    || sameClass(session, schoolName, row?.class_name)
    || sameTeacher(session, schoolName, row?.teacher_name);
}

function rectifyVisible(session, row) {
  const schoolName = normalizeText(row?.school_name);
  return isAdmin(session)
    || sameDirectorSchool(session, schoolName)
    || sameGrade(session, schoolName, row?.grade_name, row?.class_name)
    || sameClass(session, schoolName, row?.class_name)
    || sameTeacher(session, schoolName, row?.teacher_name)
    || taskParticipant(session, row?.owner_name, row?.assist_users, schoolName);
}

function sanitizeAccountRecord(row) {
  const roles = normalizeRoles(row);
  const hasPassword = Boolean(row?.password_hash) || Number(row?.has_password || 0) > 0;
  return {
    username: normalizeText(row?.username),
    role: getPrimaryRoleFromRoles(roles),
    roles,
    school: normalizeText(row?.school),
    class_name: normalizeText(row?.class_name),
    teacher_name: normalizeText(row?.teacher_name || row?.username),
    has_password: hasPassword,
    password_display: hasPassword ? '已设置(不显示明文)' : '未设置'
  };
}

function accountVisible(session, row) {
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

function accountEditable(session, row) {
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

function canSearchAccounts(session) {
  return hasAnyRole(session, ['admin', 'director', 'grade_director', 'class_teacher']);
}

function canBulkManageAccounts(session) {
  return hasAnyRole(session, ['admin', 'director']);
}

function normalizeAccountUpsertRow(input, session) {
  const role = normalizeText(input?.role) || 'teacher';
  const username = normalizeText(input?.username);
  const password = normalizeText(input?.password);
  let school = normalizeText(input?.school);
  let className = normalizeText(input?.class_name);
  if (role === 'teacher' && !className) className = '教师';
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

function validateAccountUpsertRow(session, row) {
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

function normalizeGatewaySession(payload) {
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

async function fetchWithTimeout(url, init, timeoutMs = PROXY_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function proxyGatewayActionToSupabase(request, env, action, payload = {}, options = {}) {
  const apikey = normalizeText(request.headers.get('apikey'));
  if (!apikey) return null;
  const token = normalizeText(options.token || getBearerToken(request));
  const headers = {
    'Content-Type': 'application/json',
    'apikey': apikey
  };
  if (!options.allowAnonymous && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const origin = getSupabaseOrigin(env);
  let lastData = null;
  let lastError = null;
  let lastStatus = 0;
  for (const path of GATEWAY_PATHS) {
    try {
      const response = await fetchWithTimeout(`${origin}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action, payload })
      });
      const text = await response.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
      if (response.ok && data?.ok) return data;
      lastData = data;
      lastStatus = response.status;
      if (response.status === 404 || response.status >= 500) continue;
      break;
    } catch (error) {
      lastError = error;
    }
  }
  if (lastData) return lastData;
  if (lastError) {
    return { ok: false, error: String(lastError.message || lastError) };
  }
  return { ok: false, error: `EDGE_GATEWAY_HTTP_${lastStatus || 502}` };
}

function normalizeDbAccountRow(row) {
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
    password_display: normalizeText(row?.password_display),
    is_active: Number(row?.is_active ?? 1) !== 0,
    last_login_at: normalizeText(row?.last_login_at),
    created_at: normalizeText(row?.created_at),
    updated_at: normalizeText(row?.updated_at)
  };
}

async function getSystemUserRow(db, username, options = {}) {
  const normalizedUsername = normalizeText(username);
  if (!normalizedUsername) return null;
  const includeInactive = options.includeInactive === true;
  const sql = includeInactive
    ? 'SELECT * FROM system_users WHERE username = ? LIMIT 1'
    : 'SELECT * FROM system_users WHERE username = ? AND is_active = 1 LIMIT 1';
  const row = await db.prepare(sql).bind(normalizedUsername).first();
  return row ? normalizeDbAccountRow(row) : null;
}

async function upsertSystemUser(db, row) {
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
    password_display: row?.has_password ? '已设置(不显示明文)' : '未设置',
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
      password_display, is_active, last_login_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      password_display = CASE WHEN excluded.password_hash IS NOT NULL AND excluded.password_hash <> '' THEN '已设置(不显示明文)' ELSE excluded.password_display END,
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
    normalized.password_display,
    normalized.is_active,
    normalized.last_login_at,
    normalized.created_at,
    normalized.updated_at
  ).run();
}

async function resolveSession(request, env) {
  const token = getBearerToken(request);
  if (!token) return { error: unauthorized(request, 'Missing bearer token') };

  const localSession = await verifyLocalSession(env, token);
  if (localSession) {
    return { session: normalizeGatewaySession(localSession), source: 'local' };
  }

  const remote = await proxyGatewayActionToSupabase(request, env, 'session.verify', {}, { token });
  if (remote?.ok && remote.session) {
    return { session: normalizeGatewaySession(remote.session), source: 'supabase' };
  }

  return { error: unauthorized(request, 'Invalid or expired app session token') };
}

async function performGatewayLogin(request, env, body) {
  const db = getGatewayDb(env);
  if (!db) return null;

  const username = normalizeText(body?.payload?.username);
  const password = normalizeText(body?.payload?.password);
  if (!username || !password) return badRequest(request, 'username and password are required');

  const existing = await getSystemUserRow(db, username, { includeInactive: true });
  if (existing && !existing.is_active) {
    return forbidden(request, 'Account disabled');
  }

  if (existing?.password_hash) {
    const localMatch = await verifyAccountPasswordHash(existing.password_hash, password);
    if (localMatch) {
      const session = buildSessionPayload(existing);
      const token = await signLocalSession(env, session);
      await upsertSystemUser(db, {
        ...existing,
        last_login_at: new Date().toISOString(),
        has_password: true,
        updated_at: new Date().toISOString()
      });
      return jsonResponse(200, {
        ok: true,
        token,
        user: {
          username: session.username,
          role: session.role,
          roles: session.roles,
          school: session.school,
          class_name: session.class_name,
          grade_name: session.grade_name,
          teacher_name: session.teacher_name,
          expires_at: session.exp
        }
      }, request);
    }
  }

  const remote = await proxyGatewayActionToSupabase(request, env, 'login', body?.payload || {}, { allowAnonymous: true });
  if (!remote?.ok || !remote?.user) {
    return jsonResponse(401, {
      ok: false,
      error: normalizeText(remote?.error) || 'Invalid username or password'
    }, request);
  }

  const remoteUser = normalizeGatewaySession(remote.user);
  if (!remoteUser.username) remoteUser.username = username;
  const passwordHash = await hashAccountPassword(password);
  await upsertSystemUser(db, {
    username: remoteUser.username,
    role: remoteUser.role,
    roles: remoteUser.roles,
    school: remoteUser.school,
    class_name: remoteUser.class_name,
    teacher_name: remoteUser.teacher_name || remoteUser.username,
    password_hash: passwordHash,
    password_scheme: PBKDF2_SCHEME,
    password_source: 'supabase_login',
    has_password: true,
    is_active: true,
    last_login_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const session = buildSessionPayload(remoteUser);
  const token = await signLocalSession(env, session);
  return jsonResponse(200, {
    ok: true,
    token,
    user: {
      username: session.username,
      role: session.role,
      roles: session.roles,
      school: session.school,
      class_name: session.class_name,
      grade_name: session.grade_name,
      teacher_name: session.teacher_name,
      expires_at: session.exp
    }
  }, request);
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
    const countResult = await db.prepare(`SELECT COUNT(*) AS row_count FROM ${config.tableName} ${where.clause}`).bind(...where.bindings).first();
    const rowCount = Number(countResult?.row_count || 0);
    const rowsResult = await db.prepare(`
      SELECT ${allowedColumns.join(', ')}
      FROM ${config.tableName}
      ${where.clause}
      ORDER BY ${allowedColumns.includes(order.column) ? order.column : config.defaultOrderColumn} ${order.direction}
      LIMIT ? OFFSET ?
    `).bind(...where.bindings, limit, offset).all();
    const rows = Array.isArray(rowsResult?.results) ? rowsResult.results : [];
    return buildRestResponse(request, rows, rowCount, offset, 200, selectFields);
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

function parseAssistUsers(row) {
  if (Array.isArray(row?.assist_users)) return row.assist_users;
  const parsed = safeJsonParse(row?.assist_users_json, []);
  return Array.isArray(parsed) ? parsed : [];
}

function normalizeWarningRow(row) {
  return {
    ...row,
    metric_value: row?.metric_value == null ? null : Number(row.metric_value),
    threshold_value: row?.threshold_value == null ? null : Number(row.threshold_value)
  };
}

function normalizeRectifyRow(row) {
  return {
    ...row,
    progress: Number(row?.progress || 0),
    assist_users: parseAssistUsers(row)
  };
}

function normalizeVersionRow(row) {
  return {
    ...row,
    summary_json: safeJsonParse(row?.summary_json, {}),
    is_stable: Number(row?.is_stable || 0) === 1
  };
}

async function queryRows(db, sql, bindings = [], normalizeRow = null) {
  const result = await db.prepare(sql).bind(...bindings).all();
  const rows = Array.isArray(result?.results) ? result.results : [];
  return normalizeRow ? rows.map((row) => normalizeRow(row)) : rows;
}

async function querySingleRow(db, sql, bindings = [], normalizeRow = null) {
  const row = await db.prepare(sql).bind(...bindings).first();
  return row ? (normalizeRow ? normalizeRow(row) : row) : null;
}

async function handleAliasList(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can list alias rules');
  const conditions = [];
  const bindings = [];
  if (payload.rule_type) {
    conditions.push('rule_type = ?');
    bindings.push(normalizeText(payload.rule_type));
  }
  if (payload.project_key) {
    conditions.push('project_key = ?');
    bindings.push(normalizeText(payload.project_key));
  }
  if (payload.cohort_id) {
    conditions.push('cohort_id = ?');
    bindings.push(normalizeText(payload.cohort_id));
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await queryRows(db, `
    SELECT * FROM config_alias_rules
    ${where}
    ORDER BY priority ASC, created_at DESC
  `, bindings);
  return jsonResponse(200, { ok: true, records: rows }, request);
}

async function handleAliasSave(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can save alias rules');
  const rows = Array.isArray(payload.rows) ? payload.rows : [payload];
  const replaceScope = Boolean(payload.replace_scope ?? false);
  const sanitizedRows = rows.map((row) => ({
    id: normalizeText(row?.id) || crypto.randomUUID(),
    rule_type: normalizeText(row?.rule_type),
    standard_name: normalizeText(row?.standard_name),
    alias_name: normalizeText(row?.alias_name),
    scope: normalizeText(row?.scope) || 'global',
    project_key: normalizeText(row?.project_key) || '',
    cohort_id: normalizeText(row?.cohort_id) || '',
    school_name: normalizeText(row?.school_name) || null,
    grade_range: normalizeText(row?.grade_range) || null,
    priority: Number(row?.priority ?? 100),
    is_active: row?.is_active === false ? 0 : 1,
    remark: normalizeText(row?.remark) || null,
    created_by: normalizeText(session.username),
    created_at: normalizeText(row?.created_at) || new Date().toISOString(),
    updated_at: new Date().toISOString()
  })).filter((row) => row.rule_type && row.standard_name && row.alias_name);

  if (replaceScope) {
    const scopeSeed = sanitizedRows[0] || {
      rule_type: normalizeText(payload.rule_type) || 'school',
      scope: normalizeText(payload.scope) || 'global',
      project_key: normalizeText(payload.project_key),
      cohort_id: normalizeText(payload.cohort_id)
    };
    await db.prepare(`
      DELETE FROM config_alias_rules
      WHERE rule_type = ? AND scope = ? AND IFNULL(project_key, '') = ? AND IFNULL(cohort_id, '') = ?
    `).bind(scopeSeed.rule_type, scopeSeed.scope, scopeSeed.project_key || '', scopeSeed.cohort_id || '').run();
  }

  if (!sanitizedRows.length) {
    return jsonResponse(200, { ok: true, records: [] }, request);
  }

  const statements = sanitizedRows.map((row) => db.prepare(`
    INSERT INTO config_alias_rules (
      id, rule_type, standard_name, alias_name, scope, project_key, cohort_id,
      school_name, grade_range, priority, is_active, remark, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      rule_type = excluded.rule_type,
      standard_name = excluded.standard_name,
      alias_name = excluded.alias_name,
      scope = excluded.scope,
      project_key = excluded.project_key,
      cohort_id = excluded.cohort_id,
      school_name = excluded.school_name,
      grade_range = excluded.grade_range,
      priority = excluded.priority,
      is_active = excluded.is_active,
      remark = excluded.remark,
      created_by = excluded.created_by,
      updated_at = excluded.updated_at
  `).bind(
    row.id,
    row.rule_type,
    row.standard_name,
    row.alias_name,
    row.scope,
    row.project_key,
    row.cohort_id,
    row.school_name,
    row.grade_range,
    row.priority,
    row.is_active,
    row.remark,
    row.created_by,
    row.created_at,
    row.updated_at
  ));
  await db.batch(statements);
  return jsonResponse(200, { ok: true, records: sanitizedRows }, request);
}

async function handleWarningList(request, db, session, payload) {
  const conditions = [];
  const bindings = [];
  if (payload.project_key) {
    conditions.push('project_key = ?');
    bindings.push(normalizeText(payload.project_key));
  }
  if (payload.cohort_id) {
    conditions.push('cohort_id = ?');
    bindings.push(normalizeText(payload.cohort_id));
  }
  if (payload.warning_level) {
    conditions.push('warning_level = ?');
    bindings.push(normalizeText(payload.warning_level));
  }
  if (payload.status) {
    conditions.push('status = ?');
    bindings.push(normalizeText(payload.status));
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 100) || 100, 500));
  const rows = await queryRows(db, `
    SELECT * FROM warning_records
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
  `, [...bindings, limit], normalizeWarningRow);
  return jsonResponse(200, { ok: true, records: rows.filter((row) => warningVisible(session, row)) }, request);
}

async function handleWarningIgnore(request, db, session, payload) {
  if (!hasAnyRole(session, ['admin', 'director', 'grade_director'])) {
    return forbidden(request, 'Only management roles can ignore warnings');
  }
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await querySingleRow(db, 'SELECT * FROM warning_records WHERE id = ? LIMIT 1', [id], normalizeWarningRow);
  if (!existing) return badRequest(request, 'warning record not found');
  if (!warningVisible(session, existing)) return forbidden(request, 'Out of scope');
  await db.prepare('UPDATE warning_records SET status = ?, updated_at = ? WHERE id = ?').bind('ignored', new Date().toISOString(), id).run();
  const updated = await querySingleRow(db, 'SELECT * FROM warning_records WHERE id = ? LIMIT 1', [id], normalizeWarningRow);
  return jsonResponse(200, { ok: true, record: updated }, request);
}

async function handleRectifyList(request, db, session, payload) {
  const conditions = [];
  const bindings = [];
  if (payload.project_key) {
    conditions.push('project_key = ?');
    bindings.push(normalizeText(payload.project_key));
  }
  if (payload.cohort_id) {
    conditions.push('cohort_id = ?');
    bindings.push(normalizeText(payload.cohort_id));
  }
  if (payload.status) {
    conditions.push('status = ?');
    bindings.push(normalizeText(payload.status));
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 100) || 100, 500));
  const rows = await queryRows(db, `
    SELECT * FROM rectify_tasks
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
  `, [...bindings, limit], normalizeRectifyRow);
  return jsonResponse(200, { ok: true, records: rows.filter((row) => rectifyVisible(session, row)) }, request);
}

async function handleRectifySave(request, db, session, payload) {
  if (!hasAnyRole(session, ['admin', 'director', 'grade_director'])) {
    return forbidden(request, 'Only management roles can create tasks');
  }
  const title = normalizeText(payload.title);
  if (!title) return badRequest(request, 'title is required');
  const row = {
    id: crypto.randomUUID(),
    source_warning_id: normalizeText(payload.source_warning_id) || null,
    task_type: normalizeText(payload.task_type) || 'teacher',
    title,
    project_key: normalizeText(payload.project_key) || null,
    cohort_id: normalizeText(payload.cohort_id) || null,
    exam_id: normalizeText(payload.exam_id) || null,
    school_name: normalizeText(payload.school_name || session.school) || null,
    grade_name: normalizeText(payload.grade_name) || null,
    class_name: normalizeText(payload.class_name) || null,
    subject_name: normalizeText(payload.subject_name) || null,
    teacher_name: normalizeText(payload.teacher_name) || null,
    student_name: normalizeText(payload.student_name) || null,
    problem_desc: normalizeText(payload.problem_desc) || null,
    action_plan: normalizeText(payload.action_plan) || null,
    owner_name: normalizeText(payload.owner_name) || null,
    assist_users_json: JSON.stringify(Array.isArray(payload.assist_users) ? payload.assist_users : []),
    due_date: normalizeText(payload.due_date) || null,
    priority: normalizeText(payload.priority) || 'medium',
    status: normalizeText(payload.status) || 'todo',
    progress: Number(payload.progress ?? 0),
    review_result: normalizeText(payload.review_result) || null,
    created_by: normalizeText(session.username),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  await db.prepare(`
    INSERT INTO rectify_tasks (
      id, source_warning_id, task_type, title, project_key, cohort_id, exam_id,
      school_name, grade_name, class_name, subject_name, teacher_name, student_name,
      problem_desc, action_plan, owner_name, assist_users_json, due_date, priority,
      status, progress, review_result, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    row.id, row.source_warning_id, row.task_type, row.title, row.project_key, row.cohort_id, row.exam_id,
    row.school_name, row.grade_name, row.class_name, row.subject_name, row.teacher_name, row.student_name,
    row.problem_desc, row.action_plan, row.owner_name, row.assist_users_json, row.due_date, row.priority,
    row.status, row.progress, row.review_result, row.created_by, row.created_at, row.updated_at
  ).run();
  const created = await querySingleRow(db, 'SELECT * FROM rectify_tasks WHERE id = ? LIMIT 1', [row.id], normalizeRectifyRow);
  return jsonResponse(200, { ok: true, record: created }, request);
}

async function handleRectifyUpdate(request, db, session, payload) {
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await querySingleRow(db, 'SELECT * FROM rectify_tasks WHERE id = ? LIMIT 1', [id], normalizeRectifyRow);
  if (!existing) return badRequest(request, 'rectify task not found');
  if (!rectifyVisible(session, existing)) return forbidden(request, 'Out of scope');
  const allowedFields = ['status', 'progress', 'review_result', 'action_plan', 'owner_name', 'assist_users', 'due_date', 'priority'];
  const patchColumns = [];
  const bindings = [];
  for (const field of allowedFields) {
    if (!(field in payload)) continue;
    patchColumns.push(field === 'assist_users' ? 'assist_users_json = ?' : `${field} = ?`);
    bindings.push(field === 'assist_users' ? JSON.stringify(Array.isArray(payload[field]) ? payload[field] : []) : payload[field]);
  }
  if (!patchColumns.length) return badRequest(request, 'No supported fields to update');
  patchColumns.push('updated_at = ?');
  bindings.push(new Date().toISOString(), id);
  await db.prepare(`UPDATE rectify_tasks SET ${patchColumns.join(', ')} WHERE id = ?`).bind(...bindings).run();
  const updated = await querySingleRow(db, 'SELECT * FROM rectify_tasks WHERE id = ? LIMIT 1', [id], normalizeRectifyRow);
  return jsonResponse(200, { ok: true, record: updated }, request);
}

async function handleVersionList(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can list versions');
  const conditions = [];
  const bindings = [];
  if (payload.project_key) {
    conditions.push('project_key = ?');
    bindings.push(normalizeText(payload.project_key));
  }
  if (payload.cohort_id) {
    conditions.push('cohort_id = ?');
    bindings.push(normalizeText(payload.cohort_id));
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 100) || 100, 500));
  const rows = await queryRows(db, `
    SELECT * FROM snapshot_versions
    ${where}
    ORDER BY created_at DESC
    LIMIT ?
  `, [...bindings, limit], normalizeVersionRow);
  return jsonResponse(200, { ok: true, records: rows }, request);
}

async function handleVersionCreate(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can create versions');
  const versionName = normalizeText(payload.version_name);
  const projectKey = normalizeText(payload.project_key);
  const cohortId = normalizeText(payload.cohort_id);
  if (!versionName || !projectKey || !cohortId) return badRequest(request, 'version_name, project_key and cohort_id are required');
  const row = {
    id: crypto.randomUUID(),
    version_name: versionName,
    project_key: projectKey,
    cohort_id: cohortId,
    snapshot_key: normalizeText(payload.snapshot_key) || null,
    exam_scope: normalizeText(payload.exam_scope) || null,
    score_hash: normalizeText(payload.score_hash) || null,
    teacher_hash: normalizeText(payload.teacher_hash) || null,
    target_hash: normalizeText(payload.target_hash) || null,
    alias_hash: normalizeText(payload.alias_hash) || null,
    config_hash: normalizeText(payload.config_hash) || null,
    summary_json: JSON.stringify(payload.summary_json && typeof payload.summary_json === 'object' ? payload.summary_json : {}),
    is_stable: payload.is_stable ? 1 : 0,
    created_by: normalizeText(session.username),
    created_at: new Date().toISOString()
  };
  await db.prepare(`
    INSERT INTO snapshot_versions (
      id, version_name, project_key, cohort_id, snapshot_key, exam_scope,
      score_hash, teacher_hash, target_hash, alias_hash, config_hash,
      summary_json, is_stable, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    row.id, row.version_name, row.project_key, row.cohort_id, row.snapshot_key, row.exam_scope,
    row.score_hash, row.teacher_hash, row.target_hash, row.alias_hash, row.config_hash,
    row.summary_json, row.is_stable, row.created_by, row.created_at
  ).run();
  const created = await querySingleRow(db, 'SELECT * FROM snapshot_versions WHERE id = ? LIMIT 1', [row.id], normalizeVersionRow);
  return jsonResponse(200, { ok: true, record: created }, request);
}

async function handleVersionUpdate(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can update versions');
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await querySingleRow(db, 'SELECT * FROM snapshot_versions WHERE id = ? LIMIT 1', [id], normalizeVersionRow);
  if (!existing) return badRequest(request, 'snapshot version not found');
  const patchColumns = [];
  const bindings = [];
  if ('is_stable' in payload) {
    const nextStable = payload.is_stable ? 1 : 0;
    if (nextStable) {
      await db.prepare(`
        UPDATE snapshot_versions
        SET is_stable = 0
        WHERE project_key = ? AND cohort_id = ? AND id <> ?
      `).bind(normalizeText(existing.project_key), normalizeText(existing.cohort_id), id).run();
    }
    patchColumns.push('is_stable = ?');
    bindings.push(nextStable);
  }
  if ('version_name' in payload) {
    const versionName = normalizeText(payload.version_name);
    if (!versionName) return badRequest(request, 'version_name cannot be empty');
    patchColumns.push('version_name = ?');
    bindings.push(versionName);
  }
  if (!patchColumns.length) return badRequest(request, 'No supported fields to update');
  bindings.push(id);
  await db.prepare(`UPDATE snapshot_versions SET ${patchColumns.join(', ')} WHERE id = ?`).bind(...bindings).run();
  const updated = await querySingleRow(db, 'SELECT * FROM snapshot_versions WHERE id = ? LIMIT 1', [id], normalizeVersionRow);
  return jsonResponse(200, { ok: true, record: updated }, request);
}

async function handleVersionDelete(request, db, session, payload) {
  if (!isAdminLike(session)) return forbidden(request, 'Only admin or director can delete versions');
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await querySingleRow(db, 'SELECT * FROM snapshot_versions WHERE id = ? LIMIT 1', [id], normalizeVersionRow);
  if (!existing) return badRequest(request, 'snapshot version not found');
  await db.prepare('DELETE FROM snapshot_versions WHERE id = ?').bind(id).run();
  return jsonResponse(200, {
    ok: true,
    deleted: {
      id,
      version_name: normalizeText(existing.version_name),
      is_stable: Boolean(existing.is_stable)
    }
  }, request);
}

async function searchAccountsRows(db, keyword, session, limit) {
  let sql = `
    SELECT * FROM system_users
    WHERE is_active = 1
      AND LOWER(username) LIKE LOWER(?)
  `;
  const bindings = [`%${keyword}%`];
  if (!isAdmin(session)) {
    sql += ' AND school = ?';
    bindings.push(normalizeText(session.school));
  }
  sql += ' LIMIT ?';
  bindings.push(limit);
  const rows = await queryRows(db, sql, bindings, normalizeDbAccountRow);
  return rows.filter((row) => accountVisible(session, row)).map((row) => sanitizeAccountRecord(row));
}

async function handleAccountSearch(request, db, session, payload) {
  if (!canSearchAccounts(session)) return forbidden(request, 'No permission to search accounts');
  const keyword = normalizeText(payload.keyword);
  if (!keyword) return badRequest(request, 'keyword is required');
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 50) || 50, 100));
  const records = await searchAccountsRows(db, keyword, session, limit);
  return jsonResponse(200, { ok: true, records }, request);
}

async function handleAccountUpdate(request, db, session, payload) {
  if (!canSearchAccounts(session)) return forbidden(request, 'No permission to update accounts');
  const username = normalizeText(payload.username);
  if (!username) return badRequest(request, 'username is required');
  const existing = await getSystemUserRow(db, username, { includeInactive: true });
  if (!existing || !existing.is_active) return badRequest(request, 'account not found');
  if (!accountEditable(session, existing)) return forbidden(request, 'Out of scope');
  const nextRole = normalizeText(payload.role) || normalizeText(existing.role) || 'teacher';
  const nextClassName = normalizeText(payload.class_name ?? existing.class_name);
  if ((nextRole === 'parent' || nextRole === 'class_teacher') && !nextClassName) return badRequest(request, 'class_name is required');
  if (nextRole === 'grade_director' && !nextClassName) return badRequest(request, 'class_name is required');
  if (!isAdmin(session) && (nextRole === 'admin' || nextRole === 'director')) {
    return forbidden(request, 'Only admin can elevate account to admin/director');
  }
  if (normalizeText(existing.role) === 'admin' && normalizeText(existing.username) === normalizeText(session.username) && nextRole !== 'admin') {
    return forbidden(request, 'Cannot downgrade current admin account from browser');
  }
  await upsertSystemUser(db, {
    ...existing,
    role: nextRole,
    roles: [nextRole],
    class_name: nextRole === 'teacher' && !nextClassName ? '教师' : nextClassName,
    updated_at: new Date().toISOString(),
    has_password: existing.has_password || Boolean(existing.password_hash)
  });
  const updated = await getSystemUserRow(db, username, { includeInactive: true });
  return jsonResponse(200, { ok: true, record: sanitizeAccountRecord(updated) }, request);
}

async function handleAccountResetPassword(request, db, session, payload) {
  if (!canSearchAccounts(session)) return forbidden(request, 'No permission to reset accounts');
  const username = normalizeText(payload.username);
  const newPassword = normalizeText(payload.new_password);
  if (!username || !newPassword) return badRequest(request, 'username and new_password are required');
  if (newPassword.length < 6) return badRequest(request, 'new_password must be at least 6 characters');
  const existing = await getSystemUserRow(db, username, { includeInactive: true });
  if (!existing || !existing.is_active) return badRequest(request, 'account not found');
  if (!accountEditable(session, existing)) return forbidden(request, 'Out of scope');
  const passwordHash = await hashAccountPassword(newPassword);
  await upsertSystemUser(db, {
    ...existing,
    password_hash: passwordHash,
    password_scheme: PBKDF2_SCHEME,
    password_source: 'cloudflare_reset',
    has_password: true,
    updated_at: new Date().toISOString()
  });
  const updated = await getSystemUserRow(db, username, { includeInactive: true });
  return jsonResponse(200, { ok: true, record: sanitizeAccountRecord(updated) }, request);
}

async function handleAccountChangePassword(request, env, db, session, payload, sessionSource) {
  const oldPassword = normalizeText(payload.old_password);
  const newPassword = normalizeText(payload.new_password);
  if (!oldPassword || !newPassword) return badRequest(request, 'old_password and new_password are required');
  if (newPassword.length < 6) return badRequest(request, 'new_password must be at least 6 characters');
  if (oldPassword === newPassword) return badRequest(request, 'new_password must differ from old_password');
  const existing = await getSystemUserRow(db, normalizeText(session.username), { includeInactive: true });
  if (!existing || !existing.is_active) return badRequest(request, 'current account not found');
  let verified = false;
  if (existing.password_hash) {
    verified = await verifyAccountPasswordHash(existing.password_hash, oldPassword);
  }
  if (!verified && sessionSource === 'supabase') {
    const remote = await proxyGatewayActionToSupabase(request, env, 'account.change_password', payload);
    if (!remote?.ok) {
      return forbidden(request, normalizeText(remote?.error) || 'old password mismatch');
    }
    verified = true;
  }
  if (!verified) return forbidden(request, 'old password mismatch');
  const passwordHash = await hashAccountPassword(newPassword);
  await upsertSystemUser(db, {
    ...existing,
    password_hash: passwordHash,
    password_scheme: PBKDF2_SCHEME,
    password_source: 'cloudflare_change',
    has_password: true,
    updated_at: new Date().toISOString()
  });
  const updated = await getSystemUserRow(db, normalizeText(session.username), { includeInactive: true });
  return jsonResponse(200, { ok: true, record: sanitizeAccountRecord(updated) }, request);
}

async function handleAccountExport(request, db, session) {
  if (!canBulkManageAccounts(session)) return forbidden(request, 'No permission to export accounts');
  let sql = 'SELECT * FROM system_users WHERE is_active = 1';
  const bindings = [];
  if (!isAdmin(session)) {
    sql += ' AND school = ?';
    bindings.push(normalizeText(session.school));
  }
  sql += ' ORDER BY school ASC, role ASC LIMIT 10000';
  const rows = await queryRows(db, sql, bindings, normalizeDbAccountRow);
  return jsonResponse(200, { ok: true, records: rows.map((row) => sanitizeAccountRecord(row)) }, request);
}

async function handleAccountUpsertMany(request, db, session, payload) {
  if (!canBulkManageAccounts(session)) return forbidden(request, 'No permission to manage accounts');
  const rows = Array.isArray(payload.rows) ? payload.rows : [payload];
  const normalizedRows = rows.map((row) => normalizeAccountUpsertRow(row, session));
  for (let index = 0; index < normalizedRows.length; index += 1) {
    const reason = validateAccountUpsertRow(session, normalizedRows[index]);
    if (reason) return badRequest(request, `第 ${index + 1} 条账号数据无效: ${reason}`);
  }
  for (const row of normalizedRows) {
    const existing = await getSystemUserRow(db, row.username, { includeInactive: true });
    const passwordHash = await hashAccountPassword(row.password);
    await upsertSystemUser(db, {
      ...existing,
      username: row.username,
      role: row.role,
      roles: row.roles,
      school: row.school,
      class_name: row.class_name,
      teacher_name: row.teacher_name,
      password_hash: passwordHash,
      password_scheme: PBKDF2_SCHEME,
      password_source: 'cloudflare_upsert',
      has_password: true,
      is_active: true,
      created_at: existing?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  return jsonResponse(200, { ok: true, count: normalizedRows.length }, request);
}

async function handleAccountDeleteNonAdmin(request, db, session) {
  if (!canBulkManageAccounts(session)) return forbidden(request, 'No permission to delete accounts');
  let sql = `
    UPDATE system_users
    SET is_active = 0, updated_at = ?
    WHERE role <> 'admin' AND role <> 'director'
  `;
  const bindings = [new Date().toISOString()];
  if (!isAdmin(session)) {
    sql += ' AND school = ?';
    bindings.push(normalizeText(session.school));
  }
  const result = await db.prepare(sql).bind(...bindings).run();
  return jsonResponse(200, { ok: true, count: Number(result?.meta?.changes || 0) }, request);
}

async function handleAccountMigrationStatus(request, db, session) {
  if (!canBulkManageAccounts(session)) return forbidden(request, 'No permission to view migration status');
  const summary = await db.prepare(`
    SELECT
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS total_accounts,
      SUM(CASE WHEN is_active = 1 AND password_hash IS NOT NULL AND password_hash <> '' THEN 1 ELSE 0 END) AS migrated_accounts,
      SUM(CASE WHEN is_active = 1 AND (password_hash IS NULL OR password_hash = '') THEN 1 ELSE 0 END) AS pending_accounts
    FROM system_users
  `).first();
  const roles = await queryRows(db, `
    SELECT
      role,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS total_accounts,
      SUM(CASE WHEN is_active = 1 AND password_hash IS NOT NULL AND password_hash <> '' THEN 1 ELSE 0 END) AS migrated_accounts,
      SUM(CASE WHEN is_active = 1 AND (password_hash IS NULL OR password_hash = '') THEN 1 ELSE 0 END) AS pending_accounts
    FROM system_users
    GROUP BY role
    ORDER BY total_accounts DESC, role ASC
  `);
  const sources = await queryRows(db, `
    SELECT
      CASE
        WHEN password_source IS NULL OR password_source = '' THEN 'pending'
        ELSE password_source
      END AS password_source,
      COUNT(*) AS account_count
    FROM system_users
    WHERE is_active = 1
    GROUP BY CASE
      WHEN password_source IS NULL OR password_source = '' THEN 'pending'
      ELSE password_source
    END
    ORDER BY account_count DESC, password_source ASC
  `);

  const totalAccounts = Number(summary?.total_accounts || 0);
  const migratedAccounts = Number(summary?.migrated_accounts || 0);
  const pendingAccounts = Number(summary?.pending_accounts || 0);
  const completionRate = totalAccounts > 0
    ? Number(((migratedAccounts / totalAccounts) * 100).toFixed(1))
    : 100;

  return jsonResponse(200, {
    ok: true,
    summary: {
      total_accounts: totalAccounts,
      migrated_accounts: migratedAccounts,
      pending_accounts: pendingAccounts,
      completion_rate: completionRate
    },
    roles: roles.map((row) => ({
      role: normalizeText(row.role) || 'guest',
      total_accounts: Number(row.total_accounts || 0),
      migrated_accounts: Number(row.migrated_accounts || 0),
      pending_accounts: Number(row.pending_accounts || 0)
    })),
    sources: sources.map((row) => ({
      password_source: normalizeText(row.password_source) || 'pending',
      account_count: Number(row.account_count || 0)
    }))
  }, request);
}

async function routeGatewayAction(request, env, body) {
  const db = getGatewayDb(env);
  if (!db || !normalizeText(env.APP_SESSION_SECRET)) return null;
  const action = normalizeText(body?.action);
  const payload = body?.payload && typeof body.payload === 'object' ? body.payload : {};
  if (!action) return badRequest(request, 'action is required');
  if (action === 'login') return performGatewayLogin(request, env, body);
  const resolved = await resolveSession(request, env);
  if (resolved.error) return resolved.error;
  const session = resolved.session;
  const sessionSource = resolved.source;
  if (action === 'session.verify') {
    const token = await signLocalSession(env, buildSessionPayload(session));
    return jsonResponse(200, { ok: true, session, token }, request);
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
    case 'account.update': return handleAccountUpdate(request, db, session, payload);
    case 'account.reset_password': return handleAccountResetPassword(request, db, session, payload);
    case 'account.change_password': return handleAccountChangePassword(request, env, db, session, payload, sessionSource);
    case 'account.export': return handleAccountExport(request, db, session);
    case 'account.upsert_many': return handleAccountUpsertMany(request, db, session, payload);
    case 'account.delete_non_admin': return handleAccountDeleteNonAdmin(request, db, session);
    case 'account.migration_status': return handleAccountMigrationStatus(request, db, session);
    default: return null;
  }
}

export async function handleGatewayRequest(request, env) {
  const body = await request.json().catch(() => null);
  if (!body) return badRequest(request, 'Invalid JSON body');
  return routeGatewayAction(request, env, body);
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
