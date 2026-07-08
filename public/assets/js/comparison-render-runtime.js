// comparison-render-runtime.js — Comparison views, mutual aid groups, findPreviousRecord, getStudentExamHistory (extracted from app.js)

const comparisonEscapeHtml = typeof window.tmEscapeHtml === 'function'
    ? window.tmEscapeHtml
    : (value) => String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

function setSingleSelectOptions(selectEl, values, placeholderText, preferredValue) {
    if (!selectEl) return '';
    const list = Array.isArray(values)
        ? values.map(v => String(v || '').trim()).filter(Boolean)
        : [];
    let html = '';
    if (placeholderText !== null && placeholderText !== undefined) {
        html += `<option value="">${placeholderText}</option>`;
    }
    html += list.map(value => `<option value="${comparisonEscapeHtml(value)}">${comparisonEscapeHtml(value)}</option>`).join('');
    selectEl.innerHTML = html;

    const preferred = preferredValue == null ? '' : String(preferredValue).trim();
    if (preferred && list.includes(preferred)) {
        selectEl.value = preferred;
    } else if (placeholderText === null && list.length) {
        selectEl.value = list[0];
    } else {
        selectEl.value = '';
    }
    return selectEl.value;
}

function setMultiSelectOptions(selectEl, values, preferredValues) {
    if (!selectEl) return;
    const list = Array.isArray(values)
        ? values.map(v => String(v || '').trim()).filter(Boolean)
        : [];
    const preferredSet = new Set((preferredValues || []).map(v => String(v || '').trim()).filter(Boolean));
    selectEl.innerHTML = list.map(value => `<option value="${value}">${value}</option>`).join('');
    Array.from(selectEl.options).forEach(option => {
        option.selected = preferredSet.has(option.value);
    });
}

