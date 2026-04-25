(() => {
    if (typeof window === 'undefined' || window.__APP_DOWNLOAD_RUNTIME_PATCHED__) return;

    const RELEASE_PAGE_URL = String(
        window.PUBLIC_DOWNLOAD_RELEASE_PAGE_URL
        || 'https://github.com/loru12321/school-system/releases/latest'
    ).trim();
    const RELEASES_API_URL = 'https://api.github.com/repos/loru12321/school-system/releases?per_page=12';
    const RELEASE_CACHE_TTL_MS = 5 * 60 * 1000;

    const DEFAULT_BUILD_INFO = {
        shared: {
            releaseTag: 'school-system-v2026.04.09-about-update-v59',
            releaseDate: '2026-04-09'
        },
        web: {
            label: 'Web 工作台',
            version: '2026.04.09-v59',
            notes: '当前打开的是网页端工作台构建。'
        },
        android: {
            label: 'Android APK',
            version: '1.0.1',
            build: '2',
            notes: '安卓客户端会跟随 GitHub release 同步更新。'
        },
        desktop: {
            label: 'Windows 客户端',
            version: '1.0.1',
            notes: 'Windows 客户端会跟随 GitHub release 同步更新。'
        }
    };
    const DEFAULT_CHANNELS = {
        android: {
            key: 'android',
            label: '安卓下载',
            shortLabel: 'Android APK',
            badge: '手机 / 平板',
            icon: 'ti-brand-android',
            accent: '#22c55e',
            url: 'https://github.com/loru12321/school-system/releases/latest/download/school-system-android-latest.apk',
            fileName: 'school-system-android-latest.apk',
            heroTitle: '安卓包、桌面端与历史版本统一查看',
            heroCopy: '登录后可继续查看关于与更新；登录前也可以在这里直接下载安卓 APK 或查看最新 release。',
            summary: '当前会根据所选平台切换下载链接，并联动展示历史版本与更新点。',
            releaseStamp: 'Latest · Android',
            primaryActionLabel: '下载 Android APK',
            secondaryActionLabel: '打开安卓下载',
            details: [
                { label: '推荐设备', value: '安卓手机 / 平板' },
                { label: '安装方式', value: '浏览器直下 / 群聊转发 / GitHub release' },
                { label: '登录方式', value: '沿用网页端现有账号与权限' },
                { label: '升级路径', value: '直接覆盖安装最新 APK 即可' }
            ],
            features: [
                {
                    icon: 'ti-device-mobile',
                    title: '移动端直接安装',
                    body: '适合教师、班主任、家长与学生在手机或平板里直接安装打开。'
                },
                {
                    icon: 'ti-cloud-download',
                    title: '跟随 release 更新',
                    body: '应用入口始终指向最新 release 资产，减少群内反复发不同版本安装包。'
                },
                {
                    icon: 'ti-user-check',
                    title: '账号口径一致',
                    body: '与网页端和桌面端共用同一套账号、权限与核心模块口径。'
                },
                {
                    icon: 'ti-info-circle',
                    title: '内置关于与更新',
                    body: '登录后可直接查看当前版本、检查更新、阅读每次 release 的小更新点。'
                }
            ],
            scenes: [
                {
                    title: '教师 / 班主任手机',
                    body: '在教室、办公室、巡课或家校沟通现场，直接打开安卓端使用系统。'
                },
                {
                    title: '家长 / 学生移动查询',
                    body: '需要在手机里查看成绩、成长报告和提醒时，可统一使用安卓安装包。'
                }
            ],
            installSteps: [
                '点击下载按钮，建议直接在安卓浏览器里完成下载。',
                '如系统提示“安装未知应用”，在对应浏览器的系统设置中临时允许安装。',
                '安装完成后打开应用，使用现有账号密码登录即可。',
                '后续发布新版本时，继续使用这里的最新链接覆盖安装即可。'
            ],
            specNote: '如果设备拦截安装，请在系统设置中允许当前浏览器安装未知应用。'
        },
        desktop: {
            key: 'desktop',
            label: '桌面端下载',
            shortLabel: 'Windows EXE',
            badge: 'Windows 10 / 11',
            icon: 'ti-brand-windows',
            accent: '#60a5fa',
            url: 'https://github.com/loru12321/school-system/releases/latest/download/smartedu-desktop-windows-latest.exe',
            fileName: 'smartedu-desktop-windows-latest.exe',
            heroTitle: '桌面端关于、更新检查与历史下载统一入口',
            heroCopy: 'Windows 客户端、安卓客户端与网页端现在共用同一套版本中心，可查看当前版本、历史版本和每次 release 更新点。',
            summary: '当前选中 Windows EXE，会优先展示桌面端下载、更新状态和历史版本入口。',
            releaseStamp: 'Latest · Desktop',
            primaryActionLabel: '下载 Windows EXE',
            secondaryActionLabel: '打开桌面端下载',
            details: [
                { label: '推荐设备', value: '办公室电脑 / 机房 / 固定工位' },
                { label: '运行方式', value: '下载安装包后本地启动，单实例运行' },
                { label: '升级方式', value: '重新下载最新 EXE 覆盖使用' },
                { label: '更新查看', value: '托盘菜单与页面右上角都可打开关于与更新' }
            ],
            features: [
                {
                    icon: 'ti-device-desktop',
                    title: '桌面端一键打开',
                    body: '适合在 Windows 办公电脑里直接启动，减少每天先找浏览器入口的步骤。'
                },
                {
                    icon: 'ti-app-window',
                    title: '原生关于入口',
                    body: '现在右上角与托盘菜单都能打开关于与更新，查看版本与历史变更。'
                },
                {
                    icon: 'ti-history',
                    title: '历史版本可追溯',
                    body: '可以直接查看每次 dated release 的小更新点，并下载对应历史版本资产。'
                },
                {
                    icon: 'ti-refresh-alert',
                    title: '检查更新更直接',
                    body: '桌面端、安卓端与网页端共用同一套更新中心，版本状态与下载入口保持同步。'
                }
            ],
            scenes: [
                {
                    title: '教务办公室电脑',
                    body: '适合固定办公桌面环境长期使用，快速进入学校工作台。'
                },
                {
                    title: '年级组 / 会议电脑',
                    body: '适合多台 Windows 电脑统一分发安装，并通过 release 管理版本。'
                }
            ],
            installSteps: [
                '点击当前 Desktop 下载按钮，获取 Windows EXE 安装包。',
                '下载完成后双击 EXE；如果 SmartScreen 提示，请选择“更多信息 / 仍要运行”。',
                '首次打开后可通过右上角“关于”或托盘菜单查看当前版本和更新记录。',
                '若后续发布新版，重新下载最新 EXE 覆盖使用即可。'
            ],
            specNote: '如果 Windows 弹出 SmartScreen，请选择“更多信息”后继续运行当前 EXE。'
        }
    };
    const state = {
        pagePlatform: detectPreferredDownloadPlatform(),
        modalPlatform: detectPreferredDownloadPlatform(),
        releases: getSeedReleases(),
        lastError: '',
        lastFetchedAt: 0,
        loading: false,
        fetchPromise: null,
        nativeInfo: null,
        nativeInfoPromise: null
    };

    function detectPreferredDownloadPlatform() {
        return detectRuntimeChannel() === 'desktop' ? 'desktop' : 'android';
    }

    function detectRuntimeChannel() {
        if (window.DesktopShell && window.DesktopShell.isDesktopApp) return 'desktop';
        if (window.__SMARTEDU_DESKTOP_SHELL__ && window.__SMARTEDU_DESKTOP_SHELL__.isDesktopApp) return 'desktop';
        if (document.documentElement?.dataset?.desktopShell === 'electron'
            || document.body?.dataset?.desktopShell === 'electron') {
            return 'desktop';
        }
        if (isNativeCapacitorShell()) return 'android';
        return 'web';
    }

    function isNativeCapacitorShell() {
        try {
            if (window.Capacitor) {
                if (typeof window.Capacitor.isNativePlatform === 'function') {
                    return !!window.Capacitor.isNativePlatform();
                }
                if (typeof window.Capacitor.getPlatform === 'function') {
                    return window.Capacitor.getPlatform() !== 'web';
                }
                return true;
            }
        } catch (_) {}

        const protocol = String(window.location?.protocol || '').trim().toLowerCase();
        return protocol === 'capacitor:' || protocol === 'app:' || protocol === 'ionic:';
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function resolveUrl(url) {
        try {
            return new URL(String(url || '').trim(), window.location.href).toString();
        } catch (_) {
            return String(url || '').trim();
        }
    }

    function formatDate(value, withTime = false) {
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return '日期未记录';
        const options = withTime
            ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
            : { year: 'numeric', month: '2-digit', day: '2-digit' };
        return new Intl.DateTimeFormat('zh-CN', options).format(parsed);
    }

    function formatSize(bytes) {
        const value = Number(bytes || 0);
        if (!Number.isFinite(value) || value <= 0) return '大小未知';
        if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
        if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
        return `${value} B`;
    }

    function ensureArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizePlatformVersion(entry, fallbackLabel = '') {
        if (!entry) return null;

        if (typeof entry === 'string') {
            const version = String(entry || '').trim();
            if (!version) return null;
            return {
                label: fallbackLabel,
                version,
                build: '',
                line: version
            };
        }

        if (typeof entry !== 'object') return null;

        const label = String(entry.label || fallbackLabel || '').trim();
        const version = String(entry.version || '').trim();
        const build = String(entry.build || '').trim();
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
        const source = String(body || '').trim();
        if (!source) return null;

        const patterns = channelKey === 'desktop'
            ? [/(?:windows|desktop)\s*(?:exe|client|客户端)?\s*(?:version|版本)[:：]\s*([^\r\n]+)/i]
            : [/android\s*(?:apk|client|客户端)?\s*(?:version|版本)[:：]\s*([^\r\n]+)/i];

        for (const pattern of patterns) {
            const match = source.match(pattern);
            if (!match) continue;

            const raw = String(match[1] || '').trim();
            if (!raw) continue;

            const buildMatch = raw.match(/build\s*([0-9A-Za-z._-]+)/i);
            const version = String(raw.replace(/\(?\s*build\s*[0-9A-Za-z._-]+\)?/ig, '')).trim();
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

    function getReleasePlatformVersions(record, body) {
        const source = record && typeof record === 'object'
            ? (record.platform_versions && typeof record.platform_versions === 'object'
                ? record.platform_versions
                : (record.platformVersions && typeof record.platformVersions === 'object'
                    ? record.platformVersions
                    : {}))
            : {};

        return {
            android: normalizePlatformVersion(source.android, 'Android APK')
                || parsePlatformVersionFromBody(body, 'android'),
            desktop: normalizePlatformVersion(source.desktop, 'Windows 客户端')
                || parsePlatformVersionFromBody(body, 'desktop')
        };
    }

    function getBuildCatalog() {
        const runtimeCatalog = window.PUBLIC_VERSION_CENTER_BUILD_INFO
            && typeof window.PUBLIC_VERSION_CENTER_BUILD_INFO === 'object'
            ? window.PUBLIC_VERSION_CENTER_BUILD_INFO
            : {};
        return {
            shared: {
                ...DEFAULT_BUILD_INFO.shared,
                ...(runtimeCatalog.shared || {})
            },
            web: {
                ...DEFAULT_BUILD_INFO.web,
                ...(runtimeCatalog.web || {})
            },
            android: {
                ...DEFAULT_BUILD_INFO.android,
                ...(runtimeCatalog.android || {})
            },
            desktop: {
                ...DEFAULT_BUILD_INFO.desktop,
                ...(runtimeCatalog.desktop || {})
            }
        };
    }

    function getDesktopShellInfo() {
        if (window.DesktopShell && typeof window.DesktopShell === 'object') {
            return window.DesktopShell;
        }

        if (window.__SMARTEDU_DESKTOP_SHELL__ && typeof window.__SMARTEDU_DESKTOP_SHELL__ === 'object') {
            return window.__SMARTEDU_DESKTOP_SHELL__;
        }

        const source = document.documentElement?.dataset?.desktopShell === 'electron'
            ? document.documentElement
            : document.body?.dataset?.desktopShell === 'electron'
                ? document.body
                : null;
        if (!source?.dataset) return null;

        return {
            isDesktopApp: true,
            shell: 'electron',
            appVersion: String(source.dataset.desktopAppVersion || '').trim(),
            productName: String(source.dataset.desktopProductName || '').trim(),
            releaseTag: String(source.dataset.desktopReleaseTag || '').trim(),
            releaseDate: String(source.dataset.desktopReleaseDate || '').trim()
        };
    }

    async function readNativeAppInfo() {
        if (state.nativeInfo !== null) return state.nativeInfo;
        if (state.nativeInfoPromise) return state.nativeInfoPromise;

        const maybeApp = window.Capacitor?.Plugins?.App;
        if (!maybeApp || typeof maybeApp.getInfo !== 'function') {
            state.nativeInfo = {};
            return state.nativeInfo;
        }

        state.nativeInfoPromise = Promise.resolve()
            .then(() => maybeApp.getInfo())
            .then((info) => {
                state.nativeInfo = info && typeof info === 'object' ? info : {};
                return state.nativeInfo;
            })
            .catch((error) => {
                console.warn('[version-center] read native app info failed:', error);
                state.nativeInfo = {};
                return state.nativeInfo;
            })
            .finally(() => {
                state.nativeInfoPromise = null;
            });

        return state.nativeInfoPromise;
    }

    function getVersionLine(buildInfo) {
        const parts = [
            String(buildInfo.version || '').trim() || '未标记',
            buildInfo.build ? `build ${buildInfo.build}` : ''
        ].filter(Boolean);
        return parts.join(' · ');
    }

    function getBuildInfo(channel = detectRuntimeChannel()) {
        const catalog = getBuildCatalog();
        const shared = catalog.shared || {};
        const item = catalog[channel] || catalog.web;
        const desktopShell = getDesktopShellInfo();
        const nativeInfo = state.nativeInfo && typeof state.nativeInfo === 'object' ? state.nativeInfo : {};

        const releaseTag = String(item.releaseTag || shared.releaseTag || '').trim();
        const version = channel === 'desktop'
            ? String(desktopShell?.appVersion || item.version || '').trim()
            : channel === 'android'
                ? String(nativeInfo.version || item.version || '').trim()
                : String(item.version || '').trim();
        const build = channel === 'android'
            ? String(nativeInfo.build || item.build || '').trim()
            : String(item.build || '').trim();

        return {
            channel,
            label: String(item.label || '').trim() || '当前环境',
            version,
            build,
            releaseTag,
            releaseDate: String(item.releaseDate || shared.releaseDate || '').trim(),
            notes: String(item.notes || '').trim(),
            versionLine: getVersionLine({ version, build })
        };
    }

    function getChannel(type = 'android') {
        const key = type === 'desktop' ? 'desktop' : 'android';
        const runtimeChannel = window.PUBLIC_DOWNLOAD_CHANNELS
            && typeof window.PUBLIC_DOWNLOAD_CHANNELS === 'object'
            && window.PUBLIC_DOWNLOAD_CHANNELS[key]
            && typeof window.PUBLIC_DOWNLOAD_CHANNELS[key] === 'object'
            ? window.PUBLIC_DOWNLOAD_CHANNELS[key]
            : {};
        const merged = {
            ...DEFAULT_CHANNELS[key],
            ...runtimeChannel
        };

        return {
            ...merged,
            key,
            url: resolveUrl(merged.url || DEFAULT_CHANNELS[key].url),
            fileName: String(merged.fileName || DEFAULT_CHANNELS[key].fileName || '').trim(),
            details: ensureArray(merged.details).length ? merged.details : DEFAULT_CHANNELS[key].details,
            features: ensureArray(merged.features).length ? merged.features : DEFAULT_CHANNELS[key].features,
            scenes: ensureArray(merged.scenes).length ? merged.scenes : DEFAULT_CHANNELS[key].scenes,
            installSteps: ensureArray(merged.installSteps).length ? merged.installSteps : DEFAULT_CHANNELS[key].installSteps
        };
    }

    function extractReleaseBullets(body) {
        const lines = String(body || '')
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);

        const bullets = lines
            .filter((line) => /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line))
            .map((line) => line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').trim())
            .filter(Boolean);

        if (bullets.length) return bullets.slice(0, 6);

        return lines
            .filter((line) => line.length >= 4)
            .slice(0, 4);
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
            const name = String(asset?.name || '').trim().toLowerCase();
            if (!name) return false;
            if (channel === 'android') return name.endsWith('.apk');
            return name.endsWith('.exe') && (name.includes('desktop') || name.includes('smartedu'));
        }) || null;
    }

    function mapRelease(record) {
        const tag = String(record?.tag_name || record?.tagName || '').trim();
        const assets = ensureArray(record?.assets);
        const androidAsset = pickReleaseAsset(assets, 'android');
        const desktopAsset = pickReleaseAsset(assets, 'desktop');
        const body = String(record?.body || '').trim();
        const platformVersions = getReleasePlatformVersions(record, body);

        return {
            tag,
            name: String(record?.name || tag || '未命名版本').trim(),
            date: String(record?.published_at || record?.publishedAt || record?.created_at || '').trim(),
            url: resolveUrl(record?.html_url || record?.url || RELEASE_PAGE_URL),
            body,
            bullets: extractReleaseBullets(body),
            platformVersions,
            assets: {
                android: androidAsset
                    ? {
                        name: String(androidAsset.name || '').trim(),
                        url: resolveUrl(androidAsset.browser_download_url || androidAsset.url || ''),
                        size: Number(androidAsset.size || 0)
                    }
                    : null,
                desktop: desktopAsset
                    ? {
                        name: String(desktopAsset.name || '').trim(),
                        url: resolveUrl(desktopAsset.browser_download_url || desktopAsset.url || ''),
                        size: Number(desktopAsset.size || 0)
                    }
                    : null
            }
        };
    }

    function getReleaseVersionLine(release, channelKey) {
        return String(release?.platformVersions?.[channelKey]?.line || '').trim();
    }

    function getReleaseVersionBadgesHtml(release, options = {}) {
        const compact = !!options.compact;
        const items = [
            {
                key: 'android',
                icon: 'ti-brand-android',
                label: 'Android',
                value: getReleaseVersionLine(release, 'android')
            },
            {
                key: 'desktop',
                icon: 'ti-brand-windows',
                label: 'Windows',
                value: getReleaseVersionLine(release, 'desktop')
            }
        ].filter((item) => item.value);

        if (!items.length) return '';

        return `
            <div class="app-download-release-version-list${compact ? ' is-compact' : ''}">
                ${items.map((item) => `
                    <span class="app-download-release-version-pill is-${escapeHtml(item.key)}">
                        <i class="ti ${escapeHtml(item.icon)}"></i>
                        <strong>${escapeHtml(item.label)}</strong>
                        <span>${escapeHtml(item.value)}</span>
                    </span>
                `).join('')}
            </div>
        `;
    }

    function getSeedReleases() {
        const seed = window.PUBLIC_VERSION_CENTER_RELEASES
            && typeof window.PUBLIC_VERSION_CENTER_RELEASES === 'object'
            ? window.PUBLIC_VERSION_CENTER_RELEASES
            : [];
        return sortReleasesByDate(ensureArray(seed).map(mapRelease).filter((item) => item.tag));
    }

    function buildFallbackRelease() {
        const buildInfo = getBuildInfo(detectRuntimeChannel());
        return {
            tag: buildInfo.releaseTag || 'local-preview',
            name: buildInfo.releaseTag || '当前构建',
            date: buildInfo.releaseDate || '',
            url: RELEASE_PAGE_URL,
            body: buildInfo.notes || '当前环境暂未读取到线上 release，先展示内嵌版本信息。',
            bullets: [
                buildInfo.notes || '当前环境暂未读取到线上 release，先展示内嵌版本信息。',
                '网络恢复后可重新检查最新版本。',
                '如需历史版本，请打开 GitHub release 页面查看。'
            ],
            assets: {
                android: {
                    name: getChannel('android').fileName,
                    url: getChannel('android').url,
                    size: 0
                },
                desktop: {
                    name: getChannel('desktop').fileName,
                    url: getChannel('desktop').url,
                    size: 0
                }
            }
        };
    }

    function getLatestReleaseForChannel(channelKey, releases = state.releases) {
        return ensureArray(releases).find((release) => release?.assets?.[channelKey]) || ensureArray(releases)[0] || null;
    }

    function getDateToken(value) {
        return String(value || '').trim().slice(0, 10);
    }

    function getStatusModel(buildInfo, releases = state.releases) {
        const list = ensureArray(releases);
        if (!list.length) {
            return {
                tone: state.lastError ? 'warning' : 'neutral',
                label: state.lastError ? '未读取到线上版本' : '等待检查更新',
                body: state.lastError
                    ? '当前先展示内嵌版本信息，可点击“检查更新”重试。'
                    : '可以点击“检查更新”读取最新 GitHub release。'
            };
        }

        const latestRelease = list[0];
        const currentRelease = buildInfo.releaseTag
            ? list.find((item) => item.tag === buildInfo.releaseTag)
            : null;

        if (currentRelease && currentRelease.tag === latestRelease.tag) {
            return {
                tone: 'success',
                label: '当前已是最新版本',
                body: `当前环境已对齐 ${latestRelease.tag}。`
            };
        }

        if (currentRelease && latestRelease.tag !== currentRelease.tag) {
            return {
                tone: 'warning',
                label: '发现更新版本',
                body: `当前为 ${currentRelease.tag}，线上最新为 ${latestRelease.tag}。`
            };
        }

        if (buildInfo.releaseTag) {
            const currentDay = getDateToken(buildInfo.releaseDate);
            const latestDay = getDateToken(latestRelease?.date);
            if (currentDay && latestDay && currentDay >= latestDay) {
                return {
                    tone: 'accent',
                    label: '当前为待发布或预览构建',
                    body: `当前构建标记为 ${buildInfo.releaseTag}，尚未进入公开 release 列表，但版本不低于线上最新。`
                };
            }
            return {
                tone: 'accent',
                label: '当前为待发布构建',
                body: `当前构建标记为 ${buildInfo.releaseTag}，还未在公开 release 列表中找到同名版本。`
            };
        }

        return {
            tone: 'neutral',
            label: '当前版本未绑定 release 标签',
            body: '可继续查看最新 release 与历史版本，但暂时无法判断是否需要更新。'
        };
    }

    function notify(message, type = 'success') {
        if (window.UI && typeof window.UI.toast === 'function') {
            window.UI.toast(message, type);
            return;
        }
        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire({
                toast: true,
                position: 'top',
                icon: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success',
                title: message,
                showConfirmButton: false,
                timer: 2200
            });
            return;
        }
        console.log(message);
    }

    async function copyText(text, successText) {
        const value = String(text || '').trim();
        if (!value) {
            notify('暂无可复制内容', 'error');
            return false;
        }

        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(value);
                notify(successText || '已复制');
                return true;
            }
        } catch (error) {
            console.warn('[version-center] clipboard copy failed:', error);
        }

        const fallback = document.createElement('textarea');
        fallback.value = value;
        fallback.setAttribute('readonly', 'readonly');
        fallback.style.position = 'fixed';
        fallback.style.opacity = '0';
        document.body.appendChild(fallback);
        fallback.select();

        try {
            document.execCommand('copy');
            notify(successText || '已复制');
            return true;
        } catch (error) {
            console.warn('[version-center] execCommand copy failed:', error);
            notify('复制失败，请手动复制', 'error');
            return false;
        } finally {
            fallback.remove();
        }
    }

    function buildDigest(channel, release) {
        return [
            `平台: ${channel.shortLabel}`,
            `Android 版本: ${getReleaseVersionLine(release, 'android') || '未记录'}`,
            `Windows 版本: ${getReleaseVersionLine(release, 'desktop') || '未记录'}`,
            `下载: ${channel.url}`,
            `发布页: ${release?.url || RELEASE_PAGE_URL}`,
            `当前说明: ${channel.specNote || channel.helper || ''}`
        ].join('\n');
    }

    function buildReleaseCardHtml(release, activeKey, options = {}) {
        const compact = !!options.compact;
        const bullets = ensureArray(release?.bullets).slice(0, compact ? 3 : 4);
        const androidAsset = release?.assets?.android;
        const desktopAsset = release?.assets?.desktop;
        const isActive = !!release?.assets?.[activeKey];

        return `
            <article class="app-download-release-card${isActive ? ' is-active' : ''}" data-app-release-item="true">
                <div class="app-download-release-head">
                    <span class="app-download-release-badge">${escapeHtml(release?.tag || release?.name || '未命名版本')}</span>
                    <span class="app-download-release-date">${escapeHtml(formatDate(release?.date || ''))}</span>
                </div>
                <h4>${escapeHtml(release?.name || release?.tag || '未命名版本')}</h4>
                ${getReleaseVersionBadgesHtml(release, { compact })}
                ${bullets.length
                    ? `<ul>${bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
                    : `<p class="app-download-release-empty">当前版本暂未写入 release 说明。</p>`}
                <div class="app-download-release-actions">
                    ${androidAsset
                        ? `<a class="btn btn-gray app-download-release-btn" href="${escapeHtml(androidAsset.url)}" download="${escapeHtml(androidAsset.name)}"><i class="ti ti-brand-android"></i> 安卓包</a>`
                        : ''}
                    ${desktopAsset
                        ? `<a class="btn btn-gray app-download-release-btn" href="${escapeHtml(desktopAsset.url)}" download="${escapeHtml(desktopAsset.name)}"><i class="ti ti-brand-windows"></i> 桌面端</a>`
                        : ''}
                    <a class="btn btn-green app-download-release-btn" href="${escapeHtml(release?.url || RELEASE_PAGE_URL)}" target="_blank" rel="noopener"><i class="ti ti-brand-github"></i> Release</a>
                </div>
            </article>
        `;
    }

    function hasNativeDesktopUpdateBridge() {
        return detectRuntimeChannel() === 'desktop'
            && !!window.DesktopShell
            && typeof window.DesktopShell.checkForUpdates === 'function';
    }

    async function performVersionCheck(options = {}) {
        const announceIfCurrent = options.announceIfCurrent !== false;
        const prompt = options.prompt !== false;
        const source = String(options.source || 'version-center').trim() || 'version-center';

        if (hasNativeDesktopUpdateBridge()) {
            const result = await window.DesktopShell.checkForUpdates({
                announceIfCurrent,
                prompt,
                source
            }).catch((error) => {
                console.warn('[version-center] native desktop update check failed:', error);
                return null;
            });

            await refreshReleaseCatalog(true);
            return result;
        }

        const releases = await refreshReleaseCatalog(true);
        const buildInfo = getBuildInfo(detectRuntimeChannel());
        const status = getStatusModel(buildInfo, releases);
        notify(status.label, status.tone === 'warning' ? 'warning' : status.tone === 'accent' ? 'success' : 'success');
        return {
            status,
            releases
        };
    }

    function ensureStatusGrid(root) {
        let grid = root.querySelector('#app-download-status-grid');
        if (grid) return grid;

        const surface = root.querySelector('.app-download-stage-surface');
        const actionBar = surface?.querySelector('.app-download-stage-actions');
        if (!surface) return null;

        grid = document.createElement('div');
        grid.id = 'app-download-status-grid';
        grid.className = 'app-download-status-grid';
        if (actionBar) surface.insertBefore(grid, actionBar);
        else surface.appendChild(grid);
        return grid;
    }

    function renderStatusGrid(root, downloadChannelKey) {
        const grid = ensureStatusGrid(root);
        if (!grid) return;

        const runtimeChannel = detectRuntimeChannel();
        const runtimeBuild = getBuildInfo(runtimeChannel);
        const status = getStatusModel(runtimeBuild);
        const latestSelected = getLatestReleaseForChannel(downloadChannelKey);
        const latestTag = latestSelected?.tag || '等待读取';

        grid.innerHTML = [
            {
                label: '当前环境',
                value: runtimeBuild.label,
                copy: runtimeBuild.notes || '当前环境会根据 Web、Android APK 或 Windows 客户端自动识别。'
            },
            {
                label: '当前版本',
                value: runtimeBuild.versionLine,
                copy: runtimeBuild.releaseTag ? `发行标签 ${runtimeBuild.releaseTag}` : '当前版本尚未绑定公开 release 标签。'
            },
            {
                label: '线上最新',
                value: latestTag,
                copy: latestSelected
                    ? `${formatDate(latestSelected.date)} 发布`
                    : (state.lastError ? '线上 release 读取失败，可稍后重试。' : '点击检查更新读取 GitHub release。')
            },
            {
                label: '更新状态',
                value: status.label,
                copy: status.body,
                tone: status.tone
            }
        ].map((item) => `
            <article class="app-download-status-card${item.tone ? ` is-${item.tone}` : ''}">
                <span class="app-download-status-label">${escapeHtml(item.label)}</span>
                <strong class="app-download-status-value">${escapeHtml(item.value)}</strong>
                <p class="app-download-status-copy">${escapeHtml(item.copy)}</p>
            </article>
        `).join('');
    }

    function renderPlatformGrid(root, activeKey) {
        const grid = root.querySelector('#app-download-platform-grid');
        if (!grid) return;

        const channels = ['android', 'desktop'].map((key) => getChannel(key));
        grid.innerHTML = channels.map((channel) => `
            <button
                type="button"
                class="app-download-platform-card${channel.key === activeKey ? ' is-active' : ''}"
                data-app-download-platform="${channel.key}"
                style="--download-accent:${channel.accent || '#22c55e'};"
            >
                <span class="app-download-platform-orb">
                    <i class="ti ${channel.icon || 'ti-download'}"></i>
                </span>
                <span class="app-download-platform-label">${escapeHtml(channel.shortLabel)}</span>
                <span class="app-download-platform-note">${escapeHtml(channel.badge || '')}</span>
            </button>
        `).join('');

        grid.querySelectorAll('[data-app-download-platform]').forEach((button) => {
            button.onclick = () => {
                const nextKey = button.getAttribute('data-app-download-platform') || 'android';
                state.pagePlatform = nextKey === 'desktop' ? 'desktop' : 'android';
                renderAppDownloadCenter(state.pagePlatform);
            };
        });
    }

    function renderHero(root, channel) {
        const heroTitle = root.querySelector('#app-download-hero-title');
        const heroCopy = root.querySelector('#app-download-hero-copy');
        const summary = root.querySelector('#app-download-summary');
        const digest = root.querySelector('#app-download-short-checksum');
        const latestRelease = getLatestReleaseForChannel(channel.key);
        const runtimeBuild = getBuildInfo(detectRuntimeChannel());
        const status = getStatusModel(runtimeBuild);

        if (heroTitle) heroTitle.textContent = channel.heroTitle;
        if (heroCopy) heroCopy.textContent = channel.heroCopy;
        if (summary) summary.textContent = status.body;
        if (digest) {
            digest.textContent = latestRelease
                ? `${channel.releaseStamp} / ${latestRelease.tag}`
                : `${channel.releaseStamp} / 等待检查更新`;
        }
    }

    function renderMetaGrid(root, channel) {
        const metaGrid = root.querySelector('#app-download-meta-grid');
        if (!metaGrid) return;

        const runtimeBuild = getBuildInfo(detectRuntimeChannel());
        const latestRelease = getLatestReleaseForChannel(channel.key);
        const items = [
            { label: '当前下载平台', value: channel.shortLabel },
            { label: '当前打开环境', value: runtimeBuild.label },
            { label: '当前客户端版本', value: runtimeBuild.versionLine },
            { label: '最新 release', value: latestRelease?.tag || '等待检查更新' },
            ...ensureArray(channel.details)
        ];

        metaGrid.innerHTML = items.map((item) => `
            <article class="app-download-meta-card">
                <span class="app-download-meta-label">${escapeHtml(item.label)}</span>
                <strong class="app-download-meta-value">${escapeHtml(item.value)}</strong>
            </article>
        `).join('');
    }

    function renderFeatures(root, channel) {
        const featureGrid = root.querySelector('#app-download-feature-grid');
        if (!featureGrid) return;

        featureGrid.innerHTML = ensureArray(channel.features).map((item) => `
            <article class="app-download-feature-card">
                <div class="app-download-feature-icon" style="color:${escapeHtml(channel.accent || '#22c55e')};">
                    <i class="ti ${escapeHtml(item.icon || 'ti-sparkles')}"></i>
                </div>
                <div>
                    <h4>${escapeHtml(item.title || '')}</h4>
                    <p>${escapeHtml(item.body || '')}</p>
                </div>
            </article>
        `).join('');
    }

    function renderScenes(root, channel) {
        const sceneList = root.querySelector('#app-download-scene-list');
        if (!sceneList) return;

        sceneList.innerHTML = ensureArray(channel.scenes).map((item) => `
            <article class="app-download-scene-card">
                <h4>${escapeHtml(item.title || '')}</h4>
                <p>${escapeHtml(item.body || '')}</p>
            </article>
        `).join('');
    }

    function renderInstallSteps(root, channel) {
        const stepList = root.querySelector('#app-download-install-list');
        if (!stepList) return;

        stepList.innerHTML = ensureArray(channel.installSteps).map((text, index) => `
            <li class="app-download-step-item">
                <span class="app-download-step-index">${index + 1}</span>
                <span>${escapeHtml(text)}</span>
            </li>
        `).join('');
    }

    function renderReleases(root, activeKey) {
        const releaseList = root.querySelector('#app-download-release-list');
        if (!releaseList) return;

        const releases = state.releases.length ? state.releases : [buildFallbackRelease()];
        releaseList.innerHTML = releases
            .slice(0, 6)
            .map((release) => buildReleaseCardHtml(release, activeKey))
            .join('');
    }

    function renderSpecs(root, channel) {
        const specGrid = root.querySelector('#app-download-spec-grid');
        if (!specGrid) return;

        const latestRelease = getLatestReleaseForChannel(channel.key);
        const specs = [
            {
                label: '当前下载链接',
                value: latestRelease?.assets?.[channel.key]?.url || channel.url,
                code: true,
                copyValue: latestRelease?.assets?.[channel.key]?.url || channel.url,
                copyLabel: '复制链接'
            },
            {
                label: '当前文件名',
                value: latestRelease?.assets?.[channel.key]?.name || channel.fileName
            },
            {
                label: '当前文件大小',
                value: latestRelease?.assets?.[channel.key]?.size
                    ? formatSize(latestRelease.assets[channel.key].size)
                    : '通过 latest 链接分发'
            },
            {
                label: '最新发布日期',
                value: latestRelease?.date ? formatDate(latestRelease.date, true) : '等待检查更新'
            },
            {
                label: 'Release 页面',
                value: latestRelease?.url || RELEASE_PAGE_URL,
                code: true,
                copyValue: latestRelease?.url || RELEASE_PAGE_URL,
                copyLabel: '复制地址'
            },
            {
                label: '安装说明',
                value: channel.specNote || ''
            }
        ];

        specGrid.innerHTML = specs.map((item, index) => `
            <article class="app-download-spec-card">
                <span class="app-download-spec-label">${escapeHtml(item.label)}</span>
                <div class="app-download-spec-row">
                    <div class="${item.code ? 'app-download-spec-code' : 'app-download-spec-value'}">${escapeHtml(item.value)}</div>
                    ${item.copyValue ? `<button type="button" class="btn btn-gray app-download-mini-btn" data-copy-index="${index}">${escapeHtml(item.copyLabel)}</button>` : ''}
                </div>
            </article>
        `).join('');

        specGrid.querySelectorAll('[data-copy-index]').forEach((button) => {
            button.onclick = () => {
                const item = specs[Number(button.getAttribute('data-copy-index'))];
                copyText(item?.copyValue, `${item?.label || '内容'}已复制`);
            };
        });
    }

    function bindActions(root, channel) {
        const latestRelease = getLatestReleaseForChannel(channel.key);
        const latestAsset = latestRelease?.assets?.[channel.key];
        const primaryLink = root.querySelector('#app-download-primary-link');
        const secondaryLink = root.querySelector('#app-download-secondary-link');
        const releaseLink = root.querySelector('#app-download-release-link');
        const copyButton = root.querySelector('#app-download-copy-link');
        const linkInput = root.querySelector('#app-download-link-input');
        const digestButton = root.querySelector('#app-download-copy-checksum');
        const assetUrl = latestAsset?.url || channel.url;
        const assetName = latestAsset?.name || channel.fileName;

        if (primaryLink) {
            primaryLink.href = assetUrl;
            primaryLink.setAttribute('download', assetName);
            primaryLink.innerHTML = `<i class="ti ti-download"></i> ${escapeHtml(channel.primaryActionLabel)}`;
        }
        if (secondaryLink) {
            secondaryLink.href = assetUrl;
            secondaryLink.setAttribute('download', assetName);
            secondaryLink.innerHTML = `<i class="ti ti-download"></i> ${escapeHtml(channel.secondaryActionLabel)}`;
        }
        if (releaseLink) releaseLink.href = latestRelease?.url || RELEASE_PAGE_URL;
        if (linkInput) linkInput.value = assetUrl;
        if (copyButton) copyButton.onclick = () => copyText(assetUrl, `${channel.label}链接已复制`);
        if (digestButton) digestButton.onclick = () => copyText(buildDigest(channel, latestRelease), `${channel.shortLabel}说明已复制`);
    }

    function renderAppDownloadCenter(selected = state.pagePlatform) {
        const root = document.getElementById('app-download-center');
        if (!root) return false;

        state.pagePlatform = selected === 'desktop' ? 'desktop' : 'android';
        const channel = getChannel(state.pagePlatform);

        renderPlatformGrid(root, state.pagePlatform);
        renderHero(root, channel);
        renderStatusGrid(root, state.pagePlatform);
        renderMetaGrid(root, channel);
        renderFeatures(root, channel);
        renderScenes(root, channel);
        renderInstallSteps(root, channel);
        renderReleases(root, state.pagePlatform);
        renderSpecs(root, channel);
        bindActions(root, channel);

        if (!state.releases.length && !state.loading) {
            refreshReleaseCatalog(false);
        }

        return true;
    }

    function ensureModal() {
        let backdrop = document.getElementById('version-center-backdrop');
        if (backdrop) return backdrop;

        backdrop = document.createElement('div');
        backdrop.id = 'version-center-backdrop';
        backdrop.className = 'version-center-backdrop';
        backdrop.style.display = 'none';
        backdrop.setAttribute('aria-hidden', 'true');
        backdrop.innerHTML = `
            <div class="version-center-dialog" role="dialog" aria-modal="true" aria-labelledby="version-center-title">
                <div class="version-center-top">
                    <div>
                        <span class="version-center-chip">关于与更新</span>
                        <h2 id="version-center-title" tabindex="-1">版本中心</h2>
                        <p id="version-center-copy">查看当前版本、检查最新 release、阅读每个版本的小更新点，并下载安卓或桌面端历史版本。</p>
                    </div>
                    <button type="button" class="version-center-close" data-version-center-close aria-label="关闭关于与更新">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="version-center-platform-grid" data-version-center-platforms></div>
                <div class="version-center-status-grid" data-version-center-status></div>
                <div class="version-center-actions">
                    <button type="button" class="btn btn-blue" data-version-center-refresh><i class="ti ti-refresh"></i> 检查更新</button>
                    <a class="btn btn-gray" href="${escapeHtml(RELEASE_PAGE_URL)}" target="_blank" rel="noopener"><i class="ti ti-brand-github"></i> 全部 Release</a>
                </div>
                <section class="version-center-panel" data-version-center-latest></section>
                <section class="version-center-panel">
                    <div class="version-center-panel-head">
                        <h3>历史版本与更新点</h3>
                        <span>Release History</span>
                    </div>
                    <div class="version-center-history" data-version-center-history></div>
                </section>
            </div>
        `;

        backdrop.addEventListener('click', (event) => {
            if (event.target === backdrop) closeModal();
        });
        backdrop.addEventListener('click', (event) => {
            const closeButton = event.target.closest('[data-version-center-close]');
            if (closeButton) {
                event.preventDefault();
                closeModal();
                return;
            }

            const refreshButton = event.target.closest('[data-version-center-refresh]');
            if (refreshButton) {
                event.preventDefault();
                performVersionCheck({
                    announceIfCurrent: true,
                    prompt: true,
                    source: 'version-center'
                }).catch((error) => {
                    console.warn('[version-center] check updates failed:', error);
                    notify('检查更新失败，请稍后重试', 'error');
                });
                return;
            }

            const platformButton = event.target.closest('[data-version-center-platform]');
            if (platformButton) {
                event.preventDefault();
                state.modalPlatform = platformButton.getAttribute('data-version-center-platform') === 'desktop'
                    ? 'desktop'
                    : 'android';
                renderModal();
            }
        });

        document.body.appendChild(backdrop);
        return backdrop;
    }

    function renderModal() {
        const backdrop = ensureModal();
        const channel = getChannel(state.modalPlatform);
        const runtimeBuild = getBuildInfo(detectRuntimeChannel());
        const status = getStatusModel(runtimeBuild);
        const latestRelease = getLatestReleaseForChannel(state.modalPlatform) || buildFallbackRelease();
        const latestAsset = latestRelease?.assets?.[state.modalPlatform];
        const platformsWrap = backdrop.querySelector('[data-version-center-platforms]');
        const statusWrap = backdrop.querySelector('[data-version-center-status]');
        const latestWrap = backdrop.querySelector('[data-version-center-latest]');
        const historyWrap = backdrop.querySelector('[data-version-center-history]');
        const title = backdrop.querySelector('#version-center-title');
        const copy = backdrop.querySelector('#version-center-copy');

        if (title) title.textContent = `${runtimeBuild.label} · 当前版本 ${runtimeBuild.versionLine}`;
        if (copy) copy.textContent = status.body;

        if (platformsWrap) {
            platformsWrap.innerHTML = ['android', 'desktop'].map((key) => {
                const item = getChannel(key);
                const release = getLatestReleaseForChannel(key);
                return `
                    <button
                        type="button"
                        class="version-center-platform-card${key === state.modalPlatform ? ' is-active' : ''}"
                        data-version-center-platform="${key}"
                        style="--version-accent:${escapeHtml(item.accent || '#22c55e')};"
                    >
                        <span class="version-center-platform-icon"><i class="ti ${escapeHtml(item.icon || 'ti-download')}"></i></span>
                        <span class="version-center-platform-copy">
                            <strong>${escapeHtml(item.shortLabel)}</strong>
                            <span>${escapeHtml(release?.tag || item.badge || '')}</span>
                        </span>
                    </button>
                `;
            }).join('');
        }

        if (statusWrap) {
            statusWrap.innerHTML = [
                {
                    label: '当前环境',
                    value: runtimeBuild.label,
                    copy: runtimeBuild.notes || '当前环境由系统自动识别。'
                },
                {
                    label: '当前版本',
                    value: runtimeBuild.versionLine,
                    copy: runtimeBuild.releaseTag ? `发行标签 ${runtimeBuild.releaseTag}` : '当前版本未绑定 release 标签。'
                },
                {
                    label: '检查结果',
                    value: status.label,
                    copy: status.body,
                    tone: status.tone
                },
                {
                    label: '最新发布日期',
                    value: latestRelease?.date ? formatDate(latestRelease.date, true) : '等待检查更新',
                    copy: latestRelease?.tag || '线上 release 尚未读取完成。'
                }
            ].map((item) => `
                <article class="version-center-status-card${item.tone ? ` is-${item.tone}` : ''}">
                    <span>${escapeHtml(item.label)}</span>
                    <strong>${escapeHtml(item.value)}</strong>
                    <p>${escapeHtml(item.copy)}</p>
                </article>
            `).join('');
        }

        if (latestWrap) {
            latestWrap.innerHTML = `
                <div class="version-center-panel-head">
                    <h3>当前平台最新下载与说明</h3>
                    <span>${escapeHtml(channel.shortLabel)}</span>
                </div>
                <div class="version-center-latest-grid">
                    <article class="version-center-latest-card">
                        <span class="version-center-kicker">当前选择平台</span>
                        <h4>${escapeHtml(channel.shortLabel)}</h4>
                        <p>${escapeHtml(channel.summary)}</p>
                        <div class="version-center-meta-list">
                            <div><span>最新版本</span><strong>${escapeHtml(latestRelease?.tag || '等待检查更新')}</strong></div>
                            <div><span>Android 版本</span><strong>${escapeHtml(getReleaseVersionLine(latestRelease, 'android') || '未记录')}</strong></div>
                            <div><span>Windows 版本</span><strong>${escapeHtml(getReleaseVersionLine(latestRelease, 'desktop') || '未记录')}</strong></div>
                            <div><span>下载文件</span><strong>${escapeHtml(latestAsset?.name || channel.fileName)}</strong></div>
                            <div><span>文件大小</span><strong>${escapeHtml(latestAsset?.size ? formatSize(latestAsset.size) : '通过 latest 链接分发')}</strong></div>
                        </div>
                        <div class="version-center-inline-actions">
                            <a class="btn btn-blue" href="${escapeHtml(latestAsset?.url || channel.url)}" download="${escapeHtml(latestAsset?.name || channel.fileName)}"><i class="ti ti-download"></i> 下载当前平台</a>
                            <button type="button" class="btn btn-gray" data-version-center-copy="${escapeHtml(latestAsset?.url || channel.url)}"><i class="ti ti-link"></i> 复制链接</button>
                        </div>
                    </article>
                    <article class="version-center-latest-card">
                        <span class="version-center-kicker">本次更新重点</span>
                        <h4>${escapeHtml(latestRelease?.name || latestRelease?.tag || '当前版本')}</h4>
                        ${getReleaseVersionBadgesHtml(latestRelease, { compact: true })}
                        ${ensureArray(latestRelease?.bullets).length
                            ? `<ul class="version-center-bullet-list">${ensureArray(latestRelease.bullets).slice(0, 5).map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join('')}</ul>`
                            : `<p>当前 release 暂未写入详细更新点。</p>`}
                        <div class="version-center-inline-actions">
                            <a class="btn btn-green" href="${escapeHtml(latestRelease?.url || RELEASE_PAGE_URL)}" target="_blank" rel="noopener"><i class="ti ti-brand-github"></i> 打开当前 Release</a>
                            <button type="button" class="btn btn-gray" data-version-center-copy="${escapeHtml(buildDigest(channel, latestRelease))}"><i class="ti ti-copy"></i> 复制当前说明</button>
                        </div>
                    </article>
                </div>
            `;

            latestWrap.querySelectorAll('[data-version-center-copy]').forEach((button) => {
                button.onclick = () => copyText(button.getAttribute('data-version-center-copy') || '', '内容已复制');
            });
        }

        if (historyWrap) {
            const releases = state.releases.length ? state.releases : [buildFallbackRelease()];
            historyWrap.innerHTML = releases
                .slice(0, 8)
                .map((release) => buildReleaseCardHtml(release, state.modalPlatform, { compact: true }))
                .join('');
        }
    }

    function openModal(preferredPlatform = detectPreferredDownloadPlatform()) {
        state.modalPlatform = preferredPlatform === 'desktop' ? 'desktop' : 'android';
        const backdrop = ensureModal();
        renderModal();
        backdrop.style.display = 'flex';
        backdrop.setAttribute('aria-hidden', 'false');
        document.body.classList.add('version-center-open');
        window.setTimeout(() => {
            const title = backdrop.querySelector('#version-center-title');
            if (title && typeof title.focus === 'function') title.focus({ preventScroll: true });
        }, 60);
        refreshReleaseCatalog(false);
        return state.modalPlatform;
    }

    function closeModal() {
        const backdrop = document.getElementById('version-center-backdrop');
        if (!backdrop) return;
        backdrop.style.display = 'none';
        backdrop.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('version-center-open');
    }

    function syncToolbarButton() {
        const container = document.getElementById('account-actions');
        if (!container) return;
        let button = container.querySelector('[data-version-center-trigger="toolbar"]');
        if (button) return;

        button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn version-center-toolbar-btn';
        button.setAttribute('data-version-center-trigger', 'toolbar');
        button.setAttribute('title', '关于与更新');
        button.innerHTML = '<i class="ti ti-info-circle"></i><span>关于</span>';
        button.onclick = () => openModal(detectRuntimeChannel() === 'desktop' ? 'desktop' : 'android');
        container.insertBefore(button, container.firstChild || null);
    }

    function installToolbarObserver() {
        if (window.__VERSION_CENTER_TOOLBAR_OBSERVER__) return;
        const observer = new MutationObserver(() => {
            syncToolbarButton();
            if (window.Auth && typeof window.Auth === 'object' && typeof window.Auth.openVersionCenterModal !== 'function') {
                window.Auth.openVersionCenterModal = openModal;
            }
        });
        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
        window.__VERSION_CENTER_TOOLBAR_OBSERVER__ = observer;
        syncToolbarButton();
    }

    function refreshSurfaces() {
        renderAppDownloadCenter(state.pagePlatform);
        const backdrop = document.getElementById('version-center-backdrop');
        if (backdrop && backdrop.style.display !== 'none') renderModal();
        syncToolbarButton();
    }

    async function refreshReleaseCatalog(force = false) {
        const now = Date.now();
        if (!force && state.releases.length && now - state.lastFetchedAt < RELEASE_CACHE_TTL_MS) {
            return state.releases;
        }
        if (state.fetchPromise) return state.fetchPromise;

        state.loading = true;
        refreshSurfaces();

        state.fetchPromise = Promise.resolve()
            .then(() => readNativeAppInfo())
            .then(() => fetch(RELEASES_API_URL, {
                headers: { Accept: 'application/vnd.github+json' },
                cache: 'no-store'
            }))
            .then((response) => {
                if (!response.ok) throw new Error(`GitHub release API returned ${response.status}`);
                return response.json();
            })
            .then((payload) => {
                state.releases = sortReleasesByDate(ensureArray(payload).map(mapRelease).filter((item) => item.tag));
                state.lastFetchedAt = Date.now();
                state.lastError = '';
                refreshSurfaces();
                return state.releases;
            })
            .catch((error) => {
                console.warn('[version-center] fetch releases failed:', error);
                state.lastError = error instanceof Error ? error.message : String(error);
                if (!state.releases.length) state.releases = [buildFallbackRelease()];
                refreshSurfaces();
                return state.releases;
            })
            .finally(() => {
                state.loading = false;
                state.fetchPromise = null;
                refreshSurfaces();
            });

        return state.fetchPromise;
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && document.body.classList.contains('version-center-open')) {
            closeModal();
        }
    });

    window.renderAppDownloadCenter = renderAppDownloadCenter;
    window.setAppDownloadPlatform = function (type = 'android') {
        state.pagePlatform = type === 'desktop' ? 'desktop' : 'android';
        return renderAppDownloadCenter(state.pagePlatform);
    };
    window.copyAppDownloadLink = function (type = state.pagePlatform) {
        const channel = getChannel(type);
        const latestRelease = getLatestReleaseForChannel(channel.key);
        return copyText(latestRelease?.assets?.[channel.key]?.url || channel.url, `${channel.label}链接已复制`);
    };
    window.copyAppDownloadChecksum = function (type = state.pagePlatform) {
        const channel = getChannel(type);
        const latestRelease = getLatestReleaseForChannel(channel.key);
        return copyText(buildDigest(channel, latestRelease), `${channel.shortLabel}说明已复制`);
    };
    window.VersionCenter = {
        openModal,
        closeModal,
        checkForUpdates: (options = {}) => performVersionCheck(options),
        refresh: () => refreshReleaseCatalog(true),
        getCurrentBuildInfo: () => getBuildInfo(detectRuntimeChannel()),
        getReleases: () => state.releases.slice()
    };
    window.openVersionCenterModal = openModal;
    if (window.Auth && typeof window.Auth === 'object' && typeof window.Auth.openVersionCenterModal !== 'function') {
        window.Auth.openVersionCenterModal = openModal;
    }
    installToolbarObserver();
    renderAppDownloadCenter(state.pagePlatform);
    refreshReleaseCatalog(false);
    window.__APP_DOWNLOAD_RUNTIME_PATCHED__ = true;
})();
