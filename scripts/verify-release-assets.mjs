const repo = process.env.RELEASE_REPO || 'hka123321/school-system';
const apiUrl = `https://api.github.com/repos/${repo}/releases/latest`;
const allowMissing = process.env.RELEASE_ASSETS_ALLOW_MISSING === 'true';
const required = [
    { key: 'android', pattern: /\.apk$/i },
    { key: 'desktop', pattern: /\.exe$/i }
];

async function request(url, options = {}) {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'school-system-release-verifier',
        ...(options.headers || {})
    };
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, { ...options, headers, redirect: 'manual' });
}

async function main() {
    const response = await request(apiUrl, { cache: 'no-store' });
    if (!response.ok) {
        await response.arrayBuffer().catch(() => null);
        const result = {
            ok: false,
            repo,
            latestRelease: null,
            status: response.status,
            reason: `latest release lookup failed: ${response.status}`,
            assets: Object.fromEntries(required.map((item) => [item.key, { ok: false, reason: 'release-unavailable' }]))
        };
        console.log(JSON.stringify(result, null, 2));
        if (allowMissing) return;
        throw new Error(result.reason);
    }
    const release = await response.json();
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const result = {
        ok: false,
        repo,
        tag: release.tag_name || '',
        html_url: release.html_url || '',
        assets: {}
    };

    for (const item of required) {
        const asset = assets.find((candidate) => item.pattern.test(String(candidate.name || '')));
        if (!asset) {
            result.assets[item.key] = { ok: false, reason: 'missing' };
            continue;
        }
        const downloadUrl = asset.browser_download_url || '';
        const head = await request(downloadUrl, { method: 'HEAD' }).catch((error) => ({ ok: false, status: 0, error }));
        result.assets[item.key] = {
            ok: !!head.ok || (head.status >= 300 && head.status < 400),
            name: asset.name,
            size: asset.size || 0,
            status: head.status || 0,
            url: downloadUrl
        };
    }

    const failures = Object.entries(result.assets)
        .filter(([, value]) => !value.ok)
        .map(([key, value]) => `${key}: ${value.reason || `HTTP ${value.status}`}`);
    result.ok = failures.length === 0;
    console.log(JSON.stringify(result, null, 2));
    if (failures.length) {
        if (allowMissing) return;
        throw new Error(`release asset verification failed: ${failures.join(', ')}`);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
