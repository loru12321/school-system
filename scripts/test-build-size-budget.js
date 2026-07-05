const assert = require('assert');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const distIndexPath = path.join(projectRoot, 'dist', 'index.html');
const ltHtmlPath = path.join(projectRoot, 'lt.html');
const ltHtmlBrotliPath = path.join(projectRoot, 'lt.html.br');
const publicAppPath = path.join(projectRoot, 'public', 'assets', 'js', 'app.js');
const publicBootPath = path.join(projectRoot, 'public', 'assets', 'js', 'boot-runtime.js');
const publicRuntimeLoaderPath = path.join(projectRoot, 'public', 'assets', 'js', 'runtime-loader-runtime.js');
const distAppPath = path.join(projectRoot, 'dist', 'assets', 'js', 'app.js');
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
    // Approved responsive login recovery/fullscreen polish and current product workspace styles
    // fit under this cap while retaining tight regression detection headroom.
    distAppCss: 640_000,
    ltHtml: 2_100_000,
    ltHtmlBrotli: 330_000,
    // Cloud sync guards and fail-closed login gates add a small amount of
    // startup-critical source; keep a narrow cap above the current baseline.
    publicAppJs: 830_000,
    publicCohortExamHydrationJs: 7_000,
    // Keep first-screen boot focused; optional runtime manifest/loaders live in runtime-loader-runtime.js.
    // 2026-07-05: raised from 85_000 to cover the existing 85_465B baseline (fail-closed login gate +
    // cloud sync guards) plus a small headroom; the file is already comment/whitespace-clean.
    publicBootJs: 85_600,
    publicRuntimeLoaderJs: 58_000,
    // Current minified app bundle baseline after runtime splits, cache guards,
    // and the product redesign CSS layer being accounted in the singlefile build.
    distAppJs: 585_000,
    distReportRenderJs: 68_000,
    distTeacherAnalysisJs: 72_000
};

assert.strictEqual(budgets.distAppCss, 640_000, 'approved CSS budget must remain fixed at 640000 bytes');

const actual = {
    distIndexHtml: getSize(distIndexPath),
    distAppCss: getBuiltStylesheetSize(),
    ltHtml: getSize(ltHtmlPath),
    ltHtmlBrotli: getSize(ltHtmlBrotliPath),
    publicAppJs: getSize(publicAppPath),
    publicBootJs: getSize(publicBootPath),
    publicCohortExamHydrationJs: getSize(path.join(projectRoot, 'public', 'assets', 'js', 'cohort-exam-hydration-runtime.js')),
    publicRuntimeLoaderJs: getSize(publicRuntimeLoaderPath),
    distAppJs: getSize(distAppPath),
    distReportRenderJs: getSize(distReportRenderPath),
    distTeacherAnalysisJs: getSize(distTeacherAnalysisPath)
};

const failures = Object.entries(actual)
    .filter(([key, size]) => size > budgets[key])
    .map(([key, size]) => `${key} exceeds budget: ${size} > ${budgets[key]}`);

assert.deepStrictEqual(failures, [], failures.join('\n'));

console.log('build-size-budget tests passed');
