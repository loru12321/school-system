const puppeteer = require('puppeteer');

(async () => {
    try {
        console.log('Launching browser for verification...');
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

        console.log('Navigating to local site...');
        await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });

        // wait 2 seconds
        await new Promise(r => setTimeout(r, 2000));

        console.log('Setting up mock data and removing overlays...');
        await page.evaluate(() => {
            // Remove SweetAlerts
            document.querySelectorAll('.swal2-container').forEach(e => e.remove());
            document.body.classList.remove('swal2-shown', 'swal2-height-auto');
            
            // Mock TEACHER_MAP and supabase
            window.TEACHER_MAP = { "test_class": "TestTeacher" };
            // Ensure supabase is mocked if it fails to load
            if (!window.supabase) {
                window.supabase = {
                    createClient: () => ({
                        from: () => ({
                            select: () => ({
                                eq: () => ({
                                    eq: () => ({
                                        maybeSingle: async () => ({ data: null, error: null })
                                    })
                                })
                            })
                        })
                    })
                };
                window.initSupabase();
            }
        });

        console.log('Attempting teacher fallback login...');
        await page.evaluate(() => {
            document.getElementById('login-user').value = 'TestTeacher';
            document.getElementById('login-pass').value = '123456';
            document.getElementById('login-submit-btn').click();
        });

        // wait 2 seconds
        await new Promise(r => setTimeout(r, 2000));

        const overlayDisplay = await page.evaluate(() => document.getElementById('login-overlay').style.display);
        const currentUser = await page.evaluate(() => JSON.parse(sessionStorage.getItem('CURRENT_USER')));

        console.log('Overlay display after login:', overlayDisplay);
        console.log('Current user in session:', currentUser);

        if (overlayDisplay === 'none' && currentUser && currentUser.name === 'TestTeacher') {
            console.log('✅ TEACHER FALLBACK VERIFIED SUCCESS');
        } else {
            console.log('❌ TEACHER FALLBACK VERIFICATION FAILED');
        }

        await browser.close();
    } catch (e) {
        console.error('Puppeteer verification error:', e);
    }
})();
