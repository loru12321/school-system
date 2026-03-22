const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const moduleUrl = pathToFileURL(path.join(projectRoot, 'sync-public-assets.mjs')).href;
  const { collectReferencedJsAssets, syncReferencedAssets } = await import(moduleUrl);

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

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-public-assets-'));
  const sourceJsDir = path.join(tempRoot, 'public', 'assets', 'js');
  const targetJsDir = path.join(tempRoot, 'dist', 'assets', 'js');
  const publicDir = path.join(tempRoot, 'public');
  const srcDir = path.join(tempRoot, 'src');
  fs.mkdirSync(sourceJsDir, { recursive: true });
  fs.mkdirSync(targetJsDir, { recursive: true });
  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  const verboseJs = `function longName(){const veryLongVariableName = 1 + 2; return veryLongVariableName;}\nwindow.answer = longName();\n`;
  const unusedJs = `window.shouldNotExist = true;\n`;
  fs.writeFileSync(path.join(sourceJsDir, 'app.js'), verboseJs, 'utf8');
  fs.writeFileSync(path.join(sourceJsDir, 'unused.js'), unusedJs, 'utf8');
  fs.writeFileSync(path.join(srcDir, 'index.html'), '<script src="./assets/js/app.js?v=1"></script>', 'utf8');
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), 'ico', 'utf8');
  fs.writeFileSync(path.join(targetJsDir, 'stale.js'), 'window.stale = true;', 'utf8');

  syncReferencedAssets({
    sourceJsDir,
    targetJsDir,
    indexHtmlPath: path.join(srcDir, 'index.html'),
    projectRoot: tempRoot
  });

  const syncedAppPath = path.join(targetJsDir, 'app.js');
  const skippedPath = path.join(targetJsDir, 'unused.js');
  const stalePath = path.join(targetJsDir, 'stale.js');
  assert.ok(fs.existsSync(syncedAppPath), 'should sync referenced assets');
  assert.strictEqual(fs.existsSync(skippedPath), false, 'should skip unreferenced assets');
  assert.strictEqual(fs.existsSync(stalePath), false, 'should remove stale target assets that are no longer referenced');
  const minifiedJs = fs.readFileSync(syncedAppPath, 'utf8');
  assert.ok(minifiedJs.length < verboseJs.length, 'should minify synced assets');
  assert.ok(fs.existsSync(path.join(tempRoot, 'dist', 'favicon.ico')), 'should sync root public files');

  console.log('sync-public-assets tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
