const fs = require('node:fs');
const path = require('node:path');
const packageInfo = require('./package.json');
const {
    RELEASE_PAGE_URL,
    fetchReleaseCatalog,
    getDesktopUpdateState
} = require('./release-service');
const {
    app,
    BrowserWindow,
    ipcMain,
    Menu,
    Tray,
    dialog,
    nativeImage,
    session,
    shell
} = require('electron');

const APP_TITLE = '智慧教务管理系统';
const APP_USER_MODEL_ID = 'com.smartedu.desktop';
const ENTRY_FILE_NAME = 'lt.html';
const ICON_FILE_NAME = 'app-icon.ico';
const FALLBACK_ICON_FILE_NAME = 'favicon.ico';
const AUTO_UPDATE_CHECK_DELAY_MS = 6000;

const isSmokeMode = process.argv.includes('--smoke-test');
const smokeResultFile = String(process.env.SMARTEDU_SMOKE_FILE || '').trim();
const hasSingleInstanceLock = app.requestSingleInstanceLock();

let mainWindow = null;
let splashWindow = null;
let tray = null;
let isQuitRequested = false;
let autoUpdateCheckTimer = 0;
let lastPromptedUpdateTag = '';

if (!hasSingleInstanceLock) {
    app.quit();
} else {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-renderer-backgrounding');

    if (process.platform === 'win32') {
        app.setAppUserModelId(APP_USER_MODEL_ID);
    }
}

function getBundlePath(...segments) {
    return path.join(__dirname, 'bundle', ...segments);
}

function getAppIconPath() {
    return getBundlePath(ICON_FILE_NAME);
}

function getFallbackIconPath() {
    return getBundlePath(FALLBACK_ICON_FILE_NAME);
}

function getAppIcon() {
    const primaryPath = getAppIconPath();
    if (fs.existsSync(primaryPath)) {
        const icon = nativeImage.createFromPath(primaryPath);
        if (!icon.isEmpty()) return icon;
    }

    const fallbackPath = getFallbackIconPath();
    if (fs.existsSync(fallbackPath)) {
        const icon = nativeImage.createFromPath(fallbackPath);
        if (!icon.isEmpty()) return icon;
    }

    return nativeImage.createEmpty();
}

function getTrayIcon() {
    const icon = getAppIcon();
    if (icon.isEmpty()) {
        return getAppIconPath();
    }

    return process.platform === 'win32'
        ? icon.resize({ width: 16, height: 16, quality: 'best' })
        : icon;
}

function getEntryFile() {
    const entryFile = getBundlePath(ENTRY_FILE_NAME);
    if (!fs.existsSync(entryFile)) {
        throw new Error(`Desktop bundle not found: ${entryFile}`);
    }
    return entryFile;
}

function isBundledUrl(targetUrl) {
    try {
        const parsed = new URL(targetUrl);
        return parsed.protocol === 'file:';
    } catch (_) {
        return false;
    }
}

function isExternalUrl(targetUrl) {
    return /^https?:\/\//i.test(String(targetUrl || '').trim());
}

function createUniqueDownloadPath(fileName) {
    const downloadsDir = app.getPath('downloads');
    const parsed = path.parse(fileName);
    let candidate = path.join(downloadsDir, fileName);
    let counter = 1;

    while (fs.existsSync(candidate)) {
        candidate = path.join(downloadsDir, `${parsed.name} (${counter})${parsed.ext}`);
        counter += 1;
    }

    return candidate;
}

function writeSmokeResult(payload) {
    if (!smokeResultFile) return;

    fs.mkdirSync(path.dirname(smokeResultFile), { recursive: true });
    fs.writeFileSync(
        smokeResultFile,
        JSON.stringify(
            {
                ...payload,
                timestamp: new Date().toISOString()
            },
            null,
            2
        ),
        'utf8'
    );
}

function closeSplashWindow() {
    if (!splashWindow || splashWindow.isDestroyed()) return;
    splashWindow.close();
    splashWindow = null;
}

function getVisibleMainWindow() {
    return mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
}

function focusPrimaryWindow() {
    const targetWindow = getVisibleMainWindow() || (!splashWindow || splashWindow.isDestroyed() ? null : splashWindow);
    if (!targetWindow) return;

    if (targetWindow.isMinimized()) {
        targetWindow.restore();
    }
    if (!targetWindow.isVisible()) {
        targetWindow.show();
    }

    targetWindow.focus();
}

