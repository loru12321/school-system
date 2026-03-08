const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser...');
        // ignore HTTP errors to allow local testing
        const browser = await puppeteer.launch({ headless: 'new', args: ['--disable-web-security'] });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        console.log('Navigating...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

        // wait 2 seconds for all startups
        await new Promise(r => setTimeout(r, 2000));

        console.log('Removing sweetalerts...');
        await page.evaluate(() => {
            document.querySelectorAll('.swal2-container').forEach(e => e.remove());
            document.body.classList.remove('swal2-shown', 'swal2-height-auto');
        });

        console.log('Typing credentials...');
        await page.type('#login-user', 'admin');
        await page.type('#login-pass', 'admin123');
        await page.screenshot({path: 'pup3_before_click.png'});

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
        await page.screenshot({path: 'pup3_after_click.png'});

        await browser.close();
        console.log('Done.');
    } catch (e) {
        console.error('Puppeteer error:', e);
    }
})();
