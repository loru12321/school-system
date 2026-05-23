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

const budgets = {
    // 2026-03-24 baseline plus a small amount of regression headroom.
    distIndexHtml: 330_000,
    ltHtml: 3_900_000,
    publicAppJs: 930_000,
    publicBootJs: 135_000,
    publicAppDownloadJs: 76_000,
    distAppJs: 650_000,
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
assert.ok(fs.existsSync(distDownloadsPath), 'dist/downloads should expose the current app packages');
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
assert.ok(
    getSize(path.join(distDownloadsPath, 'smartedu-windows-latest.zip')) > 0,
    'hosted Windows package should not be empty'
);

console.log('build-size-budget tests passed');
