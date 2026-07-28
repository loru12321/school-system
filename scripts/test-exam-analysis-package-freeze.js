// 分析包冻结窗格的契约测试。
//
// 背景：vendored 的 xlsx 0.18.5 社区版**写出时不生成 <pane> 节点**（实测设 '!freeze'
// 后回读为 null），所以冻结是靠写出后改 sheet XML 注入实现的。这段逻辑很容易被
// 「看起来更干净」的重构误删，而删掉后导出物看不出报错、只是不再冻结——必须锁住。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/exam-analysis-package-runtime.js'), 'utf8');

// ── 1. 注入函数与调用点都必须在 ────────────────────────────────────────────────
assert.ok(/async function injectFreezePanes\(/.test(source),
    'the package runtime must keep the freeze-pane injector');
assert.ok(/await injectFreezePanes\(/.test(source),
    'addWorkbook must run the freeze-pane injector before writing into the zip');

// ── 2. 自闭合 <sheetView/> 必须被展开 ─────────────────────────────────────────
// xlsx 写出的是 <sheetView workbookViewId="0"/>。若只做「在标签后插入」，pane 会落到
// sheetView 外面，Excel 直接忽略——这个坑踩过，必须锁住展开分支。
assert.ok(/<sheetView\(\[\^>\]\*\)\\\/>/.test(source) || source.includes('<sheetView([^>]*)\\/>'),
    'the injector must handle the self-closing <sheetView/> form by expanding it');
assert.ok(/\$\{pane\}<\/sheetView>/.test(source),
    'the pane must be placed inside <sheetView>...</sheetView>, not after it');

// ── 3. 封面页不冻结（它不是数据表）──────────────────────────────────────────────
assert.ok(/FREEZE_SKIP_SHEETS/.test(source) && /'封面'/.test(source),
    'the cover sheet must be excluded from freezing');

// ── 4. 失败必须降级为原样导出，不能让整个分析包导不出来 ────────────────────────
assert.ok(/return arrayBuffer;/.test(source),
    'a freeze-injection failure must fall back to the untouched workbook');

// ── 5. 简化版 JSZip（单测替身）要静默跳过，不刷警告 ────────────────────────────
assert.ok(/typeof window\.JSZip\.loadAsync !== 'function'/.test(source),
    'the injector must detect stub JSZip implementations and skip quietly');

// ── 6. 实际行为验证：用真实 vendored xlsx + jszip 跑一遍注入 ────────────────────
// 这一条是真正的功能验证——上面几条只是源码结构断言。
(async () => {
    const vm = require('vm');
    const ctx = {
        console, Buffer, setTimeout, clearTimeout, Uint8Array, Date, Math, JSON,
        String, Number, Array, Object, Error, RegExp, Promise, TextDecoder, TextEncoder
    };
    ctx.global = ctx; ctx.window = ctx; ctx.self = ctx;
    vm.createContext(ctx);
    vm.runInContext(fs.readFileSync(path.join(root, 'public/assets/vendor/xlsx/xlsx.full.min.js'), 'utf8'), ctx);
    vm.runInContext(fs.readFileSync(path.join(root, 'public/assets/vendor/jszip/jszip.min.js'), 'utf8'), ctx);
    const { XLSX, JSZip } = ctx;

    assert.strictEqual(typeof JSZip.loadAsync, 'function',
        'the vendored JSZip must expose the static loadAsync used by the injector');

    // 前置确认：xlsx 自己确实不写 pane（若某天换库支持了，这条会提醒我们简化实现）。
    const probe = XLSX.utils.aoa_to_sheet([['a', 'b'], [1, 2]]);
    probe['!freeze'] = { xSplit: 0, ySplit: 1 };
    const probeWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(probeWb, probe, 't');
    const probeBuf = XLSX.write(probeWb, { bookType: 'xlsx', type: 'array', cellStyles: true });
    const probeZip = await JSZip.loadAsync(new Uint8Array(probeBuf));
    const probeXml = await probeZip.file('xl/worksheets/sheet1.xml').async('string');
    assert.ok(!/<pane /.test(probeXml),
        'xlsx 0.18.5 is expected NOT to emit <pane>; if this fails the injector may be redundant now');

    // 复刻注入逻辑，确认产出的 XML 结构合法且数据无损。
    // 注意用**新的 zip 实例**：复用上面那个已读过的实例会带上状态，导致回读为空
    // （踩过一次，误以为是数据丢失）。真实流程里 injectFreezePanes 也是新 load 一次。
    const pane = '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>';
    const workZip = await JSZip.loadAsync(new Uint8Array(probeBuf));
    const workXml = await workZip.file('xl/worksheets/sheet1.xml').async('string');
    const injected = workXml.replace(/<sheetView([^>]*)\/>/, `<sheetView$1>${pane}</sheetView>`);
    assert.ok(/<sheetView[^>]*><pane [^>]*\/><\/sheetView>/.test(injected),
        'injected XML must keep the pane inside sheetView');
    workZip.file('xl/worksheets/sheet1.xml', injected);
    const out = await workZip.generateAsync({ type: 'nodebuffer' });
    const reread = XLSX.read(new Uint8Array(out), { type: 'array' });
    assert.ok(/<pane /.test(injected), 'the injected XML must contain a pane node');
    // 用 JSON 序列化比较而不是 deepStrictEqual：xlsx 读回的数值不是原始字面量
    // （严格比较会失败，实测值其实完全正确），这里关心的是内容而非类型身份。
    assert.strictEqual(
        JSON.stringify(XLSX.utils.sheet_to_json(reread.Sheets[reread.SheetNames[0]], { header: 1 })),
        JSON.stringify([['a', 'b'], [1, 2]]),
        'cell data must survive the XML post-processing'
    );

    console.log('exam-analysis-package freeze contract passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
