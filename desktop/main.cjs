const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, session, shell } = require('electron');

const PRODUCTION_URL = 'https://schoolsystem.com.cn';
const PRODUCTION_ORIGIN = new URL(PRODUCTION_URL).origin;
const RELEASE_HOST = 'github.com';
const RELEASE_PATH_PREFIX = '/hka123321/school-system/releases';
const OFFLINE_PAGE = path.join(__dirname, 'offline.html');
const LOCAL_APP_ENTRY = path.join(process.resourcesPath || path.join(__dirname, '..'), 'app', 'index.html');
const TRAY_ICON = path.join(__dirname, 'assets', 'icon.ico');
const SETTINGS_FILE = 'desktop-settings.json';

const DEFAULT_SETTINGS = Object.freeze({
    trayEnabled: true,
    closeBehavior: 'quit',
    launchAtLogin: false,
    fontScale: 100,
    skin: 'default',
    desktopWarmup: true
});

const SKIN_PRESETS = Object.freeze({
    default: { label: '默认蓝', primaryColor: '#4f46e5' },
    sky: { label: '清爽蓝', primaryColor: '#2563eb' },
    green: { label: '护眼绿', primaryColor: '#059669' },
    purple: { label: '稳重紫', primaryColor: '#7c3aed' },
    slate: { label: '深色灰', primaryColor: '#334155', darkMode: true }
});

let mainWindow = null;
let tray = null;
let isQuitting = false;
let initialLoadComplete = false;
let offlineFallbackActive = false;
let desktopSettings = { ...DEFAULT_SETTINGS };

function getSettingsPath() {
    return path.join(app.getPath('userData'), SETTINGS_FILE);
}

function normalizeDesktopSettings(settings) {
    const next = { ...DEFAULT_SETTINGS, ...(settings && typeof settings === 'object' ? settings : {}) };
    next.trayEnabled = next.trayEnabled !== false;
    next.closeBehavior = next.closeBehavior === 'tray' ? 'tray' : 'quit';
    next.launchAtLogin = next.launchAtLogin === true;
    next.fontScale = Math.max(90, Math.min(125, Number(next.fontScale) || DEFAULT_SETTINGS.fontScale));
    next.skin = Object.prototype.hasOwnProperty.call(SKIN_PRESETS, next.skin) ? next.skin : DEFAULT_SETTINGS.skin;
    next.desktopWarmup = next.desktopWarmup !== false;
    return next;
}

function loadDesktopSettings() {
    try {
        const raw = fs.readFileSync(getSettingsPath(), 'utf8');
        desktopSettings = normalizeDesktopSettings(JSON.parse(raw));
    } catch (_) {
        desktopSettings = { ...DEFAULT_SETTINGS };
    }
    return desktopSettings;
}

function saveDesktopSettings() {
    desktopSettings = normalizeDesktopSettings(desktopSettings);
    try {
        fs.mkdirSync(app.getPath('userData'), { recursive: true });
        fs.writeFileSync(getSettingsPath(), JSON.stringify(desktopSettings, null, 2));
    } catch (error) {
        console.error('[desktop] failed to save settings:', error);
    }
}

function getLaunchAtLoginEnabled() {
    try {
        return app.getLoginItemSettings().openAtLogin === true;
    } catch (_) {
        return desktopSettings.launchAtLogin === true;
    }
}

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

function getDesktopSettingsSnapshot() {
    return {
        ...normalizeDesktopSettings(desktopSettings),
        launchAtLogin: getLaunchAtLoginEnabled(),
        skinLabel: SKIN_PRESETS[desktopSettings.skin]?.label || SKIN_PRESETS.default.label
    };
}

