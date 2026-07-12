function getTeacherTermOptions() {
    // 🟢 [修复]：获取选项前强制重新渲染，防止因切换届别导致年级标签还是旧的
    if (window.DataManager && typeof DataManager.renderTeacherTermSelect === 'function') {
        DataManager.renderTeacherTermSelect();
    }

    const tmpSelect = document.getElementById('dm-teacher-term-select');
    if (tmpSelect && tmpSelect.options && tmpSelect.options.length > 0) {
        return Array.from(tmpSelect.options)
            .filter(o => o.value)
            .map(o => ({ value: o.value, label: o.textContent }));
    }


    const options = [];
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const history = db?.teachingHistory || {};
    Object.keys(history).forEach(k => {
        if (k) options.push({ value: k, label: k });
    });

    const meta = (typeof getExamMetaFromUI === 'function') ? getExamMetaFromUI() : {};
    const termId = readCurrentTermId() || (meta.year && meta.term ? `${meta.year}_${meta.term}` : '');
    if (termId && !options.find(o => o.value === termId)) {
        options.push({ value: termId, label: termId });
    }
    return options;
}

async function promptTeacherTermId(list, defaultValue) {
    if (window.UI && typeof UI.prompt === 'function') {
        return UI.prompt(`检测到任课表可同步，请输入学期ID：\n${list}`, defaultValue, {
            title: '同步任课表'
        });
    }
    return window.prompt(`检测到任课表可同步，请输入学期ID：\n${list}`, defaultValue);
}

function parseTeacherTermApproxMs(termId) {
    if (!termId) return 0;
    const m = String(termId).match(/(\d{4})-(\d{4})_(.+?)(?:_|$)/);
    if (!m) return 0;
    const startYear = Number(m[1]);
    const term = m[3];
    if (!Number.isFinite(startYear)) return 0;
    const month = /下/.test(term) ? 2 : 9;
    return new Date(startYear, month - 1, 1).getTime();
}

function pickAutoTeacherTerm() {
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const history = db?.teachingHistory || {};
    const preferred = typeof getPreferredTeacherTermId === 'function' ? String(getPreferredTeacherTermId() || '').trim() : '';
    if (preferred) {
        const direct = history[preferred];
        const directMap = direct?.map && typeof direct.map === 'object' ? direct.map : (direct || {});
        if (directMap && typeof directMap === 'object' && Object.keys(directMap).length > 0) return preferred;
    }
    const now = Date.now();
    const entries = Object.entries(history)
        .map(([termId, entry]) => {
            const mapObj = entry?.map && typeof entry.map === 'object' ? entry.map : (entry || {});
            const size = (mapObj && typeof mapObj === 'object') ? Object.keys(mapObj).length : 0;
            const rawTs = entry?.savedAt || entry?.updated_at || entry?.updatedAt || entry?.importedAt || entry?.createdAt;
            const parsedTs = typeof rawTs === 'number' ? rawTs : Date.parse(String(rawTs || ''));
            const ts = Number.isFinite(parsedTs) ? parsedTs : 0;
            const approxTs = parseTeacherTermApproxMs(termId);
            return { termId, size, ts, approxTs };
        })
        .filter(x => x.termId && x.size > 0);

    if (!entries.length) {
        return readCurrentTermId() || '';
    }

    entries.sort((a, b) => {
        if (a.ts && b.ts) {
            return Math.abs(a.ts - now) - Math.abs(b.ts - now);
        }
        if (a.ts || b.ts) return b.ts - a.ts;
        return Math.abs(a.approxTs - now) - Math.abs(b.approxTs - now);
    });
    return entries[0].termId;
}

