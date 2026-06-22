import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const installerSource = await readFile(path.join(root, 'desktop/windows-client/SchoolSystemInstaller.cs'), 'utf8');
const clientSource = await readFile(path.join(root, 'desktop/windows-client/SchoolSystemClient.cs'), 'utf8');
const exePath = path.join(root, 'public/downloads/school-system-windows-beta-20260621-9a362b3.exe');
const exe = await readFile(exePath);
const exeStat = await stat(exePath);
const manifest = JSON.parse(await readFile(path.join(root, 'public/releases/release-manifest.json'), 'utf8'));
const windowsAsset = manifest.releases[0].platforms.windows;

assert.ok(exeStat.size > 50 * 1024 * 1024, 'Windows download must be a full local NSIS/Electron installer, not the small launcher-only EXE');
assert.equal(exe.subarray(0, 2).toString('ascii'), 'MZ', 'Windows download must be a PE executable');
assert.ok(exe.includes(Buffer.from('PE\0\0', 'binary')), 'Windows download must contain a PE header');
assert.ok(exe.includes(Buffer.from('Nullsoft')), 'Windows download must be an NSIS installer');
assert.ok(exe.includes(Buffer.from('NSIS')), 'Windows download must include NSIS installer metadata');
assert.equal(windowsAsset.bytes, exeStat.size, 'Windows release manifest bytes must match the installer file');
assert.equal(
  windowsAsset.sha256,
  crypto.createHash('sha256').update(exe).digest('hex'),
  'Windows release manifest sha256 must match the installer file'
);
assert.ok(existsSync(path.join(root, 'native-builds/windows/win-unpacked/resources/app/index.html')), 'unpacked Windows build must include bundled local app resources');
assert.ok(existsSync(path.join(root, 'native-builds/windows/win-unpacked/resources/app/assets/js/app.js')), 'unpacked Windows build must include bundled app runtime');

const iconHashScript = `
Add-Type -AssemblyName System.Drawing
foreach ($p in @('desktop/assets/icon.ico','native-builds/windows/win-unpacked/school-system.exe','native-builds/windows/school-system-windows-1.0.2-x64.exe')) {
  $icon = [System.Drawing.Icon]::ExtractAssociatedIcon((Resolve-Path $p).Path)
  $bmp = $icon.ToBitmap()
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
  $sha = [System.Security.Cryptography.SHA256]::Create()
  [BitConverter]::ToString($sha.ComputeHash($ms.ToArray())).Replace('-', '').ToLowerInvariant()
}
`;
const iconHashes = execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', iconHashScript], {
  cwd: root,
  encoding: 'utf8',
}).trim().split(/\r?\n/).filter(Boolean);
assert.equal(iconHashes.length, 3, 'Windows icon verification should read source, unpacked app, and installer icons');
assert.equal(iconHashes[1], iconHashes[0], 'unpacked Windows executable must use the branded icon');
assert.equal(iconHashes[2], iconHashes[0], 'Windows installer must use the branded icon');

for (const required of [
  'InstallerForm',
  'UninstallerForm',
  'FolderBrowserDialog',
  'CreateShortcut',
  'RegisterUninstaller',
  'UninstallString',
  'QuietUninstallString',
  'AppVersion = "1.0.2"',
  'DisplayVersion", AppVersion',
  'EstimateInstalledSizeKb',
  '/uninstall',
  'school-system-client.exe',
  'FolderBrowserDialog',
  'SpecialFolder.StartMenu',
  'SpecialFolder.DesktopDirectory',
]) {
  assert.match(installerSource, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `installer source must include ${required}`);
}

assert.match(clientSource, /--app=/, 'installed launcher must open the web app in app-window mode');
assert.match(clientSource, /GetLaunchUrl/, 'small fallback launcher must prefer a bundled local index.html when used');
assert.match(clientSource, /https:\/\/schoolsystem\.com\.cn/, 'installed launcher must target the production site');

console.log('Windows installer contract verified.');
