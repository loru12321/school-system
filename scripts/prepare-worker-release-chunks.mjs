import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const temporaryRoot = path.resolve(os.tmpdir());
const DEFAULT_CHUNK_BYTES = 20 * 1024 * 1024;
const DAY_MS = 86400000;
const PLATFORM_SPECS = Object.freeze([
  {
    platform: 'windows',
    extension: '.exe',
    contentType: 'application/vnd.microsoft.portable-executable',
    minimumOs: 'Windows 10 22H2',
    architectures: ['x64'],
    signed: 'unsigned'
  },
  {
    platform: 'android',
    extension: '.apk',
    contentType: 'application/vnd.android.package-archive',
    minimumOs: 'Android 10',
    architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
    signed: 'test-signed'
  }
]);

function isWithin(parent, target) {
  const relative = path.relative(parent, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function assertNoTraversal(value, label) {
  if (String(value || '').split(/[\\/]+/).some((part) => part === '..')) {
    throw new Error(`${label} directory contains a path traversal segment`);
  }
}

function assertTrustedDirectory(value, label, { mustExist = false } = {}) {
  assertNoTraversal(value, label);
  const resolved = path.resolve(String(value || ''));
  if (!isWithin(repositoryRoot, resolved) && !isWithin(temporaryRoot, resolved)) {
    throw new Error(`${label} directory is outside approved roots`);
  }
  let current = path.parse(resolved).root;
  for (const part of resolved.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) break;
    const stats = fs.lstatSync(current);
    if (stats.isSymbolicLink()) throw new Error(`${label} directory contains a symbolic link`);
  }
  if (mustExist && (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory())) {
    throw new Error(`${label} directory does not exist`);
  }
  return resolved;
}

function writeJsonAtomic(outputPath, value) {
  const temporaryPath = `${outputPath}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  fs.renameSync(temporaryPath, outputPath);
}

function normalizedOrigin(value) {
  let parsed;
  try {
    parsed = new URL(String(value || ''));
  } catch {
    throw new Error('release origin must be a valid HTTPS origin');
  }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('release origin must be a valid HTTPS origin');
  }
  return parsed.origin;
}

function validateReleaseIdentity(releaseTag, sourceSha) {
  if (!/^beta-\d{8}-[0-9a-f]{7,40}$/.test(releaseTag)) throw new Error('release tag is invalid');
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('source SHA is invalid');
}

function discoverInputs(inputDirectory) {
  const entries = fs.readdirSync(inputDirectory, { withFileTypes: true });
  if (entries.some((entry) => entry.isSymbolicLink())) throw new Error('release input directory contains a symbolic link');
  return PLATFORM_SPECS.map((spec) => {
    const matches = entries.filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === spec.extension);
    if (matches.length !== 1) throw new Error(`exactly one ${spec.extension} input is required`);
    const sourcePath = path.join(inputDirectory, matches[0].name);
    const stats = fs.statSync(sourcePath);
    if (!stats.isFile() || stats.size <= 0) throw new Error(`${spec.platform} input must be a non-empty file`);
    return { ...spec, sourcePath, bytes: stats.size };
  });
}

function splitFile(sourcePath, targetDirectory, chunkSize) {
  fs.rmSync(targetDirectory, { recursive: true, force: true });
  fs.mkdirSync(targetDirectory, { recursive: true });
  const descriptor = fs.openSync(sourcePath, 'r');
  const chunks = [];
  const chunkBytes = [];
  const hash = crypto.createHash('sha256');
  const buffer = Buffer.allocUnsafe(chunkSize);
  try {
    let index = 1;
    while (true) {
      const bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (!bytesRead) break;
      const payload = buffer.subarray(0, bytesRead);
      hash.update(payload);
      const partName = `part-${String(index).padStart(4, '0')}`;
      fs.writeFileSync(path.join(targetDirectory, partName), payload, { flag: 'wx' });
      chunks.push(partName);
      chunkBytes.push(bytesRead);
      index += 1;
    }
  } finally {
    fs.closeSync(descriptor);
  }
  return { chunks, chunkBytes, sha256: hash.digest('hex') };
}

export function prepareWorkerReleaseChunks(options = {}) {
  const inputDirectory = assertTrustedDirectory(options.inputDir, 'input', { mustExist: true });
  const outputDirectory = assertTrustedDirectory(options.outputDir, 'output');
  const releaseTag = String(options.releaseTag || '').trim();
  const sourceSha = String(options.sourceSha || '').trim().toLowerCase();
  const origin = normalizedOrigin(options.origin);
  const chunkBytes = Number(options.chunkBytes ?? DEFAULT_CHUNK_BYTES);
  validateReleaseIdentity(releaseTag, sourceSha);
  if (!Number.isSafeInteger(chunkBytes) || chunkBytes < 1 || chunkBytes > DEFAULT_CHUNK_BYTES) {
    throw new Error(`chunkBytes must be an integer between 1 and ${DEFAULT_CHUNK_BYTES}`);
  }

  fs.mkdirSync(outputDirectory, { recursive: true });
  const downloads = discoverInputs(inputDirectory).map((input) => {
    const relativeRoot = path.posix.join('packages', releaseTag, input.platform);
    const absoluteRoot = path.join(outputDirectory, ...relativeRoot.split('/'));
    const split = splitFile(input.sourcePath, absoluteRoot, chunkBytes);
    const filename = `school-system-${input.platform}-${releaseTag}${input.extension}`;
    return {
      platform: input.platform,
      filename,
      contentType: input.contentType,
      bytes: input.bytes,
      sha256: split.sha256,
      chunks: split.chunks.map((partName) => path.posix.join(relativeRoot, partName)),
      chunkBytes: split.chunkBytes
    };
  });

  const generatedAt = options.generatedAt ? new Date(options.generatedAt) : new Date();
  if (!Number.isFinite(generatedAt.getTime())) throw new Error('generatedAt is invalid');
  const generatedAtIso = generatedAt.toISOString();
  const buildNumber = sourceSha.slice(0, 12);
  const version = releaseTag.replace(/^beta-/, '');
  const platforms = Object.fromEntries(downloads.map((download) => {
    const spec = PLATFORM_SPECS.find((item) => item.platform === download.platform);
    return [download.platform, {
      platform: download.platform,
      version,
      buildNumber,
      status: 'ready',
      signed: spec.signed,
      minimumOs: spec.minimumOs,
      architectures: [...spec.architectures],
      assetName: download.filename,
      assetUrl: `${origin}/downloads/${encodeURIComponent(download.filename)}`,
      bytes: download.bytes,
      sha256: download.sha256,
      notes: [],
      buildUrl: `${origin}/`
    }];
  }));
  platforms.ios = {
    platform: 'ios',
    version,
    buildNumber,
    status: 'awaiting-signing',
    signed: false,
    minimumOs: 'iOS 16',
    architectures: ['arm64'],
    assetName: '',
    assetUrl: '',
    bytes: 0,
    sha256: '',
    notes: [],
    buildUrl: `${origin}/`
  };

  const downloadMap = { schemaVersion: 1, releaseTag, sourceSha, downloads };
  const releaseCatalog = {
    schemaVersion: 1,
    releases: [{
      schemaVersion: 1,
      releaseTag,
      channel: 'beta',
      sourceSha,
      generatedAt: generatedAtIso,
      expiresAt: new Date(generatedAt.getTime() + 90 * DAY_MS).toISOString(),
      releaseUrl: '',
      platforms
    }]
  };
  writeJsonAtomic(path.join(outputDirectory, 'download-map.json'), downloadMap);
  writeJsonAtomic(path.join(outputDirectory, 'release-manifest.json'), releaseCatalog);
  return { downloads, releaseCatalog };
}

export function prepareWorkerReleaseChunksFromEnv(env = process.env) {
  return prepareWorkerReleaseChunks({
    inputDir: env.RELEASE_INPUT_DIR,
    outputDir: env.RELEASE_OUTPUT_DIR || path.join(repositoryRoot, 'dist', 'releases'),
    releaseTag: env.RELEASE_TAG,
    sourceSha: env.RELEASE_SOURCE_SHA,
    origin: env.RELEASE_ORIGIN,
    generatedAt: env.RELEASE_GENERATED_AT,
    chunkBytes: env.RELEASE_CHUNK_BYTES ? Number(env.RELEASE_CHUNK_BYTES) : DEFAULT_CHUNK_BYTES
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    console.log(JSON.stringify(prepareWorkerReleaseChunksFromEnv(), null, 2));
  } catch (error) {
    console.error(`Worker release preparation failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
