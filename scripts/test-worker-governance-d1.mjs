import assert from 'node:assert';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { handleGatewayRequest } from '../src/worker-gateway-d1.js';
import { buildSessionPayload } from '../src/worker-auth.js';
import { signLocalSession } from '../src/worker-crypto.js';
import { detectResurrectedRecords } from './check-tombstones.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function createMockD1() {
  const sqlite = new DatabaseSync(':memory:');
  const dir = path.join(root, 'cloudflare', 'd1');
  const files = fs.readdirSync(dir).filter((f) => /^\d{3}_.+\.sql$/.test(f)).sort();
  for (const f of files) {
    sqlite.exec(fs.readFileSync(path.join(dir, f), 'utf8'));
  }

  function wrapStatement(sql, bindings = []) {
    return {
      bind(...args) {
        return wrapStatement(sql, args);
      },
      async first() {
        const stmt = sqlite.prepare(sql);
        return stmt.get(...bindings) || null;
      },
      async all() {
        const stmt = sqlite.prepare(sql);
        return { results: stmt.all(...bindings) };
      },
      async run() {
        const stmt = sqlite.prepare(sql);
        const info = stmt.run(...bindings);
        return { success: true, meta: { changes: info.changes } };
      }
    };
  }

  return {
    sqlite,
    prepare(sql) { return wrapStatement(sql); },
    async batch(stmts) {
      const out = [];
      for (const s of stmts) out.push(await s.run());
      return out;
    }
  };
}