function getSchoolClassOptions(schoolName) {
    if (window.RankingDataService && typeof window.RankingDataService.getClassesForSchool === 'function') {
        return window.RankingDataService.getClassesForSchool(RAW_DATA, schoolName);
    }
    const schoolRecord = getAppSchoolRecord(schoolName);
    if (!schoolName || !schoolRecord || !Array.isArray(schoolRecord.students)) return [];
    return [...new Set(schoolRecord.students.map(s => s.class).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
}

function updateMutualAidSelects() {
    const sourceEl = document.getElementById('aid_source');
    const schSel = document.getElementById('aidSchoolSelect');
    const clsSel = document.getElementById('aidClassSelect');
    const subSel = document.getElementById('aidSubjectSelect');
    if (!sourceEl || !schSel || !clsSel || !subSel) return;
    const source = sourceEl.value;
    const prevSchool = schSel.value;
    const prevClass = clsSel.value;
    const prevSubject = subSel.value;
    if (source === 'freshman') {
        schSel.disabled = true;
        schSel.onchange = null;
        schSel.innerHTML = '<option value="SIM">🎌 新生模拟数据</option>';
        schSel.value = 'SIM';

        const classes = Object.keys(FB_SIMULATED_DATA || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
        clsSel.disabled = classes.length === 0;
        setSingleSelectOptions(clsSel, classes, classes.length ? '--班级--' : '(暂无数据)', prevClass);

        subSel.disabled = true;
        subSel.innerHTML = '<option value="total">入学总分</option>';
        subSel.value = 'total';
        return;
    }

    schSel.disabled = false;
    clsSel.disabled = false;
    setSingleSelectOptions(
        schSel,
        Object.keys(SCHOOLS || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true })),
        '--请选择学校--',
        prevSchool
    );

    const syncAidClasses = (preferredClass) => {
        setSingleSelectOptions(clsSel, getSchoolClassOptions(schSel.value), '--班级--', preferredClass);
    };

    schSel.onchange = () => syncAidClasses(clsSel.value);
    syncAidClasses(prevClass);

    subSel.disabled = false;
    subSel.innerHTML = `<option value="total">总分(综合)</option>${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}`;
    subSel.value = (prevSubject === 'total' || SUBJECTS.includes(prevSubject)) ? prevSubject : 'total';
}

function renderMutualAidGroups() {
    const source = document.getElementById('aid_source').value;
    const sch = document.getElementById('aidSchoolSelect').value;
    const cls = document.getElementById('aidClassSelect').value;
    const sub = document.getElementById('aidSubjectSelect').value;
    const groupSizeInput = document.getElementById('aidGroupSize');
    const groupSize = Math.max(2, parseInt(groupSizeInput && groupSizeInput.value, 10) || 4);
    if (groupSizeInput && String(groupSizeInput.value) !== String(groupSize)) {
        groupSizeInput.value = groupSize;
    }
    let students = [];
    if (source === 'freshman') {
        if (!cls || !FB_SIMULATED_DATA[cls]) return alert("无分班数据");
        students = FB_SIMULATED_DATA[cls].map(s => ({ ...s, class: cls, total: s.score, scores: { total: s.score }, ranks: { total: { class: 0 } } }));
    } else {
        if (!sch || !cls) return alert("请选择学校和班级");
        const schoolRecord = getAppSchoolRecord(sch);
        students = JSON.parse(JSON.stringify((schoolRecord?.students || []).filter(s => s.class === cls)));
    }
    if (students.length < groupSize) return alert("班级人数不足以分组");
    const getScore = (s) => (sub === 'total' ? s.total : (s.scores[sub] || 0));
    students.sort((a, b) => getScore(b) - getScore(a));
    students.forEach((s, i) => s._subRankPct = (i + 1) / students.length);
    let totalSorted = [...students].sort((a, b) => b.total - a.total);
    totalSorted.forEach((s, i) => { let target = students.find(x => x.name === s.name); if (target) target._totalRankPct = (i + 1) / students.length; });
    let mentors = students.filter(s => s._subRankPct <= 0.25 && s._totalRankPct <= 0.40);
    if (mentors.length < (students.length / groupSize) * 0.5) { mentors = students.filter(s => s._subRankPct <= 0.25 && s._totalRankPct <= 0.50); }
    const targetGroupCount = Math.ceil(students.length / groupSize);
    if (mentors.length < targetGroupCount) { mentors = students.slice(0, targetGroupCount); }
    mentors = mentors.slice(0, targetGroupCount);
    let remaining = students.filter(s => !mentors.includes(s));
    let groups = mentors.map((m, i) => ({ id: i + 1, leader: m, members: [] }));
    remaining.sort((a, b) => getScore(b) - getScore(a));
    let direction = 1; let gIdx = 0;
    while (remaining.length > 0) {
        let student = remaining.shift(); groups[gIdx].members.push(student);
        gIdx += direction;
        if (gIdx >= groups.length) { gIdx = groups.length - 1; direction = -1; } else if (gIdx < 0) { gIdx = 0; direction = 1; }
    }
    AID_GROUPS_CACHE = groups;
    renderAidGroupsHTML(groups, sub);
}

function renderAidGroupsHTML(groups, sub) {
    const container = document.getElementById('aid-groups-container'); container.innerHTML = '';
    const aidGroupFragment = document.createDocumentFragment();
    groups.forEach(g => {
        const allScores = [g.leader, ...g.members].map(s => sub === 'total' ? s.total : (s.scores[sub] || 0)); const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        const membersHtml = g.members.map(m => {
            const score = sub === 'total' ? m.total : (m.scores[sub] || 0); let tag = ''; if (m._subRankPct > 0.8) tag = `<span class="aid-tag tag-weak">需帮扶</span>`;
            return `<div class="aid-role-row aid-member"><div class="aid-avatar">${comparisonEscapeHtml(m.name[0])}</div><div class="aid-info"><div class="aid-name">${comparisonEscapeHtml(m.name)} ${tag}</div><div class="aid-score">${sub}: ${score}</div></div></div>`;
        }).join('');
        const leaderScore = sub === 'total' ? g.leader.total : (g.leader.scores[sub] || 0);
        const card = document.createElement('div'); card.className = 'aid-card';
        card.innerHTML = `<div class="aid-header"><span>第 ${g.id} 组</span><span style="font-weight:normal; color:#666;">均分: ${avg.toFixed(1)}</span></div><div class="aid-body"><div class="aid-role-row aid-leader"><div class="aid-avatar">组</div><div class="aid-info"><div class="aid-name">${comparisonEscapeHtml(g.leader.name)} <span class="aid-tag tag-strong">组长</span></div><div class="aid-score">${sub}: ${leaderScore}</div></div></div>${membersHtml}</div>`;
        aidGroupFragment.appendChild(card);
    });
    container.appendChild(aidGroupFragment);
}

function exportMutualAidGroups() {
    if (AID_GROUPS_CACHE.length === 0) return alert("请先生成分组");
    const wb = XLSX.utils.book_new(); const data = [['组号', '角色', '姓名', '参考分数']];
    AID_GROUPS_CACHE.forEach(g => {
        const sub = document.getElementById('aidSubjectSelect').value; const getS = (s) => sub === 'total' ? s.total : (s.scores[sub] || 0);
        data.push([g.id, '组长', g.leader.name, getS(g.leader)]);
        g.members.forEach(m => { data.push([g.id, '组员', m.name, getS(m)]); });
        data.push(['', '', '', '']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "学科互助分组"); XLSX.writeFile(wb, "互助分组名单.xlsx");
}

function generateStudentComment(student) {
    const style = 'encouraging';
    const teacherName = '老师'; // 默认称呼
    const totalRank = safeGet(student, 'ranks.total.township', 99999); const totalStudents = RAW_DATA.length || 1; const percentile = totalRank / totalStudents;
    const progressCache = readProgressCacheState();
    let progress = 0; if (progressCache.length > 0) { const progRecord = progressCache.find(p => p.name === student.name && p.class === student.class); if (progRecord) progress = progRecord.change; }
    let bestSub = { name: '', rank: 99999 }; let worstSub = { name: '', rank: 0 };
    SUBJECTS.forEach(sub => { const r = safeGet(student, `ranks.${sub}.township`, 0); if (r > 0) { if (r < bestSub.rank) bestSub = { name: sub, rank: r }; if (r > worstSub.rank) worstSub = { name: sub, rank: r }; } });
    const isPartial = (worstSub.rank - bestSub.rank) > (totalStudents * 0.4);
    const phrases = {
        opening: { top: [`${student.name}同学，你一直是班级的领头羊。`, `你优秀的成绩证明了你的努力和天赋。`], mid: [`${student.name}同学，你是一个潜力巨大的学生。`, `你的成绩保持在班级中游，基础比较扎实。`], low: [`${student.name}同学，老师看到了你身上的闪光点。`, `虽然目前的成绩不尽如人意，但只要不放弃，总有希望。`] },
        progress: { up: [`本次考试你进步了${progress}名，这是你辛勤付出的回报！`, `欣喜地看到你的排名在稳步上升，继续保持！`], down: [`本次排名有所下滑，我们需要一起找找原因。`, `最近是不是有些分心？成绩出现了一点波动。`], flat: [`你的成绩非常稳定，保持这种状态很难得。`] },
        subjects: { partial: [`你的${bestSub.name}非常有优势，但${worstSub.name}稍微拖了后腿，如果能平衡一下，总分会更高。`, `要警惕偏科现象，${worstSub.name}学科需要投入更多精力。`], balanced: [`各科发展比较均衡，没有明显的短板，这是你的核心竞争力。`, `全面发展是你最大的优势，请继续保持这种良好的学习节奏。`] },
        advice: { encouraging: [`相信自己，你一定行！${teacherName}老师会一直支持你。`, `期待在下次光荣榜上看到更耀眼的你！`] }
    };
    let parts = []; let tier = 'mid'; if (percentile <= 0.15) tier = 'top'; else if (percentile >= 0.75) tier = 'low';
    parts.push(phrases.opening[tier][Math.floor(Math.random() * phrases.opening[tier].length)]);
    if (Math.abs(progress) >= 10) { let pType = progress > 0 ? 'up' : 'down'; parts.push(phrases.progress[pType][Math.floor(Math.random() * phrases.progress[pType].length)]); } else { if (Math.random() > 0.5) parts.push(phrases.progress.flat[Math.floor(Math.random() * phrases.progress.flat.length)]); }
    if (isPartial) { parts.push(phrases.subjects.partial[Math.floor(Math.random() * phrases.subjects.partial.length)]); } else { parts.push(phrases.subjects.balanced[Math.floor(Math.random() * phrases.subjects.balanced.length)]); }
    parts.push(phrases.advice[style][Math.floor(Math.random() * phrases.advice[style].length)]);
    return parts.join("");
}

function getComparisonTotalSubjects() {
    const subsForTotal = (CONFIG.totalSubs === 'auto') ? SUBJECTS : CONFIG.totalSubs;
    return Array.isArray(subsForTotal) ? subsForTotal.filter(Boolean) : [];
}

const ComparisonRankContextPerfCache = {
    maxEntries: 4,
    contexts: new Map()
};

function buildComparisonRankContextSignature(allStudents, totalSubjects = getComparisonTotalSubjects()) {
    const rows = Array.isArray(allStudents) ? allStudents : [];
    const first = rows[0] || {};
    const last = rows[rows.length - 1] || {};
    let totalChecksum = 0;
    for (let i = 0; i < rows.length; i += 1) {
        totalChecksum += Number(rows[i]?.total) || 0;
    }
    return [
        window.__RAW_DATA_VERSION || 0,
        window.CURRENT_EXAM_ID || '',
        rows.length,
        totalChecksum.toFixed(2),
        totalSubjects.join('|'),
        getReportStudentIdentity(first),
        getReportStudentIdentity(last)
    ].join('::');
}

function buildComparisonStudentRankContext(allStudents, totalSubjects = getComparisonTotalSubjects()) {
    const rows = Array.isArray(allStudents) ? allStudents.filter(Boolean) : [];
    const keyOf = (row) => `${String(row?.school || '').trim()}::${String(row?.class || '').trim()}::${String(row?.name || '').trim()}`;
    const classKeyOf = (value) => (typeof normalizeClass === 'function')
        ? normalizeClass(value)
        : String(value || '').trim();
    const withTotals = rows
        .map(row => ({ row, total: getComparisonTotalValue(row, totalSubjects) }))
        .filter(item => Number.isFinite(item.total));
    const townshipSourceRows = (() => {
        if (typeof filterRowsToTownshipSchools !== 'function') return rows;
        const filtered = filterRowsToTownshipSchools(rows);
        return filtered.length ? filtered : rows;
    })();
    const townshipKeys = new Set(townshipSourceRows.map(row => keyOf(row)));
    const townshipWithTotals = withTotals.filter(item => townshipKeys.has(keyOf(item.row)));
    const townRankMap = buildCompetitionRankMap(townshipWithTotals, item => keyOf(item.row), item => item.total);
    const countyRankMap = buildCompetitionRankMap(withTotals, item => keyOf(item.row), item => item.total);
    const totalsBySchool = new Map();
    const totalsByClass = new Map();
    withTotals.forEach((item) => {
        const schoolKey = String(item.row?.school || '').trim();
        const classKey = classKeyOf(item.row?.class || '');
        if (!totalsBySchool.has(schoolKey)) totalsBySchool.set(schoolKey, []);
        totalsBySchool.get(schoolKey).push(item);
        const classCacheKey = `${schoolKey}::${classKey}`;
        if (!totalsByClass.has(classCacheKey)) totalsByClass.set(classCacheKey, []);
        totalsByClass.get(classCacheKey).push(item);
    });
    const schoolRankMaps = new Map();
    const classRankMaps = new Map();
    const resolveRankSchoolKey = (school) => {
        const requested = String(school || '').trim();
        if (totalsBySchool.has(requested)) return requested;
        return Array.from(totalsBySchool.keys()).find(key => sameAppSchoolName(key, requested)) || requested;
    };

    const getSchoolRankMap = (school) => {
        const schoolKey = resolveRankSchoolKey(school);
        if (!schoolRankMaps.has(schoolKey)) {
            schoolRankMaps.set(
                schoolKey,
                buildCompetitionRankMap(
                    totalsBySchool.get(schoolKey) || [],
                    item => keyOf(item.row),
                    item => item.total
                )
            );
        }
        return schoolRankMaps.get(schoolKey);
    };

    const getClassRankMap = (school, className) => {
        const schoolKey = resolveRankSchoolKey(school);
        const classKey = classKeyOf(className);
        const cacheKey = `${schoolKey}::${classKey}`;
        if (!classRankMaps.has(cacheKey)) {
            classRankMaps.set(
                cacheKey,
                buildCompetitionRankMap(
                    totalsByClass.get(cacheKey) || [],
                    item => keyOf(item.row),
                    item => item.total
                )
            );
        }
        return classRankMaps.get(cacheKey);
    };

    return {
        totalSubjects,
        rows,
        withTotals,
        keyOf,
        townRankMap,
        countyRankMap,
        getSchoolRankMap,
        getClassRankMap
    };
}

function getCachedComparisonStudentRankContext(allStudents = RAW_DATA, totalSubjects = getComparisonTotalSubjects()) {
    const signature = buildComparisonRankContextSignature(allStudents, totalSubjects);
    if (ComparisonRankContextPerfCache.contexts.has(signature)) {
        const cached = ComparisonRankContextPerfCache.contexts.get(signature);
        ComparisonRankContextPerfCache.contexts.delete(signature);
        ComparisonRankContextPerfCache.contexts.set(signature, cached);
        return cached;
    }
    const context = buildComparisonStudentRankContext(allStudents, totalSubjects);
    ComparisonRankContextPerfCache.contexts.set(signature, context);
    while (ComparisonRankContextPerfCache.contexts.size > ComparisonRankContextPerfCache.maxEntries) {
        const firstKey = ComparisonRankContextPerfCache.contexts.keys().next().value;
        if (!firstKey) break;
        ComparisonRankContextPerfCache.contexts.delete(firstKey);
    }
    return context;
}

function getComparisonStudentView(record, allStudents = RAW_DATA, comparisonContext = null) {
    if (!record || typeof record !== 'object') return record;
    try {
        return createComparisonStudentView(
            record,
            allStudents,
            comparisonContext || getCachedComparisonStudentRankContext(allStudents)
        );
    } catch (error) {
        console.warn('[report] failed to normalize comparison student view:', error);
        return record;
    }
}

function getComparisonStudentList(records, allStudents = RAW_DATA) {
    if (!Array.isArray(records)) return [];
    const comparisonContext = getCachedComparisonStudentRankContext(allStudents);
    return records.map(record => getComparisonStudentView(record, allStudents, comparisonContext));
}

Object.assign(window, {
    buildComparisonStudentRankContext,
    getCachedComparisonStudentRankContext,
    getComparisonStudentView,
    getComparisonStudentList
});

function formatComparisonExamLabel(rawLabel, fallback = '本次') {
    const raw = String(rawLabel || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    if (!raw) return fallback;
    const tokens = raw.split(' ').filter(Boolean);
    if (tokens.length >= 4) return tokens.slice(-4).join(' ');
    return raw.length > 28 ? raw.slice(-28) : raw;
}

function getLatestHistoryExamEntry(student, passedHistory = null) {
    const history = Array.isArray(passedHistory)
        ? passedHistory
        : (typeof getStudentExamHistory === 'function' ? getStudentExamHistory(student) : []);
    const currentExamId = getEffectiveCurrentExamId();

    return history
        .filter(entry => {
            const entryKey = entry?.examFullKey || entry?.examId;
            return !currentExamId || (
                !examKeyEq(entryKey, currentExamId) &&
                !examKeyEq(entry?.examId, currentExamId)
            );
        })
        .sort((a, b) => {
            const timeA = Number(a?.createdAt || a?.student?.updatedAt || 0);
            const timeB = Number(b?.createdAt || b?.student?.updatedAt || 0);
            if (timeA !== timeB) return timeA - timeB;
            return String(a?.examFullKey || a?.examId || '').localeCompare(String(b?.examFullKey || b?.examId || ''));
        })
        .slice(-1)[0] || null;
}

function getComparisonTotalValue(record, subjects) {
    if (!record || !record.scores || typeof record.scores !== 'object') {
        return (typeof record?.total === 'number' && Number.isFinite(record.total)) ? record.total : null;
    }

    const totalSubjects = Array.isArray(subjects) && subjects.length ? subjects : getComparisonTotalSubjects();
    if (!totalSubjects.length) {
        return (typeof record.total === 'number' && Number.isFinite(record.total)) ? record.total : null;
    }

    let sum = 0;
    let matchCount = 0;
    totalSubjects.forEach(sub => {
        const score = Number(record.scores?.[sub]);
        if (Number.isFinite(score)) {
            sum += score;
            matchCount++;
        }
    });

    if (matchCount === totalSubjects.length) {
        return parseFloat(sum.toFixed(1));
    }

    return (typeof record.total === 'number' && Number.isFinite(record.total)) ? record.total : null;
}

function resolveIsClassEquivalent(leftClass, rightClass) {
    if (typeof window.isClassEquivalent === 'function') {
        return window.isClassEquivalent(leftClass, rightClass);
    }
    if (window.CompareCloudContextRuntime && typeof window.CompareCloudContextRuntime.isClassEquivalent === 'function') {
        return window.CompareCloudContextRuntime.isClassEquivalent(leftClass, rightClass);
    }
    return String(leftClass || '').trim() === String(rightClass || '').trim();
}

function readCloudPreviousRecordForStudent(student) {
    if (typeof window.getCloudCompareHint === 'function') {
        return window.getCloudCompareHint(student)?.previousRecord || null;
    }
    if (typeof window.getCloudPreviousRecord === 'function') {
        return window.getCloudPreviousRecord(student) || null;
    }
    const cloudCompareContext = readCloudStudentCompareContextState();
    if (cloudCompareContext?.previousRecord && isCloudContextLikelyCurrentTarget(student)) {
        return cloudCompareContext.previousRecord;
    }
    return null;
}

function createComparisonStudentView(record, allStudents, comparisonContext = null) {
    if (!record || typeof record !== 'object') return record;

    const totalSubjects = comparisonContext?.totalSubjects || getComparisonTotalSubjects();
    const normalizedTotal = getComparisonTotalValue(record, totalSubjects);
    const view = {
        ...record,
        scores: { ...(record.scores || {}) },
        ranks: {
            ...(record.ranks || {}),
            total: { ...((record.ranks && record.ranks.total) || {}) }
        }
    };

    if (typeof normalizedTotal === 'number' && Number.isFinite(normalizedTotal)) {
        view.total = normalizedTotal;
    }

    const context = comparisonContext || buildComparisonStudentRankContext(allStudents, totalSubjects);
    if (!context.withTotals.length) return view;

    const targetKey = context.keyOf(record);
    const schoolRankMap = context.getSchoolRankMap(record.school);
    const classRankMap = context.getClassRankMap(record.school, record.class);
    const countyRank = context.countyRankMap.get(targetKey) ?? view.ranks.total.county ?? view.countyRank ?? '-';

    view.ranks.total = {
        ...view.ranks.total,
        township: context.townRankMap.get(targetKey) ?? view.ranks.total.township ?? '-',
        county: countyRank,
        school: schoolRankMap.get(targetKey) ?? view.ranks.total.school ?? '-',
        class: classRankMap.get(targetKey) ?? view.ranks.total.class ?? '-'
    };
    if (countyRank !== '-') view.countyRank = countyRank;

    return view;
}

function recalcPrevTotal(prevRecord) {
    if (!prevRecord || !prevRecord.scores || typeof prevRecord.scores !== 'object') return '-';
    const subsForTotal = getComparisonTotalSubjects();
    if (!subsForTotal || subsForTotal.length === 0) {
        return (typeof prevRecord.total === 'number') ? prevRecord.total : '-';
    }
    let sum = 0, matchCount = 0;
    subsForTotal.forEach(sub => {
        const score = prevRecord.scores[sub];
        if (typeof score === 'number' && Number.isFinite(score)) {
            sum += score;
            matchCount++;
        }
    });
    if (matchCount === 0 || matchCount < subsForTotal.length) return '-';
    return sum;
}

function findPreviousRecord(student) {
    const cloudPrev = readCloudPreviousRecordForStudent(student);
    if (cloudPrev) {
        return cloudPrev;
    }

    const cleanStr = (str) => String(str || "").trim().replace(/\s+/g, "");
    const normClass = (cls) => {
        let s = String(cls || "").trim();
        return s.replace(/[班级\(\)\.\-gradeclass]/gi, "");
    };
    const matchStudent = (p, targetName, targetClass, targetSchool) => {
        const sObj = p.student || p;
        if (sObj.school && targetSchool && !areSchoolNamesEquivalent(sObj.school, targetSchool)) return false;
        if (cleanStr(sObj.name) !== targetName) return false;
        const histClass = normClass(sObj.class);
        if (histClass === targetClass) return true;
        const numC1 = histClass.replace(/0/g, '');
        const numC2 = targetClass.replace(/0/g, '');
        if (numC1 === numC2 && numC1.length > 0) return true;
        return false;
    };

    const targetName = cleanStr(student.name);
    const targetClass = normClass(student.class);
    const targetSchool = student.school;
    const getRecordTime = (row) => {
        const raw = row?.updatedAt || row?.createdAt || row?.student?.updatedAt || 0;
        const asNum = Number(raw);
        if (Number.isFinite(asNum) && asNum > 0) return asNum;
        const asDate = new Date(raw).getTime();
        return Number.isFinite(asDate) ? asDate : 0;
    };

    const currentExamId = getEffectiveCurrentExamId();
    const currentFingerprint = typeof getCurrentReportDataFingerprint === 'function'
        ? getCurrentReportDataFingerprint()
        : computeExamDataFingerprint(RAW_DATA || []);


    if (window.PREV_DATA && window.PREV_DATA.length > 0) {
        const otherExams = window.PREV_DATA.filter(p => {
            const hid = p.examFullKey || p.examId;
            const sameExam = currentExamId && (examKeyEq(hid, currentExamId) || examKeyEq(p.examId, currentExamId));
            const sameFingerprint = currentFingerprint && p?.fingerprint && String(p.fingerprint) === currentFingerprint;
            return !sameExam && !sameFingerprint;
        }).sort((a, b) => getRecordTime(b) - getRecordTime(a));
        const match = otherExams.find(p => matchStudent(p, targetName, targetClass, targetSchool));
        if (match) return match;
    }

    if (typeof CohortDB !== 'undefined') {
        try {
            const db = CohortDB.ensure();
            if (db && db.exams && Object.keys(db.exams).length > 0) {
                const examEntries = Object.entries(db.exams)
                    .filter(([id]) => !currentExamId || !examKeyEq(id, currentExamId))
                    .sort(compareExamRecordsByDateDesc);

                for (const [examId, exam] of examEntries) {
                    const examData = exam.data || [];
                    if (examData.length === 0) continue;
                    const examFingerprint = getReportExamFingerprint(exam, examData);
                    if (currentFingerprint && examFingerprint && examFingerprint === currentFingerprint) continue;

                    const found = getCachedHistoryExamStudent(examData, student, examFingerprint);
                    if (found) {
                        appDebug(`[对比] 从历史考试 "${examId}" 中找到 ${student.name} 的历史记录`);
                        return {
                            ...found,
                            townRank: found.ranks?.total?.township || '-',
                            classRank: found.ranks?.total?.class || '-',
                            schoolRank: found.ranks?.total?.school || '-',
                            _sourceExam: examId
                        };
                    }
                }
            }
        } catch (e) {
            console.warn('[对比] COHORT_DB 历史查找异常:', e);
        }
    }
    const user = getCurrentUser();
    const isParentOrStudent = user && RoleManager.hasAnyRole(user, ['parent', 'student']) &&
        !RoleManager.hasAnyRole(user, ['admin', 'director', 'grade_director', 'teacher', 'class_teacher']);
    if (!readCloudStudentCompareContextState()?.previousRecord && !isParentOrStudent) {
        console.warn("历史数据(PREV_DATA)为空且COHORT_DB中无历史快照，无法进行对比。");
    }

    return null;
}

function getStudentExamHistory(student) {
    const results = [];
    if (!student) return results;
    const reportCache = getStudentReportPerformanceRuntime();
    const historyCacheKey = buildStudentReportCacheKey(student, 'HISTORY');
    const cachedHistory = reportCache?.getHistory?.(historyCacheKey);
    if (Array.isArray(cachedHistory)) return cachedHistory;

    const cleanStr = (str) => String(str || "").trim().replace(/\s+/g, "");
    const normClass = (cls) => String(cls || "").trim().replace(/[班级\(\)\.\-gradeclass]/gi, "");
    const getHistoryKey = (row) => String(row?.examFullKey || row?.examId || '').trim();
    const getHistoryTime = (row) => {
        const raw = row?.createdAt || row?.student?.updatedAt || row?.updatedAt || 0;
        const asNum = Number(raw);
        if (Number.isFinite(asNum) && asNum > 0) return asNum;
        const asDate = new Date(raw).getTime();
        return Number.isFinite(asDate) ? asDate : 0;
    };
    const targetName = cleanStr(student.name);
    const targetClass = normClass(student.class);
    const targetSchool = student.school;
    const currentExamId = getEffectiveCurrentExamId();
    const currentFingerprint = getCurrentReportDataFingerprint();
    const isTargetStudent = (row) => {
        const sObj = row?.student || row || {};
        if (sObj.school && targetSchool && !areSchoolNamesEquivalent(sObj.school, targetSchool)) return false;
        if (cleanStr(sObj.name) !== targetName) return false;
        const histClass = normClass(sObj.class);
        if (histClass === targetClass) return true;
        const numC1 = histClass.replace(/0/g, '');
        const numC2 = targetClass.replace(/0/g, '');
        return numC1 === numC2 && numC1.length > 0;
    };

    if (typeof CohortDB === 'undefined') return results;

    const manualExams = [];
    ['reportCompareExam1', 'reportCompareExam2', 'reportCompareExam3'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value) manualExams.push(el.value);
    });

    try {
        const db = CohortDB.ensure();
        if (!db || !db.exams) return results;

        const examEntries = Object.entries(db.exams)
            .sort(compareExamRecordsByDateAsc);
        const comparisonContextByExam = new Map();
        const getExamComparisonContext = (examId, examFingerprint, examData) => {
            const contextKey = `${String(examFingerprint || examId || '').trim()}::${Array.isArray(examData) ? examData.length : 0}`;
            if (comparisonContextByExam.has(contextKey)) return comparisonContextByExam.get(contextKey);
            const context = typeof getCachedComparisonStudentRankContext === 'function'
                ? getCachedComparisonStudentRankContext(examData)
                : null;
            comparisonContextByExam.set(contextKey, context);
            return context;
        };
        const hasUsableStoredHistoryRanks = (row) => {
            const totalRanks = row?.ranks?.total;
            if (!totalRanks || typeof totalRanks !== 'object') return false;
            return ['class', 'school', 'township', 'county'].some(key => {
                const value = totalRanks[key];
                return value !== undefined && value !== null && value !== '';
            });
        };
        const createHistoryStudentView = (found, examId, examFingerprint, examData) => {
            if (hasUsableStoredHistoryRanks(found)) {
                return {
                    ...found,
                    scores: { ...(found.scores || {}) },
                    ranks: {
                        ...(found.ranks || {}),
                        total: { ...((found.ranks && found.ranks.total) || {}) }
                    }
                };
            }
            const comparisonContext = getExamComparisonContext(examId, examFingerprint, examData);
            return createComparisonStudentView(found, examData, comparisonContext);
        };

        for (const [examId, exam] of examEntries) {
            const examData = exam.data || [];
            if (examData.length === 0) continue;
            const examFingerprint = getReportExamFingerprint(exam, examData);
            if (currentFingerprint && examFingerprint && examFingerprint === currentFingerprint && !examKeyEq(examId, currentExamId)) {
                continue;
            }

            if (manualExams.length > 0 && !manualExams.some(id => examKeyEq(examId, id)) && !examKeyEq(examId, currentExamId)) {
                continue;
            }

            const found = getCachedHistoryExamStudent(examData, student, examFingerprint);

            if (found) {
                const normalizedStudent = createHistoryStudentView(found, examId, examFingerprint, examData);

                results.push({
                    examId,
                    examFullKey: exam.examFullKey || examId, // 记录全名
                    examLabel: examId.replace(/_/g, ' '),
                    meta: exam.meta || {},
                    createdAt: exam.createdAt || 0,
                    updatedAt: exam.updatedAt || 0,
                    fingerprint: examFingerprint,
                    student: normalizedStudent,
                    percentiles: {},
                    allStudents: examData
                });
            }
        }
    } catch (e) {
        console.warn('[多期对比] 获取学生本地考试历史异常:', e);
    }

    if (window.PREV_DATA && Array.isArray(window.PREV_DATA)) {
        window.PREV_DATA.forEach(h => {
            if (!isTargetStudent(h)) return;
            const matchKey = getHistoryKey(h);
            if (currentFingerprint && h?.fingerprint && String(h.fingerprint) === currentFingerprint && !examKeyEq(matchKey, currentExamId)) {
                return;
            }
            if (manualExams.length > 0 && !manualExams.some(id => examKeyEq(matchKey, id)) && !examKeyEq(matchKey, currentExamId)) {
                return;
            }
            if (!matchKey) return;

            const normalized = {
                ...h,
                examFullKey: h.examFullKey || h.examId,
                examId: h.examId || h.examFullKey,
                examLabel: String(h.examLabel || h.examId || h.examFullKey || '').replace(/_/g, ' '),
                fingerprint: h.fingerprint || ''
            };
            const existsIdx = results.findIndex(r => examKeyEq(getHistoryKey(r), matchKey));
            if (existsIdx === -1) {
                results.push(normalized);
            } else if (getHistoryTime(normalized) > getHistoryTime(results[existsIdx])) {
                results[existsIdx] = normalized;
            }
        });
    }

    const dedupedResults = [];
    const getHistoryIdentity = (entry) => getCompareExamIdentity({
        id: entry?.examFullKey || entry?.examId || '',
        label: entry?.examLabel || ''
    });
    results.forEach(item => {
        const matchKey = getHistoryKey(item);
        const identity = getHistoryIdentity(item);
        const existingIdx = dedupedResults.findIndex(existing => {
            const existingKey = getHistoryKey(existing);
            if (matchKey && existingKey && examKeyEq(existingKey, matchKey)) return true;
            return !!identity && identity === getHistoryIdentity(existing);
        });
        if (existingIdx === -1) {
            dedupedResults.push(item);
            return;
        }
        const existing = dedupedResults[existingIdx];
        const keep = pickPreferredExamEntry({
            id: existing.examFullKey || existing.examId,
            source: existing.source || 'local',
            sortTs: getHistoryTime(existing),
            label: existing.examLabel,
            payload: existing
        }, {
            id: item.examFullKey || item.examId,
            source: item.source || 'local',
            sortTs: getHistoryTime(item),
            label: item.examLabel,
            payload: item
        });
        dedupedResults[existingIdx] = keep.payload;
    });

    dedupedResults.sort((a, b) => {
        const timeA = getExamRecordDateSortTimestamp(getHistoryKey(a), a);
        const timeB = getExamRecordDateSortTimestamp(getHistoryKey(b), b);
        if (timeA !== timeB) return timeA - timeB;
        return getHistoryKey(a).localeCompare(getHistoryKey(b));
    });

    reportCache?.setHistory?.(historyCacheKey, dedupedResults);
    return dedupedResults;
}

// 🟢 [新增]：生成进退步胶囊标签 (Windows 风格)


