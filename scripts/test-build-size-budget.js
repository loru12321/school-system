const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distIndexPath = path.join(projectRoot, 'dist', 'index.html');
const ltHtmlPath = path.join(projectRoot, 'lt.html');
const publicAppPath = path.join(projectRoot, 'public', 'assets', 'js', 'app.js');
const publicBootPath = path.join(projectRoot, 'public', 'assets', 'js', 'boot-runtime.js');
const publicAppDownloadPath = path.join(projectRoot, 'public', 'assets', 'js', 'app-download-runtime.js');
const distAppPath = path.join(projectRoot, 'dist', 'assets', 'js', 'app.js');
const distAppDownloadPath = path.join(projectRoot, 'dist', 'assets', 'js', 'app-download-runtime.js');
const distReportRenderPath = path.join(projectRoot, 'dist', 'assets', 'js', 'report-render-runtime.js');
const distTeacherAnalysisPath = path.join(projectRoot, 'dist', 'assets', 'js', 'teacher-analysis-main-runtime.js');

function getSize(filePath) {
    assert.ok(fs.existsSync(filePath), `${filePath} should exist`);
    return fs.statSync(filePath).size;
}

function getBuiltStylesheetSize() {
    const stylesheets = fs.readdirSync(path.join(projectRoot, 'dist'))
        .filter((name) => /^style-[\w-]+\.css$/.test(name));
    assert.strictEqual(stylesheets.length, 1, 'dist should contain one hashed application stylesheet');
    return getSize(path.join(projectRoot, 'dist', stylesheets[0]));
}

const budgets = {
    // 2026-03-24 baseline plus a small amount of regression headroom.
    distIndexHtml: 330_000,
    // Lightning CSS keeps the full existing theme cascade visually identical
    // while trimming the release payload. Guard that improvement from regressions.
    distAppCss: 620_000,
    ltHtml: 3_900_000,
    publicAppJs: 910_000,
    // Boot auth now includes login cohort handoff before core modules load.
    publicBootJs: 133_000,
    // Three native platforms, release history, and verified-manifest handling.
    publicAppDownloadJs: 100_000,
    // Current minified app bundle baseline after runtime splits, cache guards,
    // and the product redesign CSS layer being accounted in the singlefile build.
    distAppJs: 585_000,
    distAppDownloadJs: 60_000,
    distReportRenderJs: 68_000,
    distTeacherAnalysisJs: 72_000
};

const actual = {
    distIndexHtml: getSize(distIndexPath),
    distAppCss: getBuiltStylesheetSize(),
    ltHtml: getSize(ltHtmlPath),
    publicAppJs: getSize(publicAppPath),
    publicBootJs: getSize(publicBootPath),
    publicAppDownloadJs: getSize(publicAppDownloadPath),
    distAppJs: getSize(distAppPath),
    distAppDownloadJs: getSize(distAppDownloadPath),
    distReportRenderJs: getSize(distReportRenderPath),
    distTeacherAnalysisJs: getSize(distTeacherAnalysisPath)
};

const failures = Object.entries(actual)
    .filter(([key, size]) => size > budgets[key])
    .map(([key, size]) => `${key} exceeds budget: ${size} > ${budgets[key]}`);

assert.deepStrictEqual(failures, [], failures.join('\n'));

const releasePackagePolicies = {
    windows: { extension: '.exe', minimumBytes: 50 * 1024 * 1024 },
    android: { extension: '.apk', minimumBytes: 10 * 1024 * 1024 },
    ios: { downloadableOnlyWhenStatusReady: true, extension: '.ipa', minimumBytes: 5 * 1024 * 1024 }
};
const verifierSource = fs.readFileSync(path.join(projectRoot, 'scripts', 'verify-release-assets.mjs'), 'utf8');
Object.entries(releasePackagePolicies).forEach(([platform, policy]) => {
    assert.ok(verifierSource.includes(`${platform}: {`), `release verifier should define ${platform}`);
    assert.ok(verifierSource.includes(`extension: '${policy.extension}'`), `${platform} should require ${policy.extension}`);
    assert.ok(verifierSource.includes(`minimumBytes: ${policy.minimumBytes / (1024 * 1024)} * 1024 * 1024`), `${platform} should enforce a real package size`);
});

console.log('build-size-budget tests passed');
