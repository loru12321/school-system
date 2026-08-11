(() => {
    if (typeof window === 'undefined' || window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__) return;
    window.TeacherAnalysisPerformanceRuntime = {
        buildTownshipSubjectIndex(rows, subjects, isTownshipSchoolName, hasTownshipSchoolHelper, toNumber) {
            const result = new Map((subjects || []).map((subject) => [subject, { rows: [], scores: [], count: 0, total: 0 }]));
            (rows || []).forEach((row) => {
                const schoolName = String(row?.school || '').trim();
                if (schoolName ? !isTownshipSchoolName(schoolName) : hasTownshipSchoolHelper) return;
                (subjects || []).forEach((subject) => {
                    const score = toNumber(row?.scores?.[subject], NaN);
                    if (!Number.isFinite(score)) return;
                    const aggregate = result.get(subject);
                    aggregate.rows.push(row);
                    aggregate.scores.push(score);
                    aggregate.count += 1;
                    aggregate.total += score;
                });
            });
            return result;
        }
    };
    if (typeof window.refreshTeacherPerformanceCopy === 'function') {
        window.refreshTeacherPerformanceCopy();
    }
    window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__ = true;
})();
