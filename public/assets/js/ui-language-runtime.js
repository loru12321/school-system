(function (root) {
    if (!root || root.SystemLanguage) return;

    const language = {
        version: '2026.07.2',
        domains: {
            data: { title: '数据准备', summary: '维护届别、考试、成绩、任课关系和基础设置。' },
            town: { title: '联考评价', summary: '比较学校整体表现、关键位次和重点学生群体。' },
            county: { title: '县域对标', summary: '在县域统一口径下比较学校和教师表现。' },
            class: { title: '教学改进', summary: '查看教师表现和差异，安排校内协作与改进。' },
            student: { title: '学生发展', summary: '查看学生现状、成长变化和需要关注的问题。' },
            tools: { title: '教务执行', summary: '完成考场、分班、排课和学习协作安排。' }
        },
        modules: {
            'starter-hub': { title: '准备状态', hint: '检查届别、考试、成绩和任课表是否齐全。' },
            upload: { title: '导入与设置', hint: '导入成绩并维护学校、科目和基础参数。' },
            'data-quality': { title: '数据检查', hint: '检查缺失、重复和异常数据。' },
            'audio-debug': { title: '提示音设置', hint: '管理系统提示音。' },
            summary: { title: '综合评价', hint: '查看学校排名、梯队分布和整体表现。' },
            analysis: { title: '两率一分对比', hint: '比较重点率、及格率和平均分。' },
            'high-score': { title: '高分学生', hint: '查看高分学生规模、分布和变化。' },
            indicator: { title: '指标生核算', hint: '核对指标生达标情况和临界人数。' },
            bottom3: { title: '后段学生', hint: '查看后段学生分布并安排补弱。' },
            'county-teacher-portrait': { title: '县域教师对比', hint: '比较同学科教师在县域中的相对位置。' },
            'county-school-horizontal': { title: '县域学校对比', hint: '比较县域学校总分和各学科表现。' },
            'teacher-analysis': { title: '教师表现', hint: '查看教师贡献、波动和结构性问题。' },
            'teacher-detail-comparison': { title: '教师指标明细', hint: '查看教师指标、校内排序和明细数据。' },
            'teacher-pairing': { title: '教师协作建议', hint: '根据数据差异安排校内教师协作。' },
            'teacher-township-ranking': { title: '教师乡镇对比', hint: '查看教师在乡镇同学科中的相对位置。' },
            'zhongkao-countdown': { title: '中考日程', hint: '查看中考时间和当前备考阶段。' },
            'student-overview': { title: '学情总览', hint: '查看整体学情、分层和重点信号。' },
            'student-details': { title: '学生成绩明细', hint: '按学生查看成绩、班级和排名。' },
            'blank-score-audit': { title: '空分与零分核对', hint: '核对空白和零分记录。' },
            'subject-balance': { title: '学科优势与短板', hint: '识别学生优势学科和薄弱学科。' },
            'marginal-push': { title: '临界学生', hint: '查看临界学生并安排干预。' },
            'progress-analysis': { title: '进步与增值', hint: '查看学生进步、停滞和回落情况。' },
            'cohort-growth': { title: '成长记录', hint: '查看多次考试形成的成长轨迹。' },
            'potential-analysis': { title: '偏科与潜力', hint: '查找薄弱学科和提升空间。' },
            'segment-analysis': { title: '分数段统计', hint: '查看各分数段人数和变化。' },
            'correlation-analysis': { title: '学科关联分析', hint: '查看学科之间的关联情况。' },
            'report-generator': { title: '成绩反馈', hint: '生成学生成绩单和家长查询页面。' },
            'exam-arranger': { title: '考场编排', hint: '安排考场、监考和座位。' },
            'freshman-simulator': { title: '新生均衡分班', hint: '生成并比较均衡分班方案。' },
            'grade-scheduler': { title: '年级排课', hint: '安排年级课程和教师资源。' },
            'seat-adjustment': { title: '座位与互助组', hint: '调整座位并安排学生互助。' },
            'mutual-aid': { title: '学科互助分组', hint: '按学科优势安排学习互助组。' }
        },
        roles: {
            admin: '系统管理员', director: '教务主任', grade_director: '年级主任',
            class_teacher: '班主任', teacher: '任课教师', parent: '家长', guest: '访客'
        },
        states: {
            cohortEmpty: '未选择届别', gradeEmpty: '未识别年级', modeLoading: '年级待加载',
            loading: '正在加载', ready: '可使用', syncing: '正在同步', empty: '暂无数据', error: '加载失败'
        },
        actions: {
            allModules: '全部功能', moduleNavigation: '模块导航', refresh: '刷新',
            query: '查询', export: '导出', save: '保存', close: '关闭', retry: '重试'
        }
    };

    language.getModule = function (id) {
        return this.modules[String(id || '').trim()] || null;
    };
    language.getDomain = function (id) {
        return this.domains[String(id || '').trim()] || null;
    };
    language.formatCohort = function (value) {
        const text = String(value || '').trim();
        const match = text.match(/(\d{4})/);
        return match ? `${match[1]}级` : (text || this.states.cohortEmpty);
    };
    language.formatGrade = function (value) {
        const text = String(value || '').trim();
        const match = text.match(/(\d+)\s*年级/);
        return match ? `${match[1]}年级` : (text.replace(/\s*模式$/, '') || this.states.gradeEmpty);
    };

    root.SystemLanguage = Object.freeze(language);
}(window));
