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

    // 系统的正式口径是「两率一分」= 均分 + 优秀率 + 及格率三项加权，
    // 且**优秀率权重最高**（9年级 50/80/50，6-8年级 60/70/70，见
    // data-processing-worker.js 约 233 行）。因此要点必须三项齐看，
    // 只挑均分或只挑及格率都会给出不完整、甚至误导的判断。
    const RATE_METRICS = [
        { key: 'avg', label: '均分' },
        { key: 'excRate', label: '优秀率' },
        { key: 'passRate', label: '及格率' }
    ];

    // ── 规则 1：综合三项校际名次，找最弱与最强学科 ────────────────────────────────
    // 跨科不能直接比数值（满分与难度不同），但「各科各自的校际名次」是同一量纲。
    // 这里取三项名次的平均，避免只看单项造成的偏读。
    function weakestByRankItem(mine, subjects) {
        const rows = subjects.map((subject) => {
            const count = num(mine.record?.metrics?.[subject]?.count);
            if (!count) return null;
            const ranks = RATE_METRICS
                .map((metric) => num(mine.record?.rankings?.[subject]?.[metric.key]))
                .filter((rank) => rank !== null);
            // 三项名次不齐时不参与比较，避免用不同项数算出的均值互相比。
            if (ranks.length !== RATE_METRICS.length) return null;
            const mean = ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length;
            return { subject, mean, ranks };
        }).filter(Boolean);
        if (rows.length < 2) return null;
        rows.sort((a, b) => a.mean - b.mean);
        const best = rows[0];
        const worst = rows[rows.length - 1];
        if (best.mean === worst.mean) return null;
        const fmt = (row) => `${escapeHtml(row.subject)}（均分第 ${row.ranks[0]}、优秀率第 ${row.ranks[1]}、及格率第 ${row.ranks[2]}）`;
        return {
            text: `三项校际名次综合看，最弱是 <strong>${fmt(worst)}</strong>，最强是 <strong>${fmt(best)}</strong>`,
            source: '两率一分三项名次'
        };
    }

    // ── 规则 2：三项中与全体最高水平差距最大的那一项 ─────────────────────────────
    // 逐项（均分/优秀率/及格率）找出「本校离最高水平最远」的学科与项目，
    // 直接对应两率一分赋分里最吃亏的地方。
    function weakestMetricItem(mine, subjects) {
        const schools = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
        const all = Object.values(schools);
        if (all.length < 2) return null;

        const candidates = [];
        subjects.forEach((subject) => {
            RATE_METRICS.forEach((metric) => {
                const own = num(mine.record?.metrics?.[subject]?.[metric.key]);
                if (own === null) return;
                let top = null;
                all.forEach((school) => {
                    const value = num(school?.metrics?.[subject]?.[metric.key]);
                    const count = num(school?.metrics?.[subject]?.count);
                    if (value === null || !count) return;
                    if (top === null || value > top) top = value;
                });
                if (top === null || top <= 0) return;
                // 用「差距占最高值的比例」统一量纲，才能在不同项目与学科之间比较。
                candidates.push({ subject, metric, own, top, ratio: (top - own) / top });
            });
        });
        if (!candidates.length) return null;
        candidates.sort((a, b) => b.ratio - a.ratio);
        const worst = candidates[0];
        if (!(worst.ratio > 0)) return null;
        const isRate = worst.metric.key !== 'avg';
        const shown = isRate
            ? `${(worst.own * 100).toFixed(1)}%（最高 ${(worst.top * 100).toFixed(1)}%）`
            : `${worst.own.toFixed(1)} 分（最高 ${worst.top.toFixed(1)} 分）`;
        return {
            text: `离最高水平最远的一项是<strong>${escapeHtml(worst.subject)}的${worst.metric.label}</strong>：${shown}`,
            source: '两率一分逐项对比'
        };
    }

    // ── 规则 3：优秀率单独提示（权重最高，最容易被忽略）───────────────────────────
    function excellentRateItem(mine, subjects) {
        const rows = subjects.map((subject) => {
            const excRate = num(mine.record?.metrics?.[subject]?.excRate);
            const count = num(mine.record?.metrics?.[subject]?.count);
            if (excRate === null || !count) return null;
            return { subject, excRate };
        }).filter(Boolean);
        if (rows.length < 2) return null;
        rows.sort((a, b) => a.excRate - b.excRate);
        const worst = rows[0];
        const best = rows[rows.length - 1];
        const gap = (best.excRate - worst.excRate) * 100;
        if (!(gap >= 5)) return null;
        return {
            text: `优秀率（赋分权重最高）最低的是<strong>${escapeHtml(worst.subject)}</strong> `
                + `${(worst.excRate * 100).toFixed(1)}%，比最高的${escapeHtml(best.subject)}低 ${gap.toFixed(1)} 个百分点`,
            source: '优秀率（同校各科对比）'
        };
    }

    function buildItems() {
        // 与综合评价页同一道守卫：切到无成绩数据的届别时，页面可能仍留着上一届渲染结果，
        // 要点绝不能把旧届别的数字当成本届结论复述出来。
        const rawData = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        if (!rawData.length) return [];

        const mine = getMySchoolRecord();
        if (!mine) return [];
        const subjects = getVisibleSubjects();
        if (subjects.length < 2) return [];
        return [
            weakestByRankItem(mine, subjects),
            weakestMetricItem(mine, subjects),
            excellentRateItem(mine, subjects)
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
