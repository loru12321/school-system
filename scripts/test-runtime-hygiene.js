const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const removedFiles = [
    'public/assets/js/admin-dashboard.js',
    'public/assets/js/audit-logger.js',
    'public/assets/js/automated-reports.js',
    'public/assets/js/chart-interactivity.js',
    'public/assets/js/comparison-engine-v2.js',
    'public/assets/js/data-anonymizer.js',
    'public/assets/js/data-pagination.js',
    'public/assets/js/drag-drop-lab.js',
    'public/assets/js/parent-growth-portal.js',
    'public/assets/js/responsive-table.js',
    'public/assets/js/school-resource-monitor.js',
    'public/assets/js/student-learning-nav.js',
    'public/assets/js/sync-push-center.js',
    'public/assets/js/teacher-collab-hub.js',
    'public/assets/js/voice-assistant.js',
    'src/patch.js'
];

const forbiddenRuntimeTokens = [
    'ai-analysis',
    'ai-hub-runtime.js',
    'report-ai-runtime.js',
    'ai-diagnosis.js',
    '/api/ai/',
    'LLM_API_KEY',
    'BATCH_AI',
    'IS_BATCH_AI'
];

const sourceFiles = [
    'src/index.html',
    'src/worker-dummy.js',
    'public/assets/js/app.js',
    'public/assets/js/boot-runtime.js',
    'public/assets/js/shell-runtime.js',
    'public/assets/js/module-entry-runtime.js',
    'public/assets/js/permission-policy-runtime.js',
    'scripts/build/inline-scripts.mjs',
    'package.json'
];

removedFiles.forEach((relativePath) => {
    assert.strictEqual(
        fs.existsSync(path.join(root, relativePath)),
        false,
        `${relativePath} should remain removed`
    );
});

sourceFiles.forEach((relativePath) => {
    const filePath = path.join(root, relativePath);
    const text = fs.readFileSync(filePath, 'utf8');
    forbiddenRuntimeTokens.forEach((token) => {
        assert.strictEqual(
            text.includes(token),
            false,
            `${relativePath} should not contain removed runtime token: ${token}`
        );
    });
});

console.log('runtime hygiene tests passed');
