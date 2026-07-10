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
        'User-Agent': 'school-system-production-verifier',
        ...(options.headers || {})
      },
      method: options.method || 'GET',
      body: options.body
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
const bootRuntimePath = homeText.match(/\.\/assets\/js\/(boot-runtime-runtime-[0-9a-f]{12}\.js)/)?.[1] || '';
checks.push(['home_status', home.status === 200]);
checks.push(['home_charset', /text\/html;\s*charset=utf-8/i.test(home.headers.get('content-type') || '')]);
checks.push(['home_app_root', homeText.includes('id="app"')]);
checks.push(['home_login_overlay', homeText.includes('id="login-overlay"')]);
checks.push(['home_boot_runtime', Boolean(bootRuntimePath)]);

if (bootRuntimePath) {
  const bootRuntime = await fetchWithTimeout(`/assets/js/${bootRuntimePath}`);
  checks.push(['boot_runtime_status', bootRuntime.status === 200]);
}

const health = await fetchWithTimeout('/api/health');
const healthText = await health.text();
checks.push(['health_status', health.status === 200]);
checks.push(['health_json', /application\/json/i.test(health.headers.get('content-type') || '')]);
checks.push(['health_ok', healthText.includes('"ok":true')]);

const gatewayLogin = await fetchWithTimeout('/api/gateway', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'login',
    payload: {
      username: process.env.SMOKE_USER || 'admin',
      password: process.env.SMOKE_PASS || 'admin123'
    }
  })
});
const gatewayLoginText = await gatewayLogin.text();
checks.push(['gateway_alias_status', gatewayLogin.status === 200]);
checks.push(['gateway_alias_json', /application\/json/i.test(gatewayLogin.headers.get('content-type') || '')]);
checks.push(['gateway_alias_login_ok', gatewayLoginText.includes('"ok":true') && gatewayLoginText.includes('"token"')]);

const manifest = await fetchWithTimeout('/site.webmanifest');
checks.push(['manifest_status', manifest.status === 200]);
checks.push(['manifest_cache', /max-age=86400/.test(manifest.headers.get('cache-control') || '')]);

const serviceWorker = await fetchWithTimeout('/sw.js');
checks.push(['service_worker_status', serviceWorker.status === 200]);
checks.push(['service_worker_revalidate', /must-revalidate/.test(serviceWorker.headers.get('cache-control') || '')]);

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
assert(failed.length === 0, `Production verification failed: ${failed.join(', ')}`);

console.log(JSON.stringify({
  ok: true,
  origin,
  checks: checks.map(([name]) => name)
}, null, 2));
