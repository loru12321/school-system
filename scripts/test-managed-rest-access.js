// Behavioural test: /sb/rest/v1/issues and /sb/rest/v1/system_logs must require a
// verified session for every method and apply role scoping on the server.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');

function prepareEsmWorkerModules() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'managed-rest-access-'));
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
  sqlite.exec(`
    CREATE TABLE issues (id INTEGER PRIMARY KEY AUTOINCREMENT, student_name TEXT, student_class TEXT, school TEXT,
      issue_type TEXT, description TEXT, contact_info TEXT, status TEXT, created_at TEXT);
    CREATE TABLE system_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, operator TEXT, action TEXT, details TEXT,
      status TEXT, created_at TEXT);
  `);
  const statement = (sql, bindings = []) => ({
    sql,
    bindings,
    bind(...values) { return statement(sql, values); },
    async all() { return { results: sqlite.prepare(sql).all(...bindings) }; },
    async first() { return sqlite.prepare(sql).get(...bindings) || null; },
    async run() { const info = sqlite.prepare(sql).run(...bindings); return { success: true, meta: { changes: Number(info.changes) } }; }
  });
  return {
    sqlite,
    prepare(sql) { return statement(sql); },
    async batch(statements) { return Promise.all(statements.map((item) => item.run())); }
  };
}

