// Drives the temporary copy Worker: schema -> copy -> verify -> summary.
// Usage: COPY_BASE_URL=https://... COPY_TOKEN=... node scripts/ops/d1-copy/run.mjs [full|delta] [sinceIso]
const base = String(process.env.COPY_BASE_URL || '').replace(/\/+$/, '');
const token = String(process.env.COPY_TOKEN || '');
const mode = process.argv[2] || 'full';
const since = mode === 'delta' ? String(process.argv[3] || '') : '';
const TABLES = ['cloud_system_data', 'cloud_system_data_quarantine'];

if (!base || token.length < 32) {
  console.error('COPY_BASE_URL and COPY_TOKEN (>= 32 chars) are required');
  process.exit(2);
}
if (mode === 'delta' && !since) {
  console.error('delta mode needs an ISO timestamp: node run.mjs delta 2026-11-01T00:00:00Z');
  process.exit(2);
}

async function call(path, params = {}, attempt = 1) {
  const url = `${base}${path}?${new URLSearchParams(params)}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } }).catch((error) => ({ ok: false, status: 0, error }));
  const body = response.status ? await response.json().catch(() => null) : null;
  if (response.status === 200 && body?.ok) return body;
  if (attempt < 5 && (response.status === 0 || response.status >= 500)) {
    await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    return call(path, params, attempt + 1);
  }
  throw new Error(`${path} failed (${response.status}): ${JSON.stringify(body || response.error?.message || '')}`);
}

async function waitUntilReady() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    try { return await call('/summary'); } catch (error) {
      if (attempt === 20) throw error;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

const before = await waitUntilReady();
console.log('source before:', JSON.stringify(before.source));
console.log('destination before:', JSON.stringify(before.destination));
await call('/schema');

for (const table of TABLES) {
  let after = '';
  let copied = 0;
  for (;;) {
    const page = await call('/copy', { table, after, since });
    copied += page.copied;
    after = page.next;
    if (page.done) break;
  }
  console.log(`copied ${copied} rows of ${table}${since ? ` updated after ${since}` : ''}`);
}

let mismatches = [];
for (const table of TABLES) {
  let after = '';
  let checked = 0;
  for (;;) {
    const page = await call('/verify', { table, after });
    checked += page.checked;
    mismatches = mismatches.concat(page.mismatches.map((item) => ({ table, ...item })));
    after = page.next;
    if (page.done) break;
  }
  console.log(`verified ${checked} rows of ${table}`);
}

const after = await call('/summary');
console.log('source after:', JSON.stringify(after.source));
console.log('destination after:', JSON.stringify(after.destination));
const newerInDestination = mismatches.filter((item) => item.reason === 'destination newer');
const blocking = mismatches.filter((item) => item.reason !== 'destination newer');
if (newerInDestination.length) {
  console.log(`${newerInDestination.length} rows are newer in the destination (written after cutover) and were kept`);
}
if (blocking.length) {
  console.error(`${blocking.length} mismatched rows:`, JSON.stringify(blocking.slice(0, 20)));
  process.exit(1);
}
const src = after.source.cloud_system_data;
const dst = after.destination.cloud_system_data;
if (!dst || dst.rows < src.rows) {
  console.error('destination has fewer cloud_system_data rows than source');
  process.exit(1);
}
console.log('copy verified: every source row is present and identical in the destination');
