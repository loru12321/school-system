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
    const uploadSection = document.getElementById('upload');
    if (uploadSection && uploadSection.classList.contains('active')) return true;
    const starterSection = document.getElementById('starter-hub');
    if (starterSection && starterSection.classList.contains('active')) return true;
    return !!document.getElementById('starter-status-panel');
}

function syncTeacherAnalysisSchoolContext(preferredSchool = '') {
    const schoolSel = document.getElementById('mySchoolSelect');
    const inferredSchool = (typeof inferDefaultSchoolFromContext === 'function') ? inferDefaultSchoolFromContext() : '';
    const candidates = [
        preferredSchool,
        schoolSel?.value,
        readCurrentSchool(),
        inferredSchool
    ].map(v => String(v || '').trim()).filter(Boolean);
    const schoolNames = Object.keys(SCHOOLS || {});
    const resolvedSchool = candidates.find(name => schoolNames.includes(name))
        || (schoolNames.length === 1 ? schoolNames[0] : candidates[0] || '');

    if (resolvedSchool) {
        writeCurrentSchool(resolvedSchool);
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
    if (applyTeacherTermWithoutPrompt(pickAutoTeacherTerm())) return true;
    if (!shouldAutoLoadTeacherData()) return false;
    if (localStorage.getItem('SUPPRESS_TEACHER_SYNC_PROMPT') === '1') return;
    if (sessionStorage.getItem('TEACHER_SYNC_PROMPT_SHOWN') === '1') return;
    if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return;

    const opts = getTeacherTermOptions();
    if (!opts.length) return false;

    const current = readCurrentTermId();
    const defaultValue = current || opts[0].value;

    const doSync = (termId) => {
        if (!termId) return;
        writeCurrentTermId(termId);
        const termSel = document.getElementById('dm-teacher-term-select');
        if (termSel) termSel.value = termId;
        if (window.CloudManager && CloudManager.loadTeachers) CloudManager.loadTeachers();
    };

    if (typeof Swal === 'undefined') {
        const list = opts.map(o => o.value).join('\n');
        const picked = prompt(`检测到任课表可同步，请输入学期ID：\n${list}`, defaultValue);
        if (picked) doSync(picked);
        sessionStorage.setItem('TEACHER_SYNC_PROMPT_SHOWN', '1');
        return true;
    }

    Swal.fire({
        title: '☁️ 检测到任课表可同步',
        html: `请选择学期后同步任课表到本地：<br><small style="color:#94a3b8;">本次仅同步任课表，不影响成绩数据</small>`,
        input: 'select',
        inputOptions: opts.reduce((acc, o) => (acc[o.value] = o.label, acc), {}),
        inputValue: defaultValue,
        showCancelButton: true,
        confirmButtonText: '同步到本地',
        cancelButtonText: '暂不同步',
        showDenyButton: true,
        denyButtonText: '不再提示',
        confirmButtonColor: '#0ea5e9'
    }).then((res) => {
        if (res.isConfirmed) doSync(res.value);
        if (res.isDenied) localStorage.setItem('SUPPRESS_TEACHER_SYNC_PROMPT', '1');
    });
    sessionStorage.setItem('TEACHER_SYNC_PROMPT_SHOWN', '1');
    return true;
}

async function tryAutoRestoreTeacherMap() {
    if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return true;
    if (!shouldAutoLoadTeacherData()) return false;
    if (!(window.CloudManager && typeof CloudManager.loadTeachers === 'function')) return false;

    const preferredTerm = getPreferredTeacherTermId() || pickAutoTeacherTerm();
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

function scheduleTeacherSyncPrompt() {
    if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return;
    if (!shouldAutoLoadTeacherData()) return;
    let tries = 0;
    const timer = setInterval(() => {
        tries += 1;
        Promise.resolve(tryAutoRestoreTeacherMap()).then((autoLoaded) => {
            const done = autoLoaded || promptTeacherSyncIfNeeded();
            if (done || tries >= 10) {
                clearInterval(timer);
            }
        }).catch((error) => {
            console.warn('[TeacherSync] schedule auto restore failed:', error);
            const done = promptTeacherSyncIfNeeded();
            if (done || tries >= 10) {
                clearInterval(timer);
            }
        });
        if (tries >= 10) {
            clearInterval(timer);
        }
    }, 400);
}

function renderTeacherAnalysisState() {
    if (window.DataManager && typeof DataManager.ensureTeacherMap === 'function') {
        DataManager.ensureTeacherMap(true);
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
                    const hasClass = SCHOOLS[sName].students.some(s => s.class == cls);
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
