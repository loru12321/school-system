const assert = require('assert');
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app-download-runtime.js'), 'utf8');

assert.ok(source.includes('getDownloadAssetModel'), 'download center should resolve an explicit asset model');
assert.ok(source.includes('isVerifiedReleaseAsset'), 'download center should distinguish verified release assets from fallback links');
assert.ok(source.includes('aria-disabled'), 'download center should disable missing release assets');
assert.ok(!source.includes('state.releases)[0] || null'), 'download center should not silently use the first release when platform asset is missing');

console.log('app-download-runtime hygiene tests passed');
