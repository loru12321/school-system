// School-scope redaction for packed system_data archives.
//
// Cohort workspaces and exam shards are packed for the whole county: every
// school's student rows travel together so rankings, town comparisons and
// county statistics can be computed on the client. Admins keep that full
// view. Leadership roles bound to one school (director, grade_director) only
// need student identities for their own school, so before a packed archive is
// returned to them the Worker:
//
//   * keeps every row of the caller's own school untouched;
//   * keeps scores, ranks, totals, status and class for other schools so the
//     cross-school analytics still add up;
//   * replaces other schools' student names (and uuids) with stable keyed
//     pseudonyms, drops student ids and any free-text extras.
//
// The redacted archive is returned as plain JSON (every client parser accepts
// it) with a SCHOOL_SCOPE_MARKER so clients never upload it back. Set
// SYSTEM_DATA_SCHOOL_REDACTION="off" to disable (rollback switch).

import LZString from './worker-lz-string.js';
import { isAdmin } from './worker-auth.js';
import { normalizeText } from './worker-http-helpers.js';

export const SCHOOL_SCOPE_MARKER = '__SCHOOL_SCOPE_REDACTED';
const PSEUDONYM_NAME_PREFIX = '匿名';
const PSEUDONYM_UUID_PREFIX = 'anon-';
const MAX_WALK_DEPTH = 14;

// ---------------------------------------------------------------------------
// Scope resolution
// ---------------------------------------------------------------------------

export function isSchoolRedactionEnabled(env) {
  const value = normalizeText(env?.SYSTEM_DATA_SCHOOL_REDACTION).toLowerCase();
  return !(value === 'off' || value === 'false' || value === '0' || value === 'disabled');
}

/**
 * Returns null when the caller may receive full archives (admins, or the
 * feature switched off); otherwise the school whose rows stay identifiable.
 * A non-admin without a bound school gets every school redacted.
 */
export function resolveSchoolRedactionScope(session, env) {
  if (!session || isAdmin(session)) return null;
  if (!isSchoolRedactionEnabled(env)) return null;
  return { school: normalizeText(session.school) };
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Cache-key tag that separates redacted views without exposing the school name. */
export async function getSchoolRedactionCacheTag(scope, env) {
  if (!scope) return 'full';
  const secret = normalizeText(env?.APP_SESSION_SECRET);
  return `s-${(await sha256Hex(`${secret}\u0000school-scope\u0000${scope.school}`)).slice(0, 20)}`;
}

// ---------------------------------------------------------------------------
// School-name equivalence (port of public/assets/js/school-normalization-runtime.js)
// ---------------------------------------------------------------------------

const SCHOOL_ALIAS_GROUPS = [
  { canonical: '银山中学', aliases: ['银山镇中学'] },
  { canonical: '老湖中学', aliases: ['老湖'] },
  { canonical: '梯门中学', aliases: ['梯门'] },
  { canonical: '商老庄中学', aliases: ['商老庄', '商老庄实验学校'] },
  { canonical: '彭集中学', aliases: ['彭集', '彭集街道中学'] },
  { canonical: '接山中学', aliases: ['接山', '接山镇中学'] },
  { canonical: '州城中学', aliases: ['州城', '州城街道', '州城街道中学', '州城一中', '州城二中', '州城镇一中', '州城镇二中'] },
  { canonical: '新湖中学', aliases: ['新湖', '新湖镇中学'] },
  { canonical: '大羊中学', aliases: ['大羊'] },
  { canonical: '沙河站中学', aliases: ['沙河站', '沙河站镇中学'] },
  { canonical: '银山实验', aliases: ['银山实验学校', '东平银山实验学校', '银山镇实验学校', '银山实验中学', '银山镇实验中学', '实验完全中学'] },
  { canonical: '旧县中学', aliases: ['旧县', '旧县乡中心学校', '旧县中心学校', '旧县中心小学'] },
  { canonical: '斑鸠店镇中', aliases: ['斑鸠店中学', '斑鸠店镇中学', '斑鸠店中'] },
  { canonical: '戴庙中学', aliases: ['戴庙', '戴庙镇中学'] },
  { canonical: '东平县实验中学', aliases: ['东平实验中学', '泰安市东平实验中学'] },
  { canonical: '东平县佛山中学', aliases: ['东平佛山中学', '泰安市东平佛山中学'] },
  { canonical: '东平明湖中学', aliases: ['东平县明湖中学'] },
  { canonical: '东平县江河实验学校', aliases: ['东平江河实验学校'] },
  { canonical: '东平县东原实验学校', aliases: ['东平东原实验学校'] },
  { canonical: '东平县清河实验学校', aliases: ['东平清河实验学校'] },
  { canonical: '东平县青峰山实验学校', aliases: ['东平实验中学青峰山校区', '青峰山校区'] },
  { canonical: '东平县嘉和实验学校', aliases: ['东平嘉和实验学校'] },
  { canonical: '东平县第二实验中学', aliases: ['东平第二实验中学'] },
  { canonical: '东平县第一中学', aliases: ['东平一中'] }
];

const SCHOOL_ORG_SUFFIX_RULES = [
  [/(学校|中学)教育集团$/u, '$1'],
  [/(学校|中学)集团$/u, '$1'],
  [/(学校|中学)(?:初中部|高中部|小学部|本部|校本部|分校|校区|总校)$/u, '$1'],
  [/九年一贯制学校$/u, '学校'],
  [/九年一贯制$/u, ''],
  [/完全中学$/u, '中学'],
  [/附属学校$/u, '学校'],
  [/附属中学$/u, '中学'],
  [/教育联盟$/u, ''],
  [/直属校区$/u, ''],
  [/校区$/u, ''],
  [/分校$/u, ''],
  [/教学点$/u, ''],
  [/本部$/u, ''],
  [/校本部$/u, ''],
  [/总校$/u, '']
];

export function sanitizeSchoolText(name) {
  return String(name || '')
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF\u2060\u00A0]/g, '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[()（）\-—_·、,，.。]/g, '')
    .trim();
}

