const assert = require('assert');
const path = require('path');

const runtimePath = path.resolve(__dirname, '../public/assets/js/login-shell-state-runtime.js');
global.window = {};
require(runtimePath);

const properties = new Map();
const attributes = new Map();
const overlay = {
  style: {
    visibility: '',
    opacity: '',
    pointerEvents: '',
    setProperty(name, value, priority) {
      properties.set(name, { value, priority });
    }
  },
  dataset: {},
  setAttribute(name, value) {
    attributes.set(name, value);
  }
};

assert.strictEqual(window.LoginShellState.runtimeVersion, '1');
window.setLoginOverlayVisibility(overlay, false, { loginState: 'hidden', loginModal: 'hidden' });
assert.deepStrictEqual(properties.get('display'), { value: 'none', priority: 'important' });
assert.strictEqual(overlay.style.visibility, 'hidden');
assert.strictEqual(overlay.style.opacity, '0');
assert.strictEqual(overlay.style.pointerEvents, 'none');
assert.strictEqual(attributes.get('aria-hidden'), 'true');
assert.strictEqual(overlay.inert, true);
assert.strictEqual(overlay.dataset.loginState, 'hidden');
assert.strictEqual(overlay.dataset.loginModal, 'hidden');

window.setLoginOverlayVisibility(overlay, true, { loginState: 'active', loginModal: 'inline' });
assert.deepStrictEqual(properties.get('display'), { value: 'flex', priority: 'important' });
assert.strictEqual(attributes.get('aria-hidden'), 'false');
assert.strictEqual(overlay.inert, false);

console.log('login shell state runtime tests passed');
