(() => {
    if (typeof window === 'undefined' || window.__SCHOOL_PROFILE_RUNTIME_PATCHED__) return;

    let schoolRadarInstance = window.schoolRadarInstance || null;
    let schoolDistInstance = window.schoolDistInstance || null;
    let currentModalSchool = '';

    function syncSchoolProfileChartState() {
        window.schoolRadarInstance = schoolRadarInstance;
        window.schoolDistInstance = schoolDistInstance;
    }

    function showSchoolProfile(schoolName) {
        if (!SCHOOLS[schoolName]) return;
        currentModalSchool = schoolName;
        const s = SCHOOLS[schoolName];
        const m = s.metrics.total || {};

        document.getElementById('sp-title').innerHTML = `🏫 ${schoolName} <small style="font-size:14px; color:#666;">(参考人数: ${m.count})</small>`;
        document.getElementById('sp-rank').innerText = s.rank2Rate || '-';
        document.getElementById('sp-score').innerText = (s.score2Rate || 0).toFixed(2);

        const avgScore = m.ratedAvg || 0;
        const rateScore = (m.ratedExc || 0) + (m.ratedPass || 0);
        document.getElementById('sp-s1').innerText = avgScore.toFixed(1);
        document.getElementById('sp-s2').innerText = rateScore.toFixed(1);

        const subjectLabels = [];
        const ratios = [];

        SUBJECTS.forEach(sub => {
            if (s.metrics[sub] && s.metrics[sub].avg) {
                const allAvgs = Object.values(SCHOOLS).map(sch => sch.metrics[sub]?.avg || 0).filter(v => v > 0);
                const townAvg = allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length;

                const ratio = townAvg ? (s.metrics[sub].avg / townAvg) : 0;
                subjectLabels.push(sub);
                ratios.push(parseFloat(ratio.toFixed(2)));
            }
        });

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
                    jumpToModule('class-comparison');

                    setTimeout(() => {
                        const anchor = document.getElementById(`anchor-class-${subject}`);
                        if (anchor) {
                            anchor.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            UI.toast(`已定位到 ${subject} 对比分析`, 'success');
                        }
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
            document.getElementById('sp-diagnosis').innerHTML = `该校优势学科为 <strong style="color:#16a34a">${maxSub}</strong> (效能${ratios[maxIdx]})，相对薄弱学科为 <strong style="color:#dc2626">${minSub}</strong>。建议点击“班级对比”查看具体差异。`;
        } else {
            document.getElementById('sp-diagnosis').innerHTML = '数据不足，无法诊断。';
        }

        const step = 50;
        const allScores = RAW_DATA.map(s => s.total);
        const myScores = s.students.map(s => s.total);

        if (allScores.length > 0) {
            const maxScore = Math.ceil(Math.max(...allScores));
            const minScore = Math.floor(Math.min(...allScores));
            const startBin = Math.floor(minScore / step) * step;
            const endBin = Math.ceil(maxScore / step) * step;

            const distLabels = [];
            const townData = [];
            const schoolData = [];
            const totalTown = allScores.length || 1;
            const totalSchool = myScores.length || 1;

            for (let i = startBin; i < endBin; i += step) {
                const low = i;
                const high = i + step;
                distLabels.push(`${low}-${high}`);
                const tCount = allScores.filter(v => v >= low && v < high).length;
                townData.push((tCount / totalTown * 100).toFixed(1));
                const sCount = myScores.filter(v => v >= low && v < high).length;
                schoolData.push((sCount / totalSchool * 100).toFixed(1));
            }

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
            if (moduleId === 'class-comparison') selectId = 'classCompSchoolSelect';
            else if (moduleId === 'teacher-analysis') selectId = 'mySchoolSelect';
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
