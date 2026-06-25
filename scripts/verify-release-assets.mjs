import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const PLATFORM_RULES = Object.freeze({
  windows: { extension: '.exe', minimumBytes: 50 * 1024 * 1024 },
});

const repo = process.env.RELEASE_REPO || 'loru12321/school-system';
const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
const allowMissing = process.env.RELEASE_ASSETS_ALLOW_MISSING === 'true';

async function request(url, options = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'school-system-release-verifier',
    ...(options.headers || {}),
  };
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers, redirect: 'follow' });
}

function addFailure(result, platform, code, message, details = {}) {
  result.failures.push({ platform, code, message, ...details });
}

function isPackageContentType(value) {
  const contentType = String(value || '').toLowerCase();
  return !contentType.includes('text/html')
    && !contentType.includes('application/xhtml')
    && !contentType.includes('application/json')
    && !contentType.includes('text/plain');
}

export async function verifyReleaseManifest(manifest, options = {}) {
  const sendRequest = options.request || request;
  const result = {
    ok: false,
    releaseTag: String(manifest?.releaseTag || ''),
    channel: String(manifest?.channel || ''),
    sourceSha: String(manifest?.sourceSha || ''),
    platforms: {},
    failures: [],
  };

  if (!manifest || typeof manifest !== 'object' || Number(manifest.schemaVersion) !== 1) {
    addFailure(result, 'manifest', 'invalid-manifest', 'release-manifest.json must use schemaVersion 1');
    return result;
  }

  for (const [platform, rule] of Object.entries(PLATFORM_RULES)) {
    const asset = manifest.platforms?.[platform];
    const platformResult = { ok: false, status: String(asset?.status || 'missing'), headStatus: 0 };
    result.platforms[platform] = platformResult;
    if (!asset || typeof asset !== 'object') {
      addFailure(result, platform, 'missing-platform', `release-manifest.json is missing ${platform}`);
      continue;
    }

    if (asset.status !== 'ready') {
      addFailure(result, platform, 'not-ready', `${platform} status must be ready`);
      continue;
    }

    const assetName = String(asset.assetName || '');
    const assetUrl = String(asset.assetUrl || '');
    if (path.extname(assetName).toLowerCase() !== rule.extension) {
      addFailure(result, platform, 'invalid-extension', `${platform} asset must end in ${rule.extension}`, { assetName });
    }
    if (!Number.isSafeInteger(Number(asset.bytes)) || Number(asset.bytes) < rule.minimumBytes) {
      addFailure(result, platform, 'package-too-small', `${platform} asset is below ${rule.minimumBytes} bytes`, { bytes: Number(asset.bytes || 0) });
    }
    if (!/^[a-f0-9]{64}$/.test(String(asset.sha256 || ''))) {
      addFailure(result, platform, 'invalid-sha256', `${platform} asset must include a lowercase SHA-256`);
    }
    try {
      const parsed = new URL(assetUrl);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error();
    } catch {
      addFailure(result, platform, 'invalid-url', `${platform} asset URL must be credential-free HTTPS`);
    }

    if (result.failures.some((failure) => failure.platform === platform)) continue;

    let head;
    try {
      head = await sendRequest(assetUrl, { method: 'HEAD' });
    } catch (error) {
      addFailure(result, platform, 'head-request-failed', `${platform} HEAD request failed`, { reason: error.message });
      continue;
    }
    platformResult.headStatus = Number(head.status || 0);
    if (!head.ok) {
      addFailure(result, platform, 'head-http-error', `${platform} HEAD returned HTTP ${head.status}`, { status: head.status });
      continue;
    }
    const contentType = head.headers?.get?.('content-type') || '';
    if (!isPackageContentType(contentType)) {
      addFailure(result, platform, 'html-or-error-response', `${platform} package URL returned ${contentType || 'an invalid content type'}`, { contentType });
      continue;
    }
    const contentLength = Number(head.headers?.get?.('content-length') || 0);
    if (contentLength > 0 && contentLength < rule.minimumBytes) {
      addFailure(result, platform, 'remote-package-too-small', `${platform} remote package is below ${rule.minimumBytes} bytes`, { contentLength });
      continue;
    }
    platformResult.ok = true;
  }

  const failures = result.failures;
  result.ok = failures.length === 0;
  return result;
}

async function loadLatestManifest() {
  const response = await request(apiUrl, { cache: 'no-store' });
  if (!response.ok) {
    await response.arrayBuffer().catch(() => null);
    return {
      release: null,
      manifest: null,
      failure: { platform: 'manifest', code: 'release-unavailable', reason: 'release-unavailable', message: `latest release lookup failed: ${response.status}`, status: response.status },
    };
  }
  const release = await response.json();
  const manifestAsset = (Array.isArray(release.assets) ? release.assets : [])
    .find((asset) => String(asset.name || '') === 'release-manifest.json');
  if (!manifestAsset?.browser_download_url) {
    return {
      release,
      manifest: null,
      failure: { platform: 'manifest', code: 'missing-manifest', message: 'latest release has no release-manifest.json' },
    };
  }
  const manifestResponse = await request(manifestAsset.browser_download_url, { cache: 'no-store' });
  if (!manifestResponse.ok) {
    return {
      release,
      manifest: null,
      failure: { platform: 'manifest', code: 'manifest-http-error', message: `release-manifest.json returned HTTP ${manifestResponse.status}`, status: manifestResponse.status },
    };
  }
  try {
    return { release, manifest: JSON.parse(await manifestResponse.text()), failure: null };
  } catch {
    return {
      release,
      manifest: null,
      failure: { platform: 'manifest', code: 'invalid-manifest-json', message: 'release-manifest.json is not valid JSON' },
    };
  }
}

export async function main() {
  const localManifestPath = process.env.RELEASE_MANIFEST_PATH;
  let release = null;
  let manifest = null;
  let failure = null;
  if (localManifestPath) {
    try {
      manifest = JSON.parse(fs.readFileSync(localManifestPath, 'utf8'));
    } catch (error) {
      failure = { platform: 'manifest', code: 'local-manifest-error', message: error.message };
    }
  } else {
    ({ release, manifest, failure } = await loadLatestManifest());
  }

  const result = manifest
    ? await verifyReleaseManifest(manifest)
    : { ok: false, releaseTag: '', channel: '', sourceSha: '', platforms: {}, failures: [failure] };
  result.repo = repo;
  result.htmlUrl = release?.html_url || '';
  if (release?.tag_name && manifest?.releaseTag !== release.tag_name) {
    addFailure(result, 'manifest', 'tag-mismatch', 'manifest releaseTag does not match the GitHub Release tag');
    result.ok = false;
  }
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok && !allowMissing) {
    throw new Error(`release asset verification failed: ${result.failures.map((item) => `${item.platform}:${item.code}`).join(', ')}`);
  }
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
