const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');
const LZString = require(path.join(root, 'public/assets/vendor/lz-string/lz-string.min.js'));

function prepareEsmWorkerModules() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-school-redaction-'));
  const srcDir = path.join(root, 'src');
  for (const name of fs.readdirSync(srcDir)) {
    if (!name.endsWith('.js')) continue;
    const source = fs.readFileSync(path.join(srcDir, name), 'utf8')
      .replace(/from '(\.\/[^']+)\.js'/g, "from '$1.mjs'");
    fs.writeFileSync(path.join(tempDir, name.replace(/\.js$/, '.mjs')), source);
  }
  return tempDir;
}

function squash(text) {
  return String(text || '')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\s+/g, '');
}

function extractBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.ok(start >= 0, `missing ${startMarker}`);
  const end = source.indexOf(endMarker, start);
  assert.ok(end > start, `missing end of ${startMarker}`);
  return source.slice(start, end + endMarker.length);
}

// rows-v1 tuple: [school, class, name, id, total, scores, totalRanks, subjectRanks, uuid, status, extras, totalTScore]
function packedRow(school, cls, name, id, total, extras = null) {
  return [school, cls, name, id, total, [total - 10, 10], [1, 2, 3, 4], [[1, 1, 1, 1], null], `uuid-${id}`, null, extras, 512];
}

function buildPayload() {
  return {
    CURRENT_COHORT_ID: '2024',
    SUBJECTS: ['语文', '数学'],
    SCHOOL_ALIAS_SETTINGS: [{ canonical: 'B校', alias: 'B学校' }],
    RAW_DATA: {
      __packedRows: 'rows-v1',
      subjects: ['语文', '数学'],
      tScoreScale: 10,
      rows: [
        packedRow('东平实验中学', '701', '张三', 'S001', 600, { tScores: [510, 490], examRoom: '12', phone: '13800000000' }),
        packedRow('B校', '702', '李四', 'S002', 580, { tScores: [500, 480], examRoom: '08', blankScoreSubjects: ['数学'] }),
        packedRow('B学校', '703', '王五', 'S003', 570, null)
      ]
    },
    SCHOOLS: {
      B校: {
        avg: 575,
        students: [{ school: 'B校', class: '702', name: '李四', id: 'S002', total: 580, scores: { 语文: 570 }, gender: '女' }]
      }
    },
    TEACHER_MAP: [{ school: 'B校', name: '赵老师', subject: '语文', classes: '702' }]
  };
}

