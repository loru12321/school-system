const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/mobile-table-scroll-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/assets/css/mobile-experience-system.css'), 'utf8');
const scripts = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts;

const document = {
  readyState: 'loading', body: { dataset: { mobileArchitecture: 'apk-v2' } },
  addEventListener() {}, querySelectorAll() { return []; }
};
const window = {};
vm.runInNewContext(source, { window, document, console: { info() {} }, MutationObserver: undefined, setTimeout() {} });
const api = window.TableScrollIndicators;
assert.equal(typeof api.classifyTable, 'function');

function table(columns, text = '', explicit = '') {
  return {
    dataset: explicit ? { mobileTable: explicit } : {},
    className: '', textContent: text,
    querySelectorAll(selector) { return selector === 'thead th' ? Array.from({ length: columns }, () => ({})) : []; },
    closest() { return null; }
  };
}
assert.equal(api.classifyTable(table(4, '姓名 班级 分数')), 'list');
assert.equal(api.classifyTable(table(7, '平均分 优秀率 排名')), 'summary');
assert.equal(api.classifyTable(table(12, '学校 语文 数学 英语')), 'matrix');
assert.equal(api.classifyTable(table(2, '', 'matrix')), 'matrix', 'explicit strategy wins');

const wrap = {
  dataset: {}, scrollLeft: 0, scrollWidth: 900, clientWidth: 320,
  querySelector() { return table(12); }, hasAttribute(name) { return Object.hasOwn(this.dataset, name.replace('data-', '').replace(/-([a-z])/g, (_, c) => c.toUpperCase())); }
};
api.setupTableWrap(wrap);
api.setupTableWrap(wrap);
assert.equal(wrap.dataset.mobileTable, 'matrix');
assert.equal(wrap.dataset.mobileTableReady, 'true');
assert.equal(wrap.dataset.scrollRight, 'true');

assert.match(css, /data-mobile-table="list"/);
assert.match(css, /data-mobile-table="summary"/);
assert.match(css, /data-mobile-table="matrix"[\s\S]*?position:\s*sticky/);
assert.equal(scripts['test:mobile-table-strategies'], 'node scripts/test-mobile-table-strategies.js');
assert.match(scripts['validate:build'], /test:mobile-table-strategies/);

console.log('mobile table strategies passed');