function showMainWindow() {
    const targetWindow = getVisibleMainWindow();
    if (!targetWindow) return;

    if (targetWindow.isMinimized()) {
        targetWindow.restore();
    }
    targetWindow.show();
    targetWindow.focus();
    refreshTrayMenu();
}

function hideMainWindow() {
    const targetWindow = getVisibleMainWindow();
    if (!targetWindow) return;

    targetWindow.hide();
    refreshTrayMenu();
}

function destroyTray() {
    if (!tray) return;
    tray.destroy();
    tray = null;
}

function getNativeReleaseSummary() {
    const releaseTag = String(packageInfo.smartEduBuild?.releaseTag || '').trim();
    const releaseDate = String(packageInfo.smartEduBuild?.releaseDate || '').trim();
    return [releaseTag, releaseDate].filter(Boolean).join(' 路 ');
}

function buildDesktopRendererMeta() {
    return {
        isDesktopApp: true,
        shell: 'electron',
        platform: process.platform,
        appVersion: app.getVersion(),
        productName: String(packageInfo.productName || packageInfo.name || 'SmartEdu Desktop').trim(),
        releaseTag: String(packageInfo.smartEduBuild?.releaseTag || '').trim(),
        releaseDate: String(packageInfo.smartEduBuild?.releaseDate || '').trim()
    };
}

function getDialogTarget(targetWindow = getVisibleMainWindow()) {
    return targetWindow && !targetWindow.isDestroyed() ? targetWindow : null;
}

function showMessageBoxForWindow(targetWindow, options) {
    const dialogTarget = getDialogTarget(targetWindow);
    return dialogTarget
        ? dialog.showMessageBox(dialogTarget, options)
        : dialog.showMessageBox(options);
}

function formatDialogDate(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).format(parsed);
}

function buildUpdateDialogDetail(result) {
    const latestRelease = result?.latestRelease || null;
    const latestAsset = latestRelease?.assets?.desktop || null;
    const lines = [
        `当前版本: ${String(result?.currentVersion || app.getVersion() || '').trim() || '未标记'}`,
        result?.currentReleaseTag ? `当前发行标签: ${result.currentReleaseTag}` : '',
        latestRelease?.tag ? `线上最新发行: ${latestRelease.tag}` : '',
        latestRelease?.date ? `线上发布时间: ${formatDialogDate(latestRelease.date)}` : '',
        latestAsset?.name ? `下载文件: ${latestAsset.name}` : '',
        latestAsset?.url ? `下载链接: ${latestAsset.url}` : latestRelease?.url ? `Release 页面: ${latestRelease.url}` : ''
    ].filter(Boolean);

    const bullets = Array.isArray(latestRelease?.bullets) ? latestRelease.bullets.slice(0, 4) : [];
    if (bullets.length) {
        lines.push('', '本次更新重点:');
        bullets.forEach((bullet, index) => {
            lines.push(`${index + 1}. ${bullet}`);
        });
    }

    return lines.join('\n');
}

async function openExternalUrl(targetUrl) {
    const url = String(targetUrl || '').trim();
    if (!isExternalUrl(url)) return false;
    await shell.openExternal(url).catch(() => {});
    return true;
}

async function readDesktopUpdateStatus() {
    const releases = await fetchReleaseCatalog();
    return getDesktopUpdateState({
        currentVersion: app.getVersion(),
        currentReleaseTag: String(packageInfo.smartEduBuild?.releaseTag || '').trim(),
        currentReleaseDate: String(packageInfo.smartEduBuild?.releaseDate || '').trim(),
        releases
    });
}