function stripSchoolAdministrativePrefix(name) {
  let text = sanitizeSchoolText(name);
  let prev = '';
  while (text && text !== prev) {
    prev = text;
    text = text.replace(
      /^[一-龥]{2,7}?(?:省|市|县|区)(?=[一-龥]*(?:实验中学|实验学校|中学|学校))/u,
      ''
    );
  }
  return text;
}

function stripSchoolOrganizationalSuffixes(name) {
  let text = stripSchoolAdministrativePrefix(name);
  let prev = '';
  while (text && text !== prev) {
    prev = text;
    SCHOOL_ORG_SUFFIX_RULES.forEach(([pattern, replacement]) => {
      text = text.replace(pattern, replacement);
    });
  }
  return text;
}

export function computeSchoolBaseKey(name) {
  let text = stripSchoolOrganizationalSuffixes(name);
  if (!text) return '';
  text = text
    .replace(/镇实验学校$/u, '实验')
    .replace(/街道实验学校$/u, '实验')
    .replace(/乡实验学校$/u, '实验')
    .replace(/实验学校$/u, '实验')
    .replace(/实验中学$/u, '实验')
    .replace(/镇中学$/u, '')
    .replace(/街道中学$/u, '')
    .replace(/乡中心学校$/u, '')
    .replace(/中心学校$/u, '')
    .replace(/中学$/u, '')
    .replace(/学校$/u, '')
    .replace(/街道$/u, '')
    .replace(/乡$/u, '')
    .replace(/镇$/u, '');
  return text || stripSchoolOrganizationalSuffixes(name) || sanitizeSchoolText(name);
}

function collectCustomAliasGroups(aliasRows) {
  const groups = new Map();
  (Array.isArray(aliasRows) ? aliasRows : []).forEach((item) => {
    const canonical = normalizeText(item?.canonical);
    if (!canonical) return;
    if (!groups.has(canonical)) groups.set(canonical, new Set());
    const aliases = Array.isArray(item?.aliases) ? item.aliases : [item?.alias];
    aliases.forEach((alias) => {
      const text = normalizeText(alias);
      if (text && text !== canonical) groups.get(canonical).add(text);
    });
  });
  return Array.from(groups.entries()).map(([canonical, aliases]) => ({ canonical, aliases: Array.from(aliases) }));
}

