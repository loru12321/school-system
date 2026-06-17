const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
const maintenanceRunbook = fs.readFileSync(path.join(root, 'docs', 'maintenance-runbook.md'), 'utf8');
const optimizationBacklog = fs.readFileSync(path.join(root, 'docs', 'optimization-backlog.md'), 'utf8');
const cloudflareCutover = fs.readFileSync(path.join(root, 'docs', 'cloudflare-auth-cutover.md'), 'utf8');
const douyinEvidence = fs.readFileSync(path.join(root, 'docs', 'douyin-favorite-evidence-2026-06-17.md'), 'utf8');
const douyinLedger = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'douyin-favorite-audit-ledger.json'), 'utf8'));
const legacyReadme = fs.readFileSync(path.join(root, 'scripts', 'legacy', 'README.md'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts || {};
const docs = [
    ['README.md', readme],
    ['docs/maintenance-runbook.md', maintenanceRunbook],
    ['docs/optimization-backlog.md', optimizationBacklog],
    ['docs/cloudflare-auth-cutover.md', cloudflareCutover],
    ['docs/douyin-favorite-evidence-2026-06-17.md', douyinEvidence]
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
assert.strictEqual(douyinLedger.schemaVersion, 1, 'Douyin favorite ledger should expose a stable schema version');
assert.strictEqual(douyinLedger.summary.completedDetailPages, 371, 'Douyin favorite ledger should track completed detail pages');
assert.strictEqual(douyinLedger.summary.attemptedDetailPages, 11, 'Douyin favorite ledger should track attempted detail pages');
assert.strictEqual(douyinLedger.summary.visibleListOnlyPages, 0, 'Douyin favorite ledger should track list-only favorite captures');
assert.strictEqual(douyinLedger.summary.directlyReusableAudio, 0, 'Douyin favorite ledger should not mark unlicensed audio reusable');
assert.ok(douyinLedger.summary.authorizationPolicy.includes('explicit'), 'Douyin favorite ledger should document the authorization policy');
assert.ok(douyinEvidence.includes('Favorite Link Batch 3 - Detail Loading Audit'), 'Douyin evidence should include the third batch audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 4 - Visible List Capture'), 'Douyin evidence should include the fourth batch visible-list audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 5 - Deep Visible List Capture'), 'Douyin evidence should include the fifth batch deep visible-list audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 6 - Detail Upgrade Audit'), 'Douyin evidence should include the sixth batch detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 7 - Detail Upgrade Audit'), 'Douyin evidence should include the seventh batch detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 8 - Detail Upgrade Audit'), 'Douyin evidence should include the eighth batch detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 9 - Detail Upgrade Audit'), 'Douyin evidence should include batch 9 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 10 - Detail Upgrade Audit'), 'Douyin evidence should include batch 10 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 11 - Detail Upgrade Audit'), 'Douyin evidence should include batch 11 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 12 - Detail Upgrade Audit'), 'Douyin evidence should include batch 12 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 13 - Detail Upgrade Audit'), 'Douyin evidence should include batch 13 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 14 - Detail Upgrade Audit'), 'Douyin evidence should include batch 14 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 15 - Detail Upgrade Audit'), 'Douyin evidence should include batch 15 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 16 - Detail Upgrade Audit'), 'Douyin evidence should include batch 16 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 17 - Detail Upgrade Audit'), 'Douyin evidence should include batch 17 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 18 - Detail Upgrade Audit'), 'Douyin evidence should include batch 18 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 19 - Detail Upgrade Audit'), 'Douyin evidence should include batch 19 detail-upgrade audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 20 - Deeper Visible And Detail Capture'), 'Douyin evidence should include batch 20 deeper visible/detail audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 21 - Fresh Deep Detail Capture'), 'Douyin evidence should include batch 21 fresh deep detail audit');
assert.ok(douyinEvidence.includes('Favorite Link Batch 22 - Fresh Deep Detail Capture'), 'Douyin evidence should include batch 22 fresh deep detail audit');
assert.ok(douyinEvidence.includes('Directly reusable Douyin favorite audio found so far: `0`'), 'Douyin evidence should keep the music reuse audit');
assert.ok(Array.isArray(douyinLedger.batches) && douyinLedger.batches.length >= 3, 'Douyin favorite ledger should preserve batch history');
const douyinEntries = douyinLedger.batches.flatMap((batch) => batch.entries || []);
const completedDouyinEntries = douyinEntries.filter((entry) => entry.status === 'completed-detail');
const attemptedDouyinEntries = douyinEntries.filter((entry) => entry.status && entry.status.startsWith('attempted-'));
const visibleListOnlyDouyinEntries = douyinEntries.filter((entry) => entry.status === 'visible-list-only');
assert.strictEqual(completedDouyinEntries.length, douyinLedger.summary.completedDetailPages, 'Douyin completed detail count should match ledger entries');
assert.strictEqual(attemptedDouyinEntries.length, douyinLedger.summary.attemptedDetailPages, 'Douyin attempted detail count should match ledger entries');
assert.strictEqual(visibleListOnlyDouyinEntries.length, douyinLedger.summary.visibleListOnlyPages, 'Douyin visible-list count should match ledger entries');
assert.ok(douyinEntries.every((entry) => /^https:\/\/www\.douyin\.com\/video\/\d+/.test(entry.url)), 'Douyin ledger entries should use canonical video URLs');
assert.strictEqual(new Set(douyinEntries.map((entry) => entry.url)).size, douyinEntries.length, 'Douyin ledger should not duplicate canonical video URLs');
assert.ok(douyinEntries.every((entry) => Array.isArray(entry.authorizationSignals) && entry.authorizationSignals.length === 0), 'Douyin ledger should not imply audio authorization without evidence');
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