async function callGateway(env, body, token = '') {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const req = new Request('https://schoolsystem.com.cn/api/edu-gateway', {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
  const res = await handleGatewayRequest(req, env, null);
  return { status: res.status, data: await res.json() };
}

async function run() {
  const db = createMockD1();
  const env = {
    APP_SESSION_SECRET: 'test-secret-key-for-governance-tests-1234567890',
    GATEWAY_DATA_DB: db
  };

  // Seed users
  db.sqlite.prepare(
    `INSERT INTO system_users (username, role, roles_json, school, class_name, teacher_name, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run('admin', 'admin', '["admin"]', '银山实验', '', '管理员');
  db.sqlite.prepare(
    `INSERT INTO system_users (username, role, roles_json, school, class_name, teacher_name, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run('t_zhang', 'teacher', '["teacher"]', '银山实验', '8.1', '张老师');
  db.sqlite.prepare(
    `INSERT INTO system_users (username, role, roles_json, school, class_name, teacher_name, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`
  ).run('dir_other', 'director', '["director"]', '梯门中学', '', '梯门主任');

  const futureExp = new Date(Date.now() + 3600 * 1000).toISOString();
  const seedSession = db.sqlite.prepare(
    `INSERT INTO login_sessions (id, username, role, school, class_name, session_id, session_expires_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`
  );
  seedSession.run('ls_admin', 'admin', 'admin', '银山实验', '', 's_admin', futureExp);
  seedSession.run('ls_t', 't_zhang', 'teacher', '银山实验', '8.1', 's_t', futureExp);
  seedSession.run('ls_d', 'dir_other', 'director', '梯门中学', '', 's_d', futureExp);

  const adminToken = await signLocalSession(env, buildSessionPayload({ username: 'admin', role: 'admin', roles: ['admin'], school: '银山实验', session_id: 's_admin' }));
  const teacherToken = await signLocalSession(env, buildSessionPayload({ username: 't_zhang', role: 'teacher', roles: ['teacher'], school: '银山实验', class_name: '8.1', teacher_name: '张老师', session_id: 's_t' }));
  const otherDirToken = await signLocalSession(env, buildSessionPayload({ username: 'dir_other', role: 'director', roles: ['director'], school: '梯门中学', session_id: 's_d' }));

  // 1. Teacher submits a class/subject change request
  const submitRes = await callGateway(env, {
    action: 'teacher_change.submit',
    payload: { proposed_class_name: '8.2', proposed_subjects: ['语文', '道法'], reason: '本学期调班' }
  }, teacherToken);
  assert.strictEqual(submitRes.status, 200);
  assert.strictEqual(submitRes.data.ok, true);
  const reqId = submitRes.data.request.id;
  assert.strictEqual(submitRes.data.request.current_class_name, '8.1');
  assert.strictEqual(submitRes.data.request.proposed_class_name, '8.2');

  // Other school's director cannot approve 银山实验's teacher change
  const crossSchoolRes = await callGateway(env, {
    action: 'teacher_change.review',
    payload: { id: reqId, decision: 'approved' }
  }, otherDirToken);
  assert.strictEqual(crossSchoolRes.status, 403);

  // Admin approves -> updates system_users.class_name + writes system_logs audit
  const approveRes = await callGateway(env, {
    action: 'teacher_change.review',
    payload: { id: reqId, decision: 'approved', review_note: '教务核实通过' }
  }, adminToken);
  assert.strictEqual(approveRes.status, 200);
  assert.strictEqual(approveRes.data.status, 'approved');
  assert.strictEqual(approveRes.data.diff.before.class_name, '8.1');
  assert.strictEqual(approveRes.data.diff.after.class_name, '8.2');

  const updatedUser = db.sqlite.prepare('SELECT class_name FROM system_users WHERE username = ?').get('t_zhang');
  assert.strictEqual(updatedUser.class_name, '8.2');
  const auditLog = db.sqlite.prepare("SELECT action, school FROM system_logs WHERE action = 'teacher_change.review'").get();
  assert.ok(auditLog && auditLog.school === '银山实验', 'approval should write school-scoped audit log');

  // 2. Deletion tombstones + resurrection detection
  const tombRes = await callGateway(env, {
    action: 'tombstone.record',
    payload: { resource_type: 'exam', resource_key: '2024级-8年级-2026-2027-上学期-期中-2026-11-10', summary: '测试清理' }
  }, adminToken);
  assert.strictEqual(tombRes.status, 200);
  const tombList = await callGateway(env, { action: 'tombstone.list', payload: {} }, adminToken);
  assert.strictEqual(tombList.data.rows.length, 1);

  const resurrected = detectResurrectedRecords(tombList.data.rows, {
    examKeys: ['2024级-8年级-2026-2027-上学期-期中-2026-11-10']
  });
  assert.strictEqual(resurrected.length, 1);
  assert.strictEqual(detectResurrectedRecords(tombList.data.rows, { examKeys: [] }).length, 0);

  // 3. Time-limited read-only review-login
  const reviewPass = 'ReviewDemo#2026';
  const reviewHash = crypto.createHash('sha256').update(reviewPass).digest('hex');
  const reviewEnv = {
    ...env,
    REVIEW_LOGIN_USERNAME: 'reviewer_demo',
    REVIEW_LOGIN_PASSWORD_HASH: reviewHash,
    REVIEW_LOGIN_EXPIRES_AT: new Date(Date.now() + 3600 * 1000).toISOString()
  };
  const revOk = await callGateway(reviewEnv, {
    action: 'auth.review_login',
    username: 'reviewer_demo',
    password: reviewPass
  });
  assert.strictEqual(revOk.status, 200);
  assert.strictEqual(revOk.data.session.role, 'review_demo');
  assert.strictEqual(revOk.data.session.read_only, true);

  // Expired review-login must be rejected
  const expiredEnv = { ...reviewEnv, REVIEW_LOGIN_EXPIRES_AT: '2020-01-01T00:00:00Z' };
  const revExp = await callGateway(expiredEnv, {
    action: 'auth.review_login',
    username: 'reviewer_demo',
    password: reviewPass
  });
  assert.strictEqual(revExp.status, 403);

  // 4. Email verification code fail-closed when relay not configured
  const emailUnconf = await callGateway(env, {
    action: 'auth.email_code_send',
    payload: { email: 'teacher@school.edu.cn' }
  });
  assert.strictEqual(emailUnconf.status, 503);
  assert.strictEqual(emailUnconf.data.error, 'EMAIL_VERIFICATION_NOT_CONFIGURED');

  console.log('worker-governance-d1 tests passed');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
