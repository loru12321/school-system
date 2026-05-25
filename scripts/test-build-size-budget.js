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

function assertZipLike(filePath, label) {
    const signature = fs.readFileSync(filePath).subarray(0, 4).toString('binary');
    assert.ok(
        signature === 'PK\u0003\u0004' || signature === 'PK\u0005\u0006' || signature === 'PK\u0007\u0008',
        `${label} should have a ZIP/APK file signature`
    );
}

const budgets = {
    // 2026-03-24 baseline plus a small amount of regression headroom.
    distIndexHtml: 330_000,
    ltHtml: 3_900_000,
    publicAppJs: 910_000,
    // Boot auth now includes login cohort handoff before core modules load.
    publicBootJs: 133_000,
    publicAppDownloadJs: 76_000,
    distAppJs: 560_000,
    distAppDownloadJs: 45_000,
    distReportRenderJs: 68_000,
    distTeacherAnalysisJs: 72_000
};

const actual = {
    distIndexHtml: getSize(distIndexPath),
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

const distDownloadsPath = path.join(projectRoot, 'dist', 'downloads');
const publicDownloadsPath = path.join(projectRoot, 'public', 'downloads');
assert.ok(fs.existsSync(distDownloadsPath), 'dist/downloads should expose the current app packages');
assert.ok(fs.existsSync(publicDownloadsPath), 'public/downloads should contain hosted app packages');
const downloadFiles = fs.readdirSync(distDownloadsPath).sort();
assert.deepStrictEqual(
    downloadFiles,
    ['school-system-android-v1.0.apk', 'smartedu-windows-latest.zip'],
    'dist/downloads should only contain the current hosted APK and Windows package'
);
assert.ok(
    getSize(path.join(distDownloadsPath, 'school-system-android-v1.0.apk')) > 10_000_000,
    'hosted APK should look like a real application package'
);
assertZipLike(path.join(distDownloadsPath, 'school-system-android-v1.0.apk'), 'hosted APK');
assertZipLike(path.join(publicDownloadsPath, 'school-system-android-v1.0.apk'), 'public hosted APK');
assert.ok(
    getSize(path.join(distDownloadsPath, 'smartedu-windows-latest.zip')) >= 500,
    'hosted Windows package should look like a real zip package'
);
assertZipLike(path.join(distDownloadsPath, 'smartedu-windows-latest.zip'), 'hosted Windows package');
assertZipLike(path.join(publicDownloadsPath, 'smartedu-windows-latest.zip'), 'public hosted Windows package');
assert.ok(
    getSize(path.join(distDownloadsPath, 'school-system-android-v1.0.apk')) +
    getSize(path.join(distDownloadsPath, 'smartedu-windows-latest.zip')) < 30_000_000,
    'hosted download payload should stay under 30MB'
);

console.log('build-size-budget tests passed');
