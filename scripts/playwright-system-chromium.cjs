const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

if (executablePath) {
  const playwright = require('playwright');
  const originalLaunch = playwright.chromium.launch.bind(playwright.chromium);

  playwright.chromium.launch = (options = {}) => {
    const launchOptions = { ...options };
    if (!launchOptions.executablePath && !launchOptions.channel) {
      launchOptions.executablePath = executablePath;
      launchOptions.args = Array.from(new Set([...(launchOptions.args || []), '--no-sandbox']));
    }
    return originalLaunch(launchOptions);
  };
}
