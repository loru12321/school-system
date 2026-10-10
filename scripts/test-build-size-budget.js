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
    // 2026-10-09: the four-step exam-room workbench adds its responsive layout
    // and output preview styles. Keep less than 1.5KB above the built baseline.
    // 2026-10-10: shared mobile surface/table/action primitives add a bounded
    // 4KB authored layer used by every viewport. Keep a narrow cap above the
    // verified 651KB build instead of allowing unbounded CSS growth.
    distAppCss: 652_000,
    // The offline single-file build embeds the four demand-loaded exam arranger
    // runtimes so folder import and exports remain available without a server.
    // 2026-10-10: mobile interaction and table strategy contracts are embedded
    // in the offline bundle; retain a 5KB headroom above the verified build.
    ltHtml: 2_155_000,
    // Offline lt.html carries inline runtime sources for single-file use; keep a
    // tight cap above the current complete offline bundle.
    // 2026-07-09: raised 335_000 -> 336_000 for the non-grade-9 major-subject
    // school-analysis workbook export path; CI Brotli output measured 335_338B.
    // 2026-08-29: raised 336_000 -> 336_500 for freshman violation/dropout
    // roster labels and export color markers; runtime cache hashes can vary
    // Brotli output by a few hundred bytes between builds.
    // 2026-08-29: raised 336_500 -> 338_500 for the freshman same-class group
    // selector, group-level placement lock, conflict checks, and export column.
    // 2026-08-29: deep-link initialization and upload controls add a small
    // amount of inline bundle size; keep the cap above CI's Brotli output.
    // 2026-08-30: threshold source metadata adds 65B to the compressed offline bundle.
    // 2026-08-30: freshman no-exam color legend, seat-map labels, and style-capable
    // XLSX loader add a small, intentional amount to the offline bundle. Keep
    // cross-platform Brotli variance headroom (Linux CI can be ~200B larger).
    // 2026-08-30: demo data generation moved to a demand-loaded runtime; the
    // offline source map keeps that runtime available for single-file demos.
    // 2026-08-30: freshman violation separate-group editor, upload parser,
    // hard-constraint validation, and export labels add a small intentional
    // amount to the offline bundle.
    // 2026-08-30: related-roster pack upload and its workbook template add a
    // small intentional amount while keeping the single-file bundle bounded.
    // 2026-08-30: individual related-list uploads now accept CSV, reject empty
    // sheets, and report duplicate rows; retain a narrow 500B headroom.
    // 2026-08-30: freshman seat and scenario actions now use declarative event
    // delegation so mobile controls remain reliable; allow the resulting
    // single-file bundle growth without relaxing the broader size guard.
    // Cloud sync guards and fail-closed login gates add a small amount of
    // startup-critical source; keep a narrow cap above the current baseline.
    // 2026-08-30: high-score page rendering moved into a demand-loaded runtime;
    // the offline source map retains the module for file:// use. Keep the cap
    // just above the resulting Brotli size with cross-platform headroom.
    publicAppJs: 830_000,
    publicCohortExamHydrationJs: 7_000,
    // Keep first-screen boot focused; optional runtime manifest/loaders live in runtime-loader-runtime.js.
    // 2026-07-05: raised from 85_000 to cover the existing 85_465B baseline (fail-closed login gate +
    // cloud sync guards) plus a small headroom; the file is already comment/whitespace-clean.
    // 2026-07-07: raised 85_700 -> 85_800 for the phase-4 startup-hydration-runtime.js APP_MODULES
    // registration string (one manifest line, no new logic/loaders, no removed safety check).
    publicBootJs: 85_800,
    // 2026-08-30: target-editor demand skill and declarative action bridge add
    // a small, intentional manifest entry while keeping the editor out of boot.
    // 2026-08-30: non-assessment scheduler subjects/projects add a compact
    // mobile configuration panel and export sheet; retain a narrow bundle cap.
    // 2026-08-30: drill-system moved out of app.js but remains in the offline
    // source map, adding a small compressed footprint to lt.html.
    // 2026-09-27: preserve conditional CSS and runtime-generated module styles.
    // The previous 349,952B baseline was missing styles after unsafe dedupe/purge.
    // Corrected output is 360,536B; retain <1.5KB of compression variance headroom.
    // 2026-10-08: the YouTube-inspired shell already measured 362,669B on main;
    // the session-resilience fix reduces that output while restoring CI headroom.
    // 2026-10-09: compressed offline baseline after adding the exam arranger's
    // import, allocation, confidential export, and DOCX output runtimes.
    // 2026-10-10: compressed mobile runtime and semantic hooks add a bounded
    // 329B over the previous cap; retain 671B cross-platform variance.
    ltHtmlBrotli: 376_000,
    // 2026-08-30: drill-system demand loader adds a guarded runtime entry.
    // 2026-10-09: four guarded exam arranger module registrations add 119B.
    publicRuntimeLoaderJs: 59_500,
    // Current minified app bundle baseline after runtime splits, cache guards,
    // and the product redesign CSS layer being accounted in the singlefile build.
    distAppJs: 585_000,
    distReportRenderJs: 68_000,
    distTeacherAnalysisJs: 72_000
};

assert.strictEqual(budgets.distAppCss, 652_000, 'approved CSS budget must remain fixed at 652000 bytes');

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
