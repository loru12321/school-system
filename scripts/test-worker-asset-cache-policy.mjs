// Behavioral contract for Worker static-asset cache-control decisions.
//
// Exercises the real protectAssetResponse / getStaticAssetCacheControl code
// (no source-string guessing). Guards the Phase 6 fix: content-hashed bundles
// under /assets/js/ (boot-runtime-runtime-<hash>.js, service-worker-runtime-
// runtime-<hash>.js) must be served immutable — the no-store catch-all for
// unversioned runtime JS must not swallow them. Unversioned app.js stays
// no-store so deployments never serve stale app code behind the boot loader.
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { protectAssetResponse } = await import(
  pathToFileURL(path.join(root, 'src', 'worker-asset-protection.js')).href
);

// Resolve the current runtime version from the build's own inputs so this test
// survives hash rotations without edits: the generated boot bundle name embeds
// the same version the hash-derivation produces.
const bootBundle = fs.readdirSync(path.join(root, 'public', 'assets', 'js'))
  .find((name) => /^boot-runtime-runtime-[0-9a-f]{12}\.js$/.test(name));
assert.ok(bootBundle, 'generated boot-runtime-runtime-<hash>.js must exist in public/assets/js');
const RUNTIME_VERSION = bootBundle.replace(/^boot-runtime-runtime-/, '').replace(/\.js$/, '');

const NO_STORE = 'no-store, max-age=0, must-revalidate, no-transform';
const IMMUTABLE = 'public, max-age=31536000, immutable';
const SHORT = 'public, max-age=3600, stale-while-revalidate=86400';

function assetResponse(assetPath, contentType = 'application/javascript') {
  const request = new Request(`https://schoolsystem.com.cn${assetPath}`, {
    headers: { accept: '*/*' }
  });
  const response = new Response('ok', {
    status: 200,
    headers: { 'content-type': contentType }
  });
  return protectAssetResponse(request, response).headers.get('cache-control');
}

function assertCacheControl(assetPath, expected, label, contentType = 'application/javascript') {
  assert.strictEqual(
    assetResponse(assetPath, contentType),
    expected,
    `${label} (${assetPath})`
  );
}

// Content-hashed boot shell bundles: immutable, URL changes when content changes.
assertCacheControl(
  `/assets/js/boot-runtime-runtime-${RUNTIME_VERSION}.js`,
  IMMUTABLE,
  'hashed boot runtime bundle should be immutable'
);
assertCacheControl(
  `/assets/js/boot-runtime-runtime-${RUNTIME_VERSION}.js.br`,
  IMMUTABLE,
  'precompressed hashed boot runtime bundle should be immutable'
);
assertCacheControl(
  `/assets/js/service-worker-runtime-runtime-${RUNTIME_VERSION}.js`,
  IMMUTABLE,
  'hashed service worker runtime bundle should be immutable'
);
assertCacheControl(
  `/assets/js/service-worker-runtime-runtime-${RUNTIME_VERSION}.js.br`,
  IMMUTABLE,
  'precompressed hashed service worker runtime bundle should be immutable'
);
assertCacheControl(
  '/style-DKN0ss9n.css',
  IMMUTABLE,
  'hashed CSS should stay immutable'
);
assertCacheControl(
  '/style-DKN0ss9n.css.br',
  IMMUTABLE,
  'precompressed hashed CSS should stay immutable'
);
assertCacheControl(
  `/sw-runtime-${RUNTIME_VERSION}.js`,
  IMMUTABLE,
  'hashed sw-runtime bundle should stay immutable'
);
assertCacheControl(
  '/assets/vendor/chart.js/chart.umd.min.js',
  IMMUTABLE,
  'vendor bundles should stay immutable'
);

// Unversioned runtime JS: no-store so a fresh deploy never serves stale code.
assertCacheControl(
  '/assets/js/app.js',
  NO_STORE,
  'unversioned app.js should stay no-store'
);
assertCacheControl(
  '/assets/js/app.js.br',
  NO_STORE,
  'precompressed unversioned app.js should stay no-store'
);
assertCacheControl(
  '/assets/js/auth-state-runtime.js',
  NO_STORE,
  'unversioned runtime modules should stay no-store'
);
assertCacheControl(
  '/assets/js/auth-state-runtime.js.br',
  NO_STORE,
  'precompressed unversioned runtime modules should stay no-store'
);

// Service worker script and HTML shell stay no-store.
assertCacheControl('/sw.js', NO_STORE, 'service worker script should stay no-store');
assertCacheControl(
  '/',
  NO_STORE,
  'html shell should stay no-store',
  'text/html'
);

// Unversioned non-JS static assets keep the short browser cache.
assertCacheControl('/icon.svg', SHORT, 'unversioned static assets should get short caching');

// Non-static paths are left untouched so public/_headers rules for them apply.
{
  const request = new Request('https://schoolsystem.com.cn/robots.txt');
  const response = new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } });
  const cacheControl = protectAssetResponse(request, response).headers.get('cache-control');
  assert.strictEqual(cacheControl, null, 'robots.txt should not get a worker cache-control');
}

console.log(JSON.stringify({
  ok: true,
  immutable: [
    'assets/js/boot-runtime-runtime-<hash>.js',
    'assets/js/service-worker-runtime-runtime-<hash>.js',
    'style-<hash>.css',
    'sw-runtime-<hash>.js',
    'assets/vendor/*',
    '+ .br twins of all of the above'
  ],
  noStore: ['assets/js/app.js', 'assets/js/*-runtime.js (unversioned)', '/sw.js', '/'],
  shortCache: ['icon.svg']
}, null, 2));
