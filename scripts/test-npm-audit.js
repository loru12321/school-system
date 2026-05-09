const assert = require('assert');
const { execSync } = require('child_process');

let output = '';
try {
    output = execSync('npm audit --json', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
    });
} catch (error) {
    output = String(error && error.stdout ? error.stdout : '');
    if (!output.trim()) throw error;
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

console.log('npm audit tests passed');
