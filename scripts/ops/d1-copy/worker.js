// Temporary one-off Worker that copies a D1 database into another D1 database
// with bound parameters (so rows larger than D1's 100 KB statement limit copy
// safely) and verifies the result row by row.
//
// Bindings: SRC (old database), DST (new database), COPY_TOKEN (random secret).
// Deployed only for the duration of a migration by
// .github/workflows/d1-copy-cloud-metadata.yml, then deleted.

const TABLES = {
  cloud_system_data: {
    columns: ['key', 'content_text', 'object_key', 'storage_backend', 'kind', 'key_prefix',
      'cohort_id', 'project_key', 'term_id', 'updated_at', 'size_bytes', 'created_at'],
    primaryKey: 'key',
    insert: 'replace'
  },
  cloud_system_data_quarantine: {
    columns: ['key', 'content_text', 'object_key', 'storage_backend', 'kind', 'key_prefix',
      'cohort_id', 'project_key', 'term_id', 'updated_at', 'size_bytes', 'created_at', 'quarantine_note'],
    primaryKey: 'key',
    // No PRIMARY KEY in this table: insert only rows not already present.
    insert: 'ifMissing'
  }
};

// Schema of the destination: cloudflare/d1/001 + 006 (kept in sync by test-d1-copy-worker).
export const DESTINATION_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS cloud_system_data (
    key TEXT PRIMARY KEY,
    content_text TEXT,
    object_key TEXT NOT NULL DEFAULT '',
    storage_backend TEXT NOT NULL DEFAULT 'd1',
    kind TEXT NOT NULL DEFAULT 'generic',
    key_prefix TEXT NOT NULL DEFAULT '',
    cohort_id TEXT NOT NULL DEFAULT '',
    project_key TEXT NOT NULL DEFAULT '',
    term_id TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_cloud_system_data_updated_at ON cloud_system_data(updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cloud_system_data_cohort_updated ON cloud_system_data(cohort_id, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cloud_system_data_kind_updated ON cloud_system_data(kind, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cloud_system_data_key_prefix_updated ON cloud_system_data(key_prefix, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cloud_system_data_cohort_kind_updated ON cloud_system_data(cohort_id, kind, updated_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_cloud_system_data_prefix_cohort_updated ON cloud_system_data(key_prefix, cohort_id, updated_at DESC)',
  `CREATE TABLE IF NOT EXISTS cloud_system_data_quarantine (
    key TEXT, content_text TEXT, object_key TEXT, storage_backend TEXT, kind TEXT, key_prefix TEXT,
    cohort_id TEXT, project_key TEXT, term_id TEXT, updated_at TEXT, size_bytes INTEGER, created_at TEXT,
    quarantine_note TEXT
  )`
];

const MAX_PAGE_ROWS = 25;
const MAX_PAGE_BYTES = 6 * 1024 * 1024;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });
}

async function tableExists(db, table) {
  const row = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").bind(table).first();
  return Boolean(row);
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Reads one page of rows ordered by primary key, bounded by row count and bytes.
// Returns { rows, exhausted }: exhausted is true only when no rows remain after
// this page (a page cut short by the byte budget is NOT the end of the table).
async function readPage(db, table, after, limit, since, maxBytes = MAX_PAGE_BYTES) {
  const spec = TABLES[table];
  const where = [`${spec.primaryKey} > ?`];
  const bindings = [after];
  if (since) {
    where.push('updated_at > ?');
    bindings.push(since);
  }
  const keys = await db.prepare(
    `SELECT ${spec.primaryKey} AS k, LENGTH(CAST(content_text AS BLOB)) AS bytes FROM ${table}
     WHERE ${where.join(' AND ')} ORDER BY ${spec.primaryKey} LIMIT ?`
  ).bind(...bindings, Math.min(limit, MAX_PAGE_ROWS)).all();
  const candidates = keys.results || [];
  const pageLimit = Math.min(limit, MAX_PAGE_ROWS);
  const budget = Math.min(Number(maxBytes) || MAX_PAGE_BYTES, MAX_PAGE_BYTES);
  const selected = [];
  let bytes = 0;
  for (const row of candidates) {
    if (selected.length && bytes + Number(row.bytes || 0) > budget) break;
    selected.push(row.k);
    bytes += Number(row.bytes || 0);
  }
  const exhausted = candidates.length < pageLimit && selected.length === candidates.length;
  if (!selected.length) return { rows: [], exhausted: true };
  const placeholders = selected.map(() => '?').join(', ');
  const rows = await db.prepare(
    `SELECT ${spec.columns.join(', ')} FROM ${table} WHERE ${spec.primaryKey} IN (${placeholders}) ORDER BY ${spec.primaryKey}`
  ).bind(...selected).all();
  return { rows: rows.results || [], exhausted };
}

export async function ensureDestinationSchema(dst) {
  for (const statement of DESTINATION_SCHEMA) await dst.prepare(statement).run();
}

export async function copyPage(src, dst, { table, after = '', limit = MAX_PAGE_ROWS, since = '', maxBytes = MAX_PAGE_BYTES }) {
  const spec = TABLES[table];
  if (!spec) throw new Error(`unknown table ${table}`);
  if (!(await tableExists(src, table))) return { table, copied: 0, done: true, next: after, skipped: true };
  const { rows, exhausted } = await readPage(src, table, after, limit, since, maxBytes);
  if (!rows.length) return { table, copied: 0, done: true, next: after };
  const placeholders = spec.columns.map(() => '?').join(', ');
  const statements = rows.map((row) => {
    if (spec.insert === 'replace') {
      // Upsert, but never overwrite a row the destination already has in a
      // newer version (writes that reached the new database after cutover).
      const updates = spec.columns.filter((column) => column !== spec.primaryKey)
        .map((column) => `${column} = excluded.${column}`).join(', ');
      return dst.prepare(`INSERT INTO ${table} (${spec.columns.join(', ')}) VALUES (${placeholders})
        ON CONFLICT(${spec.primaryKey}) DO UPDATE SET ${updates}
        WHERE excluded.updated_at > ${table}.updated_at`)
        .bind(...spec.columns.map((column) => row[column] ?? null));
    }
    return dst.prepare(`INSERT INTO ${table} (${spec.columns.join(', ')}) SELECT ${placeholders}
      WHERE NOT EXISTS (SELECT 1 FROM ${table} WHERE key = ? AND IFNULL(updated_at, '') = IFNULL(?, ''))`)
      .bind(...spec.columns.map((column) => row[column] ?? null), row.key, row.updated_at ?? null);
  });
  await dst.batch(statements);
  return { table, copied: rows.length, done: exhausted, next: rows[rows.length - 1][spec.primaryKey] };
}

// Hashes every row (all columns) of one page in both databases and returns
// mismatches, so verification never trusts counts alone.
export async function verifyPage(src, dst, { table, after = '', limit = MAX_PAGE_ROWS, maxBytes = MAX_PAGE_BYTES }) {
  const spec = TABLES[table];
  if (!(await tableExists(src, table))) return { table, checked: 0, done: true, next: after, mismatches: [], skipped: true };
  const { rows: sourceRows, exhausted } = await readPage(src, table, after, limit, '', maxBytes);
  if (!sourceRows.length) return { table, checked: 0, done: true, next: after, mismatches: [] };
  const keys = sourceRows.map((row) => row[spec.primaryKey]);
  const placeholders = keys.map(() => '?').join(', ');
  const destinationRows = (await dst.prepare(
    `SELECT ${spec.columns.join(', ')} FROM ${table} WHERE ${spec.primaryKey} IN (${placeholders})`
  ).bind(...keys).all()).results || [];
  const destinationByKey = new Map(destinationRows.map((row) => [row[spec.primaryKey], row]));
  const mismatches = [];
  for (const row of sourceRows) {
    const other = destinationByKey.get(row[spec.primaryKey]);
    const left = await sha256Hex(JSON.stringify(spec.columns.map((column) => row[column] ?? null)));
    const right = other ? await sha256Hex(JSON.stringify(spec.columns.map((column) => other[column] ?? null))) : 'missing';
    if (left === right) continue;
    if (!other) mismatches.push({ key: row[spec.primaryKey], reason: 'missing in destination' });
    else if (String(other.updated_at || '') > String(row.updated_at || '')) mismatches.push({ key: row[spec.primaryKey], reason: 'destination newer' });
    else mismatches.push({ key: row[spec.primaryKey], reason: 'content differs' });
  }
  return { table, checked: sourceRows.length, done: exhausted, next: keys[keys.length - 1], mismatches };
}

export async function summarize(db) {
  const out = {};
  for (const table of Object.keys(TABLES)) {
    if (!(await tableExists(db, table))) { out[table] = null; continue; }
    out[table] = await db.prepare(
      `SELECT COUNT(*) AS rows, IFNULL(SUM(LENGTH(CAST(content_text AS BLOB))), 0) AS bytes, MAX(updated_at) AS latest FROM ${table}`
    ).first();
  }
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const expected = String(env.COPY_TOKEN || '');
    const provided = String(request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!expected || expected.length < 32 || provided !== expected) return json(401, { ok: false, error: 'unauthorized' });
    if (!env.SRC || !env.DST) return json(500, { ok: false, error: 'SRC/DST bindings missing' });
    const params = Object.fromEntries(url.searchParams.entries());
    try {
      if (url.pathname === '/schema') {
        await ensureDestinationSchema(env.DST);
        return json(200, { ok: true });
      }
      if (url.pathname === '/summary') {
        return json(200, { ok: true, source: await summarize(env.SRC), destination: await summarize(env.DST) });
      }
      if (url.pathname === '/copy') {
        return json(200, { ok: true, ...(await copyPage(env.SRC, env.DST, { table: params.table, after: params.after || '', limit: Number(params.limit) || MAX_PAGE_ROWS, since: params.since || '', maxBytes: Number(params.maxBytes) || MAX_PAGE_BYTES })) });
      }
      if (url.pathname === '/verify') {
        return json(200, { ok: true, ...(await verifyPage(env.SRC, env.DST, { table: params.table, after: params.after || '', limit: Number(params.limit) || MAX_PAGE_ROWS, maxBytes: Number(params.maxBytes) || MAX_PAGE_BYTES })) });
      }
      return json(404, { ok: false, error: 'not found' });
    } catch (error) {
      return json(500, { ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }
};
