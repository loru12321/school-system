const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
    path.resolve(__dirname, '../public/assets/js/virtual-table-runtime.js'),
    'utf8'
);

assert.ok(
    !/document\.addEventListener\(\s*['"]click['"]/.test(source),
    'virtual table runtime must not rescan the full document after every click'
);
assert.ok(
    source.includes("window.addEventListener('school:module-changed'")
        && source.includes('observeActiveSection(section)'),
    'virtual table runtime must scope enhancement work to the active module'
);
assert.ok(
    source.includes('const pendingRoots = new Set()')
        && source.includes('enhanceFrameId || enhanceTimerId || enhanceIdleId')
        && source.includes('requestIdleCallback'),
    'virtual table enhancement requests must be coalesced and deferred until after module paint'
);

console.log('virtual table performance contract passed');
