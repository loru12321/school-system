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
    .filter((entry) => entry.isFile()
      && entry.name.endsWith('.js')
      && !/^(boot-runtime|service-worker-runtime)-runtime-[0-9a-f]{12}\.js$/.test(entry.name))
    .map((entry) => path.join(dir, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

function normalizeVersionTokens(filePath, content) {
  const relative = path.relative(root, filePath).replace(/\\/g, '/');
  let normalized = String(content || '');
  if (relative === 'src/index.html') {
    normalized = normalized
      .replace(/\.\/assets\/js\/boot-runtime-runtime-[0-9a-f]{12}\.js/g, './assets/js/boot-runtime.js')
      .replace(/\.\/assets\/js\/service-worker-runtime-runtime-[0-9a-f]{12}\.js/g, './assets/js/service-worker-runtime.js');
    normalized = normalized.replace(/(\.\/assets\/js\/[^"']+\.js)\?v=[^"']+/g, '$1');
  }
  if (relative === 'public/assets/js/boot-runtime.js') {
    normalized = normalized.replace(/var BOOT_ASSET_VERSION_FALLBACK = '[^']+';/g, "var BOOT_ASSET_VERSION_FALLBACK = '__RUNTIME_VERSION__';");
  }
  if (relative === 'public/assets/js/service-worker-runtime.js') {
    normalized = normalized.replace(/const SERVICE_WORKER_VERSION = '[^']+';/g, "const SERVICE_WORKER_VERSION = '__RUNTIME_VERSION__';");
    normalized = normalized.replace(/const SERVICE_WORKER_PATH = '[^']+';/g, "const SERVICE_WORKER_PATH = '__SERVICE_WORKER_PATH__';");
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
          .replace(/\.\/assets\/js\/boot-runtime(?:-runtime-[0-9a-f]{12})?\.js(?:\?v=[^"']+)?/g, `./assets/js/boot-runtime-${version}.js`)
          .replace(/\.\/assets\/js\/service-worker-runtime(?:-runtime-[0-9a-f]{12})?\.js(?:\?v=[^"']+)?/g, `./assets/js/service-worker-runtime-${version}.js`)
          .replace(/(\.\/assets\/js\/(?!boot-runtime-|service-worker-runtime-)[^"']+\.js)\?v=[^"']+/g, '$1');
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
        return content
          .replace(/const SERVICE_WORKER_VERSION = '[^']+';/g, `const SERVICE_WORKER_VERSION = '${version}';`)
          .replace(/const SERVICE_WORKER_PATH = '[^']+';/g, `const SERVICE_WORKER_PATH = './sw-${version}.js';`);
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
  const generated = [
    {
      dir: publicJsDir,
      pattern: /^boot-runtime-runtime-[0-9a-f]{12}\.js$/,
      file: path.join(publicJsDir, `boot-runtime-${version}.js`),
      source: path.join(publicJsDir, 'boot-runtime.js')
    },
    {
      dir: publicJsDir,
      pattern: /^service-worker-runtime-runtime-[0-9a-f]{12}\.js$/,
      file: path.join(publicJsDir, `service-worker-runtime-${version}.js`),
      source: path.join(publicJsDir, 'service-worker-runtime.js')
    },
    {
      dir: path.join(root, 'public'),
      pattern: /^sw-runtime-[0-9a-f]{12}\.js$/,
      file: path.join(root, 'public', `sw-${version}.js`),
      source: path.join(root, 'public', 'sw.js')
    }
  ];
  for (const item of generated) {
    fs.readdirSync(item.dir).filter((name) => item.pattern.test(name) && path.join(item.dir, name) !== item.file)
      .forEach((name) => fs.unlinkSync(path.join(item.dir, name)));
    const content = read(item.source);
    if (!fs.existsSync(item.file) || read(item.file) !== content) {
      fs.writeFileSync(item.file, content, 'utf8');
      changed.push(path.relative(root, item.file).replace(/\\/g, '/'));
    }
  }
  return changed;
}

function main() {
  const version = buildRuntimeVersion();
  const changed = updateRuntimeVersions(version);
  console.log(JSON.stringify({ ok: true, runtimeVersion: version, changed }, null, 2));
}

main();
