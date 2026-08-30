/*
 * 高分段页面运行时模块
 *
 * 该模块只负责“高分学生分析”页面的表格展示；高分段赋分参与综合评价的
 * 计算仍由 app.js 的 calculateHighScoreStatsForSummary 保持在核心计算路径。
 * 页面展示属于低频入口，因此按需加载，避免把首屏 app.js 继续做大。
 */
(function (root) {
    if (!root) return;

    function getSchoolMap() {
        return root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
    }

    function escapeHtml(value) {
        if (typeof root.escapeAppHtml === 'function') return root.escapeAppHtml(value);
        if (typeof root.tmEscapeHtml === 'function') return root.tmEscapeHtml(value);
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function stringLiteral(value) {
        if (typeof root.jsStringLiteral === 'function') return root.jsStringLiteral(value);
        return JSON.stringify(String(value == null ? '' : value));
    }

    function getRankHtml(rank) {
        return typeof root.getRankHTML === 'function' ? root.getRankHTML(rank) : `<td>${rank}</td>`;
    }

    function renderHighScoreTable() {
        const tbody = root.document?.querySelector('#tb-high-score tbody');
        if (!tbody) return false;
        const config = root.CONFIG || {};
        tbody.innerHTML = '';

        if (!config.name || !String(config.name).includes('9')) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#999;">🚫 当前非 9 年级模式，无高分段核算数据。</td></tr>';
            return true;
        }

        const schools = getSchoolMap();
        const schoolNames = Object.keys(schools);
        const hasScopeHelper = typeof root.getTownshipManagedSchoolNames === 'function';
        const townshipNames = hasScopeHelper
            ? root.getTownshipManagedSchoolNames(schoolNames)
            : schoolNames;
        const townshipSet = new Set((townshipNames || [])
            .map(name => String(name || '').trim())
            .filter(Boolean));
        const townshipSchools = Object.values(schools).filter((school) => {
            if (!hasScopeHelper) return true;
            const name = String(school?.name || '').trim();
            return typeof root.isTownshipManagedSchool === 'function'
                ? root.isTownshipManagedSchool(name, schoolNames)
                : townshipSet.has(name);
        });

        if (!townshipSchools.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">请先上传数据</td></tr>';
            return true;
        }

        const getStudents = typeof root.getEquivalentSchoolStudents === 'function'
            ? root.getEquivalentSchoolStudents
            : (() => []);
        const rows = townshipSchools.map((school) => {
            const students = getStudents(school.name);
            const count = students.length || Number(school?.metrics?.total?.count) || 0;
            const highScoreCount = students.filter(student => Number(student?.total) >= 490).length;
            const highScoreRatio = count ? highScoreCount / count : 0;
            return { name: school.name, count, hsCount: highScoreCount, hsRatio: highScoreRatio };
        });
        const maxRatio = Math.max(...rows.map(row => row.hsRatio), 0);
        const list = rows.map(row => ({
            ...row,
            score: maxRatio ? row.hsRatio / maxRatio * 50 : 0
        })).sort((left, right) => right.score - left.score);

        tbody.innerHTML = list.map((row, index) => {
            const isMySchool = typeof root.sameAppSchoolName === 'function'
                ? root.sameAppSchoolName(row.name, root.MY_SCHOOL)
                : String(row.name || '') === String(root.MY_SCHOOL || '');
            const safeName = escapeHtml(row.name);
            const safeNameArg = stringLiteral(row.name);
            return `<tr class="${isMySchool ? 'bg-highlight' : ''}">
                <td>${safeName}</td>
                <td>${row.count}</td>
                <td style="font-weight:bold;">
                    <span class="clickable-num" onclick="handleHighClick(${safeNameArg})" title="点击查看高分学生名单">
                        ${row.hsCount}
                    </span>
                </td>
                <td>${(row.hsRatio * 100).toFixed(2)}%</td>
                <td class="text-red" style="font-size:1.1em; font-weight:bold;">${row.score.toFixed(2)}</td>
                ${getRankHtml(index + 1)}
            </tr>`;
        }).join('');

        root.__LAST_HIGH_SCORE_SUMMARY_ROWS__ = list;
        if (typeof root.markSummaryDataChangedIfDependencyChanged === 'function'
            && typeof root.buildSummaryDependencySignature === 'function') {
            root.markSummaryDataChangedIfDependencyChanged(
                'highScore',
                root.buildSummaryDependencySignature('highScore', list),
                '高分段赋分已更新，请重新生成总排名。'
            );
        }
        if (typeof root.appDebug === 'function') root.appDebug(`已渲染 ${list.length} 所学校的高分数据`);
        return true;
    }

    root.renderHighScoreTable = renderHighScoreTable;
    root.HighScoreRuntime = { renderHighScoreTable };
})(typeof window !== 'undefined' ? window : globalThis);
