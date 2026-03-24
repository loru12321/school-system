const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distIndexPath = path.join(projectRoot, 'dist', 'index.html');
const ltHtmlPath = path.join(projectRoot, 'lt.html');
const distAppPath = path.join(projectRoot, 'dist', 'assets', 'js', 'app.js');
const distReportRenderPath = path.join(projectRoot, 'dist', 'assets', 'js', 'report-render-runtime.js');
const distTeacherAnalysisPath = path.join(projectRoot, 'dist', 'assets', 'js', 'teacher-analysis-main-runtime.js');

function getSize(filePath) {
    assert.ok(fs.existsSync(filePath), `${filePath} should exist`);
    return fs.statSync(filePath).size;
}

const budgets = {
    // 2026-03-24 baseline plus a small amount of regression headroom.
    distIndexHtml: 410_000,
    ltHtml: 4_700_000,
    distAppJs: 800_000,
    distReportRenderJs: 74_000,
    distTeacherAnalysisJs: 103_000
};

const actual = {
    distIndexHtml: getSize(distIndexPath),
    ltHtml: getSize(ltHtmlPath),
    distAppJs: getSize(distAppPath),
    distReportRenderJs: getSize(distReportRenderPath),
    distTeacherAnalysisJs: getSize(distTeacherAnalysisPath)
};

const failures = Object.entries(actual)
    .filter(([key, size]) => size > budgets[key])
    .map(([key, size]) => `${key} exceeds budget: ${size} > ${budgets[key]}`);

assert.deepStrictEqual(failures, [], failures.join('\n'));

console.log('build-size-budget tests passed');
