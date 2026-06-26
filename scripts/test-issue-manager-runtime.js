const assert = require('assert');
const path = require('path');

const createIssueManagerRuntime = require(path.resolve(__dirname, '../public/assets/js/issue-manager-runtime.js'));

function createClassList(initial = []) {
    const state = new Set(initial);
    return {
        add(name) {
            state.add(String(name));
        },
        remove(name) {
            state.delete(String(name));
        },
        has(name) {
            return state.has(String(name));
        }
    };
}

function createQueryRecorder(result) {
    const calls = [];
    const query = {
        select(fields, options) {
            calls.push({ method: 'select', fields, options });
            return query;
        },
        eq(field, value) {
            calls.push({ method: 'eq', field, value });
            return query;
        },
        ilike(field, value) {
            calls.push({ method: 'ilike', field, value });
            return query;
        },
        then(resolve, reject) {
            return Promise.resolve(result).then(resolve, reject);
        }
    };
    return { query, calls };
}

async function run() {
    const badge = {
        innerText: '',
        classList: createClassList(['hidden'])
    };

    const issuesQuery = createQueryRecorder({ count: 3, error: null });
    const root = {
        document: {
            hidden: false,
            getElementById(id) {
                if (id === 'msg-badge') return badge;
                return null;
            }
        },
        Auth: {
            currentUser: {
                role: 'class_teacher',
                class: '701',
                school: '测试学校'
            }
        },
        sbClient: {
            from(table) {
                assert.strictEqual(table, 'issues');
                return issuesQuery.query;
            }
        }
    };

    const runtime = createIssueManagerRuntime(root);
    await runtime.checkIssues();

    assert.strictEqual(badge.innerText, '3');
    assert.strictEqual(badge.classList.has('hidden'), false);
    assert.ok(issuesQuery.calls.some((entry) => entry.method === 'eq' && entry.field === 'status' && entry.value === 'pending'));
    assert.ok(issuesQuery.calls.some((entry) => entry.method === 'eq' && entry.field === 'student_class' && entry.value === '701'));

    const hiddenBadge = {
        innerText: '',
        classList: createClassList([])
    };
    const zeroCountQuery = createQueryRecorder({ count: 0, error: null });
    const rootWithZeroCount = {
        ...root,
        document: {
            hidden: false,
            getElementById(id) {
                if (id === 'msg-badge') return hiddenBadge;
                return null;
            }
        },
        sbClient: {
            from() {
                return zeroCountQuery.query;
            }
        }
    };

    const runtimeWithZeroCount = createIssueManagerRuntime(rootWithZeroCount);
    await runtimeWithZeroCount.checkIssues();
    assert.strictEqual(hiddenBadge.classList.has('hidden'), true);

    const localFileQuery = createQueryRecorder({ count: 1, error: null });
    const runtimeForLocalFile = createIssueManagerRuntime({
        ...root,
        location: { protocol: 'file:' },
        sbClient: {
            from() {
                return localFileQuery.query;
            }
        }
    });
    await runtimeForLocalFile.checkIssues();
    assert.deepStrictEqual(localFileQuery.calls, [], 'file:// lt.html should not poll Supabase issues directly');

    console.log('issue-manager-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
