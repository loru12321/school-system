const assert = require('assert');
const path = require('path');

const createDataManagerTabRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-tab-runtime.js'));

function run() {
    const renderCalls = [];
    const searchInput = { value: '  701  ' };
    const pageInfo = { innerText: '' };

    const runtime = createDataManagerTabRuntime({
        document: {
            getElementById(id) {
                if (id === 'dm-search-input') return searchInput;
                if (id === 'dm-page-info') return pageInfo;
                return null;
            }
        }
    });

    const manager = {
        currentTab: 'student',
        pagination: { page: 3 },
        renderStudents(keyword) {
            renderCalls.push(`student:${keyword}`);
        },
        renderTeachers() {
            renderCalls.push('teacher');
        },
        renderArchives() {
            renderCalls.push('archive');
        },
        renderParams() {
            renderCalls.push('params');
        },
        renderTargets() {
            renderCalls.push('targets');
        }
    };

    runtime.renderCurrentTab(manager);
    assert.deepStrictEqual(renderCalls, ['student:701']);

    manager.currentTab = 'teacher';
    runtime.renderCurrentTab(manager);
    manager.currentTab = 'archive';
    runtime.renderCurrentTab(manager);
    manager.currentTab = 'params';
    runtime.renderCurrentTab(manager);
    manager.currentTab = 'targets';
    runtime.renderCurrentTab(manager);
    assert.deepStrictEqual(renderCalls, ['student:701', 'teacher', 'archive', 'params', 'targets']);

    runtime.updatePaginationUI(manager, 9);
    assert.strictEqual(pageInfo.innerText, '3 / 9');

    console.log('data-manager-tab-runtime tests passed');
}

try {
    run();
} catch (error) {
    console.error(error);
    process.exit(1);
}
