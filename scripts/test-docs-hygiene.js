const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const maintenanceRunbook = fs.readFileSync(path.join(root, 'docs', 'maintenance-runbook.md'), 'utf8');
const optimizationBacklog = fs.readFileSync(path.join(root, 'docs', 'optimization-backlog.md'), 'utf8');
const cloudflareCutover = fs.readFileSync(path.join(root, 'docs', 'cloudflare-auth-cutover.md'), 'utf8');
const legacyReadme = fs.readFileSync(path.join(root, 'scripts', 'legacy', 'README.md'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts || {};
const docs = [
    ['README.md', readme],
    ['docs/maintenance-runbook.md', maintenanceRunbook],
    ['docs/optimization-backlog.md', optimizationBacklog],
    ['docs/cloudflare-auth-cutover.md', cloudflareCutover]
];

function assertReadableDoc(name, text) {
    assert.ok(!/[�锟鏅烘収閿]/.test(text), `${name} should not contain mojibake or replacement characters`);
    assert.ok(!text.includes('C:\\Users\\loru\\Documents\\New project\\school-system'), `${name} should not expose the current local workspace path`);
    assert.ok(!text.includes('C:\\Users\\loru\\Desktop\\system\\school-system'), `${name} should not point to the old desktop workspace`);
}

docs.forEach(([name, text]) => assertReadableDoc(name, text));

assert.ok(readme.includes('SmartEdu Analytics'), 'README should use the current project title');
assert.ok(readme.includes('.github/workflows/release-apps.yml'), 'README should document the GitHub Release automation workflow');
assert.ok(readme.includes('.github/workflows/performance-trend.yml'), 'README should document the performance trend workflow');
assert.ok(readme.includes('npm run check:release-fast'), 'README should document the fast release check');
assert.ok(readme.includes('docs/optimization-backlog.md'), 'README should link to the optimization backlog');
assert.ok(readme.includes('scripts/legacy/'), 'README should document the legacy script archive');
assert.ok(readme.includes('docs/performance/'), 'README should point readers to the performance trend output');
assert.ok(readme.includes('/downloads/smartedu-windows-latest.zip'), 'README should document the hosted Windows download');
assert.ok(readme.includes('/downloads/school-system-android-v1.0.apk'), 'README should document the hosted APK download');
assert.ok(!readme.includes('school-system-android-latest.apk` 下载地址返回 `404`'), 'README should not keep stale release 404 guidance');
assert.ok(!readme.includes('smartedu-desktop-windows-latest.exe` 下载地址返回 `404`'), 'README should not keep stale Windows release 404 guidance');
assert.ok(maintenanceRunbook.includes('## Priority Levels'), 'maintenance runbook should explain priority levels');
assert.ok(maintenanceRunbook.includes('### P0: production correctness'), 'maintenance runbook should define P0');
assert.ok(maintenanceRunbook.includes('### P1: release quality and user experience'), 'maintenance runbook should define P1');
assert.ok(maintenanceRunbook.includes('### P2: sustainable maintenance'), 'maintenance runbook should define P2');
assert.ok(maintenanceRunbook.includes('Content-Type: text/html; charset=utf-8'), 'maintenance runbook should document UTF-8 HTML headers');
assert.ok(maintenanceRunbook.includes('SERVICE_WORKER_VERSION'), 'maintenance runbook should document service worker versioning');
assert.ok(maintenanceRunbook.includes('CACHE_VERSION'), 'maintenance runbook should document cache versioning');
assert.ok(maintenanceRunbook.includes('npx wrangler deploy'), 'maintenance runbook should document Cloudflare deployment');
assert.ok(maintenanceRunbook.includes('npm run check:release-fast'), 'maintenance runbook should document release-fast checks');
assert.ok(maintenanceRunbook.includes('npm run verify:prod-minimal'), 'maintenance runbook should document minimal production verification');
assert.ok(maintenanceRunbook.includes('npm run smoke:prod-minimal'), 'maintenance runbook should document minimal production smoke');
assert.ok(maintenanceRunbook.includes('scripts/legacy/'), 'maintenance runbook should document the legacy script archive');
assert.ok(optimizationBacklog.includes('## P0: production correctness'), 'optimization backlog should list P0 items');
assert.ok(optimizationBacklog.includes('## P1: release quality and user experience'), 'optimization backlog should list P1 items');
assert.ok(optimizationBacklog.includes('## P2: sustainable maintenance'), 'optimization backlog should list P2 items');
assert.ok(optimizationBacklog.includes('check:p0'), 'optimization backlog should mention priority check scripts');
assert.ok(optimizationBacklog.includes('## Optimization pass log'), 'optimization backlog should keep a dated pass log');
assert.ok((optimizationBacklog.match(/^- /gm) || []).length >= 20, 'optimization backlog should keep at least 20 tracked optimization items');
assert.ok(legacyReadme.includes('npx wrangler deploy'), 'legacy script README should point to Wrangler deploy');
assert.ok(legacyReadme.includes('direct-deploy'), 'legacy script README should explain direct-deploy archive');
assert.ok(cloudflareCutover.includes('pending_accounts = 0'), 'Cloudflare cutover doc should retain readiness condition');
assert.ok(scripts['check:p0'] && scripts['check:p0'].includes('check:release-data-safe'), 'P0 check should include data-safe release checks');
assert.ok(scripts['check:p1'] && scripts['check:p1'].includes('test:html-hygiene'), 'P1 check should include HTML hygiene');
assert.ok(scripts['check:p2'] && scripts['check:p2'].includes('test:docs-hygiene'), 'P2 check should include docs hygiene');
assert.ok(scripts['check:p2'] && scripts['check:p2'].includes('test:maintenance-priority-contract'), 'P2 check should include maintenance priority contract');
assert.ok(scripts['check:p2'] && scripts['check:p2'].includes('smoke:prod-minimal'), 'P2 check should include minimal production smoke');
assert.ok(scripts['verify:prod-minimal'] === 'node scripts/verify-production-minimal.mjs', 'package scripts should expose minimal production verification');
assert.ok(scripts['smoke:prod-minimal'] && scripts['smoke:prod-minimal'].includes('verify:prod-minimal'), 'package scripts should expose production smoke alias');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:docs-hygiene'), 'fast release check should include docs hygiene');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-automation'), 'fast release check should include release automation checks');

console.log('docs hygiene tests passed');
