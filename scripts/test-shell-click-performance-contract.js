const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/shell-runtime.js'), 'utf8');
const activateStart = source.indexOf('function activateSubmodule(item, category)');
const activateEnd = source.indexOf('function activateCurrentCategoryDefaultModule', activateStart);
const activateSource = source.slice(activateStart, activateEnd);

assert.ok(activateSource.includes('syncSubNavigationActiveState(item.id)'), 'submodule click must update its selected state immediately');
assert.ok(!activateSource.includes('renderSubNavigation();'), 'submodule click must not synchronously rebuild the full sub-navigation');
assert.ok(!activateSource.includes('updateShellChrome(item.id);'), 'submodule click must not duplicate switchTab shell synchronization');
assert.ok(source.includes('globalScopeControlsCache.classesSignature'), 'global scope class options must be cached across module clicks');

console.log('shell click performance contract passed');
