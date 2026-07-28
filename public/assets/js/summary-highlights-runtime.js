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

    // ── 规则 2：本校在参评学校中的位置 ────────────────────────────────────────────
    // 本页的正式结论是「综合总分 / 总排名」——由两率一分 + 后1/3 + 指标生 + 高分段 +
    // 上线率合计而来（见 app.js calcSummary 里的 s1..s5）。它既不等于总分均分排名，
    // 也不等于两率一分单项的 rank2Rate（实测本校 rank2Rate=3 而总排名=2）。
    //
    // 因此这里**直接从已渲染的 #tb-summary 主表读取**本校的综合总分与总排名：
    // 用户看到的要点与同一页表格必然一致，也天然遵循「只读已算好的结果」。
    // 自己重排任何一种口径都会造成两个数字打架。
    function schoolPositionItem(mine) {
        const table = root.document?.getElementById('tb-summary');
        const rows = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
        if (rows.length < 2) return null;

        const parse = (tr) => {
            const cells = Array.from(tr.querySelectorAll('td')).map((td) => String(td.innerText || '').trim());
            if (cells.length < 3) return null;
            // 学校名在首列，综合总分与总排名固定在最后两列（列数随年级变化，故从末尾取）。
            return {
                name: cells[0],
                total: num(cells[cells.length - 2]),
                rank: num(cells[cells.length - 1])
            };
        };
        const parsed = rows.map(parse).filter((row) => row && row.name && row.rank !== null);
        if (parsed.length < 2) return null;

        const self = parsed.find((row) => row.name === mine.name);
        if (!self) return null;
        parsed.sort((a, b) => a.rank - b.rank);
        const top = parsed[0];

        if (self.rank === top.rank) {
            return {
                text: `综合总分 ${self.total === null ? '-' : self.total.toFixed(1)}，`
                    + `在 ${parsed.length} 所参评学校中<strong>排第 1</strong>`,
                source: '综合评价总排名'
            };
        }
        const gapText = (self.total !== null && top.total !== null)
            ? `，距第 1 名（${escapeHtml(top.name)}）差 ${(top.total - self.total).toFixed(1)} 分`
            : `，第 1 名是 ${escapeHtml(top.name)}`;
        return {
            text: `综合总分 ${self.total === null ? '-' : self.total.toFixed(1)}，`
                + `在 ${parsed.length} 所参评学校中排第 <strong>${self.rank}</strong>${gapText}`,
            source: '综合评价总排名'
        };
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
        // 临界分值与「临界学生」模块保持同源：该模块读 #mpGap，为空时默认 5 分
        // （marginal-push-runtime.js getMarginalConfig）。此前这里硬编码 10 分，与模块
        // 默认值不一致，用户对着两处会看到不同人数。
        //
        // 注意：临界学生模块是懒加载的，用户没进过该模块时 #mpGap 尚未渲染，这里必然
        // 取到默认值 5。因此文案只说「默认口径」，不谎称「按模块当前设置」——真正的
        // 精确名单仍以该模块为准，用户在那里调分值后看到的数字可以与此处不同。
        const rawGap = num(root.document?.getElementById('mpGap')?.value);
        const usingDefault = rawGap === null;
        const gap = Math.max(0.1, usingDefault ? 5 : rawGap);
        const nearly = totals.filter((total) => total < excLine && total >= excLine - gap).length;
        if (!nearly) return null;
        // 措辞区分数据来源：未进过临界模块时 #mpGap 不存在、用的是默认 5 分；
        // 进过并设过值则跟随该设置。谎称哪一种都会让用户对不上数。
        const scopeText = usingDefault ? `默认口径 ${gap} 分内` : `当前设定 ${gap} 分内`;
        return {
            text: `距优秀线（${excLine.toFixed(1)}）<strong>${scopeText}</strong>有 `
                + `<strong>${nearly}</strong> 人，属于提分性价比较高的一批`,
            source: '临界学生（分值可在该模块调整）'
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
