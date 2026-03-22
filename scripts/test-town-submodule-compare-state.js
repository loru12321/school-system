const assert = require('assert');
const path = require('path');

const createRuntime = require(path.resolve(__dirname, '../public/assets/js/town-submodule-compare-state-runtime.js'));

const root = {};
const runtime = createRuntime(root);

assert.deepStrictEqual(runtime.snapshotTownSubmoduleCompareState(), {
    townSubmoduleCompareCache: {}
});

assert.deepStrictEqual(runtime.getTownSubmoduleCompareCache(), {});
assert.strictEqual(runtime.getTownSubmoduleCompareEntry('summary'), null);

runtime.setTownSubmoduleCompareEntry('summary', { school: '测试学校', examIds: ['A', 'B'] });
assert.deepStrictEqual(runtime.getTownSubmoduleCompareEntry('summary'), { school: '测试学校', examIds: ['A', 'B'] });

runtime.setTownSubmoduleCompareEntry('analysis', { school: '测试学校', examIds: ['B', 'C'] });
assert.deepStrictEqual(runtime.getTownSubmoduleCompareCache(), {
    summary: { school: '测试学校', examIds: ['A', 'B'] },
    analysis: { school: '测试学校', examIds: ['B', 'C'] }
});

runtime.syncTownSubmoduleCompareState({
    townSubmoduleCompareCache: {
        bottom3: { school: '底部学校', examIds: ['X', 'Y'] }
    }
});
assert.deepStrictEqual(runtime.getTownSubmoduleCompareCache(), {
    bottom3: { school: '底部学校', examIds: ['X', 'Y'] }
});

runtime.clearTownSubmoduleCompareState();
assert.deepStrictEqual(runtime.getTownSubmoduleCompareCache(), {});

console.log('town-submodule-compare-state-runtime tests passed');
