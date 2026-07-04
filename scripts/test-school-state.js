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

    assert.strictEqual(schoolState.getCurrentSchool(), 'School A');
    assert.deepStrictEqual(schoolState.snapshotSchoolState(), { currentSchool: 'School A' });

    schoolState.setCurrentSchool('School B');
    assert.strictEqual(root.MY_SCHOOL, 'School B');
    assert.strictEqual(root.localStorage.getItem('MY_SCHOOL'), 'School B');

    const synced = schoolState.syncSchoolState({ currentSchool: 'School C' });
    assert.deepStrictEqual(synced, { currentSchool: 'School C' });
    assert.strictEqual(schoolState.getCurrentSchool(), 'School C');

    schoolState.clearCurrentSchool();
    assert.strictEqual(schoolState.getCurrentSchool(), '银山实验');
    assert.strictEqual(root.localStorage.getItem('MY_SCHOOL'), '银山实验');

    const aliasRoot = {
        DEFAULT_MY_SCHOOL_NAME: '银山实验',
        localStorage: createMockStorage({
            MY_SCHOOL: '银山实验'
        }),
        SCHOOLS: {
            银山实验学校: { name: '银山实验学校', students: [{ name: '甲' }] },
            梯门中学: { name: '梯门中学', students: [] }
        },
        areSchoolNamesEquivalent(left, right) {
            const normalize = (value) => String(value || '').replace(/学校$/u, '').trim();
            return normalize(left) === normalize(right);
        }
    };
    const aliasState = createSchoolStateRuntime(aliasRoot);
    assert.strictEqual(aliasState.getCurrentSchool(), '银山实验学校');
    assert.strictEqual(aliasRoot.MY_SCHOOL, '银山实验学校');
    assert.strictEqual(aliasRoot.localStorage.getItem('MY_SCHOOL'), '银山实验学校');

    console.log('school-state-runtime tests passed');
}

run();
