import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(import.meta.dirname, '..');
const downloadsDir = path.join(rootDir, 'public', 'downloads');
const outputDir = path.resolve(rootDir, process.env.RELEASE_ASSET_DIR || 'release-assets');
const releaseTag = String(process.env.RELEASE_TAG || process.env.GITHUB_REF_NAME || '').trim();
const sourceSha = String(process.env.GITHUB_SHA || '').trim();

const assets = [
  {
    key: 'android',
    label: 'Android APK',
    source: path.join(downloadsDir, 'school-system-android-v1.0.apk'),
    latestName: 'school-system-android-latest.apk',
    versionedPrefix: 'school-system-android'
  },
  {
    key: 'windows',
    label: 'Windows app package',
    source: path.join(downloadsDir, 'smartedu-windows-latest.zip'),
    latestName: 'smartedu-windows-latest.zip',
    versionedPrefix: 'smartedu-windows'
  }
];

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function sha256(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function sanitizeTag(tag) {
  return String(tag || 'manual').replace(/[^0-9A-Za-z._-]+/g, '-').replace(/^-+|-+$/g, '') || 'manual';
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const normalizedTag = sanitizeTag(releaseTag);
const manifest = {
  releaseTag: releaseTag || normalizedTag,
  sourceSha,
  generatedAt: new Date().toISOString(),
  assets: []
};

for (const asset of assets) {
  if (!fs.existsSync(asset.source)) {
    throw new Error(`Missing ${asset.label} release source: ${path.relative(rootDir, asset.source)}`);
  }

  const ext = path.extname(asset.latestName);
  const versionedName = `${asset.versionedPrefix}-${normalizedTag}${ext}`;
  const latestPath = path.join(outputDir, asset.latestName);
  const versionedPath = path.join(outputDir, versionedName);
  fs.copyFileSync(asset.source, latestPath);
  fs.copyFileSync(asset.source, versionedPath);

  const stats = fs.statSync(asset.source);
  manifest.assets.push({
    key: asset.key,
    label: asset.label,
    source: path.relative(rootDir, asset.source).replace(/\\/g, '/'),
    latestName: asset.latestName,
    versionedName,
    bytes: stats.size,
    size: formatBytes(stats.size),
    sha256: sha256(asset.source)
  });
}

const notes = [
  `# ${manifest.releaseTag}`,
  '',
  '## Downloads',
  '',
  '| Platform | Latest asset | Versioned asset | Size | SHA256 |',
  '| --- | --- | --- | ---: | --- |',
  ...manifest.assets.map((asset) => (
    `| ${asset.label} | \`${asset.latestName}\` | \`${asset.versionedName}\` | ${asset.size} | \`${asset.sha256}\` |`
  )),
  '',
  '## Verification',
  '',
  '- Root build completed before packaging release assets.',
  '- App download hygiene checks guard against stale APK/Windows links.',
  '- The release contains both stable latest filenames and immutable tag-specific filenames.',
  '',
  sourceSha ? `Source commit: \`${sourceSha}\`` : ''
].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n');

fs.writeFileSync(path.join(outputDir, 'release-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'release-notes.md'), `${notes}\n`, 'utf8');

console.log(JSON.stringify(manifest, null, 2));