async function presentDesktopUpdateStatus(result, {
    parentWindow = getVisibleMainWindow(),
    announceIfCurrent = false,
    source = 'manual'
} = {}) {
    if (!result) return result;

    if (result.updateAvailable && result.latestRelease) {
        if (source === 'auto' && lastPromptedUpdateTag === result.latestRelease.tag) {
            return result;
        }

        lastPromptedUpdateTag = result.latestRelease.tag;
        const response = await showMessageBoxForWindow(parentWindow, {
            type: 'info',
            buttons: ['下载新版', '打开当前 Release', '稍后'],
            defaultId: 0,
            cancelId: 2,
            noLink: true,
            title: '发现新版本',
            message: `${result.statusLabel}: ${result.latestRelease.tag}`,
            detail: buildUpdateDialogDetail(result)
        }).catch(() => null);

        if (response?.response === 0) {
            await openExternalUrl(result.latestRelease.assets?.desktop?.url || result.latestRelease.url || RELEASE_PAGE_URL);
        } else if (response?.response === 1) {
            await openExternalUrl(result.latestRelease.url || RELEASE_PAGE_URL);
        }
        return result;
    }

    if (!announceIfCurrent) {
        return result;
    }

    await showMessageBoxForWindow(parentWindow, {
        type: result.status === 'unavailable' ? 'warning' : 'info',
        buttons: ['知道了'],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
        title: '检查更新',
        message: result.statusLabel,
        detail: buildUpdateDialogDetail(result) || result.statusBody
    }).catch(() => {});

    return result;
}

async function runDesktopUpdateCheck({
    parentWindow = getVisibleMainWindow(),
    announceIfCurrent = false,
    prompt = true,
    source = 'manual'
} = {}) {
    try {
        const result = await readDesktopUpdateStatus();
        if (prompt) {
            await presentDesktopUpdateStatus(result, { parentWindow, announceIfCurrent, source });
        }
        return result;
    } catch (error) {
        if (prompt && (announceIfCurrent || source === 'manual' || source === 'tray')) {
            await showMessageBoxForWindow(parentWindow, {
                type: 'warning',
                buttons: ['知道了'],
                defaultId: 0,
                cancelId: 0,
                noLink: true,
                title: '检查更新失败',
                message: '暂时无法读取线上版本信息',
                detail: error instanceof Error ? error.message : String(error)
            }).catch(() => {});
        }
        throw error;
    }
}

function clearAutoUpdateCheckTimer() {
    if (!autoUpdateCheckTimer) return;
    clearTimeout(autoUpdateCheckTimer);
    autoUpdateCheckTimer = 0;
}

function scheduleAutoUpdateCheck() {
    if (isSmokeMode || autoUpdateCheckTimer) return;

    autoUpdateCheckTimer = setTimeout(() => {
        autoUpdateCheckTimer = 0;
        runDesktopUpdateCheck({
            parentWindow: getVisibleMainWindow(),
            announceIfCurrent: false,
            prompt: true,
            source: 'auto'
        }).catch((error) => {
            console.warn('[desktop] auto update check failed:', error);
        });
    }, AUTO_UPDATE_CHECK_DELAY_MS);
}

function registerDesktopShellIpc() {
    ipcMain.removeHandler('desktop-shell:check-updates');
    ipcMain.removeHandler('desktop-shell:open-external');

    ipcMain.handle('desktop-shell:check-updates', async (event, payload = {}) => {
        const parentWindow = BrowserWindow.fromWebContents(event.sender) || getVisibleMainWindow();
        return runDesktopUpdateCheck({
            parentWindow,
            announceIfCurrent: payload && payload.announceIfCurrent !== false,
            prompt: payload && payload.prompt !== false,
            source: String(payload?.source || 'renderer').trim() || 'renderer'
        });
    });

    ipcMain.handle('desktop-shell:open-external', async (_, payload = {}) => {
        const url = String(payload?.url || '').trim();
        if (!url || !isExternalUrl(url)) return false;
        await shell.openExternal(url).catch(() => {});
        return true;
    });
}

async function injectDesktopRuntimeFlags(targetWindow) {
    if (!targetWindow || targetWindow.isDestroyed()) return false;

    return targetWindow.webContents.executeJavaScript(
        `(() => {
            const meta = ${JSON.stringify(buildDesktopRendererMeta())};
            window.__SMARTEDU_DESKTOP_SHELL__ = meta;
            const apply = (target) => {
                if (!target || !target.dataset) return;
                target.dataset.desktopShell = 'electron';
                target.dataset.desktopAppVersion = String(meta.appVersion || '');
                target.dataset.desktopProductName = String(meta.productName || '');
                target.dataset.desktopReleaseTag = String(meta.releaseTag || '');
                target.dataset.desktopReleaseDate = String(meta.releaseDate || '');
            };
            apply(document.documentElement);
            apply(document.body);
            return true;
        })();`,
        true
    ).catch(() => false);
}

