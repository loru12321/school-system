const origin = (process.env.PROD_ORIGIN || 'https://schoolsystem.com.cn').replace(/\/+$/, '');

if (!/^https:\/\/(www\.)?schoolsystem\.com\.cn$/i.test(origin)) {
  throw new Error(`Refusing to verify unexpected production origin: ${origin}`);
}

async function fetchWithTimeout(pathname, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(options.timeoutMs || 15000));
  try {
    return await fetch(`${origin}${pathname}`, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'school-system-production-verifier'
      }
    });
  } finally {
    clearTimeout(timeout);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const checks = [];

const home = await fetchWithTimeout('/');
const homeText = await home.text();
checks.push(['home_status', home.status === 200]);
checks.push(['home_charset', /text\/html;\s*charset=utf-8/i.test(home.headers.get('content-type') || '')]);
checks.push(['home_app_root', homeText.includes('id="app"')]);
checks.push(['home_login_overlay', homeText.includes('id="login-overlay"')]);
checks.push(['home_boot_runtime', homeText.includes('./assets/js/boot-runtime.js')]);

const health = await fetchWithTimeout('/api/health');
const healthText = await health.text();
checks.push(['health_status', health.status === 200]);
checks.push(['health_json', /application\/json/i.test(health.headers.get('content-type') || '')]);
checks.push(['health_ok', healthText.includes('"ok":true')]);

const manifest = await fetchWithTimeout('/site.webmanifest');
checks.push(['manifest_status', manifest.status === 200]);
checks.push(['manifest_cache', /max-age=86400/.test(manifest.headers.get('cache-control') || '')]);

const serviceWorker = await fetchWithTimeout('/sw.js');
checks.push(['service_worker_status', serviceWorker.status === 200]);
checks.push(['service_worker_revalidate', /must-revalidate/.test(serviceWorker.headers.get('cache-control') || '')]);

const apk = await fetchWithTimeout('/downloads/school-system-android-v1.0.apk');
checks.push(['apk_status', apk.status === 200]);
checks.push(['apk_size', Number(apk.headers.get('content-length') || 0) > 10000000]);

const windowsZip = await fetchWithTimeout('/downloads/smartedu-windows-latest.zip');
checks.push(['windows_status', windowsZip.status === 200]);
checks.push(['windows_size', Number(windowsZip.headers.get('content-length') || 0) >= 500]);

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
assert(failed.length === 0, `Production verification failed: ${failed.join(', ')}`);

console.log(JSON.stringify({
  ok: true,
  origin,
  checks: checks.map(([name]) => name)
}, null, 2));
