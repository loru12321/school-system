const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
    const projectRoot = path.resolve(__dirname, '..');
    const moduleUrl = pathToFileURL(path.join(projectRoot, 'inline-scripts.mjs')).href;
    const { inlineLocalScripts } = await import(moduleUrl);

    const sourceHtml = [
        '<html><head></head><body>',
        '<script defer data-test="cloud-runtime" src="./assets/js/cloud.js?v=123"></script>',
        '<script src="https://example.com/external.js"></script>',
        '</body></html>'
    ].join('');

    const output = inlineLocalScripts(sourceHtml, { projectRoot });

    assert.ok(output.includes('<script defer data-test="cloud-runtime">'), 'should preserve non-src attributes on local scripts');
    assert.ok(output.includes("const CLOUD_TABLE = 'system_data';"), 'should inline the referenced local script content');
    assert.ok(output.includes('<script src="https://example.com/external.js"></script>'), 'should keep external scripts untouched');
    assert.ok(!output.includes('src="./assets/js/cloud.js?v=123"'), 'should remove the local script src after inlining');

    console.log('inline-scripts tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
