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
        DEFAULT_MY_SCHOOL_NAME: '银山实验',
        localStorage: createMockStorage({
            MY_SCHOOL: 'School A'
        })
    };

    const schoolState = createSchoolStateRuntime(root);

    assert.strictEqual(schoolState.getCurrentSchool(), '银山实验');
    assert.deepStrictEqual(schoolState.snapshotSchoolState(), { currentSchool: '银山实验' });

    schoolState.setCurrentSchool('School B');
    assert.strictEqual(root.MY_SCHOOL, '银山实验');
    assert.strictEqual(root.localStorage.getItem('MY_SCHOOL'), '银山实验');

    const synced = schoolState.syncSchoolState({ currentSchool: 'School C' });
    assert.deepStrictEqual(synced, { currentSchool: '银山实验' });
    assert.strictEqual(schoolState.getCurrentSchool(), '银山实验');

    schoolState.clearCurrentSchool();
    assert.strictEqual(schoolState.getCurrentSchool(), '银山实验');
    assert.strictEqual(root.localStorage.getItem('MY_SCHOOL'), '银山实验');

    console.log('school-state-runtime tests passed');
}

run();
