import fs from 'node:fs';
import path from 'node:path';
import { buildReleaseManifest } from './build-release-manifest.mjs';

const rootDir = path.resolve(import.meta.dirname, '..');
const inputDir = path.join(rootDir, 'release-assets', 'input');
const outputDir = path.resolve(rootDir, process.env.RELEASE_ASSET_DIR || 'release-assets');
const releaseTag = String(process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || '').trim();
const normalizedTag = releaseTag.replace(/[^0-9A-Za-z._-]+/g, '-').replace(/^-+|-+$/g, '');

if (!normalizedTag) throw new Error('RELEASE_TAG (or GITHUB_REF_NAME) is required');
if (!fs.existsSync(inputDir)) throw new Error(`Release input directory does not exist: ${path.relative(rootDir, inputDir)}`);

const specs = [
  { platform: 'windows', extension: '.exe' },
  { platform: 'android', extension: '.apk' },
  { platform: 'ios', extension: '.ipa', optional: true }
];
const inputFiles = fs.readdirSync(inputDir, { withFileTypes: true }).filter((entry) => entry.isFile());
fs.mkdirSync(outputDir, { recursive: true });
for (const entry of fs.readdirSync(outputDir, { withFileTypes: true })) {
  if (entry.isFile() && ['.exe', '.apk', '.ipa'].includes(path.extname(entry.name).toLowerCase())) {
    fs.rmSync(path.join(outputDir, entry.name));
  }
}

for (const spec of specs) {
  const matches = inputFiles.filter((entry) => path.extname(entry.name).toLowerCase() === spec.extension);
  if (matches.length > 1) throw new Error(`Multiple ${spec.platform} ${spec.extension} assets found in release-assets/input`);
  if (!matches.length) {
    if (!spec.optional) throw new Error(`Missing ${spec.platform} ${spec.extension} asset in release-assets/input`);
    continue;
  }
  const outputName = `school-system-${spec.platform}-${normalizedTag}${spec.extension}`;
  fs.copyFileSync(path.join(inputDir, matches[0].name), path.join(outputDir, outputName));
}

const manifest = buildReleaseManifest({
  channel: process.env.RELEASE_CHANNEL || (releaseTag.startsWith('beta-') ? 'beta' : 'stable'),
  releaseTag,
  sourceSha: process.env.RELEASE_SOURCE_SHA || process.env.GITHUB_SHA,
  assetDir: outputDir,
  outputPath: path.join(outputDir, 'release-manifest.json'),
  buildUrl: process.env.RELEASE_BUILD_URL || `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  repository: process.env.GITHUB_REPOSITORY
});

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

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
  '- Release assets were discovered from `release-assets/input/` and hashed after tag-specific naming.',
  '- SHA256 values in this note match the generated release manifest.',
  '',
  `Source commit: \`${manifest.sourceSha}\``
].join('\n');

fs.writeFileSync(path.join(outputDir, 'release-notes.md'), `${notes}\n`, 'utf8');
console.log(JSON.stringify(manifest, null, 2));