function buildDesktopPreferenceScript() {
    const settings = getDesktopSettingsSnapshot();
    const preset = SKIN_PRESETS[settings.skin] || SKIN_PRESETS.default;
    return `
(function applyDesktopClientPreferences(settings, preset) {
    try {
        window.__SCHOOL_DESKTOP_SETTINGS__ = settings;
        localStorage.setItem('SYSTEM_LOAD_PROFILE', settings.desktopWarmup ? 'full' : 'balanced');
        if (settings.desktopWarmup) {
            localStorage.setItem('SCHOOL_RUNTIME_HOTSPOT_HYDRATE', 'true');
            localStorage.setItem('SYSTEM_APP_PRELOAD_LIMIT', '36');
            localStorage.setItem('SYSTEM_APP_LATE_PREFETCH_LIMIT', '48');
            localStorage.setItem('SYSTEM_APP_PREFETCH_CHUNK_SIZE', '8');
        }
        localStorage.setItem('SCHOOL_DESKTOP_FONT_SCALE', String(settings.fontScale));
        if (preset && preset.primaryColor) {
            const skin = {
                primaryColor: preset.primaryColor,
                logoBase64: '',
                customTitle: ''
            };
            localStorage.setItem('app_skin_config', JSON.stringify(skin));
            if (typeof window.setThemeColor === 'function') window.setThemeColor(preset.primaryColor);
            if (preset.darkMode) localStorage.setItem('theme-dark', 'true');
            else if (settings.skin !== 'slate') localStorage.removeItem('theme-dark');
        }
        const styleId = 'desktop-client-preferences';
        let style = document.getElementById(styleId);
        if (!style) {
            style = document.createElement('style');
            style.id = styleId;
            document.head.appendChild(style);
        }
        const scale = Math.max(0.9, Math.min(1.25, Number(settings.fontScale || 100) / 100));
        style.textContent = [
            ':root{--desktop-font-scale:' + scale + ';}',
            'body{font-size:calc(14px * var(--desktop-font-scale));}',
            '.analysis-table-dense,.data-table,.module-table,table{font-size:calc(12px * var(--desktop-font-scale));}',
            'button,input,select,textarea{font-size:calc(14px * var(--desktop-font-scale));}'
        ].join('\\n');
        window.dispatchEvent(new CustomEvent('school:desktop-settings-applied', { detail: settings }));
    } catch (error) {
        console.warn('[desktop] apply preferences failed:', error);
    }
})(${JSON.stringify(settings)}, ${JSON.stringify(preset)});
`;
}

function applyDesktopPreferences() {
    if (!mainWindow || mainWindow.isDestroyed() || offlineFallbackActive) return;
    mainWindow.webContents.executeJavaScript(buildDesktopPreferenceScript(), true).catch((error) => {
        console.warn('[desktop] failed to apply desktop preferences:', error);
    });
}

function warmDesktopCloudConnections() {
    if (!desktopSettings.desktopWarmup) return;
    try {
        if (session.defaultSession && typeof session.defaultSession.preconnect === 'function') {
            session.defaultSession.preconnect({ url: PRODUCTION_ORIGIN, numSockets: 6 });
            session.defaultSession.preconnect({ url: `${PRODUCTION_ORIGIN}/api/edu-gateway`, numSockets: 2 });
        }
    } catch (error) {
        console.warn('[desktop] preconnect failed:', error);
    }
    try {
        const req = https.request(`${PRODUCTION_ORIGIN}/api/health`, { method: 'GET', timeout: 3500 }, (res) => {
            res.resume();
        });
        req.on('error', () => {});
        req.on('timeout', () => req.destroy());
        req.end();
    } catch (_) {}
}

function showMainWindow() {
    const window = createMainWindow();
    if (window.isMinimized()) window.restore();
    window.show();
    window.focus();
}

function quitApp() {
    isQuitting = true;
    if (tray) {
        tray.destroy();
        tray = null;
    }
    app.quit();
}

function setLaunchAtLogin(enabled) {
    const openAtLogin = enabled === true;
    desktopSettings.launchAtLogin = openAtLogin;
    try {
        app.setLoginItemSettings({
            openAtLogin,
            openAsHidden: false,
            path: process.execPath
        });
    } catch (error) {
        console.error('[desktop] failed to update launch-at-login:', error);
    }
    saveDesktopSettings();
}

function updateDesktopSettings(patch) {
    const nextPatch = patch && typeof patch === 'object' ? patch : {};
    desktopSettings = normalizeDesktopSettings({ ...desktopSettings, ...nextPatch });
    if (Object.prototype.hasOwnProperty.call(nextPatch, 'launchAtLogin')) {
        setLaunchAtLogin(desktopSettings.launchAtLogin);
    } else {
        saveDesktopSettings();
    }
    rebuildTrayMenu();
    applyDesktopPreferences();
    return getDesktopSettingsSnapshot();
}

