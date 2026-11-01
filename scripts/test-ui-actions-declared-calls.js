// Behavioural test for the data-ui-action="call" / data-ui-change="call"
// delegate that replaced the inline onclick/onchange handlers in index.html.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const runtimeSource = fs.readFileSync(path.join(root, 'public/assets/js/ui-actions-runtime.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');

const DATASET_KEYS = { action: 'uiAction', change: 'uiChange', input: 'uiInput', enter: 'uiEnter', stop: 'uiStop' };

function createElement(dataset, value = '', parent = null) {
  const element = {
    dataset,
    value,
    parent,
    closest(selector) {
      // Supports "[data-ui-x]" and comma lists such as "[data-ui-action], [data-ui-stop]".
      const keys = selector.split(',').map((part) => {
        const match = /^\s*\[data-ui-(action|change|input|enter|stop)\]\s*$/.exec(part);
        return match ? DATASET_KEYS[match[1]] : null;
      });
      for (let node = element; node; node = node.parent) {
        if (keys.some((key) => key && node.dataset[key] !== undefined && node.dataset[key] !== false)) return node;
      }
      return null;
    }
  };
  return element;
}

function createHarness() {
  const listeners = {};
  const calls = [];
  const window = {
    alert: (message) => calls.push(['alert', message]),
    doQuery: (...args) => calls.push(['doQuery', ...args]),
    addConflictPair: (...args) => calls.push(['addConflictPair', ...args]),
    notAllowed: () => calls.push(['notAllowed']),
    CohortGrowth: {
      updateClassSelectForSchool(value) { calls.push(['CohortGrowth.updateClassSelectForSchool', value, this === window.CohortGrowth]); }
    },
    CloudManager: { loadTeachers: (options) => calls.push(['CloudManager.loadTeachers', options]) },
    toggleStudentDetail: (element) => calls.push(['toggleStudentDetail', element.dataset.label]),
    toggleExcelMenu: (colKey, event) => calls.push(['toggleExcelMenu', colKey, event.marker]),
    filterCheckboxList: (element) => calls.push(['filterCheckboxList', element.value]),
    Auth: { closeLoginPortalModal() { calls.push(['Auth.closeLoginPortalModal']); } },
    DataCloudRuntime: { deleteCurrentExamCloudBackup: (manager) => calls.push(['deleteCurrentExamCloudBackup', manager && manager.name]) },
    DataManager: { name: 'DM' }
  };
  const panels = { townSubExam3Wrap: { style: { display: 'none' } }, anchor1: { scrollIntoView: (options) => calls.push(['scrollIntoView', options.behavior]) } };
  const document = { addEventListener: (type, handler) => { listeners[type] = handler; }, getElementById: (id) => panels[id] || null };
  const context = { window, document, console: { warn: () => {}, log: () => {} }, localStorage: { setItem() {} } };
  vm.createContext(context);
  vm.runInContext(runtimeSource, context);
  const dispatch = (type, target, extra = {}) => {
    let prevented = false;
    listeners[type]({ target, key: '', preventDefault: () => { prevented = true; }, ...extra });
    return prevented;
  };
  return { calls, dispatch, panels, context };
}

const { calls, dispatch } = createHarness();
dispatch('click', createElement({ uiAction: 'call', uiCall: 'doQuery' }));
dispatch('click', createElement({ uiAction: 'call', uiCall: 'addConflictPair', uiArgs: '["adj"]' }));
dispatch('click', createElement({ uiAction: 'call', uiCall: 'CloudManager.loadTeachers', uiArgs: '[{"force":true,"preferRemote":true}]' }));
dispatch('change', createElement({ uiChange: 'call', uiCall: 'CohortGrowth.updateClassSelectForSchool', uiArgs: '["$value"]' }, 'A校'));
dispatch('change', createElement({ uiChange: 'call', uiCall: 'doQuery' }));
dispatch('click', createElement({ uiAction: 'call', uiCall: 'notAllowed' }));
const prevented = dispatch('click', createElement({ uiAction: 'show-message', uiMessage: '格式说明\n第一列' }));

assert.deepStrictEqual(JSON.parse(JSON.stringify(calls)), [
  ['doQuery'],
  ['addConflictPair', 'adj'],
  ['CloudManager.loadTeachers', { force: true, preferRemote: true }],
  ['CohortGrowth.updateClassSelectForSchool', 'A校', true],
  ['doQuery'],
  ['alert', '格式说明\n第一列']
], 'declared calls should reach the same handlers the inline attributes used, and unlisted names must be ignored');
assert.strictEqual(prevented, true, 'the help link should not navigate');

