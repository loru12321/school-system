// Account management handlers for the D1 gateway.
// Handles: search, login sessions, update, reset/change password,
// export, bulk upsert, delete, and migration status.
import { normalizeText } from './worker-http-helpers.js';
import {
  jsonResponse, badRequest, forbidden,
  isAdmin, hasRole, canSearchAccounts, canBulkManageAccounts,
  accountVisible, accountEditable, sanitizeAccountRecord,
  normalizeDbAccountRow, normalizeAccountUpsertRow, validateAccountUpsertRow,
  getSystemUserRow, upsertSystemUser,
  ensureLoginSessionsTable, normalizeLoginSessionRow,
  queryRows
} from './worker-auth.js';
import {
  hashAccountPassword, verifyAccountPasswordHash, PBKDF2_SCHEME
} from './worker-crypto.js';

// Maximum number of accounts per batch.  Keeps PBKDF2 hashing within
// Cloudflare Worker CPU limits (~50 ms budget).
const ACCOUNT_UPSERT_BATCH_LIMIT = 50;
const ACCOUNT_LIST_COLUMNS = [
  'username', 'role', 'roles_json', 'school', 'class_name', 'teacher_name',
  'password_hash', 'password_scheme', 'password_source', 'has_password',
  'is_active', 'last_login_at', 'created_at', 'updated_at'
].join(', ');
const LOGIN_SESSION_LIST_COLUMNS = [
  'id', 'username', 'role', 'school', 'class_name', 'session_id',
  'device_label', 'device_type', 'browser', 'os', 'platform', 'language',
  'timezone', 'screen', 'user_agent', 'ip_address', 'login_at',
  'last_seen_at', 'session_expires_at', 'status'
].join(', ');

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function searchAccountsRows(db, keyword, session, limit) {
  let sql = `
    SELECT ${ACCOUNT_LIST_COLUMNS} FROM system_users
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

// ---------------------------------------------------------------------------
// Exported handlers
// ---------------------------------------------------------------------------

export async function handleAccountSearch(request, db, session, payload) {
  if (!canSearchAccounts(session)) return forbidden(request, 'No permission to search accounts');
  const keyword = normalizeText(payload.keyword);
  if (!keyword) return badRequest(request, 'keyword is required');
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 50) || 50, 100));
  const records = await searchAccountsRows(db, keyword, session, limit);
  return jsonResponse(200, { ok: true, records }, request);
}

export async function handleLoginSessionList(request, db, session, payload) {
  await ensureLoginSessionsTable(db);
  const mode = normalizeText(payload.mode) || 'self';
  const limit = Math.max(1, Math.min(Number(payload.limit ?? 50) || 50, 200));
  const bindings = [];
  let sql = `SELECT ${LOGIN_SESSION_LIST_COLUMNS} FROM login_sessions`;
  if (mode === 'all') {
    if (!isAdmin(session)) return forbidden(request, 'Only admin can view all login sessions');
  } else {
    sql += ' WHERE username = ?';
    bindings.push(normalizeText(session.username));
  }
  sql += ' ORDER BY login_at DESC LIMIT ?';
  bindings.push(limit);
  const records = await queryRows(db, sql, bindings, normalizeLoginSessionRow);
  return jsonResponse(200, {
    ok: true,
    records,
    current_session_id: normalizeText(session.session_id),
    scope: mode === 'all' && isAdmin(session) ? 'all' : 'self'
  }, request);
}

export async function handleAccountUpdate(request, db, session, payload) {
  if (!canSearchAccounts(session)) return forbidden(request, 'No permission to update accounts');
  const username = normalizeText(payload.username);
  if (!username) return badRequest(request, 'username is required');
  const existing = await getSystemUserRow(db, username, { includeInactive: true });
  if (!existing || !existing.is_active) return badRequest(request, 'account not found');
  if (!accountEditable(session, existing)) return forbidden(request, 'Out of scope');
  const nextRole = normalizeText(payload.role) || normalizeText(existing.role) || 'teacher';
  let nextSchool = normalizeText(payload.school ?? existing.school);
  let nextClassName = normalizeText(payload.class_name ?? existing.class_name);
  if (nextRole === 'teacher' && !nextClassName) nextClassName = '教师';
  if (nextRole === 'director' || nextRole === 'admin') nextClassName = '';
  if (nextRole !== 'admin' && !nextSchool) return badRequest(request, 'school is required');
  if (nextRole === 'admin') nextSchool = '系统';
  if ((nextRole === 'parent' || nextRole === 'class_teacher') && !nextClassName) return badRequest(request, 'class_name is required');
  if (nextRole === 'grade_director' && !nextClassName) return badRequest(request, 'class_name is required');
  if (!isAdmin(session) && (nextRole === 'admin' || nextRole === 'director')) {
    return forbidden(request, 'Only admin can elevate account to admin/director');
  }
  if (hasRole(session, 'director') && normalizeText(nextSchool) !== normalizeText(session?.school)) {
    return forbidden(request, 'Director can only manage accounts in own school');
  }
  if (normalizeText(existing.role) === 'admin' && normalizeText(existing.username) === normalizeText(session.username) && nextRole !== 'admin') {
    return forbidden(request, 'Cannot downgrade current admin account from browser');
  }
  const payloadRoles = Array.isArray(payload.roles)
    ? payload.roles.map((role) => normalizeText(role)).filter(Boolean)
    : [];
  const existingRoles = Array.isArray(existing.roles)
    ? existing.roles.map((role) => normalizeText(role)).filter(Boolean)
    : [];
  const nextRoles = payloadRoles.length
    ? Array.from(new Set(payloadRoles))
    : Array.from(new Set([nextRole, ...existingRoles].filter(Boolean)));
  await upsertSystemUser(db, {
    ...existing,
    role: nextRole,
    roles: nextRoles.length ? nextRoles : [nextRole],
    school: nextSchool,
    class_name: nextClassName,
    teacher_name: normalizeText(payload.teacher_name || existing.teacher_name || existing.display_name || existing.username),
    updated_at: new Date().toISOString(),
    has_password: existing.has_password || Boolean(existing.password_hash)
  });
  const updated = await getSystemUserRow(db, username, { includeInactive: true });
  return jsonResponse(200, { ok: true, record: sanitizeAccountRecord(updated) }, request);
}

export async function handleAccountResetPassword(request, db, session, payload) {
  if (!canSearchAccounts(session)) return forbidden(request, 'No permission to reset accounts');
  const username = normalizeText(payload.username);
  const newPassword = normalizeText(payload.new_password);
  if (!username || !newPassword) return badRequest(request, 'username and new_password are required');
  if (newPassword.length < 8) return badRequest(request, 'new_password must be at least 8 characters');
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

export async function handleAccountChangePassword(request, db, session, payload) {
  const oldPassword = normalizeText(payload.old_password);
  const newPassword = normalizeText(payload.new_password);
  if (!oldPassword || !newPassword) return badRequest(request, 'old_password and new_password are required');
  if (newPassword.length < 8) return badRequest(request, 'new_password must be at least 8 characters');
  if (oldPassword === newPassword) return badRequest(request, 'new_password must differ from old_password');
  const existing = await getSystemUserRow(db, normalizeText(session.username), { includeInactive: true });
  if (!existing || !existing.is_active) return badRequest(request, 'current account not found');
  let verified = false;
  if (existing.password_hash) {
    verified = await verifyAccountPasswordHash(existing.password_hash, oldPassword);
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

export async function handleAccountExport(request, db, session) {
  if (!canBulkManageAccounts(session)) return forbidden(request, 'No permission to export accounts');
  let sql = `SELECT ${ACCOUNT_LIST_COLUMNS} FROM system_users WHERE is_active = 1`;
  const bindings = [];
  if (!isAdmin(session)) {
    sql += ' AND school = ?';
    bindings.push(normalizeText(session.school));
  }
  sql += ' ORDER BY school ASC, role ASC LIMIT 10000';
  const rows = await queryRows(db, sql, bindings, normalizeDbAccountRow);
  return jsonResponse(200, { ok: true, records: rows.map((row) => sanitizeAccountRecord(row)) }, request);
}

export async function handleAccountUpsertMany(request, db, session, payload) {
  if (!canBulkManageAccounts(session)) return forbidden(request, 'No permission to manage accounts');
  const rows = Array.isArray(payload.rows) ? payload.rows : [payload];
  // Guard: cap batch size to avoid PBKDF2 CPU exhaustion in a single Worker invocation.
  if (rows.length > ACCOUNT_UPSERT_BATCH_LIMIT) {
    return badRequest(request, `单次批量上限为 ${ACCOUNT_UPSERT_BATCH_LIMIT} 条，本次提交 ${rows.length} 条，请分批提交`);
  }
  const normalizedRows = rows.map((row) => normalizeAccountUpsertRow(row, session));
  for (let index = 0; index < normalizedRows.length; index += 1) {
    const reason = validateAccountUpsertRow(session, normalizedRows[index]);
    if (reason) return badRequest(request, `第 ${index + 1} 条账号数据无效: ${reason}`);
  }
  // Pre-hash all passwords and fetch existing rows before batching to D1.
  const now = new Date().toISOString();
  const statements = [];
  for (const row of normalizedRows) {
    const existing = await getSystemUserRow(db, row.username, { includeInactive: true });
    const passwordHash = await hashAccountPassword(row.password);
    // Build the upsert statement inline so all writes go in a single db.batch() call.
    const normalized = {
      username: normalizeText(row.username),
      role: normalizeText(row.role) || 'guest',
      roles_json: JSON.stringify(Array.isArray(row.roles) ? Array.from(new Set(row.roles.map((r) => normalizeText(r)).filter(Boolean))) : [row.role || 'guest']),
      school: normalizeText(row.school) || null,
      class_name: normalizeText(row.class_name) || null,
      teacher_name: normalizeText(row.teacher_name || row.username) || null,
      password_hash: passwordHash,
      password_scheme: PBKDF2_SCHEME,
      password_source: 'cloudflare_upsert',
      has_password: 1,
      is_active: 1,
      last_login_at: normalizeText(existing?.last_login_at) || null,
      created_at: normalizeText(existing?.created_at) || now,
      updated_at: now
    };
    statements.push(
      db.prepare(`
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
          password_hash = excluded.password_hash,
          password_scheme = excluded.password_scheme,
          password_source = excluded.password_source,
          has_password = 1,
          is_active = excluded.is_active,
          last_login_at = COALESCE(system_users.last_login_at, excluded.last_login_at),
          created_at = system_users.created_at,
          updated_at = excluded.updated_at
      `).bind(
        normalized.username, normalized.role, normalized.roles_json,
        normalized.school, normalized.class_name, normalized.teacher_name,
        normalized.password_hash, normalized.password_scheme, normalized.password_source,
        normalized.has_password, normalized.is_active,
        normalized.last_login_at, normalized.created_at, normalized.updated_at
      )
    );
  }
  // Atomic batch write — all rows succeed or all fail together.
  if (statements.length) await db.batch(statements);
  return jsonResponse(200, { ok: true, count: normalizedRows.length }, request);
}

export async function handleAccountDeleteNonAdmin(request, db, session) {
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

export async function handleAccountMigrationStatus(request, db, session) {
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
  const normalizedSources = new Map();
  sources.forEach((row) => {
    const rawSource = normalizeText(row.password_source) || 'pending';
    const normalizedSource = rawSource === 'supabase_login'
      ? 'historical_supabase_login'
      : rawSource;
    normalizedSources.set(
      normalizedSource,
      (normalizedSources.get(normalizedSource) || 0) + Number(row.account_count || 0)
    );
  });

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
    sources: Array.from(normalizedSources.entries())
      .map(([passwordSource, accountCount]) => ({
        password_source: passwordSource,
        account_count: accountCount
      }))
      .sort((left, right) => right.account_count - left.account_count || left.password_source.localeCompare(right.password_source)),
    fallback: {
      enabled: false,
      mode: pendingAccounts > 0 ? 'cloudflare-only-pending-account-repair-required' : 'cloudflare-only-ready'
    }
  }, request);
}