function applyTeacherTermWithoutPrompt(termId) {
    if (!termId) return false;
    syncTeacherTermStorage(termId);
    const termSel = document.getElementById('dm-teacher-term-select');
    if (termSel) {
        const hit = Array.from(termSel.options || []).find(o => o.value === termId || String(o.value).startsWith(termId + '_'));
        termSel.value = hit ? hit.value : termId;
    }

    const resolved = resolveTeacherHistoryEntry(termId);
    if (resolved) {
        syncTeacherTermStorage(resolved.key);
        setTeacherMap(JSON.parse(JSON.stringify(resolved.map || {})));
        setTeacherSchoolMap(JSON.parse(JSON.stringify(resolved.schoolMap || {})));
        localStorage.setItem('TEACHER_SYNC_AT', new Date(resolved.savedAt || Date.now()).toISOString());
        if (window.DataManager && typeof DataManager.renderTeachers === 'function') DataManager.renderTeachers();
        if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') DataManager.refreshTeacherAnalysis();
        return true;
    }

    return false;
}

function shouldAutoLoadTeacherData() {
    if (window.__FORCE_TEACHER_CLOUD_LOAD__ === true) return true;
    const teacherSection = document.getElementById('teacher-analysis');
    if (teacherSection && teacherSection.classList.contains('active')) return true;
    const dataManagerModal = document.getElementById('data-manager-modal');
    const dataManagerVisible = !!dataManagerModal
        && (!window.getComputedStyle || getComputedStyle(dataManagerModal).display !== 'none');
    if (dataManagerVisible && window.DataManager && DataManager.currentTab === 'teacher') return true;

    // 成绩已恢复而任课表为空时，在后台补齐任课数据。此前只有进入教师页面
    // 才触发同步，导致首页一直显示“未导入”，教师分析也误判为无数据。
    const hasScores = Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0;
    const hasTeachers = !!(window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0);
    return hasScores && !hasTeachers;
}

function syncTeacherAnalysisSchoolContext(preferredSchool = '') {
    const schoolSel = document.getElementById('mySchoolSelect');
    const rawPreferred = String(preferredSchool || '').trim();
    const fallbackSchool = String(window.DEFAULT_MY_SCHOOL_NAME || '银山实验').trim();
    let resolvedSchool = rawPreferred || (
        typeof readCurrentSchool === 'function'
            ? String(readCurrentSchool() || '').trim()
            : String(window.MY_SCHOOL || localStorage.getItem('MY_SCHOOL') || fallbackSchool).trim()
    );

    const schoolNames = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare()
        : Object.keys(window.SCHOOLS || {});
    if (resolvedSchool && schoolNames.length && typeof resolveSchoolNameFromCollection === 'function') {
        resolvedSchool = resolveSchoolNameFromCollection(schoolNames, resolvedSchool) || resolvedSchool;
    }

    if (!rawPreferred && window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length && Array.isArray(window.RAW_DATA)) {
        const normalizeCls = typeof normalizeClass === 'function' ? normalizeClass : ((value) => String(value || '').trim());
        const teacherClasses = new Set(Object.keys(window.TEACHER_MAP || {})
            .map((key) => normalizeCls(String(key || '').split('_')[0]))
            .filter(Boolean));
        const currentRows = window.RAW_DATA.filter((row) => (
            teacherClasses.has(normalizeCls(row?.class || ''))
            && (!resolvedSchool || !row?.school || (
                typeof areSchoolNamesEquivalent === 'function'
                    ? areSchoolNamesEquivalent(row.school, resolvedSchool)
                    : String(row.school || '').trim() === resolvedSchool
            ))
        ));
        if (!currentRows.length) {
            const hitCounts = new Map();
            window.RAW_DATA.forEach((row) => {
                const cls = normalizeCls(row?.class || '');
                const school = String(row?.school || '').trim();
                if (!teacherClasses.has(cls) || !school) return;
                hitCounts.set(school, (hitCounts.get(school) || 0) + 1);
            });
            const inferred = Array.from(hitCounts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0] || '';
            if (inferred) resolvedSchool = inferred;
        }
    }

    if (resolvedSchool) {
        window.MY_SCHOOL = resolvedSchool;
        try { localStorage.setItem('MY_SCHOOL', resolvedSchool); } catch (_) {}
        if (schoolSel && schoolSel.value !== resolvedSchool) schoolSel.value = resolvedSchool;
    }

    return resolvedSchool;
}

