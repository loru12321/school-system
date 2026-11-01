// Allows the few inline <script> blocks that must stay inline (first-paint auth
// state, the early login-click capture, design bootstrap) by SHA-256 hash in the
// Content-Security-Policy-Report-Only header, in place of 'unsafe-inline'.
//
// Runs after the HTML has been minified, because the hash covers the exact bytes
// the browser receives.  Only the Report-Only policy changes: browsers ignore
// 'unsafe-inline' as soon as a hash is listed, so adding hashes to the enforced
// policy would silently enforce it.  Violations reach /api/csp-report; once the
// reports are clean the same script-src can be promoted to the enforced header.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { writeFileWithRetry } from './file-write-retry.mjs';

const __filename = fileURLToPath(import.meta.url);
const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(__filename), '../../');

const NON_EXECUTED_TYPES = /^(text\/html|text\/template|text\/x-template|application\/(ld\+)?json|importmap|speculationrules)$/i;

export function computeInlineScriptHashes(html) {
    const hashes = [];
    const pattern = /<script(\s[^>]*)?>([\s\S]*?)<\/script\s*>/gi;
    let match;
    while ((match = pattern.exec(String(html || '')))) {
        const attrs = match[1] || '';
        if (/\ssrc\s*=/i.test(attrs)) continue;
        const type = (/\stype\s*=\s*["']?([^"'\s>]+)/i.exec(attrs) || [])[1] || '';
        if (type && NON_EXECUTED_TYPES.test(type)) continue;
        const digest = crypto.createHash('sha256').update(match[2], 'utf8').digest('base64');
        const token = `'sha256-${digest}'`;
        if (!hashes.includes(token)) hashes.push(token);
    }
    return hashes;
}

export function applyReportOnlyScriptHashes(headersText, hashes) {
    const lines = String(headersText || '').split(/\r?\n/);
    const eol = /\r\n/.test(headersText) ? '\r\n' : '\n';
    let changed = 0;
    const out = lines.map((line) => {
        if (!/^\s*Content-Security-Policy-Report-Only:/i.test(line)) return line;
        return line.replace(/(script-src\s)([^;]*)/i, (whole, prefix, sources) => {
            const kept = sources.split(/\s+/).filter((token) => token && token !== "'unsafe-inline'" && !/^'sha256-/.test(token));
            const [first, ...rest] = kept;
            changed += 1;
            return prefix + [first, ...hashes, ...rest].filter(Boolean).join(' ');
        });
    });
    if (!changed) throw new Error('Content-Security-Policy-Report-Only script-src not found in _headers');
    return out.join(eol);
}

export async function injectCspScriptHashes(projectRoot = DEFAULT_PROJECT_ROOT) {
    const htmlPath = path.join(projectRoot, 'dist', 'index.html');
    const headersPath = path.join(projectRoot, 'dist', '_headers');
    const hashes = computeInlineScriptHashes(fs.readFileSync(htmlPath, 'utf8'));
    const updated = applyReportOnlyScriptHashes(fs.readFileSync(headersPath, 'utf8'), hashes);
    await writeFileWithRetry(headersPath, updated);
    return hashes;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    const hashes = await injectCspScriptHashes();
    console.log(`[csp] Report-Only script-src now allows ${hashes.length} inline script hash(es) instead of 'unsafe-inline'`);
}
