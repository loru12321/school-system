const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

(async () => {
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
        await page.route('http://localhost/shell-test', route => route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }));
        async function mount() {
            await page.goto('http://localhost/shell-test');
            await page.evaluate(html => {
                const source = new DOMParser().parseFromString(html, 'text/html');
                const app = document.createElement('div'); app.id = 'app'; app.className = 'app-layout';
                app.append(source.getElementById('app-sidebar'));
                const main = document.createElement('main'); main.className = 'app-main';
                main.append(source.getElementById('main-header'));
                const overview = source.getElementById('shell-overview');
                overview.classList.add('is-navigation-compact');
                main.append(overview);
                const rail = overview.querySelector('#shell-module-rail');
                rail.innerHTML = ['准备状态','导入与设置','数据检查'].map((name,index)=>'<button class="shell-module-rail-chip'+(index===0?' is-active':'')+'"><span class="shell-module-rail-chip-copy"><span class="shell-module-rail-chip-title">'+name+'</span></span></button>').join('');
                const result = document.createElement('section'); result.id = 'test-data'; result.className = 'section active'; result.textContent = '203.30'; main.append(result);
                app.append(main); document.body.append(app);
                document.getElementById('sidebar-nav').innerHTML = ['本次必看','数据准备','联考评价','县域对标','教学改进','学生发展','教务执行'].map(t=>'<button class="sidebar-menu-item"><span class="sidebar-menu-item__main"><span class="sidebar-menu-item__icon">☆</span><span class="sidebar-menu-item__text"><span class="sidebar-menu-item__title">'+t+'</span><span class="sidebar-menu-item__meta">4 个模块</span></span></span></button>').join('');
                document.querySelector('[data-sidebar-toggle]').addEventListener('click',()=>window.toggleAppSidebar());
            }, read('src/index.html'));
            await page.addStyleTag({content:'*{box-sizing:border-box}.shell-toolbar-state-store{display:none} body{margin:0} #app.hidden,body.login-overlay-active #app,body[data-role="parent"] #app{display:none!important}'});
            await page.addStyleTag({content:read('src/assets/css/shell.css')});
            await page.addStyleTag({content:read('src/assets/css/product-redesign.css')});
            await page.addStyleTag({content:read('src/assets/css/ux-review-2026.css')});
            await page.addScriptTag({content:read('public/assets/js/workspace-rail-runtime.js')});
        }
        await mount();
        const sidebar = page.locator('#app-sidebar');
        assert.equal(Math.round((await sidebar.boundingBox()).width),80,'默认侧栏宽度应为80px');
        const labels = await page.locator('.sidebar-menu-item__title').evaluateAll(ns=>ns.map(e=>({width:e.clientWidth,needed:e.scrollWidth,visible:e.getBoundingClientRect().height>0})));
        assert.ok(labels.every(e=>e.visible&&e.width>=e.needed),'分类名称必须完整可见');
        const before=await page.locator('.app-main').boundingBox();
        await page.locator('[data-sidebar-toggle]').click();
        assert.equal(Math.round((await sidebar.boundingBox()).width),224);
        assert.deepEqual(await page.locator('.app-main').boundingBox(),before,'展开浮层不得挤动数据区');
        const backdropColor = await page.locator('#workspace-sidebar-backdrop').evaluate(e=>getComputedStyle(e).backgroundColor);
        assert.match(backdropColor,/rgba\([^,]+,[^,]+,[^,]+,\s*0\.[0-9]+\)/,'展开导航应保留半透明遮罩，正文仍可辨认');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('[data-sidebar-toggle]').getAttribute('aria-expanded'),'false');
        await page.locator('[data-sidebar-toggle]').click();
        await mount();
        assert.equal(Math.round((await sidebar.boundingBox()).width),224,'刷新后保留展开偏好');
        await page.locator('#workspace-sidebar-backdrop').click({position:{x:500,y:100}});
        assert.equal(Math.round((await sidebar.boundingBox()).width),80);
        const menu=page.locator('#shell-account-menu');
        await menu.locator('summary').click();
        assert.equal(await menu.getAttribute('open'),'');
        await page.keyboard.press('Escape');
        assert.equal(await menu.getAttribute('open'),null);
        assert.equal(await menu.locator('summary').evaluate(e=>e===document.activeElement),true);
        const overviewBox = await page.locator('#shell-overview').boundingBox();
        const sectionBox = await page.locator('#test-data').boundingBox();
        assert.ok(Math.abs(overviewBox.x-sectionBox.x)<=2,'分类标题与正文应共用左边线');
        assert.ok(overviewBox.height<=150,'标题与模块标签不应占去过多首屏高度');
        await menu.locator('summary').click();
        await page.locator('#test-data').click();
        assert.equal(await menu.getAttribute('open'),null);
        for (const state of ['hidden','login','parent','inline']) {
            await page.evaluate(state=>{
                const app=document.getElementById('app');
                app.classList.toggle('hidden',state==='hidden');
                document.body.classList.toggle('login-overlay-active',state==='login');
                document.body.dataset.role=state==='parent'?'parent':'admin';
                app.style.display=state==='inline'?'none':'';
            },state);
            assert.equal(await page.locator('#app').isVisible(),false,`布局不得覆盖隐藏状态: ${state}`);
        }
        await page.evaluate(()=>{document.getElementById('app').style.display='';});
        await page.evaluate(()=>{document.getElementById('main-header').style.display='none';});
        assert.equal(await page.locator('#main-header').isVisible(),false,'顶栏遵守视图主动隐藏');
        await page.evaluate(()=>{document.getElementById('main-header').style.display='';});
        await page.setViewportSize({width:390,height:844});
        await page.evaluate(()=>window.toggleAppSidebar());
        assert.equal(await sidebar.evaluate(e=>e.classList.contains('show-mobile')),true,'保留手机端菜单切换');
        assert.equal(await page.locator('#test-data').textContent(),'203.30');
        console.log('Compact shell: full labels, overlay geometry, keyboard, preference, account dismissal and mobile switching passed.');
    } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
