import {
  normalizeText,
  jsonResponse,
  fetchWithTimeout
} from './worker-http-helpers.js';
import {
  isAdmin,
  hasAnyRole,
  buildSessionCookie
} from './worker-auth.js';
import { signLocalSession } from './worker-crypto.js';

const REVIEW_SESSION_MAX_SECONDS = 24 * 60 * 60;
const EMAIL_CODE_TTL_MS = 10 * 60 * 1000;
const EMAIL_CODE_COOLDOWN_MS = 60 * 1000;
const EMAIL_CODE_DAILY_LIMIT = 10;
const EMAIL_CODE_MAX_ATTEMPTS = 5;

function badRequest(request, message, status = 400) {
  return jsonResponse(status, { ok: false, error: message }, request);
}

function forbidden(request, message = 'Insufficient role permissions') {
  return jsonResponse(403, { ok: false, error: message }, request);
}

function generateId(prefix) {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${Date.now()}_${hex}`;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(value || '')));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqualHex(a, b) {
  const left = normalizeText(a).toLowerCase();
  const right = normalizeText(b).toLowerCase();
  if (!left || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) {
    diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return diff === 0;
}

function parseSubjectsList(raw) {
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map((s) => normalizeText(s)).filter(Boolean))).slice(0, 12);
  }
  const text = normalizeText(raw);
  if (!text) return [];
  return Array.from(new Set(text.split(/[、,，;；/\s]+/).map((s) => s.trim()).filter(Boolean))).slice(0, 12);
}

async function ensureGovernanceTables(db) {
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS teacher_change_requests (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      teacher_name TEXT NOT NULL DEFAULT '',
      school TEXT NOT NULL DEFAULT '',
      current_class_name TEXT NOT NULL DEFAULT '',
      proposed_class_name TEXT NOT NULL DEFAULT '',
      current_subjects_json TEXT NOT NULL DEFAULT '[]',
      proposed_subjects_json TEXT NOT NULL DEFAULT '[]',
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      reviewer_username TEXT NOT NULL DEFAULT '',
      review_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS deletion_tombstones (
      id TEXT PRIMARY KEY,
      resource_type TEXT NOT NULL,
      resource_key TEXT NOT NULL,
      school TEXT NOT NULL DEFAULT '',
      actor_username TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      deleted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
  await db.prepare(
    `CREATE TABLE IF NOT EXISTS email_verification_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      username TEXT NOT NULL DEFAULT '',
      code_hash TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'password_reset',
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at TEXT NOT NULL,
      consumed_at TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`
  ).run();
}

// ---------------------------------------------------------------------------
// 1. Teacher self-service class/subject change requests + admin diff approval
// ---------------------------------------------------------------------------

export async function handleTeacherChangeSubmit(request, db, session, payload) {
  if (!session || session.role === 'review_demo') {
    return forbidden(request, '演示账号不可提交变更申请');
  }
  await ensureGovernanceTables(db);
  const username = normalizeText(session.username);
  if (!username) return badRequest(request, 'Invalid session user');

  const proposedClass = normalizeText(payload.proposed_class_name ?? payload.class_name);
  const proposedSubjects = parseSubjectsList(payload.proposed_subjects ?? payload.subjects);
  const reason = normalizeText(payload.reason).slice(0, 300);
  if (!proposedClass && !proposedSubjects.length) {
    return badRequest(request, '请至少填写拟变更的班级或任教学科');
  }

  const userRow = await db.prepare(
    'SELECT username, teacher_name, school, class_name FROM system_users WHERE username = ? LIMIT 1'
  ).bind(username).first();

  const now = new Date().toISOString();
  const id = generateId('tcr');
  const teacherName = normalizeText(userRow?.teacher_name || session.teacher_name || username);
  const school = normalizeText(userRow?.school || session.school || '');
  const currentClass = normalizeText(userRow?.class_name || session.class_name || '');
  const currentSubjects = parseSubjectsList(payload.current_subjects);

  await db.prepare(
    `INSERT INTO teacher_change_requests
      (id, username, teacher_name, school, current_class_name, proposed_class_name, current_subjects_json, proposed_subjects_json, reason, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).bind(
    id,
    username,
    teacherName,
    school,
    currentClass,
    proposedClass || currentClass,
    JSON.stringify(currentSubjects),
    JSON.stringify(proposedSubjects),
    reason,
    now,
    now
  ).run();

  return jsonResponse(200, {
    ok: true,
    request: {
      id,
      username,
      teacher_name: teacherName,
      school,
      current_class_name: currentClass,
      proposed_class_name: proposedClass || currentClass,
      current_subjects: currentSubjects,
      proposed_subjects: proposedSubjects,
      reason,
      status: 'pending',
      created_at: now
    }
  }, request);
}

