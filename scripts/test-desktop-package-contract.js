const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const main = fs.readFileSync(path.join(root, 'desktop/main.cjs'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'desktop/preload.cjs'), 'utf8');
const offline = fs.readFileSync(path.join(root, 'desktop/offline.html'), 'utf8');
const builder = fs.readFileSync(path.join(root, 'electron-builder.yml'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.ok(main.includes('requestSingleInstanceLock'), 'desktop shell must enforce one running instance');
assert.ok(main.includes('contextIsolation: true'), 'renderer must use context isolation');
assert.ok(main.includes('nodeIntegration: false'), 'renderer must not expose Node.js');
assert.ok(main.includes('sandbox: true'), 'renderer must use the Chromium sandbox');
assert.ok(main.includes('https://schoolsystem.com.cn'), 'desktop shell must use the production origin');
assert.ok(main.includes('setWindowOpenHandler'), 'new windows must be intercepted');
assert.ok(main.includes('will-navigate'), 'top-level navigation must be allowlisted');
assert.ok(main.includes('shell.openExternal'), 'approved release links should open outside the app');
assert.ok(main.includes("url.username === ''") && main.includes("url.password === ''"), 'allowlisted URLs must reject embedded credentials');
assert.ok(main.includes('url.pathname === RELEASE_PATH_PREFIX'), 'release allowlist must use an exact path boundary');
assert.ok(main.includes('offline.html'), 'failed initial loads must show the offline fallback');
assert.ok(!main.includes('ipcMain.handle'), 'desktop shell must not expose arbitrary IPC handlers');
assert.ok(preload.includes('contextBridge.exposeInMainWorld'), 'preload should expose a narrow metadata bridge');
assert.ok(preload.includes('Object.freeze'), 'exposed metadata must be immutable');
assert.ok(!preload.includes('ipcRenderer'), 'preload must not expose IPC');
assert.ok(main.includes('additionalArguments'), 'sandboxed preload metadata should arrive through launch arguments');
assert.ok(!preload.includes("require('../package.json')"), 'sandboxed preload must not require local files');
assert.ok(offline.includes('Content-Security-Policy'), 'offline page should declare a CSP');
assert.ok(builder.includes('school-system-windows-${version}-${arch}.${ext}'), 'installer artifact should carry version and architecture');
assert.equal(packageJson.main, 'desktop/main.cjs', 'Electron must package the secure desktop entry point');
assert.equal(packageJson.scripts?.['desktop:start'], 'electron desktop/main.cjs');
assert.equal(packageJson.scripts?.['desktop:build'], 'electron-builder --win nsis --x64');

console.log('desktop package contract tests passed');
