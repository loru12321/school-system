// Behavioural test: account management actions cannot be used to grant roles
// or take over accounts outside the caller's scope, demotions take effect, and
// the login endpoint does not leak whether an account exists or is disabled.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');

function prepareEsmWorkerModules() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'account-role-escalation-'));
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
    const { hashAccountPassword, signLocalSession } = await import(pathToFileURL(path.join(tempDir, 'worker-crypto.mjs')).href);
    const db = createD1();
    const env = { APP_SESSION_SECRET: 'test-secret', GATEWAY_DATA_DB: db };
    const insertUser = db.sqlite.prepare(`INSERT INTO system_users (username, role, roles_json, school, class_name, teacher_name,
      password_hash, password_scheme, password_source, has_password, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 'pbkdf2-sha256', 'cloudflare_change', 1, ?)`);
    const hash = await hashAccountPassword('Passw0rd#1');
    insertUser.run('admin', 'admin', '["admin"]', '系统', '', 'admin', hash, 1);
    insertUser.run('dirA', 'director', '["director"]', 'A校', '', 'dirA', hash, 1);
    insertUser.run('dirA2', 'director', '["director"]', 'A校', '', 'dirA2', hash, 1);
    insertUser.run('c702', 'class_teacher', '["class_teacher"]', 'A校', '702', 'c702', hash, 1);
    insertUser.run('p702', 'parent', '["parent"]', 'A校', '702', '家长', hash, 1);
    insertUser.run('tB', 'teacher', '["teacher"]', 'B校', '教师', 'tB', hash, 1);
    insertUser.run('gone', 'teacher', '["teacher"]', 'A校', '教师', 'gone', hash, 0);

    const exp = Math.floor(Date.now() / 1000) + 3600;
    const tokenFor = (claims) => signLocalSession(env, { session_id: `s-${claims.username}`, exp, ...claims });
    const gateway = async (action, { token, payload = {}, ip = '203.0.113.50' } = {}) => {
      const headers = { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await worker.fetch(new Request('https://schoolsystem.com.cn/api/edu-gateway', {
        method: 'POST', headers, body: JSON.stringify({ action, payload })
      }), env, { waitUntil() {} });
      return { status: response.status, json: await response.json() };
    };
    const rolesOf = (username) => JSON.parse(db.sqlite.prepare('SELECT roles_json FROM system_users WHERE username = ?').get(username).roles_json);

    const admin = await tokenFor({ username: 'admin', role: 'admin', roles: ['admin'], school: '系统' });
    const directorA = await tokenFor({ username: 'dirA', role: 'director', roles: ['director'], school: 'A校' });
    const classTeacher = await tokenFor({ username: 'c702', role: 'class_teacher', roles: ['class_teacher'], school: 'A校', class_name: '702' });

    // 1. A class teacher may edit their own class's parent, but not grant extra roles.
    let result = await gateway('account.update', { token: classTeacher, payload: { username: 'p702', role: 'parent', roles: ['parent', 'admin'] } });
    assert.strictEqual(result.status, 403, 'roles[] must not be usable to grant admin');
    assert.deepStrictEqual(rolesOf('p702'), ['parent'], 'rejected update must not change roles');
    result = await gateway('account.update', { token: classTeacher, payload: { username: 'p702', role: 'grade_director', class_name: '7' } });
    assert.strictEqual(result.status, 403, 'a class teacher cannot promote a parent to grade director');
    result = await gateway('account.update', { token: classTeacher, payload: { username: 'p702', role: 'parent', school: 'B校', class_name: '702' } });
    assert.strictEqual(result.status, 403, 'a class teacher cannot move an account to another school');
    result = await gateway('account.update', { token: classTeacher, payload: { username: 'p702', role: 'parent', class_name: '702' } });
    assert.strictEqual(result.status, 200, 'in-scope edits keep working');

    // 2. A director cannot grant admin through roles[] either.
    result = await gateway('account.update', { token: directorA, payload: { username: 'p702', role: 'parent', class_name: '702', roles: ['parent', 'director'] } });
    assert.strictEqual(result.status, 403, 'directors cannot grant director/admin via roles[]');

    // 3. Bulk import cannot mint admins or overwrite accounts outside the caller's scope.
    result = await gateway('account.upsert_many', { token: directorA, payload: { rows: [{ username: 'new1', password: 'Passw0rd#2', role: 'teacher', roles: ['teacher', 'admin'], school: 'A校' }] } });
    assert.strictEqual(result.status, 403, 'bulk import must reject roles the caller cannot grant');
    assert.strictEqual(db.sqlite.prepare("SELECT COUNT(*) AS n FROM system_users WHERE username = 'new1'").get().n, 0);
    const adminHashBefore = db.sqlite.prepare("SELECT password_hash FROM system_users WHERE username = 'admin'").get().password_hash;
    result = await gateway('account.upsert_many', { token: directorA, payload: { rows: [{ username: 'admin', password: 'Takeover#1', role: 'teacher', school: 'A校' }] } });
    assert.strictEqual(result.status, 403, 'bulk import must not overwrite the administrator account');
    assert.strictEqual(db.sqlite.prepare("SELECT password_hash FROM system_users WHERE username = 'admin'").get().password_hash, adminHashBefore);
    result = await gateway('account.upsert_many', { token: directorA, payload: { rows: [{ username: 'tB', password: 'Takeover#1', role: 'teacher', school: 'A校' }] } });
    assert.strictEqual(result.status, 403, 'bulk import must not take over another school\'s account');
    result = await gateway('account.upsert_many', { token: directorA, payload: { rows: [{ username: 'new2', password: 'Passw0rd#2', role: 'teacher', school: 'A校' }] } });
    assert.strictEqual(result.status, 200, 'in-scope bulk import keeps working');

    // 4. Demoting an account removes the old primary role.
    result = await gateway('account.update', { token: admin, payload: { username: 'dirA2', role: 'teacher', school: 'A校' } });
    assert.strictEqual(result.status, 200);
    assert.deepStrictEqual(rolesOf('dirA2'), ['teacher'], 'a demoted director must not keep the director role');

    // 5. Login does not reveal disabled accounts to someone without the password.
    result = await gateway('login', { payload: { username: 'gone', password: 'wrong-password' }, ip: '203.0.113.60' });
    assert.strictEqual(result.status, 401, 'a wrong password on a disabled account looks like any other failure');
    result = await gateway('login', { payload: { username: 'nobody', password: 'wrong-password' }, ip: '203.0.113.60' });
    assert.strictEqual(result.status, 401);
    result = await gateway('login', { payload: { username: 'gone', password: 'Passw0rd#1' }, ip: '203.0.113.60' });
    assert.strictEqual(result.status, 403, 'the account owner still learns the account is disabled');

    // 6. A correctly signed token whose payload is not valid base64url is a
    //    401, not a 500.
    const { createHmac } = require('crypto');
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const content = `${header}.%%%`;
    const forged = `${content}.${createHmac('sha256', env.APP_SESSION_SECRET).update(content).digest('base64url')}`;
    result = await gateway('session.verify', { token: forged });
    assert.strictEqual(result.status, 401, 'an undecodable token payload must be rejected as unauthorized');

    console.log('account role escalation tests passed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
