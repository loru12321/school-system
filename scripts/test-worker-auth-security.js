const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
const edgeGatewayRuntime = fs.readFileSync(path.join(root, 'public/assets/js/edge-gateway-runtime.js'), 'utf8');
const gatewaySessionRuntime = fs.readFileSync(path.join(root, 'public/assets/js/gateway-session-runtime.js'), 'utf8');
const bootRuntime = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');
const authLoginRuntime = fs.readFileSync(path.join(root, 'public/assets/js/auth-login-runtime.js'), 'utf8');
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

function createRateLimitDb() {
  const rows = new Map();
  return {
    rows,
    prepare(sql) {
      let bindings = [];
      return {
        bind(...values) {
          bindings = values;
          return this;
        },
        async run() {
          if (/INSERT INTO login_rate_limits/i.test(sql)) {
            const [scopeKey, failedCount, firstFailedAt, lastFailedAt, lockedUntil] = bindings;
            rows.set(scopeKey, {
              scope_key: scopeKey,
              failed_count: failedCount,
              first_failed_at: firstFailedAt,
              last_failed_at: lastFailedAt,
              locked_until: lockedUntil
            });
          } else if (/DELETE FROM login_rate_limits/i.test(sql)) {
            bindings.forEach((key) => rows.delete(key));
          }
          return { success: true };
        },
        async first() {
          const key = bindings[0];
          const row = rows.get(key);
          return row ? { ...row } : null;
        },
        async all() {
          const selected = bindings
            .map((key) => rows.get(key))
            .filter(Boolean)
            .map((row) => ({ ...row }));
          return { results: selected };
        }
      };
    }
  };
}

async function run() {
  assert.ok(!edgeGatewayRuntime.includes('sessionStorage.getItem(this.tokenStorageKey)'), 'gateway bearer tokens must not be restored from sessionStorage');
  assert.ok(edgeGatewayRuntime.includes('GatewaySessionRuntime.request'), 'business gateway methods should delegate session transport to the focused session runtime');
  assert.ok(gatewaySessionRuntime.includes("action === 'session.verify' && data.token"), 'cookie session verification should repopulate only the in-memory token');
  assert.ok(bootRuntime.includes('restoreBootGatewaySession'), 'boot runtime should restore a same-origin cookie session before deciding the shell state');
  assert.ok(bootRuntime.includes("document.documentElement.dataset.bootAuth = shouldShowLogin ? 'logged_out' : 'logged_in';"), 'boot session restoration must update the first-paint auth CSS state');
  assert.ok(authLoginRuntime.includes("document.documentElement.dataset.bootAuth = shouldShowLogin ? 'logged_out' : 'logged_in';"), 'full authentication runtime must keep the first-paint auth CSS state in sync');
  assert.ok(sourceIndex.indexOf('gateway-session-runtime.js') < sourceIndex.indexOf('edge-gateway-runtime.js'), 'session runtime must load before business gateway methods');
  assert.ok(sourceIndex.indexOf('edge-gateway-runtime.js') < sourceIndex.indexOf('boot-runtime-runtime-'), 'secure gateway runtime must load before the boot login shell');

  const tempDir = prepareEsmWorkerModules();
  try {
    const [{
      buildSessionCookie,
      clearSessionCookie,
      resolveSession,
      recordFailedLogin,
      getLoginRateLimit,
      clearLoginRateLimit
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
    assert.strictEqual(locked.locked, true, 'the fifth failed attempt must lock the account/IP window');
    assert.ok(locked.retryAfterSeconds > 0, 'a locked login should report a retry window');
    assert.strictEqual((await getLoginRateLimit(request, db, 'rate-user')).locked, true, 'lock state must survive a new request');
    await clearLoginRateLimit(request, db, 'rate-user');
    assert.strictEqual((await getLoginRateLimit(request, db, 'rate-user')).locked, false, 'a valid login can clear its own rate-limit state');

    console.log('worker auth security tests passed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
