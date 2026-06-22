import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const installerSource = await readFile(path.join(root, 'desktop/windows-client/SchoolSystemInstaller.cs'), 'utf8');
const clientSource = await readFile(path.join(root, 'desktop/windows-client/SchoolSystemClient.cs'), 'utf8');
const exePath = path.join(root, 'public/downloads/school-system-windows-latest.exe');
const exe = await readFile(exePath);
const exeStat = await stat(exePath);

assert.ok(exeStat.size > 450_000, 'Windows download must be a bundled installer, not the small launcher-only EXE');
assert.equal(exe.subarray(0, 2).toString('ascii'), 'MZ', 'Windows download must be a PE executable');
assert.ok(exe.includes(Buffer.from('PE\0\0', 'binary')), 'Windows download must contain a PE header');

for (const required of [
  'InstallerForm',
  'UninstallerForm',
  'FolderBrowserDialog',
  'CreateShortcut',
  'RegisterUninstaller',
  'UninstallString',
  'QuietUninstallString',
  '/uninstall',
  'school-system-client.exe',
]) {
  assert.match(installerSource, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `installer source must include ${required}`);
}

assert.match(clientSource, /--app=/, 'installed launcher must open the web app in app-window mode');
assert.match(clientSource, /https:\/\/schoolsystem\.com\.cn/, 'installed launcher must target the production site');

console.log('Windows installer contract verified.');
