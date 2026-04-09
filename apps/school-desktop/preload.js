const { contextBridge, ipcRenderer } = require('electron');
const packageInfo = require('./package.json');

contextBridge.exposeInMainWorld('DesktopShell', Object.freeze({
    isDesktopApp: true,
    shell: 'electron',
    platform: process.platform,
    electronVersion: process.versions.electron,
    appVersion: String(packageInfo.version || '').trim(),
    productName: String(packageInfo.productName || packageInfo.name || 'SmartEdu Desktop').trim(),
    releaseTag: String(packageInfo.smartEduBuild?.releaseTag || '').trim(),
    releaseDate: String(packageInfo.smartEduBuild?.releaseDate || '').trim(),
    checkForUpdates: (options = {}) => ipcRenderer.invoke('desktop-shell:check-updates', {
        announceIfCurrent: options && options.announceIfCurrent !== false,
        prompt: options && options.prompt !== false,
        source: String(options?.source || 'renderer').trim() || 'renderer'
    }),
    openExternal: (url) => ipcRenderer.invoke('desktop-shell:open-external', {
        url: String(url || '').trim()
    })
}));

window.addEventListener('DOMContentLoaded', () => {
    const setDesktopFlags = () => {
        const targets = [document.documentElement, document.body].filter(Boolean);
        targets.forEach((target) => {
            target.dataset.desktopShell = 'electron';
            target.dataset.desktopAppVersion = String(packageInfo.version || '').trim();
            target.dataset.desktopProductName = String(packageInfo.productName || packageInfo.name || 'SmartEdu Desktop').trim();
            target.dataset.desktopReleaseTag = String(packageInfo.smartEduBuild?.releaseTag || '').trim();
            target.dataset.desktopReleaseDate = String(packageInfo.smartEduBuild?.releaseDate || '').trim();
        });
    };

    setDesktopFlags();
    window.requestAnimationFrame(setDesktopFlags);
});
