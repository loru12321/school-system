const fs = require('node:fs');
const path = require('node:path');
const {
    app,
    BrowserWindow,
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

const isSmokeMode = process.argv.includes('--smoke-test');
const smokeResultFile = String(process.env.SMARTEDU_SMOKE_FILE || '').trim();
const hasSingleInstanceLock = app.requestSingleInstanceLock();

let mainWindow = null;
let splashWindow = null;
let tray = null;
let isQuitRequested = false;

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

    writeSmokeResult({
        ok: true,
        ...smokePayload
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
        dialog.showMessageBox(nextWindow, {
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