async function openVersionCenterFromNative(preferredPlatform = 'desktop') {
    const targetWindow = getVisibleMainWindow();
    if (!targetWindow) return false;

    showMainWindow();
    await injectDesktopRuntimeFlags(targetWindow);

    try {
        const opened = await targetWindow.webContents.executeJavaScript(
            `(() => {
                if (window.VersionCenter && typeof window.VersionCenter.openModal === 'function') {
                    window.VersionCenter.openModal(${JSON.stringify(preferredPlatform === 'desktop' ? 'desktop' : 'android')});
                    return true;
                }
                return false;
            })();`,
            true
        );
        if (opened) return true;
    } catch (error) {
        console.warn('[desktop] open version center failed:', error);
    }

    await showMessageBoxForWindow(targetWindow, {
        type: 'info',
        title: '关于与更新',
        message: `当前版本 ${app.getVersion()}`,
        detail: getNativeReleaseSummary() || '页面仍在初始化中，请稍后再试。'
    }).catch(() => {});
    return false;
}

function refreshTrayMenu() {
    if (!tray) return;

    const targetWindow = getVisibleMainWindow();
    const isWindowVisible = !!targetWindow && targetWindow.isVisible();
    const template = [
        {
            label: isWindowVisible ? '显示主窗口' : '打开主窗口',
            click: () => showMainWindow()
        },
        {
            label: '隐藏到托盘',
            enabled: !!targetWindow && isWindowVisible,
            click: () => hideMainWindow()
        },
        {
            label: '关于与更新',
            click: () => {
                openVersionCenterFromNative('desktop').catch(() => {});
            }
        },
        {
            label: '检查更新',
            click: () => {
                runDesktopUpdateCheck({
                    parentWindow: getVisibleMainWindow(),
                    announceIfCurrent: true,
                    prompt: true,
                    source: 'tray'
                }).catch(() => {});
            }
        },
        { type: 'separator' },
        {
            label: '重新启动',
            click: () => requestQuit({ relaunch: true })
        },
        {
            label: '退出应用',
            click: () => requestQuit()
        }
    ];

    tray.setToolTip(APP_TITLE);
    tray.setContextMenu(Menu.buildFromTemplate(template));
}

function createTray() {
    if (isSmokeMode || tray) return;

    tray = new Tray(getTrayIcon());
    tray.on('click', () => showMainWindow());
    tray.on('double-click', () => showMainWindow());
    refreshTrayMenu();
}

