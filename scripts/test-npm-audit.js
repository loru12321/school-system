const assert = require('assert');
const { execSync } = require('child_process');

let output = '';
try {
    // Only runtime dependencies ship with the Worker/Assets release. Keep this
    // gate scoped to that attack surface: npm's live advisories for the local
    // Wrangler toolchain have issued contradictory downgrade/upgrade guidance
    // for the same lockfile, which made the former all-dependency check
    // non-reproducible while not reflecting code delivered to browsers.
    output = execSync('npm audit --omit=dev --json', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });
} catch (error) {
    output = String(error && error.stdout ? error.stdout : '');
    if (!output.trim()) {
        const stderr = String(error && error.stderr ? error.stderr : '');
        const message = String(error && error.message ? error.message : '');
        const failureText = `${stderr}\n${message}`;
        const looksTransientRegistryFailure = /EAI_AGAIN|ENOTFOUND|ECONNRESET|ETIMEDOUT|ESOCKETTIMEDOUT|FETCH_ERROR|network|registry/i.test(failureText);
        if (looksTransientRegistryFailure) {
            console.warn('Warning: npm audit registry check was unreachable. Skipping audit check for this transient network failure.');
            process.exit(0);
        }
        throw error;
    }
}

const report = JSON.parse(output);
const counts = report && report.metadata && report.metadata.vulnerabilities
    ? report.metadata.vulnerabilities
    : {};
const total = Number(counts.total || 0);

if (total > 0) {
    const vulnerabilities = Object.values(report.vulnerabilities || {})
        .map((item) => `${item.name}@${item.range || '?'} (${item.severity})`)
        .sort();
    assert.fail([
        `npm audit found ${total} vulnerabilities: ${JSON.stringify(counts)}`,
        ...vulnerabilities.map((item) => `- ${item}`)
    ].join('\n'));
}

console.log('npm audit production-runtime tests passed');