export async function handleTeacherChangeList(request, db, session, payload) {
  await ensureGovernanceTables(db);
  const statusFilter = normalizeText(payload.status);
  const limit = Math.max(1, Math.min(200, Number(payload.limit) || 100));
  const isReviewer = hasAnyRole(session, ['admin', 'director']);
  const params = [];
  const clauses = [];

  if (!isReviewer) {
    clauses.push('username = ?');
    params.push(normalizeText(session.username));
  } else if (!isAdmin(session)) {
    clauses.push('school = ?');
    params.push(normalizeText(session.school));
  } else if (normalizeText(payload.school)) {
    clauses.push('school = ?');
    params.push(normalizeText(payload.school));
  }

  if (statusFilter) {
    clauses.push('status = ?');
    params.push(statusFilter);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT id, username, teacher_name, school, current_class_name, proposed_class_name,
    current_subjects_json, proposed_subjects_json, reason, status, reviewer_username, review_note,
    created_at, updated_at
    FROM teacher_change_requests ${where} ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  const { results } = await db.prepare(sql).bind(...params).all();
  const rows = (results || []).map((row) => ({
    ...row,
    current_subjects: JSON.parse(row.current_subjects_json || '[]'),
    proposed_subjects: JSON.parse(row.proposed_subjects_json || '[]')
  }));
  return jsonResponse(200, { ok: true, rows }, request);
}

export async function handleTeacherChangeWithdraw(request, db, session, payload) {
  await ensureGovernanceTables(db);
  const id = normalizeText(payload.id);
  if (!id) return badRequest(request, 'id is required');
  const existing = await db.prepare(
    'SELECT id, username, status FROM teacher_change_requests WHERE id = ? LIMIT 1'
  ).bind(id).first();
  if (!existing) return badRequest(request, '变更申请不存在', 404);
  if (normalizeText(existing.username) !== normalizeText(session.username) && !isAdmin(session)) {
    return forbidden(request, '只能撤回本人提交的申请');
  }
  if (existing.status !== 'pending') {
    return badRequest(request, '该申请已处理，无法撤回', 409);
  }
  const now = new Date().toISOString();
  await db.prepare(
    "UPDATE teacher_change_requests SET status = 'withdrawn', updated_at = ? WHERE id = ?"
  ).bind(now, id).run();
  return jsonResponse(200, { ok: true, id, status: 'withdrawn', updated_at: now }, request);
}

export async function handleTeacherChangeReview(request, db, session, payload) {
  if (!hasAnyRole(session, ['admin', 'director'])) {
    return forbidden(request, '仅管理员或校领导可审核教师变更申请');
  }
  await ensureGovernanceTables(db);
  const id = normalizeText(payload.id);
  const decision = normalizeText(payload.decision).toLowerCase();
  const reviewNote = normalizeText(payload.review_note).slice(0, 300);
  if (!id) return badRequest(request, 'id is required');
  if (decision !== 'approved' && decision !== 'rejected') {
    return badRequest(request, 'decision must be approved or rejected');
  }

  const existing = await db.prepare(
    `SELECT id, username, teacher_name, school, current_class_name, proposed_class_name,
      current_subjects_json, proposed_subjects_json, status
     FROM teacher_change_requests WHERE id = ? LIMIT 1`
  ).bind(id).first();
  if (!existing) return badRequest(request, '变更申请不存在', 404);
  if (!isAdmin(session) && normalizeText(existing.school) !== normalizeText(session.school)) {
    return forbidden(request, '无权审核其他学校的教师变更申请');
  }
  if (existing.status !== 'pending') {
    return badRequest(request, '该申请已处理，不可重复审核', 409);
  }

  const now = new Date().toISOString();
  const reviewer = normalizeText(session.username);
  const statements = [
    db.prepare(
      'UPDATE teacher_change_requests SET status = ?, reviewer_username = ?, review_note = ?, updated_at = ? WHERE id = ?'
    ).bind(decision, reviewer, reviewNote, now, id)
  ];

  if (decision === 'approved' && normalizeText(existing.proposed_class_name)) {
    statements.push(
      db.prepare('UPDATE system_users SET class_name = ?, updated_at = ? WHERE username = ?')
        .bind(normalizeText(existing.proposed_class_name), now, normalizeText(existing.username))
    );
  }

  // Record audit trail in system_logs (best-effort if table exists)
  const detail = `教师变更审核(${decision}): ${existing.teacher_name || existing.username} 班级 ${existing.current_class_name || '空'} -> ${existing.proposed_class_name || '空'}${reviewNote ? `（${reviewNote}）` : ''}`;
  await db.batch(statements);
  await db.prepare(
    "INSERT INTO system_logs (operator, action, details, school, status, created_at) VALUES (?, ?, ?, ?, 'normal', ?)"
  ).bind(reviewer, 'teacher_change.review', detail, normalizeText(existing.school), now)
    .run()
    .catch(() => {});

  return jsonResponse(200, {
    ok: true,
    id,
    status: decision,
    reviewer_username: reviewer,
    updated_at: now,
    diff: {
      before: {
        class_name: existing.current_class_name,
        subjects: JSON.parse(existing.current_subjects_json || '[]')
      },
      after: {
        class_name: existing.proposed_class_name,
        subjects: JSON.parse(existing.proposed_subjects_json || '[]')
      }
    }
  }, request);
}

// ---------------------------------------------------------------------------
// 2. D1 Deletion Tombstones (anti-resurrection after Time Travel recovery)
// ---------------------------------------------------------------------------

export async function recordDeletionTombstone(db, { resourceType, resourceKey, school = '', actorUsername = '', summary = '' }) {
  if (!db || !normalizeText(resourceType) || !normalizeText(resourceKey)) return null;
  await ensureGovernanceTables(db);
  const id = generateId('tomb');
  const deletedAt = new Date().toISOString();
  await db.prepare(
    `INSERT INTO deletion_tombstones (id, resource_type, resource_key, school, actor_username, summary, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    normalizeText(resourceType),
    normalizeText(resourceKey),
    normalizeText(school),
    normalizeText(actorUsername),
    normalizeText(summary).slice(0, 300),
    deletedAt
  ).run();
  return { id, resource_type: normalizeText(resourceType), resource_key: normalizeText(resourceKey), deleted_at: deletedAt };
}

export async function handleTombstoneRecord(request, db, session, payload) {
  if (!isAdmin(session)) return forbidden(request, '仅管理员可记录删除墓碑');
  const resourceType = normalizeText(payload.resource_type);
  const resourceKey = normalizeText(payload.resource_key);
  if (!['exam', 'account', 'cohort'].includes(resourceType) || !resourceKey) {
    return badRequest(request, 'resource_type (exam|account|cohort) and resource_key are required');
  }
  const entry = await recordDeletionTombstone(db, {
    resourceType,
    resourceKey,
    school: payload.school || session.school || '',
    actorUsername: session.username || '',
    summary: payload.summary || ''
  });
  return jsonResponse(200, { ok: true, tombstone: entry }, request);
}

export async function handleTombstoneList(request, db, session, payload) {
  if (!isAdmin(session)) return forbidden(request, '仅管理员可导出删除墓碑清单');
  await ensureGovernanceTables(db);
  const limit = Math.max(1, Math.min(1000, Number(payload.limit) || 500));
  const resourceType = normalizeText(payload.resource_type);
  const sql = resourceType
    ? 'SELECT id, resource_type, resource_key, school, actor_username, summary, deleted_at FROM deletion_tombstones WHERE resource_type = ? ORDER BY deleted_at DESC LIMIT ?'
    : 'SELECT id, resource_type, resource_key, school, actor_username, summary, deleted_at FROM deletion_tombstones ORDER BY deleted_at DESC LIMIT ?';
  const stmt = resourceType ? db.prepare(sql).bind(resourceType, limit) : db.prepare(sql).bind(limit);
  const { results } = await stmt.all();
  return jsonResponse(200, { ok: true, rows: results || [] }, request);
}

// ---------------------------------------------------------------------------
// 3. Time-limited read-only review/demo login (env-gated, max 24h)
// ---------------------------------------------------------------------------

export async function handleReviewLogin(request, env, body) {
  const configuredUser = normalizeText(env?.REVIEW_LOGIN_USERNAME);
  const configuredHash = normalizeText(env?.REVIEW_LOGIN_PASSWORD_HASH);
  const configuredExpiresAt = normalizeText(env?.REVIEW_LOGIN_EXPIRES_AT);

  if (!configuredUser || !configuredHash || !configuredExpiresAt) {
    return jsonResponse(404, { ok: false, error: 'REVIEW_LOGIN_NOT_ENABLED' }, request);
  }

  const expiresMs = Date.parse(configuredExpiresAt);
  if (!Number.isFinite(expiresMs) || Date.now() >= expiresMs) {
    return jsonResponse(403, { ok: false, error: 'REVIEW_LOGIN_EXPIRED', message: '演示/审核账号已到期失效' }, request);
  }

  const username = normalizeText(body?.username ?? body?.payload?.username);
  const password = String(body?.password ?? body?.payload?.password ?? '');
  if (!username || !password) {
    return badRequest(request, 'username and password are required');
  }

  const candidateHash = await sha256Hex(password);
  if (username !== configuredUser || !timingSafeEqualHex(candidateHash, configuredHash)) {
    return jsonResponse(401, { ok: false, error: 'INVALID_REVIEW_CREDENTIALS', message: '演示账号或密码错误' }, request);
  }

  const remainingSeconds = Math.max(60, Math.floor((expiresMs - Date.now()) / 1000));
  const ttlSeconds = Math.min(REVIEW_SESSION_MAX_SECONDS, remainingSeconds);
  const nowSec = Math.floor(Date.now() / 1000);
  const session = {
    username: configuredUser,
    role: 'review_demo',
    roles: ['review_demo'],
    school: normalizeText(env?.REVIEW_LOGIN_SCHOOL) || '演示学校',
    class_name: '',
    teacher_name: '观摩演示账号',
    read_only: true,
    session_id: generateId('rev'),
    iat: nowSec,
    exp: nowSec + ttlSeconds,
    expires_at: new Date((nowSec + ttlSeconds) * 1000).toISOString()
  };
  const token = await signLocalSession(env, session);
  return jsonResponse(200, { ok: true, session, token }, request, { 'Set-Cookie': buildSessionCookie(token) });
}

// ---------------------------------------------------------------------------
// 4. Email verification code & self-service password reset (fail-closed)
// ---------------------------------------------------------------------------

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 120;
}

export async function handleEmailCodeSend(request, db, env, payload) {
  const relayUrl = normalizeText(env?.EMAIL_RELAY_URL);
  const relayToken = normalizeText(env?.EMAIL_RELAY_TOKEN);
  if (!relayUrl || !relayToken) {
    return jsonResponse(503, {
      ok: false,
      error: 'EMAIL_VERIFICATION_NOT_CONFIGURED',
      message: '邮箱验证码服务尚未配置，请联系管理员重置密码。'
    }, request);
  }

  const email = normalizeText(payload.email).toLowerCase();
  const username = normalizeText(payload.username);
  if (!isValidEmail(email)) return badRequest(request, '请输入有效的邮箱地址');

  await ensureGovernanceTables(db);
  const nowMs = Date.now();
  const oneMinAgo = new Date(nowMs - EMAIL_CODE_COOLDOWN_MS).toISOString();
  const oneDayAgo = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();

  const recent = await db.prepare(
    'SELECT COUNT(1) AS cnt FROM email_verification_codes WHERE email = ? AND created_at >= ?'
  ).bind(email, oneMinAgo).first();
  if (Number(recent?.cnt || 0) >= 1) {
    return jsonResponse(429, { ok: false, error: 'EMAIL_CODE_RATE_LIMITED', message: '发送过于频繁，请 60 秒后再试' }, request);
  }

  const daily = await db.prepare(
    'SELECT COUNT(1) AS cnt FROM email_verification_codes WHERE email = ? AND created_at >= ?'
  ).bind(email, oneDayAgo).first();
  if (Number(daily?.cnt || 0) >= EMAIL_CODE_DAILY_LIMIT) {
    return jsonResponse(429, { ok: false, error: 'EMAIL_CODE_DAILY_LIMIT', message: '今日验证码发送次数已达上限' }, request);
  }

  const rand = new Uint32Array(1);
  crypto.getRandomValues(rand);
  const code = String(100000 + (rand[0] % 900000));
  const codeHash = await sha256Hex(`${email}:${code}`);
  const createdAt = new Date(nowMs).toISOString();
  const expiresAt = new Date(nowMs + EMAIL_CODE_TTL_MS).toISOString();

  await db.prepare(
    `INSERT INTO email_verification_codes (id, email, username, code_hash, purpose, attempts, max_attempts, expires_at, created_at)
     VALUES (?, ?, ?, ?, 'password_reset', 0, ?, ?, ?)`
  ).bind(generateId('emc'), email, username, codeHash, EMAIL_CODE_MAX_ATTEMPTS, expiresAt, createdAt).run();

  try {
    await fetchWithTimeout(relayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${relayToken}`
      },
      body: JSON.stringify({
        to: email,
        subject: '澄见成绩分析系统 · 验证码',
        text: `您的验证码为 ${code}，10 分钟内有效，请勿泄露给他人。`
      })
    }, 10000);
  } catch (error) {
    console.error('[governance] email relay failed:', error);
    return jsonResponse(502, { ok: false, error: 'EMAIL_RELAY_FAILED', message: '验证码邮件发送失败，请稍后重试' }, request);
  }

  // Always return a generic message to avoid leaking whether an email is bound.
  return jsonResponse(200, {
    ok: true,
    message: '如果该邮箱已绑定账号，验证码已发送至邮箱，10 分钟内有效。'
  }, request);
}

