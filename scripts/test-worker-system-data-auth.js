const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');

function prepareEsmWorkerModules() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-system-data-auth-'));
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

function createD1Mock() {
  const rows = new Map();
  const calls = { batch: 0, run: 0, all: 0 };

  function statement(sql) {
    let bindings = [];
    return {
      bind(...values) {
        bindings = values;
        return this;
      },
      async all() {
        calls.all += 1;
        return {
          results: Array.from(rows.values()).map((row) => ({ ...row }))
        };
      },
      async run() {
        calls.run += 1;
        if (/DELETE FROM/i.test(sql)) {
          for (const key of bindings) rows.delete(key);
        }
        return { success: true };
      },
      _sql: sql,
      _bindings: () => bindings.slice()
    };
  }

  return {
    rows,
    calls,
    prepare: statement,
    async batch(statements) {
      calls.batch += 1;
      for (const stmt of statements) {
        const bindings = stmt._bindings();
        const key = bindings[0];
        rows.set(key, {
          key,
          content_text: bindings[1] || '',
          object_key: bindings[2] || '',
          created_at: bindings.length === 12 ? bindings[9] : new Date().toISOString(),
          updated_at: bindings.length === 12 ? bindings[10] : bindings[9],
          size_bytes: bindings.length === 12 ? bindings[11] : bindings[10]
        });
      }
      return [];
    }
  };
}

function makeRequest(method, url, token, body) {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  return new Request(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

async function json(response) {
  return response.json();
}

async function run() {
  const tempDir = prepareEsmWorkerModules();
  const [{ handleSystemDataProxy }, { signLocalSession }] = await Promise.all([
    import(pathToFileURL(path.join(tempDir, 'worker-system-data.mjs')).href),
    import(pathToFileURL(path.join(tempDir, 'worker-crypto.mjs')).href)
  ]);

  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount += 1;
    return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const env = {
      APP_SESSION_SECRET: 'test-secret',
      CLOUD_SYSTEM_DATA_MODE: 'primary',
      CLOUD_SYSTEM_DATA_DB: createD1Mock()
    };
    const now = Math.floor(Date.now() / 1000);
    const adminToken = await signLocalSession(env, { username: 'admin', roles: ['admin'], exp: now + 3600 });
    const directorToken = await signLocalSession(env, { username: 'director', roles: ['director'], school: 'A校', exp: now + 3600 });
    const teacherToken = await signLocalSession(env, { username: 'teacher', roles: ['teacher'], school: 'A校', exp: now + 3600 });
    const expiredToken = await signLocalSession(env, { username: 'old', roles: ['admin'], exp: now - 1 });
    const baseUrl = 'https://schoolsystem.com.cn/sb/rest/v1/system_data';

    let response = await handleSystemDataProxy(makeRequest('GET', baseUrl, '', undefined), env, new URL(baseUrl));
    assert.strictEqual(response.status, 401, 'GET without token should require app session');

    const proxyEnv = {
      APP_SESSION_SECRET: 'test-secret',
      CLOUD_SYSTEM_DATA_MODE: 'supabase',
      SUPABASE_ORIGIN: 'https://example.supabase.co',
      SUPABASE_REST_API_KEY: 'anon-key'
    };
    fetchCount = 0;
    response = await handleSystemDataProxy(makeRequest('GET', baseUrl, '', undefined), proxyEnv, new URL(baseUrl));
    assert.strictEqual(response.status, 401, 'proxy-mode GET without token should be blocked before upstream fetch');
    assert.strictEqual(fetchCount, 0, 'unauthenticated proxy-mode requests must not reach upstream');

    response = await handleSystemDataProxy(makeRequest('GET', baseUrl, expiredToken, undefined), env, new URL(baseUrl));
    assert.strictEqual(response.status, 401, 'expired app session should be rejected');

    response = await handleSystemDataProxy(makeRequest('GET', baseUrl, directorToken, undefined), env, new URL(baseUrl));
    assert.strictEqual(response.status, 200, 'authenticated GET should read system_data');
    assert.deepStrictEqual(await json(response), [], 'Phase 2 authenticates reads but does not school-filter packed cohort blobs');

    response = await handleSystemDataProxy(
      makeRequest('POST', baseUrl, teacherToken, { key: 'cohort::2022', content: '{}' }),
      env,
      new URL(baseUrl)
    );
    assert.strictEqual(response.status, 403, 'teacher writes should be blocked');
    assert.strictEqual((await json(response)).error, 'INSUFFICIENT_ROLE');

    response = await handleSystemDataProxy(
      makeRequest('POST', baseUrl, directorToken, { key: 'GLOBAL_CONFIG', content: '{}' }),
      env,
      new URL(baseUrl)
    );
    assert.strictEqual(response.status, 403, 'non-admin generic/global writes should be blocked');
    assert.strictEqual((await json(response)).error, 'OUT_OF_SCOPE');

    response = await handleSystemDataProxy(
      makeRequest('POST', baseUrl, directorToken, { key: 'cohort::2022', content: '{"ok":true}' }),
      env,
      new URL(baseUrl)
    );
    assert.strictEqual(response.status, 201, 'director cohort-scoped write should remain allowed');

    response = await handleSystemDataProxy(
      makeRequest('POST', baseUrl, adminToken, { key: 'GLOBAL_CONFIG', content: '{}' }),
      env,
      new URL(baseUrl)
    );
    assert.strictEqual(response.status, 201, 'admin global writes should remain allowed');

    response = await handleSystemDataProxy(
      makeRequest('DELETE', `${baseUrl}?key=eq.cohort::2022`, teacherToken, undefined),
      env,
      new URL(`${baseUrl}?key=eq.cohort::2022`)
    );
    assert.strictEqual(response.status, 403, 'teacher delete should be blocked');
    assert.strictEqual((await json(response)).error, 'INSUFFICIENT_ROLE');

    response = await handleSystemDataProxy(
      makeRequest('DELETE', `${baseUrl}?key=eq.GLOBAL_CONFIG`, directorToken, undefined),
      env,
      new URL(`${baseUrl}?key=eq.GLOBAL_CONFIG`)
    );
    assert.strictEqual(response.status, 403, 'director global delete should be blocked');
    assert.strictEqual((await json(response)).error, 'OUT_OF_SCOPE');

    response = await handleSystemDataProxy(
      makeRequest('DELETE', `${baseUrl}?key=eq.cohort::2022`, directorToken, undefined),
      env,
      new URL(`${baseUrl}?key=eq.cohort::2022`)
    );
    assert.strictEqual(response.status, 200, 'director cohort delete should remain allowed');

    response = await handleSystemDataProxy(
      makeRequest('DELETE', `${baseUrl}?key=like.cohort%`, directorToken, undefined),
      env,
      new URL(`${baseUrl}?key=like.cohort%`)
    );
    assert.strictEqual(response.status, 400, 'unsupported delete filters should keep existing 400 semantics');
    assert.strictEqual((await json(response)).error, 'SYSTEM_DATA_DELETE_FILTER_MISSING');

    console.log('worker system_data auth tests passed');
  } finally {
    globalThis.fetch = originalFetch;
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
