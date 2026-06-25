import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../..');
const publicJsDir = path.join(root, 'public', 'assets', 'js');

const filesToHash = [
  path.join(root, 'src', 'index.html'),
  path.join(root, 'public', 'sw.js'),
  path.join(root, 'public', '_headers')
];

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeIfChanged(filePath, content) {
  if (read(filePath) === content) return false;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

function listJsFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
    .map((entry) => path.join(dir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function normalizeVersionTokens(filePath, content) {
  const relative = path.relative(root, filePath).replace(/\\/g, '/');
  let normalized = String(content || '');
  if (relative === 'src/index.html') {
    normalized = normalized
      .replace(/var refreshVersion = '[^']+';/g, "var refreshVersion = '__RUNTIME_VERSION__';")
      .replace(/boot-runtime\.js\?v=[^"']+/g, 'boot-runtime.js?v=__RUNTIME_VERSION__')
      .replace(/service-worker-runtime\.js\?v=[^"']+/g, 'service-worker-runtime.js?v=__RUNTIME_VERSION__');
  }
  if (relative === 'public/assets/js/boot-runtime.js') {
    normalized = normalized.replace(/var BOOT_ASSET_VERSION_FALLBACK = '[^']+';/g, "var BOOT_ASSET_VERSION_FALLBACK = '__RUNTIME_VERSION__';");
  }
  if (relative === 'public/assets/js/service-worker-runtime.js') {
    normalized = normalized.replace(/const SERVICE_WORKER_VERSION = '[^']+';/g, "const SERVICE_WORKER_VERSION = '__RUNTIME_VERSION__';");
  }
  if (relative === 'public/sw.js') {
    normalized = normalized.replace(/const CACHE_VERSION = '[^']+';/g, "const CACHE_VERSION = 'school-system-__RUNTIME_VERSION__';");
  }
  return normalized;
}

function buildRuntimeVersion() {
  const hash = crypto.createHash('sha256');
  for (const filePath of [...filesToHash, ...listJsFiles(publicJsDir)].sort((left, right) => left.localeCompare(right))) {
    const relative = path.relative(root, filePath).replace(/\\/g, '/');
    hash.update(`\n--- ${relative} ---\n`);
    hash.update(normalizeVersionTokens(filePath, read(filePath)));
  }
  return `runtime-${hash.digest('hex').slice(0, 12)}`;
}

function updateRuntimeVersions(version) {
  const replacements = [
    {
      file: path.join(root, 'src', 'index.html'),
      update(content) {
        return content
          .replace(/var refreshVersion = '[^']+';/g, `var refreshVersion = '${version}';`)
          .replace(/boot-runtime\.js\?v=[^"']+/g, `boot-runtime.js?v=${version}`)
          .replace(/service-worker-runtime\.js\?v=[^"']+/g, `service-worker-runtime.js?v=${version}`);
      }
    },
    {
      file: path.join(root, 'public', 'assets', 'js', 'boot-runtime.js'),
      update(content) {
        return content.replace(/var BOOT_ASSET_VERSION_FALLBACK = '[^']+';/g, `var BOOT_ASSET_VERSION_FALLBACK = '${version}';`);
      }
    },
    {
      file: path.join(root, 'public', 'assets', 'js', 'service-worker-runtime.js'),
      update(content) {
        return content.replace(/const SERVICE_WORKER_VERSION = '[^']+';/g, `const SERVICE_WORKER_VERSION = '${version}';`);
      }
    },
    {
      file: path.join(root, 'public', 'sw.js'),
      update(content) {
        return content.replace(/const CACHE_VERSION = '[^']+';/g, `const CACHE_VERSION = 'school-system-${version}';`);
      }
    }
  ];

  const changed = [];
  for (const item of replacements) {
    const next = item.update(read(item.file));
    if (writeIfChanged(item.file, next)) changed.push(path.relative(root, item.file).replace(/\\/g, '/'));
  }
  return changed;
}

function main() {
  const version = buildRuntimeVersion();
  const changed = updateRuntimeVersions(version);
  console.log(JSON.stringify({ ok: true, runtimeVersion: version, changed }, null, 2));
}

main();
