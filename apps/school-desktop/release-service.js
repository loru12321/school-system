const https = require('node:https');

const RELEASE_PAGE_URL = 'https://github.com/loru12321/school-system/releases/latest';
const RELEASES_API_URL = 'https://api.github.com/repos/loru12321/school-system/releases?per_page=12';

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
    return String(value || '').trim();
}

function extractReleaseBullets(body) {
    const lines = normalizeText(body)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    const bullets = lines
        .filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))
        .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
        .filter(Boolean);

    if (bullets.length) {
        return bullets.slice(0, 6);
    }

    return lines.filter((line) => line.length >= 4).slice(0, 4);
}

function sortReleasesByDate(list) {
    return ensureArray(list)
        .slice()
        .sort((left, right) => {
            const leftTime = new Date(left?.date || 0).getTime();
            const rightTime = new Date(right?.date || 0).getTime();
            return rightTime - leftTime;
        });
}

function pickReleaseAsset(assets, channelKey) {
    const channel = channelKey === 'desktop' ? 'desktop' : 'android';
    return ensureArray(assets).find((asset) => {
        const name = normalizeText(asset?.name).toLowerCase();
        if (!name) return false;
        if (channel === 'android') return name.endsWith('.apk');
        return name.endsWith('.exe') && (name.includes('desktop') || name.includes('smartedu'));
    }) || null;
}

function normalizePlatformVersion(entry, fallbackLabel) {
    if (!entry) return null;

    if (typeof entry === 'string') {
        const version = normalizeText(entry);
        if (!version) return null;
        return {
            label: fallbackLabel,
            version,
            build: '',
            line: version
        };
    }

    if (typeof entry !== 'object') return null;

    const label = normalizeText(entry.label || fallbackLabel);
    const version = normalizeText(entry.version);
    const build = normalizeText(entry.build);
    const line = [version, build ? `build ${build}` : ''].filter(Boolean).join(' · ');

    if (!line) return null;

    return {
        label,
        version,
        build,
        line
    };
}

function parsePlatformVersionFromBody(body, channelKey) {
    const source = normalizeText(body);
    if (!source) return null;

    const patterns = channelKey === 'desktop'
        ? [
            /(?:windows|desktop)\s*(?:exe|client|客户端)?\s*(?:version|版本)[:：]\s*([^\r\n]+)/i
        ]
        : [
            /android\s*(?:apk|client|客户端)?\s*(?:version|版本)[:：]\s*([^\r\n]+)/i
        ];

    for (const pattern of patterns) {
        const match = source.match(pattern);
        if (!match) continue;

        const raw = normalizeText(match[1]);
        if (!raw) continue;

        const buildMatch = raw.match(/build\s*([0-9A-Za-z._-]+)/i);
        const version = normalizeText(raw.replace(/\(?\s*build\s*[0-9A-Za-z._-]+\)?/ig, ''));
        return normalizePlatformVersion(
            {
                version,
                build: buildMatch ? buildMatch[1] : ''
            },
            channelKey === 'desktop' ? 'Windows 客户端' : 'Android APK'
        );
    }

    return null;
}

function getPlatformVersions(record, body) {
    const source = (record?.platform_versions && typeof record.platform_versions === 'object')
        ? record.platform_versions
        : (record?.platformVersions && typeof record.platformVersions === 'object')
            ? record.platformVersions
            : {};

    return {
        android: normalizePlatformVersion(source.android, 'Android APK')
            || parsePlatformVersionFromBody(body, 'android'),
        desktop: normalizePlatformVersion(source.desktop, 'Windows 客户端')
            || parsePlatformVersionFromBody(body, 'desktop')
    };
}

function mapRelease(record) {
    const tag = normalizeText(record?.tag_name || record?.tagName);
    const assets = ensureArray(record?.assets);
    const body = normalizeText(record?.body);
    const platformVersions = getPlatformVersions(record, body);
    const androidAsset = pickReleaseAsset(assets, 'android');
    const desktopAsset = pickReleaseAsset(assets, 'desktop');

    return {
        tag,
        name: normalizeText(record?.name || tag || 'Untitled Release'),
        date: normalizeText(record?.published_at || record?.publishedAt || record?.created_at),
        url: normalizeText(record?.html_url || record?.url || RELEASE_PAGE_URL),
        body,
        bullets: extractReleaseBullets(body),
        platformVersions,
        assets: {
            android: androidAsset
                ? {
                    name: normalizeText(androidAsset.name),
                    url: normalizeText(androidAsset.browser_download_url || androidAsset.url),
                    size: Number(androidAsset.size || 0)
                }
                : null,
            desktop: desktopAsset
                ? {
                    name: normalizeText(desktopAsset.name),
                    url: normalizeText(desktopAsset.browser_download_url || desktopAsset.url),
                    size: Number(desktopAsset.size || 0)
                }
                : null
        }
    };
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const request = https.request(
            url,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'SmartEdu-Desktop-Release-Checker'
                }
            },
            (response) => {
                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf8');
                    if (response.statusCode && response.statusCode >= 400) {
                        reject(new Error(`GitHub release API returned ${response.statusCode}`));
                        return;
                    }
                    try {
                        resolve(JSON.parse(body));
                    } catch (error) {
                        reject(error);
                    }
                });
            }
        );

        request.on('error', reject);
        request.setTimeout(12000, () => request.destroy(new Error('GitHub release API request timed out')));
        request.end();
    });
}

