import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const rootDir = path.resolve(import.meta.dirname, '..');
const DAY_MS = 86400000;
const PLATFORM_SPECS = Object.freeze({
  windows: { extension: '.exe', minimumOs: 'Windows 10 22H2', architectures: ['x64'], signed: 'unsigned' },
  android: { extension: '.apk', minimumOs: 'Android 10', architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'], signed: 'test-signed' },
  ios: { extension: '.ipa', minimumOs: 'iOS 16', architectures: ['arm64'], signed: false }
});

function required(value, name) {
  const text = String(value || '').trim();
  if (!text) throw new Error(`${name} is required`);
  return text;
}

function resolveFromRoot(value, name) {
  const text = required(value, name);
  return path.isAbsolute(text) ? path.normalize(text) : path.resolve(rootDir, text);
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function releaseAssetUrl(repository, releaseTag, assetName) {
  return `https://github.com/${repository}/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(assetName)}`;
}

export function buildReleaseManifest(options = {}) {
  const channel = required(options.channel, 'RELEASE_CHANNEL');
  if (!['beta', 'stable'].includes(channel)) throw new Error('RELEASE_CHANNEL must be beta or stable');

  const releaseTag = required(options.releaseTag, 'RELEASE_TAG');
  const validTag = channel === 'beta'
    ? /^beta-\d{8}-[0-9a-f]{7,40}$/.test(releaseTag)
    : /^school-system-v[0-9A-Za-z][0-9A-Za-z._-]*$/.test(releaseTag);
  if (!validTag) throw new Error(`RELEASE_TAG is invalid for the ${channel} channel`);

  const sourceSha = required(options.sourceSha, 'RELEASE_SOURCE_SHA').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('RELEASE_SOURCE_SHA must be a 40-character hexadecimal SHA');

  const assetDir = resolveFromRoot(options.assetDir, 'RELEASE_ASSET_DIR');
  const outputPath = resolveFromRoot(options.outputPath, 'RELEASE_OUTPUT');
  const buildUrl = required(options.buildUrl, 'RELEASE_BUILD_URL');
  try {
    const parsedBuildUrl = new URL(buildUrl);
    if (parsedBuildUrl.protocol !== 'https:' || !parsedBuildUrl.hostname || parsedBuildUrl.username || parsedBuildUrl.password) throw new Error();
  } catch {
    throw new Error('RELEASE_BUILD_URL must be an HTTPS URL without embedded credentials');
  }
  const repository = required(options.repository, 'GITHUB_REPOSITORY');
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('GITHUB_REPOSITORY must use owner/repository format');
  if (!fs.existsSync(assetDir) || !fs.statSync(assetDir).isDirectory()) throw new Error(`Release asset directory does not exist: ${assetDir}`);

  const generatedAtDate = options.generatedAt ? new Date(options.generatedAt) : new Date();
  if (!Number.isFinite(generatedAtDate.getTime())) throw new Error('generatedAt must be a valid date');
  const generatedAt = generatedAtDate.toISOString();
  const names = fs.readdirSync(assetDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, 'en'));

  const platforms = {};
  for (const [platform, spec] of Object.entries(PLATFORM_SPECS)) {
    const assetName = names.find((name) => path.extname(name).toLowerCase() === spec.extension);
    if (!assetName) {
      platforms[platform] = {
        status: platform === 'ios' ? 'awaiting-signing' : 'unavailable',
        signed: spec.signed,
        minimumOs: spec.minimumOs,
        architectures: [...spec.architectures],
        assetName: '',
        assetUrl: '',
        bytes: 0,
        sha256: '',
        buildUrl
      };
      continue;
    }
    const assetPath = path.join(assetDir, assetName);
    const stats = fs.statSync(assetPath);
    if (!stats.isFile() || stats.size <= 0) throw new Error(`Release asset must be a non-empty file: ${assetPath}`);
    platforms[platform] = {
      status: 'ready',
      signed: spec.signed,
      minimumOs: spec.minimumOs,
      architectures: [...spec.architectures],
      assetName,
      assetUrl: releaseAssetUrl(repository, releaseTag, assetName),
      bytes: stats.size,
      sha256: sha256(assetPath),
      buildUrl
    };
  }

  const manifest = {
    schemaVersion: 1,
    releaseTag,
    channel,
    sourceSha,
    generatedAt,
    expiresAt: channel === 'beta' ? new Date(generatedAtDate.getTime() + 90 * DAY_MS).toISOString() : '',
    releaseUrl: `https://github.com/${repository}/releases/tag/${encodeURIComponent(releaseTag)}`,
    platforms
  };
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export function buildReleaseManifestFromEnv(env = process.env) {
  return buildReleaseManifest({
    channel: env.RELEASE_CHANNEL,
    releaseTag: env.RELEASE_TAG,
    sourceSha: env.RELEASE_SOURCE_SHA,
    assetDir: env.RELEASE_ASSET_DIR,
    outputPath: env.RELEASE_OUTPUT,
    buildUrl: env.RELEASE_BUILD_URL,
    repository: env.GITHUB_REPOSITORY
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    console.log(JSON.stringify(buildReleaseManifestFromEnv(), null, 2));
  } catch (error) {
    console.error(`Release manifest generation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
