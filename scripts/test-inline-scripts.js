const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
    const projectRoot = path.resolve(__dirname, '..');
    const moduleUrl = pathToFileURL(path.join(projectRoot, 'scripts', 'build', 'inline-scripts.mjs')).href;
    const { inlineLocalScripts, inlineLocalStyles, buildLtHtml, collectInlineRuntimePaths } = await import(moduleUrl);

    const sourceHtml = [
        '<html><head></head><body>',
        '<script defer data-test="cloud-runtime" src="./assets/js/cloud.js?v=123"></script>',
        '<script src="https://example.com/external.js"></script>',
        '</body></html>'
    ].join('');

    const output = inlineLocalScripts(sourceHtml, { projectRoot });

    assert.ok(output.includes('<script defer data-test="cloud-runtime">'), 'should preserve non-src attributes on local scripts');
    assert.ok(output.includes('system_data'), 'should inline the referenced local script content');
    assert.ok(output.includes('<script src="https://example.com/external.js"></script>'), 'should keep external scripts untouched');
    assert.ok(!output.includes('src="./assets/js/cloud.js?v=123"'), 'should remove the local script src after inlining');

    const styleHtml = [
        '<html><head>',
        '<link rel="stylesheet" href="./test-style.css">',
        '<link rel="stylesheet" href="/assets/vendor/tabler-icons/tabler-icons.min.css">',
        '</head><body></body></html>'
    ].join('');
    const tempStylePath = path.join(projectRoot, 'dist', 'test-style.css');
    fs.writeFileSync(tempStylePath, 'body { color: red; }', 'utf8');
    const inlinedStyles = inlineLocalStyles(styleHtml, { projectRoot });
    assert.ok(inlinedStyles.includes('<style>\nbody { color: red; }\n</style>'), 'should inline local built stylesheets');
    assert.ok(inlinedStyles.includes('/assets/vendor/tabler-icons/tabler-icons.min.css'), 'should keep vendor stylesheets external');

    const ltHtml = buildLtHtml('<html><head><link rel="stylesheet" href="./test-style.css"><link rel="stylesheet" href="/assets/vendor/tabler-icons/tabler-icons.min.css"></head><body></body></html>', { projectRoot });
    assert.ok(ltHtml.includes('__INLINE_RUNTIME_SOURCES'), 'lt.html should include lazy runtime inline sources');
    assert.ok(ltHtml.includes('./assets/js/school-profile-runtime.js'), 'lt.html should carry school-profile runtime inline source');
    assert.ok(ltHtml.includes('./assets/js/county-analysis-runtime.js'), 'lt.html should carry county analysis runtime inline source from boot manifest');
    assert.ok(ltHtml.includes('./public/assets/vendor/tabler-icons/tabler-icons.min.css'), 'lt.html should rewrite vendor asset paths for local file usage');
    const inlineMapMatch = ltHtml.match(/window\.__INLINE_RUNTIME_SOURCES=(\{.*?\});<\/script>/s);
    assert.ok(inlineMapMatch, 'lt.html should expose an inline runtime source map');
    const inlineMap = JSON.parse(inlineMapMatch[1]);
    assert.ok(!String(inlineMap['./assets/vendor/gsap/ScrollTrigger.min.js'] || '').includes('</head>'), 'replacement should not expand $& tokens inside runtime sources');
    fs.unlinkSync(tempStylePath);

    const runtimePaths = collectInlineRuntimePaths(projectRoot);
    assert.ok(runtimePaths.includes('./assets/js/county-analysis-runtime.js'), 'runtime source collection should include county analysis');
    assert.ok(runtimePaths.includes('./assets/js/freshman-exam-runtime.js'), 'runtime source collection should include freshman exam tools');

    console.log('inline-scripts tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
