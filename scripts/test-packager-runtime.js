const assert = require('assert');
const path = require('path');

const createPackagerRuntime = require(path.resolve(__dirname, '../public/assets/js/packager-runtime.js'));

function createBaseRoot(overrides = {}) {
    const alerts = [];
    const confirms = [];
    const loadingCalls = [];
    let createdBlob = null;
    let createdUrl = '';
    let clicked = false;
    let appendedCount = 0;
    let removedCount = 0;

    class MockBlob {
        constructor(parts, options) {
            this.parts = Array.isArray(parts) ? parts.slice() : [];
            this.type = options && options.type ? options.type : '';
            createdBlob = this;
        }
    }

    const linkEl = {
        href: '',
        download: '',
        click() {
            clicked = true;
        }
    };

    const documentElement = {
        outerHTML: `
            <div id="login-overlay" style="display:none;"></div>
            <div id="app" class="container"></div>
            <div id="admin-modal" class="modal" style="display:block;"></div>
            <div id="logout-btn">Logout</div>
            <button id="admin-panel-btn" onclick="x()"></button>
            <div id="global-loader" style="display:block;">Loading...</div>
            <script>window.EMBEDDED_DB = null;</script>
        `
    };

    const root = {
        RAW_DATA: [{ name: 'Alice' }],
        SCHOOLS: [{ name: 'Test School' }],
        SUBJECTS: ['语文'],
        THRESHOLDS: { excellent: 90 },
        TEACHER_MAP: { Alice: '语文' },
        TEACHER_SCHOOL_MAP: { Alice: 'Test School' },
        MY_SCHOOL: 'Test School',
        CONFIG: { version: 1 },
        Auth: { db: { parents: [{ name: 'P1' }], teachers: [] } },
        UI: {
            loading(show, text) {
                loadingCalls.push({ show: !!show, text: String(text || '') });
            }
        },
        alert(message) {
            alerts.push(String(message || ''));
        },
        confirm(message) {
            confirms.push(String(message || ''));
            return true;
        },
        setTimeout(fn) {
            if (typeof fn === 'function') fn();
            return 1;
        },
        Blob: MockBlob,
        URL: {
            createObjectURL(blob) {
                createdUrl = 'blob:mock-url';
                createdBlob = blob;
                return createdUrl;
            }
        },
        document: {
            documentElement,
            createElement(tag) {
                assert.strictEqual(tag, 'a');
                return linkEl;
            },
            body: {
                appendChild() {
                    appendedCount += 1;
                },
                removeChild() {
                    removedCount += 1;
                }
            }
        }
    };

    Object.assign(root, overrides);

    return {
        root,
        get alerts() {
            return alerts;
        },
        get confirms() {
            return confirms;
        },
        get loadingCalls() {
            return loadingCalls;
        },
        get createdBlob() {
            return createdBlob;
        },
        get createdUrl() {
            return createdUrl;
        },
        get clicked() {
            return clicked;
        },
        get appendedCount() {
            return appendedCount;
        },
        get removedCount() {
            return removedCount;
        },
        get linkEl() {
            return linkEl;
        }
    };
}

function run() {
    const emptyDataCtx = createBaseRoot({ RAW_DATA: [] });
    createPackagerRuntime(emptyDataCtx.root).exportDistributableHTML();
    assert.strictEqual(emptyDataCtx.alerts[0], '当前无成绩数据，无法生成分发版。');

    const noAccountCtx = createBaseRoot({ Auth: { db: { parents: [], teachers: [] } } });
    createPackagerRuntime(noAccountCtx.root).exportDistributableHTML();
    assert.strictEqual(noAccountCtx.alerts[0], '当前无账号信息，请先在账号管理中生成账号。');

    const cancelCtx = createBaseRoot({
        confirm() {
            return false;
        }
    });
    createPackagerRuntime(cancelCtx.root).exportDistributableHTML();
    assert.strictEqual(cancelCtx.loadingCalls.length, 0);
    assert.strictEqual(cancelCtx.alerts.length, 0);

    const successCtx = createBaseRoot();
    createPackagerRuntime(successCtx.root).exportDistributableHTML();

    assert.strictEqual(successCtx.loadingCalls.length, 2);
    assert.strictEqual(successCtx.loadingCalls[0].show, true);
    assert.strictEqual(successCtx.loadingCalls[1].show, false);
    assert.strictEqual(successCtx.createdUrl, 'blob:mock-url');
    assert.strictEqual(successCtx.appendedCount, 1);
    assert.strictEqual(successCtx.removedCount, 1);
    assert.strictEqual(successCtx.clicked, true);
    assert.strictEqual(successCtx.linkEl.href, 'blob:mock-url');
    assert.ok(String(successCtx.linkEl.download).includes('查分系统_分发版_'));
    assert.ok(successCtx.createdBlob);

    const html = String((successCtx.createdBlob.parts || []).join(''));
    assert.ok(html.includes('window.EMBEDDED_DB = {'));
    assert.ok(!html.includes('window.EMBEDDED_DB = null;'));
    assert.ok(html.includes('id="global-loader" class="hidden"'));
    assert.ok(successCtx.alerts.some((msg) => msg.includes('分发版已生成')));

    const badTemplateCtx = createBaseRoot({
        document: {
            documentElement: { outerHTML: '<div id="app"></div>' },
            createElement(tag) {
                assert.strictEqual(tag, 'a');
                return { href: '', download: '', click() {} };
            },
            body: {
                appendChild() {},
                removeChild() {}
            }
        }
    });
    const originalConsoleError = console.error;
    try {
        console.error = function () {};
        createPackagerRuntime(badTemplateCtx.root).exportDistributableHTML();
    } finally {
        console.error = originalConsoleError;
    }
    assert.ok(badTemplateCtx.alerts.some((msg) => msg.startsWith('打包失败:')));

    console.log('packager-runtime tests passed');
}

run();
