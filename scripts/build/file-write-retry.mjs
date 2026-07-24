import fs from 'fs';

const transientWriteErrors = new Set(['EBUSY', 'EPERM', 'UNKNOWN']);
const retryDelaysMs = [50, 150, 300];

function waitForRetry(delayMs) {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export async function writeFileWithRetry(targetPath, contents, options) {
  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
    try {
      fs.writeFileSync(targetPath, contents, options);
      return;
    } catch (error) {
      if (!transientWriteErrors.has(error?.code) || attempt === retryDelaysMs.length) throw error;
      await waitForRetry(retryDelaysMs[attempt]);
    }
  }
}
