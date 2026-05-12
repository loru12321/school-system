(() => {
    if (typeof window === 'undefined' || window.__SCHOOL_PROFILE_RUNTIME_PATCHED__) return;

    let schoolRadarInstance = window.schoolRadarInstance || null;
    let schoolDistInstance = window.schoolDistInstance || null;
    let currentModalSchool = '';
    const SchoolProfilePerfCache = {
        signature: '',
        townshipRows: [],
        schoolList: [],
        schoolSet: new Set(),
        subjectTownAverages: new Map(),
        totalDistribution: null,
        schoolDistribution: new Map(),
        profileModel: new Map()
    };

    function syncSchoolProfileChartState() {
        window.schoolRadarInstance = schoolRadarInstance;
        window.schoolDistInstance = schoolDistInstance;
    }

    function escapeSchoolProfileHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function getSchoolProfileSignature() {
        const signature = [
            window.CURRENT_EXAM_ID || '',
            window.__RAW_DATA_VERSION || 0,
            Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            Array.isArray(window.SUBJECTS) ? window.SUBJECTS.join('|') : '',
            Object.keys(window.SCHOOLS || {}).join('|')
        ].join('::');
        if (SchoolProfilePerfCache.signature !== signature) {
            SchoolProfilePerfCache.signature = signature;
            SchoolProfilePerfCache.townshipRows = [];
            SchoolProfilePerfCache.schoolList = [];
            SchoolProfilePerfCache.schoolSet = new Set();
            SchoolProfilePerfCache.subjectTownAverages.clear();
            SchoolProfilePerfCache.totalDistribution = null;
            SchoolProfilePerfCache.schoolDistribution.clear();
            SchoolProfilePerfCache.profileModel.clear();
        }
        return signature;
    }

    function getProfileSchoolList() {
        getSchoolProfileSignature();
        if (SchoolProfilePerfCache.schoolList.length) return SchoolProfilePerfCache.schoolList;
        const list = (typeof listAvailableSchoolsForCompare === 'function')
            ? listAvailableSchoolsForCompare()
            : Object.keys(SCHOOLS || {});
        SchoolProfilePerfCache.schoolList = (list || []).map(name => String(name || '').trim()).filter(Boolean);
        SchoolProfilePerfCache.schoolSet = new Set(SchoolProfilePerfCache.schoolList);
        return SchoolProfilePerfCache.schoolList;
    }

    function getProfileTownshipRows() {
        getSchoolProfileSignature();
        if (SchoolProfilePerfCache.townshipRows.length) return SchoolProfilePerfCache.townshipRows;
        SchoolProfilePerfCache.townshipRows = (typeof window.filterRowsToTownshipSchools === 'function')
            ? window.filterRowsToTownshipSchools(RAW_DATA || [])
            : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
        return SchoolProfilePerfCache.townshipRows;
    }

    function getSubjectTownAverage(subject) {
        getSchoolProfileSignature();
        if (SchoolProfilePerfCache.subjectTownAverages.has(subject)) return SchoolProfilePerfCache.subjectTownAverages.get(subject);
        getProfileSchoolList();
        const schoolSet = SchoolProfilePerfCache.schoolSet;
        const allAvgs = Object.values(SCHOOLS || {})
            .filter(sch => !schoolSet.size || schoolSet.has(String(sch?.name || '').trim()))
            .map(sch => sch.metrics?.[subject]?.avg || 0)
            .filter(value => value > 0);
        const avg = allAvgs.length ? (allAvgs.reduce((sum, value) => sum + value, 0) / allAvgs.length) : 0;
        SchoolProfilePerfCache.subjectTownAverages.set(subject, avg);
        return avg;
    }

    function buildDistribution(scores, step = 50, bounds = null) {
        const validScores = (scores || []).map(Number).filter(Number.isFinite);
        if (!validScores.length) return { labels: [], values: [], startBin: 0, endBin: 0, step };
        const minScore = bounds ? bounds.min : Math.floor(Math.min(...validScores));
        const maxScore = bounds ? bounds.max : Math.ceil(Math.max(...validScores));
        const startBin = Math.floor(minScore / step) * step;
        const endBin = Math.ceil(maxScore / step) * step;
        const labels = [];
        const values = [];
        const counts = new Map();
        validScores.forEach(score => {
            const bin = Math.floor(score / step) * step;
            counts.set(bin, (counts.get(bin) || 0) + 1);
        });
        for (let i = startBin; i < endBin; i += step) {
            labels.push(`${i}-${i + step}`);
            values.push(((counts.get(i) || 0) / validScores.length * 100).toFixed(1));
        }
        return { labels, values, startBin, endBin, step };
    }

    function getTownDistribution() {
        getSchoolProfileSignature();
        if (SchoolProfilePerfCache.totalDistribution) return SchoolProfilePerfCache.totalDistribution;
        const scores = getProfileTownshipRows().map(student => student?.total);
        SchoolProfilePerfCache.totalDistribution = buildDistribution(scores);
        return SchoolProfilePerfCache.totalDistribution;
    }

    function getSchoolDistribution(schoolName, students) {
        getSchoolProfileSignature();
        if (SchoolProfilePerfCache.schoolDistribution.has(schoolName)) return SchoolProfilePerfCache.schoolDistribution.get(schoolName);
        const town = getTownDistribution();
        const distribution = buildDistribution((students || []).map(student => student?.total), town.step, { min: town.startBin, max: town.endBin });
        SchoolProfilePerfCache.schoolDistribution.set(schoolName, distribution);
        return distribution;
    }

    function getSchoolProfileModel(schoolName) {
        const signature = getSchoolProfileSignature();
        const cacheKey = `${signature}::${schoolName}`;
        if (SchoolProfilePerfCache.profileModel.has(cacheKey)) return SchoolProfilePerfCache.profileModel.get(cacheKey);
        const school = typeof window.getAppSchoolRecord === 'function'
            ? window.getAppSchoolRecord(schoolName)
            : SCHOOLS[schoolName];
        if (!school) return { subjectLabels: [], ratios: [], distLabels: [], townData: [], schoolData: [] };
        const subjectLabels = [];
        const ratios = [];
        SUBJECTS.forEach(sub => {
            if (school.metrics[sub] && school.metrics[sub].avg) {
                const townAvg = getSubjectTownAverage(sub);
                const ratio = townAvg ? (school.metrics[sub].avg / townAvg) : 0;
                subjectLabels.push(sub);
                ratios.push(parseFloat(ratio.toFixed(2)));
            }
        });
        const townDistribution = getTownDistribution();
        const schoolDistribution = getSchoolDistribution(schoolName, school.students || []);
        const model = {
            subjectLabels,
            ratios,
            distLabels: townDistribution.labels,
            townData: townDistribution.values,
            schoolData: schoolDistribution.values
        };
        SchoolProfilePerfCache.profileModel.set(cacheKey, model);
        return model;
    }

    function showSchoolProfile(schoolName) {
        const resolvedKey = typeof window.resolveAppSchoolKey === 'function' ? window.resolveAppSchoolKey(schoolName) : schoolName;
        const s = typeof window.getAppSchoolRecord === 'function'
            ? window.getAppSchoolRecord(schoolName)
            : SCHOOLS[schoolName];
        if (!s) return;
        currentModalSchool = resolvedKey || schoolName;
        const m = s.metrics.total || {};

        document.getElementById('sp-title').innerHTML = `🏫 ${escapeSchoolProfileHtml(schoolName)} <small style="font-size:14px; color:#666;">(参考人数: ${Number(m.count) || 0})</small>`;
        document.getElementById('sp-rank').innerText = s.rank2Rate || '-';
        document.getElementById('sp-score').innerText = (s.score2Rate || 0).toFixed(2);

        const avgScore = m.ratedAvg || 0;
        const rateScore = (m.ratedExc || 0) + (m.ratedPass || 0);
        document.getElementById('sp-s1').innerText = avgScore.toFixed(1);
        document.getElementById('sp-s2').innerText = rateScore.toFixed(1);

        const profileModel = getSchoolProfileModel(schoolName);
        const subjectLabels = profileModel.subjectLabels;
        const ratios = profileModel.ratios;

        const ctxRadar = document.getElementById('schoolRadarChart');
        if (schoolRadarInstance) schoolRadarInstance.destroy();

        schoolRadarInstance = new Chart(ctxRadar, {
            type: 'radar',
            data: {
                labels: subjectLabels,
                datasets: [{
                    label: '学科效能 (本校 ÷ 全镇)',
                    data: ratios,
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    borderColor: '#4f46e5',
                    pointBackgroundColor: '#4f46e5',
                    pointBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (e, elements) => {
                    if (!elements.length) return;
                    const idx = elements[0].index;
                    const subject = subjectLabels[idx];

                    document.getElementById('school-profile-modal').style.display = 'none';
                    jumpToModule('teacher-analysis');

                    setTimeout(() => {
                        const subjectSelect = document.getElementById('teacherCompareSubject');
                        if (subjectSelect) {
                            subjectSelect.value = subject;
                            subjectSelect.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        UI.toast(`已切换到 ${subject} 教师画像`, 'success');
                    }, 600);
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                scales: {
                    r: {
                        beginAtZero: false,
                        min: 0.5,
                        max: Math.max(...ratios, 1.1) + 0.1,
                        ticks: { display: false },
                        pointLabels: { font: { size: 11, weight: 'bold' } }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
        syncSchoolProfileChartState();

        if (ratios.length > 0) {
            const maxIdx = ratios.indexOf(Math.max(...ratios));
            const minIdx = ratios.indexOf(Math.min(...ratios));
            const maxSub = subjectLabels[maxIdx];
            const minSub = subjectLabels[minIdx];
            document.getElementById('sp-diagnosis').innerHTML = `该校优势学科为 <strong style="color:#16a34a">${escapeSchoolProfileHtml(maxSub)}</strong> (效能${ratios[maxIdx]})，相对薄弱学科为 <strong style="color:#dc2626">${escapeSchoolProfileHtml(minSub)}</strong>。建议点击“班级对比”查看具体差异。`;
        } else {
            document.getElementById('sp-diagnosis').innerHTML = '数据不足，无法诊断。';
        }

        if (profileModel.distLabels.length > 0) {
            const distLabels = profileModel.distLabels;
            const townData = profileModel.townData;
            const schoolData = profileModel.schoolData;

            const ctxDist = document.getElementById('schoolDistChart');
            if (schoolDistInstance) schoolDistInstance.destroy();

            schoolDistInstance = new Chart(ctxDist, {
                type: 'bar',
                data: {
                    labels: distLabels,
                    datasets: [
                        { type: 'line', label: '全镇平均 (%)', data: townData, borderColor: '#f59e0b', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, tension: 0.4, order: 1 },
                        { type: 'bar', label: '本校分布 (%)', data: schoolData, backgroundColor: '#3b82f6', barPercentage: 0.6, order: 2 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: { display: true, position: 'top', labels: { boxWidth: 10, font: { size: 10 } } },
                        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%` } }
                    },
                    scales: {
                        y: { display: false, beginAtZero: true },
                        x: { grid: { display: false }, ticks: { font: { size: 9 } } }
                    }
                }
            });
            syncSchoolProfileChartState();
        }

        document.getElementById('school-profile-modal').style.display = 'flex';
    }

    function jumpToModule(moduleId) {
        document.getElementById('school-profile-modal').style.display = 'none';
        switchTab(moduleId);
        setTimeout(() => {
            let selectId = '';
            if (moduleId === 'teacher-analysis') selectId = 'mySchoolSelect';
            else if (moduleId === 'student-details') selectId = 'studentSchoolSelect';
            const select = document.getElementById(selectId);
            if (select) {
                select.value = currentModalSchool;
                select.dispatchEvent(new Event('change'));
                if (moduleId === 'teacher-analysis') analyzeTeachers();
            }
            if (window.UI) UI.toast(`已跳转至 ${currentModalSchool}`, 'success');
        }, 100);
    }

    window.showSchoolProfile = showSchoolProfile;
    window.jumpToModule = jumpToModule;
    syncSchoolProfileChartState();
    window.__SCHOOL_PROFILE_RUNTIME_PATCHED__ = true;
})();
