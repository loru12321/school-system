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
const fs = require('fs');
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

assert.deepStrictEqual(
    trackedInDist, [],
    `dist hashed bundles must stay untracked (they are rebuildable output); found:\n  ${trackedInDist.join('\n  ')}\n`
    + 'Remove them with: git rm --cached <paths>'
);

function listFilesRecursive(directory, prefix = '') {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const relative = path.posix.join(prefix, entry.name);
        const absolute = path.join(directory, entry.name);
        return entry.isDirectory() ? listFilesRecursive(absolute, relative) : [relative];
    });
}

// 构建会先删除旧哈希文件、再生成新文件；validate 应能在 git add 之前运行，
// 因此这里校验工作区中实际待发布的 public 产物，而不是仍指向旧版本的 Git 索引。
const publicHashedBundles = listFilesRecursive(path.join(projectRoot, 'public'), 'public')
    .filter((file) => HASHED_BUNDLE_PATTERN.test(file));
assert.ok(
    publicHashedBundles.length > 0,
    'public hashed bundles must exist; index.html references them directly'
);

// 同一类产物只应存在一个版本。旧版本残留会让 index.html 指向的版本和仓库里
// 存在的版本对不上，也是 9bae1ce0 那次漂移的根因之一。
const versionsByFamily = new Map();
publicHashedBundles.forEach((file) => {
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

function readVersions(relativePath) {
    const source = fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
    return new Set((source.match(/runtime-[0-9a-f]{12}/g) || []).map((ref) => ref.replace('runtime-', '')));
}

function assertSingleVersion(relativePath) {
    const versions = readVersions(relativePath);
    assert.strictEqual(
        versions.size, 1,
        `${relativePath} should reference exactly one asset version, found: ${[...versions].join(', ')}`
    );
    return [...versions][0];
}

const srcVersion = assertSingleVersion('src/index.html');
const publicVersion = [...allVersions][0];
assert.strictEqual(
    srcVersion, publicVersion,
    `src/index.html references asset version ${srcVersion} but public bundles are ${publicVersion}; `
    + 'run npm run build'
);

// ── 构建后校验 ────────────────────────────────────────────────────────────────
// 上面几条只看 Git 索引和 src/，证明不了「构建产物」也一致。dist/ 是真正发布出去
// 的东西：dist/index.html 指向的版本、dist 里实际存在的哈希产物、public 侧被跟踪的
// 产物三者必须对齐，否则线上会去请求一个不存在的文件。
//
// dist/ 可能尚未构建（干净 clone、或只跑单测），那种情况下跳过而不是假失败；
// 构建后的校验由 validate 在 `npm run build` 之后再跑一次来保证。
const distIndexPath = path.join(projectRoot, 'dist/index.html');
if (!fs.existsSync(distIndexPath)) {
    console.log('hashed bundle tracking tests passed (dist not built; post-build checks skipped)');
    return;
}

const distVersion = assertSingleVersion('dist/index.html');
assert.strictEqual(
    distVersion, srcVersion,
    `dist/index.html references ${distVersion} but src/index.html references ${srcVersion}; `
    + 'dist is stale, run npm run build'
);

// dist/sw.js 带的内容版本号决定 service worker 去取哪个哈希产物，漏更新会让
// 线上 SW 请求一个不存在的文件（9bae1ce0 那次漂移就属于这一类）。
const distSwPath = path.join(projectRoot, 'dist/sw.js');
if (fs.existsSync(distSwPath)) {
    const swVersions = readVersions('dist/sw.js');
    if (swVersions.size > 0) {
        assert.ok(
            swVersions.size === 1 && [...swVersions][0] === distVersion,
            `dist/sw.js references ${[...swVersions].join(', ')} but dist/index.html references ${distVersion}`
        );
    }
}

// dist/index.html 引用的哈希产物必须真的在 dist 里存在（inline-scripts 会把部分
// 脚本内联进 HTML，所以只校验仍以 <script src> 形式引用的那些）。
const distIndexSource = fs.readFileSync(distIndexPath, 'utf8');
const distReferencedFiles = [...distIndexSource.matchAll(/src="\.?\/?([^"]*?runtime-runtime-[0-9a-f]{12}\.js)(?:\?[^"]*)?"/g)]
    .map((match) => match[1].replace(/^.*assets\//, 'assets/'));
distReferencedFiles.forEach((relative) => {
    const candidate = path.join(projectRoot, 'dist', relative);
    assert.ok(
        fs.existsSync(candidate),
        `dist/index.html references ${relative} but that file is missing from dist/; run npm run build`
    );
});

// public 侧被跟踪的哈希产物必须在 dist 里有对应文件，否则发布出去的版本和仓库
// 记录的版本不是同一套。
publicHashedBundles
    .filter((file) => file.startsWith('public/assets/js/'))
    .forEach((file) => {
        const distTwin = path.join(projectRoot, file.replace(/^public\//, 'dist/'));
        assert.ok(
            fs.existsSync(distTwin),
            `${file} is tracked but its dist counterpart is missing; run npm run build`
        );
    });

console.log(`hashed bundle tracking tests passed (asset version ${distVersion}, dist verified)`);
