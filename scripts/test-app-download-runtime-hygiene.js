const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app-download-runtime.js'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');

assert.ok(source.includes('getDownloadAssetModel'), 'download center should resolve an explicit asset model');
assert.ok(source.includes('isVerifiedReleaseAsset'), 'download center should distinguish verified release assets from fallback links');
assert.ok(source.includes('aria-disabled'), 'download center should disable missing release assets');
assert.ok(source.includes('window.PUBLIC_DOWNLOAD_ALLOW_UNVERIFIED_LINKS === true'), 'download center should require an explicit opt-in before exposing unverified fallback links');
assert.ok(!source.includes('return !!state.lastError || !state.lastFetchedAt || !state.releases.length;'), 'download center should not enable fallback download links before release verification');
assert.ok(!source.includes('state.releases)[0] || null'), 'download center should not silently use the first release when platform asset is missing');
assert.ok(html.includes('id="app-download-primary-link" class="btn btn-blue is-disabled"'), 'download center template should start with the primary download disabled');
assert.ok(html.includes('id="app-download-secondary-link" class="btn btn-blue is-disabled"'), 'download center template should start with the secondary download disabled');
assert.ok(html.includes('id="app-download-link-input" type="text" readonly value=""'), 'download center template should not seed an unverified asset URL');

console.log('app-download-runtime hygiene tests passed');
