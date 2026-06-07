(() => {
    if (typeof window === 'undefined' || window.__STUDENT_JUMP_RUNTIME_PATCHED__) return;

    function jsStringLiteral(value) {
        return JSON.stringify(String(value ?? ''))
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function normalizeJumpClass(value) {
        return typeof window.normalizeClass === 'function'
            ? window.normalizeClass(value)
            : String(value || '').trim();
    }

    function sameJumpSchoolName(left, right) {
        const leftName = String(left || '').trim();
        const rightName = String(right || '').trim();
        if (!leftName || !rightName) return false;
        if (leftName === rightName) return true;
        if (window.PermissionPolicy && typeof window.PermissionPolicy.sameSchoolName === 'function') {
            return window.PermissionPolicy.sameSchoolName(leftName, rightName);
        }
        if (typeof window.areSchoolNamesEquivalent === 'function') {
            return window.areSchoolNamesEquivalent(leftName, rightName);
        }
        if (typeof areSchoolNamesEquivalent === 'function') return areSchoolNamesEquivalent(leftName, rightName);
        if (typeof window.normalizeSchoolName === 'function') {
            return window.normalizeSchoolName(leftName) === window.normalizeSchoolName(rightName);
        }
        return false;
    }

    function getJumpSchoolStudents(schoolName) {
        const targetSchool = String(schoolName || '').trim();
        const schools = window.SCHOOLS || {};
        if (!targetSchool) return null;
        if (Array.isArray(schools?.[targetSchool]?.students)) return schools[targetSchool].students;
        const entry = Object.entries(schools || {}).find(([key, schoolData]) => (
            sameJumpSchoolName(key, targetSchool)
            || sameJumpSchoolName(schoolData?.name, targetSchool)
        ));
        return Array.isArray(entry?.[1]?.students) ? entry[1].students : null;
    }

    function ensureSelectValue(select, value, label = value) {
        if (!select) return;
        const target = String(value || '').trim();
        if (!target) return;
        let option = Array.from(select.options || []).find((opt) => String(opt.value || '').trim() === target);
        if (!option) {
            option = document.createElement('option');
            option.value = target;
            option.textContent = String(label || target);
            select.appendChild(option);
        }
        select.value = option.value;
    }

    function findStudentForJump(name, school, cls) {
        const targetName = String(name || '').trim();
        const targetSchool = String(school || '').trim();
        const targetClass = normalizeJumpClass(cls);
        if (!targetName) return null;

        const matches = (student) => {
            if (!student || String(student.name || '').trim() !== targetName) return false;
            if (targetSchool && String(student.school || '').trim() && !sameJumpSchoolName(student.school, targetSchool)) return false;
            if (targetClass && normalizeJumpClass(student.class) !== targetClass) return false;
            return true;
        };

        const schools = window.SCHOOLS || {};
        const rawData = window.RAW_DATA || [];
        const schoolStudents = getJumpSchoolStudents(targetSchool);
        if (Array.isArray(schoolStudents)) {
            const hit = schoolStudents.find(matches);
            if (hit) return hit;
        }

        if (Array.isArray(rawData)) {
            const rawHit = rawData.find(matches);
            if (rawHit) return rawHit;
        }

        for (const schoolData of Object.values(schools || {})) {
            const hit = schoolData?.students?.find(matches);
            if (hit) return hit;
        }
        return null;
    }

    function escapeDialogHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function readRankValue(rankLike, scope) {
        if (!rankLike || typeof rankLike !== 'object') return '-';
        const aliases = {
            class: ['class', 'rankClass', 'classRank'],
            school: ['school', 'rankSchool', 'schoolRank'],
            township: ['township', 'rankTown', 'townRank', 'townshipRank'],
            county: ['county', 'rankCounty', 'countyRank']
        }[scope] || [scope];
        for (const key of aliases) {
            const value = rankLike[key];
            if (value !== undefined && value !== null && value !== '') return value;
        }
        return '-';
    }

    function formatDialogNumber(value, digits = 1) {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(digits).replace(/\.0$/, '') : '-';
    }

    function buildStudentSubjectDialogHtml(student, subject, context = {}) {
        const subjectName = String(subject || '').trim();
        const score = subjectName ? student?.scores?.[subjectName] : null;
        const subjectRank = subjectName ? (student?.ranks?.[subjectName] || student?.subjectRanks?.[subjectName] || {}) : {};
        const totalRank = student?.ranks?.total || {};
        const gapText = Number.isFinite(Number(context.gap))
            ? `${Math.abs(Number(context.gap)).toFixed(1)} 分`
            : '-';
        const focusLabel = context.focusLabel ? String(context.focusLabel) : '学科关注';
        const scoreText = formatDialogNumber(score, 1);
        const rankCards = [
            ['班级排名', readRankValue(subjectRank, 'class')],
            ['校内排名', readRankValue(subjectRank, 'school')],
            ['乡镇排名', readRankValue(subjectRank, 'township')],
            ['总分校排', readRankValue(totalRank, 'school')]
        ];
        return `
            <div class="student-subject-dialog">
                <div class="student-subject-dialog__hero">
                    <div>
                        <div class="student-subject-dialog__eyebrow">${escapeDialogHtml(focusLabel)}</div>
                        <h3>${escapeDialogHtml(student?.name || '-')} · ${escapeDialogHtml(subjectName || '当前学科')}</h3>
                        <p>${escapeDialogHtml(student?.school || '')} ${escapeDialogHtml(student?.class || '')}</p>
                    </div>
                    <div class="student-subject-dialog__score">
                        <span>${escapeDialogHtml(subjectName || '学科')}</span>
                        <strong>${escapeDialogHtml(scoreText)}</strong>
                    </div>
                </div>
                <div class="student-subject-dialog__grid">
                    ${rankCards.map(([label, value]) => `
                        <div class="student-subject-dialog__metric">
                            <span>${escapeDialogHtml(label)}</span>
                            <strong>${escapeDialogHtml(value)}</strong>
                        </div>
                    `).join('')}
                </div>
                <div class="student-subject-dialog__note">
                    <strong>边缘差距</strong>
                    <span>${escapeDialogHtml(gapText)}</span>
                </div>
                <div class="student-subject-dialog__footer">
                    <span>这里只展示该学生在当前科目的关键情况；需要完整成绩单时，可进入“成绩单/家长查分”模块继续查看。</span>
                </div>
            </div>
        `;
    }

    function ensureStudentSubjectDialogStyle() {
        if (document.getElementById('student-subject-dialog-style')) return;
        const style = document.createElement('style');
        style.id = 'student-subject-dialog-style';
        style.textContent = `
            .student-subject-dialog{font-family:Inter,"Microsoft YaHei",system-ui,sans-serif;text-align:left;color:#111827}
            .student-subject-dialog__hero{display:flex;align-items:stretch;justify-content:space-between;gap:18px;padding:18px;border:1px solid #f2d9df;border-radius:18px;background:linear-gradient(135deg,#fff7f4 0%,#fff 48%,#f4fbf8 100%)}
            .student-subject-dialog__eyebrow{font-size:12px;font-weight:900;letter-spacing:.08em;color:#be123c;text-transform:uppercase;margin-bottom:8px}
            .student-subject-dialog__hero h3{margin:0;font-size:26px;line-height:1.25;color:#111827}
            .student-subject-dialog__hero p{margin:8px 0 0;color:#64748b;font-weight:700}
            .student-subject-dialog__score{min-width:132px;border:1px solid #f0a3b4;border-radius:16px;background:linear-gradient(135deg,#fff1f4,#fffaf0);color:#9f1239;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 16px}
            .student-subject-dialog__score span{font-size:12px;font-weight:800;color:#be123c}
            .student-subject-dialog__score strong{font-size:32px;line-height:1.1;margin-top:4px}
            .student-subject-dialog__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
            .student-subject-dialog__metric{border:1px solid #e8edf3;border-radius:14px;padding:14px;background:#fff}
            .student-subject-dialog__metric span{display:block;color:#64748b;font-size:12px;font-weight:800;margin-bottom:8px}
            .student-subject-dialog__metric strong{font-size:22px;color:#0f172a}
            .student-subject-dialog__note{display:flex;align-items:center;justify-content:space-between;margin-top:14px;border:1px dashed #f0a3b4;border-radius:14px;padding:12px 14px;background:#fff5f7;color:#9f1239;font-weight:900}
            .student-subject-dialog__footer{margin-top:12px;color:#64748b;font-size:13px;line-height:1.6}
            .student-subject-dialog-popup{z-index:97000!important}
            @media(max-width:720px){.student-subject-dialog__hero{flex-direction:column}.student-subject-dialog__grid{grid-template-columns:repeat(2,minmax(0,1fr))}.student-subject-dialog__score{min-width:0}}
        `;
        document.head.appendChild(style);
    }

    function openStudentSubjectDialog(name, school, cls, subject, context = {}) {
        const targetStudent = findStudentForJump(name, school, cls);
        if (!targetStudent) {
            alert(`未找到该学生：${name || ''}`);
            return;
        }
        ensureStudentSubjectDialogStyle();
        const subjectName = String(subject || '').trim();
        const title = `${targetStudent.name || '-'} / ${subjectName || '当前学科'}`;
        const html = buildStudentSubjectDialogHtml(targetStudent, subjectName, context);
        if (window.Swal && typeof window.Swal.fire === 'function') {
            window.Swal.fire({
                title: escapeDialogHtml(title),
                html,
                width: 760,
                confirmButtonText: '关闭',
                confirmButtonColor: '#be123c',
                customClass: { popup: 'student-subject-dialog-popup' },
                backdrop: true
            });
            return;
        }
        const dialog = document.createElement('div');
        dialog.style.cssText = 'position:fixed;inset:0;z-index:97000;background:rgba(15,23,42,.42);display:flex;align-items:center;justify-content:center;padding:20px;';
        dialog.innerHTML = `<div style="width:min(760px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;padding:22px;box-shadow:0 24px 70px rgba(15,23,42,.24);">${html}<div style="text-align:center;margin-top:16px;"><button type="button" class="btn btn-blue" data-close-student-subject-dialog>关闭</button></div></div>`;
        dialog.addEventListener('click', (event) => {
            if (event.target === dialog || event.target?.hasAttribute?.('data-close-student-subject-dialog')) dialog.remove();
        });
        document.body.appendChild(dialog);
    }

    function syncReportControlsToStudent(student) {
        if (!student) return;
        const schSel = document.getElementById('sel-school');
        const clsSel = document.getElementById('sel-class');
        const nameInput = document.getElementById('inp-name');
        ensureSelectValue(schSel, student.school || '');
        if (typeof window.updateClassSelect === 'function') window.updateClassSelect();
        ensureSelectValue(clsSel, student.class || '');
        if (nameInput) nameInput.value = student.name || '';
    }

    function jumpToStudent(name, school, cls) {
        if (typeof window.closeSpotlight === 'function') window.closeSpotlight();
        const targetStudent = findStudentForJump(name, school, cls);
        if (!targetStudent) {
            alert(`未找到该学生：${name || ''}`);
            return;
        }
        if (typeof window.switchTab === 'function') window.switchTab('report-generator');
        setTimeout(() => {
            syncReportControlsToStudent(targetStudent);
            if (typeof window.doQuery === 'function') window.doQuery(targetStudent);
        }, 80);
    }

    Object.assign(window, {
        jsStringLiteral,
        normalizeJumpClass,
        sameJumpSchoolName,
        getJumpSchoolStudents,
        ensureSelectValue,
        findStudentForJump,
        syncReportControlsToStudent,
        jumpToStudent,
        openStudentSubjectDialog
    });
    window.__STUDENT_JUMP_RUNTIME_PATCHED__ = true;
})();