function buildTeacherExportTag(user, subjectSet) {
    const dateStr = new Date().toISOString().slice(0, 10);
    const role = user?.role || 'guest';
    if (!(role === 'teacher' || role === 'class_teacher')) return dateStr;

    const safeName = String(user?.name || '教师')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '')
        .trim() || '教师';
    const subjects = Array.from(subjectSet || [])
        .map(s => normalizeSubject(s))
        .filter(Boolean);
    const subLabel = subjects.length === 0
        ? '本学科'
        : (subjects.length === 1 ? subjects[0] : `${subjects[0]}等${subjects.length}科`);
    return `${safeName}_${subLabel}_${dateStr}`;
}

function promptTeacherSyncIfNeeded() {
    if (!shouldAutoLoadTeacherData()) return false;
    if (applyTeacherTermWithoutPrompt(pickAutoTeacherTerm())) return true;
    if (localStorage.getItem('SUPPRESS_TEACHER_SYNC_PROMPT') === '1') return;
    if (sessionStorage.getItem('TEACHER_SYNC_PROMPT_SHOWN') === '1') return;
    if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return;

    // 不再弹出阻断式学期选择框。云端后台自动尝试精确学期及同届同年级
    // 兼容任课表；若仍无数据，教师页面保留“去同步任课表”内联入口。
    sessionStorage.setItem('TEACHER_SYNC_PROMPT_SHOWN', '1');
    return false;
}

async function tryAutoRestoreTeacherMap(options = {}) {
    if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return true;
    // Login and cohort restoration run before the teacher area is visible.
    // Allow that startup path to hydrate the current-term assignments silently.
    if (!options.startup && !shouldAutoLoadTeacherData()) return false;
    if (!(window.CloudManager && typeof CloudManager.loadTeachers === 'function')) return false;

    const preferredTerm = getPreferredTeacherTermId() || '';
    if (preferredTerm) {
        syncTeacherTermStorage(preferredTerm);
    }

    try {
        const ok = await CloudManager.loadTeachers({ background: true, toast: false, blocking: false });
        if (ok) {
            if (typeof updateStatusPanel === 'function') updateStatusPanel();
            if (typeof renderTeachingOverview === 'function') renderTeachingOverview();
            return true;
        }
    } catch (error) {
        console.warn('[TeacherSync] auto restore failed:', error);
    }
    return false;
}

function scheduleTeacherSyncPrompt(options = {}) {
    const startup = options.startup !== false;
    if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) {
        if (!localStorage.getItem('TEACHER_SYNC_AT')) {
            localStorage.setItem('TEACHER_SYNC_AT', new Date().toISOString());
            if (typeof updateStatusPanel === 'function') updateStatusPanel();
        }
        return;
    }
    if (!startup && !shouldAutoLoadTeacherData()) return;
    let tries = 0;
    let timer = null;
    let stopped = false;
    const stop = () => {
        stopped = true;
        if (timer) clearInterval(timer);
    };
    const attempt = () => {
        if (stopped) return;
        tries += 1;
        Promise.resolve(tryAutoRestoreTeacherMap({ startup })).then((autoLoaded) => {
            const done = autoLoaded || (!startup && promptTeacherSyncIfNeeded());
            if (done || tries >= 10) {
                stop();
            }
        }).catch((error) => {
            console.warn('[TeacherSync] schedule auto restore failed:', error);
            const done = !startup && promptTeacherSyncIfNeeded();
            if (done || tries >= 10) {
                stop();
            }
        });
        if (tries >= 10) {
            stop();
        }
    };
    attempt();
    if (!stopped) timer = setInterval(attempt, 400);
}

