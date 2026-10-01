const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const runtime = fs.readFileSync(path.join(root, 'public/assets/js/comparison-panel-collapse-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/assets/css/ux-review-2026.css'), 'utf8');
const fixture = `<section id="summary" class="section"><div class="analysis-shell-head">综合分析报告</div>
<div class="town-submodule-compare-panel" data-submodule="summary"><div><div data-compare-panel-title>综合评价总榜 多期对比</div><button id="generate">生成多期对比</button></div><div id="comparison-result"></div></div>
<div class="calculation-policy-strip">空分按 0 参与</div>
<details class="analysis-doc-panel"><summary>汇总口径与导出建议</summary><p>按原有权重计算</p></details>
<div class="analysis-table-meta">导出建议：表格适合留档和二次整理。</div>
<div id="summary-highlights"><div>本次决策摘要</div><ul><li class="summary-highlights-item">摘要一</li><li class="summary-highlights-item">摘要二</li></ul></div>
<div id="warning">缺少任课表</div><table id="results"><tbody><tr><td>203.30</td><td>3</td></tr></tbody></table></section>
<section id="teacher-analysis" class="section"><div class="analysis-shell-head">教师表现</div><div id="teacher-highlights" hidden></div></section>`;

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await page.route('http://localhost/auxiliary-test', route => route.fulfill({ body: fixture, contentType: 'text/html' }));
        async function mount() {
            await page.goto('http://localhost/auxiliary-test');
            await page.addStyleTag({ content: css });
            await page.evaluate(() => document.getElementById('generate').addEventListener('click', () => {
                document.getElementById('comparison-result').textContent = '对比结果';
            }));
            await page.addScriptTag({ content: runtime });
        }
        await mount();
        const bar = page.locator('#summary .analysis-auxiliary-toolbar');
        assert.equal(await bar.count(), 1, '辅助入口应集中为一行');
        assert.equal(await page.locator('#results').innerText(), '203.30\t3');
        assert.equal(await page.locator('#warning').isVisible(), true, '异常提示不能折叠');
        assert.equal(await page.locator('#generate').isVisible(), false);
        assert.equal(await page.locator('#summary-highlights').isVisible(), false);
        assert.equal(await page.locator('.calculation-policy-strip').isVisible(), false);
        assert.equal(await page.locator('.analysis-table-meta').isVisible(), false);
        assert.equal(await bar.innerText().then(t => t.includes('生成多期对比')), false, '标题不能混入操作按钮文案');
        await bar.getByRole('button', { name: '多期对比', exact: true }).click();
        await page.locator('#generate').click();
        assert.equal(await page.locator('#comparison-result').innerText(), '对比结果', '折叠不能破坏原按钮事件');
        await bar.getByRole('button', { name: '口径说明', exact: true }).click();
        assert.equal(await page.locator('.analysis-doc-panel p').isVisible(), true);
        assert.equal(await page.locator('.calculation-policy-strip').isVisible(), true);
        assert.equal(await page.locator('.analysis-table-meta').isVisible(), true);
        await bar.getByRole('button', { name: '分析摘要 · 2 条', exact: true }).focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('#summary-highlights').isVisible(), true);
        await mount();
        assert.equal(await page.locator('#generate').isVisible(), true, '刷新后应记住展开状态');
        assert.equal(await page.locator('#summary-highlights').isVisible(), true);
        await page.evaluate(() => {
            const target = document.getElementById('teacher-highlights');
            target.innerHTML = '<li class="summary-highlights-item">教师摘要</li>';
            target.hidden = false;
            window.dispatchEvent(new CustomEvent('school:decision-brief-render', { detail: { containerId: target.id } }));
        });
        assert.equal(await page.locator('#teacher-highlights').isVisible(), false, '其他模块不能继承本模块的展开状态');
        await page.setViewportSize({ width: 390, height: 844 });
        await bar.getByRole('button', { name: '多期对比', exact: true }).click();
        await bar.getByRole('button', { name: '口径说明', exact: true }).click();
        await bar.getByRole('button', { name: '分析摘要 · 2 条', exact: true }).click();
        assert.equal(await page.locator('#results').innerText(), '203.30\t3', '所有切换不得修改结果');
        const box = await bar.boundingBox();
        assert.ok(box.height <= 50, `手机端入口应紧凑，实际高度 ${box.height}`);
        await page.evaluate(() => {
            window.applyComparisonPanelCollapses();
            window.applyComparisonPanelCollapses();
        });
        assert.equal(await bar.count(), 1, '重复渲染不得重复创建入口');
        console.log('Auxiliary disclosure: default collapse, keyboard, persistence, module isolation, original actions and values passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
