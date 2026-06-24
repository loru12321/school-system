import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const origin = (process.env.PROD_ORIGIN || 'https://schoolsystem.com.cn').replace(/\/+$/, '');
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestUrl = `${origin}/releases/release-manifest.json`;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  assert(response.ok, `failed to fetch ${url}: ${response.status}`);
  return response.json();
}

async function downloadFile(url, targetPath) {
  const response = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  assert(response.ok, `failed to download ${url}: ${response.status}`);
  const file = fs.createWriteStream(targetPath, { flags: 'w' });
  const hash = crypto.createHash('sha256');
  let bytes = 0;
  for await (const chunk of response.body) {
    bytes += chunk.length;
    hash.update(chunk);
    file.write(chunk);
  }
  await new Promise((resolve, reject) => file.end((error) => error ? reject(error) : resolve()));
  return { bytes, sha256: hash.digest('hex') };
}

function readMagic(targetPath) {
  const buffer = Buffer.alloc(2);
  const descriptor = fs.openSync(targetPath, 'r');
  try {
    fs.readSync(descriptor, buffer, 0, buffer.length, 0);
  } finally {
    fs.closeSync(descriptor);
  }
  return buffer.toString('ascii');
}

function fileSha256(targetPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(targetPath));
  return hash.digest('hex');
}

async function verifyUnpackedClientStarts() {
  const exePath = path.join(repositoryRoot, 'native-builds', 'windows', 'win-unpacked', 'school-system.exe');
  if (!fs.existsSync(exePath)) return { checked: false, reason: 'win-unpacked client missing' };
  const child = spawn(exePath, ['--disable-gpu'], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  child.unref();
  await new Promise((resolve) => setTimeout(resolve, 8000));
  let alive = true;
  try {
    process.kill(child.pid, 0);
  } catch {
    alive = false;
  }
  if (alive) {
    try {
      process.kill(child.pid);
    } catch {
      // The process may have already exited naturally.
    }
  }
  return { checked: true, started: alive, pid: child.pid };
}

const catalog = await fetchJson(manifestUrl);
const release = catalog?.releases?.[0] || {};
const windowsRelease = release?.platforms?.windows || {};
assert(windowsRelease.status === 'ready', 'Windows release is not ready');
assert(windowsRelease.assetUrl, 'Windows asset URL missing');
assert(/^[a-f0-9]{64}$/.test(String(windowsRelease.sha256 || '')), 'Windows SHA-256 missing');

const outputPath = path.join(os.tmpdir(), windowsRelease.assetName || 'school-system-windows-release.exe');
const downloaded = await downloadFile(windowsRelease.assetUrl, outputPath);
assert(downloaded.bytes === Number(windowsRelease.bytes || 0), 'downloaded Windows installer size mismatch');
assert(downloaded.sha256 === String(windowsRelease.sha256).toLowerCase(), 'downloaded Windows installer SHA-256 mismatch');
assert(readMagic(outputPath) === 'MZ', 'downloaded Windows installer is not a PE executable');

const localInstallerPath = path.join(repositoryRoot, 'native-builds', 'windows', 'school-system-windows-1.0.2-x64.exe');
const localInstallerSha256 = fs.existsSync(localInstallerPath) ? fileSha256(localInstallerPath) : '';
const localInstallerMatches = localInstallerSha256 ? localInstallerSha256 === downloaded.sha256 : null;
const unpacked = await verifyUnpackedClientStarts();

assert(unpacked.checked ? unpacked.started : true, 'win-unpacked client failed to start');
if (localInstallerMatches === false) throw new Error('production installer does not match local Windows build output');

console.log(JSON.stringify({
  ok: true,
  releaseTag: release.releaseTag,
  assetName: windowsRelease.assetName,
  bytes: downloaded.bytes,
  sha256: downloaded.sha256,
  magic: 'MZ',
  localInstallerMatches,
  unpackedClient: unpacked
}, null, 2));
