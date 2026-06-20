const { contextBridge } = require('electron');

function readLaunchArgument(name) {
    const prefix = `--${name}=`;
    const argument = process.argv.find((value) => String(value).startsWith(prefix));
    return argument ? String(argument).slice(prefix.length) : '';
}

const metadata = Object.freeze({
    isDesktopApp: true,
    version: readLaunchArgument('school-system-version'),
    productName: readLaunchArgument('school-system-product') || '校衡台',
    platform: process.platform,
    architecture: process.arch,
    electronVersion: process.versions.electron
});

contextBridge.exposeInMainWorld('DesktopShell', metadata);
