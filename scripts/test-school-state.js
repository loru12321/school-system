const assert = require('assert');
const path = require('path');

const createSchoolStateRuntime = require(path.resolve(__dirname, '../public/assets/js/school-state-runtime.js'));

function createMockStorage(initialState = {}) {
    const state = new Map(Object.entries(initialState));
    return {
        getItem(key) {
            return state.has(key) ? state.get(key) : null;
        },
        setItem(key, value) {
            state.set(key, String(value));
        },
        removeItem(key) {
            state.delete(key);
        }
    };
}

function run() {
    const root = {
        localStorage: createMockStorage({
            MY_SCHOOL: 'School A'
        })
    };

    const schoolState = createSchoolStateRuntime(root);

    assert.strictEqual(schoolState.getCurrentSchool(), 'School A');
    assert.deepStrictEqual(schoolState.snapshotSchoolState(), { currentSchool: 'School A' });

    schoolState.setCurrentSchool('School B');
    assert.strictEqual(root.MY_SCHOOL, 'School B');
    assert.strictEqual(root.localStorage.getItem('MY_SCHOOL'), 'School B');

    const synced = schoolState.syncSchoolState({ currentSchool: 'School C' });
    assert.deepStrictEqual(synced, { currentSchool: 'School C' });
    assert.strictEqual(schoolState.getCurrentSchool(), 'School C');

    schoolState.clearCurrentSchool();
    assert.strictEqual(schoolState.getCurrentSchool(), '');
    assert.strictEqual(root.localStorage.getItem('MY_SCHOOL'), null);

    console.log('school-state-runtime tests passed');
}

run();
