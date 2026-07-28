// 哈希产物（boot-runtime / service-worker-runtime / sw）的跟踪约定：
//
//   public/ 下的哈希产物  → 跟踪（index.html 直接引用，是发布输入）
//   dist/   下的哈希产物  → 不跟踪（构建输出，npm run build 可完整重建）
//
// 这条约定过去在历史里前后矛盾过：5ee73788 把 dist 哈希产物 `git add -f` 进了仓库，
// 9bae1ce0 又把它们删掉但没补上后继版本，导致 dist 哈希产物在仓库里凭空缺失，
// 而 public 下的同名产物一直正常跟踪。每次提交靠人肉记这个约定就会重新漂移，
// 所以在这里锁住。
//
// 注意 dist/ 整目录在 .gitignore 里，所以 dist 下任何文件（哪怕已跟踪、只是改动）
// 显式 git add 都必须带 -f。这条测试顺带把「不该被 -f 加进来」这件事变成硬约束。
const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const HASHED_BUNDLE_PATTERN = /-runtime-[0-9a-f]{12}\.js$|^public\/sw-runtime-[0-9a-f]{12}\.js$|^dist\/sw-runtime-[0-9a-f]{12}\.js$/;

function listTrackedFiles() {
    // -z 避免中文路径被 git 转义成 "\344\270\255" 之类，仓库里确实有中文文件名。
    const raw = execFileSync('git', ['ls-files', '-z'], {
        cwd: projectRoot,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024
    });
    return raw.split('\0').filter(Boolean);
}

const tracked = listTrackedFiles();
assert.ok(tracked.length > 0, 'git ls-files should report tracked files');

const trackedHashedBundles = tracked.filter((file) => HASHED_BUNDLE_PATTERN.test(file));
const trackedInDist = trackedHashedBundles.filter((file) => file.startsWith('dist/'));
const trackedInPublic = trackedHashedBundles.filter((file) => file.startsWith('public/'));

assert.deepStrictEqual(
    trackedInDist, [],
    `dist hashed bundles must stay untracked (they are rebuildable output); found:\n  ${trackedInDist.join('\n  ')}\n`
    + 'Remove them with: git rm --cached <paths>'
);

// public 侧必须是跟踪的，否则部署缺文件。这一半同样要锁，不然「保持一致」会被
// 误读成两边都不跟踪。
assert.ok(
    trackedInPublic.length > 0,
    'public hashed bundles must be tracked; index.html references them directly, '
    + 'so an untracked bundle means a broken deploy'
);

// 同一类产物只应存在一个版本。旧版本残留会让 index.html 指向的版本和仓库里
// 存在的版本对不上，也是 9bae1ce0 那次漂移的根因之一。
const versionsByFamily = new Map();
trackedInPublic.forEach((file) => {
    const match = file.match(/^(.*?)-?runtime-([0-9a-f]{12})\.js$/);
    if (!match) return;
    const family = match[1].replace(/-runtime$/, '');
    if (!versionsByFamily.has(family)) versionsByFamily.set(family, new Set());
    versionsByFamily.get(family).add(match[2]);
});

versionsByFamily.forEach((versions, family) => {
    assert.strictEqual(
        versions.size, 1,
        `${family} should have exactly one tracked hashed version, found: ${[...versions].join(', ')}. `
        + 'Stale bundles must be removed in the same commit that adds the successor.'
    );
});

// 所有 family 必须共用同一个版本号，且与 src/index.html 引用的版本一致。
const allVersions = new Set([...versionsByFamily.values()].flatMap((set) => [...set]));
assert.strictEqual(
    allVersions.size, 1,
    `all tracked hashed bundles should share one asset version, found: ${[...allVersions].join(', ')}`
);

const fs = require('fs');
const indexHtml = fs.readFileSync(path.join(projectRoot, 'src/index.html'), 'utf8');
const referenced = new Set((indexHtml.match(/runtime-[0-9a-f]{12}/g) || []).map((ref) => ref.replace('runtime-', '')));
assert.strictEqual(
    referenced.size, 1,
    `src/index.html should reference exactly one asset version, found: ${[...referenced].join(', ')}`
);
assert.strictEqual(
    [...referenced][0], [...allVersions][0],
    `src/index.html references asset version ${[...referenced][0]} but the tracked bundles are ${[...allVersions][0]}; `
    + 'run npm run build before git add'
);

console.log('hashed bundle tracking tests passed');
