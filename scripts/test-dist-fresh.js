const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const fixture = fs.mkdtempSync(path.join(root, '.tmp-dist-fresh-'));
try {
    const write = (name, age) => {
        const target = path.join(fixture, name);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, 'fixture');
        const time = new Date(Date.now() - age);
        fs.utimesSync(target, time, time);
    };
    fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
    fs.copyFileSync(path.join(__dirname, 'check-dist-fresh.js'), path.join(fixture, 'scripts/check-dist-fresh.js'));
    const run = () => spawnSync(process.execPath, [path.join(fixture, 'scripts/check-dist-fresh.js')], { encoding: 'utf8' });
    assert.equal(run().status, 1, 'missing build must fail');
    write('dist/index.html', 10000);
    write('src/index.html', 20000);
    assert.equal(run().status, 0, 'unchanged source should pass');
    for (const name of ['public/assets/js/nested/runtime.js', 'src/assets/css/layout.css', 'scripts/build/transform.mjs', 'package-lock.json', 'public/_headers']) {
        write(name, 0);
        const result = run();
        assert.equal(result.status, 1, name + ' changes must require rebuilding');
        assert.ok(result.stderr.includes(name.replace(/\//g, path.sep)) || result.stderr.includes(name));
        write(name, 20000);
    }
    console.log('Build freshness coverage tests passed');
} finally {
    assert.ok(fixture.startsWith(root + path.sep + '.tmp-dist-fresh-'));
    fs.rmSync(fixture, { recursive: true, force: true });
}