function bindNavigationGuards(win) {
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (isExternalUrl(url)) {
            shell.openExternal(url).catch(() => {});
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    win.webContents.on('will-navigate', (event, targetUrl) => {
        if (isBundledUrl(targetUrl)) return;
        if (isExternalUrl(targetUrl)) {
            event.preventDefault();
            shell.openExternal(targetUrl).catch(() => {});
        }
    });
}

async function runSmokeCheck(win) {
    const smokePayload = await win.webContents.executeJavaScript(
        `
        (() => new Promise((resolve) => {
            const start = Date.now();
            const timeoutMs = 12000;

            const collect = () => {
                const overlay = document.getElementById('login-overlay');
                const title = document.getElementById('login-stage-title');
                const navTexts = Array.from(document.querySelectorAll('.login-stage-nav-links a')).map((el) => String(el.textContent || '').trim());
                const probe = document.createElement('i');
                probe.className = 'ti ti-home';
                probe.style.position = 'fixed';
                probe.style.opacity = '0';
                probe.style.pointerEvents = 'none';
                document.body.appendChild(probe);

                const probeStyle = getComputedStyle(probe);
                const pseudoStyle = getComputedStyle(probe, '::before');
                const fontFamily = String(probeStyle.fontFamily || '');
                const glyphContent = String(pseudoStyle.content || '');
                probe.remove();

                return {
                    hasOverlay: !!overlay,
                    stageTitle: String(title?.textContent || '').trim(),
                    navTexts,
                    homepageHasIntroCopy: !!document.getElementById('login-auth-facts'),
                    loginCopyVisible: (() => {
                        const el = document.getElementById('login-portal-copy');
                        if (!el) return false;
                        const style = getComputedStyle(el);
                        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && !!String(el.textContent || '').trim();
                    })(),
                    iconFontReady: fontFamily.toLowerCase().includes('tabler-icons'),
                    iconGlyphReady: !!glyphContent && glyphContent !== 'none' && glyphContent !== 'normal' && glyphContent !== '""',
                    lazyAssetLoadersReady: {
                        alasql: typeof window.ensureAlasqlVendorLoaded === 'function',
                        pdf: typeof window.ensurePdfExportVendorsLoaded === 'function'
                    }
                };
            };

            const isReady = (payload) => payload.hasOverlay
                && !!payload.stageTitle
                && payload.iconFontReady
                && payload.iconGlyphReady;

            const tick = () => {
                const payload = collect();
                if (isReady(payload) || Date.now() - start >= timeoutMs) {
                    resolve(payload);
                    return;
                }
                setTimeout(tick, 150);
            };

            tick();
        }))();
        `,
        true
    );

    if (!smokePayload.hasOverlay || !smokePayload.stageTitle) {
        throw new Error('Desktop shell loaded, but login landing was not ready.');
    }

    if (!smokePayload.iconFontReady || !smokePayload.iconGlyphReady) {
        throw new Error('Desktop shell loaded, but icon font assets were not ready.');
    }

    const nativeVersionCenterOpened = await openVersionCenterFromNative('desktop');
    const versionCenterPayload = await win.webContents.executeJavaScript(
        `
        (() => new Promise((resolve) => {
            const start = Date.now();
            const timeoutMs = 10000;

            const collect = () => {
                const backdrop = document.getElementById('version-center-backdrop');
                const title = document.getElementById('version-center-title');
                const copy = document.getElementById('version-center-copy');
                return {
                    desktopBridgeReady: (!!window.DesktopShell && window.DesktopShell.isDesktopApp === true)
                        || (!!window.__SMARTEDU_DESKTOP_SHELL__ && window.__SMARTEDU_DESKTOP_SHELL__.isDesktopApp === true)
                        || document.documentElement?.dataset?.desktopShell === 'electron'
                        || document.body?.dataset?.desktopShell === 'electron',
                    versionCenterReady: !!window.VersionCenter && typeof window.VersionCenter.openModal === 'function',
                    modalVisible: !!backdrop && getComputedStyle(backdrop).display !== 'none' && backdrop.getAttribute('aria-hidden') !== 'true',
                    titleText: String(title?.textContent || '').trim(),
                    copyText: String(copy?.textContent || '').trim(),
                    historyCount: document.querySelectorAll('[data-version-center-history] [data-app-release-item="true"]').length,
                    latestActionCount: document.querySelectorAll('[data-version-center-latest] .version-center-inline-actions .btn').length
                };
            };

            const isReady = (payload) => payload.desktopBridgeReady
                && payload.versionCenterReady
                && payload.modalVisible
                && payload.historyCount >= 2
                && payload.latestActionCount >= 2;

            const tick = () => {
                const payload = collect();
                if (isReady(payload) || Date.now() - start >= timeoutMs) {
                    resolve(payload);
                    return;
                }
                setTimeout(tick, 150);
            };

            tick();
        }))();
        `,
        true
    );

    if (!nativeVersionCenterOpened) {
        throw new Error('Desktop native version center entry did not open successfully.');
    }

    if (!versionCenterPayload.desktopBridgeReady || !versionCenterPayload.versionCenterReady) {
        throw new Error(`Desktop version center runtime bridge was not ready: ${JSON.stringify(versionCenterPayload)}`);
    }

    if (!versionCenterPayload.modalVisible || versionCenterPayload.historyCount < 2) {
        throw new Error(`Desktop version center modal did not render release history: ${JSON.stringify(versionCenterPayload)}`);
    }

    writeSmokeResult({
        ok: true,
        ...smokePayload,
        nativeVersionCenterOpened,
        versionCenter: versionCenterPayload
    });
}

function createSplashWindow(icon) {
    if (isSmokeMode) return null;

    const nextSplash = new BrowserWindow({
        width: 520,
        height: 340,
        frame: false,
        resizable: false,
        movable: true,
        minimizable: false,
        maximizable: false,
        show: true,
        center: true,
        backgroundColor: '#173c86',
        icon,
        transparent: false,
        skipTaskbar: false,
        title: APP_TITLE,
        webPreferences: {
            contextIsolation: true,
            sandbox: true
        }
    });

    nextSplash.loadFile(path.join(__dirname, 'splash.html')).catch(() => {});
    return nextSplash;
}

function requestQuit({ relaunch = false } = {}) {
    if (isQuitRequested) return;

    isQuitRequested = true;
    closeSplashWindow();
    destroyTray();

    if (relaunch) {
        app.relaunch();
    }

    app.quit();
}

function createMainWindow(icon) {
    const nextWindow = new BrowserWindow({
        width: 1460,
        height: 980,
        minWidth: 1180,
        minHeight: 760,
        show: false,
        backgroundColor: '#edf3ff',
        icon,
        autoHideMenuBar: true,
        title: APP_TITLE,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            spellcheck: false,
            webSecurity: true
        }
    });

    Menu.setApplicationMenu(null);
    bindNavigationGuards(nextWindow);

    nextWindow.on('show', () => refreshTrayMenu());
    nextWindow.on('hide', () => refreshTrayMenu());
    nextWindow.on('minimize', () => refreshTrayMenu());
    nextWindow.on('restore', () => refreshTrayMenu());

    nextWindow.on('close', (event) => {
        if (isQuitRequested) return;
        event.preventDefault();
        requestQuit();
    });

    nextWindow.on('closed', () => {
        if (mainWindow === nextWindow) {
            mainWindow = null;
        }
        refreshTrayMenu();
    });

    nextWindow.on('unresponsive', () => {
        showMessageBoxForWindow(nextWindow, {
            type: 'warning',
            title: '桌面端暂时没有响应',
            message: '桌面端正在尝试恢复界面。',
            detail: '如果长时间没有恢复，可以关闭后重新打开。'
        }).catch(() => {});
    });

    nextWindow.webContents.on('will-prevent-unload', (event) => {
        if (!isQuitRequested) return;
        event.preventDefault();
    });

    nextWindow.webContents.on('render-process-gone', async (_, details) => {
        if (isSmokeMode) return;

        const shouldReload = details?.reason !== 'clean-exit';
        if (shouldReload && !nextWindow.isDestroyed()) {
            await nextWindow.loadFile(getEntryFile()).catch(() => {});
        }
    });

    nextWindow.webContents.on('did-finish-load', () => {
        injectDesktopRuntimeFlags(nextWindow).catch(() => {});
        scheduleAutoUpdateCheck();
    });

    nextWindow.once('ready-to-show', () => {
        if (isSmokeMode) return;

        closeSplashWindow();
        nextWindow.show();
        nextWindow.focus();
        refreshTrayMenu();
    });

    return nextWindow;
}

