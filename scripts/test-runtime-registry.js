const assert = require('assert');
const path = require('path');

const root = {};
global.globalThis = root;
require(path.resolve(__dirname, '../public/assets/js/runtime-registry-runtime.js'));

assert.ok(root.SchoolRuntime, 'SchoolRuntime should be installed');
assert.strictEqual(root.SchoolRuntime.expose('demo.value', 42), 42);
assert.strictEqual(root.SchoolRuntime.get('demo.value'), 42);
assert.strictEqual(root.SchoolRuntime.has('demo.value'), true);
assert.deepStrictEqual(root.SchoolRuntime.get('missing'), undefined);
assert.strictEqual(root.SchoolRuntime.escapeHtml('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;');

root.SchoolRuntime.registerSkill('report-render', { mode: 'demand' });
assert.deepStrictEqual(root.SchoolRuntime.getSkill('report-render'), { mode: 'demand' });
assert.ok(root.SchoolRuntime.listSkills().includes('report-render'));

console.log('runtime registry tests passed');
