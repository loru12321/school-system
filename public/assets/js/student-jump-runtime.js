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
            if (targetSchool && String(student.school || '').trim() !== targetSchool) return false;
            if (targetClass && normalizeJumpClass(student.class) !== targetClass) return false;
            return true;
        };

        const schools = window.SCHOOLS || {};
        const rawData = window.RAW_DATA || [];
        const schoolStudents = targetSchool && schools?.[targetSchool]?.students;
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
        ensureSelectValue,
        findStudentForJump,
        syncReportControlsToStudent,
        jumpToStudent
    });
    window.__STUDENT_JUMP_RUNTIME_PATCHED__ = true;
})();
