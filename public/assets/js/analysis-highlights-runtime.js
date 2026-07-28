// 两率一分对比页的「本次要点」：把已经算好的各科指标翻译成一句能直接说的判断。
//
// 与综合评价页的 summary-highlights 同一套设计约束：
// 1. **只读已算好的结果**（SCHOOLS[x].metrics / rankings、THRESHOLDS），不做新计算、
//    不引入新阈值口径。
// 2. **必须复用 getTownAnalysisVisibleSubjectsForCurrentUser()** 做学科可见性过滤——
//    任课教师只能看到自己任教的学科，要点绝不能成为越权披露的旁路。
// 3. 只描述数据能直接读出的事实（哪科最弱、差多少、几个班掉队），不做因果归因。
// 4. 条件不足（无数据、学科不足 2 个、缺本校）时整块隐藏，不输出半句没依据的话。
(function (root) {
    if (!root || root.__ANALYSIS_HIGHLIGHTS_RUNTIME__) return;
    root.__ANALYSIS_HIGHLIGHTS_RUNTIME__ = true;

    const CONTAINER_ID = 'analysis-highlights';
    const MAX_ITEMS = 4;

    const escapeHtml = (value) => (root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
        ? root.SchoolRuntime.escapeHtml(value)
        : String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char])));

    const num = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    // 学科可见性必须与主表一致：直接复用 app.js 的过滤函数，缺失时保守取空。
    function getVisibleSubjects() {
        if (typeof root.getTownAnalysisVisibleSubjectsForCurrentUser === 'function') {
            const list = root.getTownAnalysisVisibleSubjectsForCurrentUser();
            return Array.isArray(list) ? list.filter(Boolean) : [];
        }
        return [];
    }

    function getMySchoolRecord() {
        const schools = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
        const mine = String(root.MY_SCHOOL || '').trim();
        return mine && schools[mine] ? { name: mine, record: schools[mine] } : null;
    }

    // ── 规则 1：本校最弱学科（按校内名次，而非跨科比分数）────────────────────────
    // 用「本校该科在参评学校中的名次」判断强弱：跨科直接比均分是错的（满分与难度不同），
    // 但「各科各自的校际名次」是同一量纲，可以横向比较。
    function weakestByRankItem(mine, subjects) {
        const rows = subjects.map((subject) => {
            const rank = num(mine.record?.rankings?.[subject]?.avg);
            const count = num(mine.record?.metrics?.[subject]?.count);
            if (rank === null || !count) return null;
            return { subject, rank };
        }).filter(Boolean);
        if (rows.length < 2) return null;
        rows.sort((a, b) => a.rank - b.rank);
        const best = rows[0];
        const worst = rows[rows.length - 1];
        if (best.rank === worst.rank) return null;
        return {
            text: `各科校际名次里，<strong>${escapeHtml(worst.subject)}</strong>最靠后（第 ${worst.rank} 名），`
                + `<strong>${escapeHtml(best.subject)}</strong>最靠前（第 ${best.rank} 名）`,
            source: '按各科校际名次比较'
        };
    }

    // ── 规则 2：本校及格率最低的学科（校内自比，绝对水平）────────────────────────
    function lowestPassRateItem(mine, subjects) {
        const rows = subjects.map((subject) => {
            const passRate = num(mine.record?.metrics?.[subject]?.passRate);
            const count = num(mine.record?.metrics?.[subject]?.count);
            if (passRate === null || !count) return null;
            return { subject, passRate };
        }).filter(Boolean);
        if (rows.length < 2) return null;
        rows.sort((a, b) => a.passRate - b.passRate);
        const worst = rows[0];
        const best = rows[rows.length - 1];
        const gap = (best.passRate - worst.passRate) * 100;
        if (!(gap >= 10)) return null;
        return {
            text: `<strong>${escapeHtml(worst.subject)}</strong>及格率 ${(worst.passRate * 100).toFixed(1)}%，`
                + `比最高的${escapeHtml(best.subject)}低 ${gap.toFixed(1)} 个百分点`,
            source: '及格率（同校各科对比）'
        };
    }

    // ── 规则 3：与全体参评学校最高水平的差距最大的学科 ────────────────────────────
    function biggestGapToTopItem(mine, subjects) {
        const schools = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
        const all = Object.values(schools);
        if (all.length < 2) return null;
        const rows = subjects.map((subject) => {
            const own = num(mine.record?.metrics?.[subject]?.avg);
            if (own === null) return null;
            let topAvg = null;
            let topName = '';
            all.forEach((school) => {
                const avg = num(school?.metrics?.[subject]?.avg);
                const count = num(school?.metrics?.[subject]?.count);
                if (avg === null || !count) return;
                if (topAvg === null || avg > topAvg) {
                    topAvg = avg;
                    topName = String(school?.name || '').trim();
                }
            });
            if (topAvg === null || topAvg <= 0) return null;
            // 用「差距占最高分的比例」而不是绝对分差，才能跨科比较。
            return { subject, gapRatio: (topAvg - own) / topAvg, gap: topAvg - own, topName };
        }).filter(Boolean);
        if (!rows.length) return null;
        rows.sort((a, b) => b.gapRatio - a.gapRatio);
        const worst = rows[0];
        if (!(worst.gap > 0)) return null;
        return {
            text: `与最高水平差距最大的是<strong>${escapeHtml(worst.subject)}</strong>，`
                + `均分低 ${worst.gap.toFixed(1)} 分（最高：${escapeHtml(worst.topName)}）`,
            source: '各科均分与最高校对比'
        };
    }

    function buildItems() {
        const mine = getMySchoolRecord();
        if (!mine) return [];
        const subjects = getVisibleSubjects();
        if (subjects.length < 2) return [];
        return [
            weakestByRankItem(mine, subjects),
            lowestPassRateItem(mine, subjects),
            biggestGapToTopItem(mine, subjects)
        ].filter(Boolean).slice(0, MAX_ITEMS);
    }

    function renderAnalysisHighlights() {
        const container = root.document?.getElementById(CONTAINER_ID);
        if (!container) return { ok: false, reason: 'missing-container', count: 0 };

        let items = [];
        try {
            items = buildItems();
        } catch (error) {
            // 要点是辅助信息，生成失败绝不能影响两率一分主表。
            console.warn('[analysis-highlights] 生成要点失败:', error);
            items = [];
        }

        if (!items.length) {
            container.hidden = true;
            container.innerHTML = '';
            return { ok: true, count: 0 };
        }

        container.innerHTML = `
            <div class="summary-highlights-head">
                <strong>本次要点</strong>
                <span class="summary-highlights-note">自动生成，供参考；具体数字见下方表格</span>
            </div>
            <ul class="summary-highlights-list">
                ${items.map((item) => `<li>${item.text}<span class="summary-highlights-src">来源：${escapeHtml(item.source)}</span></li>`).join('')}
            </ul>`;
        container.hidden = false;
        return { ok: true, count: items.length };
    }

    root.renderAnalysisHighlights = renderAnalysisHighlights;
    root.AnalysisHighlightsRuntime = { render: renderAnalysisHighlights, buildItems };
})(typeof window !== 'undefined' ? window : null);
