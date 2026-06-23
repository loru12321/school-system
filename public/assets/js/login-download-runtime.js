(() => {
    if (typeof window === 'undefined' || window.__LOGIN_DOWNLOAD_RUNTIME_PATCHED__) return;

    const RELEASE_PAGE_URL = 'https://github.com/hka123321/school-system/releases/latest';
    const DEFAULT_BUILD_INFO = {
        shared: {
            releaseTag: 'beta-20260621-9a362b3',
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
            label: '安卓下载',
            shortLabel: 'Android APK',
            badge: '手机 / 平板',
            icon: 'ti-brand-android',
            accent: '#22c55e',
            url: './downloads/school-system-android-beta-20260621-9a362b3.apk',
            fileName: 'school-system-android-beta-20260621-9a362b3.apk',
            helper: '适合安卓手机和平板直接安装，安装后沿用现有账号登录。',
            notes: [
                '适合教师、班主任、家长与学生在移动端直接打开系统。',
                '建议在安卓浏览器里下载，安装完成后使用现有账号登录。',
                '如需统一转发，优先复制当前链接或 release 页面链接。'
            ]
        },
        desktop: {
            key: 'desktop',
            label: '桌面端下载',
            shortLabel: 'Windows 安装包',
            badge: 'Windows 桌面',
            icon: 'ti-brand-windows',
            accent: '#60a5fa',
            url: './downloads/school-system-windows-beta-20260621-9a362b3.exe',
            fileName: 'school-system-windows-beta-20260621-9a362b3.exe',
            helper: '适合 Windows 办公电脑一步步安装到本机，创建桌面/开始菜单入口后启动正式系统。',
            notes: [
                '适合教务处、办公室、机房与固定工位使用。',
                '下载 EXE 后双击打开安装向导，选择安装目录并创建本地快捷方式。',
                '安装完成后可从桌面、开始菜单或 Windows 系统卸载入口管理客户端。'
            ]
        }
    };

    function notify(message, type = 'success') {
        if (window.UI && typeof window.UI.toast === 'function') {
            window.UI.toast(message, type);
            return;
        }
        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire({
                toast: true,
                position: 'top',
                icon: type === 'error' ? 'error' : 'success',
                title: message,
                showConfirmButton: false,
                timer: 1800
            });
            return;
        }
        if (typeof window.appDebug === 'function') window.appDebug(message);
    }

    function getCatalog() {
        const runtimeCatalog = window.PUBLIC_DOWNLOAD_CHANNELS && typeof window.PUBLIC_DOWNLOAD_CHANNELS === 'object'
            ? window.PUBLIC_DOWNLOAD_CHANNELS
            : {};
        return {
            android: {
                ...DEFAULT_CHANNELS.android,
                ...(runtimeCatalog.android || {})
            },
            desktop: {
                ...DEFAULT_CHANNELS.desktop,
                ...(runtimeCatalog.desktop || {})
            }
        };
    }

    function getChannel(type = 'android') {
        const catalog = getCatalog();
        return catalog[type === 'desktop' ? 'desktop' : 'android'];
    }

    function getFileName(type = 'android', url = getUrl(type)) {
        const normalizedUrl = String(url || '').split('#')[0].split('?')[0];
        const fileName = normalizedUrl.split('/').filter(Boolean).pop();
        const fallback = type === 'desktop'
            ? DEFAULT_CHANNELS.desktop.fileName
            : DEFAULT_CHANNELS.android.fileName;
        return fileName || getChannel(type)?.fileName || fallback;
    }

    function getUrl(type = 'android') {
        return String(getChannel(type)?.url || '').trim();
    }

    function syncLinks() {
        const linkMap = {
            android: {
                url: getUrl('android'),
                fileName: getFileName('android')
            },
            desktop: {
                url: getUrl('desktop'),
                fileName: getFileName('desktop')
            }
        };
        document.querySelectorAll('[data-public-download]').forEach((link) => {
            if (!(link instanceof HTMLAnchorElement)) return;
            const type = link.dataset.publicDownload === 'desktop' ? 'desktop' : 'android';
            const config = linkMap[type];
            if (!config?.url) return;
            link.href = config.url;
            link.setAttribute('download', config.fileName);
        });
    }

    async function copyLink(type = 'android') {
        const channel = getChannel(type);
        const downloadUrl = String(channel?.url || '').trim();
        if (!downloadUrl) {
            notify('下载链接暂未准备好，请稍后再试', 'error');
            return false;
        }
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(downloadUrl);
                notify(`${channel?.label || '下载'}链接已复制`);
                return true;
            }
        } catch (error) {
            console.warn('[login-download] clipboard copy failed:', error);
        }

        const input = document.createElement('textarea');
        input.value = downloadUrl;
        input.setAttribute('readonly', 'readonly');
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();

        try {
            document.execCommand('copy');
            notify(`${channel?.label || '下载'}链接已复制`);
            return true;
        } catch (error) {
            console.warn('[login-download] fallback copy failed:', error);
            notify('复制失败，请手动复制下载链接', 'error');
            return false;
        } finally {
            input.remove();
        }
    }

    function ensureModal(auth) {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return null;

        let backdrop = document.getElementById('login-download-hub-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'login-download-hub-backdrop';
            backdrop.className = 'login-download-hub-backdrop';
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
            backdrop.innerHTML = `
                <div class="login-download-hub-dialog" role="dialog" aria-modal="true" aria-labelledby="login-download-hub-title">
                    <div class="login-download-hub-shell">
                        <div class="login-download-hub-top">
                            <span class="login-download-hub-chip">应用下载</span>
                            <button type="button" class="login-download-hub-close" data-download-close aria-label="关闭应用下载">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="login-download-hub-brand">
                            <h2 id="login-download-hub-title" tabindex="-1">Android 与桌面端统一下载中心</h2>
                            <p>先选平台，再复制链接或直接下载；安卓 APK 和 Windows EXE 都跟随最新 GitHub release 更新。</p>
                        </div>
                        <div class="login-download-hub-platforms" data-download-platforms></div>
                        <div class="login-download-hub-detail" data-download-detail></div>
                    </div>
                </div>
            `;
            overlay.appendChild(backdrop);
        }

        if (backdrop.dataset.downloadBound !== 'true') {
            backdrop.addEventListener('click', (event) => {
                if (event.target === backdrop) closeModal(auth);
            });
            const closeButton = backdrop.querySelector('[data-download-close]');
            if (closeButton) closeButton.addEventListener('click', () => closeModal(auth));
            backdrop.dataset.downloadBound = 'true';
        }

        return backdrop;
    }

    function renderModal(auth, type = 'android') {
        const backdrop = ensureModal(auth);
        if (!backdrop) return null;

        const channels = ['android', 'desktop'].map((key) => getChannel(key)).filter(Boolean);
        const activeType = type === 'desktop' ? 'desktop' : 'android';
        const activeChannel = getChannel(activeType);
        const platformWrap = backdrop.querySelector('[data-download-platforms]');
        const detailWrap = backdrop.querySelector('[data-download-detail]');

        if (platformWrap) {
            platformWrap.innerHTML = channels.map((channel) => `
                <button
                    type="button"
                    class="login-download-hub-platform${channel.key === activeType ? ' is-active' : ''}"
                    data-download-platform="${channel.key}"
                    style="--download-accent:${channel.accent || '#22c55e'};"
                >
                    <span class="login-download-hub-platform-icon"><i class="ti ${channel.icon || 'ti-download'}"></i></span>
                    <span class="login-download-hub-platform-copy">
                        <strong>${channel.label}</strong>
                        <span>${channel.badge || ''}</span>
                    </span>
                </button>
            `).join('');

            platformWrap.querySelectorAll('[data-download-platform]').forEach((button) => {
                button.addEventListener('click', () => renderModal(auth, button.dataset.downloadPlatform || 'android'));
            });
        }

        if (detailWrap && activeChannel) {
            const notes = Array.isArray(activeChannel.notes) ? activeChannel.notes : [];
            detailWrap.innerHTML = `
                <div class="login-download-hub-card" style="--download-accent:${activeChannel.accent || '#22c55e'};">
                    <div class="login-download-hub-card-head">
                        <div>
                            <span class="login-download-hub-card-kicker">${activeChannel.shortLabel || activeChannel.label}</span>
                            <h3>${activeChannel.badge || activeChannel.label}</h3>
                        </div>
                        <span class="login-download-hub-card-badge">Latest</span>
                    </div>
                    <p class="login-download-hub-card-copy">${activeChannel.helper || ''}</p>
                    <div class="login-download-hub-link">
                        <input type="text" readonly value="${activeChannel.url || ''}" />
                    </div>
                    <div class="login-download-hub-actions">
                        <a class="btn btn-blue" href="${activeChannel.url || '#'}" download="${activeChannel.fileName || ''}">
                            <i class="ti ti-download"></i> 直接下载
                        </a>
                        <button type="button" class="btn btn-gray" data-download-copy="${activeChannel.key}">
                            <i class="ti ti-copy"></i> 复制链接
                        </button>
                        <a class="btn btn-green" href="${RELEASE_PAGE_URL}" target="_blank" rel="noopener">
                            <i class="ti ti-brand-github"></i> 查看 Release
                        </a>
                    </div>
                    <div class="login-download-hub-note-list">
                        ${notes.map((note) => `<span>${note}</span>`).join('')}
                    </div>
                </div>
            `;

            const copyButton = detailWrap.querySelector('[data-download-copy]');
            if (copyButton) {
                copyButton.addEventListener('click', () => copyLink(copyButton.dataset.downloadCopy || activeType));
            }
        }

        return backdrop;
    }

    function openModal(auth, type = 'android') {
        if (auth && typeof auth.ensureLoginWorkbench === 'function') auth.ensureLoginWorkbench();
        if (auth && typeof auth.closeSystemIntroModal === 'function') auth.closeSystemIntroModal();
        if (auth && typeof auth.closeLoginPortalModal === 'function') auth.closeLoginPortalModal();
        const backdrop = renderModal(auth, type);
        if (backdrop) {
            backdrop.style.display = 'flex';
            backdrop.setAttribute('aria-hidden', 'false');
        }
        document.body.classList.add('login-download-hub-open');
        if (auth && typeof auth.setLoginWorkbenchNavState === 'function') {
            auth.setLoginWorkbenchNavState('download');
        }
        setTimeout(() => {
            const title = backdrop?.querySelector('#login-download-hub-title');
            if (title && typeof title.focus === 'function') title.focus({ preventScroll: true });
        }, 60);
        return type === 'desktop' ? 'desktop' : 'android';
    }

    function closeModal(auth) {
        const backdrop = document.getElementById('login-download-hub-backdrop');
        if (backdrop) {
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('login-download-hub-open');
        if (!document.body.classList.contains('login-system-intro-open')
            && auth
            && typeof auth.setLoginWorkbenchNavState === 'function') {
            auth.setLoginWorkbenchNavState('modal');
        }
    }

    window.PUBLIC_DOWNLOAD_RELEASE_PAGE_URL = window.PUBLIC_DOWNLOAD_RELEASE_PAGE_URL || RELEASE_PAGE_URL;
    window.PUBLIC_VERSION_CENTER_BUILD_INFO = window.PUBLIC_VERSION_CENTER_BUILD_INFO || DEFAULT_BUILD_INFO;
    window.PUBLIC_VERSION_CENTER_RELEASES = window.PUBLIC_VERSION_CENTER_RELEASES || [];
    window.PUBLIC_DOWNLOAD_CHANNELS = window.PUBLIC_DOWNLOAD_CHANNELS || DEFAULT_CHANNELS;
    window.PUBLIC_APK_DOWNLOAD_URL = window.PUBLIC_APK_DOWNLOAD_URL || DEFAULT_CHANNELS.android.url;
    window.PUBLIC_DESKTOP_DOWNLOAD_URL = window.PUBLIC_DESKTOP_DOWNLOAD_URL || DEFAULT_CHANNELS.desktop.url;
    window.copyPublicDownloadLink = copyLink;
    window.copyPublicApkDownloadLink = () => copyLink('android');
    window.copyPublicDesktopDownloadLink = () => copyLink('desktop');
    window.LoginDownloadRuntime = {
        getCatalog,
        getChannel,
        getUrl,
        getFileName,
        syncLinks,
        ensureModal,
        renderModal,
        openModal,
        closeModal
    };
    window.__LOGIN_DOWNLOAD_RUNTIME_PATCHED__ = true;
})();