export async function handleEmailCodeVerify(request, db, payload) {
  const email = normalizeText(payload.email).toLowerCase();
  const code = normalizeText(payload.code);
  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return badRequest(request, '请输入有效的邮箱和 6 位数字验证码');
  }
  await ensureGovernanceTables(db);
  const row = await db.prepare(
    `SELECT id, email, username, code_hash, attempts, max_attempts, expires_at, consumed_at
     FROM email_verification_codes
     WHERE email = ? AND consumed_at = ''
     ORDER BY created_at DESC LIMIT 1`
  ).bind(email).first();

  if (!row) return jsonResponse(400, { ok: false, error: 'EMAIL_CODE_INVALID', message: '验证码无效或已过期' }, request);
  if (Date.now() > Date.parse(row.expires_at)) {
    return jsonResponse(400, { ok: false, error: 'EMAIL_CODE_EXPIRED', message: '验证码已过期，请重新获取' }, request);
  }
  if (Number(row.attempts || 0) >= Number(row.max_attempts || EMAIL_CODE_MAX_ATTEMPTS)) {
    return jsonResponse(429, { ok: false, error: 'EMAIL_CODE_LOCKED', message: '验证码错误次数过多，已作废，请重新获取' }, request);
  }

  const candidateHash = await sha256Hex(`${email}:${code}`);
  if (!timingSafeEqualHex(candidateHash, row.code_hash)) {
    const nextAttempts = Number(row.attempts || 0) + 1;
    await db.prepare('UPDATE email_verification_codes SET attempts = ? WHERE id = ?')
      .bind(nextAttempts, row.id).run();
    return jsonResponse(400, {
      ok: false,
      error: 'EMAIL_CODE_MISMATCH',
      message: `验证码错误（剩余 ${Math.max(0, Number(row.max_attempts || EMAIL_CODE_MAX_ATTEMPTS) - nextAttempts)} 次机会）`
    }, request);
  }

  const now = new Date().toISOString();
  await db.prepare('UPDATE email_verification_codes SET consumed_at = ? WHERE id = ?').bind(now, row.id).run();
  return jsonResponse(200, { ok: true, email, username: row.username, verified_at: now }, request);
}
