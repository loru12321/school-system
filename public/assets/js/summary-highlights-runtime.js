// 本次要点：把综合评价页已经算好的结果，翻译成教务能直接照着说的几句话。
//
// 设计约束（重要）：
// 1. **只读已算好的结果**，不做任何新计算、不引入新阈值口径。均分/优秀率/及格率取自
//    SCHOOLS[x].metrics（worker 产出），后 1/3 取自 bottom3，优秀/及格线取自 CONFIG。
// 2. 结论只描述**可从数据直接读出的事实**（谁最低、差多少、多少人），不做因果归因，
//    不评价教师。教学归因需要人结合生源判断，系统不越位。
// 3. 条件不足（无数据、单校、缺科目）时**整块隐藏**，绝不输出半句没依据的话。
// 4. 每条都标注来源模块，方便点进去核对；整块顶部标注"自动生成，供参考"。
(function (root) {
    if (!root || root.__SUMMARY_HIGHLIGHTS_RUNTIME__) return;
    root.__SUMMARY_HIGHLIGHTS_RUNTIME__ = true;

    const CONTAINER_ID = 'summary-highlights';
    // 显示上限：要点是给人念的，多了就没人看。
    const MAX_ITEMS = 5;

    const escapeHtml = (value) => (root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
        ? root.SchoolRuntime.escapeHtml(value)
        : String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char])));

    const num = (value) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    };

    function getMySchoolRecord() {
        const schools = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
        const mine = String(root.MY_SCHOOL || '').trim();
        if (mine && schools[mine]) return { name: mine, record: schools[mine] };
        // 未识别本校时不猜：返回空，让调用方隐藏整块。
        return null;
    }

    // ── 规则 1：本校最弱学科 ──────────────────────────────────────────────────────
    // 系统正式口径是「两率一分」= 均分 + 优秀率 + 及格率三项加权，且**优秀率权重最高**
    // （9年级 50/80/50，6-8年级 60/70/70）。只看及格率或只看均分都会给出不完整的判断，
    // 因此取三项**校际名次的平均**——跨科不能直接比数值（满分与难度不同），但各科各自
    // 的校际名次是同一量纲，可以横向比较。
    const RATE_RANK_KEYS = ['avg', 'excRate', 'passRate'];

    function weakestSubjectItem(record) {
        // 学科范围与两率一分主表一致（含任课教师的学科可见性过滤）；函数缺失时保守取空。
        const subjects = typeof root.getTownAnalysisVisibleSubjectsForCurrentUser === 'function'
            ? (root.getTownAnalysisVisibleSubjectsForCurrentUser() || []).filter(Boolean)
            : [];
        const rows = subjects.map((subject) => {
            const count = num(record?.metrics?.[subject]?.count);
            if (!count) return null;
            const ranks = RATE_RANK_KEYS
                .map((key) => num(record?.rankings?.[subject]?.[key]))
                .filter((rank) => rank !== null);
            // 三项名次不齐时不参与比较，避免用不同项数算出的均值互相比。
            if (ranks.length !== RATE_RANK_KEYS.length) return null;
            return { subject, mean: ranks.reduce((sum, rank) => sum + rank, 0) / ranks.length, ranks };
        }).filter(Boolean);
        if (rows.length < 2) return null;
        rows.sort((a, b) => a.mean - b.mean);
        const worst = rows[rows.length - 1];
        const best = rows[0];
        if (worst.mean === best.mean) return null;
        return {
            text: `三项（均分/优秀率/及格率）校际名次综合看，最弱是 <strong>${escapeHtml(worst.subject)}</strong>`
                + `（第 ${worst.ranks[0]}/${worst.ranks[1]}/${worst.ranks[2]} 名），`
                + `最强是 <strong>${escapeHtml(best.subject)}</strong>`
                + `（第 ${best.ranks[0]}/${best.ranks[1]}/${best.ranks[2]} 名）`,
            source: '两率一分三项名次'
        };
    }

    // ── 规则 2：本校在参评学校中的总分位置 ────────────────────────────────────────
    function schoolPositionItem(mine) {
        const schools = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
        const rows = Object.values(schools).map((school) => {
            const avg = num(school?.metrics?.total?.avg);
            const count = num(school?.metrics?.total?.count);
            if (avg === null || !count) return null;
            return { name: String(school?.name || '').trim(), avg };
        }).filter(Boolean);
        // 单校模式下没有横向可比对象，不输出。
        if (rows.length < 2) return null;
        rows.sort((a, b) => b.avg - a.avg);
        const index = rows.findIndex((row) => row.name === mine.name);
        if (index < 0) return null;
        const self = rows[index];
        const top = rows[0];
        const gapToTop = top.avg - self.avg;
        const positionText = index === 0
            ? `总分均分 ${self.avg.toFixed(1)}，在 ${rows.length} 所参评学校中<strong>排第 1</strong>`
            : `总分均分 ${self.avg.toFixed(1)}，在 ${rows.length} 所参评学校中排第 <strong>${index + 1}</strong>，`
                + `距第 1 名（${escapeHtml(top.name)}）差 ${gapToTop.toFixed(1)} 分`;
        return { text: positionText, source: '综合评价' };
    }

    // ── 规则 3：后 1/3 学生规模 ──────────────────────────────────────────────────
    function bottomGroupItem(record) {
        const bottom = record?.bottom3;
        const bottomN = num(bottom?.bottomN);
        const totalN = num(bottom?.totalN);
        const avg = num(bottom?.avg);
        if (!bottomN || !totalN) return null;
        return {
            text: `后 1/3 共 <strong>${bottomN}</strong> 人（参评 ${totalN} 人）`
                + (avg !== null ? `，平均分 ${avg.toFixed(1)}` : '')
                + '，是下阶段补弱的主要对象',
            source: '后段学生'
        };
    }

    // ── 规则 4：临界生提示（只提示存在与规模，具体名单由模块给出）──────────────────
    function marginalHintItem(record) {
        const students = Array.isArray(record?.students) ? record.students : [];
        if (!students.length) return null;
        const totals = students.map((student) => num(student?.total)).filter((value) => value !== null);
        if (!totals.length) return null;
        // 优秀线直接取系统已划好的 THRESHOLDS（可能是分位线，随数据变化），不自行推算。
        const excLine = num(root.THRESHOLDS?.total?.exc);
        if (excLine === null || excLine <= 0) return null;
        // 距优秀线 10 分以内视为「就差一点」——此处仅用于提示规模，
        // 精确判定与可调分值仍以「临界学生」模块为准。
        const nearly = totals.filter((total) => total < excLine && total >= excLine - 10).length;
        if (!nearly) return null;
        return {
            text: `有 <strong>${nearly}</strong> 人距优秀线（${excLine.toFixed(1)}）不到 10 分，`
                + '属于提分性价比较高的一批',
            source: '临界学生'
        };
    }

    function buildItems() {
        const mine = getMySchoolRecord();
        if (!mine) return [];
        const record = mine.record;
        return [
            schoolPositionItem(mine),
            weakestSubjectItem(record),
            bottomGroupItem(record),
            marginalHintItem(record)
        ].filter(Boolean).slice(0, MAX_ITEMS);
    }

    function renderSummaryHighlights() {
        const container = root.document?.getElementById(CONTAINER_ID);
        if (!container) return { ok: false, reason: 'missing-container', count: 0 };

        let items = [];
        try {
            items = buildItems();
        } catch (error) {
            // 要点是辅助信息，生成失败绝不能影响综合评价主表。
            console.warn('[summary-highlights] 生成要点失败:', error);
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
                <span class="summary-highlights-note">自动生成，供参考；具体数字请点开对应模块核对</span>
            </div>
            <ul class="summary-highlights-list">
                ${items.map((item) => `<li>${item.text}<span class="summary-highlights-src">来源：${escapeHtml(item.source)}</span></li>`).join('')}
            </ul>`;
        container.hidden = false;
        return { ok: true, count: items.length };
    }

    root.renderSummaryHighlights = renderSummaryHighlights;
    root.SummaryHighlightsRuntime = { render: renderSummaryHighlights, buildItems };
})(typeof window !== 'undefined' ? window : null);