async function run() {
  const tempDir = prepareEsmWorkerModules();
  try {
    const worker = (await import(pathToFileURL(path.join(tempDir, 'worker-dummy.mjs')).href)).default;
    const { signLocalSession } = await import(pathToFileURL(path.join(tempDir, 'worker-crypto.mjs')).href);
    const db = createD1();
    const env = { APP_SESSION_SECRET: 'test-secret', GATEWAY_DATA_DB: db, CLOUD_SYSTEM_DATA_MODE: 'primary' };
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const tokenFor = (claims) => signLocalSession(env, { session_id: `s-${claims.username}`, exp, ...claims });

    db.sqlite.exec(`
      INSERT INTO system_users (username, role, roles_json, school, class_name, teacher_name) VALUES
        ('admin', 'admin', '["admin"]', '系统', '', 'admin'),
        ('dirA', 'director', '["director"]', 'A校', '', 'dirA'),
        ('g7', 'grade_director', '["grade_director"]', 'A校', '7', 'g7'),
        ('c702', 'class_teacher', '["class_teacher"]', 'A校', '702', 'c702'),
        ('p1', 'parent', '["parent"]', 'A校', '701', '家长');
      INSERT INTO issues (student_name, student_class, school, issue_type, description, contact_info, status, created_at) VALUES
        ('甲', '701', 'A校', 'score', 'x', '13800000000', 'pending', '2026-10-01'),
        ('乙', '702', 'A校', 'score', 'x', NULL, 'pending', '2026-10-02'),
        ('丙', '801', 'B校', 'score', 'x', NULL, 'pending', '2026-10-03');
      INSERT INTO system_logs (operator, action, details, status, created_at) VALUES ('admin (admin)', '登录', '', 'normal', '2026-10-01');
    `);

    const call = async (pathAndQuery, { token, method = 'GET', body } = {}) => {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await worker.fetch(new Request(`https://schoolsystem.com.cn${pathAndQuery}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body)
      }), env, { waitUntil() {} });
      const text = method === 'HEAD' ? '' : await response.text();
      return { status: response.status, json: text ? JSON.parse(text) : null };
    };

    // Anonymous access is rejected for reads as well as writes.
    assert.strictEqual((await call('/sb/rest/v1/issues?select=*')).status, 401, 'anonymous issue reads must be rejected');
    assert.strictEqual((await call('/sb/rest/v1/system_logs?select=*')).status, 401, 'anonymous log reads must be rejected');
    assert.strictEqual((await call('/sb/rest/v1/issues?select=*', { method: 'HEAD' })).status, 401, 'anonymous HEAD must be rejected');

    const admin = await tokenFor({ username: 'admin', role: 'admin', roles: ['admin'] });
    const directorA = await tokenFor({ username: 'dirA', role: 'director', roles: ['director'], school: 'A校' });
    const gradeDirector = await tokenFor({ username: 'g7', role: 'grade_director', roles: ['grade_director'], school: 'A校', class_name: '7' });
    const classTeacher = await tokenFor({ username: 'c702', role: 'class_teacher', roles: ['class_teacher'], school: 'A校', class_name: '702' });
    const parent = await tokenFor({ username: 'p1', role: 'parent', roles: ['parent'], school: 'A校', class_name: '701', teacher_name: '家长' });

    const names = (result) => result.json.map((row) => row.student_name).sort().join(',');
    assert.strictEqual(names(await call('/sb/rest/v1/issues?select=*', { token: admin })), '丙,乙,甲', 'admin sees every issue');
    assert.strictEqual(names(await call('/sb/rest/v1/issues?select=*', { token: directorA })), '乙,甲', 'director sees own school only');
    assert.strictEqual(names(await call('/sb/rest/v1/issues?select=*&school=eq.B校', { token: directorA })), '', 'director filters cannot widen scope');
    assert.strictEqual(names(await call('/sb/rest/v1/issues?select=*', { token: gradeDirector })), '乙,甲', 'grade director sees own grade prefix');
    assert.strictEqual(names(await call('/sb/rest/v1/issues?select=*', { token: classTeacher })), '乙', 'class teacher sees own class');
    assert.strictEqual((await call('/sb/rest/v1/issues?select=*', { token: parent })).status, 403, 'parents cannot list issues');

    // Parents can still submit; status/created_at are server controlled.
    const submit = await call('/sb/rest/v1/issues', { token: parent, method: 'POST', body: [{ student_name: '丁', student_class: '701', school: 'A校', issue_type: 'score', description: 'y', status: 'resolved', created_at: '2000-01-01' }] });
    assert.strictEqual(submit.status, 201, 'authenticated users can submit issues');
    const inserted = db.sqlite.prepare("SELECT status, created_at FROM issues WHERE student_name = '丁'").get();
    assert.strictEqual(inserted.status, 'pending', 'non-triage submitters cannot set issue status');
    assert.notStrictEqual(inserted.created_at, '2000-01-01', 'created_at must be server generated');

    // Scoped mutations: a class teacher cannot touch another class's issue.
    const other = db.sqlite.prepare("SELECT id FROM issues WHERE student_name = '丙'").get().id;
    const patchOther = await call(`/sb/rest/v1/issues?id=eq.${other}`, { token: classTeacher, method: 'PATCH', body: { status: 'resolved' } });
    assert.strictEqual(patchOther.status, 200);
    assert.strictEqual(db.sqlite.prepare('SELECT status FROM issues WHERE id = ?').get(other).status, 'pending', 'out-of-scope PATCH must change nothing');
    assert.strictEqual((await call(`/sb/rest/v1/issues?id=eq.${other}`, { token: parent, method: 'DELETE' })).status, 403, 'parents cannot delete issues');

    // system_logs: anyone signed in may append; operator comes from the session.
    assert.strictEqual((await call('/sb/rest/v1/system_logs', { token: parent, method: 'POST', body: [{ operator: 'admin (admin)', action: '查看', details: 'd' }] })).status, 201);
    const lastLog = db.sqlite.prepare('SELECT operator FROM system_logs ORDER BY id DESC LIMIT 1').get();
    assert.strictEqual(lastLog.operator, '家长 (parent)', 'log operator must not be spoofable');
    assert.strictEqual((await call('/sb/rest/v1/system_logs?select=*', { token: parent })).status, 403, 'parents cannot read logs');
    assert.strictEqual((await call('/sb/rest/v1/system_logs?select=*', { token: directorA })).status, 200, 'directors can read logs');
    assert.strictEqual((await call('/sb/rest/v1/system_logs?id=eq.1', { token: directorA, method: 'DELETE' })).status, 403, 'only admins may delete logs');
    assert.strictEqual((await call('/sb/rest/v1/system_logs?id=eq.1', { token: parent, method: 'PATCH', body: { status: 'deleted' } })).status, 403, 'parents cannot alter logs');
    assert.strictEqual((await call('/sb/rest/v1/system_logs?id=eq.1', { token: admin, method: 'DELETE' })).status, 200, 'admins can delete logs');

    console.log('managed REST access tests passed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
