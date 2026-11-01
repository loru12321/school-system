const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');
const edgeGatewayRuntime = fs.readFileSync(path.join(root, 'public/assets/js/edge-gateway-runtime.js'), 'utf8');
const gatewaySessionRuntime = fs.readFileSync(path.join(root, 'public/assets/js/gateway-session-runtime.js'), 'utf8');
const bootRuntime = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');
const authLoginRuntime = fs.readFileSync(path.join(root, 'public/assets/js/auth-login-runtime.js'), 'utf8');
const loginShellStateRuntime = fs.readFileSync(path.join(root, 'public/assets/js/login-shell-state-runtime.js'), 'utf8');
const sourceIndex = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');

function prepareEsmWorkerModules() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-auth-security-'));
  const srcDir = path.join(root, 'src');
  for (const name of fs.readdirSync(srcDir)) {
    if (!name.endsWith('.js')) continue;
    const sourcePath = path.join(srcDir, name);
    const targetPath = path.join(tempDir, name.replace(/\.js$/, '.mjs'));
    const source = fs.readFileSync(sourcePath, 'utf8')
      .replace(/from '(\.\/[^']+)\.js'/g, "from '$1.mjs'");
    fs.writeFileSync(targetPath, source);
  }
  return tempDir;
}

// Real SQLite behind a minimal D1 facade, so the atomic UPSERT ... RETURNING
// used by the login rate limiter is exercised exactly as D1 would run it.
function createRateLimitDb() {
  const sqlite = new DatabaseSync(':memory:');
  const statement = (sql, bindings = []) => ({
    bind(...values) { return statement(sql, values); },
    async all() { return { results: sqlite.prepare(sql).all(...bindings) }; },
    async first() { return sqlite.prepare(sql).get(...bindings) || null; },
    async run() { const info = sqlite.prepare(sql).run(...bindings); return { success: true, meta: { changes: Number(info.changes) } }; }
  });
  return {
    sqlite,
    rows: {
      has(key) { return Boolean(sqlite.prepare('SELECT 1 FROM login_rate_limits WHERE scope_key = ?').get(key)); }
    },
    prepare(sql) { return statement(sql); }
  };
}

