(function installDemoDataRuntime(root) {
    if (!root) return;

    const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    const cohorts = ['2022', '2023', '2024'];
    const teachers = ['张伟', '王芳', '李娜', '刘强', '陈静', '杨敏', '黄磊', '赵磊', '周涛', '吴洋', '孙丽', '胡勇'];

    function getRequiredFunction(name) {
        const fn = root[name];
        if (typeof fn !== 'function') throw new Error(`演示数据运行时缺少 ${name}，请刷新页面后重试`);
        return fn;
    }

    function generateChineseName() {
        const familyNames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜';
        const givenNames = '嘉懿煜城懿轩烨华煜祺智宸正豪昊然志泽明杰弘文熠彤鸿煊远航旭尧';
        const family = familyNames[Math.floor(Math.random() * familyNames.length)];
        const givenOne = givenNames[Math.floor(Math.random() * givenNames.length)];
        const givenTwo = Math.random() > 0.3 ? givenNames[Math.floor(Math.random() * givenNames.length)] : '';
        return family + givenOne + givenTwo;
    }

    async function loadDemoData() {
        const demoSchool = String(root.DEFAULT_MY_SCHOOL_NAME || '银山实验').trim() || '银山实验';
        const setSubjects = getRequiredFunction('setSubjects');
        const setRawData = getRequiredFunction('setRawData');
        const setSchools = getRequiredFunction('setSchools');
        const setThresholds = getRequiredFunction('setThresholds');
        const setTeacherMap = getRequiredFunction('setTeacherMap');

        const rawData = [];
        const schools = {};
        const teacherAssignments = {};
        let studentId = 1;

        ['9', '8', '7'].forEach((gradeLevel, gradeIndex) => {
            const cohort = cohorts[gradeIndex];
            for (let classNumber = 1; classNumber <= 4; classNumber += 1) {
                const className = `${gradeLevel}.${classNumber}`;

                subjects.forEach((subject) => {
                    const teacher = teachers[Math.floor(Math.random() * teachers.length)];
                    teacherAssignments[`${className}_${subject}`] = teacher;
                });

                for (let index = 0; index < 40; index += 1) {
                    const student = {
                        id: `S${String(studentId).padStart(5, '0')}`,
                        name: generateChineseName(),
                        school: demoSchool,
                        class: className,
                        cohort,
                        scores: {},
                        total: 0
                    };

                    subjects.forEach((subject) => {
                        const base = 65 + Math.random() * 30;
                        const bonus = Math.random() > 0.8 ? 5 : 0;
                        const score = Math.floor(Math.min(120, Math.max(20, base + bonus + (Math.random() * 10 - 5))));
                        student.scores[subject] = score;
                        student.total += score;
                    });

                    rawData.push(student);
                    if (!schools[demoSchool]) schools[demoSchool] = { name: demoSchool, students: [], metrics: {}, rankings: {} };
                    schools[demoSchool].students.push(student);
                    studentId += 1;
                }
            }
        });

        setSubjects(subjects);
        setRawData(rawData);
        setSchools(schools);
        setThresholds({
            '总分': { excellent: 650, pass: 420 },
            '语文': { excellent: 108, pass: 72 },
            '数学': { excellent: 108, pass: 72 },
            '英语': { excellent: 108, pass: 72 }
        });
        setTeacherMap(teacherAssignments);

        if (typeof root.writeCurrentSchool === 'function') root.writeCurrentSchool(demoSchool);
        if (typeof root.writeCurrentTermId === 'function') root.writeCurrentTermId('2025-2026_上学期');

        const cohortId = '2022';
        const examId = '2026_校内首模';
        if (typeof root.syncWorkspaceRuntimeState === 'function') {
            root.syncWorkspaceRuntimeState({
                currentCohortId: cohortId,
                currentExamId: examId,
                cohortDb: root.COHORT_DB
            });
        }
        root.CURRENT_COHORT_ID = cohortId;
        root.CURRENT_EXAM_ID = examId;

        if (root.UI && typeof root.UI.toast === 'function') {
            root.UI.toast('✨ 演示环境已就绪，所有模块均已载入模拟数据', 'success');
        }

        if (typeof root.processData === 'function') await root.processData();
        if (typeof root.calculateRankings === 'function') root.calculateRankings();
        if (typeof root.analyzeTeachers === 'function') root.analyzeTeachers();
        if (typeof root.renderTeacherComparisonTable === 'function') root.renderTeacherComparisonTable();
        if (typeof root.renderTeacherCards === 'function') root.renderTeacherCards();
        if (typeof root.updateStatusPanel === 'function') root.updateStatusPanel();
        return true;
    }

    root.DemoDataRuntime = { loadDemoData };
    root.loadDemoData = loadDemoData;
})(window);