async function run() {
  // 1. The Worker LZString copy must stay byte-identical to the vendored browser codec.
  const vendored = read('public/assets/vendor/lz-string/lz-string.min.js');
  const workerCopy = read('src/worker-lz-string.js');
  const vendoredCore = vendored.slice(0, vendored.indexOf(';"function"==typeof define') + 1);
  assert.ok(vendoredCore.length > 1000 && workerCopy.includes(vendoredCore), 'src/worker-lz-string.js must embed the vendored LZString codec unchanged');
  assert.ok(/export default LZString;\s*$/.test(workerCopy), 'worker LZString copy should be an ES module');

  // 2. Server-side school equivalence must mirror the client normalizer.
  const clientNormalizer = read('public/assets/js/school-normalization-runtime.js');
  const serverRedaction = read('src/worker-school-redaction.js');
  assert.strictEqual(
    squash(extractBlock(serverRedaction, 'const SCHOOL_ALIAS_GROUPS = [', '\n];')),
    squash(extractBlock(clientNormalizer, 'const SCHOOL_ALIAS_GROUPS = [', '\n];')),
    'worker SCHOOL_ALIAS_GROUPS must match school-normalization-runtime.js'
  );
  assert.strictEqual(
    squash(extractBlock(serverRedaction, 'const SCHOOL_ORG_SUFFIX_RULES = [', '\n];')),
    squash(extractBlock(clientNormalizer, 'const SCHOOL_ORG_SUFFIX_RULES = [', '\n];')),
    'worker SCHOOL_ORG_SUFFIX_RULES must match school-normalization-runtime.js'
  );
  const replaceChain = (source) => squash((extractBlock(source, 'function computeSchoolBaseKey(name) {', '\n}').match(/\.replace\([^\n]+\)/g) || []).join(''));
  assert.ok(replaceChain(clientNormalizer).length > 100, 'client computeSchoolBaseKey replace chain should be found');
  assert.strictEqual(replaceChain(serverRedaction), replaceChain(clientNormalizer), 'worker computeSchoolBaseKey must match the client');

  const tempDir = prepareEsmWorkerModules();
  try {
    const redaction = await import(pathToFileURL(path.join(tempDir, 'worker-school-redaction.mjs')).href);
    const { handleSystemDataProxy } = await import(pathToFileURL(path.join(tempDir, 'worker-system-data.mjs')).href);
    const { signLocalSession } = await import(pathToFileURL(path.join(tempDir, 'worker-crypto.mjs')).href);
    const env = { APP_SESSION_SECRET: 'test-secret', CLOUD_SYSTEM_DATA_MODE: 'primary' };

    // 3. The synchronous HMAC must agree with WebCrypto (including multi-block and long-key inputs).
    for (const [secret, message] of [['test-secret', 'abc'], ['k', ''], ['k'.repeat(100), '学生'.repeat(80)], ['x', 'm'.repeat(55)], ['x', 'm'.repeat(56)], ['x', 'm'.repeat(64)]]) {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const expected = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))).toString('hex');
      assert.strictEqual(redaction.createHmacSha256Hex(secret)(message), expected, `HMAC mismatch for ${secret.length}/${message.length}`);
    }

    // 4. Scope resolution.
    assert.strictEqual(redaction.resolveSchoolRedactionScope({ roles: ['admin'], school: 'A' }, env), null, 'admins receive full archives');
    assert.deepStrictEqual(redaction.resolveSchoolRedactionScope({ roles: ['director'], school: ' 东平县实验中学 ' }, env), { school: '东平县实验中学' });
    assert.strictEqual(redaction.resolveSchoolRedactionScope({ roles: ['director'], school: 'A' }, { ...env, SYSTEM_DATA_SCHOOL_REDACTION: 'off' }), null, 'off switch disables redaction');
    assert.notStrictEqual(
      await redaction.getSchoolRedactionCacheTag({ school: 'A' }, env),
      await redaction.getSchoolRedactionCacheTag({ school: 'B' }, env),
      'cache tags must differ per school'
    );
    assert.strictEqual(await redaction.getSchoolRedactionCacheTag(null, env), 'full');
    assert.ok(!(await redaction.getSchoolRedactionCacheTag({ school: '东平县实验中学' }, env)).includes('东平'), 'cache tag must not expose the school name');

    // 5. Packed archive redaction.
    const scope = { school: '东平县实验中学' };
    const packed = `LZB64|${LZString.compressToBase64(JSON.stringify(buildPayload()))}`;
    const output = await redaction.redactSystemDataContent(packed, scope, env);
    assert.ok(!output.startsWith('LZB64|'), 'redacted archives are returned as plain JSON');
    const payload = JSON.parse(output);
    const [own, other, aliasOther] = payload.RAW_DATA.rows;
    assert.deepStrictEqual(own, buildPayload().RAW_DATA.rows[0], 'own-school rows (matched through the built-in alias) stay untouched');
    assert.ok(/^匿名[0-9a-f]{10}$/.test(other[2]) && other[2] !== '李四', 'other-school names are pseudonymised');
    assert.strictEqual(other[3], null, 'other-school student ids are dropped');
    assert.ok(/^anon-[0-9a-f]{16}$/.test(other[8]), 'other-school uuids are pseudonymised');
    assert.deepStrictEqual(other[10], { tScores: [500, 480], blankScoreSubjects: ['数学'] }, 'free-text extras are dropped, numeric extras kept');
    assert.deepStrictEqual(other.slice(4, 8), buildPayload().RAW_DATA.rows[1].slice(4, 8), 'scores and ranks stay intact for cross-school analytics');
    assert.strictEqual(other[0], 'B校');
    assert.strictEqual(other[1], '702', 'class is kept so class-level comparisons still work');
    assert.ok(/^匿名/.test(aliasOther[2]), 'custom alias rows from SCHOOL_ALIAS_SETTINGS are still other schools');
    const plainStudent = payload.SCHOOLS['B校'].students[0];
    assert.ok(/^匿名/.test(plainStudent.name) && !('id' in plainStudent) && !('gender' in plainStudent), 'plain student rows are redacted too');
    assert.strictEqual(plainStudent.total, 580);
    assert.deepStrictEqual(payload.TEACHER_MAP, buildPayload().TEACHER_MAP, 'non-student records are left alone');
    assert.deepStrictEqual(payload[redaction.SCHOOL_SCOPE_MARKER], { version: 1, school: '东平县实验中学', redactedRows: 3 });
    assert.ok(!output.includes('李四') && !output.includes('王五') && !output.includes('S002'), 'no other-school identity survives');
    assert.ok(output.includes('张三'), 'own-school identity survives');

    const again = JSON.parse(await redaction.redactSystemDataContent(packed, scope, env));
    assert.strictEqual(again.RAW_DATA.rows[1][2], other[2], 'pseudonyms are stable across reads');
    assert.strictEqual(again.SCHOOLS['B校'].students[0].name, other[2], 'the same student gets the same pseudonym in every structure');
    const otherSecret = JSON.parse(await redaction.redactSystemDataContent(packed, scope, { APP_SESSION_SECRET: 'other' }));
    assert.notStrictEqual(otherSecret.RAW_DATA.rows[1][2], other[2], 'pseudonyms are keyed by the deployment secret');

    // 6. Pass-through and fail-closed behaviour.
    const ownOnly = `LZB64|${LZString.compressToBase64(JSON.stringify({ RAW_DATA: { __packedRows: 'rows-v1', subjects: [], rows: [packedRow('东平县实验中学', '701', '张三', 'S1', 1)] } }))}`;
    assert.strictEqual(await redaction.redactSystemDataContent(ownOnly, scope, env), ownOnly, 'archives without other schools stay packed and unchanged');
    assert.strictEqual(await redaction.redactSystemDataContent(packed, null, env), packed, 'no scope means no change');
    assert.strictEqual(await redaction.redactSystemDataContent('LZB64|@@not-base64@@', scope, env), '', 'undecodable packed content is withheld');
    assert.strictEqual(await redaction.redactSystemDataContent('plain-text', scope, env), 'plain-text', 'opaque non-JSON strings pass through');
    const utf16 = `LZ|${LZString.compressToUTF16(JSON.stringify([{ school: 'B校', name: '李四', total: 1, scores: {} }]))}`;
    assert.ok(/^\[\{"school":"B校","name":"匿名/.test(await redaction.redactSystemDataContent(utf16, scope, env)), 'LZ| UTF-16 archives are redacted too');
    const noSchool = JSON.parse(await redaction.redactSystemDataContent(packed, { school: '' }, env));
    assert.ok(noSchool.RAW_DATA.rows.every((row) => /^匿名/.test(row[2])), 'an unbound non-admin gets every school redacted');

    // 7. End-to-end through the system_data handler.
    const rows = new Map([['cohort::2024', { key: 'cohort::2024', content_text: packed, object_key: '', updated_at: '2026-11-01T00:00:00Z', created_at: '2026-11-01T00:00:00Z', size_bytes: packed.length }]]);
    const db = {
      prepare() {
        return { bind() { return this; }, async all() { return { results: Array.from(rows.values()).map((row) => ({ ...row })) }; } };
      }
    };
    const handlerEnv = { ...env, CLOUD_SYSTEM_DATA_DB: db };
    const now = Math.floor(Date.now() / 1000);
    const adminToken = await signLocalSession(handlerEnv, { username: 'admin', roles: ['admin'], exp: now + 3600 });
    const directorToken = await signLocalSession(handlerEnv, { username: 'director', roles: ['director'], school: '东平县实验中学', exp: now + 3600 });
    const url = 'https://schoolsystem.com.cn/api/system-data?select=key,content,updated_at&key=eq.cohort::2024';
    const get = (token) => handleSystemDataProxy(new Request(url, { headers: { Authorization: `Bearer ${token}` } }), handlerEnv, new URL(url));

    let response = await get(adminToken);
    assert.strictEqual(response.status, 200);
    assert.strictEqual((await response.json())[0].content, packed, 'admin GET returns the stored archive');
    response = await get(directorToken);
    assert.strictEqual(response.status, 200);
    const directorContent = (await response.json())[0].content;
    assert.ok(directorContent.includes('张三') && !directorContent.includes('李四'), 'director GET returns the school-scoped archive');

    // 8. Wiring contracts.
    const systemData = read('src/worker-system-data.js');
    assert.ok(/getSystemDataEdgeCacheKey\(request, url, await getSchoolRedactionCacheTag\(scope, env\)\)/.test(systemData), 'edge cache entries must be keyed by redaction scope');
    assert.ok(/cacheUrl\.searchParams\.set\('__scope', scopeTag\)/.test(systemData));
    assert.ok(/handleSystemDataBootstrap\(request, env, resolveSchoolRedactionScope\(auth\.session, env\)\)/.test(systemData), 'bootstrap must apply the caller scope');
    assert.ok(/redactSystemDataContent\(storedShardContent, scope, env\)/.test(systemData) && /redactSystemDataContent\(storedWorkspaceContent, scope, env\)/.test(systemData), 'bootstrap must redact both workspace and shard');
    assert.ok(/proxySystemDataReadToSupabase\(request, env, url, readScope\)/.test(systemData), 'Supabase proxy reads must apply the caller scope');
    assert.ok(/if \(!requestedSizeBytes && !\(scope && requestedContent\)\)/.test(systemData), 'scoped proxy reads must not stream upstream content unredacted');
    assert.ok(/payload && payload\.__SCHOOL_SCOPE_REDACTED\) throw new Error\('SCHOOL_SCOPE_REDACTED_PAYLOAD'\)/.test(read('public/assets/js/cloud.js')), 'cloud.js must refuse to upload redacted archives');
    assert.ok(/value && value\.__SCHOOL_SCOPE_REDACTED\) throw new Error\('SCHOOL_SCOPE_REDACTED_PAYLOAD'\)/.test(read('public/assets/js/data-cloud-runtime.js')), 'data-cloud-runtime must refuse to upload redacted archives');
    assert.ok(/"SYSTEM_DATA_SCHOOL_REDACTION": "on"/.test(read('wrangler.jsonc')), 'wrangler.jsonc should declare the redaction switch');

    console.log('system_data school redaction tests passed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
