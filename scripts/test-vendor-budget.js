const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const budgets = {
    'public/assets/vendor/xlsx/xlsx.full.min.js': 900_000,
    'public/assets/vendor/alasql/alasql.min.js': 525_000,
    'public/assets/vendor/jspdf/jspdf.umd.min.js': 380_000,
    'public/assets/vendor/html2canvas/html2canvas.min.js': 210_000,
    'public/assets/vendor/chart.js/chart.umd.min.js': 215_000,
    'public/assets/vendor/sweetalert2/sweetalert2.all.min.js': 90_000
};

for (const [relativePath, maxBytes] of Object.entries(budgets)) {
    const filePath = path.join(root, relativePath);
    assert.ok(fs.existsSync(filePath), `${relativePath} should exist`);
    const size = fs.statSync(filePath).size;
    assert.ok(size <= maxBytes, `${relativePath} is ${size} bytes, above ${maxBytes}`);
}

const bootRuntime = fs.readFileSync(path.join(root, 'public/assets/js/boot-runtime.js'), 'utf8');
const runtimeLoaderRuntime = fs.readFileSync(path.join(root, 'public/assets/js/runtime-loader-runtime.js'), 'utf8');
const runtimeSurface = `${bootRuntime}\n${runtimeLoaderRuntime}`;
assert.ok(runtimeLoaderRuntime.includes('ensureXlsxVendorLoaded'), 'XLSX should stay behind the lazy loader');
assert.ok(runtimeLoaderRuntime.includes('ensureAlasqlVendorLoaded'), 'AlaSQL should stay behind the lazy loader');
const bootVendorBlock = (bootRuntime.match(/BOOT_VENDOR_MODULES\s*=\s*\[([\s\S]*?)\];/) || [])[1] || '';
assert.ok(!bootVendorBlock.includes('xlsx.full.min.js'), 'XLSX must not be a boot vendor');
const shellPolishFactoryWarmup = (runtimeSurface.match(/'shell-polish':\s*bootSkill\(\s*['"][^'"]+['"]\s*,\s*['"]([^'"]+)['"]/) || [])[1] || '';
const shellPolishSkill = (runtimeSurface.match(/'shell-polish':\s*\{([\s\S]*?)\n\s*\}/) || [])[1] || '';
assert.ok(
  shellPolishFactoryWarmup === 'demand'
    || shellPolishSkill.includes("warmup: 'demand'")
    || shellPolishSkill.includes('warmup: "demand"'),
  'shell polish should load on demand, not during default desktop warmup'
);

console.log('vendor budget tests passed');
