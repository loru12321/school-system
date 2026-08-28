(function (root) {
    'use strict';

    function getCloudRestoreSummary(cohortId = '') {
        const rows = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const examId = String(root.CURRENT_EXAM_ID || root.COHORT_DB?.currentExamId || root.readWorkspaceExamId?.() || '').trim();
        const subjectSet = new Set();
        rows.forEach((row) => {
            const scores = row && typeof row.scores === 'object' ? row.scores : null;
            if (!scores) return;
            Object.keys(scores).forEach((subject) => {
                const name = String(subject || '').trim();
                if (name && name !== '总分' && name !== 'total') subjectSet.add(name);
            });
        });
        const school = String(
            root.MY_SCHOOL_NAME
            || root.MY_SCHOOL
            || root.CONFIG?.schoolName
            || root.CONFIG?.name
            || ''
        ).trim();
        return {
            cohortId: String(cohortId || root.CURRENT_COHORT_ID || '').trim(),
            examId,
            rowCount: rows.length,
            subjectCount: subjectSet.size,
            school
        };
    }

    function formatCloudRestoreSummary(summary = {}) {
        const cohort = summary.cohortId ? `${summary.cohortId}届` : '当前届别';
        const exam = summary.examId || '考试批次待确认';
        const rows = Number(summary.rowCount) || 0;
        const subjects = Number(summary.subjectCount) || 0;
        const school = summary.school || '本校待确认';
        return `${cohort} · ${exam} · ${rows}条成绩 · ${subjects}科 · ${school}`;
    }

    root.getCloudRestoreSummary = root.getCloudRestoreSummary || getCloudRestoreSummary;
    root.formatCloudRestoreSummary = root.formatCloudRestoreSummary || formatCloudRestoreSummary;
}(window));
