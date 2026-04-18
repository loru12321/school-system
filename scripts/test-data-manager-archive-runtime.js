const assert = require('assert');
const path = require('path');

const createDataManagerArchiveRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-archive-runtime.js'));

async function run() {
    const tbody = { innerHTML: '' };
    const confirms = [];
    const toasts = [];
    let archiveState = {
        stu_1: [{ exam: '一模' }, { exam: '二模' }],
        stu_2: [{ exam: '一模' }],
        stu_3: [{ exam: '三模' }]
    };
    let loadCloudSnapshotsCalls = 0;
    let promptValue = '期末联考';

    const root = {
        UI: {
            toast(text, type) {
                toasts.push({ text, type });
            }
        },
        confirm(message) {
            confirms.push(String(message || ''));
            return true;
        },
        prompt() {
            return promptValue;
        },
        readHistoryArchiveState() {
            return archiveState;
        },
        setHistoryArchiveState(nextArchive) {
            archiveState = nextArchive;
            return archiveState;
        },
        document: {
            getElementById(id) {
                if (id === 'dm-history-tbody') return tbody;
                return null;
            }
        }
    };

    const runtime = createDataManagerArchiveRuntime(root);
    const manager = {
        currentTab: 'archive',
        loadCloudSnapshots() {
            loadCloudSnapshotsCalls += 1;
        },
        renderArchives() {
            return runtime.renderArchives(this);
        }
    };

    runtime.renderArchives(manager);
    assert.ok(tbody.innerHTML.includes('一模'));
    assert.ok(tbody.innerHTML.includes('2 条记录'));
    assert.ok(tbody.innerHTML.includes('二模'));
    assert.strictEqual(loadCloudSnapshotsCalls, 1);

    runtime.deleteHistoryExam(manager, '一模');
    assert.strictEqual(Object.keys(archiveState).includes('stu_2'), false);
    assert.strictEqual(archiveState.stu_1.length, 1);
    assert.strictEqual(archiveState.stu_1[0].exam, '二模');
    assert.strictEqual(toasts.length > 0, true);
    assert.strictEqual(confirms.length, 1);

    runtime.renameHistoryExam(manager, '二模');
    assert.strictEqual(archiveState.stu_1[0].exam, '期末联考');
    assert.ok(tbody.innerHTML.includes('期末联考'));

    promptValue = '';
    runtime.renameHistoryExam(manager, '期末联考');
    assert.strictEqual(archiveState.stu_1[0].exam, '期末联考');

    archiveState = {};
    runtime.renderArchives(manager);
    assert.ok(tbody.innerHTML.includes('暂无历史轨迹数据'));

    console.log('data-manager-archive-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
