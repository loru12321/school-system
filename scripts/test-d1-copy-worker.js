// Behavioural test for the temporary D1 copy Worker used to move
// school-system-cloud-metadata to an APAC database (scripts/ops/d1-copy).
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');

function createD1(schemaFiles = []) {
  const sqlite = new DatabaseSync(':memory:');
  schemaFiles.forEach((file) => sqlite.exec(fs.readFileSync(path.join(root, file), 'utf8')));
  const statement = (sql, bindings = []) => ({
    bind(...values) { return statement(sql, values); },
    async all() { return { results: sqlite.prepare(sql).all(...bindings) }; },
    async first() { return sqlite.prepare(sql).get(...bindings) || null; },
    async run() { const info = sqlite.prepare(sql).run(...bindings); return { success: true, meta: { changes: Number(info.changes) } }; }
  });
  return {
    sqlite,
    prepare(sql) { return statement(sql); },
    async batch(list) { sqlite.exec('BEGIN'); try { const out = []; for (const item of list) out.push(await item.run()); sqlite.exec('COMMIT'); return out; } catch (e) { sqlite.exec('ROLLBACK'); throw e; } }
  };
}

async function run() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'd1-copy-'));
  try {
    const target = path.join(tempDir, 'worker.mjs');
    fs.copyFileSync(path.join(root, 'scripts/ops/d1-copy/worker.js'), target);
    const mod = await import(pathToFileURL(target).href);
    const worker = mod.default;

    // Destination schema must match the numbered migrations for this table.
    const reference = createD1(['cloudflare/d1/001_cloud_system_data.sql', 'cloudflare/d1/006_cloud_system_data_restore_indexes.sql']);
    const copied = createD1();
    await mod.ensureDestinationSchema(copied);
    const shape = (db) => db.sqlite.prepare("SELECT name FROM pragma_table_info('cloud_system_data') ORDER BY cid").all().map((r) => r.name).join(',');
    const indexes = (db) => db.sqlite.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='cloud_system_data' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name).join(',');
    assert.strictEqual(shape(copied), shape(reference), 'destination columns must match cloudflare/d1/001');
    assert.strictEqual(indexes(copied), indexes(reference), 'destination indexes must match cloudflare/d1/001 + 006');

    const src = createD1(['cloudflare/d1/001_cloud_system_data.sql']);
    const dst = createD1();
    const insert = src.sqlite.prepare('INSERT INTO cloud_system_data (key, content_text, kind, cohort_id, updated_at, size_bytes) VALUES (?, ?, ?, ?, ?, ?)');
    const big = 'LZB64|' + '考'.repeat(150000); // ~450 KB, far above the 100 KB statement limit
    insert.run('2022级-9年级-2025-2026-下学期-二模-2026-05-27', big, 'exam', '2022', '2026-07-29T03:08:13.581Z', Buffer.byteLength(big));
    for (let i = 0; i < 60; i += 1) insert.run(`STUDENT_HISTORY_V1_${String(i).padStart(3, '0')}`, `{"i":${i}}`, 'generic', '', `2026-07-${String(1 + (i % 28)).padStart(2, '0')}T00:00:00.000Z`, 8);
    insert.run("odd'key?\"", 'x', 'generic', '', '2026-07-01T00:00:00.000Z', 1);
    src.sqlite.exec("CREATE TABLE cloud_system_data_quarantine AS SELECT *, 'note' AS quarantine_note FROM cloud_system_data WHERE key LIKE 'odd%'");

    const token = 'x'.repeat(40);
    const env = { SRC: src, DST: dst, COPY_TOKEN: token };
    const call = async (pathname, params = {}, auth = token) => {
      const response = await worker.fetch(new Request(`https://copy.example${pathname}?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${auth}` } }), env);
      return { status: response.status, body: await response.json() };
    };

    assert.strictEqual((await call('/summary', {}, 'wrong-token-wrong-token-wrong-token')).status, 401, 'requests without the token are rejected');
    assert.strictEqual((await worker.fetch(new Request('https://copy.example/summary'), { ...env, COPY_TOKEN: 'short' })).status, 401, 'a short token is never accepted');

    assert.strictEqual((await call('/schema')).status, 200);
    const pump = async (pathname, table, extra = {}) => {
      let after = ''; let total = 0; let mismatches = [];
      for (;;) {
        const { body } = await call(pathname, { table, after, ...extra });
        assert.ok(body.ok, JSON.stringify(body));
        total += body.copied ?? body.checked; after = body.next;
        mismatches = mismatches.concat(body.mismatches || []);
        if (body.done) return { total, mismatches };
      }
    };

    assert.strictEqual((await pump('/copy', 'cloud_system_data')).total, 62);
    assert.strictEqual((await pump('/copy', 'cloud_system_data_quarantine')).total, 1);
    const verified = await pump('/verify', 'cloud_system_data');
    assert.strictEqual(verified.total, 62);
    assert.deepStrictEqual(verified.mismatches, [], 'every row must be identical after copy');
    assert.strictEqual(dst.sqlite.prepare("SELECT content_text FROM cloud_system_data WHERE kind='exam'").get().content_text, big, 'rows above 100 KB copy byte-for-byte');

    // Re-running the copy is idempotent (no duplicate quarantine rows).
    await pump('/copy', 'cloud_system_data_quarantine');
    assert.strictEqual(dst.sqlite.prepare('SELECT COUNT(*) AS n FROM cloud_system_data_quarantine').get().n, 1);

    // Delta: only rows updated after the timestamp are copied; verify catches drift.
    src.sqlite.prepare("UPDATE cloud_system_data SET content_text = 'changed', updated_at = '2026-11-01T00:00:00.000Z' WHERE key = 'STUDENT_HISTORY_V1_007'").run();
    const drift = await pump('/verify', 'cloud_system_data');
    assert.deepStrictEqual(drift.mismatches.map((m) => m.key), ['STUDENT_HISTORY_V1_007'], 'verify must report rows that changed after the copy');
    assert.strictEqual((await pump('/copy', 'cloud_system_data', { since: '2026-10-31T00:00:00.000Z' })).total, 1, 'delta copies only newer rows');
    assert.deepStrictEqual((await pump('/verify', 'cloud_system_data')).mismatches, [], 'delta copy resolves the drift');

    // A row written to the destination after cutover must survive a later delta copy.
    dst.sqlite.prepare("UPDATE cloud_system_data SET content_text = 'written-after-cutover', updated_at = '2026-12-01T00:00:00.000Z' WHERE key = 'STUDENT_HISTORY_V1_008'").run();
    src.sqlite.prepare("UPDATE cloud_system_data SET content_text = 'late-old-write', updated_at = '2026-11-15T00:00:00.000Z' WHERE key = 'STUDENT_HISTORY_V1_008'").run();
    await pump('/copy', 'cloud_system_data', { since: '2026-11-10T00:00:00.000Z' });
    assert.strictEqual(dst.sqlite.prepare("SELECT content_text FROM cloud_system_data WHERE key = 'STUDENT_HISTORY_V1_008'").get().content_text, 'written-after-cutover', 'delta copy never overwrites a newer destination row');
    const newer = await pump('/verify', 'cloud_system_data');
    assert.deepStrictEqual(newer.mismatches, [{ key: 'STUDENT_HISTORY_V1_008', reason: 'destination newer' }], 'verify classifies newer destination rows');
    src.sqlite.prepare("UPDATE cloud_system_data SET content_text = 'written-after-cutover', updated_at = '2026-12-01T00:00:00.000Z' WHERE key = 'STUDENT_HISTORY_V1_008'").run();

    // A page cut short by the byte budget must not end the copy early.
    const src2 = createD1(['cloudflare/d1/001_cloud_system_data.sql']);
    const dst2 = createD1();
    const bulky = 'B'.repeat(5000);
    for (let i = 0; i < 10; i += 1) src2.sqlite.prepare('INSERT INTO cloud_system_data (key, content_text, updated_at) VALUES (?, ?, ?)').run(`k${i}`, bulky, '2026-07-01T00:00:00.000Z');
    await mod.ensureDestinationSchema(dst2);
    let after2 = ''; let pages = 0;
    for (;;) {
      const page = await mod.copyPage(src2, dst2, { table: 'cloud_system_data', after: after2, maxBytes: 12000 });
      pages += 1; after2 = page.next;
      if (page.done) break;
    }
    assert.strictEqual(dst2.sqlite.prepare('SELECT COUNT(*) AS n FROM cloud_system_data').get().n, 10, 'byte-limited pages must still copy every row');
    assert.ok(pages >= 5, 'small byte budget should split the copy into several pages');
    let verifyAfter = ''; let verified2 = 0;
    for (;;) {
      const page = await mod.verifyPage(src2, dst2, { table: 'cloud_system_data', after: verifyAfter, maxBytes: 12000 });
      verified2 += page.checked; verifyAfter = page.next;
      assert.deepStrictEqual(page.mismatches, []);
      if (page.done) break;
    }
    assert.strictEqual(verified2, 10, 'byte-limited verification must check every row');

    const summary = (await call('/summary')).body;
    assert.strictEqual(summary.source.cloud_system_data.rows, summary.destination.cloud_system_data.rows);
    assert.strictEqual(summary.source.cloud_system_data.bytes, summary.destination.cloud_system_data.bytes);

    console.log('d1 copy worker tests passed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
}

run().catch((error) => { console.error(error); process.exit(1); });
