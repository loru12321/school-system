const { contextBridge, ipcRenderer } = require('electron');

function readLaunchArgument(name) {
    const prefix = `--${name}=`;
    const argument = process.argv.find((value) => String(value).startsWith(prefix));
    return argument ? String(argument).slice(prefix.length) : '';
}

const allowedInvocations = Object.freeze({
    getSettings: 'desktop:getSettings',
    updateSettings: 'desktop:updateSettings',
    getLoginProfile: 'desktop:getLoginProfile',
    saveLoginProfile: 'desktop:saveLoginProfile',
    clearLoginProfile: 'desktop:clearLoginProfile',
    showWindow: 'desktop:showWindow',
    warmCloud: 'desktop:warmCloud',
    quit: 'desktop:quit'
});

const metadata = Object.freeze({
    isDesktopApp: true,
    version: readLaunchArgument('school-system-version'),
    productName: readLaunchArgument('school-system-product') || '校衡台',
    platform: process.platform,
    architecture: process.arch,
    electronVersion: process.versions.electron,
    performanceProfile: 'desktop',
    getSettings: () => ipcRenderer.invoke(allowedInvocations.getSettings),
    updateSettings: (patch) => ipcRenderer.invoke(allowedInvocations.updateSettings, patch && typeof patch === 'object' ? patch : {}),
    getLoginProfile: () => ipcRenderer.invoke(allowedInvocations.getLoginProfile),
    saveLoginProfile: (profile) => ipcRenderer.invoke(allowedInvocations.saveLoginProfile, profile && typeof profile === 'object' ? profile : {}),
    clearLoginProfile: () => ipcRenderer.invoke(allowedInvocations.clearLoginProfile),
    showWindow: () => ipcRenderer.invoke(allowedInvocations.showWindow),
    warmCloud: () => ipcRenderer.invoke(allowedInvocations.warmCloud),
    quit: () => ipcRenderer.invoke(allowedInvocations.quit)
});

contextBridge.exposeInMainWorld('DesktopShell', metadata);
