(() => {
    if (typeof window === 'undefined' || window.__REPORT_COMPARE_RUNTIME_PATCHED__) return;

const CompareSessionStateRuntime = window.CompareSessionState || null;
const readCloudStudentCompareContextSessionState = typeof window.readCloudStudentCompareContextState === 'function'
    ? window.readCloudStudentCompareContextState
    : (() => {
        if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getCloudStudentCompareContext === 'function') {
            return CompareSessionStateRuntime.getCloudStudentCompareContext() || null;
        }
        return null;
    });

function getCloudCompareHint(student) {
    if (!isCloudContextMatchStudent(student) && !isCloudContextLikelyCurrentTarget(student)) return null;
    return readCloudStudentCompareContextSessionState() || null;
}

function getCloudPreviousRecord(student) {
    return getCloudCompareHint(student)?.previousRecord || null;
}

function getCloudPreviousSubjectScores(subject, student) {
    const scores = getCloudCompareHint(student)?.previousSubjectScores?.[subject];
    return Array.isArray(scores) ? scores : null;
}


function getPreviousExamSubjectScores(subject, student, prevStu) {
    let scores = getCloudPreviousSubjectScores(subject, student);
    if (Array.isArray(scores) && scores.length >= 5) return scores;

    const cloudCompareContext = getCloudCompareHint(student) || readCloudStudentCompareContextSessionState();
    const examKey = String(
        cloudCompareContext?.prevExamId ||
        prevStu?._sourceExam ||
        prevStu?.examFullKey ||
        prevStu?.examId ||
        ''
    ).trim();

    if (examKey && typeof CohortDB !== 'undefined') {
        try {
            const db = CohortDB.ensure();
            const exams = db?.exams || {};
            let snap = exams[examKey];
            if (!snap) {
                snap = Object.values(exams).find(ex => {
                    const id = String(ex?.examId || '').trim();
                    return id === examKey || id.endsWith(`_${examKey}`) || examKey.endsWith(`_${id}`);
                });
            }
            if (snap && Array.isArray(snap.data)) {
                const arr = snap.data.map(s => s?.scores?.[subject]).filter(v => typeof v === 'number');
                if (arr.length > 0) return arr;
            }
        } catch (e) { }
    }

    scores = (window.PREV_DATA || [])
        .map(s => (s.student?.scores || s.scores || {})[subject])
        .filter(v => typeof v === 'number');
    return scores.length ? scores : null;
}

async function viewCloudStudentComparesForCurrentStudent(name, className, schoolName) {
    if (name || className || schoolName) {
        setCloudCompareTarget(name, className, schoolName);
    } else {
        setCloudCompareTarget(resolveCloudCompareTarget(getCurrentUser()));
    }
    if (typeof moveFocusOutOfParentView === 'function') {
        moveFocusOutOfParentView();
    } else if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
    }
    await new Promise(r => setTimeout(r, 16));
    return viewCloudStudentCompares(true);
}

function loadCloudStudentCompareForCurrentStudent(key) {
    return loadCloudStudentCompare(key, true);
}

// Student compare generate runtime moved to public/assets/js/student-compare-generate-runtime.js


// Student compare result runtime moved to public/assets/js/student-compare-result-runtime.js


// Compare exam identity runtime moved to public/assets/js/compare-shared-runtime.js

    Object.assign(window, {
        getCloudCompareHint,
        getCloudPreviousRecord,
        getCloudPreviousSubjectScores,
        getPreviousExamSubjectScores,
        viewCloudStudentComparesForCurrentStudent,
        loadCloudStudentCompareForCurrentStudent,
        // `doQuery` belongs to report-history-runtime.js and may arrive later
        // when the boot loader is recovering from a slow/failed core request.
        // Do not dereference the bare binding here; report-history publishes it
        // on window as soon as its own script executes.
        // These comparison-render exports may also arrive late; reading them
        // from window keeps this bridge load-order safe on slow connections.
        getComparisonTotalSubjects: window.getComparisonTotalSubjects,
        getComparisonStudentView: window.getComparisonStudentView,
        getComparisonStudentList: window.getComparisonStudentList,
        formatComparisonExamLabel: window.formatComparisonExamLabel,
        getLatestHistoryExamEntry: window.getLatestHistoryExamEntry,
        getComparisonTotalValue: window.getComparisonTotalValue,
        createComparisonStudentView: window.createComparisonStudentView,
        recalcPrevTotal: window.recalcPrevTotal,
        findPreviousRecord: window.findPreviousRecord,
        getStudentExamHistory: window.getStudentExamHistory
    });

    window.__REPORT_COMPARE_RUNTIME_PATCHED__ = true;
})();
