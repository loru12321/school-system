// 教师表现页的「本次要点」。
//
// **与前两页最重要的差别：这里只给中性事实，不点名教师、不做因果归因。**
// 理由：教师评价涉及考核，而单次考试、单个班级样本有限；班级生源差异不做校正时，
// 「某老师均分低」可能只是生源不同。系统自己也内建了样本量校正
// （confidenceFactor 按学生数开方、sampleWarning、teacherChangeProtected），
// 说明这套口径本就要求谨慎解读。所以要点只做两件事：
//   1. 汇总**规模**（多少人达标/需关注/样本不足），帮教务判断整体面貌；
//   2. 复述系统**已有的**提示信号（样本不足、教师变动保护），提醒别误读。
// 绝不输出「X 老师最弱」这类结论——那需要人结合生源判断，系统不越位。
//
// 其余约束与 summary/analysis 两页一致：只读已算好的结果、不新增计算、
// 条件不足整块隐藏、当前届别无数据不产出。
(function (root) {
    if (!root || root.__TEACHER_HIGHLIGHTS_RUNTIME__) return;
    root.__TEACHER_HIGHLIGHTS_RUNTIME__ = true;

    const CONTAINER_ID = 'teacher-highlights';
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

    // 把 TEACHER_STATS 摊平成「教师-学科」条目。只读，不改动原对象。
    function collectEntries() {
        const stats = root.TEACHER_STATS && typeof root.TEACHER_STATS === 'object' ? root.TEACHER_STATS : {};
        const entries = [];
        Object.keys(stats).forEach((teacher) => {
            const bySubject = stats[teacher];
            if (!bySubject || typeof bySubject !== 'object') return;
            Object.keys(bySubject).forEach((subject) => {
                const data = bySubject[subject];
                if (!data || typeof data !== 'object') return;
                // 只纳入真正算过分的条目（fairScore 是最终评价分）。
                if (num(data.fairScore) === null) return;
                entries.push({ teacher, subject, data });
            });
        });
        return entries;
    }

    // ── 规则 1：整体覆盖面（有多少教师-学科条目参与评价）──────────────────────────
    function coverageItem(entries) {
        const teachers = new Set(entries.map((entry) => entry.teacher));
        const subjects = new Set(entries.map((entry) => entry.subject));
        if (!teachers.size) return null;
        return {
            text: `本次共 <strong>${teachers.size}</strong> 位教师、${subjects.size} 个学科纳入评价，`
                + `合计 ${entries.length} 个教师-学科条目`,
            source: '教师表现'
        };
    }

    // ── 规则 2：需关注条目的规模（复述系统已判定的 riskLevel，不点名）──────────────
    function riskScaleItem(entries) {
        const risky = entries.filter((entry) => String(entry.data.riskLevel || '') === 'risk');
        if (!risky.length) {
            return {
                text: '按系统评价口径，本次<strong>没有</strong>被标记为需关注的教师-学科条目',
                source: '教师表现'
            };
        }
        const ratio = risky.length / entries.length;
        const base = `有 <strong>${risky.length}</strong>/${entries.length} 个教师-学科条目被标记为需关注`
            + `（${(ratio * 100).toFixed(0)}%），判定依据是评价分偏低、低分率偏高或基线校正为负`;
        // 实测本校曾出现 80% 被标记的情况。比例过高时「需关注」已失去筛选作用，
        // 若照常报数会让人误以为系统在全面报警；如实提示这是普遍偏低而非个别问题。
        const tail = ratio >= 0.5
            ? '。比例偏高说明这是整体性偏低，不宜当成个别教师的问题看，建议先核对本次试卷难度与参评范围'
            : '。具体请在下方卡片逐个查看';
        return { text: base + tail, source: '教师表现（riskLevel）' };
    }

    // ── 规则 3：样本不足提示（这是「别误读」的关键，必须说）──────────────────────
    function sampleWarningItem(entries) {
        const warned = entries.filter((entry) => entry.data.sampleWarning === true);
        if (!warned.length) return null;
        const changed = warned.filter((entry) => entry.data.teacherChangeProtected === true).length;
        const changedText = changed ? `，其中 ${changed} 个涉及教师变动、系统已做保护处理` : '';
        // 全部条目都被标记时（实测出现过 15/15），说明缺的是可对比的历史基线，
        // 而不是某几个条目特殊。此时应说清原因，否则读者会以为数据有问题。
        if (warned.length === entries.length) {
            return {
                text: `<strong>全部 ${entries.length} 个</strong>条目都缺少稳定的对比样本${changedText}。`
                    + '这通常是历史基线不足（如本届首次考试、或上次数据未归档）导致的，'
                    + '本次结果只宜看当次表现，不宜据此判断进退步',
                source: '教师表现（样本提示）'
            };
        }
        return {
            text: `<strong>${warned.length}</strong>/${entries.length} 个条目样本不足或有变动${changedText}，`
                + '解读时请谨慎，不建议据此单独下结论',
            source: '教师表现（样本提示）'
        };
    }

    // ── 规则 4：口径提醒（固定文案，防止把评价分当成教学水平的唯一证据）────────────
    function cautionItem(entries) {
        if (entries.length < 2) return null;
        return {
            text: '评价分<strong>未做生源校正</strong>，班级生源差异会体现在结果里；'
                + '单次考试波动正常，建议连续看 2-3 次趋势再做判断',
            source: '口径说明'
        };
    }

    function buildItems() {
        // 与另两页一致：当前届别没有成绩数据时一条都不产出，避免复述上一届结果。
        const rawData = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        if (!rawData.length) return [];

        const entries = collectEntries();
        if (!entries.length) return [];

        return [
            coverageItem(entries),
            riskScaleItem(entries),
            sampleWarningItem(entries),
            cautionItem(entries)
        ].filter(Boolean).slice(0, MAX_ITEMS);
    }

    function renderTeacherHighlights() {
        const container = root.document?.getElementById(CONTAINER_ID);
        if (!container) return { ok: false, reason: 'missing-container', count: 0 };

        let items = [];
        try {
            items = buildItems();
        } catch (error) {
            // 要点是辅助信息，失败绝不能影响教师卡片主体。
            console.warn('[teacher-highlights] 生成要点失败:', error);
            items = [];
        }

        if (!items.length) {
            container.hidden = true;
            container.innerHTML = '';
            return { ok: true, count: 0 };
        }

        container.innerHTML = `
            <div class="summary-highlights-head">
                <strong>本次决策摘要</strong>
                <span class="summary-highlights-note">只汇总规模与提示，不对个人下结论</span>
            </div>
            <ul class="summary-highlights-list">
                ${items.map((item) => `<li class="summary-highlights-item" data-insight-source="${escapeHtml(item.source)}"><span class="summary-highlights-copy">${item.text}</span><span class="summary-highlights-meta"><span class="summary-highlights-src">来源：${escapeHtml(item.source)}</span></span></li>`).join('')}
            </ul>`;
        container.hidden = false;
        // 只通知展示层补充「核对」入口；不改变教师评价的指标和结果。
        if (typeof root.CustomEvent === 'function') {
            root.dispatchEvent(new root.CustomEvent('school:decision-brief-render', { detail: { containerId: CONTAINER_ID } }));
        }
        return { ok: true, count: items.length };
    }

    root.renderTeacherHighlights = renderTeacherHighlights;
    root.TeacherHighlightsRuntime = { render: renderTeacherHighlights, buildItems };
})(typeof window !== 'undefined' ? window : null);