function rebuildTrayMenu() {
    if (!tray) return;
    const settings = getDesktopSettingsSnapshot();
    const launchLabel = settings.launchAtLogin ? '开机自启：已开启' : '开机自启：未开启';
    const contextMenu = Menu.buildFromTemplate([
        { label: '打开校衡台', click: showMainWindow },
        { label: '同步/预热云端数据', click: () => { warmDesktopCloudConnections(); if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload(); } },
        { type: 'separator' },
        {
            label: launchLabel,
            type: 'checkbox',
            checked: settings.launchAtLogin,
            click: (item) => updateDesktopSettings({ launchAtLogin: item.checked })
        },
        {
            label: '关闭按钮最小化到托盘',
            type: 'checkbox',
            checked: settings.closeBehavior === 'tray',
            click: (item) => updateDesktopSettings({ closeBehavior: item.checked ? 'tray' : 'quit' })
        },
        {
            label: '字体大小',
            submenu: [90, 100, 110, 120, 125].map((fontScale) => ({
                label: `${fontScale}%`,
                type: 'radio',
                checked: Math.round(settings.fontScale) === fontScale,
                click: () => updateDesktopSettings({ fontScale })
            }))
        },
        {
            label: '背景皮肤',
            submenu: Object.keys(SKIN_PRESETS).map((skin) => ({
                label: SKIN_PRESETS[skin].label,
                type: 'radio',
                checked: settings.skin === skin,
                click: () => updateDesktopSettings({ skin })
            }))
        },
        {
            label: '桌面端数据预热',
            type: 'checkbox',
            checked: settings.desktopWarmup,
            click: (item) => updateDesktopSettings({ desktopWarmup: item.checked })
        },
        { type: 'separator' },
        { label: '刷新页面', click: () => mainWindow && !mainWindow.isDestroyed() && mainWindow.reload() },
        {
            label: '清理缓存并重载',
            click: async () => {
                try {
                    await session.defaultSession.clearCache();
                } catch (error) {
                    console.error('[desktop] clear cache failed:', error);
                }
                if (mainWindow && !mainWindow.isDestroyed()) mainWindow.reload();
            }
        },
        { type: 'separator' },
        { label: '退出校衡台', click: quitApp }
    ]);
    tray.setToolTip(`校衡台 - ${launchLabel}`);
    tray.setContextMenu(contextMenu);
}

function ensureTray() {
    if (!desktopSettings.trayEnabled || tray) return;
    const image = nativeImage.createFromPath(TRAY_ICON);
    tray = new Tray(image.isEmpty() ? nativeImage.createEmpty() : image);
    tray.on('click', showMainWindow);
    tray.on('double-click', showMainWindow);
    rebuildTrayMenu();
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
            backgroundThrottling: false,
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
        applyDesktopPreferences();
        warmDesktopCloudConnections();
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
    });

    mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
        if (!isMainFrame || offlineFallbackActive || initialLoadComplete || errorCode === -3) return;
        console.warn('[desktop] initial load failed:', { errorCode, errorDescription, validatedUrl });
        showOfflineFallback();
    });

    mainWindow.on('close', (event) => {
        if (isQuitting || desktopSettings.closeBehavior !== 'tray') return;
        event.preventDefault();
        mainWindow.hide();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.loadURL(PRODUCTION_URL).catch(() => showOfflineFallback());
    return mainWindow;
}

const DESKTOP_IPC_HANDLERS = Object.freeze({
    'desktop:getSettings': () => getDesktopSettingsSnapshot(),
    'desktop:updateSettings': (_event, patch) => updateDesktopSettings(patch),
    'desktop:showWindow': () => { showMainWindow(); return true; },
    'desktop:warmCloud': () => { warmDesktopCloudConnections(); return true; },
    'desktop:quit': () => { quitApp(); return true; }
});

Object.keys(DESKTOP_IPC_HANDLERS).forEach((channel) => {
    ipcMain.handle(channel, DESKTOP_IPC_HANDLERS[channel]);
});

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        showMainWindow();
    });

    app.whenReady().then(() => {
        loadDesktopSettings();
        desktopSettings.launchAtLogin = getLaunchAtLoginEnabled();
        ensureTray();
        warmDesktopCloudConnections();
        createMainWindow();
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
        });
    });

    app.on('before-quit', () => {
        isQuitting = true;
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