async function fetchReleaseCatalog() {
    const payload = await fetchJson(RELEASES_API_URL);
    return sortReleasesByDate(ensureArray(payload).map(mapRelease).filter((item) => item.tag));
}

function getLatestReleaseForChannel(channelKey, releases) {
    return ensureArray(releases).find((release) => release?.assets?.[channelKey]) || ensureArray(releases)[0] || null;
}

function getDateToken(value) {
    return normalizeText(value).slice(0, 10);
}

function getDesktopUpdateState({ currentVersion, currentReleaseTag, currentReleaseDate, releases }) {
    const releaseList = sortReleasesByDate(releases);
    const latestRelease = getLatestReleaseForChannel('desktop', releaseList);
    const currentTag = normalizeText(currentReleaseTag);
    const currentRelease = currentTag
        ? releaseList.find((release) => release.tag === currentTag)
        : null;

    if (!latestRelease) {
        return {
            status: 'unavailable',
            isLatest: false,
            updateAvailable: false,
            currentVersion: normalizeText(currentVersion),
            currentReleaseTag: currentTag,
            currentReleaseDate: normalizeText(currentReleaseDate),
            latestRelease: null,
            releases: releaseList,
            statusLabel: '暂未读取到线上版本',
            statusBody: '当前无法读取 GitHub release，请稍后重试。'
        };
    }

    if (currentRelease && currentRelease.tag === latestRelease.tag) {
        return {
            status: 'latest',
            isLatest: true,
            updateAvailable: false,
            currentVersion: normalizeText(currentVersion),
            currentReleaseTag: currentTag,
            currentReleaseDate: normalizeText(currentReleaseDate),
            latestRelease,
            releases: releaseList,
            statusLabel: '当前已经是最新版本',
            statusBody: `当前客户端已经对齐 ${latestRelease.tag}。`
        };
    }

    if (currentRelease && currentRelease.tag !== latestRelease.tag) {
        return {
            status: 'update-available',
            isLatest: false,
            updateAvailable: true,
            currentVersion: normalizeText(currentVersion),
            currentReleaseTag: currentTag,
            currentReleaseDate: normalizeText(currentReleaseDate),
            latestRelease,
            releases: releaseList,
            statusLabel: '发现新版可更新',
            statusBody: `当前为 ${currentRelease.tag}，线上最新为 ${latestRelease.tag}。`
        };
    }

    if (currentTag) {
        const currentDay = getDateToken(currentReleaseDate);
        const latestDay = getDateToken(latestRelease.date);

        if (currentDay && latestDay && currentDay >= latestDay) {
            return {
                status: 'ahead',
                isLatest: true,
                updateAvailable: false,
                currentVersion: normalizeText(currentVersion),
                currentReleaseTag: currentTag,
                currentReleaseDate: normalizeText(currentReleaseDate),
                latestRelease,
                releases: releaseList,
                statusLabel: '当前为待发布或预览构建',
                statusBody: `当前构建标记为 ${currentTag}，尚未进入公开 release 列表，但版本不低于线上最新。`
            };
        }

        if (currentDay && latestDay && currentDay < latestDay) {
            return {
                status: 'update-available',
                isLatest: false,
                updateAvailable: true,
                currentVersion: normalizeText(currentVersion),
                currentReleaseTag: currentTag,
                currentReleaseDate: normalizeText(currentReleaseDate),
                latestRelease,
                releases: releaseList,
                statusLabel: '发现新版可更新',
                statusBody: `当前构建标记为 ${currentTag}，线上最新为 ${latestRelease.tag}。`
            };
        }

        return {
            status: 'unpublished',
            isLatest: false,
            updateAvailable: false,
            currentVersion: normalizeText(currentVersion),
            currentReleaseTag: currentTag,
            currentReleaseDate: normalizeText(currentReleaseDate),
            latestRelease,
            releases: releaseList,
            statusLabel: '当前构建未进入公开 release',
            statusBody: `当前构建标记为 ${currentTag}，暂未在公开 release 列表中找到同名版本。`
        };
    }

    return {
        status: 'unbound',
        isLatest: false,
        updateAvailable: false,
        currentVersion: normalizeText(currentVersion),
        currentReleaseTag: currentTag,
        currentReleaseDate: normalizeText(currentReleaseDate),
        latestRelease,
        releases: releaseList,
        statusLabel: '当前版本未绑定 release 标签',
        statusBody: '当前可以查看最新 release 与历史版本，但暂时无法自动判断是否需要更新。'
    };
}

module.exports = {
    RELEASE_PAGE_URL,
    RELEASES_API_URL,
    extractReleaseBullets,
    fetchReleaseCatalog,
    getDesktopUpdateState,
    getLatestReleaseForChannel,
    mapRelease,
    pickReleaseAsset,
    sortReleasesByDate
};
