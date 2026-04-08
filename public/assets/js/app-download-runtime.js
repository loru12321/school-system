(() => {
    if (typeof window === 'undefined' || window.__APP_DOWNLOAD_RUNTIME_PATCHED__) return;

    const APP_DOWNLOAD_CONFIG = {
        appName: 'SmartEdu Analytics for Android',
        packageName: 'com.loru.schoolsystem',
        versionName: '1.0',
        versionCode: 1,
        fileName: 'school-system-android-v1.0.apk',
        downloadPath: './downloads/school-system-android-v1.0.apk',
        fileSize: '22.7 MB',
        lastUpdated: '2026-04-08 07:55',
        supportedAndroid: 'Android 7.0 及以上',
        recommendedAndroid: 'Android 11 及以上',
        checksum: '1633EFAAD55452F18CCE92FB7CC363B5DCD6DF47CCA0DDA1BDAE672156C45DD4',
        heroTitle: '把学校工作台装进随身设备',
        heroCopy: 'Android 版延续网页端同一套账号与模块入口，适合在教室、办公室、会议和家校沟通场景下直接打开系统。',
        summary: '下载中心会同步展示 APK 包、版本信息、更新记录、安装方式和校验值，方便统一分发与升级。',
        features: [
            {
                icon: 'ti-device-mobile',
                title: '统一安装包入口',
                body: '学校工作台、学情模块与移动查询场景统一由同一个 APK 交付，不需要再单独找安装包。'
            },
            {
                icon: 'ti-user-check',
                title: '沿用同账号体系',
                body: '与网页端共用账号与权限范围，安装完成后即可按现有身份直接登录。'
            },
            {
                icon: 'ti-bolt',
                title: '适合现场快速打开',
                body: '适合教务巡课、班主任临时查阅、家校沟通和移动汇报等需要随手查看系统的场景。'
            },
            {
                icon: 'ti-shield-check',
                title: '版本信息透明',
                body: '当前页面会同步展示包名、版本号、更新时间、安装包大小和 SHA-256 校验值。'
            }
        ],
        scenes: [
            {
                title: '教务与级部',
                body: '在会议、巡课或走班过程中，直接用手机查看学校工作台与分析模块。'
            },
            {
                title: '班主任与教师',
                body: '在办公室、教室或家校沟通现场，快速进入成绩、学情与报告入口。'
            },
            {
                title: '家长与学生',
                body: '如需在移动端直接进入查询入口，可通过网页端统一下载安装同一版本 APK。'
            }
        ],
        installSteps: [
            '点击“下载 APK”获取安装包，建议在安卓手机浏览器内直接完成下载。',
            '如浏览器提示安全限制，请在系统设置中临时允许“安装未知应用”。',
            '安装完成后返回桌面打开应用，使用现有账号密码登录即可进入系统。',
            '后续如网页端提示有新版本，回到本页重新下载安装即可完成覆盖升级。'
        ],
        releases: [
            {
                version: 'v1.0',
                date: '2026-04-08',
                title: 'Android 首发版',
                bullets: [
                    '提供学校工作台与移动查询场景的统一安装包。',
                    '沿用网页端账号体系、数据口径和模块入口。',
                    '适合作为学校内部统一分发的安卓安装版本。'
                ]
            },
            {
                version: 'Web',
                date: '2026-04-08',
                title: '网页端下载中心上线',
                bullets: [
                    '网页端新增 APK 下载中心，支持直接下载安装包。',
                    '同页展示版本号、包名、更新时间、更新说明与安装步骤。',
                    '后续 APK 迭代可以继续在这里集中查看与分发。'
                ]
            }
        ]
    };

    function resolveDownloadUrl() {
        try {
            return new URL(APP_DOWNLOAD_CONFIG.downloadPath, window.location.href).toString();
        } catch (_) {
            return APP_DOWNLOAD_CONFIG.downloadPath;
        }
    }

    function formatShortHash(value) {
        const text = String(value || '').trim();
        if (text.length <= 20) return text;
        return `${text.slice(0, 12)}...${text.slice(-8)}`;
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
                icon: type === 'error' ? 'error' : 'success',
                title: message,
                showConfirmButton: false,
                timer: 1800
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
            console.warn('copy failed:', error);
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
            console.warn('execCommand copy failed:', error);
            notify('复制失败，请手动复制', 'error');
            return false;
        } finally {
            fallback.remove();
        }
    }

    function renderMetaGrid(root) {
        const metaGrid = root.querySelector('#app-download-meta-grid');
        if (!metaGrid) return;

        const downloadUrl = resolveDownloadUrl();
        const cards = [
            { label: '当前版本', value: `v${APP_DOWNLOAD_CONFIG.versionName}` },
            { label: '安装包大小', value: APP_DOWNLOAD_CONFIG.fileSize },
            { label: '最近更新', value: APP_DOWNLOAD_CONFIG.lastUpdated },
            { label: '下载链接', value: downloadUrl.replace(/^https?:\/\//, '') }
        ];

        metaGrid.innerHTML = cards.map((card) => `
            <div class="app-download-meta-card">
                <span class="app-download-meta-label">${card.label}</span>
                <strong class="app-download-meta-value">${card.value}</strong>
            </div>
        `).join('');
    }

    function renderFeatures(root) {
        const featureGrid = root.querySelector('#app-download-feature-grid');
        if (!featureGrid) return;

        featureGrid.innerHTML = APP_DOWNLOAD_CONFIG.features.map((item) => `
            <article class="app-download-feature-card">
                <div class="app-download-feature-icon"><i class="ti ${item.icon}"></i></div>
                <div>
                    <h4>${item.title}</h4>
                    <p>${item.body}</p>
                </div>
            </article>
        `).join('');
    }

    function renderScenes(root) {
        const sceneList = root.querySelector('#app-download-scene-list');
        if (!sceneList) return;

        sceneList.innerHTML = APP_DOWNLOAD_CONFIG.scenes.map((item) => `
            <article class="app-download-scene-card">
                <h4>${item.title}</h4>
                <p>${item.body}</p>
            </article>
        `).join('');
    }

    function renderInstallSteps(root) {
        const stepList = root.querySelector('#app-download-install-list');
        if (!stepList) return;

        stepList.innerHTML = APP_DOWNLOAD_CONFIG.installSteps.map((text, index) => `
            <li class="app-download-step-item">
                <span class="app-download-step-index">${index + 1}</span>
                <span>${text}</span>
            </li>
        `).join('');
    }

    function renderReleases(root) {
        const releaseList = root.querySelector('#app-download-release-list');
        if (!releaseList) return;

        releaseList.innerHTML = APP_DOWNLOAD_CONFIG.releases.map((item) => `
            <article class="app-download-release-card" data-app-release-item="true">
                <div class="app-download-release-head">
                    <span class="app-download-release-badge">${item.version}</span>
                    <span class="app-download-release-date">${item.date}</span>
                </div>
                <h4>${item.title}</h4>
                <ul>
                    ${item.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}
                </ul>
            </article>
        `).join('');
    }

    function renderSpecs(root) {
        const specGrid = root.querySelector('#app-download-spec-grid');
        if (!specGrid) return;

        const specs = [
            { label: '应用名称', value: APP_DOWNLOAD_CONFIG.appName },
            { label: '包名', value: APP_DOWNLOAD_CONFIG.packageName, copyValue: APP_DOWNLOAD_CONFIG.packageName, copyLabel: '复制包名' },
            { label: '版本号', value: `v${APP_DOWNLOAD_CONFIG.versionName} · versionCode ${APP_DOWNLOAD_CONFIG.versionCode}` },
            { label: '适用系统', value: `${APP_DOWNLOAD_CONFIG.supportedAndroid}，推荐 ${APP_DOWNLOAD_CONFIG.recommendedAndroid}` },
            { label: '安装包文件', value: APP_DOWNLOAD_CONFIG.fileName },
            { label: 'SHA-256', value: APP_DOWNLOAD_CONFIG.checksum, code: true, copyValue: APP_DOWNLOAD_CONFIG.checksum, copyLabel: '复制校验值' }
        ];

        specGrid.innerHTML = specs.map((item, index) => `
            <article class="app-download-spec-card">
                <span class="app-download-spec-label">${item.label}</span>
                <div class="app-download-spec-row">
                    <div class="${item.code ? 'app-download-spec-code' : 'app-download-spec-value'}">${item.value}</div>
                    ${item.copyValue ? `<button type="button" class="btn btn-gray app-download-mini-btn" data-copy-index="${index}">${item.copyLabel}</button>` : ''}
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

    function bindActions(root) {
        const downloadUrl = resolveDownloadUrl();
        const primaryLink = root.querySelector('#app-download-primary-link');
        const secondaryLink = root.querySelector('#app-download-secondary-link');
        const copyButton = root.querySelector('#app-download-copy-link');
        const linkInput = root.querySelector('#app-download-link-input');
        const checksumButton = root.querySelector('#app-download-copy-checksum');

        if (primaryLink) {
            primaryLink.href = downloadUrl;
            primaryLink.setAttribute('download', APP_DOWNLOAD_CONFIG.fileName);
        }
        if (secondaryLink) {
            secondaryLink.href = downloadUrl;
            secondaryLink.setAttribute('download', APP_DOWNLOAD_CONFIG.fileName);
        }
        if (linkInput) {
            linkInput.value = downloadUrl;
        }
        if (copyButton) {
            copyButton.onclick = () => copyText(downloadUrl, '下载链接已复制');
        }
        if (checksumButton) {
            checksumButton.onclick = () => copyText(APP_DOWNLOAD_CONFIG.checksum, 'SHA-256 校验值已复制');
        }
    }

    function renderAppDownloadCenter() {
        const root = document.getElementById('app-download-center');
        if (!root) return false;

        const heroTitle = root.querySelector('#app-download-hero-title');
        const heroCopy = root.querySelector('#app-download-hero-copy');
        const summary = root.querySelector('#app-download-summary');
        const checksumShort = root.querySelector('#app-download-short-checksum');

        if (heroTitle) heroTitle.textContent = APP_DOWNLOAD_CONFIG.heroTitle;
        if (heroCopy) heroCopy.textContent = APP_DOWNLOAD_CONFIG.heroCopy;
        if (summary) summary.textContent = APP_DOWNLOAD_CONFIG.summary;
        if (checksumShort) checksumShort.textContent = formatShortHash(APP_DOWNLOAD_CONFIG.checksum);

        renderMetaGrid(root);
        renderFeatures(root);
        renderScenes(root);
        renderInstallSteps(root);
        renderReleases(root);
        renderSpecs(root);
        bindActions(root);
        return true;
    }

    window.renderAppDownloadCenter = renderAppDownloadCenter;
    window.copyAppDownloadLink = function () {
        return copyText(resolveDownloadUrl(), '下载链接已复制');
    };
    window.copyAppDownloadChecksum = function () {
        return copyText(APP_DOWNLOAD_CONFIG.checksum, 'SHA-256 校验值已复制');
    };
    window.__APP_DOWNLOAD_RUNTIME_PATCHED__ = true;
})();
