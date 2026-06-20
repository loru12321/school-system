import crypto from 'node:crypto';
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

function allowedBoundary(target) {
  if (isWithinOrEqual(rootDir, target)) return rootDir;
  if (isStrictlyWithin(tempRoot, target)) return tempRoot;
  return '';
}

function assertSafeOutputTarget(target) {
  const resolved = path.resolve(target);
  if (!isWithinOrEqual(repositoryReleaseRoot, resolved) && !isStrictlyWithin(tempRoot, resolved)) {
    throw new Error(`Release output directory must be inside release-assets or the system temporary directory: ${resolved}`);
  }
  return resolved;
}

function assertSafeInputTarget(target) {
  const resolved = path.resolve(target);
  if (!allowedBoundary(resolved)) throw new Error(`Release input directory must be inside the repository or system temporary directory: ${resolved}`);
  return resolved;
}

function assertNoLinkedTree(target, walkTree = true) {
  const resolved = path.resolve(target);
  const boundary = allowedBoundary(resolved);
  if (!boundary) throw new Error(`Path is outside approved roots: ${resolved}`);
  const relative = path.relative(boundary, resolved);
  let current = boundary;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) break;
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Symbolic link or junction is not allowed: ${current}`);
  }
  if (!walkTree || !fs.existsSync(resolved)) return;
  const visit = (entryPath) => {
    const stats = fs.lstatSync(entryPath);
    if (stats.isSymbolicLink()) throw new Error(`Symbolic link or junction is not allowed: ${entryPath}`);
    if (stats.isDirectory()) {
      for (const entry of fs.readdirSync(entryPath)) visit(path.join(entryPath, entry));
    }
  };
  visit(resolved);
}

function assertManagedSibling(target, outputDir, kind) {
  const resolved = path.resolve(target);
  const expectedPrefix = `.${path.basename(outputDir)}.${kind}-`;
  if (path.dirname(resolved) !== path.dirname(outputDir) || !path.basename(resolved).startsWith(expectedPrefix)) {
    throw new Error(`Unsafe ${kind} directory: ${resolved}`);
  }
  if (!allowedBoundary(resolved)) throw new Error(`Unsafe ${kind} directory root: ${resolved}`);
  return resolved;
}

function removeManagedTree(target, outputDir, kind) {
  const resolved = assertManagedSibling(target, outputDir, kind);
  if (!fs.existsSync(resolved)) return;
  assertNoLinkedTree(resolved);
  fs.rmSync(resolved, { recursive: true, force: true });
}

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function releaseNotes(manifest) {
  const readyAssets = Object.entries(manifest.platforms).filter(([, asset]) => asset.status === 'ready');
  return [
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
}

export function prepareReleaseAssets(options = {}) {
  const inputDir = assertSafeInputTarget(resolveFromRoot(options.inputDir || 'release-assets/input'));
  const outputDir = assertSafeOutputTarget(resolveFromRoot(options.outputDir || 'release-assets'));
  const releaseTag = String(options.releaseTag || '').trim();
  const normalizedTag = releaseTag.replace(/[^0-9A-Za-z._-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!normalizedTag) throw new Error('RELEASE_TAG (or GITHUB_REF_NAME) is required');
  if (!fs.existsSync(inputDir) || !fs.lstatSync(inputDir).isDirectory()) throw new Error(`Release input directory does not exist: ${inputDir}`);
  assertNoLinkedTree(inputDir);
  assertNoLinkedTree(path.dirname(outputDir), false);
  if (fs.existsSync(outputDir)) assertNoLinkedTree(outputDir);

  const inputFiles = fs.readdirSync(inputDir, { withFileTypes: true }).filter((entry) => entry.isFile());
  fs.mkdirSync(path.dirname(outputDir), { recursive: true });
  const stagingDir = assertManagedSibling(
    fs.mkdtempSync(path.join(path.dirname(outputDir), `.${path.basename(outputDir)}.stage-`)),
    outputDir,
    'stage'
  );
  const backupDir = assertManagedSibling(
    path.join(path.dirname(outputDir), `.${path.basename(outputDir)}.backup-${process.pid}-${crypto.randomBytes(6).toString('hex')}`),
    outputDir,
    'backup'
  );
  let published = false;
  let backupCreated = false;
  try {
    for (const spec of specs) {
      const matches = inputFiles.filter((entry) => path.extname(entry.name).toLowerCase() === spec.extension);
      if (matches.length > 1) throw new Error(`Multiple ${spec.platform} ${spec.extension} assets found in ${inputDir}`);
      if (!matches.length) {
        if (!spec.optional) throw new Error(`Exactly one ${spec.platform} ${spec.extension} asset is required in ${inputDir}`);
        continue;
      }
      const outputName = `school-system-${spec.platform}-${normalizedTag}${spec.extension}`;
      fs.copyFileSync(path.join(inputDir, matches[0].name), path.join(stagingDir, outputName));
    }

    const manifest = buildReleaseManifest({
      channel: options.channel || (releaseTag.startsWith('beta-') ? 'beta' : 'stable'),
      releaseTag,
      sourceSha: options.sourceSha,
      assetDir: stagingDir,
      outputPath: path.join(stagingDir, 'release-manifest.json'),
      buildUrl: options.buildUrl,
      repository: options.repository,
      requireCoreAssets: true
    });
    fs.writeFileSync(path.join(stagingDir, 'release-notes.md'), `${releaseNotes(manifest)}\n`, 'utf8');
    assertNoLinkedTree(stagingDir);

    if (fs.existsSync(outputDir)) {
      fs.renameSync(outputDir, backupDir);
      backupCreated = true;
    }
    try {
      fs.renameSync(stagingDir, outputDir);
      published = true;
    } catch (publishError) {
      if (backupCreated && !fs.existsSync(outputDir)) {
        fs.renameSync(backupDir, outputDir);
        backupCreated = false;
      }
      throw publishError;
    }
    if (backupCreated) {
      removeManagedTree(backupDir, outputDir, 'backup');
      backupCreated = false;
    }
    return manifest;
  } finally {
    if (!published && fs.existsSync(stagingDir)) removeManagedTree(stagingDir, outputDir, 'stage');
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
