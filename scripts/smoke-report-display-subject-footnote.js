// 个人报告会被打印或导出 PDF 交给家长，纸面上没有 tooltip。政治那一行带着班排、
// 校排、镇排，如果没有可见说明，家长容易把它当成本次中考的科目成绩。
//
// scripts/test-exam-analysis-package-politics.js 只能 grep 源码文本，抓不住渲染
// 层面的回归（脚注被 CSS 隐藏、注入点被挪走、条件判断写反都照样过）。所以这里走
// 真实入口（报告页 #inp-name + window.doQuery）确认脚注是页面上可见的文本。
const assert = require('assert');

try {
    require.resolve('playwright');
} catch (_) {
    throw new Error('playwright is required for report display subject footnote smoke');
}

const { chromium } = require('playwright');

async function enterWorkspace(page) {
    await page.goto(process.env.SMOKE_URL || 'https://schoolsystem.com.cn/', {
        waitUntil: 'commit',
        timeout: 90000
    });
    await page.waitForFunction(
        () => !!document.getElementById('login-overlay') || !!document.getElementById('app'),
        { timeout: 90000 }
    );

    const workspaceReady = () => {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        return (!overlay || getComputedStyle(overlay).display === 'none')
            && !!app
            && getComputedStyle(app).display !== 'none'
            && !app.classList.contains('hidden');
    };

    // 冷启动可能已经从本地恢复过会话，那就不必再走一次登录表单。
    const alreadyIn = await page.evaluate(workspaceReady).catch(() => false);
    if (!alreadyIn) {
        await page.waitForSelector('#login-user', { state: 'visible', timeout: 45000 });
        await page.fill('#login-user', process.env.SMOKE_USER || 'admin');
        await page.fill('#login-pass', process.env.SMOKE_PASS || 'admin123');
        await page.click('#login-submit-button, [data-login-submit]');
    }

    await page.waitForFunction(workspaceReady, { timeout: 90000 });
    await page.waitForFunction(
        () => Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0,
        { timeout: 90000 }
    );
    await page.waitForFunction(
        () => typeof window.switchTab === 'function' && typeof window.doQuery === 'function',
        { timeout: 30000 }
    );
}

// 读报告卡片里以「注：」开头的可见行。用 innerText 而不是 innerHTML，
// 这样被 display:none 隐藏的脚注不会被误判为通过。
async function renderAndReadFootnote(page, name) {
    await page.evaluate((studentName) => {
        const input = document.getElementById('inp-name');
        if (input) {
            input.value = studentName;
            input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (typeof window.doQuery === 'function') window.doQuery();
    }, name);

    await page.waitForFunction(() => {
        const table = document.querySelector('#tb-query');
        return !!table && table.querySelectorAll('tbody tr').length > 0;
    }, { timeout: 45000 });
    await page.waitForTimeout(1200);

    return page.evaluate(() => {
        const table = document.querySelector('#tb-query');
        const card = table ? table.closest('.student-report-table-card') : null;
        const cardText = card ? (card.innerText || card.textContent || '') : '';
        return {
            foundCard: !!card,
            subjectRows: Array.from(document.querySelectorAll('#tb-query tbody tr'))
                .map((tr) => (tr.querySelector('td')?.textContent || '').trim()),
            noteLines: cardText.split('\n')
                .map((line) => line.trim())
                .filter((line) => /^注：/.test(line))
        };
    });
}

(async () => {
    const browser = await chromium.launch({
        channel: String(process.env.SMOKE_BROWSER_CHANNEL || 'chrome').trim() || 'chrome',
        headless: true
    });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1800 } });
    try {
        await enterWorkspace(page);
        await page.waitForTimeout(2200);

        const displaySubject = String(process.env.SMOKE_DISPLAY_SUBJECT || '政治').trim();
        const target = await page.evaluate((subject) => {
            const found = (window.RAW_DATA || [])
                .find((row) => row?.scores && row.scores[subject] !== undefined);
            return found ? { name: found.name, score: found.scores[subject] } : null;
        }, displaySubject);

        // 该届没配展示类科目时整块跳过，而不是假失败。中考政治是九年级口径，
        // 换届或换考试类型都可能没有这一列。
        if (!target) {
            console.log(`report display subject footnote smoke skipped: no ${displaySubject} scores in dataset`);
            return;
        }

        await page.evaluate(() => window.switchTab('report-generator'));
        await page.waitForTimeout(1500);

        const withSubject = await renderAndReadFootnote(page, target.name);
        assert.ok(withSubject.foundCard, 'the student report table card must render');
        assert.ok(
            withSubject.subjectRows.some((row) => row.includes(displaySubject)),
            `the report must list ${displaySubject} for the picked student`
        );
        assert.strictEqual(
            withSubject.noteLines.length, 1,
            `the report must carry exactly one visible footnote when ${displaySubject} is shown, got ${JSON.stringify(withSubject.noteLines)}`
        );
        assert.ok(
            /不计入/.test(withSubject.noteLines[0]),
            `the footnote must state the score is excluded from the official metrics, got ${JSON.stringify(withSubject.noteLines[0])}`
        );

        // 反向验证：数据集里可能每个学生都有政治，所以克隆一个去掉该科成绩，
        // 确认脚注是按条件出现的，而不是无脑挂在每份报告上。
        const cloneName = await page.evaluate(({ srcName, subject }) => {
            const src = (window.RAW_DATA || []).find((row) => row?.name === srcName);
            if (!src) return null;
            const clone = JSON.parse(JSON.stringify(src));
            clone.name = `${srcName}__smoke_no_${subject}`;
            delete clone.scores[subject];
            if (clone.ranks) delete clone.ranks[subject];
            window.RAW_DATA.push(clone);
            return clone.name;
        }, { srcName: target.name, subject: displaySubject });
        assert.ok(cloneName, 'the smoke must be able to clone the picked student');

        const withoutSubject = await renderAndReadFootnote(page, cloneName);
        assert.ok(
            !withoutSubject.subjectRows.some((row) => row.includes(displaySubject)),
            `the cloned student must not list ${displaySubject}`
        );
        assert.strictEqual(
            withoutSubject.noteLines.length, 0,
            `the footnote must disappear when ${displaySubject} is absent, got ${JSON.stringify(withoutSubject.noteLines)}`
        );

        console.log('report display subject footnote smoke passed');
    } finally {
        await browser.close();
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