async function launchDesktopApp() {
    const icon = getAppIcon();
    splashWindow = createSplashWindow(icon);
    mainWindow = createMainWindow(icon);
    createTray();

    const entryFile = getEntryFile();
    await mainWindow.loadFile(entryFile);

    if (isSmokeMode) {
        await runSmokeCheck(mainWindow);
        setTimeout(() => app.exit(0), 400);
    }
}

if (hasSingleInstanceLock) {
    app.whenReady()
        .then(async () => {
            session.defaultSession.on('will-download', (_, item) => {
                item.setSavePath(createUniqueDownloadPath(item.getFilename()));
            });
            registerDesktopShellIpc();

            try {
                await launchDesktopApp();
            } catch (error) {
                writeSmokeResult({
                    ok: false,
                    message: error instanceof Error ? error.message : String(error)
                });
                dialog.showErrorBox('桌面端启动失败', error instanceof Error ? error.message : String(error));
                app.exit(1);
            }
        })
        .catch((error) => {
            writeSmokeResult({
                ok: false,
                message: error instanceof Error ? error.message : String(error)
            });
            app.exit(1);
        });

    app.on('before-quit', () => {
        isQuitRequested = true;
        clearAutoUpdateCheckTimer();
        destroyTray();
        closeSplashWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('second-instance', () => {
        focusPrimaryWindow();
    });

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            isQuitRequested = false;

            try {
                await launchDesktopApp();
            } catch (error) {
                dialog.showErrorBox('桌面端启动失败', error instanceof Error ? error.message : String(error));
                app.exit(1);
            }
        } else {
            focusPrimaryWindow();
        }
    });
}





