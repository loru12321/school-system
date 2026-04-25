import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, 'dist');
const SRC_DIR = path.join(ROOT, 'src');
const WRANGLER_CONFIG_PATH = path.join(ROOT, 'wrangler.jsonc');
const WRANGLER_AUTH_PATH = path.join(process.env.APPDATA || '', 'xdg.config', '.wrangler', 'config', 'default.toml');
const TMP_DIR = path.join(ROOT, '.tmp-cf-direct');
const PROXY = process.env.CF_PROXY || 'http://127.0.0.1:7897';
const ACCOUNT_ID = 'af1077850d5b820c28d2425c5208b761';

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readJsonc(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const withoutComments = raw.replace(/^\s*\/\/.*$/gm, '');
  return JSON.parse(withoutComments);
}

function readOauthToken() {
  const raw = fs.readFileSync(WRANGLER_AUTH_PATH, 'utf8');
  const match = raw.match(/oauth_token\s*=\s*"([^"]+)"/);
  if (!match) {
    throw new Error('Unable to find Wrangler oauth_token in local auth config.');
  }
  return match[1];
}

function walkFiles(dirPath, baseDir = dirPath, fileList = []) {
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, baseDir, fileList);
      continue;
    }
    if (entry.isFile()) {
      fileList.push({
        fullPath,
        relativePath: path.relative(baseDir, fullPath).replace(/\\/g, '/')
      });
    }
  }
  return fileList;
}

function createAssetManifest(distDir) {
  const manifest = {};
  const hashToFile = new Map();
  const files = walkFiles(distDir);
  for (const file of files) {
    const content = fs.readFileSync(file.fullPath);
    const extension = path.extname(file.relativePath).replace(/^\./, '');
    const hash = crypto
      .createHash('sha256')
      .update(content.toString('base64') + extension)
      .digest('hex')
      .slice(0, 32);
    const manifestPath = `/${file.relativePath}`;
    manifest[manifestPath] = {
      hash,
      size: content.length
    };
    hashToFile.set(hash, {
      manifestPath,
      fullPath: file.fullPath
    });
  }
  return { manifest, hashToFile };
}

function curlJson(args, label) {
  const output = execFileSync('curl.exe', ['-sS', '-x', PROXY, ...args], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20
  });
  let parsed;
  try {
    parsed = JSON.parse(output);
  } catch (error) {
    throw new Error(`${label} returned non-JSON output:\n${output}`);
  }
  if (parsed && parsed.success === false) {
    throw new Error(`${label} failed: ${JSON.stringify(parsed.errors || parsed, null, 2)}`);
  }
  return parsed;
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function createBindings(config) {
  const bindings = [{ name: 'ASSETS', type: 'assets' }];
  for (const [name, text] of Object.entries(config.vars || {})) {
    bindings.push({
      name,
      type: 'plain_text',
      text: String(text)
    });
  }
  for (const db of config.d1_databases || []) {
    bindings.push({
      name: db.binding,
      type: 'd1',
      id: db.database_id
    });
  }
  return bindings;
}

function createMetadata(config, completionJwt) {
  const mainModule = path.basename(config.main);
  return {
    main_module: mainModule,
    compatibility_date: config.compatibility_date,
    bindings: createBindings(config),
    assets: {
      jwt: completionJwt,
      config: {
        html_handling: 'auto-trailing-slash',
        not_found_handling: 'single-page-application'
      }
    }
  };
}

function resolveModuleFiles(config) {
  const mainModulePath = path.join(ROOT, config.main);
  const importedModulePath = path.join(SRC_DIR, 'worker-gateway-d1.js');
  return [
    { name: path.basename(mainModulePath), filePath: mainModulePath },
    { name: path.basename(importedModulePath), filePath: importedModulePath }
  ];
}

function uploadAssets(workerName, uploadJwt, buckets, hashToFile) {
  let completionJwt = uploadJwt;
  for (let index = 0; index < buckets.length; index += 1) {
    const bucket = buckets[index] || [];
    const payload = {};
    for (const hash of bucket) {
      const fileInfo = hashToFile.get(hash);
      if (!fileInfo) {
        throw new Error(`Unable to resolve asset hash ${hash} to a local file.`);
      }
      payload[hash] = fs.readFileSync(fileInfo.fullPath).toString('base64');
    }
    const payloadPath = path.join(TMP_DIR, `assets-payload-${index + 1}.json`);
    writeJsonFile(payloadPath, payload);
    const response = curlJson(
      [
        '-X', 'POST',
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/assets/upload?base64=true`,
        '-H', `Authorization: Bearer ${uploadJwt}`,
        '-H', 'Content-Type: application/json',
        '--data-binary', `@${payloadPath}`
      ],
      `asset upload payload ${index + 1} for ${workerName}`
    );
    completionJwt = response?.result?.jwt || response?.jwt || completionJwt;
  }
  return completionJwt;
}

function deployScript(workerName, token, metadataPath, moduleFiles) {
  const args = [
    '-X', 'PUT',
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${workerName}`,
    '-H', `Authorization: Bearer ${token}`,
    '-F', `metadata=@${metadataPath};type=application/json`
  ];
  for (const moduleFile of moduleFiles) {
    args.push(
      '-F',
      `${moduleFile.name}=@${moduleFile.filePath};filename=${moduleFile.name};type=application/javascript+module`
    );
  }
  return curlJson(args, `script deploy for ${workerName}`);
}

function verifyService(workerName, token) {
  return curlJson(
    [
      '-X', 'GET',
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/services/${workerName}`,
      '-H', `Authorization: Bearer ${token}`
    ],
    `service verify for ${workerName}`
  );
}

function main() {
  ensureDir(TMP_DIR);
  const token = readOauthToken();
  const config = readJsonc(WRANGLER_CONFIG_PATH);
  const workerName = String(config.name || '').trim();
  if (!workerName) {
    throw new Error('wrangler.jsonc is missing a worker name.');
  }
  const { manifest, hashToFile } = createAssetManifest(DIST_DIR);
  const manifestPayload = { manifest };
  const manifestPath = path.join(TMP_DIR, 'manifest.json');
  writeJsonFile(manifestPath, manifestPayload);

  const uploadSession = curlJson(
    [
      '-X', 'POST',
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/scripts/${workerName}/assets-upload-session`,
      '-H', `Authorization: Bearer ${token}`,
      '-H', 'Content-Type: application/json',
      '--data-binary', `@${manifestPath}`
    ],
    `assets upload session for ${workerName}`
  );

  const uploadResult = uploadSession?.result || uploadSession;
  const uploadJwt = uploadResult?.jwt;
  const buckets = Array.isArray(uploadResult?.buckets) ? uploadResult.buckets : [];
  if (!uploadJwt) {
    throw new Error('Cloudflare did not return an asset upload JWT.');
  }

  const completionJwt = buckets.length
    ? uploadAssets(workerName, uploadJwt, buckets, hashToFile)
    : uploadJwt;

  const metadata = createMetadata(config, completionJwt);
  const metadataPath = path.join(TMP_DIR, 'metadata.json');
  writeJsonFile(metadataPath, metadata);

  const deployResponse = deployScript(workerName, token, metadataPath, resolveModuleFiles(config));
  const verifyResponse = verifyService(workerName, token);
  const result = {
    deployResponse,
    verifyResponse
  };
  const resultPath = path.join(TMP_DIR, 'deploy-result.json');
  writeJsonFile(resultPath, result);
  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