// Behaviours that replaced the runtime-rendered inline handlers.
{
  const harness = createHarness();
  const row = createElement({ uiAction: 'call', uiCall: 'toggleStudentDetail', uiArgs: '["$this"]', label: 'row-1' });
  harness.dispatch('click', row);
  const header = createElement({ uiAction: 'call', uiCall: 'toggleExcelMenu', uiArgs: '["score", "$event"]' });
  harness.dispatch('click', header, { marker: 'evt-1' });
  // A click inside the filter menu (data-ui-stop) must not reach the header action.
  const menu = createElement({ uiStop: '' }, '', header);
  const checkbox = createElement({}, '', menu);
  const preventedInMenu = harness.dispatch('click', checkbox);
  harness.dispatch('input', createElement({ uiInput: 'call', uiCall: 'filterCheckboxList', uiArgs: '["$this"]' }, '语文'));
  // data-ui-self-only: backdrop clicks close the modal, clicks inside it do not.
  const backdrop = createElement({ uiAction: 'call', uiCall: 'Auth.closeLoginPortalModal', uiSelfOnly: '' });
  const insideModal = createElement({}, '', backdrop);
  const preventedInside = harness.dispatch('click', insideModal);
  harness.dispatch('click', backdrop);
  harness.dispatch('click', createElement({ uiAction: 'delete-current-exam-cloud-backup' }));
  harness.dispatch('click', createElement({ uiAction: 'scroll-into-view', uiTarget: 'anchor1' }));
  harness.dispatch('change', createElement({ uiChange: 'toggle-display-when', uiTarget: 'townSubExam3Wrap', uiWhen: '3' }, '3'));
  assert.strictEqual(harness.panels.townSubExam3Wrap.style.display, 'block', 'the third-period picker shows for 3 periods');
  harness.dispatch('change', createElement({ uiChange: 'toggle-display-when', uiTarget: 'townSubExam3Wrap', uiWhen: '3' }, '2'));
  assert.strictEqual(harness.panels.townSubExam3Wrap.style.display, 'none', 'and hides again for 2 periods');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(harness.calls)), [
    ['toggleStudentDetail', 'row-1'],
    ['toggleExcelMenu', 'score', 'evt-1'],
    ['filterCheckboxList', '语文'],
    ['Auth.closeLoginPortalModal'],
    ['deleteCurrentExamCloudBackup', 'DM'],
    ['scrollIntoView', 'smooth']
  ], '$this/$event placeholders, input calls, self-only backdrops and named actions should behave like the inline handlers they replaced');
  assert.strictEqual(preventedInMenu, false, 'clicks inside a data-ui-stop boundary keep their default action (checkbox toggles)');
  assert.strictEqual(preventedInside, false, 'clicks inside a self-only backdrop are not swallowed');
}

// Round trip through the shared uiDeclaredAttrs helper: hostile text must come
// back as plain data, and every runtime-rendered call must be allow-listed.
{
  const jsDir = path.join(root, 'public/assets/js');
  const files = fs.readdirSync(jsDir).filter((name) => name.endsWith('.js') && !/-[0-9a-f]{12}\.js$/.test(name));
  const usingFiles = files.filter((name) => /uiDeclaredAttrs\('(?:click|change|input)'/.test(fs.readFileSync(path.join(jsDir, name), 'utf8')));
  assert.ok(usingFiles.length >= 15, 'runtime modules should render declarative calls');
  // Literal data-ui-call attributes (used where a module has a single argument-free call,
  // e.g. report-render-runtime.js, to stay within its size budget) are allow-listed too.
  for (const name of files.filter((file) => file !== 'ui-actions-runtime.js')) {
    for (const match of fs.readFileSync(path.join(jsDir, name), 'utf8').matchAll(/data-ui-call="([^"$]+)"/g)) {
      assert.ok(new Set(Array.from(runtimeSource.match(/DECLARED_CALLS = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g), (m) => m[1])).has(match[1]),
        `${name}: data-ui-call="${match[1]}" is not in DECLARED_CALLS`);
    }
  }
  const runtimeAllowList = new Set(Array.from(runtimeSource.match(/DECLARED_CALLS = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g), (m) => m[1]));
  for (const name of usingFiles) {
    const source = fs.readFileSync(path.join(jsDir, name), 'utf8');
    // Modules load lazily and in any order, so each one carries the (idempotent) helper.
    assert.ok(/^var uiDeclaredAttrs = globalThis\.uiDeclaredAttrs \|\|/m.test(source), `${name} must define uiDeclaredAttrs before using it`);
    for (const match of source.matchAll(/uiDeclaredAttrs\('(?:click|change|input)', '([^']+)'/g)) {
      assert.ok(runtimeAllowList.has(match[1]), `${name}: ${match[1]} is not in DECLARED_CALLS`);
    }
  }
  const helperSource = fs.readFileSync(path.join(jsDir, usingFiles[0]), 'utf8').match(/^var uiDeclaredAttrs[\s\S]*?\n\}\);/m)[0];
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(helperSource, sandbox);
  const hostile = `O'Brien "x" <b>&amp;`;
  const markup = sandbox.uiDeclaredAttrs('click', 'jumpToStudent', hostile, 7, { gap: null });
  assert.ok(!/[<>]/.test(markup.replace(/^[^"]*"|"[^"]*$/g, '')) && !markup.includes("'"), 'attribute values must be fully escaped');
  const attrs = Object.fromEntries(Array.from(markup.matchAll(/([\w-]+)="([^"]*)"/g), (m) => [m[1], m[2]
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')]));
  assert.strictEqual(attrs['data-ui-action'], 'call');
  assert.deepStrictEqual(JSON.parse(attrs['data-ui-args']), [hostile, 7, { gap: null }], 'arguments survive the attribute round trip unchanged');
  assert.ok(sandbox.uiDeclaredAttrs('change', 'x').startsWith('data-ui-change="call"'), 'change triggers use data-ui-change');
}

// Every declared call in index.html must be in the runtime allow-list.
const allowList = new Set(Array.from(runtimeSource.match(/DECLARED_CALLS = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g), (m) => m[1]));
const used = Array.from(indexHtml.matchAll(/data-ui-call="([^"]+)"/g), (m) => m[1]);
assert.ok(used.length >= 45, 'index.html should use declarative calls for module actions');
used.forEach((name) => assert.ok(allowList.has(name), `data-ui-call="${name}" is not in DECLARED_CALLS`));
Array.from(indexHtml.matchAll(/data-ui-args='([^']*)'/g), (m) => m[1]).forEach((raw) => JSON.parse(raw));

console.log(`ui-actions declared call tests passed (${used.length} declared calls)`);
