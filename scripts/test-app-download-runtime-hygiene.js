const assert = require('assert');
const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app-download-runtime.js'), 'utf8');
const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
const verifier = fs.readFileSync(path.resolve(__dirname, '../scripts/verify-release-assets.mjs'), 'utf8');
const scripts = packageJson.scripts || {};

assert.ok(source.includes('getDownloadAssetModel'), 'download center should resolve an explicit asset model');
assert.ok(source.includes('isVerifiedReleaseAsset'), 'download center should distinguish verified release assets from fallback links');
assert.ok(source.includes('getPeerDownloadChannelKey'), 'download center should expose both Android and Windows download actions');
assert.ok(source.includes('peerAssetModel'), 'download center secondary action should target the opposite platform asset');
assert.ok(source.includes('shouldAutoFetchReleaseCatalog'), 'download center should gate automatic GitHub release refreshes');
assert.ok(source.includes('window.PUBLIC_DOWNLOAD_AUTO_FETCH_RELEASES === true'), 'download center should only auto-fetch GitHub releases when explicitly enabled');
assert.ok(source.includes("name.endsWith('.zip') && /(?:win|windows|desktop|smartedu)/i.test(name)"), 'download center should recognize Windows release archives');
assert.ok(source.includes('./downloads/school-system-android-v1.0.apk'), 'download center should expose the locally hosted APK');
assert.ok(source.includes('./downloads/smartedu-windows-latest.zip'), 'download center should expose the locally hosted Windows app package');
assert.ok(source.includes('aria-disabled'), 'download center should disable missing release assets');
assert.ok(source.includes('window.PUBLIC_DOWNLOAD_ALLOW_UNVERIFIED_LINKS === true'), 'download center should require an explicit opt-in before exposing unverified fallback links');
assert.ok(!source.includes('return !!state.lastError || !state.lastFetchedAt || !state.releases.length;'), 'download center should not enable fallback download links before release verification');
assert.ok(!source.includes('state.releases)[0] || null'), 'download center should not silently use the first release when platform asset is missing');
assert.ok(html.includes('id="app-download-primary-link" class="btn btn-blue is-disabled"'), 'download center template should start with the primary download disabled');
assert.ok(html.includes('id="app-download-secondary-link" class="btn btn-blue is-disabled"'), 'download center template should start with the secondary download disabled');
assert.ok(html.includes('id="app-download-link-input" type="text" readonly value=""'), 'download center template should not seed an unverified asset URL');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:app-download-runtime-hygiene'), 'fast release check should guard the download center');
assert.ok(verifier.includes("process.env.RELEASE_ASSETS_ALLOW_MISSING === 'true'"), 'release asset verifier should support non-failing report mode');
assert.ok(verifier.includes("reason: 'release-unavailable'"), 'release asset verifier should report missing latest releases explicitly');
assert.ok(verifier.includes('result.ok = failures.length === 0'), 'release asset verifier should include a top-level ok flag');

console.log('app-download-runtime hygiene tests passed');
