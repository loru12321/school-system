const crypto = require('crypto');

const DEFAULT_SOURCE_SUPABASE_URL = 'https://okwcciujnfvobbwaydiv.supabase.co';
const DEFAULT_TARGET_BASE_URL = 'https://school-system.hkakjiweu.workers.dev';
const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_EXPECTED_BACKEND = 'hybrid,d1';

function normalizeBaseUrl(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.min(Math.floor(parsed), 1000);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(`Invalid JSON response (${response.status}): ${text.slice(0, 300)}`);
  }
}

function normalizeRow(row) {
  return {
    key: String(row?.key || '').trim(),
    content: typeof row?.content === 'string' ? row.content : '',
    updated_at: String(row?.updated_at || '').trim(),
    created_at: String(row?.created_at || '').trim()
  };
}

function rowDigest(row) {
  const normalized = normalizeRow(row);
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex');
}

async function fetchSourceBatch(sourceUrl, sourceKey, offset, batchSize) {
  const url = `${sourceUrl}/rest/v1/system_data?select=key,content,created_at,updated_at&order=key.asc&limit=${batchSize}&offset=${offset}`;
  const response = await fetch(url, {
    headers: {
      apikey: sourceKey,
      Authorization: `Bearer ${sourceKey}`,
      Accept: 'application/json'
    }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Source fetch failed (${response.status}): ${detail.slice(0, 400)}`);
  }
  const data = await readJson(response);
  return Array.isArray(data) ? data.map(normalizeRow).filter((row) => row.key) : [];
}

async function fetchTargetBatch(targetBaseUrl, offset, batchSize) {
  const url = `${targetBaseUrl}/api/system-data?select=key,content,created_at,updated_at&order=key.asc&limit=${batchSize}&offset=${offset}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Target fetch failed (${response.status}): ${detail.slice(0, 400)}`);
  }
  const data = await readJson(response);
  return Array.isArray(data) ? data.map(normalizeRow).filter((row) => row.key) : [];
}

async function fetchHealth(targetBaseUrl) {
  const response = await fetch(`${targetBaseUrl}/api/health`, {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Target health failed (${response.status}): ${detail.slice(0, 400)}`);
  }
  return readJson(response);
}

async function collectRows(fetchBatch, batchSize) {
  const rows = [];
  let offset = 0;
  while (true) {
    const batch = await fetchBatch(offset, batchSize);
    rows.push(...batch);
    if (batch.length < batchSize) break;
    offset += batch.length;
  }
  rows.sort((left, right) => left.key.localeCompare(right.key));
  return rows;
}

function summarizeRows(rows) {
  const digest = crypto.createHash('sha256');
  const keyDigest = crypto.createHash('sha256');
  for (const row of rows) {
    digest.update(`${row.key}\0${rowDigest(row)}\n`);
    keyDigest.update(`${row.key}\n`);
  }
  return {
    count: rows.length,
    firstKey: rows[0]?.key || '',
    lastKey: rows[rows.length - 1]?.key || '',
    keySha256: keyDigest.digest('hex'),
    contentSha256: digest.digest('hex')
  };
}

function diffRows(sourceRows, targetRows, sampleSize) {
  const targetByKey = new Map(targetRows.map((row) => [row.key, rowDigest(row)]));
  const sourceByKey = new Map(sourceRows.map((row) => [row.key, rowDigest(row)]));
  const missingInTarget = [];
  const extraInTarget = [];
  const contentMismatch = [];

  for (const row of sourceRows) {
    const targetDigest = targetByKey.get(row.key);
    if (!targetDigest) {
      missingInTarget.push(row.key);
    } else if (targetDigest !== sourceByKey.get(row.key)) {
      contentMismatch.push(row.key);
    }
  }

  for (const row of targetRows) {
    if (!sourceByKey.has(row.key)) extraInTarget.push(row.key);
  }

  return {
    missingInTarget: missingInTarget.slice(0, sampleSize),
    extraInTarget: extraInTarget.slice(0, sampleSize),
    contentMismatch: contentMismatch.slice(0, sampleSize),
    missingInTargetCount: missingInTarget.length,
    extraInTargetCount: extraInTarget.length,
    contentMismatchCount: contentMismatch.length
  };
}

async function main() {
  const sourceUrl = normalizeBaseUrl(process.env.SOURCE_SUPABASE_URL || DEFAULT_SOURCE_SUPABASE_URL);
  const sourceKey = String(process.env.SOURCE_SUPABASE_KEY || '').trim();
  const targetBaseUrl = normalizeBaseUrl(process.env.TARGET_BASE_URL || DEFAULT_TARGET_BASE_URL);
  const batchSize = toNumber(process.env.BATCH_SIZE || DEFAULT_BATCH_SIZE, DEFAULT_BATCH_SIZE);
  const sampleSize = toNumber(process.env.DIFF_SAMPLE_SIZE || 20, 20);
  const expectedBackends = String(process.env.EXPECT_TARGET_BACKEND || DEFAULT_EXPECTED_BACKEND)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!sourceUrl || !sourceKey || !targetBaseUrl) {
    throw new Error('SOURCE_SUPABASE_URL, SOURCE_SUPABASE_KEY, TARGET_BASE_URL are required');
  }

  const health = await fetchHealth(targetBaseUrl);
  const backend = String(health?.cloudSystemDataBackend || '').trim();
  if (!health?.cloudSystemDataReady) {
    throw new Error(`Target system_data backend is not ready: ${JSON.stringify(health)}`);
  }
  if (expectedBackends.length && !expectedBackends.includes(backend)) {
    throw new Error(`Target backend ${backend || '(empty)'} is not an allowed cutover backend (${expectedBackends.join(', ')})`);
  }

  const sourceRows = await collectRows(
    (offset, size) => fetchSourceBatch(sourceUrl, sourceKey, offset, size),
    batchSize
  );
  const targetRows = await collectRows(
    (offset, size) => fetchTargetBatch(targetBaseUrl, offset, size),
    batchSize
  );

  const source = summarizeRows(sourceRows);
  const target = summarizeRows(targetRows);
  const diff = diffRows(sourceRows, targetRows, sampleSize);
  const ok = source.count === target.count
    && source.keySha256 === target.keySha256
    && source.contentSha256 === target.contentSha256
    && diff.missingInTargetCount === 0
    && diff.extraInTargetCount === 0
    && diff.contentMismatchCount === 0;

  const report = {
    ok,
    targetBaseUrl,
    targetBackend: backend,
    targetMode: health?.cloudSystemDataMode || '',
    source,
    target,
    diff
  };

  console.log(JSON.stringify(report, null, 2));
  if (!ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
