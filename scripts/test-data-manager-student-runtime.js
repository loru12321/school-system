const assert = require('assert');
const path = require('path');

const createDataManagerStudentRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-student-runtime.js'));

async function run() {
    const tbody = { innerHTML: '' };
    const headerBox = { indeterminate: false, checked: false };
    const countEl = { textContent: '' };
    const batchBtn = { disabled: true, style: { opacity: '0.6' } };
    const toasts = [];
    const alerts = [];
    const confirms = [];
    let currentBoxes = [];

    const root = {
        RAW_DATA: [
            { school: '一中', class: '701', name: '张三', id: '1001', total: 650 },
            { school: '一中', class: '701', name: '李四', id: '1002', total: 620 },
            { school: '二中', class: '801', name: '王五', id: '2001', total: 590 }
        ],
        UI: {
            toast(text, type) {
                toasts.push({ text, type });
            }
        },
        alert(message) {
            alerts.push(String(message || ''));
        },
        confirm(message) {
            confirms.push(String(message || ''));
            return true;
        },
        document: {
            querySelector(selector) {
                if (selector === '#dm-student-table tbody') return tbody;
                return null;
            },
            querySelectorAll(selector) {
                if (selector === '#dm-student-table tbody .dm-stu-select') return currentBoxes;
                return [];
            },
            getElementById(id) {
                if (id === 'dm-stu-select-all') return headerBox;
                if (id === 'dm-stu-selected-count') return countEl;
                if (id === 'dm-stu-batch-delete') return batchBtn;
                return null;
            }
        }
    };

    const runtime = createDataManagerStudentRuntime(root);
    let totalPages = 0;
    let renderCurrentTabCalls = 0;
    const manager = {
        pagination: { page: 1, size: 2, total: 0 },
        studentSelection: new Set([1]),
        updatePaginationUI(value) {
            totalPages = value;
        },
        updateStudentSelectionUI() {
            return runtime.updateStudentSelectionUI(this);
        },
        renderCurrentTab() {
            renderCurrentTabCalls += 1;
        }
    };

    runtime.renderStudents(manager, '');
    assert.strictEqual(manager.pagination.total, 3);
    assert.strictEqual(totalPages, 2);
    assert.ok(tbody.innerHTML.includes('张三'));
    assert.ok(tbody.innerHTML.includes('李四'));

    root.RAW_DATA[1].name = '<img src=x onerror=alert(1)>';
    runtime.renderStudents(manager, '');
    assert.ok(tbody.innerHTML.includes('&lt;img'), 'student cells must remain escaped after the fast unfiltered render path');
    root.RAW_DATA[1].name = '李四';

    currentBoxes = [
        { dataset: { idx: '0' }, checked: false },
        { dataset: { idx: '1' }, checked: false }
    ];
    runtime.updateStudentSelectionUI(manager);
    assert.strictEqual(currentBoxes[1].checked, true);
    assert.strictEqual(countEl.textContent, '已选 1 项');
    assert.strictEqual(batchBtn.disabled, false);

    runtime.toggleStudentSelection(manager, { dataset: { idx: '0' }, checked: true });
    assert.strictEqual(manager.studentSelection.has(0), true);

    runtime.renderStudents(manager, '李四');
    assert.strictEqual(manager.pagination.total, 1);
    assert.strictEqual(manager.studentSelection.has(0), false);
    assert.strictEqual(manager.studentSelection.has(1), true);
    assert.ok(tbody.innerHTML.includes('李四'));

    currentBoxes = [
        { dataset: { idx: '0' }, checked: false },
        { dataset: { idx: '1' }, checked: false }
    ];
    runtime.toggleStudentSelectAll(manager, true);
    assert.strictEqual(manager.studentSelection.has(0), true);
    assert.strictEqual(manager.studentSelection.has(1), true);
    runtime.toggleStudentSelectAll(manager, false);
    assert.strictEqual(manager.studentSelection.size, 0);

    manager.studentSelection = new Set([0, 2]);
    runtime.deleteSelectedStudents(manager);
    assert.strictEqual(root.RAW_DATA.length, 1);
    assert.strictEqual(root.RAW_DATA[0].name, '李四');
    assert.strictEqual(renderCurrentTabCalls > 0, true);
    assert.strictEqual(toasts.length > 0, true);
    assert.strictEqual(confirms.length, 1);

    manager.pagination.page = 1;
    runtime.changePage(manager, 1);
    assert.strictEqual(manager.pagination.page, 2);

    manager.studentSelection.clear();
    runtime.deleteSelectedStudents(manager);
    assert.strictEqual(alerts.length > 0, true);

    console.log('data-manager-student-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
