const path = require('node:path');
const { app, BrowserWindow, shell } = require('electron');

const PRODUCTION_URL = 'https://schoolsystem.com.cn';
const PRODUCTION_ORIGIN = new URL(PRODUCTION_URL).origin;
const RELEASE_HOST = 'github.com';
const RELEASE_PATH_PREFIX = '/hka123321/school-system/releases';
const OFFLINE_PAGE = path.join(__dirname, 'offline.html');
const LOCAL_APP_ENTRY = path.join(process.resourcesPath || path.join(__dirname, '..'), 'app', 'index.html');

let mainWindow = null;
let initialLoadComplete = false;
let offlineFallbackActive = false;

function isProductionUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        return url.protocol === 'https:'
            && url.username === ''
            && url.password === ''
            && url.origin === PRODUCTION_ORIGIN;
    } catch (_) {
        return false;
    }
}

function isReleaseUrl(rawUrl) {
    try {
        const url = new URL(rawUrl);
        return url.protocol === 'https:'
            && url.username === ''
            && url.password === ''
            && url.hostname === RELEASE_HOST
            && (url.pathname === RELEASE_PATH_PREFIX || url.pathname.startsWith(`${RELEASE_PATH_PREFIX}/`));
    } catch (_) {
        return false;
    }
}

function openApprovedExternal(rawUrl) {
    if (!isReleaseUrl(rawUrl)) return false;
    shell.openExternal(rawUrl).catch((error) => {
        console.error('[desktop] failed to open release link:', error);
    });
    return true;
}

async function showOfflineFallback() {
    if (!mainWindow || mainWindow.isDestroyed() || offlineFallbackActive) return;
    offlineFallbackActive = true;
    try {
        await mainWindow.loadFile(OFFLINE_PAGE);
    } catch (error) {
        console.error('[desktop] failed to load offline page:', error);
    }
}

function createMainWindow() {
    if (mainWindow && !mainWindow.isDestroyed()) return mainWindow;

    initialLoadComplete = false;
    offlineFallbackActive = false;
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 920,
        minWidth: 1024,
        minHeight: 680,
        show: false,
        backgroundColor: '#f7f8fb',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
            additionalArguments: [
                `--school-system-version=${app.getVersion()}`,
                '--school-system-product=校衡台'
            ]
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        openApprovedExternal(url);
        return { action: 'deny' };
    });

    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (isProductionUrl(url)) return;
        event.preventDefault();
        openApprovedExternal(url);
    });

    mainWindow.webContents.on('did-finish-load', () => {
        initialLoadComplete = true;
        if (!mainWindow?.isDestroyed()) mainWindow.show();
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
        if (!isMainFrame || offlineFallbackActive || initialLoadComplete || errorCode === -3) return;
        console.warn('[desktop] initial load failed:', { errorCode, errorDescription, validatedUrl });
        showOfflineFallback();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.loadURL(PRODUCTION_URL).catch(() => showOfflineFallback());
    return mainWindow;
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        const window = createMainWindow();
        if (window.isMinimized()) window.restore();
        window.show();
        window.focus();
    });

    app.whenReady().then(() => {
        createMainWindow();
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
        });
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
