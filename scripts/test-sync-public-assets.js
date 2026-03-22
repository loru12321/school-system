const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const moduleUrl = pathToFileURL(path.join(projectRoot, 'sync-public-assets.mjs')).href;
  const { collectReferencedJsAssets } = await import(moduleUrl);

  const sampleHtml = [
    '<script defer src="./assets/js/app.js?v=1"></script>',
    '<script src="/assets/js/cloud.js#hash"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>',
    '<script defer src="./assets/js/teacher-analysis-main-runtime.js"></script>'
  ].join('');

  const refs = collectReferencedJsAssets(sampleHtml);

  assert.ok(refs.has('app.js'), 'should keep local asset names without query strings');
  assert.ok(refs.has('cloud.js'), 'should keep absolute local asset names without hashes');
  assert.ok(refs.has('teacher-analysis-main-runtime.js'), 'should include other referenced local assets');
  assert.strictEqual(refs.has('xlsx.full.min.js'), false, 'should ignore external CDN scripts');

  console.log('sync-public-assets tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