async function run() {
  assert.ok(!edgeGatewayRuntime.includes('sessionStorage.getItem(this.tokenStorageKey)'), 'gateway bearer tokens must not be restored from sessionStorage');
  assert.ok(edgeGatewayRuntime.includes('GatewaySessionRuntime.request'), 'business gateway methods should delegate session transport to the focused session runtime');
  assert.ok(gatewaySessionRuntime.includes("action === 'session.verify' && data.token"), 'cookie session verification should repopulate only the in-memory token');
  assert.ok(bootRuntime.includes('restoreBootGatewaySession'), 'boot runtime should restore a same-origin cookie session before deciding the shell state');
  assert.ok(bootRuntime.includes("document.documentElement.dataset.bootAuth = shouldShowLogin ? 'logged_out' : 'logged_in';"), 'boot session restoration must update the first-paint auth CSS state');
  assert.ok(bootRuntime.includes('setBootLoginOverlayVisibility(overlay, shouldShowLogin)'), 'boot session restoration must delegate login shell visibility to the shared early runtime');
  assert.ok(authLoginRuntime.includes("document.documentElement.dataset.bootAuth = shouldShowLogin ? 'logged_out' : 'logged_in';"), 'full authentication runtime must keep the first-paint auth CSS state in sync');
  assert.ok(authLoginRuntime.includes('window.setLoginOverlayVisibility?.(overlay, shouldShowLogin'), 'full authentication runtime must preserve the shared authenticated shell layout state');
  assert.ok(loginShellStateRuntime.includes("overlay.style.setProperty('display', shouldShow ? 'flex' : 'none', 'important');"), 'the shared login shell runtime must enforce the skin-safe display priority');
  assert.ok(sourceIndex.indexOf('gateway-session-runtime.js') < sourceIndex.indexOf('edge-gateway-runtime.js'), 'session runtime must load before business gateway methods');
  assert.ok(sourceIndex.indexOf('edge-gateway-runtime.js') < sourceIndex.indexOf('boot-runtime-runtime-'), 'secure gateway runtime must load before the boot login shell');
  assert.ok(sourceIndex.indexOf('login-shell-state-runtime.js') < sourceIndex.indexOf('boot-runtime-runtime-'), 'shared login shell state must load before the boot login shell');

  const tempDir = prepareEsmWorkerModules();
  try {
    const [{
      buildSessionCookie,
      clearSessionCookie,
      resolveSession,
      recordFailedLogin,
      getLoginRateLimit,
      clearLoginRateLimit,
      reserveLoginAttempt,
      settleSuccessfulLogin
    }, { signLocalSession }] = await Promise.all([
      import(pathToFileURL(path.join(tempDir, 'worker-auth.mjs')).href),
      import(pathToFileURL(path.join(tempDir, 'worker-crypto.mjs')).href)
    ]);

    const env = { APP_SESSION_SECRET: 'test-secret' };
    const token = await signLocalSession(env, { username: 'cookie-user', roles: ['teacher'], exp: Math.floor(Date.now() / 1000) + 3600 });
    const cookie = buildSessionCookie(token);
    assert.ok(cookie.includes('__Host-school-session='), 'session cookie should use the host-only cookie name');
    assert.ok(cookie.includes('HttpOnly') && cookie.includes('Secure') && cookie.includes('SameSite=Strict'), 'session cookie should use secure browser-only flags');
    assert.ok(clearSessionCookie().includes('Max-Age=0'), 'logout cookie should expire immediately');

    const cookieRequest = new Request('https://schoolsystem.com.cn/api/edu-gateway', {
      headers: { Cookie: cookie.split(';')[0] }
    });
    const resolved = await resolveSession(cookieRequest, env);
    assert.strictEqual(resolved.session.username, 'cookie-user', 'same-origin cookie should resolve an app session without a readable bearer token');

    const db = createRateLimitDb();
    const request = new Request('https://schoolsystem.com.cn/api/edu-gateway', {
      headers: { 'CF-Connecting-IP': '203.0.113.10' }
    });
    for (let index = 0; index < 4; index += 1) {
      const state = await recordFailedLogin(request, db, 'rate-user');
      assert.strictEqual(state.locked, false, 'the first four failed attempts must not lock the account');
    }
    const locked = await recordFailedLogin(request, db, 'rate-user');
    assert.strictEqual(locked.locked, true, 'the fifth failed attempt must lock that account');
    assert.ok(locked.retryAfterSeconds > 0, 'a locked login should report a retry window');
    assert.strictEqual((await getLoginRateLimit(request, db, 'rate-user')).locked, true, 'lock state must survive a new request');
    assert.strictEqual((await getLoginRateLimit(request, db, 'another-user')).locked, false, 'one account lock must not block other accounts on the same school network');
    await clearLoginRateLimit(request, db, 'rate-user');
    assert.strictEqual((await getLoginRateLimit(request, db, 'rate-user')).locked, false, 'a valid login can clear its own rate-limit state');
    assert.ok(db.rows.has('ip:203.0.113.10'), 'clearing one user must retain the IP abuse counter');

    for (let index = 0; index < 25; index += 1) {
      await recordFailedLogin(request, db, `burst-user-${index}`);
    }
    assert.strictEqual((await getLoginRateLimit(request, db, 'unrelated-user')).locked, true, 'a clear high-frequency burst must still trigger an IP-wide lock');

    // A parallel burst must not get more than the allowed number of tries in.
    const raceDb = createRateLimitDb();
    const raceRequest = new Request('https://schoolsystem.com.cn/api/edu-gateway', {
      headers: { 'CF-Connecting-IP': '198.51.100.7' }
    });
    const burst = await Promise.all(Array.from({ length: 20 }, () => reserveLoginAttempt(raceRequest, raceDb, 'race-user')));
    assert.strictEqual(burst.filter((item) => !item.rejected).length, 5, 'only the per-account budget of attempts may proceed in a parallel burst');

    // Successful sign-ins hand their attempt back to the shared IP budget.
    const staffDb = createRateLimitDb();
    const staffRequest = new Request('https://schoolsystem.com.cn/api/edu-gateway', {
      headers: { 'CF-Connecting-IP': '198.51.100.8' }
    });
    for (let index = 0; index < 40; index += 1) {
      const attempt = await reserveLoginAttempt(staffRequest, staffDb, `staff-${index}`);
      assert.strictEqual(attempt.rejected, false, 'teachers signing in correctly from one school IP must never be locked out');
      await settleSuccessfulLogin(staffRequest, staffDb, `staff-${index}`);
    }

    console.log('worker auth security tests passed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