function renderTeacherAnalysisState() {
    if (window.DataManager && typeof DataManager.ensureTeacherMap === 'function') {
        DataManager.ensureTeacherMap(false);
    }
    if (typeof updateTeacherCompareExamSelects === 'function') {
        updateTeacherCompareExamSelects();
    }

    const cta = document.getElementById('teacher-sync-cta');
    const hasTeacherMap = !!(window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0);
    let activeSchool = syncTeacherAnalysisSchoolContext();
    if (cta) cta.style.display = hasTeacherMap ? 'none' : 'inline-flex';

    const exportBtn = document.querySelector('#teacher-analysis .sec-head button');
    if (exportBtn) exportBtn.style.display = 'inline-flex';
    const detailSection = document.getElementById('anchor-detail');
    const pairSection = document.getElementById('anchor-pair');
    const townshipContainer = document.getElementById('teacher-township-ranking-container');
    if (detailSection) detailSection.style.display = 'block';
    if (pairSection) pairSection.style.display = 'block';
    if (townshipContainer) townshipContainer.style.display = 'block';

    if (!activeSchool && typeof SCHOOLS !== 'undefined' && Object.keys(SCHOOLS).length > 0 && hasTeacherMap) {
        const schoolNames = (typeof listAvailableSchoolsForCompare === 'function')
            ? listAvailableSchoolsForCompare()
            : Object.keys(SCHOOLS || {});
        if (schoolNames.length === 1) {
            activeSchool = syncTeacherAnalysisSchoolContext(schoolNames[0]);
        } else {
            const schoolCounts = {};
            Object.keys(TEACHER_MAP).forEach(key => {
                const cls = key.split('_')[0];
                for (const sName of schoolNames) {
                    const schoolRecord = typeof window.getAppSchoolRecord === 'function'
                        ? window.getAppSchoolRecord(sName)
                        : SCHOOLS[sName];
                    const hasClass = (schoolRecord?.students || []).some(s => s.class == cls);
                    if (hasClass) {
                        schoolCounts[sName] = (schoolCounts[sName] || 0) + 1;
                        break;
                    }
                }
            });

            let max = 0;
            let winner = '';
            for (const [s, c] of Object.entries(schoolCounts)) {
                if (c > max) {
                    max = c;
                    winner = s;
                }
            }
            if (winner) activeSchool = syncTeacherAnalysisSchoolContext(winner);
        }
    }

    if (activeSchool && hasTeacherMap) {
        analyzeTeachers();
        renderTeacherComparisonTable();
        renderTeacherCards();
        renderTeacherTownshipRanking();
        if (typeof updateStatusPanel === 'function') updateStatusPanel();
    } else {
        const compTable = document.getElementById('teacherComparisonTable');
        if (compTable) {
            const teacherTerm = readCurrentTeacherTermId() || getPreferredTeacherTermId() || '当前学期';
            const message = hasTeacherMap
                ? `
                    <p style="font-size:16px; font-weight:bold; color:#333;">无法自动识别“本校”</p>
                    <div style="background:#f9fafb; padding:10px 20px; border-radius:6px; display:inline-block; text-align:left; margin-top:10px; font-size:13px; color:#666; line-height:1.8;">
                        <strong>可能原因：</strong><br>
                        1. 您仅导入了教师配置，但尚未上传【学生成绩】数据。<br>
                        <span style="color:#d97706">系统需要结合学生名单才能确认班级归属。</span><br>
                        2. 任课表中的班级名与成绩表中的班级名不一致。
                    </div>
                `
                : `
                    <p style="font-size:16px; font-weight:bold; color:#333;">当前学期任课表尚未加载</p>
                    <div style="background:#f9fafb; padding:10px 20px; border-radius:6px; display:inline-block; text-align:left; margin-top:10px; font-size:13px; color:#666; line-height:1.8;">
                        <strong>当前学期：</strong>${teacherTerm}<br>
                        已同步到云端的任课表，需要先恢复到当前页面才能参与教师分析。<br>
                        系统会优先自动恢复本地历史，再自动拉取云端；如果仍为空，再点击下方“同步任课表”。
                    </div>
                `;
            compTable.innerHTML = `
                <div style="text-align:center; padding:40px; color:#999;">
                    <div style="font-size:48px; margin-bottom:10px;">📚</div>
                    ${message}
                </div>`;
        }
        if (townshipContainer) townshipContainer.innerHTML = '';
    }

    if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
    if (typeof updateTeacherCompareTeacherSelect === 'function') updateTeacherCompareTeacherSelect();
}