export function buildSchoolNameNormalizer(aliasRows = []) {
  const groups = [...SCHOOL_ALIAS_GROUPS, ...collectCustomAliasGroups(aliasRows)];
  const aliasMap = Object.create(null);
  const baseKeyMap = Object.create(null);
  groups.forEach((group) => {
    const names = [group.canonical, ...(group.aliases || [])];
    names.forEach((name) => {
      const key = sanitizeSchoolText(name);
      if (key) aliasMap[key] = group.canonical;
    });
    const keys = new Set(names.map((name) => computeSchoolBaseKey(name)).filter(Boolean));
    if (keys.size === 1) baseKeyMap[[...keys][0]] = group.canonical;
  });
  const cache = new Map();
  return function normalizeSchoolName(name) {
    const text = sanitizeSchoolText(name);
    if (!text) return '';
    if (cache.has(text)) return cache.get(text);
    let result;
    if (aliasMap[text]) {
      result = `canon:${aliasMap[text]}`;
    } else {
      const baseKey = computeSchoolBaseKey(text);
      result = !baseKey ? text : (baseKeyMap[baseKey] ? `canon:${baseKeyMap[baseKey]}` : baseKey);
    }
    cache.set(text, result);
    return result;
  };
}

function createOwnSchoolMatcher(boundSchool, aliasRows) {
  const normalize = buildSchoolNameNormalizer(aliasRows);
  const boundRaw = normalizeText(boundSchool);
  const boundKey = boundRaw ? normalize(boundRaw) : '';
  const cache = new Map();
  return function isOwnSchool(name) {
    if (!boundKey) return false;
    const raw = normalizeText(name);
    if (!raw) return false;
    if (cache.has(raw)) return cache.get(raw);
    const matched = raw === boundRaw || normalize(raw) === boundKey;
    cache.set(raw, matched);
    return matched;
  };
}

// ---------------------------------------------------------------------------
// Payload walking
// ---------------------------------------------------------------------------

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isNumericLike(value) {
  return value === null || typeof value === 'number' || typeof value === 'boolean';
}

// Keep only non-identifying extras: numbers/booleans, numeric arrays (packed
// T-scores), numeric maps, and the subject list of blank scores.
function sanitizeExtras(extras) {
  if (!isPlainObject(extras)) return extras == null ? extras : null;
  const next = {};
  Object.entries(extras).forEach(([field, value]) => {
    if (isNumericLike(value)) { next[field] = value; return; }
    if (Array.isArray(value)) {
      if (value.every(isNumericLike)) next[field] = value;
      else if (field === 'blankScoreSubjects' && value.every((item) => typeof item === 'string')) next[field] = value;
      return;
    }
    if (isPlainObject(value) && Object.values(value).every(isNumericLike)) next[field] = value;
  });
  return Object.keys(next).length ? next : null;
}

const PLAIN_ROW_KEEP_STRING_FIELDS = new Set(['school', 'class', 'name', 'status', 'uuid']);

function isPlainStudentRow(value) {
  return isPlainObject(value)
    && typeof value.school === 'string'
    && typeof value.name === 'string'
    && (isPlainObject(value.scores) || Object.prototype.hasOwnProperty.call(value, 'total'));
}

function collectAliasRows(payload) {
  if (!isPlainObject(payload)) return [];
  return Array.isArray(payload.SCHOOL_ALIAS_SETTINGS) ? payload.SCHOOL_ALIAS_SETTINGS : [];
}

// ---------------------------------------------------------------------------
// Keyed pseudonyms (synchronous HMAC-SHA-256)
// ---------------------------------------------------------------------------
// One archive can hold tens of thousands of rows; an awaited WebCrypto call
// per row costs far more CPU than the hash itself, so pseudonyms use a small
// synchronous HMAC-SHA-256 with precomputed key pads. The test suite checks it
// against WebCrypto.

