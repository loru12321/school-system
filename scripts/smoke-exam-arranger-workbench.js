try {
    require.resolve('playwright');
} catch (error) {
    console.error('playwright is required for exam arranger smoke');
    process.exit(1);
}

const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'http://127.0.0.1:4173/';
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    console.error('[exam-smoke] browser-ready');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    console.error('[exam-smoke] page-loaded');
    await page.waitForSelector('#exam-arranger', { state: 'attached', timeout: 30000 });
    console.error('[exam-smoke] markup-ready');
    await page.evaluate(() => {
        document.getElementById('login-overlay')?.remove();
        const app = document.getElementById('app');
        app?.classList.remove('hidden');
        const section = document.getElementById('exam-arranger');
        section?.classList.add('active');
        if (section) section.style.display = 'block';
    });
    for (const asset of [
        '/assets/vendor/xlsx-js-style/xlsx.min.js',
        '/assets/vendor/jszip/jszip.min.js',
        '/assets/js/exam-arranger-core-runtime.js',
        '/assets/js/exam-arranger-docx-runtime.js',
        '/assets/js/exam-arranger-export-runtime.js',
        '/assets/js/exam-arranger-runtime.js'
    ]) { console.error(`[exam-smoke] loading ${asset}`); await page.addScriptTag({ url: new URL(asset, url).toString() }); }
    console.error('[exam-smoke] runtimes-ready');
    await page.evaluate(() => {
        window.ExamArranger?.init?.();
        const section = document.getElementById('exam-arranger');
        if (section) { section.hidden = false; section.style.display = 'block'; }
        const panel = document.getElementById('exam-step-import');
        if (panel) panel.hidden = false;
    });
    await page.waitForFunction(() => !!window.ExamArranger && !!document.querySelector('.exam-arranger-workbench'), null, { timeout: 30000 });
    await page.waitForSelector('#exam-step-import', { state: 'attached', timeout: 30000 });
    const initial = await page.evaluate(() => ({
        title: document.querySelector('#exam-arranger h2')?.textContent?.trim(),
        steps: document.querySelectorAll('.exam-step').length,
        folderAction: !!document.querySelector('[data-exam-action="pick-folder"]'),
        fileInput: !!document.querySelector('#examFileInput'),
        privacy: document.querySelector('.exam-privacy-chip')?.textContent?.trim()
    }));
    assert.equal(initial.steps, 4);
    assert.ok(initial.folderAction && initial.fileInput);
    assert.ok(initial.privacy.includes('本地'));
    await page.evaluate(() => document.querySelector('[data-exam-action="set-step"][data-exam-step="4"]')?.click());
    await page.waitForSelector('#exam-step-output', { state: 'attached', timeout: 30000 });
    const output = await page.evaluate(() => ({
        outputCards: document.querySelectorAll('#exam-output-center .exam-output-card').length,
        publicPreview: document.querySelector('#exam-output-preview-table')?.textContent?.includes('成绩') === false
    }));
    assert.equal(output.outputCards, 4);
    assert.equal(output.publicPreview, true);
    await browser.close();
    console.log(JSON.stringify({ ok: true, contract: 'exam-arranger-workbench-smoke', initial, output }, null, 2));
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
