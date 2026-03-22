const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function main() {
    const projectRoot = path.resolve(__dirname, '..');
    const moduleUrl = pathToFileURL(path.join(projectRoot, 'optimize-dist-html.mjs')).href;
    const { optimizeDistHtml } = await import(moduleUrl);

    const input = [
        '<html><body>',
        '<!-- remove me -->',
        '<style>body {\n  color: red;\n  margin: 0;\n}\n</style>',
        '<style media="print">.box {\n  padding: 4px 8px;\n}\n</style>',
        '<script>const value = 1 + 2;\nwindow.answer = value;\n</script>',
        '<script defer>function named () { return 42; }\nwindow.named = named;\n</script>',
        '<script src="./assets/js/app.js"></script>',
        '</body></html>'
    ].join('');

    const output = optimizeDistHtml(input);

    assert.strictEqual(output.includes('<!-- remove me -->'), false, 'should remove html comments outside protected blocks');
    assert.ok(/<style>body\{color:red;margin:0\}\s*<\/style>/.test(output), 'should minify plain inline styles');
    assert.ok(/<style media="print">\.box\{padding:4px 8px\}\s*<\/style>/.test(output), 'should preserve style tag attributes while minifying');
    assert.ok(/<script>const value=3;window\.answer=3;\s*<\/script>/.test(output), 'should minify plain inline scripts');
    assert.ok(/<script defer>function named\(\)\{return 42\}window\.named=named;\s*<\/script>/.test(output), 'should preserve attributes while minifying');
    assert.ok(output.includes('<script src="./assets/js/app.js"></script>'), 'should keep external scripts untouched');

    console.log('optimize-dist-html tests passed');
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
