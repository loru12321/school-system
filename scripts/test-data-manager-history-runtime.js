const assert = require('assert');
const path = require('path');

const createAuthStateRuntime = require(path.resolve(__dirname, '../public/assets/js/auth-state-runtime.js'));
const createDataManagerHistoryRuntime = require(path.resolve(__dirname, '../public/assets/js/data-manager-history-runtime.js'));

function waitTick() {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

async function run() {
    const alerts = [];
    let silentMatchCalls = 0;
    let cloudSyncCalls = 0;
    let statusRenders = 0;
    let previewRenders = 0;
    let savedRows = [];

    class FakeFileReader {
        readAsArrayBuffer() {
            setTimeout(() => {
                if (typeof this.onload === 'function') {
                    this.onload({ target: { result: new ArrayBuffer(16) } });
                }
            }, 0);
        }
    }

    const historyStatusEl = { innerHTML: '', style: {} };
    const previewBodyEl = { innerHTML: '' };
    const previewTownHeaderEl = { innerHTML: '', innerText: '' };

    const root = {
        FileReader: FakeFileReader,
        XLSX: {
            read() {
                return {
                    SheetNames: ['测试学校'],
                    Sheets: { 测试学校: {} }
                };
            },
            utils: {
                sheet_to_json() {
                    return [
                        { 姓名: '张三', 班级: '六年级10班', 总分: 420, 语文: 110, 数学: 110, 英语: 100, 物理: 100 },
                        { 姓名: '李四', 班级: '6.10班', 语文: 106, 数学: '', 英语: 95, 物理: 95 }
                    ];
                }
            }
        },
        SUBJECTS: [],
        sortSubjects(a, b) {
            return String(a || '').localeCompare(String(b || ''), 'zh-CN');
        },
        CONFIG: { name: '2026中考' },
        setPrevDataState(rows) {
            savedRows = Array.isArray(rows) ? rows : [];
            root.PREV_DATA = savedRows;
        },
        document: {
            getElementById(id) {
                if (id === 'dm-history-status') return historyStatusEl;
                return null;
            },
            querySelector(selector) {
                if (selector === '#dm-history-preview-table tbody') return previewBodyEl;
                if (selector === '#dm-history-preview-table th:last-child') return previewTownHeaderEl;
                return null;
            }
        },
        performSilentMatching() {
            silentMatchCalls += 1;
        },
        saveCloudData() {
            cloudSyncCalls += 1;
            return Promise.resolve(true);
        },
        UI: {
            alert(text) {
                alerts.push(String(text || ''));
            }
        }
    };
    root.AuthState = createAuthStateRuntime(root);

    const runtime = createDataManagerHistoryRuntime(root);
    const manager = {
        renderHistoryPreview() {
            previewRenders += 1;
            return runtime.renderHistoryPreview(this);
        },
        renderDataManagerStatus() {
            statusRenders += 1;
        }
    };

    const input = { files: [{ name: 'history.xlsx' }], value: 'selected' };
    runtime.handleHistoryUpload(manager, input);
    await waitTick();
    await waitTick();

    assert.strictEqual(savedRows.length, 2);
    assert.deepStrictEqual(savedRows.map((row) => row.class), ['6.10', '6.10']);
    assert.strictEqual(savedRows[0].scores.数学, 110);
    assert.strictEqual(savedRows[1].scores.数学, 0);
    assert.strictEqual(savedRows[1].scores.语文, 106);
    assert.strictEqual(savedRows[1].total, 296);
    assert.strictEqual(savedRows[0].townRank, 1);
    assert.strictEqual(savedRows[1].townRank, 2);
    assert.ok(savedRows[0].schoolRank >= 1);
    assert.ok(savedRows[0].classRank >= 1);
    assert.ok(String(historyStatusEl.innerHTML).includes('已加载 2 条'));
    assert.strictEqual(previewRenders, 1);
    assert.strictEqual(statusRenders, 1);
    assert.strictEqual(silentMatchCalls, 1);
    assert.strictEqual(cloudSyncCalls, 1);
    assert.strictEqual(input.value, '');
    assert.strictEqual(alerts.some((msg) => msg.includes('导入成功')), true);
    assert.ok(String(previewBodyEl.innerHTML).includes('测试学校'));
    assert.ok(String(previewTownHeaderEl.innerHTML).includes('单校已隐藏'));

    root.PREV_DATA = [
        { school: '甲校', class: '701', name: '甲', total: 400, schoolRank: 1, townRank: 1 },
        { school: '乙校', class: '701', name: '乙', total: 390, schoolRank: 1, townRank: 2 }
    ];
    runtime.renderHistoryPreview(manager);
    assert.strictEqual(previewTownHeaderEl.innerText, '全镇排名');

    const beforeCalls = cloudSyncCalls;
    runtime.handleHistoryUpload(manager, { files: [] });
    await waitTick();
    assert.strictEqual(cloudSyncCalls, beforeCalls);

    console.log('data-manager-history-runtime tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
