const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        console.log('Navigating...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

        console.log('Waiting for starter guide to appear...');
        // The starter guide button is class .swal2-confirm
        try {
            await page.waitForSelector('.swal2-confirm', { timeout: 3000 });
            console.log('Clicking starter guide confirm...');
            await page.evaluate(() => document.querySelector('.swal2-confirm').click());
            await new Promise(r => setTimeout(r, 1000));
        } catch (e) {
            console.log('No starter guide found, continuing...');
        }

        console.log('Typing credentials...');
        await page.type('#login-user', 'admin');
        await page.type('#login-pass', 'admin123');

        console.log('Clicking login...');
        await page.evaluate(() => document.querySelector('#login-submit-btn').click());

        // wait 3 seconds
        await new Promise(r => setTimeout(r, 3000));

        // Get feedback msg
        const feedback = await page.evaluate(() => {
            const el = document.getElementById('login-feedback');
            return el ? { text: el.innerText, display: el.style.display } : null;
        });
        
        console.log('Feedback:', feedback);

        // Check if login-overlay is hidden (success)
        const overlayVisible = await page.evaluate(() => {
            const el = document.getElementById('login-overlay');
            return el ? el.style.display : null;
        });
        console.log('Overlay display:', overlayVisible);

        await browser.close();
        console.log('Done.');
    } catch (e) {
        console.error('Puppeteer error:', e);
    }
})();
