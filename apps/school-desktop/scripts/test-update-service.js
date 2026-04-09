const assert = require('node:assert/strict');
const {
    getDesktopUpdateState,
    mapRelease
} = require('../release-service');

function createRelease(tag, publishedAt) {
    return mapRelease({
        tag_name: tag,
        name: tag,
        published_at: publishedAt,
        html_url: `https://github.com/loru12321/school-system/releases/tag/${tag}`,
        body: '- sample bullet',
        platform_versions: {
            android: { version: '1.0.1', build: '2' },
            desktop: { version: '1.0.0' }
        },
        assets: [
            {
                name: 'school-system-android-latest.apk',
                browser_download_url: `https://example.com/${tag}/school-system-android-latest.apk`,
                size: 123
            },
            {
                name: 'smartedu-desktop-windows-latest.exe',
                browser_download_url: `https://example.com/${tag}/smartedu-desktop-windows-latest.exe`,
                size: 456
            }
        ]
    });
}

const releases = [
    createRelease('school-system-v2026.04.09-floating-shell-rail-v58', '2026-04-09T02:11:54Z'),
    createRelease('school-system-v2026.04.09-shell-scroll-feedback-v57', '2026-04-09T01:26:30Z'),
    createRelease('school-system-v2026.04.08-mobile-hero-clean-v53', '2026-04-08T12:05:57Z')
];

const latest = getDesktopUpdateState({
    currentVersion: '1.0.0',
    currentReleaseTag: 'school-system-v2026.04.09-floating-shell-rail-v58',
    currentReleaseDate: '2026-04-09',
    releases
});
assert.equal(latest.status, 'latest');
assert.equal(latest.isLatest, true);
assert.equal(latest.updateAvailable, false);

const updateAvailable = getDesktopUpdateState({
    currentVersion: '1.0.0',
    currentReleaseTag: 'school-system-v2026.04.09-shell-scroll-feedback-v57',
    currentReleaseDate: '2026-04-09',
    releases
});
assert.equal(updateAvailable.status, 'update-available');
assert.equal(updateAvailable.updateAvailable, true);
assert.equal(updateAvailable.latestRelease.tag, 'school-system-v2026.04.09-floating-shell-rail-v58');

const ahead = getDesktopUpdateState({
    currentVersion: '1.0.1',
    currentReleaseTag: 'school-system-v2026.04.09-about-update-v59',
    currentReleaseDate: '2026-04-09',
    releases
});
assert.equal(ahead.status, 'ahead');
assert.equal(ahead.isLatest, true);
assert.equal(ahead.updateAvailable, false);

const unbound = getDesktopUpdateState({
    currentVersion: '1.0.0',
    currentReleaseTag: '',
    currentReleaseDate: '',
    releases
});
assert.equal(unbound.status, 'unbound');
assert.equal(unbound.updateAvailable, false);

console.log('desktop update service tests passed');
