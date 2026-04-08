const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('DesktopShell', Object.freeze({
    isDesktopApp: true,
    shell: 'electron',
    platform: process.platform,
    electronVersion: process.versions.electron
}));

window.addEventListener('DOMContentLoaded', () => {
    const setDesktopFlags = () => {
        if (document.documentElement) {
            document.documentElement.dataset.desktopShell = 'electron';
        }
        if (document.body) {
            document.body.dataset.desktopShell = 'electron';
        }
    };

    setDesktopFlags();
    window.requestAnimationFrame(setDesktopFlags);
});