const SHA256_K = (() => {
  const primes = [];
  for (let n = 2; primes.length < 64; n += 1) {
    if (primes.every((p) => n % p !== 0)) primes.push(n);
  }
  return Uint32Array.from(primes, (p) => Math.floor((Math.cbrt(p) % 1) * 2 ** 32) >>> 0);
})();
const SHA256_H0 = Uint32Array.from([2, 3, 5, 7, 11, 13, 17, 19], (p) => Math.floor((Math.sqrt(p) % 1) * 2 ** 32) >>> 0);
const SHA256_W = new Uint32Array(64);

function sha256Compress(state, bytes, offset) {
  const w = SHA256_W;
  for (let i = 0; i < 16; i += 1) {
    const j = offset + i * 4;
    w[i] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;
  }
  for (let i = 16; i < 64; i += 1) {
    const a = w[i - 15];
    const b = w[i - 2];
    const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
    const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
    w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
  }
  let [a, b, c, d, e, f, g, h] = state;
  for (let i = 0; i < 64; i += 1) {
    const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
    const ch = (e & f) ^ (~e & g);
    const t1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
    const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
    const maj = (a & b) ^ (a & c) ^ (b & c);
    const t2 = (S0 + maj) >>> 0;
    h = g; g = f; f = e; e = (d + t1) >>> 0;
    d = c; c = b; b = a; a = (t1 + t2) >>> 0;
  }
  state[0] = (state[0] + a) >>> 0; state[1] = (state[1] + b) >>> 0;
  state[2] = (state[2] + c) >>> 0; state[3] = (state[3] + d) >>> 0;
  state[4] = (state[4] + e) >>> 0; state[5] = (state[5] + f) >>> 0;
  state[6] = (state[6] + g) >>> 0; state[7] = (state[7] + h) >>> 0;
}

// Hashes `bytes` continuing from `initState`, which has already absorbed
// `prefixLength` bytes (a multiple of 64). Returns the 32-byte digest.
function sha256From(initState, prefixLength, bytes) {
  const state = Uint32Array.from(initState);
  const total = prefixLength + bytes.length;
  const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
  const block = new Uint8Array(paddedLength);
  block.set(bytes);
  block[bytes.length] = 0x80;
  const bitLength = total * 8;
  const high = Math.floor(bitLength / 2 ** 32);
  const low = bitLength >>> 0;
  block[paddedLength - 8] = high >>> 24; block[paddedLength - 7] = high >>> 16;
  block[paddedLength - 6] = high >>> 8; block[paddedLength - 5] = high;
  block[paddedLength - 4] = low >>> 24; block[paddedLength - 3] = low >>> 16;
  block[paddedLength - 2] = low >>> 8; block[paddedLength - 1] = low;
  for (let offset = 0; offset < paddedLength; offset += 64) sha256Compress(state, block, offset);
  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i += 1) {
    out[i * 4] = state[i] >>> 24; out[i * 4 + 1] = state[i] >>> 16;
    out[i * 4 + 2] = state[i] >>> 8; out[i * 4 + 3] = state[i];
  }
  return out;
}

export function sha256Bytes(bytes) {
  return sha256From(SHA256_H0, 0, bytes);
}

/** Returns (text) => lowercase hex HMAC-SHA-256(secret, text). */
export function createHmacSha256Hex(secret) {
  const encoder = new TextEncoder();
  let keyBytes = encoder.encode(String(secret || ''));
  if (keyBytes.length > 64) keyBytes = sha256Bytes(keyBytes);
  const pad = (byte) => {
    const block = new Uint8Array(64);
    block.set(keyBytes);
    for (let i = 0; i < 64; i += 1) block[i] ^= byte;
    const state = Uint32Array.from(SHA256_H0);
    sha256Compress(state, block, 0);
    return state;
  };
  const innerState = pad(0x36);
  const outerState = pad(0x5c);
  return (text) => {
    const inner = sha256From(innerState, 64, encoder.encode(String(text)));
    const digest = sha256From(outerState, 64, inner);
    let hex = '';
    for (let i = 0; i < digest.length; i += 1) hex += digest[i].toString(16).padStart(2, '0');
    return hex;
  };
}

/**
 * Redacts a parsed payload in place. Returns the number of rows redacted.
 */
