/**
 * test-orphan-tests.js
 *
 * Detects test:* scripts in package.json that are not referenced by any
 * validate:*, check:*, prevalidate, or precheck:* chain. Orphaned tests
 * provide zero regression protection — breakages go undetected indefinitely.
 *
 * Exit 0 = zero orphans. Exit 1 = one or more orphans found.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const scripts = pkg.scripts || {};

// All test:* script keys (the candidates that must be reachable).
const testKeys = Object.keys(scripts).filter(k => k.startsWith('test:'));

// Chains that count as "coverage": validate:*, check:*, prevalidate, precheck:*,
// and the aggregate aliases like validate / check:release-fast / check:p0 etc.
const CHAIN_PATTERN = /^(validate|check|prevalidate|precheck)/;
const chainValues = Object.entries(scripts)
    .filter(([k]) => CHAIN_PATTERN.test(k))
    .map(([, v]) => v);

// Join all chain values into one big string for substring search.
// A test key "test:foo" appears in a chain as "npm run test:foo" or simply
// "test:foo" (npm-run-all shorthand). Match both forms.
const chainBlob = chainValues.join('\n');

function isReachable(testKey) {
    // Direct "npm run test:key" form
    if (chainBlob.includes(`npm run ${testKey}`)) return true;
    // npm-run-all shorthand: just the bare key after a space / start of word
    const re = new RegExp(`(^|\\s)${testKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`);
    return re.test(chainBlob);
}

const orphans = testKeys.filter(k => !isReachable(k));

if (orphans.length === 0) {
    console.log(`[orphan-tests] ✅ All ${testKeys.length} test:* scripts are reachable from a validate/check chain.`);
    process.exit(0);
} else {
    console.error(`[orphan-tests] ❌ ${orphans.length} orphan test script(s) found — not in any validate/check chain:`);
    orphans.forEach(k => console.error(`  • ${k}`));
    console.error('\nWire each orphan into the appropriate validate:* or check:* command, or remove it.');
    process.exit(1);
}
