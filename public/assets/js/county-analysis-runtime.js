(() => {
    if (typeof window === 'undefined' || window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__) return;

    const SCOPE_KEY = 'COUNTY_ANALYSIS_SCOPE_V1';
    const HISTORY_KEY = 'COUNTY_ANALYSIS_HISTORY_V1';
    const state = {
        promptArmed: false,
        lastSignature: ''
    };

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[ch]);
    }

    function toNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function formatNumber(value, digits = 2) {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(digits) : '-';
    }

    function formatPercent(value) {
        const num = Number(value);
        return Number.isFinite(num) ? `${(num * 100).toFixed(1)}%` : '-';
    }

    function getExamKey() {
        return String(
            window.CURRENT_EXAM_ID
            || (typeof window.readWorkspaceExamId === 'function' ? window.readWorkspaceExamId() : '')
            || window.COHORT_DB?.currentExamId
            || 'current'
        ).trim() || 'current';
    }

    function getSchoolNames() {
        return Object.keys(window.SCHOOLS || {}).filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    function getDataSignature() {
        return [
            getExamKey(),
            (window.RAW_DATA || []).length,
            getSchoolNames().join('|')
        ].join('::');
    }

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('[county-analysis] failed to persist state:', error);
        }
    }

    function getScopeMap() {
        const data = readJson(SCOPE_KEY, {});
        return data && typeof data === 'object' ? data : {};
    }

    function getCurrentScope() {
        return getScopeMap()[getExamKey()] || null;
    }

    function saveCurrentScope(scope) {
        const map = getScopeMap();
        map[getExamKey()] = scope;
        writeJson(SCOPE_KEY, map);
    }

    function parseSchoolList(value) {
        return String(value || '')
            .split(/[,\n，、;；]+/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function normalizeScope(scope) {
        const names = getSchoolNames();
        const nameSet = new Set(names);
        const townshipSchools = (scope?.townshipSchools || []).filter((name) => nameSet.has(name));
        const townshipSet = new Set(townshipSchools);
        const countySchools = names.filter((name) => !townshipSet.has(name));
        return {
            examKey: getExamKey(),
            includesCounty: !!scope?.includesCounty,
            townshipSchools: townshipSchools.length ? townshipSchools : names,
            countySchools: townshipSchools.length ? countySchools : [],
            signature: scope?.signature || getDataSignature(),
            updatedAt: scope?.updatedAt || new Date().toISOString()
        };
    }

    async function promptCountyScopeIfNeeded() {
        const signature = getDataSignature();
        const names = getSchoolNames();
        if (!state.promptArmed || !names.length || signature === state.lastSignature) return getCurrentScope();

        state.promptArmed = false;
        state.lastSignature = signature;

        const existing = getCurrentScope();
        if (existing?.signature === signature) return normalizeScope(existing);

        const includesCounty = window.confirm(
            '本次导入的成绩是否包含县里其他学校？\n\n确定：包含县域学校，系统会增加县排名。\n取消：仅乡镇学校，继续按乡镇口径分析。'
        );

        let townshipSchools = names;
        if (includesCounty) {
            const previousTownship = existing?.townshipSchools?.length ? existing.townshipSchools : names;
            const answer = window.prompt(
                '请输入“本乡镇学校”名单，用逗号分隔。\n\n留空会先把全部学校都作为乡镇范围；后续可再次导入时调整。',
                previousTownship.join('，')
            );
            const parsed = parseSchoolList(answer);
            if (parsed.length) {
                const exactSet = new Set(names);
                townshipSchools = parsed.filter((name) => exactSet.has(name));
                if (!townshipSchools.length) townshipSchools = names;
            }
        }

        const scope = normalizeScope({
            includesCounty,
            townshipSchools,
            signature,
            updatedAt: new Date().toISOString()
        });
        saveCurrentScope(scope);
        applyCountyRanks();
        saveCountySnapshot();
        renderCountyAnalysis();
        decorateAnalysisTable();
        decorateUploadCountyStatus();
        return scope;
    }

    function applyCountyRanks() {
        const scope = normalizeScope(getCurrentScope() || { includesCounty: false, townshipSchools: getSchoolNames() });
        const townshipSet = new Set(scope.townshipSchools || []);
        const schools = Object.values(window.SCHOOLS || {});

        schools
            .slice()
            .sort((a, b) => toNumber(b.score2Rate) - toNumber(a.score2Rate))
            .forEach((school, index) => {
                school.countyScope = townshipSet.has(school.name) ? 'township' : 'county';
                school.countyRank2Rate = index + 1;
                if (school.metrics?.total) school.metrics.total.countyRank2Rate = index + 1;
            });

        schools
            .filter((school) => townshipSet.has(school.name))
            .sort((a, b) => toNumber(b.score2Rate) - toNumber(a.score2Rate))
            .forEach((school, index) => {
                school.townshipRank2Rate = index + 1;
                if (school.metrics?.total) school.metrics.total.townshipRank2Rate = index + 1;
            });

        const rankedAll = (window.RAW_DATA || [])
            .filter((student) => Number.isFinite(Number(student?.total)))
            .slice()
            .sort((a, b) => Number(b.total) - Number(a.total));
        rankedAll.forEach((student, index) => {
            student.countyRank = index + 1;
            student.countyScope = townshipSet.has(student.school) ? 'township' : 'county';
        });

        rankedAll
            .filter((student) => townshipSet.has(student.school))
            .forEach((student, index) => {
                student.townshipRank = index + 1;
            });

        window.COUNTY_ANALYSIS_SCOPE = scope;
        return scope;
    }

    function saveCountySnapshot() {
        const scope = getCurrentScope();
        const names = getSchoolNames();
        if (!scope || !names.length) return;
        const signature = getDataSignature();
        const history = readJson(HISTORY_KEY, []);
        const snapshot = {
            examKey: getExamKey(),
            signature,
            includesCounty: !!scope.includesCounty,
            at: new Date().toISOString(),
            schools: Object.values(window.SCHOOLS || {}).map((school) => ({
                name: school.name,
                scope: school.countyScope || 'township',
                score2Rate: toNumber(school.score2Rate),
                countyRank: school.countyRank2Rate || school.rank2Rate || 0,
                townshipRank: school.townshipRank2Rate || 0
            }))
        };
        const next = history
            .filter((item) => item.signature !== signature && item.examKey !== snapshot.examKey)
            .concat(snapshot)
            .slice(-12);
        writeJson(HISTORY_KEY, next);
    }

    function getTeacherRows(limit = 12) {
        if ((!window.TEACHER_STATS || !Object.keys(window.TEACHER_STATS).length) && typeof window.analyzeTeachers === 'function') {
            try { window.analyzeTeachers(); } catch (error) { console.warn('[county-analysis] analyzeTeachers failed:', error); }
        }
        const rows = [];
        Object.entries(window.TEACHER_STATS || {}).forEach(([teacherName, subjects]) => {
            Object.entries(subjects || {}).forEach(([subject, data]) => {
                const score = toNumber(data.finalScore ?? data.fairScore ?? data.leagueScore ?? data.avgValue ?? data.avg);
                rows.push({
                    teacherName,
                    subject,
                    score,
                    avg: toNumber(data.avgValue ?? data.avg),
                    passRate: toNumber(data.passRate),
                    excellentRate: toNumber(data.excellentRate ?? data.excRate),
                    studentCount: toNumber(data.studentCount ?? data.count),
                    riskLevel: data.riskLevel || 'normal'
                });
            });
        });
        return rows.sort((a, b) => b.score - a.score).slice(0, limit);
    }

    function renderCountyRankTable(scope) {
        const rows = Object.values(window.SCHOOLS || {})
            .slice()
            .sort((a, b) => (a.countyRank2Rate || 9999) - (b.countyRank2Rate || 9999));
        if (!rows.length) return '<div class="county-empty">暂无学校成绩数据，请先导入本次成绩。</div>';
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead>
                        <tr>
                            <th>学校</th>
                            <th>范围</th>
                            <th>人数</th>
                            <th>平均分</th>
                            <th>优秀率</th>
                            <th>及格率</th>
                            <th>两率一分</th>
                            <th>县排名</th>
                            <th>乡镇排名</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((school) => {
                            const metric = school.metrics?.total || {};
                            const isTownship = school.countyScope !== 'county';
                            return `
                                <tr>
                                    <td>${escapeHtml(school.name)}</td>
                                    <td><span class="county-scope-badge ${isTownship ? 'is-township' : 'is-county'}">${isTownship ? '本乡镇' : '县域学校'}</span></td>
                                    <td>${metric.count || 0}</td>
                                    <td>${formatNumber(metric.avg)}</td>
                                    <td>${formatPercent(metric.excRate)}</td>
                                    <td>${formatPercent(metric.passRate)}</td>
                                    <td><strong>${formatNumber(school.score2Rate)}</strong></td>
                                    <td>${school.countyRank2Rate || school.rank2Rate || '-'}</td>
                                    <td>${isTownship ? (school.townshipRank2Rate || '-') : '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderTeacherPortraits() {
        const rows = getTeacherRows(10);
        if (!rows.length) {
            return '<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会按县域样本展示教师教学质量画像。</div>';
        }
        return `
            <div class="county-portrait-grid">
                ${rows.map((row, index) => `
                    <article class="county-portrait-card ${row.riskLevel === 'risk' ? 'is-risk' : ''}">
                        <span class="county-portrait-rank">#${index + 1}</span>
                        <h4>${escapeHtml(row.teacherName)} · ${escapeHtml(row.subject)}</h4>
                        <strong>${formatNumber(row.score, 1)}</strong>
                        <p>均分 ${formatNumber(row.avg, 1)}｜优秀率 ${formatPercent(row.excellentRate)}｜及格率 ${formatPercent(row.passRate)}｜样本 ${row.studentCount}</p>
                    </article>
                `).join('')}
            </div>
        `;
    }

    function renderStudentArchiveRows() {
        const rows = (window.RAW_DATA || [])
            .filter((student) => Number.isFinite(Number(student?.total)))
            .slice()
            .sort((a, b) => (a.countyRank || 9999) - (b.countyRank || 9999))
            .slice(0, 40);
        if (!rows.length) return '<div class="county-empty">暂无学生成绩数据。</div>';
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>县排名</th><th>学生</th><th>学校</th><th>班级</th><th>总分</th><th>乡镇排名</th></tr></thead>
                    <tbody>
                        ${rows.map((student) => `
                            <tr>
                                <td>${student.countyRank || '-'}</td>
                                <td>${escapeHtml(student.name)}</td>
                                <td>${escapeHtml(student.school)}</td>
                                <td>${escapeHtml(student.class || '')}</td>
                                <td>${formatNumber(student.total, 1)}</td>
                                <td>${student.townshipRank || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderHistoryCompare() {
        const history = readJson(HISTORY_KEY, []).filter((item) => item?.schools?.length);
        if (history.length < 2) {
            return '<div class="county-empty">县域历史样本不足。后续再次导入县域成绩后，这里会自动显示县排名变化。</div>';
        }
        const current = history[history.length - 1];
        const previous = history[history.length - 2];
        const previousMap = new Map((previous.schools || []).map((school) => [school.name, school]));
        const rows = (current.schools || [])
            .map((school) => ({ current: school, previous: previousMap.get(school.name) }))
            .filter((item) => item.previous)
            .sort((a, b) => (a.current.countyRank || 9999) - (b.current.countyRank || 9999))
            .slice(0, 20);
        if (!rows.length) return '<div class="county-empty">当前县域学校与上次样本重叠不足，暂不能比较排名变化。</div>';
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>学校</th><th>本次县排名</th><th>上次县排名</th><th>变化</th><th>本次两率一分</th></tr></thead>
                    <tbody>
                        ${rows.map(({ current, previous }) => {
                            const delta = toNumber(previous.countyRank) - toNumber(current.countyRank);
                            return `
                                <tr>
                                    <td>${escapeHtml(current.name)}</td>
                                    <td>${current.countyRank || '-'}</td>
                                    <td>${previous.countyRank || '-'}</td>
                                    <td class="${delta > 0 ? 'text-green' : delta < 0 ? 'text-red' : ''}">${delta > 0 ? `上升 ${delta}` : delta < 0 ? `下降 ${Math.abs(delta)}` : '持平'}</td>
                                    <td>${formatNumber(current.score2Rate)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderCountyAnalysis() {
        const root = document.getElementById('county-analysis-root');
        if (!root) return;
        const scope = applyCountyRanks();
        const names = getSchoolNames();
        const countyCount = scope.countySchools?.length || 0;
        const townshipCount = scope.townshipSchools?.length || 0;
        const totalStudents = (window.RAW_DATA || []).length;
        root.innerHTML = `
            <div class="county-kpi-grid">
                <div><span>本次范围</span><strong>${scope.includesCounty ? '县域 + 乡镇' : '乡镇'}</strong><em>${escapeHtml(getExamKey())}</em></div>
                <div><span>学校数</span><strong>${names.length}</strong><em>乡镇 ${townshipCount}｜县域 ${countyCount}</em></div>
                <div><span>学生样本</span><strong>${totalStudents}</strong><em>已补充县排名字段</em></div>
                <div><span>对比状态</span><strong>${readJson(HISTORY_KEY, []).length}</strong><em>县域历史快照</em></div>
            </div>
            <div class="analysis-anchor-panel">
                <div class="sub-header analysis-section-head">县域两率一分排名</div>
                <div class="analysis-table-meta">
                    <span><strong>口径：</strong>县排名按本次导入的全部学校排序；乡镇排名只在本乡镇学校内排序。</span>
                </div>
                ${renderCountyRankTable(scope)}
            </div>
            <div class="analysis-anchor-panel">
                <div class="sub-header analysis-section-head">教师教学质量画像</div>
                ${renderTeacherPortraits()}
            </div>
            <div class="analysis-anchor-panel">
                <div class="sub-header analysis-section-head">学生档案县排名</div>
                ${renderStudentArchiveRows()}
            </div>
            <div class="analysis-anchor-panel">
                <div class="sub-header analysis-section-head">县域历史对比</div>
                ${renderHistoryCompare()}
            </div>
        `;
    }

    function decorateAnalysisTable() {
        const scope = getCurrentScope();
        if (!scope?.includesCounty) return;
        applyCountyRanks();
        const table = document.getElementById('tb-total');
        if (!table) return;
        const headRow = table.querySelector('thead tr');
        if (headRow) {
            const heads = Array.from(headRow.children);
            const last = heads[heads.length - 1];
            if (last && !last.dataset.countyRankLabel) {
                last.textContent = '县排名';
                last.dataset.countyRankLabel = '1';
            }
            if (!headRow.querySelector('[data-county-township-rank]')) {
                const th = document.createElement('th');
                th.dataset.countyTownshipRank = '1';
                th.textContent = '乡镇排名';
                headRow.appendChild(th);
            }
        }
        const schoolMap = new Map(Object.values(window.SCHOOLS || {}).map((school) => [school.name, school]));
        table.querySelectorAll('tbody tr').forEach((row) => {
            const firstCellText = row.cells?.[0]?.textContent || '';
            const schoolName = Array.from(schoolMap.keys()).find((name) => firstCellText.includes(name));
            const school = schoolMap.get(schoolName);
            if (!school) return;
            let cell = row.querySelector('[data-county-township-rank-cell]');
            if (!cell) {
                cell = document.createElement('td');
                cell.dataset.countyTownshipRankCell = '1';
                row.appendChild(cell);
            }
            cell.textContent = school.countyScope === 'county' ? '-' : (school.townshipRank2Rate || '-');
        });
    }

    function decorateStudentDetails() {
        const section = document.getElementById('student-details');
        if (!section || !getCurrentScope()?.includesCounty) return;
        let note = section.querySelector('#county-student-rank-note');
        if (!note) {
            note = document.createElement('div');
            note.id = 'county-student-rank-note';
            note.className = 'info-bar analysis-info-band';
            const target = section.querySelector('.student-details-primary-flow') || section.firstElementChild;
            if (target?.parentNode) target.parentNode.insertBefore(note, target);
            else section.prepend(note);
        }
        note.innerHTML = '<span><strong>县域排名已启用：</strong>本次学生档案已写入 countyRank / townshipRank，成绩单与明细可同时引用县排名和乡镇排名。</span>';
    }

    function decorateUploadCountyStatus() {
        const feedback = document.getElementById('upload-feedback-board');
        if (!feedback) return;
        let card = document.getElementById('upload-county-scope-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'upload-county-scope-card';
            card.className = 'upload-feedback-card';
            feedback.appendChild(card);
        }
        const scope = getCurrentScope();
        card.innerHTML = `
            <h4><i class="ti ti-map-2"></i> 县域对比口径</h4>
            <p>${scope?.includesCounty ? `已启用县域排名：乡镇 ${scope.townshipSchools.length} 所，县域学校 ${scope.countySchools.length} 所。` : '本次暂按乡镇成绩处理。导入新成绩时会询问是否包含县里学校。'}</p>
        `;
    }

    function patchGlobalFunction(name, after) {
        const original = window[name];
        if (typeof original !== 'function' || original[`__countyPatched_${name}`]) return false;
        const patched = function countyPatchedFunction(...args) {
            const result = original.apply(this, args);
            const runAfter = (value) => {
                after(...args);
                return value;
            };
            if (result && typeof result.then === 'function') {
                return result.then(runAfter);
            }
            runAfter(result);
            return result;
        };
        patched[`__countyPatched_${name}`] = true;
        window[name] = patched;
        return true;
    }

    function installPatches() {
        patchGlobalFunction('processData', () => {
            applyCountyRanks();
            saveCountySnapshot();
            promptCountyScopeIfNeeded();
        });
        patchGlobalFunction('renderTables', () => {
            applyCountyRanks();
            decorateAnalysisTable();
        });
        patchGlobalFunction('renderStudentDetails', () => {
            applyCountyRanks();
            decorateStudentDetails();
        });
        patchGlobalFunction('switchTab', (id) => {
            if (id === 'county-analysis') setTimeout(renderCountyAnalysis, 0);
            if (id === 'student-details') setTimeout(decorateStudentDetails, 0);
        });
    }

    function bindUploadPromptArm() {
        document.addEventListener('change', (event) => {
            const target = event.target;
            if (!target || target.id !== 'fileInput') return;
            if (target.files && target.files.length) state.promptArmed = true;
        }, true);
    }

    function installStyles() {
        if (document.getElementById('county-analysis-runtime-style')) return;
        const style = document.createElement('style');
        style.id = 'county-analysis-runtime-style';
        style.textContent = `
            .county-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}
            .county-kpi-grid>div{padding:16px;border:1px solid #ccfbf1;border-radius:18px;background:linear-gradient(135deg,#f0fdfa,#fff)}
            .county-kpi-grid span,.county-kpi-grid em{display:block;color:#64748b;font-size:12px;font-style:normal}
            .county-kpi-grid strong{display:block;margin:8px 0 4px;color:#0f766e;font-size:24px}
            .county-scope-badge{display:inline-flex;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:800}
            .county-scope-badge.is-township{background:#dcfce7;color:#166534}
            .county-scope-badge.is-county{background:#dbeafe;color:#1d4ed8}
            .county-empty{padding:14px 16px;border:1px dashed #cbd5e1;border-radius:14px;background:#f8fafc;color:#64748b}
            .county-portrait-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
            .county-portrait-card{position:relative;padding:16px;border:1px solid #dbeafe;border-radius:18px;background:#fff}
            .county-portrait-card.is-risk{border-color:#fecaca;background:#fff7f7}
            .county-portrait-card h4{margin:0 0 8px;color:#0f172a}
            .county-portrait-card strong{font-size:28px;color:#0f766e}
            .county-portrait-card p{margin:8px 0 0;color:#64748b;font-size:12px;line-height:1.6}
            .county-portrait-rank{position:absolute;right:14px;top:12px;color:#94a3b8;font-weight:900}
            @media(max-width:900px){.county-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
            @media(max-width:560px){.county-kpi-grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function boot() {
        installStyles();
        bindUploadPromptArm();
        installPatches();
        applyCountyRanks();
        decorateUploadCountyStatus();
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;
            installPatches();
            if (attempts > 40) clearInterval(timer);
        }, 300);
    }

    window.CountyAnalysisRuntime = {
        applyCountyRanks,
        renderCountyAnalysis,
        promptCountyScopeIfNeeded,
        decorateAnalysisTable,
        decorateStudentDetails,
        saveCountySnapshot,
        getCurrentScope
    };
    window.renderCountyAnalysis = renderCountyAnalysis;
    window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__ = true;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
