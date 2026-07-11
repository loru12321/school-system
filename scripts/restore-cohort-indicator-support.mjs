import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const LZString = require('../public/assets/vendor/lz-string/lz-string.min.js');

const ORIGIN = process.env.SCHOOL_SYSTEM_ORIGIN || 'https://schoolsystem.com.cn';
const API = `${ORIGIN}/api/system-data`;
const WRITE = process.argv.includes('--write');
const COHORT_ID = '2022';
const CURRENT_KEYS = [
  'cohort::2022',
  '2022级-9年级-2025-2026-下学期-二模-2026-05-27'
];
const BACKUP_KEYS = [
  'BACKUP_cohort::2022_pre_split_2026-06-27T15-45-53-441Z',
  'BACKUP_cohort::2022_pre_split_20260627234841'
];

function parsePayload(content) {
  let raw = content;
  if (typeof raw === 'string' && raw.startsWith('LZB64|')) raw = LZString.decompressFromBase64(raw.slice(6));
  else if (typeof raw === 'string' && raw.startsWith('LZ|')) raw = LZString.decompressFromUTF16(raw.slice(3));
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function packLike(originalContent, payload) {
  const json = JSON.stringify(payload);
  if (String(originalContent || '').startsWith('LZ|')) return `LZ|${LZString.compressToUTF16(json)}`;
  if (String(originalContent || '').startsWith('LZB64|')) return `LZB64|${LZString.compressToBase64(json)}`;
  return json;
}

function stableHashWithoutSupport(payload) {
  const copy = JSON.parse(JSON.stringify(payload || {}));
  delete copy.TARGETS;
  delete copy.INDICATOR_PARAMS;
  return createHash('sha256').update(JSON.stringify(copy)).digest('hex');
}

function rowCount(payload) {
  if (Array.isArray(payload?.RAW_DATA)) return payload.RAW_DATA.length;
  if (Array.isArray(payload?.RAW_DATA?.rows)) return payload.RAW_DATA.rows.length;
  return 0;
}

async function login() {
  const response = await fetch(`${ORIGIN}/api/gateway`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      action: 'login',
      payload: {
        username: process.env.SMOKE_USER || 'admin',
        password: process.env.SMOKE_PASS || 'admin123'
      }
    })
  });
  const data = await response.json();
  if (!response.ok || !data?.token) throw new Error(`login failed: ${response.status} ${JSON.stringify(data).slice(0, 300)}`);
  return data.token;
}

async function fetchExact(token, key) {
  const url = new URL(API);
  url.searchParams.set('select', 'key,content,updated_at,size_bytes');
  url.searchParams.set('key', `eq.${key}`);
  url.searchParams.set('limit', '1');
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Cache-Control': 'no-store' }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`read ${key} failed: ${response.status} ${JSON.stringify(data).slice(0, 300)}`);
  return Array.isArray(data) ? data[0] : data;
}

async function writeRows(token, rows) {
  const response = await fetch(API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(rows)
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`write failed: ${response.status} ${body.slice(0, 500)}`);
}

function validateBackup(payload) {
  const indicator = payload?.INDICATOR_PARAMS || {};
  const targets = payload?.TARGETS || {};
  if (String(indicator.ind1) !== '222' || String(indicator.ind2) !== '1353') {
    throw new Error(`unexpected backup indicator params: ${JSON.stringify(indicator)}`);
  }
  if (!targets || typeof targets !== 'object' || Array.isArray(targets) || Object.keys(targets).length !== 14) {
    throw new Error(`unexpected backup targets count: ${Object.keys(targets || {}).length}`);
  }
}

async function main() {
  const token = await login();
  const backupRows = [];
  for (const key of BACKUP_KEYS) backupRows.push(await fetchExact(token, key));
  if (backupRows.some((row) => !row?.content)) throw new Error('one or more expected backup records are missing');
  const backupPayloads = backupRows.map((row) => parsePayload(row.content));
  backupPayloads.forEach(validateBackup);
  if (JSON.stringify(backupPayloads[0].TARGETS) !== JSON.stringify(backupPayloads[1].TARGETS)) {
    throw new Error('backup TARGETS values disagree');
  }

  const support = {
    TARGETS: backupPayloads[0].TARGETS,
    INDICATOR_PARAMS: { ind1: '222', ind2: '1353' }
  };
  const writes = [];
  const beforeChecks = new Map();
  for (const key of CURRENT_KEYS) {
    const row = await fetchExact(token, key);
    if (!row?.content) throw new Error(`missing current record: ${key}`);
    const payload = parsePayload(row.content);
    const before = { hash: stableHashWithoutSupport(payload), rows: rowCount(payload) };
    const next = { ...payload, TARGETS: support.TARGETS, INDICATOR_PARAMS: support.INDICATOR_PARAMS };
    const after = { hash: stableHashWithoutSupport(next), rows: rowCount(next) };
    if (before.hash !== after.hash || before.rows !== after.rows) throw new Error(`non-support fields changed for ${key}`);
    beforeChecks.set(key, before);
    writes.push({ key, content: packLike(row.content, next), updated_at: new Date().toISOString() });
    console.log(`${WRITE ? 'WRITE' : 'DRY-RUN'} key=${key} rows=${before.rows} targets=14 ind1=222 ind2=1353 unchanged=${before.hash.slice(0, 12)}`);
  }

  if (!WRITE) return;
  await writeRows(token, writes);
  for (const key of CURRENT_KEYS) {
    const row = await fetchExact(token, key);
    const payload = parsePayload(row.content);
    validateBackup(payload);
    const before = beforeChecks.get(key);
    if (stableHashWithoutSupport(payload) !== before.hash || rowCount(payload) !== before.rows) {
      throw new Error(`post-write invariant failed for ${key}`);
    }
    console.log(`VERIFIED key=${key} rows=${before.rows} support-only repair complete`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