function redactParsedPayload(payload, scope, env) {
  const isOwnSchool = createOwnSchoolMatcher(scope.school, collectAliasRows(payload));
  const hmac = createHmacSha256Hex(normalizeText(env?.APP_SESSION_SECRET) || 'school-scope-redaction');
  const pseudonymCache = new Map();
  const pseudonymOf = (school, id, name) => {
    const identity = `school-scope-v1\u0000${normalizeText(school)}\u0000${id ?? ''}\u0000${normalizeText(name)}`;
    let hash = pseudonymCache.get(identity);
    if (!hash) {
      hash = hmac(identity);
      pseudonymCache.set(identity, hash);
    }
    return hash;
  };
  let redacted = 0;

  const redactPackedRows = (packed) => {
    packed.rows.forEach((entry) => {
      if (!Array.isArray(entry) || isOwnSchool(entry[0])) return;
      redacted += 1;
      const hash = pseudonymOf(entry[0], entry[3], entry[2]);
      entry[2] = `${PSEUDONYM_NAME_PREFIX}${hash.slice(0, 10)}`;
      entry[3] = null;
      if (entry[8] !== null && entry[8] !== undefined && entry[8] !== '') entry[8] = `${PSEUDONYM_UUID_PREFIX}${hash.slice(10, 26)}`;
      if (entry.length > 10) entry[10] = sanitizeExtras(entry[10]);
    });
  };

  const redactPlainRow = (row) => {
    if (isOwnSchool(row.school)) return;
    redacted += 1;
    const hash = pseudonymOf(row.school, row.id, row.name);
    row.name = `${PSEUDONYM_NAME_PREFIX}${hash.slice(0, 10)}`;
    delete row.id;
    if (row.uuid !== null && row.uuid !== undefined && row.uuid !== '') row.uuid = `${PSEUDONYM_UUID_PREFIX}${hash.slice(10, 26)}`;
    Object.keys(row).forEach((field) => {
      if (typeof row[field] === 'string' && !PLAIN_ROW_KEEP_STRING_FIELDS.has(field)) delete row[field];
    });
  };

  const walk = (node, depth) => {
    if (!node || typeof node !== 'object' || depth > MAX_WALK_DEPTH) return;
    if (Array.isArray(node)) {
      node.forEach((item) => {
        if (isPlainStudentRow(item)) redactPlainRow(item);
        else walk(item, depth + 1);
      });
      return;
    }
    if (node.__packedRows === 'rows-v1' && Array.isArray(node.rows)) {
      redactPackedRows(node);
      return;
    }
    Object.values(node).forEach((value) => walk(value, depth + 1));
  };

  walk(payload, 0);
  return redacted;
}

function decodeSystemDataContent(content) {
  if (typeof content !== 'string' || !content) return { kind: 'empty' };
  let raw = content;
  if (content.startsWith('LZB64|')) raw = LZString.decompressFromBase64(content.slice(6));
  else if (content.startsWith('LZ|')) raw = LZString.decompressFromUTF16(content.slice(3));
  else {
    const head = content.trimStart().charAt(0);
    if (head !== '{' && head !== '[') return { kind: 'opaque' };
  }
  if (typeof raw !== 'string' || !raw) return { kind: 'invalid' };
  try {
    return { kind: 'payload', payload: JSON.parse(raw) };
  } catch (error) {
    return { kind: 'invalid' };
  }
}

/**
 * Returns the content a scoped caller may receive. Unchanged content is
 * returned as-is (still packed); redacted content becomes plain JSON.
 * Content that looks packed but cannot be decoded is withheld (fail closed).
 */
export async function redactSystemDataContent(content, scope, env) {
  if (!scope) return content;
  const decoded = decodeSystemDataContent(content);
  if (decoded.kind === 'empty' || decoded.kind === 'opaque') return content;
  if (decoded.kind === 'invalid') return '';
  const payload = decoded.payload;
  const redacted = redactParsedPayload(payload, scope, env);
  if (!redacted) return content;
  if (isPlainObject(payload)) {
    payload[SCHOOL_SCOPE_MARKER] = { version: 1, school: scope.school || '', redactedRows: redacted };
  }
  return JSON.stringify(payload);
}
