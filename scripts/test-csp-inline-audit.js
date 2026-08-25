/**
 * test-csp-inline-audit.js
 *
 * Audits inline event handlers and inline styles in src/index.html to support
 * eventual CSP unsafe-inline removal. Reports counts and provides a baseline
 * for tracking progress.
 *
 * Exit 0 always (audit, not enforcement). Use output for planning.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'src', 'index.html');

if (!fs.existsSync(htmlPath)) {
    console.error('[csp-inline-audit] src/index.html not found');
    process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Count inline event handlers: onclick, onchange, onblur, etc.
const inlineHandlers = html.match(/\s(on[a-z]+)=/gi) || [];
const handlerCount = inlineHandlers.length;

// Count inline style attributes
const inlineStyles = html.match(/\sstyle=/gi) || [];
const styleCount = inlineStyles.length;

// Count <script> without src (inline scripts)
const inlineScripts = (html.match(/<script(?![^>]*\ssrc=)/gi) || []).length;

console.log('[csp-inline-audit] Inline event handlers:', handlerCount);
console.log('[csp-inline-audit] Inline style attributes:', styleCount);
console.log('[csp-inline-audit] Inline <script> tags:', inlineScripts);

if (handlerCount > 0 || styleCount > 0 || inlineScripts > 0) {
    console.log('\n[csp-inline-audit] ⚠️  CSP unsafe-inline is still required.');
    console.log('[csp-inline-audit] To remove it, migrate to:');
    console.log('  • Event delegation for onclick/onchange/etc.');
    console.log('  • External stylesheets or CSS-in-JS for inline styles.');
    console.log('  • External .js files or nonce/hash for inline scripts.');
} else {
    console.log('\n[csp-inline-audit] ✅ No inline handlers/styles/scripts found. CSP can drop unsafe-inline.');
}

process.exit(0);
