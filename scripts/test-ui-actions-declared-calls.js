// Behavioural test for the data-ui-action="call" / data-ui-change="call"
// delegate that replaced the inline onclick/onchange handlers in index.html.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const runtimeSource = fs.readFileSync(path.join(root, 'public/assets/js/ui-actions-runtime.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');

function createElement(dataset, value = '') {
  const element = {
    dataset,
    value,
    closest(selector) {
      const match = /^\[data-ui-(action|change|input|enter)\]$/.exec(selector);
      if (!match) return null;
      const key = { action: 'uiAction', change: 'uiChange', input: 'uiInput', enter: 'uiEnter' }[match[1]];
      return dataset[key] ? element : null;
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
    CloudManager: { loadTeachers: (options) => calls.push(['CloudManager.loadTeachers', options]) }
  };
  const document = { addEventListener: (type, handler) => { listeners[type] = handler; } };
  const context = { window, document, console: { warn: () => {}, log: () => {} }, localStorage: { setItem() {} } };
  vm.createContext(context);
  vm.runInContext(runtimeSource, context);
  const dispatch = (type, target) => {
    let prevented = false;
    listeners[type]({ target, key: '', preventDefault: () => { prevented = true; } });
    return prevented;
  };
  return { calls, dispatch };
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

// Every declared call in index.html must be in the runtime allow-list.
const allowList = new Set(Array.from(runtimeSource.match(/DECLARED_CALLS = new Set\(\[([\s\S]*?)\]\)/)[1].matchAll(/'([^']+)'/g), (m) => m[1]));
const used = Array.from(indexHtml.matchAll(/data-ui-call="([^"]+)"/g), (m) => m[1]);
assert.ok(used.length >= 45, 'index.html should use declarative calls for module actions');
used.forEach((name) => assert.ok(allowList.has(name), `data-ui-call="${name}" is not in DECLARED_CALLS`));
Array.from(indexHtml.matchAll(/data-ui-args='([^']*)'/g), (m) => m[1]).forEach((raw) => JSON.parse(raw));

console.log(`ui-actions declared call tests passed (${used.length} declared calls)`);
