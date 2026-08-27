(function () {
    'use strict';

    const toNumber = (value, fallback = 0) => {
        const helper = window.teacherToNumber;
        if (typeof helper === 'function') return helper(value, fallback);
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    };

    const escapeHtml = (value) => {
        const helper = window.teacherEscapeHtml;
        if (typeof helper === 'function') return helper(value);
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    };

    const formatPercent = (value, digits = 1) => {
        const helper = window.teacherFormatPercent;
        if (typeof helper === 'function') return helper(value, digits);
        return `${(toNumber(value, 0) * 100).toFixed(digits)}%`;
    };

    function getSchoolRecord(schoolName) {
        if (typeof window.teacherGetSchoolRecord === 'function') return window.teacherGetSchoolRecord(schoolName);
        const schools = window.SCHOOLS && typeof window.SCHOOLS === 'object' ? window.SCHOOLS : {};
        return schools[schoolName] || null;
    }

    function buildPairId(left, right, subject) {
        return `${[left.name, right.name].sort().join('-')}-${subject}`;
    }

    function buildSubjectAdvice(subject, teachers, reason) {
        const sortedByAvg = [...teachers].sort((left, right) => (
            toNumber(right.data.avgValue ?? right.data.avg, 0)
            - toNumber(left.data.avgValue ?? left.data.avg, 0)
        ));
        return {
            id: `subject-advice-${subject}`,
            kind: 'subject-advice',
            subject,
            teacher1: sortedByAvg[0] || null,
            teacher2: sortedByAvg[1] || null,
            reason,
            teacherNames: sortedByAvg.slice(0, 3).map((teacher) => teacher.name).join('、'),
            score: 0,
            source: 'subject-advice'
        };
    }

    function collectSubjectTeachers(subject) {
        const stats = window.TEACHER_STATS || {};
        return Object.keys(stats)
            .filter((teacherName) => stats[teacherName]?.[subject])
            .map((teacherName) => ({ name: teacherName, data: stats[teacherName][subject] }));
    }

    function generateSubjectPairs(subject, teachers, baseline) {
        if (teachers.length < 2) {
            return [buildSubjectAdvice(
                subject,
                teachers,
                teachers.length
                    ? '该学科当前可用于结对的教师数量不足，建议先补全同学科任课数据，再做互助结对。'
                    : '该学科暂无可用任课教师数据，建议先检查任课表与成绩学科映射。'
            )];
        }

        const typeA = teachers.filter((teacher) => (
            baseline
            && teacher.data.passRate > baseline.passRate
            && teacher.data.excellentRate < baseline.excRate
        ));
        const typeB = teachers.filter((teacher) => (
            baseline
            && teacher.data.excellentRate > baseline.excRate
            && teacher.data.passRate < baseline.passRate
        ));
        const subjectPairs = [];
        typeA.forEach((left) => {
            typeB.forEach((right) => {
                if (left.name === right.name) return;
                subjectPairs.push({
                    id: buildPairId(left, right, subject),
                    subject,
                    teacher1: left,
                    teacher2: right,
                    score: Math.abs(toNumber(left.data.passRate, 0) - toNumber(right.data.passRate, 0))
                        + Math.abs(toNumber(right.data.excellentRate, 0) - toNumber(left.data.excellentRate, 0)),
                    source: 'baseline'
                });
            });
        });

        if (!subjectPairs.length) {
            teachers.forEach((left) => {
                teachers.forEach((right) => {
                    if (left.name === right.name) return;
                    const passGap = toNumber(left.data.passRate, 0) - toNumber(right.data.passRate, 0);
                    const excellentGap = toNumber(right.data.excellentRate, 0) - toNumber(left.data.excellentRate, 0);
                    const countGapPenalty = Math.abs(
                        Math.sqrt(Math.max(toNumber(left.data.studentCount, 0), 0))
                        - Math.sqrt(Math.max(toNumber(right.data.studentCount, 0), 0))
                    ) * 0.01;
                    const score = passGap + excellentGap - countGapPenalty;
                    if (score <= 0.015 || passGap <= 0 || excellentGap <= 0) return;
                    subjectPairs.push({
                        id: buildPairId(left, right, subject),
                        subject,
                        teacher1: left,
                        teacher2: right,
                        score,
                        source: 'complement'
                    });
                });
            });
        }

        if (!subjectPairs.length) {
            const byPass = [...teachers].sort((left, right) => (
                toNumber(right.data.passRate, 0) - toNumber(left.data.passRate, 0)
                || toNumber(right.data.studentCount, 0) - toNumber(left.data.studentCount, 0)
            ));
            const byExcellent = [...teachers].sort((left, right) => (
                toNumber(right.data.excellentRate, 0) - toNumber(left.data.excellentRate, 0)
                || toNumber(right.data.studentCount, 0) - toNumber(left.data.studentCount, 0)
            ));
            const passLead = byPass[0];
            const excellentLead = byExcellent.find((teacher) => teacher.name !== passLead?.name);
            if (passLead && excellentLead) {
                subjectPairs.push({
                    id: buildPairId(passLead, excellentLead, subject),
                    subject,
                    teacher1: passLead,
                    teacher2: excellentLead,
                    score: Math.abs(toNumber(passLead.data.passRate, 0) - toNumber(excellentLead.data.passRate, 0))
                        + Math.abs(toNumber(excellentLead.data.excellentRate, 0) - toNumber(passLead.data.excellentRate, 0)),
                    source: 'coverage'
                });
            } else {
                subjectPairs.push(buildSubjectAdvice(
                    subject,
                    teachers,
                    '该学科教师表现接近，建议以同课异构、作业面批和临界生跟踪作为本轮教研重点。'
                ));
            }
        }

        return subjectPairs.sort((left, right) => right.score - left.score);
    }

    function renderPairCard(pair) {
        const card = document.createElement('div');
        card.className = 'pairing-card';
        if (pair.kind === 'subject-advice') {
            card.innerHTML = `
                <div class="pairing-side">
                    <div class="pairing-role">学科建议</div>
                    <div class="pairing-name">${escapeHtml(pair.subject)}</div>
                    <div class="pairing-skill">${escapeHtml(pair.teacherNames || '暂无可配对教师')}</div>
                    <div class="pairing-need">${escapeHtml(pair.reason || '建议补全任课与成绩数据后再生成结对。')}</div>
                </div>
                <div class="pairing-arrow">
                    <div style="text-align:center;">
                        <i class="ti ti-bulb"></i>
                        <div class="pairing-tag">${escapeHtml(pair.subject)}</div>
                    </div>
                </div>
                <div class="pairing-side" style="text-align:right;">
                    <div class="pairing-role">下一步</div>
                    <div class="pairing-name">教研组跟进</div>
                    <div class="pairing-skill">覆盖本届别学科</div>
                    <div class="pairing-need">形成学科行动清单</div>
                </div>
            `;
            return card;
        }
        card.innerHTML = `
            <div class="pairing-side">
                <div class="pairing-role">基础扎实型</div>
                <div class="pairing-name">${escapeHtml(pair.teacher1.name)}</div>
                <div class="pairing-skill">及格率高 (${formatPercent(pair.teacher1.data.passRate, 1)})</div>
                <div class="pairing-need">需提升优秀率</div>
            </div>
            <div class="pairing-arrow">
                <div style="text-align:center;">
                    <i class="ti ti-arrows-left-right"></i>
                    <div class="pairing-tag">${escapeHtml(pair.subject)}</div>
                </div>
            </div>
            <div class="pairing-side" style="text-align:right;">
                <div class="pairing-role">培优拔尖型</div>
                <div class="pairing-name">${escapeHtml(pair.teacher2.name)}</div>
                <div class="pairing-skill">优秀率高 (${formatPercent(pair.teacher2.data.excellentRate, 1)})</div>
                <div class="pairing-need">需提升及格率</div>
            </div>
        `;
        return card;
    }

    function generateTeacherPairing() {
        const container = document.getElementById('teacher-pairing-suggestions');
        if (!container) return;
        container.innerHTML = '';
        const schoolRecord = getSchoolRecord(window.MY_SCHOOL);
        if (!window.MY_SCHOOL || !schoolRecord) return;

        const pairs = [];
        const seenPairIds = new Set();
        const addPair = (pair) => {
            if (!pair) return;
            if (pair.kind !== 'subject-advice' && (!pair.teacher1 || !pair.teacher2 || pair.teacher1.name === pair.teacher2.name)) return;
            if (seenPairIds.has(pair.id)) return;
            seenPairIds.add(pair.id);
            pairs.push(pair);
        };

        (window.SUBJECTS || []).forEach((subject) => {
            const subjectPairs = generateSubjectPairs(subject, collectSubjectTeachers(subject), schoolRecord.metrics?.[subject]);
            addPair(subjectPairs[0]);
            subjectPairs.slice(1, 2).forEach(addPair);
        });

        if (!pairs.length) {
            container.innerHTML = '<div style="text-align:center; color:#999; grid-column:1/-1;">暂无可用结对建议，请先检查当前届别学科、任课表和成绩数据。</div>';
            return;
        }
        pairs.forEach((pair) => container.appendChild(renderPairCard(pair)));
    }

    window.generateTeacherPairing = generateTeacherPairing;
    window.__TEACHER_PAIRING_RUNTIME_PATCHED__ = true;
})();
