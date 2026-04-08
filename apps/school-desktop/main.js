const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow, Menu, dialog, nativeImage, session, shell } = require('electron');

const isSmokeMode = process.argv.includes('--smoke-test');
const smokeResultFile = String(process.env.SMARTEDU_SMOKE_FILE || '').trim();
const hasSingleInstanceLock = app.requestSingleInstanceLock();

let mainWindow = null;
let splashWindow = null;

if (hasSingleInstanceLock) {
    app.disableHardwareAcceleration();
    app.commandLine.appendSwitch('disable-renderer-backgrounding');

    if (process.platform === 'win32') {
        app.setAppUserModelId('com.smartedu.desktop');
    }
} else {
    app.quit();
}

function getAppIcon() {
    return nativeImage.createFromPath(path.join(__dirname, 'bundle', 'app-icon.ico'));
}

function getEntryFile() {
    const entryFile = path.join(__dirname, 'bundle', 'lt.html');
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
        JSON.stringify({
            ...payload,
            timestamp: new Date().toISOString()
        }, null, 2),
        'utf8'
    );
}

function closeSplashWindow() {
    if (!splashWindow || splashWindow.isDestroyed()) return;
    splashWindow.close();
    splashWindow = null;
}

function focusPrimaryWindow() {
    const targetWindow = [mainWindow, splashWindow].find((win) => win && !win.isDestroyed());
    if (!targetWindow) return;
    if (targetWindow.isMinimized()) {
        targetWindow.restore();
    }
    if (!targetWindow.isVisible()) {
        targetWindow.show();
    }
    targetWindow.focus();
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
        webPreferences: {
            contextIsolation: true,
            sandbox: true
        }
    });
    nextSplash.loadFile(path.join(__dirname, 'splash.html')).catch(() => { });
    return nextSplash;
}

function bindNavigationGuards(win) {
    win.webContents.setWindowOpenHandler(({ url }) => {
        if (isExternalUrl(url)) {
            shell.openExternal(url).catch(() => { });
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    win.webContents.on('will-navigate', (event, targetUrl) => {
        if (isBundledUrl(targetUrl)) return;
        if (isExternalUrl(targetUrl)) {
            event.preventDefault();
            shell.openExternal(targetUrl).catch(() => { });
        }
    });
}

async function runSmokeCheck(win) {
    const smokePayload = await win.webContents.executeJavaScript(`
        (() => {
            const overlay = document.getElementById('login-overlay');
            const title = document.getElementById('login-stage-title');
            const navTexts = Array.from(document.querySelectorAll('.login-stage-nav-links a')).map((el) => String(el.textContent || '').trim());
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
                })()
            };
        })();
    `, true);

    if (!smokePayload.hasOverlay || !smokePayload.stageTitle) {
        throw new Error('Desktop shell loaded, but login landing was not ready.');
    }

    writeSmokeResult({
        ok: true,
        ...smokePayload
    });
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
        title: '智慧教务管理系统',
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

    nextWindow.on('closed', () => {
        if (mainWindow === nextWindow) {
            mainWindow = null;
        }
    });

    nextWindow.on('unresponsive', () => {
        dialog.showMessageBox(nextWindow, {
            type: 'warning',
            title: '界面暂时没有响应',
            message: '桌面端正在尝试恢复界面。',
            detail: '如果长时间没有恢复，可以关闭后重新打开。'
        }).catch(() => { });
    });

    nextWindow.webContents.on('render-process-gone', async (_, details) => {
        if (isSmokeMode) return;
        const shouldReload = details?.reason !== 'clean-exit';
        if (shouldReload && !nextWindow.isDestroyed()) {
            await nextWindow.loadFile(getEntryFile()).catch(() => { });
        }
    });

    nextWindow.once('ready-to-show', async () => {
        if (isSmokeMode) return;
        closeSplashWindow();
        nextWindow.show();
        nextWindow.focus();
    });

    return nextWindow;
}

async function launchDesktopApp() {
    const icon = getAppIcon();
    splashWindow = createSplashWindow(icon);
    mainWindow = createMainWindow(icon);

    const entryFile = getEntryFile();
    await mainWindow.loadFile(entryFile);

    if (isSmokeMode) {
        await runSmokeCheck(mainWindow);
        setTimeout(() => app.exit(0), 400);
    }
}

if (hasSingleInstanceLock) {
    app.whenReady().then(async () => {
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
    }).catch((error) => {
        writeSmokeResult({
            ok: false,
            message: error instanceof Error ? error.message : String(error)
        });
        app.exit(1);
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('second-instance', () => {
        focusPrimaryWindow();
    });

    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
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
