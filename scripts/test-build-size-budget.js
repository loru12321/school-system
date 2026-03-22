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
    distIndexHtml: 505_000,
    ltHtml: 1_750_000,
    distAppJs: 775_000,
    distReportRenderJs: 72_500,
    distTeacherAnalysisJs: 105_000
};

const actual = {
    distIndexHtml: getSize(distIndexPath),
    ltHtml: getSize(ltHtmlPath),
    distAppJs: getSize(distAppPath),
    distReportRenderJs: getSize(distReportRenderPath),
    distTeacherAnalysisJs: getSize(distTeacherAnalysisPath)
};

Object.entries(actual).forEach(([key, size]) => {
    assert.ok(
        size <= budgets[key],
        `${key} exceeds budget: ${size} > ${budgets[key]}`
    );
});

console.log('build-size-budget tests passed');
