const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const runtime = fs.readFileSync(path.join(root, 'public/assets/js/comparison-panel-collapse-runtime.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src/assets/css/ux-review-2026.css'), 'utf8');
const fixture = `<div id="app"><section id="summary" class="section"><div class="analysis-shell-head">综合分析报告</div>
<div class="town-submodule-compare-panel" data-submodule="summary"><div><div data-compare-panel-title>综合评价总榜 多期对比</div><button id="generate">生成多期对比</button></div><div id="comparison-result"></div></div>
<div class="calculation-policy-strip">空分按 0 参与</div>
<details class="analysis-doc-panel"><summary>汇总口径与导出建议</summary><p>按原有权重计算</p></details>
<div class="analysis-table-meta">导出建议：表格适合留档和二次整理。</div>
<div id="summary-highlights"><div>本次决策摘要</div><ul><li class="summary-highlights-item">摘要一</li><li class="summary-highlights-item">摘要二</li></ul></div>
<div id="warning">缺少任课表</div><table id="results"><tbody><tr><td>203.30</td><td>3</td></tr></tbody></table></section>
<section id="teacher-analysis" class="section"><div class="analysis-shell-head">教师表现</div><div id="teacher-highlights" hidden></div></section>
<section id="high-score" class="section"><div class="analysis-shell-head">高分段<div class="analysis-action-note">导出后便于留档</div><button id="export">导出</button></div><div class="analysis-flow-banner">第一步 查看排名</div><div class="analysis-table-meta">阅读建议：先看人数</div><div id="live-count" class="analysis-table-meta">有效人数：333</div><div class="info-bar" role="alert">缺少历史成绩</div><input id="filter" value="9"><table><tr><td>490</td></tr></table></section>
<section id="student-details" class="section"><div class="analysis-shell-head">学生明细</div><div class="student-details-secondary-flow"><h3>学生多期对比</h3><div class="analysis-inline-panel"><button id="studentCompare">生成对比</button></div><p>用于查看多期变化</p></div><table id="student-table"><tr><td>学生成绩</td></tr></table></section>
<section id="report-generator" class="section"><div class="analysis-shell-head">成绩单</div><div class="report-query-copy">让学生看到真实定位</div><input id="student-query"></section>
<section id="grade-scheduler" class="section"><div class="analysis-shell-head">排课</div><div class="constraints-box"><input id="constraint" value="3"></div><button id="schedule">开始排课</button></section>
<section id="shell-overview"><p id="shell-category-desc">分类介绍</p><div id="shell-workflow-path">工作流说明</div><div id="shell-module-rail-shell"><div class="shell-module-rail-meta"></div><div id="shell-module-rail"><button class="shell-module-rail-chip" aria-current="page"><span class="shell-module-rail-chip-hint">很长的模块介绍</span>学生明细</button></div></div></section></div>`;

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
        await page.route('http://localhost/auxiliary-test', route => route.fulfill({ body: fixture, contentType: 'text/html; charset=utf-8' }));
        async function mount() {
            await page.goto('http://localhost/auxiliary-test');
            await page.addStyleTag({ content: css });
            await page.addStyleTag({ content: '#high-score .analysis-flow-banner { display: grid !important; }' });
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
        assert.equal(await page.locator('#summary .analysis-table-meta').isVisible(), false);
        assert.equal(await bar.innerText().then(t => t.includes('生成多期对比')), false, '标题不能混入操作按钮文案');
        assert.equal(await page.locator('#high-score .analysis-flow-banner').isVisible(), false, '其他模块的步骤说明也应收起');
        assert.equal(await page.locator('#high-score .analysis-action-note').isVisible(), false);
        assert.equal(await page.locator('#high-score .analysis-table-meta').first().isVisible(), false);
        assert.equal(await page.locator('#live-count').isVisible(), true, '动态数据摘要不能被当成说明隐藏');
        assert.equal(await page.locator('[role="alert"]').isVisible(), true);
        assert.equal(await page.locator('#filter').isVisible(), true);
        assert.equal(await page.locator('#export').isVisible(), true);
        await page.locator('#high-score').getByRole('button', {name:'口径说明', exact:true}).click();
        assert.equal(await page.locator('#high-score .analysis-flow-banner').isVisible(), true);
        assert.equal(await page.locator('#high-score .analysis-table-meta').first().isVisible(), true);
        assert.equal(await page.locator('#student-details .student-details-secondary-flow').isVisible(), false, '多期对比的外层标题和提示也要一起收起');
        assert.equal(await page.locator('#student-details .analysis-auxiliary-toggle').count(), 1);
        await page.locator('#student-details .analysis-auxiliary-toggle').click();
        assert.equal(await page.locator('#studentCompare').isVisible(), true, '不能对嵌套对比重复折叠');
        assert.equal(await page.locator('#student-table').isVisible(), true);
        assert.equal(await page.locator('.report-query-copy').isVisible(), false);
        assert.equal(await page.locator('#student-query').isVisible(), true);
        assert.equal(await page.locator('#constraint').isVisible(), false);
        await page.getByRole('button', {name:'高级设置', exact:true}).click();
        assert.equal(await page.locator('#constraint').inputValue(), '3');
        assert.equal(await page.locator('#schedule').isVisible(), true);
        assert.equal(await page.locator('#shell-category-desc').isVisible(), false);
        assert.equal(await page.locator('.shell-module-rail-chip').isVisible(), true, '精简导航必须保留直接切换入口');
        await page.getByRole('button', {name:'展开导航', exact:true}).click();
        assert.equal(await page.locator('#shell-category-desc').isVisible(), true);
        await bar.getByRole('button', { name: '多期对比', exact: true }).click();
        await page.locator('#generate').click();
        assert.equal(await page.locator('#comparison-result').innerText(), '对比结果', '折叠不能破坏原按钮事件');
        await bar.getByRole('button', { name: '口径说明', exact: true }).click();
        assert.equal(await page.locator('.analysis-doc-panel p').isVisible(), true);
        assert.equal(await page.locator('.calculation-policy-strip').isVisible(), true);
        assert.equal(await page.locator('#summary .analysis-table-meta').isVisible(), true);
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
        assert.equal(await bar.isVisible(), true, '重新渲染后必须保留展开入口');
        await page.evaluate(() => { document.getElementById('app').id = 'apk-mobile-shell'; });
        await page.addStyleTag({ content: '#summary .analysis-table-meta { display: grid !important; }' });
        assert.equal(await page.locator('#summary .analysis-table-meta').isVisible(), false, '移入手机端独立外壳后仍须覆盖旧网格样式');
        for (let i = 0; i < 2; i++) {
            await bar.getByRole('button', { name: '口径说明', exact: true }).click();
            assert.equal(await page.locator('#summary .analysis-table-meta').isVisible(), true);
            await bar.getByRole('button', { name: '口径说明', exact: true }).click();
            await page.evaluate(() => window.applyComparisonPanelCollapses());
            assert.equal(await bar.isVisible(), true);
            assert.equal(await page.locator('#summary .analysis-table-meta').isVisible(), false);
        }
        // Exercise every real module, including lazy templates, without executing
        // application scripts or connecting to cloud data.
        const source = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
        await page.evaluate(html => {
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const sections = [...doc.querySelectorAll('.section[id]')];
            const mounts = sections.map(section => {
                const template = doc.getElementById(section.dataset.lazySectionTemplate);
                return template
                    ? new DOMParser().parseFromString(template.textContent, 'text/html').querySelector('.section')
                    : section;
            }).filter(Boolean);
            document.body.replaceChildren(...mounts);
            mounts.forEach(section => { section.hidden = false; section.style.display = 'block'; });
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key.startsWith('school:auxiliary:')) localStorage.removeItem(key);
            }
            window.applyComparisonPanelCollapses();
        }, source);
        const catalog = await page.evaluate(() => {
            const sections = [...document.querySelectorAll('.section')];
            return {
                modules: sections.length,
                decorated: sections.filter(s => s.querySelector('.analysis-auxiliary-toolbar')).length,
                remainingGuidance: [...document.querySelectorAll('.analysis-flow-banner, .analysis-action-note, .report-query-copy')]
                    .filter(e => !e.classList.contains('is-auxiliary-collapsed') && !e.closest('.is-auxiliary-collapsed'))
                    .map(e => e.closest('.section')?.id),
                guidance: document.querySelectorAll('.analysis-auxiliary-guidance').length
            };
        });
        assert.ok(catalog.modules >= 25 && catalog.decorated >= 23, JSON.stringify(catalog));
        assert.deepEqual(catalog.remainingGuidance, []);
        const tablesBefore = await page.locator('.section table').allTextContents();
        const valuesBefore = await page.locator('.section input, .section select, .section textarea').evaluateAll(nodes => nodes.map(n => n.value));
        await page.evaluate(() => document.querySelectorAll('.analysis-auxiliary-toggle').forEach(button => {
            button.click(); button.click();
        }));
        assert.deepEqual(await page.locator('.section table').allTextContents(), tablesBefore);
        assert.deepEqual(await page.locator('.section input, .section select, .section textarea').evaluateAll(nodes => nodes.map(n => n.value)), valuesBefore);
        console.log('Module catalog: ' + JSON.stringify(catalog));
        console.log('Auxiliary disclosure: default collapse, keyboard, persistence, module isolation, original actions and values passed.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
