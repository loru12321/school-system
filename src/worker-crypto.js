// Cryptographic utilities shared across gateway worker modules.
// Handles base64url encoding, HMAC-HS256 JWT signing/verification,
// and PBKDF2 password hashing/verification.
import { normalizeText, safeJsonParse } from './worker-http-helpers.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PBKDF2_ITERATIONS = 100000;
export const PBKDF2_SCHEME = 'pbkdf2-sha256';

const textEncoder = new TextEncoder();

// ---------------------------------------------------------------------------
// Base64url
// ---------------------------------------------------------------------------

export function toBase64Url(input) {
  const bytes = typeof input === 'string' ? textEncoder.encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function fromBase64Url(input) {
  const normalized = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  const output = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }
  return output;
}

// ---------------------------------------------------------------------------
// Timing-safe comparison
// ---------------------------------------------------------------------------

export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return mismatch === 0;
}

// ---------------------------------------------------------------------------
// HMAC-HS256 JWT (local session tokens)
// ---------------------------------------------------------------------------

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

export async function signLocalSession(env, payload) {
  const secret = normalizeText(env.APP_SESSION_SECRET);
  if (!secret) {
    throw new Error('APP_SESSION_SECRET_MISSING');
  }
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const content = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(content));
  return `${content}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyLocalSession(env, token) {
  const secret = normalizeText(env.APP_SESSION_SECRET);
  if (!secret) {
    return null;
  }
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, providedSignature] = parts;
  const content = `${encodedHeader}.${encodedPayload}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, textEncoder.encode(content));
  const expected = toBase64Url(new Uint8Array(signature));
  if (!timingSafeEqual(expected, providedSignature)) return null;
  const payload = safeJsonParse(new TextDecoder().decode(fromBase64Url(encodedPayload)), null);
  if (!payload || !payload.exp || Number(payload.exp) < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

export function getBearerToken(request) {
  const header = request.headers.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || '').trim() : '';
}

// ---------------------------------------------------------------------------
// PBKDF2 password hashing
// ---------------------------------------------------------------------------

async function derivePbkdf2Bits(password, saltBytes, iterations) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(normalizeText(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBytes,
      iterations
    },
    baseKey,
    256
  );
}

export async function hashAccountPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derivedBits = await derivePbkdf2Bits(password, salt, PBKDF2_ITERATIONS);
  const hashBytes = new Uint8Array(derivedBits);
  return `${PBKDF2_SCHEME}$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hashBytes)}`;
}

export async function verifyAccountPasswordHash(storedHash, password) {
  const parts = normalizeText(storedHash).split('$');
  if (parts.length !== 4) return false;
  const [scheme, iterationsText, saltText, hashText] = parts;
  if (scheme !== PBKDF2_SCHEME) return false;
  const iterations = Number(iterationsText);
  if (!Number.isFinite(iterations) || iterations <= 0) return false;
  const salt = fromBase64Url(saltText);
  const expected = fromBase64Url(hashText);
  const derivedBits = await derivePbkdf2Bits(password, salt, iterations);
  const candidate = new Uint8Array(derivedBits);
  return timingSafeEqual(
    Array.from(candidate, (byte) => String.fromCharCode(byte)).join(''),
    Array.from(expected, (byte) => String.fromCharCode(byte)).join('')
  );
}
