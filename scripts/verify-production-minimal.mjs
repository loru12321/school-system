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

const releaseManifest = await fetchWithTimeout('/releases/release-manifest.json');
const releaseCatalog = await releaseManifest.json();
const currentRelease = releaseCatalog?.releases?.[0] || {};
const releasePlatforms = currentRelease.platforms || {};
const androidRelease = releasePlatforms.android || {};
const windowsRelease = releasePlatforms.windows || {};
checks.push(['release_manifest_status', releaseManifest.status === 200]);
checks.push(['release_android_ready', androidRelease.status === 'ready']);
checks.push(['release_windows_ready', windowsRelease.status === 'ready']);

const apk = await fetchWithTimeout(`/downloads/${androidRelease.assetName || 'school-system-android-beta-20260624-7e19d7d.apk'}`, { method: 'HEAD' });
checks.push(['apk_status', apk.status === 200]);
checks.push(['apk_size', Number(apk.headers.get('content-length') || 0) === Number(androidRelease.bytes || 0)]);
checks.push(['apk_sha', (apk.headers.get('x-content-sha256') || '').toLowerCase() === String(androidRelease.sha256 || '').toLowerCase()]);

const windowsExe = await fetchWithTimeout(`/downloads/${windowsRelease.assetName || 'school-system-windows-beta-20260624-7e19d7d.exe'}`, { method: 'HEAD' });
checks.push(['windows_status', windowsExe.status === 200]);
let windowsBytes = Number(windowsExe.headers.get('content-length') || 0);
let windowsSignature = '';
if (!windowsBytes && windowsExe.status === 200) {
  const windowsGet = await fetchWithTimeout(`/downloads/${windowsRelease.assetName || 'school-system-windows-beta-20260624-7e19d7d.exe'}`);
  const windowsBuffer = new Uint8Array(await windowsGet.arrayBuffer());
  windowsBytes = windowsBuffer.byteLength;
  windowsSignature = String.fromCharCode(windowsBuffer[0] || 0, windowsBuffer[1] || 0);
}
checks.push(['windows_size', windowsBytes === Number(windowsRelease.bytes || 0)]);
checks.push(['windows_pe_header', !windowsSignature || windowsSignature === 'MZ']);

const failed = checks.filter(([, ok]) => !ok).map(([name]) => name);
assert(failed.length === 0, `Production verification failed: ${failed.join(', ')}`);

console.log(JSON.stringify({
  ok: true,
  origin,
  checks: checks.map(([name]) => name)
}, null, 2));
