const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');

function count(pattern) {
    return (html.match(pattern) || []).length;
}

const inlineStyleCount = count(/\sstyle=/g);
const inlineHandlerCount = count(/\son[a-z]+=/g);

assert.ok(html.indexOf('runtime-registry-runtime.js') < html.indexOf('boot-runtime.js'), 'runtime registry must load before boot runtime');
assert.ok(inlineStyleCount <= 879, `inline style count grew: ${inlineStyleCount} > 879`);
assert.ok(inlineHandlerCount <= 383, `inline event handler count grew: ${inlineHandlerCount} > 383`);
assert.ok(!html.includes('sb_publishable_'), 'index.html should not embed Supabase publishable keys');

console.log(`html hygiene tests passed: style=${inlineStyleCount}, handlers=${inlineHandlerCount}`);
