// Behavioural test: signed sessions are re-checked against D1 so that logout,
// password resets, account deactivation and role changes take effect before
// the token expires, and renewals cannot outlive the absolute session cap.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');

function prepareEsmWorkerModules() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'session-revocation-'));
  const srcDir = path.join(root, 'src');
  for (const name of fs.readdirSync(srcDir)) {
    if (!name.endsWith('.js')) continue;
    const source = fs.readFileSync(path.join(srcDir, name), 'utf8')
      .replace(/from '(\.\/[^']+)\.js'/g, "from '$1.mjs'");
    fs.writeFileSync(path.join(tempDir, name.replace(/\.js$/, '.mjs')), source);
  }
  return tempDir;
}

function createD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(fs.readFileSync(path.join(root, 'cloudflare/d1/003_gateway_accounts.sql'), 'utf8'));
  const statement = (sql, bindings = []) => ({
    bind(...values) { return statement(sql, values); },
    async all() { return { results: sqlite.prepare(sql).all(...bindings) }; },
    async first() { return sqlite.prepare(sql).get(...bindings) || null; },
    async run() { const info = sqlite.prepare(sql).run(...bindings); return { success: true, meta: { changes: Number(info.changes) } }; }
  });
  return { sqlite, prepare(sql) { return statement(sql); }, async batch(list) { return Promise.all(list.map((item) => item.run())); } };
}

async function run() {
  const tempDir = prepareEsmWorkerModules();
  try {
    const worker = (await import(pathToFileURL(path.join(tempDir, 'worker.mjs')).href)).default;
    const { hashAccountPassword } = await import(pathToFileURL(path.join(tempDir, 'worker-crypto.mjs')).href);
    const auth = await import(pathToFileURL(path.join(tempDir, 'worker-auth.mjs')).href);
    const db = createD1();
    const env = { APP_SESSION_SECRET: 'test-secret', GATEWAY_DATA_DB: db };
    const insertUser = db.sqlite.prepare(`INSERT INTO system_users (username, role, roles_json, school, class_name, teacher_name,
      password_hash, password_scheme, password_source, has_password, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 'pbkdf2-sha256', 'cloudflare_change', 1, 1)`);
    insertUser.run('admin', 'admin', '["admin"]', '系统', '', 'admin', await hashAccountPassword('AdminPass#1'));
    insertUser.run('t1', 'teacher', '["teacher"]', 'A校', '教师', '张老师', await hashAccountPassword('TeacherPass#1'));

    const gateway = async (action, { token, payload = {} } = {}) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await worker.fetch(new Request('https://schoolsystem.com.cn/api/edu-gateway', {
        method: 'POST', headers, body: JSON.stringify({ action, payload })
      }), env, { waitUntil() {} });
      return { status: response.status, json: await response.json() };
    };
    const login = async (username, password) => {
      const result = await gateway('login', { payload: { username, password } });
      assert.strictEqual(result.status, 200, `login ${username} should succeed`);
      return result.json.token;
    };

    // 1. Logout revokes the token server-side.
    const t1a = await login('t1', 'TeacherPass#1');
    assert.strictEqual((await gateway('session.verify', { token: t1a })).status, 200);
    assert.strictEqual((await gateway('session.logout', { token: t1a })).status, 200);
    assert.strictEqual((await gateway('session.verify', { token: t1a })).status, 401, 'a logged-out token must stop working');

    // 2. Changing your own password keeps this device but ends the others.
    const t1b = await login('t1', 'TeacherPass#1');
    const t1c = await login('t1', 'TeacherPass#1');
    const change = await gateway('account.change_password', { token: t1b, payload: { old_password: 'TeacherPass#1', new_password: 'TeacherPass#2' } });
    assert.strictEqual(change.status, 200);
    assert.strictEqual((await gateway('session.verify', { token: t1b })).status, 200, 'the device that changed the password stays signed in');
    assert.strictEqual((await gateway('session.verify', { token: t1c })).status, 401, 'other devices are signed out after a password change');

    // 3. Admin reset ends every session of the target account.
    const admin = await login('admin', 'AdminPass#1');
    const t1d = await login('t1', 'TeacherPass#2');
    assert.strictEqual((await gateway('account.reset_password', { token: admin, payload: { username: 't1', new_password: 'TeacherPass#3' } })).status, 200);
    assert.strictEqual((await gateway('session.verify', { token: t1d })).status, 401, 'reset password must sign the account out');

    // 4. Role/scope changes apply to live sessions; deactivation blocks them.
    const t1e = await login('t1', 'TeacherPass#3');
    db.sqlite.prepare("UPDATE system_users SET role = 'class_teacher', roles_json = '[\"class_teacher\"]', class_name = '701' WHERE username = 't1'").run();
    const { session: decoded } = await auth.resolveSession(new Request('https://x/', { headers: { Authorization: `Bearer ${t1e}` } }), { APP_SESSION_SECRET: 'test-secret' });
    // Bypass the 30s cache by checking with a fresh session id lookup.
    auth.forgetCachedSession(decoded.session_id);
    const refreshed = await gateway('session.verify', { token: t1e });
    assert.strictEqual(refreshed.status, 200);
    assert.strictEqual(refreshed.json.session.role, 'class_teacher', 'role changes must reach existing sessions');
    assert.strictEqual(refreshed.json.session.class_name, '701');
    db.sqlite.prepare("UPDATE system_users SET is_active = 0 WHERE username = 't1'").run();
    auth.forgetCachedSession(decoded.session_id);
    assert.strictEqual((await gateway('session.verify', { token: t1e })).status, 401, 'deactivated accounts must lose access');

    // 5. Renewal keeps the original sign-in time and cannot exceed the absolute cap.
    const { signLocalSession } = await import(pathToFileURL(path.join(tempDir, 'worker-crypto.mjs')).href);
    const now = Math.floor(Date.now() / 1000);
    const stale = await signLocalSession(env, {
      session_id: 'old-session', username: 'admin', role: 'admin', roles: ['admin'],
      auth_at: now - auth.SESSION_ABSOLUTE_MAX_AGE_SECONDS - 60, exp: now + 3600
    });
    assert.strictEqual((await gateway('session.verify', { token: stale })).status, 401, 'sessions older than the absolute cap must re-authenticate');
    const renewed = await gateway('session.verify', { token: admin });
    const renewedPayload = JSON.parse(Buffer.from(renewed.json.token.split('.')[1], 'base64url').toString('utf8'));
    const originalPayload = JSON.parse(Buffer.from(admin.split('.')[1], 'base64url').toString('utf8'));
    assert.strictEqual(renewedPayload.auth_at, originalPayload.auth_at, 'renewal must keep the original sign-in time');

    // 6. Administrators are not exempt from replacing an issued password.
    assert.strictEqual(auth.shouldForceManagedPasswordChange({ role: 'admin', password_source: 'cloudflare_upsert' }), true, 'admins must change issued passwords');
    assert.strictEqual(auth.shouldForceManagedPasswordChange({ role: 'admin', password_source: 'cloudflare_change' }), false);

    console.log('session revocation tests passed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
