import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildReleaseManifest } from './build-release-manifest.mjs';

const rootDir = path.resolve(import.meta.dirname, '..');
const tempRoot = path.resolve(os.tmpdir());
const repositoryReleaseRoot = path.join(rootDir, 'release-assets');
const specs = [
  { platform: 'windows', extension: '.exe' },
  { platform: 'android', extension: '.apk' },
  { platform: 'ios', extension: '.ipa', optional: true }
];

function resolveFromRoot(value) {
  return path.isAbsolute(value) ? path.normalize(value) : path.resolve(rootDir, value);
}

function isStrictlyWithin(parent, target) {
  const relative = path.relative(parent, target);
  return Boolean(relative) && !relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative);
}

function isWithinOrEqual(parent, target) {
  return path.resolve(parent) === path.resolve(target) || isStrictlyWithin(parent, target);
}

function assertSafeOutputTarget(target) {
  const resolved = path.resolve(target);
  if (!isWithinOrEqual(repositoryReleaseRoot, resolved) && !isStrictlyWithin(tempRoot, resolved)) {
    throw new Error(`Release output directory must be inside release-assets or the system temporary directory: ${resolved}`);
  }
  return resolved;
}

function assertSafeStagingTarget(target) {
  const resolved = path.resolve(target);
  if (!isStrictlyWithin(tempRoot, resolved)) throw new Error(`Release staging directory is outside the system temporary directory: ${resolved}`);
  return resolved;
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function prepareReleaseAssets(options = {}) {
  const inputDir = resolveFromRoot(options.inputDir || 'release-assets/input');
  const outputDir = assertSafeOutputTarget(resolveFromRoot(options.outputDir || 'release-assets'));
  const releaseTag = String(options.releaseTag || '').trim();
  const normalizedTag = releaseTag.replace(/[^0-9A-Za-z._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!normalizedTag) throw new Error('RELEASE_TAG (or GITHUB_REF_NAME) is required');
  if (!fs.existsSync(inputDir) || !fs.statSync(inputDir).isDirectory()) {
    throw new Error(`Release input directory does not exist: ${inputDir}`);
  }

  const inputFiles = fs.readdirSync(inputDir, { withFileTypes: true }).filter((entry) => entry.isFile());
  const stagingDir = assertSafeStagingTarget(fs.mkdtempSync(path.join(tempRoot, 'school-release-stage-')));
  try {
    for (const spec of specs) {
      const matches = inputFiles.filter((entry) => path.extname(entry.name).toLowerCase() === spec.extension);
      if (matches.length > 1) throw new Error(`Multiple ${spec.platform} ${spec.extension} assets found in ${inputDir}`);
      if (!matches.length) {
        if (!spec.optional) throw new Error(`Missing ${spec.platform} ${spec.extension} asset in ${inputDir}`);
        continue;
      }
      const outputName = `school-system-${spec.platform}-${normalizedTag}${spec.extension}`;
      fs.copyFileSync(path.join(inputDir, matches[0].name), path.join(stagingDir, outputName));
    }

    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(outputDir, { recursive: true });
    for (const entry of fs.readdirSync(stagingDir, { withFileTypes: true })) {
      if (!entry.isFile()) throw new Error(`Unexpected staging entry: ${entry.name}`);
      fs.copyFileSync(path.join(stagingDir, entry.name), path.join(outputDir, entry.name));
    }

    const manifest = buildReleaseManifest({
      channel: options.channel || (releaseTag.startsWith('beta-') ? 'beta' : 'stable'),
      releaseTag,
      sourceSha: options.sourceSha,
      assetDir: outputDir,
      outputPath: path.join(outputDir, 'release-manifest.json'),
      buildUrl: options.buildUrl,
      repository: options.repository
    });
    const readyAssets = Object.entries(manifest.platforms).filter(([, asset]) => asset.status === 'ready');
    const notes = [
      `# ${manifest.releaseTag}`,
      '',
      '## Downloads',
      '',
      '| Platform | Asset | Size | SHA256 |',
      '| --- | --- | ---: | --- |',
      ...readyAssets.map(([platform, asset]) => `| ${platform} | \`${asset.assetName}\` | ${formatBytes(asset.bytes)} | \`${asset.sha256}\` |`),
      '',
      '## Verification',
      '',
      '- Release assets were staged from `release-assets/input/` and hashed after tag-specific naming.',
      '- SHA256 values in this note match the generated release manifest.',
      '',
      `Source commit: \`${manifest.sourceSha}\``
    ].join('\n');
    fs.writeFileSync(path.join(outputDir, 'release-notes.md'), `${notes}\n`, 'utf8');
    return manifest;
  } finally {
    fs.rmSync(assertSafeStagingTarget(stagingDir), { recursive: true, force: true });
  }
}

export function prepareReleaseAssetsFromEnv(env = process.env) {
  const repository = env.GITHUB_REPOSITORY;
  return prepareReleaseAssets({
    inputDir: env.RELEASE_INPUT_DIR || 'release-assets/input',
    outputDir: env.RELEASE_ASSET_DIR || 'release-assets',
    channel: env.RELEASE_CHANNEL,
    releaseTag: env.RELEASE_TAG || env.GITHUB_REF_NAME,
    sourceSha: env.RELEASE_SOURCE_SHA || env.GITHUB_SHA,
    buildUrl: env.RELEASE_BUILD_URL || `${env.GITHUB_SERVER_URL || 'https://github.com'}/${repository}/actions/runs/${env.GITHUB_RUN_ID}`,
    repository
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    console.log(JSON.stringify(prepareReleaseAssetsFromEnv(), null, 2));
  } catch (error) {
    console.error(`Release asset preparation failed: ${error.message}`);
    process.exitCode = 1;
  }
}
