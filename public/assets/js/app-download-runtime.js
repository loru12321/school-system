(() => {
    if (typeof window === 'undefined' || window.__APP_DOWNLOAD_RUNTIME_PATCHED__) return;

    const RELEASE_PAGE_URL = String(
        window.PUBLIC_DOWNLOAD_RELEASE_PAGE_URL
        || 'https://github.com/hka123321/school-system/releases/latest'
    ).trim();
    const RELEASES_API_URL = 'https://api.github.com/repos/hka123321/school-system/releases?per_page=50';
    const RELEASE_CACHE_TTL_MS = 5 * 60 * 1000;
    const RELEASE_BRAND_ICON_URL = './assets/brand/app-icon-128.png';

    function isLocalFileRuntime() {
        return String(window.location?.protocol || '').trim().toLowerCase() === 'file:';
    }

    const DEFAULT_BUILD_INFO = {
        shared: {
            releaseTag: 'beta-20260624-ea9037f',
            releaseDate: '2026-06-22'
        },
        web: {
            label: 'Web 工作台',
            version: '1.0.2',
            notes: '当前打开的是 1.0.2 系统工作台构建。'
        },
        android: {
            label: 'Android APK',
            version: '1.0.2',
            build: '3',
            notes: '安卓客户端会跟随 GitHub release 同步更新。'
        },
        desktop: {
            label: 'Windows 本地安装包',
            version: '1.0.2',
            notes: 'Windows 本地安装向导会跟随 GitHub release 同步更新。'
        }
    };
    const DEFAULT_CHANNELS = {
        android: {
            key: 'android',
            iconUrl: RELEASE_BRAND_ICON_URL,
            label: '安卓下载',
            shortLabel: 'Android APK',
            badge: '手机 / 平板',
            icon: 'ti-brand-android',
            accent: '#22c55e',
            url: './downloads/school-system-android-beta-20260624-ea9037f.apk',
            fileName: 'school-system-android-beta-20260624-ea9037f.apk',
            heroTitle: '安卓包与桌面端统一下载',
            heroCopy: '登录后可继续查看关于与更新；登录前也可以在这里直接下载安卓 APK 或 Windows 应用包。',
            summary: '当前会根据所选平台切换下载链接，历史更新记录已清空，后续新文件从这里开始记录。',
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
            iconUrl: RELEASE_BRAND_ICON_URL,
            label: 'Windows 本地安装包',
            shortLabel: 'Windows EXE',
            badge: 'Windows 10 / 11',
            icon: 'ti-brand-windows',
            accent: '#60a5fa',
            url: './downloads/school-system-windows-beta-20260624-ea9037f.exe',
            fileName: 'school-system-windows-beta-20260624-ea9037f.exe',
            heroTitle: 'Windows 本地安装包与安卓 APK 统一下载',
            heroCopy: 'Windows 提供可一步步安装到本机的安装向导 EXE；Android 提供可在设备上直接安装的 APK，二者都与网页端共用当前系统版本。',
            summary: '当前选中 Windows 本地安装包，会优先展示安装向导下载、安装步骤和更新状态。',
            releaseStamp: 'Latest · Desktop',
            primaryActionLabel: '下载 Windows 本地安装包',
            secondaryActionLabel: '打开 Windows 下载',
            details: [
                { label: '推荐设备', value: '办公室电脑 / 机房 / 固定工位' },
                { label: '安装方式', value: '双击 EXE 后按安装向导一步步安装到本机' },
                { label: '本地入口', value: '安装目录、桌面快捷方式、开始菜单快捷方式' },
                { label: '卸载方式', value: '写入 Windows 系统卸载入口' },
                { label: '更新查看', value: '托盘菜单与页面右上角都可打开关于与更新' }
            ],
            features: [
                {
                    icon: 'ti-device-desktop',
                    title: '本地向导安装',
                    body: '双击 EXE 后可选择安装目录、桌面快捷方式和开始菜单快捷方式，安装完成后从本机入口启动。'
                },
                {
                    icon: 'ti-app-window',
                    title: '原生关于入口',
                    body: '现在右上角与托盘菜单都能打开关于与更新，查看版本与历史变更。'
                },
                {
                    icon: 'ti-history',
                    title: '系统卸载入口',
                    body: '安装向导会写入 Windows 卸载记录，后续可从系统应用列表或安装目录中的卸载程序移除。'
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
                '点击当前 Windows 下载按钮，获取 Windows 本地安装向导 EXE。',
                '下载完成后双击 EXE，按“下一步”进入安装向导。',
                '选择安装目录，并按需要保留桌面快捷方式和开始菜单快捷方式。',
                '点击“安装”，等待向导复制本地客户端并写入 Windows 卸载入口。',
                '点击“完成”后从桌面、开始菜单或安装目录启动校衡台。'
            ],
            specNote: 'Windows 本地安装包会创建安装目录、桌面/开始菜单入口和系统卸载入口；客户端会优先用 Edge/Chrome 的应用窗口打开正式站点。'
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
        remoteCatalogFetched: false,
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
        const raw = String(url || '').trim();
        if (!raw) return '';
        try {
            const resolved = new URL(raw, window.location.href).toString();
            const currentUrl = String(window.location?.href || '').trim();
            if (currentUrl && resolved === currentUrl && raw !== currentUrl) {
                return '';
            }
            return resolved;
        } catch (_) {
            return raw;
        }
    }

    function isPackageDownloadUrl(url) {
        try {
            const parsed = new URL(String(url || ''), window.location.href);
            const fileName = decodeURIComponent(parsed.pathname.split('/').pop() || '');
            return /(?:school-system|smartedu).*\.(?:exe|apk)$/i.test(fileName)
                || /(?:windows|android).*\.(?:exe|apk)$/i.test(fileName);
        } catch (_) {
            return false;
        }
    }

    function applyActionLink(link, href, options = {}) {
        if (!link) return;
        const nextHref = String(href || '').trim();
        const downloadName = String(options.downloadName || '').trim();
        const labelHtml = typeof options.labelHtml === 'string' ? options.labelHtml : '';

        if (labelHtml) link.innerHTML = labelHtml;

        if (nextHref) {
            link.href = nextHref;
            link.removeAttribute('download');
            if (isPackageDownloadUrl(nextHref)) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener');
            } else {
                link.removeAttribute('target');
                link.removeAttribute('rel');
            }
            link.removeAttribute('aria-disabled');
            link.removeAttribute('tabindex');
            link.classList.remove('is-disabled');
            return;
        }

        link.removeAttribute('href');
        link.removeAttribute('download');
        link.removeAttribute('target');
        link.removeAttribute('rel');
        link.setAttribute('aria-disabled', 'true');
        link.setAttribute('tabindex', '-1');
        link.classList.add('is-disabled');
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

    function renderReleaseBrandIcon(channel, className = 'app-release-brand-icon') {
        const iconUrl = RELEASE_BRAND_ICON_URL;
        const alt = className === 'app-release-brand-icon' ? '校衡台应用图标' : '';
        const decorative = alt ? '' : ' aria-hidden="true"';
        return `<img class="${escapeHtml(className)}" src="${escapeHtml(iconUrl)}" width="${className === 'app-release-brand-icon' ? '72' : '42'}" height="${className === 'app-release-brand-icon' ? '72' : '42'}" alt="${escapeHtml(alt)}"${decorative}>`;
    }

    const PLATFORM_KEYS = Object.freeze(['windows', 'android', 'ios']);
    const PLATFORM_LABELS = Object.freeze({ windows: 'Windows', android: 'Android', ios: 'iOS' });
    const SELECTED_PLATFORM_STORAGE_KEY = 'APP_RELEASE_SELECTED_PLATFORM';
    const CATALOG_STORAGE_KEY = 'APP_RELEASE_CATALOG_CACHE';
    let historyTrigger = null;
    let releaseCatalogPromise = null;

    function getReleaseCatalogRuntime() {
        return window.AppReleaseCatalogRuntime || null;
    }

    function getBrowserStorage(name) {
        try {
            return window[name] || null;
        } catch (_) {
            return null;
        }
    }

    function readStorage(storage, key) {
        try {
            return storage?.getItem(key) || '';
        } catch (_) {
            return '';
        }
    }

    function writeStorage(storage, key, value) {
        try {
            storage?.setItem(key, value);
            return true;
        } catch (_) {
            return false;
        }
    }

    function getInitialReleasePlatform() {
        const saved = readStorage(getBrowserStorage('sessionStorage'), SELECTED_PLATFORM_STORAGE_KEY);
        if (PLATFORM_KEYS.includes(saved)) return saved;
        const detected = getReleaseCatalogRuntime()?.detectPlatform?.(window.navigator?.userAgent || '');
        return PLATFORM_KEYS.includes(detected) ? detected : 'windows';
    }

    const releaseCatalogState = {
        selectedPlatform: getInitialReleasePlatform(),
        releases: [],
        loading: false,
        lastError: '',
        lastFetchedAt: 0,
        historyFilters: { platform: '', channel: '' }
    };

    function normalizeReleaseCatalog(payload) {
        const runtime = getReleaseCatalogRuntime();
        return runtime ? runtime.normalizeCatalog(payload) : [];
    }

    function mergeReleaseCatalog(...groups) {
        const releasesByTag = new Map();
        groups.flat().forEach((release) => {
            if (!release?.releaseTag) return;
            const previous = releasesByTag.get(release.releaseTag) || {};
            const previousPlatforms = previous.platforms || {};
            const nextPlatforms = release.platforms || {};
            releasesByTag.set(release.releaseTag, {
                ...previous,
                ...release,
                platforms: {
                    windows: { ...(previousPlatforms.windows || {}), ...(nextPlatforms.windows || {}) },
                    android: { ...(previousPlatforms.android || {}), ...(nextPlatforms.android || {}) },
                    ios: { ...(previousPlatforms.ios || {}), ...(nextPlatforms.ios || {}) }
                }
            });
        });
        return Array.from(releasesByTag.values()).sort((left, right) => {
            return (Date.parse(right.generatedAt || '') || 0) - (Date.parse(left.generatedAt || '') || 0);
        });
    }

    function mapGitHubAsset(platform, release, definition) {
        const assets = ensureArray(release?.assets);
        const source = assets.find((asset) => definition.pattern.test(String(asset?.name || '')));
        if (!source) {
            return {
                platform,
                iconUrl: RELEASE_BRAND_ICON_URL,
                version: String(release?.tag_name || ''),
                buildNumber: '',
                status: platform === 'ios' ? 'awaiting-signing' : 'unavailable',
                signed: platform === 'ios' ? 'unsigned' : definition.signed,
                minimumOs: definition.minimumOs,
                architectures: definition.architectures,
                assetName: '',
                assetUrl: '',
                bytes: 0,
                sha256: '',
                notes: [],
                buildUrl: String(release?.html_url || '')
            };
        }
        return {
            platform,
            iconUrl: RELEASE_BRAND_ICON_URL,
            version: String(release?.tag_name || ''),
            buildNumber: '',
            status: 'available-unverified',
            signed: definition.signed,
            minimumOs: definition.minimumOs,
            architectures: definition.architectures,
            assetName: String(source.name || ''),
            assetUrl: String(source.browser_download_url || ''),
            bytes: Number(source.size || 0),
            sha256: '',
            notes: ['等待发布清单完成 SHA-256 校验'],
            buildUrl: String(release?.html_url || '')
        };
    }

    function mapGitHubReleaseToCatalog(release) {
        const definitions = {
            windows: { iconUrl: RELEASE_BRAND_ICON_URL, pattern: /\.exe$/i, minimumOs: 'Windows 10 22H2', architectures: ['x64'], signed: 'unsigned' },
            android: { iconUrl: RELEASE_BRAND_ICON_URL, pattern: /\.apk$/i, minimumOs: 'Android 10', architectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'], signed: 'test-signed' },
            ios: { iconUrl: RELEASE_BRAND_ICON_URL, pattern: /\.ipa$/i, minimumOs: 'iOS 16', architectures: ['arm64'], signed: 'unsigned' }
        };
        const releaseTag = String(release?.tag_name || '').trim();
        if (!releaseTag) return null;
        return {
            schemaVersion: 1,
            releaseTag,
            channel: release?.prerelease || /^beta-/i.test(releaseTag) ? 'beta' : 'stable',
            sourceSha: '',
            generatedAt: String(release?.published_at || release?.created_at || ''),
            expiresAt: '',
            releaseUrl: String(release?.html_url || ''),
            platforms: Object.fromEntries(PLATFORM_KEYS.map((platform) => [
                platform,
                mapGitHubAsset(platform, release, definitions[platform])
            ]))
        };
    }

    async function fetchJson(url) {
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        });
        if (!response.ok) throw new Error(`${url} returned ${response.status}`);
        return response.json();
    }

    async function fetchAttachedReleaseManifests(githubReleases) {
        const manifestUrls = ensureArray(githubReleases).map((release) => {
            const asset = ensureArray(release?.assets).find((item) => String(item?.name || '').toLowerCase() === 'release-manifest.json');
            return String(asset?.browser_download_url || '');
        }).filter((url) => /^https:\/\//i.test(url));
        if (!manifestUrls.length) return [];
        const results = await Promise.allSettled(manifestUrls.map((url) => fetchJson(url)));
        return results.flatMap((result) => result.status === 'fulfilled' ? normalizeReleaseCatalog(result.value) : []);
    }

    function restoreCachedReleaseCatalog() {
        const raw = readStorage(getBrowserStorage('localStorage'), CATALOG_STORAGE_KEY);
        if (!raw) return [];
        try {
            return normalizeReleaseCatalog({ releases: JSON.parse(raw) });
        } catch (_) {
            return [];
        }
    }

    function persistReleaseCatalog(releases) {
        if (!releases.length) return;
        writeStorage(getBrowserStorage('localStorage'), CATALOG_STORAGE_KEY, JSON.stringify(releases));
    }

    async function loadReleaseCatalog(force = false) {
        const runtime = getReleaseCatalogRuntime();
        if (!runtime) {
            releaseCatalogState.lastError = '版本目录运行时未加载';
            renderReleaseCenter();
            return releaseCatalogState.releases;
        }
        if (!force && releaseCatalogState.lastFetchedAt
            && Date.now() - releaseCatalogState.lastFetchedAt < RELEASE_CACHE_TTL_MS
            && releaseCatalogState.releases.length) {
            return releaseCatalogState.releases;
        }
        if (releaseCatalogPromise) return releaseCatalogPromise;

        releaseCatalogState.loading = true;
        releaseCatalogState.lastError = '';
        renderReleaseCenter();
        const shouldFetchGithubCatalog = force || shouldAutoFetchReleaseCatalog();
        releaseCatalogPromise = Promise.allSettled([
            fetchJson('./releases/release-manifest.json'),
            shouldFetchGithubCatalog ? fetchJson(RELEASES_API_URL) : Promise.resolve([])
        ]).then(async ([cachedResult, githubResult]) => {
            const cachedManifest = cachedResult.status === 'fulfilled'
                ? normalizeReleaseCatalog(cachedResult.value)
                : [];
            const githubPayload = githubResult.status === 'fulfilled' ? ensureArray(githubResult.value) : [];
            const githubCatalog = normalizeReleaseCatalog({
                releases: githubPayload.map(mapGitHubReleaseToCatalog).filter(Boolean)
            });
            const attachedManifests = await fetchAttachedReleaseManifests(githubPayload);
            const fallback = restoreCachedReleaseCatalog();
            const merged = mergeReleaseCatalog(githubCatalog, fallback, cachedManifest, attachedManifests)
                .filter((release) => !runtime.isExpired(release));
            if (!merged.length) {
                throw new Error('没有读取到可用的版本目录');
            }
            releaseCatalogState.releases = merged;
            releaseCatalogState.lastFetchedAt = Date.now();
            persistReleaseCatalog(merged);
            if (cachedResult.status === 'rejected' && githubResult.status === 'rejected') {
                releaseCatalogState.lastError = '网络不可用，正在显示上次成功读取的版本';
            }
            return merged;
        }).catch((error) => {
            const fallback = restoreCachedReleaseCatalog();
            if (fallback.length) releaseCatalogState.releases = fallback;
            releaseCatalogState.lastError = error instanceof Error ? error.message : String(error);
            return releaseCatalogState.releases;
        }).finally(() => {
            releaseCatalogState.loading = false;
            releaseCatalogPromise = null;
            renderReleaseCenter();
        });
        return releaseCatalogPromise;
    }

    function getLatestReleaseForPlatform(platform) {
        return releaseCatalogState.releases.find((release) => {
            const status = release?.platforms?.[platform]?.status || 'unavailable';
            return status !== 'unavailable';
        }) || null;
    }

    function getAppDownloadRenderSignature(platform = releaseCatalogState.selectedPlatform) {
        const releases = releaseCatalogState.releases.map((release) => {
            const asset = release?.platforms?.[platform] || {};
            return [
                release?.releaseTag || '',
                release?.channel || '',
                release?.generatedAt || '',
                asset.version || '',
                asset.buildNumber || '',
                asset.status || '',
                asset.assetName || '',
                asset.assetUrl || '',
                asset.sha256 || '',
                asset.bytes || 0
            ].join('~');
        }).join('|');
        return [
            platform,
            releaseCatalogState.loading ? 'loading' : 'idle',
            releaseCatalogState.lastError || '',
            releaseCatalogState.lastFetchedAt || 0,
            releases
        ].join('::');
    }

    function getAssetStatusLabel(asset) {
        if (asset?.status === 'ready') return '安装包已就绪';
        if (asset?.status === 'awaiting-signing') return '等待签名';
        if (asset?.status === 'available-unverified') return '等待完整性校验';
        return '暂无安装包';
    }

    function getPlatformDescription(platform, asset) {
        if (platform === 'ios' && asset?.status !== 'ready') {
            return 'iOS 工程已就绪，正在等待 Apple 签名、TestFlight 与 App Store 配置。';
        }
        if (platform === 'android' && asset?.signed === 'test-signed') {
            return '当前为测试签名安装包，适合内部验证；正式发布后会在这里保留对应历史版本。';
        }
        if (platform === 'windows' && asset?.signed === 'unsigned') {
            return '当前为未签名测试安装包，Windows 可能显示安全提示；正式证书配置后状态会同步更新。';
        }
        return ensureArray(asset?.notes)[0] || '当前平台尚无通过完整性校验的安装包。';
    }

    function buildAppleProgressHtml(asset) {
        const ready = asset?.status === 'ready';
        const steps = [
            ['01', '工程已就绪'],
            ['02', '构建配置'],
            ['03', 'Apple Developer'],
            ['04', '签名与上传'],
            ['05', 'TestFlight / App Store']
        ];
        return `<div class="app-release-progress" aria-label="iOS 发布进度">${steps.map((step, index) => {
            const current = !ready && index === 2 ? ' is-current' : '';
            return `<div class="app-release-progress-item${current}"><span>${escapeHtml(step[0])}</span><strong>${escapeHtml(step[1])}</strong></div>`;
        }).join('')}</div>`;
    }

    function renderFocusedPlatform(platform = releaseCatalogState.selectedPlatform) {
        const root = document.getElementById('app-release-focused-detail');
        if (!root) return;
        const signature = `${getAppDownloadRenderSignature(platform)}::focused`;
        if (root.dataset.appDownloadRenderSignature === signature && root.innerHTML.trim()) return;
        const runtime = getReleaseCatalogRuntime();
        const release = getLatestReleaseForPlatform(platform);
        const asset = release?.platforms?.[platform] || { status: 'unavailable' };
        const downloadable = !!runtime?.isDownloadable(asset);
        const version = asset.version || (platform === 'ios' ? '工程已就绪' : '暂无可用版本');
        const architectures = ensureArray(asset.architectures).join(' · ') || '待公布';
        const checksum = String(asset.sha256 || '');
        const appleProgress = platform === 'ios' && !downloadable ? buildAppleProgressHtml(asset) : '';
        const downloadAction = downloadable
            ? `<a id="app-download-primary-link" class="btn btn-blue" href="${escapeHtml(asset.assetUrl)}" target="_blank" rel="noopener"><i class="ti ti-download"></i> 下载最新版本</a>`
            : '<a id="app-download-primary-link" class="btn btn-blue is-disabled" aria-disabled="true" tabindex="-1"><i class="ti ti-clock"></i> 查看构建状态</a>';
        const checksumAction = checksum
            ? `<button type="button" class="btn btn-gray" data-copy-release-checksum="${escapeHtml(checksum)}"><i class="ti ti-copy"></i> 复制 SHA-256</button>`
            : '';

        root.innerHTML = `
            <p class="app-release-eyebrow">${escapeHtml(PLATFORM_LABELS[platform])} · ${escapeHtml(release?.channel || 'catalog')}</p>
            ${renderReleaseBrandIcon(asset)}
            <h3>${escapeHtml(version)}</h3>
            <p>${escapeHtml(getPlatformDescription(platform, asset))}</p>
            ${appleProgress}
            <div class="app-release-meta">
                <div><span>发布标签</span><strong>${escapeHtml(release?.releaseTag || '等待发布')}</strong></div>
                <div><span>发布日期</span><strong>${escapeHtml(formatDate(release?.generatedAt))}</strong></div>
                <div><span>构建号</span><strong>${escapeHtml(asset.buildNumber || '待公布')}</strong></div>
                <div><span>最低系统</span><strong>${escapeHtml(asset.minimumOs || '待公布')}</strong></div>
                <div><span>架构</span><strong>${escapeHtml(architectures)}</strong></div>
                <div><span>签名</span><strong>${escapeHtml(asset.signed || '待配置')}</strong></div>
                <div><span>文件大小</span><strong>${escapeHtml(formatSize(asset.bytes))}</strong></div>
                <div><span>状态</span><strong>${escapeHtml(getAssetStatusLabel(asset))}</strong></div>
                <div><span>SHA-256</span><strong title="${escapeHtml(checksum)}">${escapeHtml(checksum ? `${checksum.slice(0, 12)}…` : '等待校验')}</strong></div>
            </div>
            <div class="app-release-actions">${downloadAction}${checksumAction}</div>`;
        root.dataset.appDownloadRenderSignature = signature;
    }

    function renderReleaseTimeline(platform = releaseCatalogState.selectedPlatform) {
        const root = document.getElementById('app-release-timeline');
        if (!root) return;
        const signature = `${getAppDownloadRenderSignature(platform)}::timeline`;
        if (root.dataset.appDownloadRenderSignature === signature && root.innerHTML.trim()) return;
        const releases = releaseCatalogState.releases.filter((release) => {
            return release?.platforms?.[platform]?.status !== 'unavailable';
        }).slice(0, 6);
        root.innerHTML = releases.length ? releases.map((release) => {
            const asset = release.platforms?.[platform] || {};
            return `<article class="app-release-timeline-item">
                ${renderReleaseBrandIcon(asset, 'app-release-timeline-icon')}
                <strong>${escapeHtml(release.releaseTag)}</strong>
                <span>${escapeHtml(release.channel === 'stable' ? '稳定版' : '测试版')} · ${escapeHtml(formatDate(release.generatedAt))}</span>
                <p>${escapeHtml(getAssetStatusLabel(asset))}</p>
            </article>`;
        }).join('') : '<p class="app-release-empty">当前平台还没有发布记录。</p>';
        root.dataset.appDownloadRenderSignature = signature;
    }

    function updateReleaseSyncStatus() {
        const status = document.getElementById('app-release-sync-status');
        if (!status) return;
        if (releaseCatalogState.loading) {
            status.textContent = '正在读取版本目录…';
        } else if (releaseCatalogState.lastError) {
            status.textContent = releaseCatalogState.lastError;
        } else if (releaseCatalogState.lastFetchedAt) {
            status.textContent = `已同步 ${formatDate(releaseCatalogState.lastFetchedAt, true)}`;
        } else {
            status.textContent = '等待同步版本目录';
        }
    }

    function setSelectedPlatform(platform) {
        const normalized = platform === 'desktop' ? 'windows' : platform;
        if (!PLATFORM_KEYS.includes(normalized)) return false;
        releaseCatalogState.selectedPlatform = normalized;
        writeStorage(getBrowserStorage('sessionStorage'), SELECTED_PLATFORM_STORAGE_KEY, normalized);
        renderFocusedPlatform(normalized);
        renderReleaseTimeline(normalized);
        document.querySelectorAll('[data-app-download-platform]').forEach((button) => {
            const selected = button.dataset.appDownloadPlatform === normalized;
            button.setAttribute('aria-selected', String(selected));
            button.tabIndex = selected ? 0 : -1;
        });
        return true;
    }

    function openReleaseHistory(event) {
        const drawer = document.getElementById('app-release-history-drawer');
        if (!drawer) return;
        historyTrigger = event?.currentTarget || document.activeElement;
        drawer.hidden = false;
        document.body.classList.add('app-release-history-open');
        filterReleaseHistory();
        drawer.querySelector('[data-close-release-history]')?.focus();
    }

    function closeReleaseHistory() {
        const drawer = document.getElementById('app-release-history-drawer');
        if (!drawer || drawer.hidden) return;
        drawer.hidden = true;
        document.body.classList.remove('app-release-history-open');
        historyTrigger?.focus?.();
        historyTrigger = null;
    }

    function filterReleaseHistory() {
        const runtime = getReleaseCatalogRuntime();
        const platform = document.getElementById('app-release-history-platform')?.value || '';
        const channel = document.getElementById('app-release-history-channel')?.value || '';
        const list = document.getElementById('app-release-history-list');
        if (!list || !runtime) return;
        releaseCatalogState.historyFilters = { platform, channel };
        const releases = runtime.filterCatalog(releaseCatalogState.releases, { platform, channel });
        const historyEntries = releases.flatMap((release) => {
            const releasePlatforms = platform
                ? [platform]
                : PLATFORM_KEYS.filter((key) => release.platforms?.[key]?.status !== 'unavailable');
            return releasePlatforms.map((selectedPlatform) => ({
                release,
                selectedPlatform,
                asset: release.platforms?.[selectedPlatform] || {}
            }));
        });
        list.innerHTML = historyEntries.length ? historyEntries.map(({ release, selectedPlatform, asset }) => {
            const downloadable = !!runtime.isDownloadable(asset);
            const historyAction = downloadable
                ? `<a class="btn btn-blue" href="${escapeHtml(asset.assetUrl)}" target="_blank" rel="noopener"><i class="ti ti-download"></i> 下载此版本</a>`
                : '<a class="btn btn-blue is-disabled" aria-disabled="true" tabindex="-1"><i class="ti ti-clock"></i> 暂不可下载</a>';
            return `<article class="app-release-history-item">
                ${renderReleaseBrandIcon(asset, 'app-release-history-icon')}
                <strong>${escapeHtml(release.releaseTag)}</strong>
                <span>${escapeHtml(release.channel === 'stable' ? '稳定版' : '测试版')} · ${escapeHtml(formatDate(release.generatedAt))}</span>
                <p class="app-release-history-status">${escapeHtml(PLATFORM_LABELS[selectedPlatform] || '全部平台')} · ${escapeHtml(asset.version || '版本待公布')} · ${escapeHtml(getAssetStatusLabel(asset))}</p>
                <span class="app-release-history-size">${escapeHtml(formatSize(asset.bytes))}</span>
                <div class="app-release-history-actions">${historyAction}</div>
            </article>`;
        }).join('') : '<p class="app-release-empty">没有符合条件的历史版本。</p>';
    }

    function trapReleaseHistoryFocus(event) {
        const drawer = document.getElementById('app-release-history-drawer');
        if (!drawer || drawer.hidden || event.key !== 'Tab') return;
        const focusable = Array.from(drawer.querySelectorAll('button:not([disabled]), select:not([disabled]), a[href]'));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    function bindReleaseCenterEvents() {
        const root = document.getElementById('app-download-center');
        if (!root || root.dataset.releaseCenterBound === '1') return;
        root.dataset.releaseCenterBound = '1';
        root.addEventListener('click', (event) => {
            const tab = event.target.closest('[data-app-download-platform]');
            if (tab) {
                setSelectedPlatform(tab.dataset.appDownloadPlatform || 'windows');
                return;
            }
            const historyButton = event.target.closest('[data-open-release-history]');
            if (historyButton) {
                openReleaseHistory({ currentTarget: historyButton });
                return;
            }
            if (event.target.closest('[data-close-release-history]')) {
                closeReleaseHistory();
                return;
            }
            if (event.target.closest('[data-retry-release-catalog]')) {
                loadReleaseCatalog(true);
                return;
            }
            const checksumButton = event.target.closest('[data-copy-release-checksum]');
            if (checksumButton) {
                copyText(checksumButton.dataset.copyReleaseChecksum || '', 'SHA-256 已复制');
                return;
            }
            const drawer = event.target.closest('#app-release-history-drawer');
            if (drawer && event.target === drawer) closeReleaseHistory();
        });
        root.addEventListener('keydown', (event) => {
            const tab = event.target.closest('[data-app-download-platform]');
            if (tab && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
                const tabs = Array.from(root.querySelectorAll('[data-app-download-platform]'));
                const current = tabs.indexOf(tab);
                const next = event.key === 'Home' ? 0
                    : event.key === 'End' ? tabs.length - 1
                        : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
                event.preventDefault();
                const nextPlatform = tabs[next]?.dataset.appDownloadPlatform || '';
                if (setSelectedPlatform(nextPlatform)) {
                    root.querySelector(`[data-app-download-platform="${nextPlatform}"]`)?.focus();
                }
                return;
            }
            trapReleaseHistoryFocus(event);
        });
        root.querySelector('#app-release-history-platform')?.addEventListener('change', filterReleaseHistory);
        root.querySelector('#app-release-history-channel')?.addEventListener('change', filterReleaseHistory);
    }

    function renderReleaseCenter() {
        const root = document.getElementById('app-download-center');
        if (!root) return false;
        bindReleaseCenterEvents();
        const signature = getAppDownloadRenderSignature(releaseCatalogState.selectedPlatform);
        if (root.dataset.appDownloadRenderSignature === signature
            && document.getElementById('app-release-focused-detail')?.innerHTML.trim()
            && document.getElementById('app-release-timeline')?.innerHTML.trim()) {
            updateReleaseSyncStatus();
            return true;
        }
        setSelectedPlatform(releaseCatalogState.selectedPlatform);
        updateReleaseSyncStatus();
        const iosStatus = root.querySelector('[data-ios-status]');
        if (iosStatus) {
            const iosRelease = getLatestReleaseForPlatform('ios');
            iosStatus.textContent = iosRelease?.platforms?.ios?.status === 'ready' ? '已上架' : '待签名';
        }
        root.dataset.appDownloadRenderSignature = signature;
        return true;
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
            return (name.endsWith('.exe') && /(?:win|windows|desktop|smartedu|school-system)/i.test(name))
                || (name.endsWith('.msi') && /(?:win|windows|desktop|smartedu|school-system)/i.test(name))
                || (name.endsWith('.zip') && /(?:win|windows|desktop|smartedu)/i.test(name))
                && /(?:win|windows|desktop|smartedu|setup|installer)/i.test(name);
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

    function isVerifiedReleaseAsset(asset) {
        return !!(asset && asset.url && asset.name);
    }

    function getLatestReleaseForChannel(channelKey, releases = state.releases) {
        return ensureArray(releases).find((release) => isVerifiedReleaseAsset(release?.assets?.[channelKey])) || null;
    }

    function shouldUseFallbackDownloadLink() {
        return window.PUBLIC_DOWNLOAD_ALLOW_UNVERIFIED_LINKS === true;
    }

    function shouldAutoFetchReleaseCatalog() {
        return window.PUBLIC_DOWNLOAD_AUTO_FETCH_RELEASES === true;
    }

    function preferHostedChannelDownload(channel) {
        const url = String(channel?.url || '').trim();
        if (state.remoteCatalogFetched || !url) return false;
        if (/^\.?\/downloads\//i.test(url)) return true;
        try {
            return new URL(url, window.location.href).pathname.startsWith('/downloads/');
        } catch (_) {
            return false;
        }
    }

    function getDownloadAssetModel(channelKey, channel = getChannel(channelKey)) {
        if (preferHostedChannelDownload(channel)) {
            return {
                ok: true,
                verified: true,
                release: buildFallbackRelease(),
                url: channel.url,
                name: channel.fileName,
                size: 0,
                label: '本站安装包可用',
                note: `${channel.fileName} 已由本站托管，可直接下载。`
            };
        }
        const latestRelease = getLatestReleaseForChannel(channelKey);
        const latestAsset = latestRelease?.assets?.[channelKey];
        if (isVerifiedReleaseAsset(latestAsset)) {
            return {
                ok: true,
                verified: true,
                release: latestRelease,
                url: latestAsset.url,
                name: latestAsset.name,
                size: Number(latestAsset.size || 0),
                label: 'Release 资产可用',
                note: `${latestRelease.tag || 'latest'} 已包含 ${latestAsset.name}`
            };
        }
        if (shouldUseFallbackDownloadLink()) {
            return {
                ok: true,
                verified: false,
                release: null,
                url: channel.url,
                name: channel.fileName,
                size: 0,
                label: '等待线上校验',
                note: state.lastError ? 'Release 读取失败，暂用固定下载入口。' : '点击检查更新后会校验真实资产。'
            };
        }
        return {
            ok: false,
            verified: false,
            release: null,
            url: '',
            name: channel.fileName,
            size: 0,
            label: '下载资产缺失',
            note: '最新公开 release 未包含当前平台安装包，已暂停直达下载。'
        };
    }

    function getPeerDownloadChannelKey(channelKey) {
        return channelKey === 'desktop' ? 'android' : 'desktop';
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
                    ${androidAsset && androidAsset.url
                        ? `<a class="btn btn-gray app-download-release-btn" href="${escapeHtml(androidAsset.url)}" target="_blank" rel="noopener"><i class="ti ti-brand-android"></i> 安卓包</a>`
                        : ''}
                    ${desktopAsset && desktopAsset.url
                        ? `<a class="btn btn-gray app-download-release-btn" href="${escapeHtml(desktopAsset.url)}" target="_blank" rel="noopener"><i class="ti ti-brand-windows"></i> 桌面端</a>`
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
        const assetModel = getDownloadAssetModel(downloadChannelKey);
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
                label: '下载资产',
                value: assetModel.label,
                copy: assetModel.note,
                tone: assetModel.ok ? (assetModel.verified ? 'success' : 'neutral') : 'warning'
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

        const releases = state.releases.length ? state.releases : [];
        if (!releases.length) {
            releaseList.innerHTML = `
                <article class="app-download-release-card is-empty">
                    <div class="app-download-release-top">
                        <strong>历史版本已清空</strong>
                        <span>从现在开始</span>
                    </div>
                    <p>旧版本更新文件已不再展示。后续新增 APK 或 Windows 应用包时，会从当前入口重新记录。</p>
                </article>
            `;
            return;
        }
        releaseList.innerHTML = releases
            .slice(0, 6)
            .map((release) => buildReleaseCardHtml(release, activeKey))
            .join('');
    }

    function renderSpecs(root, channel) {
        const specGrid = root.querySelector('#app-download-spec-grid');
        if (!specGrid) return;

        const latestRelease = getLatestReleaseForChannel(channel.key);
        const assetModel = getDownloadAssetModel(channel.key, channel);
        const specs = [
            {
                label: '当前下载链接',
                value: assetModel.url || '当前平台 release 资产缺失',
                code: true,
                copyValue: assetModel.url,
                copyLabel: assetModel.url ? '复制链接' : ''
            },
            {
                label: '当前文件名',
                value: assetModel.name || channel.fileName
            },
            {
                label: '当前文件大小',
                value: assetModel.size ? formatSize(assetModel.size) : assetModel.label
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
        const assetModel = getDownloadAssetModel(channel.key, channel);
        const peerChannel = getChannel(getPeerDownloadChannelKey(channel.key));
        const peerAssetModel = getDownloadAssetModel(peerChannel.key, peerChannel);
        const primaryLink = root.querySelector('#app-download-primary-link');
        const secondaryLink = root.querySelector('#app-download-secondary-link');
        const releaseLink = root.querySelector('#app-download-release-link');
        const copyButton = root.querySelector('#app-download-copy-link');
        const linkInput = root.querySelector('#app-download-link-input');
        const digestButton = root.querySelector('#app-download-copy-checksum');
        const assetUrl = resolveUrl(assetModel.url);
        const assetName = assetModel.name || channel.fileName;

        applyActionLink(primaryLink, assetUrl, {
            downloadName: assetName,
            labelHtml: `<i class="ti ti-download"></i> ${escapeHtml(assetModel.ok ? channel.primaryActionLabel : '暂无可用安装包')}`
        });
        if (secondaryLink) applyActionLink(secondaryLink, resolveUrl(peerAssetModel.url), {
            downloadName: peerAssetModel.name || peerChannel.fileName,
            labelHtml: `<i class="ti ${escapeHtml(peerChannel.icon || 'ti-download')}"></i> ${escapeHtml(peerAssetModel.ok ? peerChannel.primaryActionLabel : `${peerChannel.shortLabel} 暂无安装包`)}`
        });
        applyActionLink(releaseLink, resolveUrl(latestRelease?.url || RELEASE_PAGE_URL));
        if (linkInput) linkInput.value = assetUrl || '';
        if (copyButton) copyButton.onclick = () => copyText(assetUrl, `${channel.label}链接已复制`);
        if (digestButton) digestButton.onclick = () => copyText(buildDigest(channel, latestRelease), `${channel.shortLabel}说明已复制`);
    }

    function renderAppDownloadCenter(selected = state.pagePlatform) {
        let root = document.getElementById('app-download-center');
        if (root && root.dataset.lazySectionPlaceholder === '1'
            && typeof window.ensureLazySectionLoaded === 'function') {
            root = window.ensureLazySectionLoaded('app-download-center') || root;
        }
        if (!root) return false;
        const requested = selected === 'desktop' ? 'windows' : selected;
        if (PLATFORM_KEYS.includes(requested)) releaseCatalogState.selectedPlatform = requested;
        return renderReleaseCenter();
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
                        <p id="version-center-copy">查看当前版本、检查最新 release；旧历史记录已清空，后续新版本从这里开始记录。</p>
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
                        <h3>后续版本与更新点</h3>
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
        const assetModel = getDownloadAssetModel(state.modalPlatform, channel);
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
                            <div><span>下载文件</span><strong>${escapeHtml(assetModel.name || channel.fileName)}</strong></div>
                            <div><span>文件大小</span><strong>${escapeHtml(assetModel.size ? formatSize(assetModel.size) : assetModel.label)}</strong></div>
                        </div>
                        <div class="version-center-inline-actions">
                            <a class="btn btn-blue${assetModel.ok ? '' : ' is-disabled'}" ${assetModel.url ? `href="${escapeHtml(assetModel.url)}" target="_blank" rel="noopener"` : 'aria-disabled="true" tabindex="-1"'}><i class="ti ti-download"></i> ${assetModel.ok ? '下载当前平台' : '暂无可用安装包'}</a>
                            <button type="button" class="btn btn-gray" data-version-center-copy="${escapeHtml(assetModel.url)}" ${assetModel.url ? '' : 'disabled'}><i class="ti ti-link"></i> 复制链接</button>
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
            const releases = state.releases.length ? state.releases : [];
            if (!releases.length) {
                historyWrap.innerHTML = `
                    <article class="app-download-release-card is-empty">
                        <div class="app-download-release-top">
                            <strong>历史版本已清空</strong>
                            <span>从现在开始</span>
                        </div>
                        <p>旧版本更新文件已不再展示。后续新增 APK 或 Windows 应用包时，会从这里开始记录。</p>
                    </article>
                `;
                return;
            }
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
        renderAppDownloadCenter(releaseCatalogState.selectedPlatform);
        const backdrop = document.getElementById('version-center-backdrop');
        if (backdrop && backdrop.style.display !== 'none') renderModal();
        syncToolbarButton();
    }

    async function refreshReleaseCatalog(force = false) {
        if (isLocalFileRuntime() && !force) {
            if (!state.releases.length) state.releases = [buildFallbackRelease()];
            state.lastError = '';
            state.lastFetchedAt = Date.now();
            refreshSurfaces();
            return state.releases;
        }
        const now = Date.now();
        if (!force && !shouldAutoFetchReleaseCatalog()) {
            if (!state.releases.length) state.releases = [buildFallbackRelease()];
            state.lastError = '';
            if (!state.lastFetchedAt) state.lastFetchedAt = now;
            refreshSurfaces();
            return state.releases;
        }
        const hasFreshRemoteCatalog = !!state.lastFetchedAt && !state.lastError && now - state.lastFetchedAt < RELEASE_CACHE_TTL_MS;
        if (!force && hasFreshRemoteCatalog && state.releases.length) {
            return state.releases;
        }
        if (!force && !state.releases.length) {
            if (!state.releases.length) state.releases = [buildFallbackRelease()];
            state.lastError = '';
            refreshSurfaces();
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
                state.remoteCatalogFetched = true;
                refreshSurfaces();
                return state.releases;
            })
            .catch((error) => {
                console.warn('[version-center] fetch releases failed:', error);
                state.lastError = error instanceof Error ? error.message : String(error);
                state.remoteCatalogFetched = false;
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
        if (event.key === 'Escape') closeReleaseHistory();
        if (event.key === 'Escape' && document.body.classList.contains('version-center-open')) {
            closeModal();
        }
    });

    window.renderAppDownloadCenter = renderAppDownloadCenter;
    window.setAppDownloadPlatform = function (type = releaseCatalogState.selectedPlatform) {
        return setSelectedPlatform(type);
    };
    window.copyAppDownloadLink = function (type = releaseCatalogState.selectedPlatform) {
        const platform = type === 'desktop' ? 'windows' : type;
        const release = getLatestReleaseForPlatform(platform);
        const asset = release?.platforms?.[platform] || {};
        return copyText(asset.assetUrl || '', `${PLATFORM_LABELS[platform] || '应用'}链接已复制`);
    };
    window.copyAppDownloadChecksum = function (type = releaseCatalogState.selectedPlatform) {
        const platform = type === 'desktop' ? 'windows' : type;
        const release = getLatestReleaseForPlatform(platform);
        return copyText(release?.platforms?.[platform]?.sha256 || '', `${PLATFORM_LABELS[platform] || '应用'}校验值已复制`);
    };
    window.AppReleaseCenter = Object.freeze({
        loadReleaseCatalog,
        renderFocusedPlatform,
        renderReleaseTimeline,
        openReleaseHistory,
        closeReleaseHistory,
        filterReleaseHistory,
        setSelectedPlatform,
        getReleases: () => releaseCatalogState.releases.slice()
    });
    window.VersionCenter = {
        openModal,
        closeModal,
        checkForUpdates: (options = {}) => performVersionCheck(options),
        refresh: () => Promise.all([refreshReleaseCatalog(true), loadReleaseCatalog(true)]),
        getCurrentBuildInfo: () => getBuildInfo(detectRuntimeChannel()),
        getReleases: () => state.releases.slice()
    };
    window.openVersionCenterModal = openModal;
    if (window.Auth && typeof window.Auth === 'object' && typeof window.Auth.openVersionCenterModal !== 'function') {
        window.Auth.openVersionCenterModal = openModal;
    }
    installToolbarObserver();
    renderAppDownloadCenter(releaseCatalogState.selectedPlatform);
    loadReleaseCatalog(false);
    window.__APP_DOWNLOAD_RUNTIME_PATCHED__ = true;
})();
