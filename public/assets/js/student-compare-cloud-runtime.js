(() => {
    if (typeof window === 'undefined' || window.__STUDENT_COMPARE_CLOUD_RUNTIME_PATCHED__) return;

    async function saveStudentCompareToCloud() {
        if (!window.STUDENT_MULTI_PERIOD_COMPARE_CACHE) return alert('请先生成学生多期对比结果');
        if (!window.sbClient) return alert('☁️ 云端服务未连接，无法保存');

        const user = Auth.currentUser;
        if (!user || !RoleManager.hasAnyRole(user, ['admin', 'director', 'grade_director'])) {
            return alert('⛔ 权限不足：只有管理员、教务主任或级部主任可以保存对比结果到云端');
        }

        const { school, examIds, periodCount, studentsCompareData, subjects } = window.STUDENT_MULTI_PERIOD_COMPARE_CACHE;
        const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || 'unknown';
        const timestamp = new Date().toISOString().split('T')[0];
        const key = `STUDENT_COMPARE_${cohortId}级_${school}_${examIds.join('_')}_${timestamp}`;
        const title = `${school} ${periodCount}期对比 (${examIds.join(' vs ')})`;

        try {
            if (window.UI) UI.loading(true, '☁️ 正在保存到云端...');
            const payload = {
                school,
                examIds,
                periodCount,
                subjects,
                title,
                studentCount: studentsCompareData.length,
                studentsCompareData: studentsCompareData.map(s => ({
                    name: s.name,
                    class: s.class,
                    periods: s.periods,
                    scoreDiff: s.scoreDiff,
                    rankSchoolDiff: s.rankSchoolDiff,
                    rankTownDiff: s.rankTownDiff,
                    latestTotal: s.latestTotal,
                    progressType: s.progressType
                })),
                createdBy: user.username || user.email,
                createdAt: new Date().toISOString()
            };

            const compressed = 'LZ|' + LZString.compressToUTF16(JSON.stringify(payload));
            const { error } = await sbClient.from('system_data').upsert({
                key,
                content: compressed,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
            if (error) throw error;
            if (window.UI) UI.loading(false);
            if (window.UI) UI.toast(`✅ 已保存到云端 (${title})`, 'success');
        } catch (e) {
            if (window.UI) UI.loading(false);
            console.error('保存失败:', e);
            alert('保存失败: ' + e.message);
        }
    }

    function normalizeCloudCompareTarget(target, user) {
        return {
            name: normalizeCompareName(target?.name || user?.name || ''),
            class: String(target?.class || user?.class || '').trim(),
            school: String(target?.school || user?.school || '').trim()
        };
    }

    function pickSelfStudentFromCloudRows(rows, normalizedTarget) {
        const sourceRows = Array.isArray(rows) ? rows : [];
        const targetName = normalizeCompareName(normalizedTarget?.name || '');
        const targetClass = String(normalizedTarget?.class || '').trim();
        const targetSchool = String(normalizedTarget?.school || '').trim();

        const withSchool = sourceRows.filter(s => {
            if (!targetSchool) return true;
            const school = String(s?.school || '').trim();
            if (!school) return true;
            return areSchoolNamesEquivalent(school, targetSchool);
        });

        const exactMatches = withSchool.filter(s => normalizeCompareName(s?.name || '') === targetName && targetClass && isClassEquivalent(s?.class || '', targetClass));
        if (exactMatches.length > 0) return { student: exactMatches[0], strategy: 'name+class', candidates: exactMatches };

        const nameOnlyMatches = withSchool.filter(s => normalizeCompareName(s?.name || '') === targetName);
        if (nameOnlyMatches.length === 1) return { student: nameOnlyMatches[0], strategy: 'name-only-unique', candidates: nameOnlyMatches };
        if (nameOnlyMatches.length > 1) return { student: nameOnlyMatches[0], strategy: 'name-only-collision', candidates: nameOnlyMatches };

        return { student: null, strategy: 'none', candidates: [] };
    }

    function sanitizeCloudCompareFocusAndModal() {
        if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
        if (typeof Swal !== 'undefined') Swal.close();
        const fixedEl = document.querySelector('.fixed');
        if (fixedEl) fixedEl.remove();
        const parentContainer = document.getElementById('parent-view-container');
        if (parentContainer && parentContainer.getAttribute('aria-hidden') === 'true') {
            parentContainer.removeAttribute('aria-hidden');
        }
    }

    function moveFocusOutOfParentView() {
        const parentContainer = document.getElementById('parent-view-container');
        const activeEl = document.activeElement;
        if (activeEl && typeof activeEl.blur === 'function') activeEl.blur();

        if (parentContainer && activeEl && parentContainer.contains(activeEl)) {
            let sink = document.getElementById('modal-focus-sink');
            if (!sink) {
                sink = document.createElement('button');
                sink.id = 'modal-focus-sink';
                sink.type = 'button';
                sink.tabIndex = -1;
                sink.style.position = 'fixed';
                sink.style.left = '-9999px';
                sink.style.top = '-9999px';
                sink.style.width = '1px';
                sink.style.height = '1px';
                sink.style.opacity = '0';
                sink.style.pointerEvents = 'none';
                document.body.appendChild(sink);
            }
            try { sink.focus({ preventScroll: true }); } catch (e) { sink.focus(); }
            sink.blur();
        }

        if (parentContainer && parentContainer.getAttribute('aria-hidden') === 'true') {
            parentContainer.removeAttribute('aria-hidden');
        }
    }

    function renderCloudCompareResultHint(payload, displayCount) {
        const hintEl = document.getElementById('studentCompareHint');
        if (!hintEl) return;
        hintEl.innerHTML = `☁️ 已加载云端对比：${payload.title} (共${displayCount}人，保存于${new Date(payload.createdAt).toLocaleString('zh-CN')})`;
        hintEl.style.color = '#16a34a';
    }

    function rerenderStudentSideReportAfterCloudCompare(user, selfStudent) {
        if (!user || !selfStudent) return;
        const isParentOrStudent = RoleManager.hasAnyRole(user, ['parent', 'student']) &&
            !RoleManager.hasAnyRole(user, ['admin', 'director', 'grade_director', 'teacher', 'class_teacher']);
        if (!isParentOrStudent) return;

        const bound = getCurrentBoundStudentFromUser(user) || (Array.isArray(RAW_DATA) ? RAW_DATA.find(s =>
            normalizeCompareName(s?.name || '') === normalizeCompareName(selfStudent?.name || user?.name || '') &&
            (!selfStudent?.class || isClassEquivalent(s?.class || '', selfStudent.class || ''))
        ) : null);

        if (bound && bound.scores) {
            CURRENT_REPORT_STUDENT = bound;
        } else {
            const periods = Array.isArray(selfStudent.periods) ? selfStudent.periods : [];
            const latestPeriod = periods.length > 0 ? periods[periods.length - 1] : null;
            const synthesizedScores = {};
            Object.entries(latestPeriod?.subjects || {}).forEach(([subject, info]) => {
                const score = Number(info?.score);
                if (Number.isFinite(score)) synthesizedScores[subject] = score;
            });

            CURRENT_REPORT_STUDENT = {
                name: selfStudent.name || user.name || '',
                class: selfStudent.class || user.class || '',
                school: selfStudent.school || user.school || '',
                id: selfStudent.id || user.username || '',
                total: Number.isFinite(Number(latestPeriod?.total)) ? Number(latestPeriod.total) : (Number(selfStudent.latestTotal) || 0),
                scores: synthesizedScores,
                ranks: {
                    total: {
                        class: latestPeriod?.rankClass ?? '-',
                        school: latestPeriod?.rankSchool ?? '-',
                        township: latestPeriod?.rankTown ?? '-'
                    }
                }
            };
        }

        if (typeof Auth !== 'undefined' && typeof Auth.renderParentView === 'function') {
            Auth.renderParentView();
            return;
        }

        const reportWrap = document.getElementById('single-report-result');
        const reportArea = document.getElementById('report-card-capture-area');
        if (reportWrap && reportArea && typeof renderSingleReportCardHTML === 'function') {
            reportWrap.classList.remove('hidden');
            reportArea.innerHTML = renderSingleReportCardHTML(CURRENT_REPORT_STUDENT, 'A4');
            setTimeout(() => {
                if (typeof renderRadarChart === 'function') renderRadarChart(CURRENT_REPORT_STUDENT);
                if (typeof renderVarianceChart === 'function') renderVarianceChart(CURRENT_REPORT_STUDENT);
            }, 100);
            if (typeof analyzeStrengthsAndWeaknesses === 'function') analyzeStrengthsAndWeaknesses(CURRENT_REPORT_STUDENT);
        }
    }

    async function viewCloudStudentCompares(selfOnly = false) {
        if (!window.sbClient) return alert('☁️ 云端服务未连接');
        try {
            if (window.UI) UI.loading(true, '☁️ 正在加载云端对比列表...');

            const user = getCurrentUser();
            const isAdminOrDirector = RoleManager.hasAnyRole(user, ['admin', 'director']);
            const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '';
            let query = sbClient.from('system_data').select('key, updated_at');

            if (selfOnly) {
                const target = resolveCloudCompareTarget(user);
                if (target.name && target.class && target.school) query = query.like('key', `STUDENT_COMPARE_${cohortId}级_${target.school}_%`);
                else if (cohortId) query = query.like('key', `STUDENT_COMPARE_${cohortId}级_%`);
                else query = query.like('key', 'STUDENT_COMPARE_%');
            } else if (!isAdminOrDirector && cohortId) {
                query = query.like('key', `STUDENT_COMPARE_${cohortId}级_%`);
            } else {
                query = query.like('key', 'STUDENT_COMPARE_%');
            }

            const { data, error } = await query.order('updated_at', { ascending: false }).limit(50);
            if (error) throw error;
            if (window.UI) UI.loading(false);

            if (!data || data.length === 0) {
                if (selfOnly) {
                    const target = resolveCloudCompareTarget(user);
                    const readableName = target.name || '您本人';
                    if (typeof Swal !== 'undefined') {
                        return Swal.fire({
                            title: '☁️ 暂无个人对比数据',
                            html: `<div style="text-align: left; line-height: 1.6;">
                                <p>云端未找到 <strong>${readableName}</strong> 的对比数据。</p>
                                <p style="margin-top: 10px;">可能原因：</p>
                                <ul style="margin: 8px 0; padding-left: 20px;">
                                    <li>您还没有生成过多期成绩对比</li>
                                    <li>对比数据尚未保存到云端</li>
                                    <li>您的数据在其他学校或届别中</li>
                                </ul>
                                <p style="margin-top: 10px; color: #3b82f6;">建议：请联系班主任或教务老师生成对比数据。</p>
                            </div>`,
                            icon: 'info',
                            confirmButtonText: '我知道了',
                            width: 500
                        });
                    }
                    return alert(`☁️ 云端暂无${readableName}的对比数据\n\n建议联系班主任或教务老师生成对比数据。`);
                }
                return alert('☁️ 云端暂无已保存的对比结果');
            }

            if (selfOnly && data.length === 1) return loadCloudStudentCompareForCurrentStudent(data[0].key);

            const loadFn = selfOnly ? 'loadCloudStudentCompareForCurrentStudent' : 'loadCloudStudentCompare';
            const listHtml = data.map(item => {
                const keyParts = item.key.split('_');
                const cohort = keyParts[1] || '未知届别';
                const school = keyParts[2] || '未知学校';
                const date = new Date(item.updated_at).toLocaleString('zh-CN');
                return `<div style="padding:12px; border-bottom:1px solid #e2e8f0; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="${loadFn}('${item.key}')">
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                <span style="background:#f0fdf4; color:#16a34a; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${cohort}</span>
                                <span style="font-weight:600; color:#334155;">${school}</span>
                            </div>
                            <div style="font-size:11px; color:#94a3b8; font-family:monospace;">${item.key}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:12px; color:#64748b;">${date}</div>
                            <div style="font-size:11px; color:#3b82f6; margin-top:2px;">点击解析 &gt;</div>
                        </div>
                    </div>`;
            }).join('');

            if (typeof Swal !== 'undefined') {
                moveFocusOutOfParentView();
                Swal.fire({
                    title: selfOnly ? '☁️ 选择本人对比记录' : '☁️ 已保存的对比结果',
                    html: `<div style="max-height:400px; overflow-y:auto; text-align:left;">${listHtml}</div>`,
                    width: 800,
                    showCloseButton: true,
                    showConfirmButton: false,
                    returnFocus: false
                });
            }
        } catch (e) {
            if (window.UI) UI.loading(false);
            console.error('加载失败:', e);
            alert('加载失败: ' + e.message);
        }
    }

    async function loadCloudStudentCompare(key, selfOnly = false) {
        sanitizeCloudCompareFocusAndModal();
        if (!window.sbClient) return alert('☁️ 云端服务未连接');
        try {
            if (window.UI) UI.loading(true, '☁️ 正在加载云端对比详情...');
            const { data, error } = await sbClient.from('system_data').select('content').eq('key', key).single();
            if (error) throw error;

            let content = data.content;
            if (typeof content === 'string' && content.startsWith('LZ|')) {
                content = LZString.decompressFromUTF16(content.substring(3));
            }
            const payload = typeof content === 'string' ? JSON.parse(content) : content;
            payload.key = key;

            const allRows = Array.isArray(payload.studentsCompareData) ? payload.studentsCompareData : [];
            STUDENT_MULTI_PERIOD_COMPARE_CACHE = {
                school: payload.school,
                examIds: payload.examIds || [],
                periodCount: Number(payload.periodCount || 2),
                studentsCompareData: Array.isArray(allRows) ? [...allRows] : [],
                originalStudentsCompareData: Array.isArray(allRows) ? [...allRows] : [],
                subjects: payload.subjects || [],
                currentPage: 1,
                pageSize: 20,
                activeNameFilters: [],
                activeProgressFilter: '',
                activeClassFilter: ''
            };

            let picked = null;
            if (selfOnly) {
                const user = getCurrentUser();
                const target = normalizeCloudCompareTarget(resolveCloudCompareTarget(user), user);
                picked = pickSelfStudentFromCloudRows(STUDENT_MULTI_PERIOD_COMPARE_CACHE.studentsCompareData, target);
                if (!picked?.student) {
                    if (window.UI) UI.loading(false);
                    return alert('☁️ 云端记录中未匹配到您的个人数据');
                }
                STUDENT_MULTI_PERIOD_COMPARE_CACHE.studentsCompareData = [picked.student];
                STUDENT_MULTI_PERIOD_COMPARE_CACHE.originalStudentsCompareData = [picked.student];
            }

            if (typeof updateClassGroupOptions === 'function') updateClassGroupOptions();
            if (typeof updateStudentCompareSummary === 'function') updateStudentCompareSummary();
            if (typeof renderStudentComparePage === 'function') renderStudentComparePage(1);
            renderCloudCompareResultHint(payload, STUDENT_MULTI_PERIOD_COMPARE_CACHE.studentsCompareData.length);

            const user = getCurrentUser();
            if (selfOnly && picked?.student) {
                applyCloudStudentCompareContext(payload, picked.student, allRows);
                rerenderStudentSideReportAfterCloudCompare(user, picked.student);
            } else {
                clearCloudStudentCompareContext();
            }

            if (window.UI) {
                UI.loading(false);
                UI.toast('✅ 已加载云端对比数据', 'success');
            }
        } catch (e) {
            if (window.UI) UI.loading(false);
            console.error('加载失败:', e);
            alert('加载失败: ' + e.message);
        }
    }

    window.saveStudentCompareToCloud = saveStudentCompareToCloud;
    window.viewCloudStudentCompares = viewCloudStudentCompares;
    window.normalizeCloudCompareTarget = normalizeCloudCompareTarget;
    window.pickSelfStudentFromCloudRows = pickSelfStudentFromCloudRows;
    window.sanitizeCloudCompareFocusAndModal = sanitizeCloudCompareFocusAndModal;
    window.moveFocusOutOfParentView = moveFocusOutOfParentView;
    window.renderCloudCompareResultHint = renderCloudCompareResultHint;
    window.rerenderStudentSideReportAfterCloudCompare = rerenderStudentSideReportAfterCloudCompare;
    window.loadCloudStudentCompare = loadCloudStudentCompare;
    window.viewCloudStudentComparesForCurrentStudent = async function (name, className, schoolName) {
        if (name || className || schoolName) setCloudCompareTarget(name, className, schoolName);
        else setCloudCompareTarget(resolveCloudCompareTarget(getCurrentUser()));
        if (typeof moveFocusOutOfParentView === 'function') moveFocusOutOfParentView();
        else if (document.activeElement && typeof document.activeElement.blur === 'function') document.activeElement.blur();
        await new Promise(r => setTimeout(r, 16));
        return viewCloudStudentCompares(true);
    };
    window.loadCloudStudentCompareForCurrentStudent = function (key) {
        return loadCloudStudentCompare(key, true);
    };

    window.__STUDENT_COMPARE_CLOUD_RUNTIME_PATCHED__ = true;
})();
