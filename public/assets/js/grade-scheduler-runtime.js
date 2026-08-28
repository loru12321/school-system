(() => {
    if (typeof window === 'undefined' || window.__GRADE_SCHEDULER_RUNTIME_PATCHED__) return;

const SCHEDULER = {
    // data 仅供既有预览/教师视图使用；真正的排课输入统一收敛到逐班 demands。
    // 这样同一教师在 6、7 年级的课时可以不同，且整个项目只有一个资源占用表。
    data: [],
    demands: [], // { grade, className, name, subject, weeklyHours, venue, note }
    classMeta: Object.create(null),
    lockedSchedule: Object.create(null), // 已确认级部课表：作为本项目不可移动的底图
    importWarnings: [],
    schedule: {}, // 结果
    classes: [], // 本学年联合项目的全部班级
    teacherSlotIndex: null,
    venueSlotIndex: null,
    maxIterations: 8000,
    manualSelection: null,
    manualHistory: [],
    lastPreflight: null,
    scheduleRenderVersion: 0,
    tableRenderCache: { signature: '', html: '' },
    classSubjectDayIndex: null,
    teacherDayLoadIndex: null,

    // 存储动态添加的规则
    rules: {
        meetings: [], // 班会 [{day:1, slot:'pm_3'}]
        busy: [],     // 教师忙
        activities: [], // 活动
        combined: []  // 🟢 新增：合堂规则 [{subject:'物理', slot:'eve_3'}]
    },

    // --- 1. 约束规则管理 (更新) ---
    addConstraint: function (type) {
        // 🟢 新增 combined 类型的处理
        if (type === 'combined') {
            const subject = document.getElementById('sch_comb_subject').value;
            const slot = this.normalizeSlotCode(document.getElementById('sch_comb_slot').value); // 'eve_3'
            const scope = String(document.getElementById('sch_comb_scope')?.value || 'grade');

            // 同一学科可以分别配置“同年级合堂”和“跨年级合堂”，但默认绝不跨年级。
            if (this.rules.combined.some(r => r.subject === subject && r.scope === scope)) {
                return window.UI.alert(`学科 [${subject}] 已存在相同范围的合堂规则，请勿重复添加。`);
            }

            this.rules.combined.push({ subject, slot, scope, id: Date.now() });
            this.renderTags('combined', this.rules.combined, r => `🔗 ${r.subject} (${this.getSlotName(r.slot)} · ${r.scope === 'all' ? '允许跨年级' : '同年级'}合堂)`);
            this.preflight({ silent: true });
        }
        else if (type === 'meeting') {
            const day = document.getElementById('sch_meet_day').value;
            const slot = this.normalizeSlotCode(document.getElementById('sch_meet_slot').value);
            const scope = String(document.getElementById('sch_meet_scope')?.value || 'ALL');
            const key = `${day}_${slot}_${scope}`;
            if (this.rules.meetings.some(m => `${m.day}_${m.slot}_${m.scope || 'ALL'}` === key)) return;

            this.rules.meetings.push({ day, slot, scope, id: Date.now() });
            this.renderTags('meeting', this.rules.meetings, m => `周${m.day} ${this.getSlotName(m.slot)} (${this.getScopeName(m.scope)}班会)`);
            this.preflight({ silent: true });
        }
        else if (type === 'busy') {
            const day = document.getElementById('sch_busy_day').value;
            const name = document.getElementById('sch_busy_name').value.trim();
            const slotsRaw = document.getElementById('sch_busy_slots').value.trim();
            if (!name || !slotsRaw) return window.UI.alert("请填写教师姓名和节次");

            this.rules.busy.push({ day, slotsStr: slotsRaw, name, id: Date.now() });
            this.renderTags('busy', this.rules.busy, b => `${b.name}: 周${b.day} [${b.slotsStr}] 不排`);
            document.getElementById('sch_busy_name').value = '';
            this.preflight({ silent: true });
        }
        else if (type === 'activity') {
            const day = document.getElementById('sch_act_day').value;
            const range = document.getElementById('sch_act_range').value;
            const subject = document.getElementById('sch_act_subject').value;
            const scope = String(document.getElementById('sch_act_scope')?.value || 'ALL');
            const slotsStr = String(document.getElementById('sch_act_custom_slots')?.value || '').trim();
            if (range === 'custom' && !slotsStr) return window.UI.alert('请填写需要锁定的节次，例如：1,2 或 am_1,pm_2。');
            const labelRange = range === 'pm_all' ? '下午' : (range === 'am_all' ? '上午' : (range === 'eve_all' ? '晚自习' : `指定节次 ${slotsStr}`));

            this.rules.activities.push({ day, range, subject, scope, slotsStr, id: Date.now() });
            this.renderTags('activity', this.rules.activities, a => `周${a.day} ${labelRange} (${this.getScopeName(a.scope)} · ${a.subject === "ALL" ? "无课" : a.subject + "教研"})`);
            this.preflight({ silent: true });
        }
    },

    removeConstraint: function (type, id) {
        if (type === 'meeting') this.rules.meetings = this.rules.meetings.filter(x => x.id !== id);
        if (type === 'busy') this.rules.busy = this.rules.busy.filter(x => x.id !== id);
        if (type === 'activity') this.rules.activities = this.rules.activities.filter(x => x.id !== id);
        // 🟢 新增 combined 删除
        if (type === 'combined') this.rules.combined = this.rules.combined.filter(x => x.id !== id);

        // 重新渲染对应区域
        if (type === 'meeting') this.renderTags('meeting', this.rules.meetings, m => `周${m.day} ${this.getSlotName(m.slot)} (${this.getScopeName(m.scope)}班会)`);
        if (type === 'busy') this.renderTags('busy', this.rules.busy, b => `${b.name}: 周${b.day} [${b.slotsStr}] 不排`);
        if (type === 'activity') this.renderTags('activity', this.rules.activities, a => `周${a.day} ${a.range} (${this.getScopeName(a.scope)} · ${a.subject})`);
        // 🟢 新增 combined 渲染
        if (type === 'combined') this.renderTags('combined', this.rules.combined, r => `🔗 ${r.subject} (${this.getSlotName(r.slot)} · ${r.scope === 'all' ? '允许跨年级' : '同年级'}合堂)`);
        this.preflight({ silent: true });
    },

    renderTags: function (type, list, labelFn) {
        const container = document.getElementById(`sch_tags_${type}`);
        if (!container) return; // 防御性检查
        container.innerHTML = '';
        list.forEach(item => {
            const tag = document.createElement('div');
            tag.className = 'tag-chip';
            // 根据类型给不同颜色
            if (type === 'meeting') tag.style.background = '#e0e7ff';
            if (type === 'busy') tag.style.background = '#fff7ed';
            if (type === 'activity') tag.style.background = '#dcfce7';
            if (type === 'combined') { tag.style.background = '#ffedd5'; tag.style.color = '#9a3412'; }
            tag.innerHTML = `${labelFn(item)} <span class="tag-chip-remove" onclick="SCHEDULER.removeConstraint('${type}', ${item.id})">&times;</span>`;
            container.appendChild(tag);
        });
    },

    normalizeSlotCode: function (code) {
        return String(code || '').trim().replace(/^(am|pm|eve)_?(\d+)$/, '$1_$2');
    },

    getSlotName: function (code) {
        const map = { 'am': '上午', 'pm': '下午', 'eve': '晚' };
        const parts = this.normalizeSlotCode(code).split('_');
        if (parts.length >= 2) return `${map[parts[0]] || ''}第${parts[parts.length - 1]}节`;
        return code;
    },

    escapeHtml: function (value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char]));
    },

    normalizeGrade: function (value) {
        const match = String(value == null ? '' : value).match(/[6-9]/);
        return match ? match[0] : '';
    },

    normalizeClassName: function (gradeValue, classValue) {
        const grade = this.normalizeGrade(gradeValue);
        const raw = String(classValue == null ? '' : classValue)
            .replace(/\s+/g, '')
            .replace(/班$/, '');
        if (!raw) return '';
        const full = raw.match(/^([6-9])[._-]?(\d{1,2})$/);
        if (full) return `${full[1]}.${Number(full[2])}`;
        if (grade && /^\d{1,2}$/.test(raw)) return `${grade}.${Number(raw)}`;
        return raw;
    },

    inferGradeFromClass: function (className) {
        const known = this.classMeta[String(className || '')]?.grade;
        return known || this.normalizeGrade(className);
    },

    getScopeName: function (scope) {
        const value = String(scope || 'ALL');
        return value === 'ALL' ? '全部年级' : `${value}年级`;
    },

    getScopeClasses: function (scope) {
        const value = String(scope || 'ALL');
        return value === 'ALL'
            ? [...this.classes]
            : this.classes.filter((className) => this.inferGradeFromClass(className) === value);
    },

    getProjectGrades: function () {
        return [...new Set(this.classes.map((className) => this.inferGradeFromClass(className)).filter(Boolean))]
            .filter((grade) => !window.TeachingWorkbenchCohort?.isAllowedGrade || window.TeachingWorkbenchCohort.isAllowedGrade(grade))
            .sort((a, b) => Number(a) - Number(b));
    },

    getCrossGradeTeachers: function () {
        const map = new Map();
        this.demands.forEach((demand) => {
            const teacher = this.normalizeTeacherName(demand.name);
            if (!teacher) return;
            if (!map.has(teacher)) map.set(teacher, new Set());
            if (demand.grade) map.get(teacher).add(String(demand.grade));
        });
        return [...map.entries()]
            .filter(([, grades]) => grades.size > 1)
            .map(([name, grades]) => ({ name, grades: [...grades].sort((a, b) => Number(a) - Number(b)) }));
    },

    refreshGradeScopeControls: function () {
        const grades = this.getProjectGrades();
        ['sch_meet_scope', 'sch_act_scope'].forEach((id) => {
            const select = document.getElementById(id);
            if (!select) return;
            const current = select.value || 'ALL';
            select.innerHTML = `<option value="ALL">全部导入年级</option>${grades.map((grade) => `<option value="${grade}">${grade}年级</option>`).join('')}`;
            select.value = [...select.options].some((option) => option.value === current) ? current : 'ALL';
        });
    },

    getSlotConfig: function () {
        const readCount = (id, fallback) => {
            const value = parseInt(document.getElementById(id)?.value, 10);
            return Number.isFinite(value) && value >= 0 ? value : fallback;
        };
        return {
            am: readCount('sch_am_count', 4),
            pm: readCount('sch_pm_count', 4),
            eve: readCount('sch_eve_count', 3)
        };
    },

    isValidSlotCode: function (slotCode, config = this.getSlotConfig()) {
        const match = this.normalizeSlotCode(slotCode).match(/^(am|pm|eve)_(\d+)$/);
        if (!match) return false;
        return Number(match[2]) >= 1 && Number(match[2]) <= Number(config[match[1]] || 0);
    },

    getActivitySlots: function (activity, config = this.getSlotConfig()) {
        if (!activity) return [];
        if (activity.range === 'custom') {
            return this.parseBusySlots(activity.day, activity.slotsStr || '', config.am, config.pm, config.eve);
        }
        return this.resolveTimeRange(activity.day, activity.range, config.am, config.pm, config.eve);
    },

    getConstraintCounts: function () {
        return {
            meetings: this.rules.meetings.length,
            busy: this.rules.busy.length,
            activities: this.rules.activities.length,
            combined: this.rules.combined.length
        };
    },

    preflight: function (options = {}) {
        const config = this.getSlotConfig();
        const errors = [];
        const warnings = [];
        const demands = Array.isArray(this.demands) ? this.demands : [];
        const teachers = new Set(demands.map(item => this.normalizeTeacherName(item.name)).filter(Boolean));
        const subjects = new Set(demands.map(item => String(item.subject || '').trim()).filter(Boolean));
        const grades = this.getProjectGrades();
        const crossGradeTeachers = this.getCrossGradeTeachers();
        const lockedCellCount = this.countScheduleCells(this.lockedSchedule);
        const availableSlots = this.getAllSlots(config).filter((slot) => !this.isGloballyClosedSlot(slot)).length;

        if (!demands.length) errors.push('请先导入“学年联合任课表”。');
        if (!this.classes.length) errors.push('任课表中未识别到班级，请检查“年级”和“班级”列。');
        if (config.am + config.pm + config.eve <= 0) errors.push('上午、下午和晚自习节数不能同时为 0。');
        if (grades.length < 2 && demands.length) warnings.push('当前只导入了一个年级；跨级教师避让需要把相关年级一起导入同一份任课表。');

        demands.forEach((demand) => {
            if (!Number.isInteger(Number(demand.weeklyHours)) || Number(demand.weeklyHours) <= 0) {
                errors.push(`${demand.className}班 ${demand.subject}（${demand.name}）的“每班周课时”必须是正整数。`);
            }
            if (Number(demand.weeklyHours) > availableSlots) {
                errors.push(`${demand.className}班 ${demand.subject} 需要 ${demand.weeklyHours} 节，超过当前可排的 ${availableSlots} 个时段。`);
            }
        });
        this.importWarnings.forEach((warning) => warnings.push(warning));
        crossGradeTeachers.forEach(({ name, grades: teacherGrades }) => {
            warnings.push(`跨级教师“${name}”覆盖 ${teacherGrades.join('、')} 年级，将在同一教师时段表内统一避让。`);
        });

        this.rules.meetings.forEach((rule) => {
            if (!this.isValidSlotCode(rule.slot, config)) {
                errors.push(`固定班会“周${rule.day} ${this.getSlotName(rule.slot)}”超出当前课时结构。`);
            }
            if (!this.getScopeClasses(rule.scope).length) warnings.push(`班会规则“${this.getScopeName(rule.scope)}”当前没有对应班级。`);
        });
        this.rules.busy.forEach((rule) => {
            if (!teachers.has(this.normalizeTeacherName(rule.name))) {
                warnings.push(`教师禁排中的“${rule.name}”未在任课表中识别到；该条规则暂不会命中排课教师。`);
            }
            const invalid = this.parseBusySlots(rule.day, rule.slotsStr, config.am, config.pm, config.eve)
                .some(slotId => !this.isValidSlotCode(slotId.replace(/^d\d+_/, ''), config));
            if (invalid) errors.push(`教师“${rule.name}”的禁排节次超出当前课时结构。`);
        });
        this.rules.activities.forEach((rule) => {
            const slots = this.getActivitySlots(rule, config);
            if (!slots.length) errors.push(`教研/无课规则“周${rule.day}”未识别到有效节次。`);
            if (slots.some(slotId => !this.isValidSlotCode(slotId.replace(/^d\d+_/, ''), config))) {
                errors.push(`教研/无课规则“周${rule.day}”包含超出当前课时结构的节次。`);
            }
            if (rule.subject !== 'ALL' && !subjects.has(rule.subject)) {
                warnings.push(`“${rule.subject}”教研规则未在任课表中识别到该学科。`);
            }
            if (!this.getScopeClasses(rule.scope).length) warnings.push(`教研/无课规则“${this.getScopeName(rule.scope)}”当前没有对应班级。`);
        });
        this.rules.combined.forEach((rule) => {
            if (!subjects.has(rule.subject)) warnings.push(`合堂规则“${rule.subject}”未在任课表中识别到该学科。`);
            if (!this.isValidSlotCode(rule.slot, config)) {
                errors.push(`合堂规则“${rule.subject} ${this.getSlotName(rule.slot)}”超出当前课时结构。`);
            }
        });

        this.getScheduleResourceConflicts(this.lockedSchedule).forEach((conflict) => {
            errors.push(`锁定课表存在${conflict.type === 'venue' ? '场地' : '教师'}冲突：${conflict.name} 在 ${this.getSlotName(conflict.slotId.replace(/^d\d+_/, ''))} 被 ${conflict.classes.join('、')} 同时占用。`);
        });
        const slotById = new Map(this.getAllSlots(config).map((slot) => [slot.id, slot]));
        Object.entries(this.lockedSchedule || {}).forEach(([className, entries]) => {
            Object.entries(entries || {}).forEach(([slotId, cell]) => {
                if (slotId.startsWith('_') || !cell) return;
                const slot = slotById.get(slotId);
                if (!slot) {
                    errors.push(`锁定课表中的 ${className}班 ${slotId} 不在当前课时结构内。`);
                    return;
                }
                if (this.isGloballyClosedSlot(slot)) {
                    errors.push(`锁定课表中的 ${className}班 ${this.getSlotName(slotId.replace(/^d\d+_/, ''))} 与周五停课规则冲突。`);
                }
                this.rules.meetings.forEach((rule) => {
                    const meetingSlot = `d${rule.day}_${this.normalizeSlotCode(rule.slot)}`;
                    if (meetingSlot === slotId && this.getScopeClasses(rule.scope).includes(className)
                        && cell.subject !== '班会') {
                        errors.push(`锁定课表中的 ${className}班 ${this.getSlotName(slotId.replace(/^d\d+_/, ''))} 与班会规则冲突。`);
                    }
                });
                this.rules.activities.forEach((rule) => {
                    const applies = this.getScopeClasses(rule.scope).includes(className);
                    const isClosed = rule.subject === 'ALL' || rule.subject === cell.subject;
                    if (applies && isClosed && this.getActivitySlots(rule, config).includes(slotId)
                        && cell.subject !== '🚫 无课') {
                        errors.push(`锁定课表中的 ${className}班 ${this.getSlotName(slotId.replace(/^d\d+_/, ''))} 与教研/无课规则冲突。`);
                    }
                });
                const teacher = this.normalizeTeacherName(cell.teacher);
                if (teacher && teacher !== '-') {
                    this.rules.busy.forEach((rule) => {
                        const blocked = this.parseBusySlots(rule.day, rule.slotsStr, config.am, config.pm, config.eve);
                        if (this.normalizeTeacherName(rule.name) === teacher && blocked.includes(slotId)) {
                            errors.push(`锁定课表中的教师“${teacher}”在 ${this.getSlotName(slotId.replace(/^d\d+_/, ''))} 被设置为禁排。`);
                        }
                    });
                }
            });
        });
        if (lockedCellCount) warnings.push(`已载入 ${lockedCellCount} 节锁定课表；生成时将只为其余时段排课。`);

        const counts = this.getConstraintCounts();
        const result = {
            ok: errors.length === 0,
            errors,
            warnings,
            counts,
            meta: {
                classCount: this.classes.length,
                teacherCount: teachers.size,
                gradeCount: grades.length,
                grades,
                crossGradeTeachers,
                lockedCellCount,
                venueCount: new Set(demands.map((demand) => String(demand.venue || '').trim()).filter(Boolean)).size,
                config
            }
        };
        this.lastPreflight = result;
        this.renderPreflight(result);
        if (!options.silent && window.UI) {
            UI.toast(result.ok
                ? `规则预检通过：${result.meta.classCount} 个班级、${result.meta.teacherCount} 位教师。`
                : `规则预检发现 ${result.errors.length} 项需要处理的问题。`, result.ok ? 'success' : 'warning');
        }
        return result;
    },

    renderPreflight: function (result) {
        const area = document.getElementById('sch_preflight_area');
        const summary = document.getElementById('sch_preflight_summary');
        const issues = document.getElementById('sch_preflight_issues');
        if (!area || !summary || !issues) return;
        area.classList.remove('hidden');
        const counts = result.counts;
        summary.innerHTML = [
            `<strong>${result.ok ? '可生成课表' : '暂不建议生成'}</strong>`,
            `${result.meta.gradeCount || 0} 个年级 / ${result.meta.classCount} 个班级`,
            `${result.meta.teacherCount} 位教师`,
            `跨级 ${result.meta.crossGradeTeachers.length} 位 / 锁定 ${result.meta.lockedCellCount} 节`,
            `班会 ${counts.meetings} · 禁排 ${counts.busy} · 教研 ${counts.activities} · 合堂 ${counts.combined}`
        ].join(' <span class="scheduler-summary-sep">·</span> ');
        const items = [
            ...result.errors.map(text => ({ type: 'error', text })),
            ...result.warnings.map(text => ({ type: 'warning', text }))
        ];
        issues.innerHTML = items.length
            ? items.map(item => `<div class="scheduler-preflight-item is-${item.type}"><i class="ti ${item.type === 'error' ? 'ti-alert-triangle' : 'ti-info-circle'}"></i>${this.escapeHtml(item.text)}</div>`).join('')
            : '<div class="scheduler-preflight-item is-ok"><i class="ti ti-circle-check"></i>任课资源与已配置规则可以直接用于本轮排课。</div>';
    },

    onActivityRangeChange: function (select) {
        const custom = document.getElementById('sch_act_custom_slots');
        if (!custom) return;
        custom.style.display = String(select?.value || '') === 'custom' ? '' : 'none';
    },

    downloadTemplate: function () {
        const wb = XLSX.utils.book_new();
        const demandRows = [
            ['年级', '班级', '教师姓名', '学科', '每班周课时', '场地/资源（可选）', '备注（可选）'],
            [6, '6.1', 'A教师', '生物', 2, '', '仅教六年级'],
            [6, '6.5', 'B教师', '生物', 2, '生物实验室', '跨 6、7 年级，逐班填写'],
            [6, '6.6', 'B教师', '生物', 2, '生物实验室', '跨 6、7 年级，逐班填写'],
            [7, '7.1', 'B教师', '生物', 3, '生物实验室', '同一教师同一时段只能上一节'],
            [7, '7.2', 'B教师', '生物', 3, '生物实验室', '同一教师同一时段只能上一节'],
            [7, '7.3', 'C教师', '生物', 3, '生物实验室', '与 B教师 共用场地时也会避让'],
            [6, '6.1', '体育教师', '体育', 2, '田径场', '跨级教师示例'],
            [7, '7.1', '体育教师', '体育', 2, '田径场', '跨级教师示例']
        ];
        const guideRows = [
            ['学年联合排课模板填写说明'],
            ['1. 一班一行：同一教师教多个班，必须分别填写每个班的周课时，不要把多个班合在同一个单元格。'],
            ['2. 联合导入：所有会共享教师或场地的年级（如 6、7 年级）必须放在同一工作簿、同一张“联合任课表”中。'],
            ['3. 班级写法：推荐“6.1、6.10、7.1”；“年级”与“班级”均为必填，系统会以二者组成唯一班级。'],
            ['4. 每班周课时：填写该教师在这个班一周实际要上的节数。不同年级、不同班可不同。'],
            ['5. 场地/资源：体育场、实验室、微机室等共享资源请填写同一个名称；系统会与教师冲突一并避让。'],
            ['6. 已先排年级：先导入完整联合任课表，再点“导入锁定级部课表”，导入已确认年级的导出表；锁定课不会被重新排动。'],
            ['7. 推荐流程：下载模板 → 填写全部年级 → 导入并看预检 →（可选）导入锁定级部 → 一次生成 → 按班级/教师复核 → 导出。'],
            ['8. 不要使用 Excel 筛选后只复制可见行；请保留全部任课记录。']
        ];
        const demandSheet = XLSX.utils.aoa_to_sheet(demandRows);
        const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
        demandSheet['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 12 }, { wch: 13 }, { wch: 22 }, { wch: 30 }];
        guideSheet['!cols'] = [{ wch: 112 }];
        XLSX.utils.book_append_sheet(wb, demandSheet, '联合任课表');
        XLSX.utils.book_append_sheet(wb, guideSheet, '填写说明');
        XLSX.writeFile(wb, '学年联合排课导入模板.xlsx');
    },

    loadData: async function (input) {
        const file = input && input.files ? input.files[0] : null;
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array' });
            const sheetName = wb.SheetNames.find((name) => /联合任课|任课/.test(name)) || wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            const parsed = this.parseJointDemandRows(rows);
            if (!parsed.demands.length) {
                this.importWarnings = parsed.warnings;
                this.renderProjectPreview('未识别到有效任课数据，请检查“年级、班级、教师姓名、学科、每班周课时”列。', true);
                if (window.UI) UI.toast('未识别到有效任课数据', 'warning');
                return;
            }

            // 一份新的任课表代表一个新的排课项目。锁定底图必须重新从该项目导入，
            // 防止上一次项目的班级或教师占用被悄悄带入本次排课。
            const allowedGrade = window.TeachingWorkbenchCohort?.currentGrade?.();
            const scopedDemands = allowedGrade
                ? parsed.demands.filter((demand) => !demand.grade || String(demand.grade) === String(allowedGrade))
                : parsed.demands;
            this.demands = scopedDemands;
            this.importWarnings = [...parsed.warnings, ...(allowedGrade && scopedDemands.length !== parsed.demands.length
                ? [`已按当前届别${allowedGrade}年级过滤 ${parsed.demands.length - scopedDemands.length} 条其他年级任课数据。`]
                : [])];
            this.lockedSchedule = Object.create(null);
            this.schedule = {};
            this.invalidateTableRenderCache();
            this.rebuildProjectFromDemands();

            this.manualSelection = null;
            this.manualHistory = [];
            this.preflight({ silent: true });
            this.renderProjectStatus();

            if (window.UI) UI.toast(`✅ 已导入当前届别${allowedGrade ? `${allowedGrade}年级` : ''}的 ${this.demands.length} 条逐班课程需求。`, 'success');
        } catch (e) {
            console.error(e);
            window.UI.alert('导入失败: ' + (e.message || e));
        } finally {
            if (input) input.value = '';
        }
    },

    readImportValue: function (row, keys) {
        for (const key of keys) {
            if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                return String(row[key]).trim();
            }
        }
        return '';
    },

    parseJointDemandRows: function (rows) {
        const merged = new Map();
        const warnings = [];
        (Array.isArray(rows) ? rows : []).forEach((row, index) => {
            const name = this.readImportValue(row, ['教师姓名', '教师', '老师', '姓名', 'teacher', 'Teacher']);
            const subject = this.readImportValue(row, ['学科', '科目', 'subject', 'Subject']);
            const grade = this.normalizeGrade(this.readImportValue(row, ['年级', 'grade', 'Grade']));
            const classValue = this.readImportValue(row, ['班级', '任教班级', '班级列表', 'classes', 'Classes']);
            const hoursValue = this.readImportValue(row, ['每班周课时', '每班周课时量', '周课时量', '周课时', '课时', 'hours', 'Hours']);
            const venue = this.readImportValue(row, ['场地/资源（可选）', '场地/资源', '场地', '资源', '教室', 'venue', 'Venue']);
            const note = this.readImportValue(row, ['备注（可选）', '备注', '说明', 'note', 'Note']);
            if (!name && !subject && !classValue && !hoursValue) return;
            if (!name || !subject || !classValue || !hoursValue) {
                warnings.push(`第 ${index + 2} 行缺少教师、学科、班级或每班周课时，已跳过。`);
                return;
            }

            if (grade && /[,，、\s]/.test(classValue)) {
                warnings.push(`第 ${index + 2} 行在“班级”列填写了多个班级；联合模板要求一班一行，已跳过。`);
                return;
            }

            const legacyClasses = grade ? [classValue] : classValue.split(/[，,、\s]+/).filter(Boolean);
            const totalHours = Number(hoursValue);
            if (!Number.isFinite(totalHours) || totalHours <= 0) {
                warnings.push(`第 ${index + 2} 行“每班周课时”不是有效正数，已跳过。`);
                return;
            }
            if (!grade && legacyClasses.length > 1 && totalHours % legacyClasses.length !== 0) {
                warnings.push(`第 ${index + 2} 行是旧版合并班级写法，周课时不能平均分配；请改用“一班一行”模板。`);
                return;
            }
            const perClassHours = grade ? totalHours : totalHours / legacyClasses.length;
            legacyClasses.forEach((rawClass) => {
                const classGrade = grade || this.inferGradeFromClass(rawClass);
                const className = this.normalizeClassName(classGrade, rawClass);
                if (!classGrade || !className) {
                    warnings.push(`第 ${index + 2} 行无法识别年级/班级“${rawClass}”，请填写“年级”和“班级”两列。`);
                    return;
                }
                const key = [this.normalizeTeacherName(name), subject, className].join('__');
                const current = merged.get(key) || {
                    grade: classGrade,
                    className,
                    name: this.normalizeTeacherName(name),
                    subject,
                    weeklyHours: 0,
                    venue: String(venue || '').trim(),
                    note: String(note || '').trim()
                };
                current.weeklyHours += Number(perClassHours);
                if (!current.venue && venue) current.venue = String(venue).trim();
                merged.set(key, current);
            });
        });
        return { demands: [...merged.values()], warnings };
    },

    rebuildProjectFromDemands: function (extraClasses = []) {
        const lockedClasses = Object.keys(this.lockedSchedule || {});
        const normalizedExtraClasses = (Array.isArray(extraClasses) ? extraClasses : [])
            .filter((item) => item && item.className)
            .map((item) => ({
                className: String(item.className),
                grade: String(item.grade || this.inferGradeFromClass(item.className) || '')
            }));
        this.classMeta = Object.create(null);
        this.demands.forEach((demand) => {
            this.classMeta[demand.className] = { grade: String(demand.grade || ''), className: demand.className };
        });
        lockedClasses.forEach((className) => {
            if (!this.classMeta[className]) this.classMeta[className] = { grade: this.inferGradeFromClass(className), className };
        });
        normalizedExtraClasses.forEach(({ className, grade }) => {
            if (!this.classMeta[className]) this.classMeta[className] = { grade, className };
        });
        this.classes = [...new Set([...this.demands.map((demand) => demand.className), ...lockedClasses, ...normalizedExtraClasses.map((item) => item.className)])]
            .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));

        const overview = new Map();
        this.demands.forEach((demand) => {
            const key = `${demand.name}__${demand.subject}`;
            if (!overview.has(key)) overview.set(key, {
                name: demand.name,
                subject: demand.subject,
                classes: [],
                hours: 0,
                grades: new Set(),
                venues: new Set()
            });
            const item = overview.get(key);
            item.classes.push(demand.className);
            item.hours += Number(demand.weeklyHours) || 0;
            if (demand.grade) item.grades.add(String(demand.grade));
            if (demand.venue) item.venues.add(String(demand.venue));
        });
        this.data = [...overview.values()].map((item) => ({
            ...item,
            classes: [...new Set(item.classes)].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true })),
            grades: [...item.grades].sort((a, b) => Number(a) - Number(b)),
            venues: [...item.venues]
        }));
        this.refreshGradeScopeControls();
        this.renderProjectPreview();
        const targetSel = document.getElementById('sch_view_target');
        if (targetSel && this.classes.length) {
            targetSel.innerHTML = this.classes.map((className) => `<option value="${this.escapeHtml(className)}">${this.escapeHtml(className)}班</option>`).join('');
        }
    },

    renderProjectPreview: function (message = '', isError = false) {
        const preview = document.getElementById('sch_resource_preview');
        if (!preview) return;
        if (message) {
            preview.innerHTML = `<span style="color:${isError ? '#dc2626' : '#334155'};">${this.escapeHtml(message)}</span>`;
            return;
        }
        const grades = this.getProjectGrades();
        const crossGradeTeachers = this.getCrossGradeTeachers();
        const venues = [...new Set(this.demands.map((demand) => String(demand.venue || '').trim()).filter(Boolean))];
        const top = this.demands.slice(0, 8).map((demand) => (
            `<div style="padding:4px 0; border-bottom:1px dashed #e2e8f0;">` +
            `<strong>${this.escapeHtml(demand.className)}班</strong> · ${this.escapeHtml(demand.subject)} · ${this.escapeHtml(demand.name)} · ${this.escapeHtml(demand.weeklyHours)}节` +
            `${demand.venue ? ` · ${this.escapeHtml(demand.venue)}` : ''}</div>`
        )).join('');
        const extra = this.demands.length > 8 ? `<div style="padding-top:6px; color:#94a3b8;">...另有 ${this.demands.length - 8} 条逐班课程需求</div>` : '';
        const cross = crossGradeTeachers.length
            ? `<div style="padding-top:7px; color:#7c3aed;">跨级教师：${crossGradeTeachers.map((item) => `${this.escapeHtml(item.name)}（${item.grades.join('、')}年级）`).join('；')}</div>`
            : '<div style="padding-top:7px; color:#64748b;">当前没有跨级教师；如有跨级任教，请将相关年级一并导入。</div>';
        preview.innerHTML = `<div style="color:#334155;"><strong>学年联合项目</strong>：${grades.join('、') || '-'}年级 · ${this.classes.length} 个班级 · ${this.demands.length} 条逐班课程 · ${venues.length} 个共享场地 · 已锁定 ${this.countScheduleCells(this.lockedSchedule)} 节。</div>${cross}${top}${extra}`;
    },

    renderProjectStatus: function (unfilled = []) {
        const status = document.getElementById('sch_project_status');
        if (!status) return;
        if (!this.demands.length) {
            status.className = 'scheduler-project-status';
            status.textContent = '导入任课表后，这里会显示单级部或联合项目的资源、锁定课与冲突状态。';
            return;
        }
        const conflicts = this.getScheduleResourceConflicts();
        const grades = this.getProjectGrades();
        const crossGradeTeachers = this.getCrossGradeTeachers();
        const base = `${grades.join('、')}年级联合排课 · ${this.classes.length} 个班级 · ${crossGradeTeachers.length} 位跨级教师 · 锁定 ${this.countScheduleCells(this.lockedSchedule)} 节`;
        const remainingCount = unfilled.length || this.demands.filter((demand) => (
            this.countDemandLessons(demand) < Number(demand.weeklyHours)
        )).length;
        if (!this.countScheduleCells(this.schedule)) {
            status.className = 'scheduler-project-status';
            status.textContent = `${base}。任课表已就绪；请完成规则预检后开始${grades.length > 1 ? '联合' : '本级部'}排课。`;
        } else if (conflicts.length) {
            status.className = 'scheduler-project-status is-error';
            status.textContent = `${base}。检测到 ${conflicts.length} 项资源冲突，请不要导出为正式课表。`;
        } else if (remainingCount) {
            status.className = 'scheduler-project-status is-warning';
            status.textContent = `${base}。仍有 ${remainingCount} 条逐班课程未排完，请放宽禁排/场地约束后重试。`;
        } else {
            status.className = 'scheduler-project-status is-ok';
            status.textContent = `${base}。教师与场地均无同一时段冲突，可按班级或教师复核后导出。`;
        }
    },

    // --- 学年联合排课核心：所有年级共用教师、场地和锁定底图 ---
    getAllSlots: function (config = this.getSlotConfig()) {
        const slots = [];
        for (let day = 1; day <= 5; day++) {
            ['am', 'pm', 'eve'].forEach((type) => {
                for (let period = 1; period <= Number(config[type] || 0); period++) {
                    slots.push({ id: `d${day}_${type}_${period}`, day, type, period });
                }
            });
        }
        return slots;
    },

    isGloballyClosedSlot: function (slot) {
        if (!slot) return false;
        if (slot.day === 5 && slot.type === 'eve' && document.getElementById('sch_rule_fri_eve')?.checked) return true;
        const fridayPmMax = Number(document.getElementById('sch_fri_pm_val')?.value || 0);
        return slot.day === 5 && slot.type === 'pm'
            && document.getElementById('sch_rule_fri_pm')?.checked && slot.period > fridayPmMax;
    },

    countScheduleCells: function (schedule = {}) {
        return Object.values(schedule || {}).reduce((total, classSchedule) => (
            total + Object.entries(classSchedule || {}).filter(([slotId, cell]) => !slotId.startsWith('_') && !!cell).length
        ), 0);
    },

    cloneLockedSchedule: function () {
        const clone = {};
        this.classes.forEach((className) => { clone[className] = {}; });
        Object.entries(this.lockedSchedule || {}).forEach(([className, entries]) => {
            if (!clone[className]) clone[className] = {};
            Object.entries(entries || {}).forEach(([slotId, cell]) => {
                if (slotId.startsWith('_') || !cell) return;
                clone[className][slotId] = { ...cell, fixed: true, locked: true };
            });
        });
        return clone;
    },

    addBlacklist: function (className, slotId, subject) {
        const classSchedule = this.schedule[className] || (this.schedule[className] = {});
        classSchedule._blackList = classSchedule._blackList || {};
        classSchedule._blackList[slotId] = classSchedule._blackList[slotId] || [];
        if (!classSchedule._blackList[slotId].includes(subject)) classSchedule._blackList[slotId].push(subject);
    },

    applyBaseConstraints: function (config) {
        this.rules.activities.forEach((rule) => {
            const targetClasses = this.getScopeClasses(rule.scope);
            this.getActivitySlots(rule, config).forEach((slotId) => {
                targetClasses.forEach((className) => {
                    this.addBlacklist(className, slotId, rule.subject);
                    if (rule.subject === 'ALL' && !this.schedule[className][slotId]) {
                        this.schedule[className][slotId] = { subject: '🚫 无课', teacher: '-', fixed: true };
                    }
                });
            });
        });
        this.rules.meetings.forEach((rule) => {
            const slotId = `d${rule.day}_${this.normalizeSlotCode(rule.slot)}`;
            this.getScopeClasses(rule.scope).forEach((className) => {
                if (!this.schedule[className][slotId]) {
                    this.schedule[className][slotId] = { subject: '班会', teacher: '班主任', fixed: true };
                }
            });
        });
        this.rebuildTeacherSlotIndex();
        this.rebuildVenueSlotIndex();
    },

    getTeacherBusyMap: function (config) {
        const map = Object.create(null);
        this.rules.busy.forEach((rule) => {
            this.parseBusySlots(rule.day, rule.slotsStr, config.am, config.pm, config.eve)
                .forEach((slotId) => { map[`${this.normalizeTeacherName(rule.name)}_${slotId}`] = true; });
        });
        return map;
    },

    isDemandBlocked: function (demand, slotId) {
        const blocked = this.schedule[demand.className]?._blackList?.[slotId] || [];
        return blocked.includes('ALL') || blocked.includes(demand.subject);
    },

    canPlaceDemand: function (demand, slot, teacherBusyMap) {
        if (!demand || !slot || this.isGloballyClosedSlot(slot)) return false;
        const classSchedule = this.schedule[demand.className] || {};
        if (classSchedule[slot.id] || this.isDemandBlocked(demand, slot.id)) return false;
        if (teacherBusyMap[`${this.normalizeTeacherName(demand.name)}_${slot.id}`]) return false;
        if (this.isTeacherBusyInOtherClass(demand.name, slot.id)) return false;
        if (demand.venue && this.isVenueBusyInOtherClass(demand.venue, slot.id)) return false;
        return true;
    },

    countDemandLessons: function (demand, schedule = this.schedule) {
        return Object.entries(schedule?.[demand.className] || {}).filter(([slotId, cell]) => {
            return !slotId.startsWith('_') && cell
                && this.normalizeTeacherName(cell.teacher) === this.normalizeTeacherName(demand.name)
                && String(cell.subject || '').replace(/\(合\)$/, '') === String(demand.subject || '');
        }).length;
    },

    placeDemand: function (demand, slotId, options = {}) {
        const cell = {
            subject: demand.subject,
            teacher: options.combined ? `${demand.name}(合)` : demand.name,
            venue: demand.venue || '',
            isCombined: !!options.combined,
            fixed: !!options.combined,
            combinedGroup: options.groupId || ''
        };
        this.schedule[demand.className][slotId] = cell;
        const dayMatch = String(slotId || '').match(/^d(\d+)_/);
        const day = dayMatch ? dayMatch[1] : '';
        if (day) {
            if (this.classSubjectDayIndex) {
                const subjectKey = `${demand.className}__${demand.subject}__${day}`;
                this.classSubjectDayIndex[subjectKey] = (this.classSubjectDayIndex[subjectKey] || 0) + 1;
            }
            if (this.teacherDayLoadIndex) {
                const teacherKey = `${this.normalizeTeacherName(demand.name)}__${day}`;
                this.teacherDayLoadIndex[teacherKey] = (this.teacherDayLoadIndex[teacherKey] || 0) + 1;
            }
        }
        return cell;
    },

    rebuildDayLoadIndexes: function () {
        this.classSubjectDayIndex = Object.create(null);
        this.teacherDayLoadIndex = Object.create(null);
        this.classes.forEach((className) => {
            Object.entries(this.schedule[className] || {}).forEach(([slotId, cell]) => {
                if (slotId.startsWith('_') || !cell) return;
                const dayMatch = slotId.match(/^d(\d+)_/);
                if (!dayMatch) return;
                const day = dayMatch[1];
                const subject = String(cell.subject || '').replace(/\(合\)$/, '');
                if (subject) {
                    const subjectKey = `${className}__${subject}__${day}`;
                    this.classSubjectDayIndex[subjectKey] = (this.classSubjectDayIndex[subjectKey] || 0) + 1;
                }
                const teacher = this.normalizeTeacherName(cell.teacher);
                if (teacher && teacher !== '-') {
                    const teacherKey = `${teacher}__${day}`;
                    this.teacherDayLoadIndex[teacherKey] = (this.teacherDayLoadIndex[teacherKey] || 0) + 1;
                }
            });
        });
    },

    getCombinedGroups: function (rule, pending) {
        const groups = new Map();
        pending.filter((demand) => demand.subject === rule.subject && demand.remaining > 0).forEach((demand) => {
            const key = rule.scope === 'all'
                ? `${this.normalizeTeacherName(demand.name)}__${demand.subject}`
                : `${this.normalizeTeacherName(demand.name)}__${demand.subject}__${demand.grade}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(demand);
        });
        return [...groups.entries()].filter(([, demands]) => demands.length > 1);
    },

    applyCombinedRules: function (pending, allSlots, teacherBusyMap) {
        this.rules.combined.forEach((rule) => {
            this.getCombinedGroups(rule, pending).forEach(([groupId, demands]) => {
                const suffix = this.normalizeSlotCode(rule.slot);
                const candidate = allSlots.find((slot) => {
                    if (slot.id.replace(/^d\d+_/, '') !== suffix || this.isGloballyClosedSlot(slot)) return false;
                    if (teacherBusyMap[`${this.normalizeTeacherName(demands[0].name)}_${slot.id}`]) return false;
                    if (this.isTeacherBusyInOtherClass(demands[0].name, slot.id)) return false;
                    return demands.every((demand) => {
                        const classSchedule = this.schedule[demand.className] || {};
                        return !classSchedule[slot.id] && !this.isDemandBlocked(demand, slot.id)
                            && (!demand.venue || !this.isVenueBusyInOtherClass(demand.venue, slot.id));
                    });
                });
                if (!candidate) return;
                demands.forEach((demand) => {
                    this.placeDemand(demand, candidate.id, { combined: true, groupId });
                    demand.remaining -= 1;
                });
                this.markTeacherBusy(demands[0].name, candidate.id);
                demands.map((demand) => demand.venue).filter(Boolean)
                    .forEach((venue) => this.markVenueBusy(venue, candidate.id));
            });
        });
    },

    getClassSubjectDayCount: function (className, subject, day) {
        if (this.classSubjectDayIndex) return this.classSubjectDayIndex[`${className}__${subject}__${day}`] || 0;
        return Object.entries(this.schedule[className] || {}).filter(([slotId, cell]) => (
            slotId.startsWith(`d${day}_`) && cell && cell.subject === subject
        )).length;
    },

    findBestSlotForDemand: function (demand, allSlots, teacherBusyMap) {
        const candidates = allSlots.filter((slot) => this.canPlaceDemand(demand, slot, teacherBusyMap));
        candidates.sort((left, right) => {
            const subjectSpread = this.getClassSubjectDayCount(demand.className, demand.subject, left.day)
                - this.getClassSubjectDayCount(demand.className, demand.subject, right.day);
            if (subjectSpread) return subjectSpread;
            const teacherLoad = this.getTeacherDayLoad(demand.name, left.day) - this.getTeacherDayLoad(demand.name, right.day);
            if (teacherLoad) return teacherLoad;
            return left.id.localeCompare(right.id);
        });
        return candidates[0] || null;
    },

    getTeacherDayLoad: function (teacherName, day) {
        const teacher = this.normalizeTeacherName(teacherName);
        if (this.teacherDayLoadIndex) return this.teacherDayLoadIndex[`${teacher}__${day}`] || 0;
        return this.classes.reduce((count, className) => count + Object.entries(this.schedule[className] || {}).filter(([slotId, cell]) => (
            slotId.startsWith(`d${day}_`) && this.normalizeTeacherName(cell?.teacher) === teacher
        )).length, 0);
    },

    run: function () {
        if (!this.demands.length) return window.UI.alert("请先导入教师任课数据");
        const preflight = this.preflight({ silent: true });
        if (!preflight.ok) return window.UI.alert(`请先处理排课预检中的 ${preflight.errors.length} 项问题。`);

        const btn = document.getElementById('sch_run_btn');
        if (!btn) return window.UI.alert('排课启动按钮未找到，请刷新页面后重试。');
        btn.innerHTML = '<i class="ti ti-loader"></i> 正在进行学年联合排课...';
        btn.disabled = true;

        setTimeout(() => {
            try {
                const config = this.getSlotConfig();
                const allSlots = this.getAllSlots(config);
                this.schedule = this.cloneLockedSchedule();
                this.invalidateTableRenderCache();
                this.resetTeacherSlotIndex();
                this.resetVenueSlotIndex();
                this.applyBaseConstraints(config);
                this.rebuildDayLoadIndexes();
                const teacherBusyMap = this.getTeacherBusyMap(config);
                const pending = this.demands.map((demand) => ({
                    ...demand,
                    remaining: Math.max(0, Number(demand.weeklyHours) - this.countDemandLessons(demand))
                }));

                this.applyCombinedRules(pending, allSlots, teacherBusyMap);
                const crossGradeNames = new Set(this.getCrossGradeTeachers().map((item) => item.name));
                pending.sort((left, right) => {
                    const crossDiff = Number(crossGradeNames.has(this.normalizeTeacherName(right.name))) - Number(crossGradeNames.has(this.normalizeTeacherName(left.name)));
                    return crossDiff || right.remaining - left.remaining || left.className.localeCompare(right.className, 'zh-CN', { numeric: true });
                });
                pending.forEach((demand) => {
                    while (demand.remaining > 0) {
                        const slot = this.findBestSlotForDemand(demand, allSlots, teacherBusyMap);
                        if (!slot) break;
                        this.placeDemand(demand, slot.id);
                        this.markTeacherBusy(demand.name, slot.id);
                        if (demand.venue) this.markVenueBusy(demand.venue, slot.id);
                        demand.remaining -= 1;
                    }
                });

                const unfilled = pending.filter((demand) => demand.remaining > 0);
                this.lastRun = { unfilled, generatedAt: Date.now() };
                this.renderTable();
                this.manualSelection = null;
                this.manualHistory = [];
                this.updateManualControls();
                document.getElementById('sch_result_area')?.classList.remove('hidden');
                this.renderProjectStatus(unfilled);
                if (unfilled.length) {
                    UI.toast(`⚠️ ${unfilled.length} 条逐班课程仍有未排课时，请查看联合项目状态。`, 'warning');
                } else {
                    UI.toast('✅ 学年联合课表已生成：跨级教师与共享场地均已统一避让。', 'success');
                }
            } catch (error) {
                console.error(error);
                window.UI.alert(`排课运算出错: ${error.message || error}`);
            } finally {
                btn.innerHTML = '🚀 开始学年联合排课';
                btn.disabled = false;
            }
        }, 120);
    },

    // --- 疲劳审计 ---
    auditFatigue: function () {
        if (!this.schedule || !this.classes || !this.classes.length) return window.UI.alert("请先完成排课");
        const area = document.getElementById('sch_audit_area');
        const summaryEl = document.getElementById('sch_audit_summary');
        const listEl = document.getElementById('sch_audit_list');
        if (!area || !summaryEl || !listEl) return;

        area.classList.remove('hidden');
        listEl.innerHTML = '';
        summaryEl.innerText = '正在分析排课疲劳风险...';

        const analysis = this.buildFatigueAnalysis();
        const items = this.buildFallbackAuditList(analysis);
        this.renderAuditList(items);
        summaryEl.innerText = `已完成规则审计（${analysis.meta.classCount} 个班级 / ${analysis.meta.teacherCount} 位教师）`;
    },

    buildFatigueAnalysis: function () {
        const am = parseInt(document.getElementById('sch_am_count').value);
        const pm = parseInt(document.getElementById('sch_pm_count').value);
        const eve = parseInt(document.getElementById('sch_eve_count').value);

        // 疲劳审计只依赖当前课表和节次数配置。重复点击“审计”时复用结果，
        // 避免对所有班级×5天×节次再次扫描；排课生成后 lastRun 时间戳会自然失效。
        const cacheKey = [
            this.lastRun?.generatedAt || 0,
            this.classes.length,
            am || 0,
            pm || 0,
            eve || 0,
            this.countScheduleCells(this.schedule)
        ].join('|');
        if (this._fatigueAnalysisCacheKey === cacheKey && this._fatigueAnalysisCache) {
            return this._fatigueAnalysisCache;
        }

        const slotOrder = [];
        for (let i = 1; i <= am; i++) slotOrder.push({ type: 'am', code: `am_${i}` });
        for (let i = 1; i <= pm; i++) slotOrder.push({ type: 'pm', code: `pm_${i}` });
        for (let i = 1; i <= eve; i++) slotOrder.push({ type: 'eve', code: `eve_${i}` });

        const classStats = [];
        const teacherMap = {};

        this.classes.forEach(cls => {
            for (let day = 1; day <= 5; day++) {
                let run = 0;
                let maxRun = 0;
                let total = 0;
                let eveCount = 0;

                slotOrder.forEach(slot => {
                    const slotId = `d${day}_${slot.code}`;
                    const cell = this.schedule[cls]?.[slotId];
                    const hasLesson = cell && cell.subject && cell.subject !== '🚫 无课';

                    if (hasLesson) {
                        total++;
                        run++;
                        if (slot.type === 'eve') eveCount++;
                    } else {
                        run = 0;
                    }

                    if (run > maxRun) maxRun = run;

                    if (cell && cell.teacher && cell.teacher !== '-') {
                        const tName = String(cell.teacher).replace(/\([^)]*\)/g, '').trim();
                        if (tName) {
                            if (!teacherMap[tName]) teacherMap[tName] = {};
                            if (!teacherMap[tName][day]) teacherMap[tName][day] = new Set();
                            teacherMap[tName][day].add(slot.code);
                        }
                    }
                });

                classStats.push({
                    class: cls,
                    day,
                    maxConsecutive: maxRun,
                    totalLessons: total,
                    eveningLessons: eveCount
                });
            }
        });

        const teacherStats = [];
        Object.keys(teacherMap).forEach(teacher => {
            for (let day = 1; day <= 5; day++) {
                const set = teacherMap[teacher][day];
                if (!set || set.size === 0) continue;
                let run = 0;
                let maxRun = 0;
                let total = 0;
                let eveCount = 0;

                slotOrder.forEach(slot => {
                    if (set.has(slot.code)) {
                        total++;
                        run++;
                        if (slot.type === 'eve') eveCount++;
                    } else {
                        run = 0;
                    }
                    if (run > maxRun) maxRun = run;
                });

                teacherStats.push({
                    teacher,
                    day,
                    maxConsecutive: maxRun,
                    totalLessons: total,
                    eveningLessons: eveCount
                });
            }
        });

        const flags = {
            classConsecutiveOver4: classStats.filter(x => x.maxConsecutive >= 4).slice(0, 10),
            teacherConsecutiveOver3: teacherStats.filter(x => x.maxConsecutive >= 3).slice(0, 10),
            classEveningOver2: classStats.filter(x => x.eveningLessons >= 2).slice(0, 10),
            teacherEveningOver2: teacherStats.filter(x => x.eveningLessons >= 2).slice(0, 10)
        };

        const result = {
            meta: {
                am, pm, eve,
                classCount: this.classes.length,
                teacherCount: Object.keys(teacherMap).length
            },
            classStats,
            teacherStats,
            flags
        };
        this._fatigueAnalysisCacheKey = cacheKey;
        this._fatigueAnalysisCache = result;
        return result;
    },

    buildFallbackAuditList: function (analysis) {
        const dayName = d => `周${['一', '二', '三', '四', '五'][d - 1] || d}`;
        const list = [];
        analysis.flags.classConsecutiveOver4.forEach(x => {
            list.push(`班级${x.class} ${dayName(x.day)} 连续${x.maxConsecutive}节，建议打散主课并插入轻负担课。`);
        });
        analysis.flags.teacherConsecutiveOver3.forEach(x => {
            list.push(`教师${x.teacher} ${dayName(x.day)} 连续${x.maxConsecutive}节，建议调整为错峰或增加空档。`);
        });
        analysis.flags.classEveningOver2.forEach(x => {
            list.push(`班级${x.class} ${dayName(x.day)} 晚自习${x.eveningLessons}节，建议减少晚自习强度。`);
        });
        analysis.flags.teacherEveningOver2.forEach(x => {
            list.push(`教师${x.teacher} ${dayName(x.day)} 晚自习${x.eveningLessons}节，建议避免连续晚自习排班。`);
        });
        if (!list.length) list.push('未发现明显疲劳风险，可维持当前排课结构。');
        return list.slice(0, 10);
    },

    renderAuditList: function (items) {
        const listEl = document.getElementById('sch_audit_list');
        if (!listEl) return;
        listEl.innerHTML = '';
        items.forEach(text => {
            const tag = document.createElement('div');
            tag.className = 'tag-chip';
            tag.style.background = '#e0f2fe';
            tag.style.color = '#0c4a6e';
            tag.innerText = text;
            listEl.appendChild(tag);
        });
    },

    // --- 辅助函数 ---

    resolveTimeRange: function (day, rangeType, am, pm, eve) {
        const slots = [];
        const prefix = `d${day}`;
        if (rangeType === 'am_all') {
            for (let i = 1; i <= am; i++) slots.push(`${prefix}_am_${i}`);
        } else if (rangeType === 'pm_all') {
            for (let i = 1; i <= pm; i++) slots.push(`${prefix}_pm_${i}`);
        } else if (rangeType === 'eve_all') {
            for (let i = 1; i <= eve; i++) slots.push(`${prefix}_eve_${i}`);
        }
        return slots;
    },

    parseBusySlots: function (day, str, amLimit, pmLimit, eveLimit) {
        const res = [];
        const parts = str.split(/[,，、\s]+/);
        parts.forEach(p => {
            p = p.trim();
            if (!p) return;
            if (p === '上午' || /^am(?:_all)?$/i.test(p)) {
                for (let i = 1; i <= amLimit; i++) res.push(`d${day}_am_${i}`);
            } else if (p === '下午' || /^pm(?:_all)?$/i.test(p)) {
                for (let i = 1; i <= pmLimit; i++) res.push(`d${day}_pm_${i}`);
            } else if (p === '晚' || p === '晚自习' || /^eve(?:_all)?$/i.test(p)) {
                for (let i = 1; i <= eveLimit; i++) res.push(`d${day}_eve_${i}`);
            } else if (/^\d+$/.test(p)) {
                let n = parseInt(p, 10);
                if (n <= amLimit) res.push(`d${day}_am_${n}`);
                else if (n <= amLimit + pmLimit) res.push(`d${day}_pm_${n - amLimit}`);
                else if (n <= amLimit + pmLimit + eveLimit) res.push(`d${day}_eve_${n - amLimit - pmLimit}`);
            } else {
                res.push(`d${day}_${p}`);
            }
        });
        return res;
    },

    normalizeTeacherName: function (teacherName) {
        return String(teacherName || '').replace(/\([^)]*\)/g, '').trim();
    },

    resetTeacherSlotIndex: function () {
        this.teacherSlotIndex = Object.create(null);
    },

    resetVenueSlotIndex: function () {
        this.venueSlotIndex = Object.create(null);
    },

    invalidateTableRenderCache: function () {
        this.scheduleRenderVersion += 1;
        this.tableRenderCache = { signature: '', html: '' };
    },

    markTeacherBusy: function (teacherName, slotId) {
        const normalizedTeacher = this.normalizeTeacherName(teacherName);
        if (!normalizedTeacher || !slotId) return;
        if (!this.teacherSlotIndex) this.resetTeacherSlotIndex();
        this.teacherSlotIndex[`${normalizedTeacher}_${slotId}`] = true;
    },

    markVenueBusy: function (venueName, slotId) {
        const venue = String(venueName || '').trim();
        if (!venue || !slotId) return;
        if (!this.venueSlotIndex) this.resetVenueSlotIndex();
        this.venueSlotIndex[`${venue}_${slotId}`] = true;
    },

    isTeacherBusyInOtherClass: function (teacherName, slotId) {
        const normalizedTeacher = this.normalizeTeacherName(teacherName);
        if (!normalizedTeacher) return false;
        if (this.teacherSlotIndex && this.teacherSlotIndex[`${normalizedTeacher}_${slotId}`]) return true;
        for (let cls of this.classes) {
            const cell = this.schedule[cls][slotId];
            const cellTeacher = this.normalizeTeacherName(cell?.teacher);
            if (cellTeacher === normalizedTeacher) return true;
        }
        return false;
    },

    isVenueBusyInOtherClass: function (venueName, slotId) {
        const venue = String(venueName || '').trim();
        if (!venue) return false;
        if (this.venueSlotIndex && this.venueSlotIndex[`${venue}_${slotId}`]) return true;
        return this.classes.some((className) => {
            const cell = this.schedule[className]?.[slotId];
            return String(cell?.venue || '').trim() === venue;
        });
    },

    rebuildTeacherSlotIndex: function () {
        this.resetTeacherSlotIndex();
        this.classes.forEach(cls => {
            const entries = this.schedule[cls] || {};
            Object.keys(entries).forEach(slotId => {
                if (slotId === '_blackList') return;
                const cell = entries[slotId];
                if (cell?.teacher && cell.teacher !== '-') this.markTeacherBusy(cell.teacher, slotId);
            });
        });
    },

    rebuildVenueSlotIndex: function () {
        this.resetVenueSlotIndex();
        this.classes.forEach((className) => {
            Object.entries(this.schedule[className] || {}).forEach(([slotId, cell]) => {
                if (!slotId.startsWith('_') && cell?.venue) this.markVenueBusy(cell.venue, slotId);
            });
        });
    },

    getScheduleResourceConflicts: function (schedule = this.schedule) {
        const teacherMap = new Map();
        const venueMap = new Map();
        Object.entries(schedule || {}).forEach(([className, entries]) => {
            Object.entries(entries || {}).forEach(([slotId, cell]) => {
                if (slotId.startsWith('_') || !cell || !cell.teacher || cell.teacher === '-' || cell.teacher === '班主任') return;
                const teacher = this.normalizeTeacherName(cell.teacher);
                const teacherKey = `${teacher}__${slotId}`;
                if (!teacherMap.has(teacherKey)) teacherMap.set(teacherKey, []);
                teacherMap.get(teacherKey).push({ className, cell });
                const venue = String(cell.venue || '').trim();
                if (venue) {
                    const venueKey = `${venue}__${slotId}`;
                    if (!venueMap.has(venueKey)) venueMap.set(venueKey, []);
                    venueMap.get(venueKey).push({ className, cell });
                }
            });
        });
        const normalize = (type, map) => [...map.entries()].flatMap(([key, entries]) => {
            if (entries.length < 2) return [];
            const allSameCombinedGroup = entries.every((entry) => entry.cell.isCombined)
                && new Set(entries.map((entry) => entry.cell.combinedGroup || '')).size === 1;
            if (allSameCombinedGroup) return [];
            const separator = key.lastIndexOf('__');
            const name = separator >= 0 ? key.slice(0, separator) : key;
            const slotId = separator >= 0 ? key.slice(separator + 2) : '';
            return [{ type, name, slotId, classes: entries.map((entry) => entry.className) }];
        });
        return [...normalize('teacher', teacherMap), ...normalize('venue', venueMap)];
    },

    canPlaceManualCell: function (className, slotId, cell, ignoredSlots) {
        if (!cell) return { ok: true };
        const blocked = this.schedule[className]?._blackList?.[slotId] || [];
        if (blocked.includes('ALL') || blocked.includes(cell.subject)) {
            return { ok: false, message: `${this.getSlotName(slotId.replace(/^d\d+_/, ''))} 已被该学科规则锁定。` };
        }
        const teacher = this.normalizeTeacherName(cell.teacher);
        if (!teacher || teacher === '-') return { ok: true };
        const hasConflict = this.classes.some(cls => Object.keys(this.schedule[cls] || {}).some(otherSlot => {
            if (otherSlot === '_blackList') return false;
            if (cls === className && ignoredSlots.includes(otherSlot)) return false;
            if (otherSlot !== slotId) return false;
            return this.normalizeTeacherName(this.schedule[cls]?.[otherSlot]?.teacher) === teacher;
        }));
        if (hasConflict) {
            return { ok: false, message: `“${teacher}”在${this.getSlotName(slotId.replace(/^d\d+_/, ''))}已有其他班级课程。` };
        }
        const venue = String(cell.venue || '').trim();
        const venueConflict = venue && this.classes.some((cls) => Object.keys(this.schedule[cls] || {}).some((otherSlot) => {
            if (otherSlot === '_blackList') return false;
            if (cls === className && ignoredSlots.includes(otherSlot)) return false;
            return otherSlot === slotId && String(this.schedule[cls]?.[otherSlot]?.venue || '').trim() === venue;
        }));
        return venueConflict
            ? { ok: false, message: `场地“${venue}”在${this.getSlotName(slotId.replace(/^d\d+_/, ''))}已被其他班级占用。` }
            : { ok: true };
    },

    selectScheduleCell: function (slotId) {
        const mode = document.getElementById('sch_view_mode')?.value;
        const className = document.getElementById('sch_view_target')?.value;
        if (mode !== 'class' || !className) {
            return window.UI?.toast('请先切换到“按班级查看”，再选择两节课进行微调。', 'info');
        }
        const current = this.manualSelection;
        if (!current || current.className !== className) {
            this.manualSelection = { className, slotId };
            this.renderTable();
            this.updateManualControls();
            return window.UI?.toast(`已选择${this.getSlotName(slotId.replace(/^d\d+_/, ''))}，再选择目标节次即可交换。`, 'info');
        }
        if (current.slotId === slotId) {
            this.manualSelection = null;
            this.renderTable();
            this.updateManualControls();
            return;
        }
        this.swapScheduleCells(className, current.slotId, slotId);
    },

    swapScheduleCells: function (className, firstSlotId, secondSlotId) {
        const first = this.schedule[className]?.[firstSlotId] || null;
        const second = this.schedule[className]?.[secondSlotId] || null;
        if (!first && !second) {
            this.manualSelection = null;
            this.renderTable();
            return window.UI?.toast('两个节次都是空课，无需调整。', 'info');
        }
        if (first?.fixed || second?.fixed) {
            return window.UI?.alert('固定班会、无课或合堂时段不可手动移动；请先调整相应规则后重新生成。');
        }
        const ignoredSlots = [firstSlotId, secondSlotId];
        const firstCheck = this.canPlaceManualCell(className, secondSlotId, first, ignoredSlots);
        const secondCheck = this.canPlaceManualCell(className, firstSlotId, second, ignoredSlots);
        if (!firstCheck.ok || !secondCheck.ok) {
            return window.UI?.alert(`无法调整：${firstCheck.message || secondCheck.message}`);
        }

        this.manualHistory.push({
            className,
            firstSlotId,
            secondSlotId,
            first: first ? { ...first } : null,
            second: second ? { ...second } : null
        });
        if (this.manualHistory.length > 20) this.manualHistory.shift();
        if (second) this.schedule[className][firstSlotId] = second;
        else delete this.schedule[className][firstSlotId];
        if (first) this.schedule[className][secondSlotId] = first;
        else delete this.schedule[className][secondSlotId];
        this.invalidateTableRenderCache();
        this.manualSelection = null;
        this.rebuildTeacherSlotIndex();
        this.rebuildVenueSlotIndex();
        this.renderTable();
        this.updateManualControls();
        if (!document.getElementById('sch_audit_area')?.classList.contains('hidden')) this.auditFatigue();
        window.UI?.toast('已完成局部交换，并通过教师撞课与规则占用校验。', 'success');
    },

    undoManualMove: function () {
        const entry = this.manualHistory.pop();
        if (!entry) return window.UI?.toast('暂无可撤销的排课调整。', 'info');
        const target = this.schedule[entry.className] || (this.schedule[entry.className] = {});
        if (entry.first) target[entry.firstSlotId] = entry.first;
        else delete target[entry.firstSlotId];
        if (entry.second) target[entry.secondSlotId] = entry.second;
        else delete target[entry.secondSlotId];
        this.invalidateTableRenderCache();
        this.manualSelection = null;
        this.rebuildTeacherSlotIndex();
        this.rebuildVenueSlotIndex();
        this.renderTable();
        this.updateManualControls();
        if (!document.getElementById('sch_audit_area')?.classList.contains('hidden')) this.auditFatigue();
        window.UI?.toast('已撤销上一步课表调整。', 'success');
    },

    updateManualControls: function () {
        const undo = document.getElementById('sch_manual_undo');
        const status = document.getElementById('sch_manual_status');
        if (undo) undo.disabled = !this.manualHistory.length;
        if (status) {
            status.textContent = this.manualSelection
                ? `已选择 ${this.getSlotName(this.manualSelection.slotId.replace(/^d\d+_/, ''))}：再点一个同班节次即可交换。`
                : '按班级查看时，依次点击两个节次即可交换；每次都会校验教师撞课和禁排规则。';
        }
    },

    getClassCellHtml: function (className, slotId) {
        const cell = this.schedule[className]?.[slotId] || null;
        const selected = this.manualSelection?.className === className && this.manualSelection?.slotId === slotId;
        const title = cell
            ? `${cell.subject || ''}${cell.teacher ? ` · ${cell.teacher}` : ''}`
            : '空课';
        const content = cell
            ? `<strong>${this.escapeHtml(cell.subject)}</strong><span>${this.escapeHtml(cell.teacher || '')}${cell.venue ? ` · ${this.escapeHtml(cell.venue)}` : ''}</span>`
            : '<span class="scheduler-cell-empty">空课</span>';
        return `<button type="button" class="scheduler-cell${selected ? ' is-selected' : ''}${cell?.fixed ? ' is-fixed' : ''}" data-scheduler-slot="${this.escapeHtml(slotId)}" title="${this.escapeHtml(cell?.fixed ? '固定规则时段，不可移动' : `${title}：点击选择/交换`)}" ${cell?.fixed ? 'disabled' : ''}>${content}</button>`;
    },

    renderTable: function () {
        const mode = document.getElementById('sch_view_mode').value;
        let target = document.getElementById('sch_view_target').value;

        // 切换下拉框内容
        const sel = document.getElementById('sch_view_target');
        if (mode === 'teacher') {
            const teachers = [...new Set(this.data.map(d => d.name))];
            if (!teachers.includes(target)) {
                sel.innerHTML = teachers.map(t => `<option value="${t}">${t}</option>`).join('');
                target = teachers[0];
            }
        } else {
            if (!this.classes.includes(target)) {
                sel.innerHTML = this.classes.map(c => `<option value="${c}">${c}班</option>`).join('');
                target = this.classes[0];
            }
        }
        if (sel && target) sel.value = target;

        const table = document.getElementById('sch_table');
        const am = parseInt(document.getElementById('sch_am_count').value);
        const pm = parseInt(document.getElementById('sch_pm_count').value);
        const eve = parseInt(document.getElementById('sch_eve_count').value);
        const tableSignature = [
            this.scheduleRenderVersion,
            mode,
            target,
            am,
            pm,
            eve,
            document.getElementById('sch_rule_morning_read').checked ? 1 : 0,
            document.getElementById('sch_rule_noon_write').checked ? 1 : 0,
            document.getElementById('sch_rule_fri_pm').checked ? 1 : 0,
            document.getElementById('sch_fri_pm_val').value,
            document.getElementById('sch_rule_fri_eve').checked ? 1 : 0,
            document.getElementById('sch_big_break_pos').value,
            this.manualSelection?.className || '',
            this.manualSelection?.slotId || ''
        ].join('|');
        if (this.tableRenderCache.signature === tableSignature
            && this.tableRenderCache.html
            && table.dataset.schedulerRenderSignature === tableSignature) {
            this.updateManualControls();
            return;
        }
        const days = ['周一', '周二', '周三', '周四', '周五'];

        let html = `<thead><tr><th style="width:80px;background:#f3f4f6;">节次</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;

        // 辅助：获取单元格
        const getCellHtml = (day, slotStr) => {
            const slotId = `d${day}_${slotStr}`;
            let cellData = null;

            if (mode === 'class') {
                return this.getClassCellHtml(target, slotId);
            } else {
                const foundCls = [];
                this.classes.forEach(c => {
                    const s = this.schedule[c]?.[slotId];
                    if (s && this.normalizeTeacherName(s.teacher) === this.normalizeTeacherName(target)) {
                        foundCls.push({ className: c, subject: s.subject, venue: s.venue });
                    }
                });
                if (foundCls.length) {
                    const classNames = foundCls.map((item) => item.className).join('、');
                    const labels = [...new Set(foundCls.map((item) => `${item.subject}${item.venue ? ` · ${item.venue}` : ''}`))].join('；');
                    return `<div style="font-weight:bold; color:#059669;">${this.escapeHtml(classNames)}班</div><div style="font-size:10px;">${this.escapeHtml(labels)}</div>`;
                }
            }
            return `<span style="color:#eee;">-</span>`;
        };

        // 晨读
        if (document.getElementById('sch_rule_morning_read').checked) {
            html += `<tr style="background:#ecfdf5;"><td style="font-weight:bold; color:#047857;">早读</td>${[1, 2, 3, 4, 5].map(d => `<td>${mode === 'class' ? '语文/英语' : '-'}</td>`).join('')}</tr>`;
        }

        // 上午
        for (let i = 1; i <= am; i++) {
            html += `<tr><td style="font-weight:bold;">上午${i}</td>`;
            for (let d = 1; d <= 5; d++) html += `<td>${getCellHtml(d, `am_${i}`)}</td>`;
            html += `</tr>`;
            if (i == document.getElementById('sch_big_break_pos').value) {
                html += `<tr style="background:#fffbeb;"><td colspan="6" style="font-size:11px; color:#b45309; letter-spacing:1px;">🏃 大课间活动</td></tr>`;
            }
        }

        html += `<tr style="background:#f1f5f9;"><td colspan="6" style="font-size:11px; color:#64748b;">🍽️ 午休 / 午练 (13:30)</td></tr>`;

        // 午练
        if (document.getElementById('sch_rule_noon_write').checked) {
            html += `<tr style="background:#f0fdf4;"><td style="font-weight:bold;">午练</td>`;
            for (let d = 1; d <= 5; d++) html += `<td>${mode === 'class' ? '练字' : '-'}</td>`;
            html += `</tr>`;
        }

        // 下午
        for (let i = 1; i <= pm; i++) {
            const isFriLimit = document.getElementById('sch_rule_fri_pm').checked;
            const friLimitVal = parseInt(document.getElementById('sch_fri_pm_val').value);

            html += `<tr><td style="font-weight:bold;">下午${i}</td>`;
            for (let d = 1; d <= 5; d++) {
                if (d === 5 && isFriLimit && i > friLimitVal) {
                    html += `<td style="background:#f1f1f1; color:#ccc;">(放假)</td>`;
                } else {
                    html += `<td>${getCellHtml(d, `pm_${i}`)}</td>`;
                }
            }
            html += `</tr>`;
        }

        html += `<tr style="background:#f1f5f9;"><td colspan="6" style="font-size:11px; color:#64748b;">🌙 晚餐</td></tr>`;

        // 晚自习
        for (let i = 1; i <= eve; i++) {
            const noFriEve = document.getElementById('sch_rule_fri_eve').checked;
            html += `<tr><td style="font-weight:bold;">晚${i}</td>`;
            for (let d = 1; d <= 5; d++) {
                if (d === 5 && noFriEve) html += `<td style="background:#f1f1f1;">-</td>`;
                else html += `<td>${getCellHtml(d, `eve_${i}`)}</td>`;
            }
            html += `</tr>`;
        }

        html += `</tbody>`;
        table.innerHTML = html;
        table.dataset.schedulerRenderSignature = tableSignature;
        this.tableRenderCache = { signature: tableSignature, html };
        this.updateManualControls();
    },

    getExportCellText: function (className, slotId) {
        const cell = this.schedule[className]?.[slotId];
        if (!cell) return '';
        const teacher = cell.teacher && cell.teacher !== '-' ? `\n(${cell.teacher})` : '';
        const venue = cell.venue ? `\n[${cell.venue}]` : '';
        return `${cell.subject}${teacher}${venue}`;
    },

    formatExportPeriod: function (slotId) {
        const match = String(slotId || '').match(/^d([1-5])_(am|pm|eve)_(\d+)$/);
        if (!match) return '';
        const prefix = { am: '上午', pm: '下午', eve: '晚' }[match[2]] || '';
        return `${prefix}${match[3]}`;
    },

    formatExportWeekday: function (slotId) {
        const match = String(slotId || '').match(/^d([1-5])_/);
        return match ? `周${['一', '二', '三', '四', '五'][Number(match[1]) - 1]}` : '';
    },

    exportResult: function () {
        if (Object.keys(this.schedule).length === 0) return window.UI.alert("暂无课表数据");
        const wb = XLSX.utils.book_new();
        const config = this.getSlotConfig();
        const jointRows = [['年级', '班级', '时段', '周一', '周二', '周三', '周四', '周五']];
        const orderedPeriods = ['am', 'pm', 'eve'];
        this.classes.forEach((className) => {
            orderedPeriods.forEach((type) => {
                for (let period = 1; period <= Number(config[type] || 0); period++) {
                    const label = this.formatExportPeriod(`d1_${type}_${period}`);
                    jointRows.push([
                        this.inferGradeFromClass(className),
                        `${className}班`,
                        label,
                        ...[1, 2, 3, 4, 5].map((day) => this.getExportCellText(className, `d${day}_${type}_${period}`))
                    ]);
                }
            });
        });
        const jointSheet = XLSX.utils.aoa_to_sheet(jointRows);
        jointSheet['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 22 }];
        XLSX.utils.book_append_sheet(wb, jointSheet, '联合总课表');

        const teacherRows = [['教师', '年级', '班级', '星期', '时段', '学科', '场地/资源', '状态']];
        this.classes.forEach((className) => {
            Object.entries(this.schedule[className] || {}).forEach(([slotId, cell]) => {
                if (slotId.startsWith('_') || !cell || !cell.teacher || cell.teacher === '-') return;
                teacherRows.push([
                    this.normalizeTeacherName(cell.teacher),
                    this.inferGradeFromClass(className),
                    `${className}班`,
                    this.formatExportWeekday(slotId),
                    this.formatExportPeriod(slotId),
                    cell.subject || '',
                    cell.venue || '',
                    cell.locked ? '锁定底图' : (cell.fixed ? '固定规则' : '可调整')
                ]);
            });
        });
        teacherRows.splice(1, teacherRows.length - 1, ...teacherRows.slice(1).sort((left, right) => (
            String(left[0]).localeCompare(String(right[0]), 'zh-CN')
            || Number(left[1]) - Number(right[1])
            || String(left[2]).localeCompare(String(right[2]), 'zh-CN', { numeric: true })
        )));
        const teacherSheet = XLSX.utils.aoa_to_sheet(teacherRows);
        teacherSheet['!cols'] = [{ wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(wb, teacherSheet, '教师总表');

        const crossRows = [['教师', '覆盖年级', '涉及班级', '学科', '每周总课时', '共享场地/资源']];
        const crossMap = new Map();
        this.demands.forEach((demand) => {
            const key = `${this.normalizeTeacherName(demand.name)}__${demand.subject}`;
            if (!crossMap.has(key)) crossMap.set(key, { name: this.normalizeTeacherName(demand.name), subject: demand.subject, grades: new Set(), classes: new Set(), hours: 0, venues: new Set() });
            const entry = crossMap.get(key);
            entry.grades.add(String(demand.grade || this.inferGradeFromClass(demand.className) || ''));
            entry.classes.add(demand.className);
            entry.hours += Number(demand.weeklyHours) || 0;
            if (demand.venue) entry.venues.add(demand.venue);
        });
        [...crossMap.values()]
            .filter((entry) => entry.grades.size > 1)
            .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
            .forEach((entry) => crossRows.push([
                entry.name,
                [...entry.grades].filter(Boolean).sort((a, b) => Number(a) - Number(b)).join('、'),
                [...entry.classes].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true })).join('、'),
                entry.subject,
                entry.hours,
                [...entry.venues].join('、')
            ]));
        const crossSheet = XLSX.utils.aoa_to_sheet(crossRows);
        crossSheet['!cols'] = [{ wch: 15 }, { wch: 14 }, { wch: 32 }, { wch: 12 }, { wch: 14 }, { wch: 24 }];
        XLSX.utils.book_append_sheet(wb, crossSheet, '跨级教师清单');

        const guideRows = [
            ['导入与锁定说明'],
            ['本文件“联合总课表”可直接作为“导入已有课表优化”的来源，继续做人工交换或重新生成。'],
            ['先确认某个级部后：先导入完整“联合任课表”，再用本文件的“联合总课表”通过“导入锁定级部课表”锁定已确认班级。'],
            ['锁定课表只会固定文件中有课的单元格；仍未锁定的班级和空时段会在下一次联合排课中继续计算。'],
            ['若没有跨级教师或共享场地，可单独导入一个级部的任课表并独立排课。']
        ];
        const guideSheet = XLSX.utils.aoa_to_sheet(guideRows);
        guideSheet['!cols'] = [{ wch: 110 }];
        XLSX.utils.book_append_sheet(wb, guideSheet, '导入与锁定说明');
        XLSX.writeFile(wb, '学年联合排课结果.xlsx');
    },

    parseImportedPeriod: function (value) {
        const text = String(value || '').replace(/\s+/g, '');
        const match = text.match(/^(上午|下午|晚|晚自习)(\d+)$/);
        if (!match) return '';
        const type = match[1] === '上午' ? 'am' : (match[1] === '下午' ? 'pm' : 'eve');
        return `${type}_${match[2]}`;
    },

    parseImportedCell: function (value) {
        const text = String(value == null ? '' : value).trim();
        if (!text || text === '-' || text === '(放假)' || text === '—') return null;
        const lines = text.replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean);
        let teacher = '';
        let venue = '';
        const subjectLines = [];
        lines.forEach((line) => {
            const teacherMatch = line.match(/^\(([^()]+)\)$/);
            const venueMatch = line.match(/^\[([^\[\]]+)\]$/);
            if (teacherMatch) teacher = teacherMatch[1].trim();
            else if (venueMatch) venue = venueMatch[1].trim();
            else subjectLines.push(line);
        });
        const subject = subjectLines.join(' ').trim();
        if (!subject) return null;
        return {
            subject,
            teacher: teacher || '-',
            venue,
            fixed: subject === '班会' || subject === '🚫 无课'
        };
    },

    readExistingSchedule: function (workbook) {
        const warnings = [];
        for (const sheetName of workbook.SheetNames || []) {
            const sheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            const headerIndex = rows.findIndex((row) => {
                const headers = (row || []).map((cell) => String(cell || '').trim());
                return headers.includes('班级') && headers.includes('时段')
                    && ['周一', '周二', '周三', '周四', '周五'].every((day) => headers.includes(day));
            });
            if (headerIndex < 0) continue;
            const headers = rows[headerIndex].map((cell) => String(cell || '').trim());
            const classIndex = headers.indexOf('班级');
            const gradeIndex = headers.indexOf('年级');
            const periodIndex = headers.indexOf('时段');
            const dayIndexes = ['周一', '周二', '周三', '周四', '周五'].map((day) => headers.indexOf(day));
            const schedule = {};
            const classMeta = Object.create(null);
            let importedCells = 0;
            rows.slice(headerIndex + 1).forEach((row, rowOffset) => {
                const rawClass = String(row?.[classIndex] || '').trim().replace(/班$/, '');
                const grade = this.normalizeGrade(gradeIndex >= 0 ? row?.[gradeIndex] : '') || this.inferGradeFromClass(rawClass);
                const className = this.normalizeClassName(grade, rawClass);
                const period = this.parseImportedPeriod(row?.[periodIndex]);
                if (!className || !period || rawClass === '---') return;
                if (!schedule[className]) schedule[className] = {};
                classMeta[className] = { grade, className };
                dayIndexes.forEach((columnIndex, dayOffset) => {
                    const cell = this.parseImportedCell(row?.[columnIndex]);
                    if (!cell) return;
                    schedule[className][`d${dayOffset + 1}_${period}`] = cell;
                    importedCells += 1;
                });
            });
            if (importedCells) return {
                schedule,
                classMeta,
                importedCells,
                sheetName,
                warnings
            };
        }
        warnings.push('未识别到“年级（可选）/ 班级 / 时段 / 周一至周五”课表表头。');
        return { schedule: {}, classMeta: Object.create(null), importedCells: 0, sheetName: '', warnings };
    },

    rebuildResourceDataFromSchedule: function (extraClassMeta = {}) {
        const resources = new Map();
        this.classes.forEach(cls => {
            Object.keys(this.schedule[cls] || {}).forEach(slotId => {
                if (slotId === '_blackList') return;
                const cell = this.schedule[cls][slotId];
                const teacher = this.normalizeTeacherName(cell?.teacher);
                const subject = String(cell?.subject || '').trim();
                if (!teacher || teacher === '-' || !subject || cell?.fixed) return;
                const venue = String(cell?.venue || '').trim();
                const grade = this.inferGradeFromClass(cls);
                const key = `${grade}__${cls}__${teacher}__${subject}__${venue}`;
                if (!resources.has(key)) resources.set(key, { grade, className: cls, name: teacher, subject, venue, weeklyHours: 0 });
                const resource = resources.get(key);
                resource.weeklyHours += 1;
            });
        });
        this.demands = Array.from(resources.values());
        this.importWarnings = [];
        const extra = Object.entries(extraClassMeta || {}).map(([className, meta]) => ({
            className,
            grade: meta?.grade || this.inferGradeFromClass(className)
        }));
        this.rebuildProjectFromDemands(extra);
    },

    importExisting: async function (input) {
        const file = input?.files?.[0];
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const parsed = this.readExistingSchedule(workbook);
            if (!parsed.importedCells) {
                return window.UI.alert(`${parsed.warnings[0] || '已读取文件，但没有识别到可编辑课程。'} 请导入本模块导出的课表，或使用相同列结构。`);
            }

            this.schedule = parsed.schedule;
            this.invalidateTableRenderCache();
            this.classes = Object.keys(parsed.schedule);
            this.lockedSchedule = Object.create(null);
            this.importWarnings = parsed.warnings;
            this.rebuildResourceDataFromSchedule(parsed.classMeta);
            this.rebuildTeacherSlotIndex();
            this.rebuildVenueSlotIndex();
            this.manualSelection = null;
            this.manualHistory = [];

            const target = document.getElementById('sch_view_target');
            const mode = document.getElementById('sch_view_mode');
            if (mode) mode.value = 'class';
            if (target) target.innerHTML = this.classes.map(cls => `<option value="${this.escapeHtml(cls)}">${this.escapeHtml(cls)}班</option>`).join('');
            const preview = document.getElementById('sch_resource_preview');
            if (preview) {
                preview.innerHTML = `<div style="color:#166534;"><strong>已导入现有课表</strong>：${this.classes.length} 个班级、${parsed.importedCells} 个课程时段。</div>`
                    + '<div style="padding-top:6px; color:#64748b;">可直接按班级查看、交换两个节次、撤销；重新生成时会按现有课表推导出的逐班课时重新排课。</div>';
            }
            document.getElementById('sch_result_area')?.classList.remove('hidden');
            this.renderTable();
            this.preflight({ silent: true });
            this.renderProjectStatus();
            window.UI?.toast(`已导入 ${this.classes.length} 个班级的现有课表，可直接微调或重新排课。`, 'success');
        } catch (error) {
            console.error('[grade-scheduler] import existing failed:', error);
            window.UI?.alert(`导入已有课表失败：${error?.message || error}`);
        } finally {
            if (input) input.value = '';
        }
    },

    importLockedSchedule: async function (input) {
        const file = input?.files?.[0];
        if (!file) return;
        if (!this.demands.length) {
            if (input) input.value = '';
            return window.UI?.alert('请先导入本学年完整任课表，再导入需要锁定的级部课表。');
        }
        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const parsed = this.readExistingSchedule(workbook);
            if (!parsed.importedCells) {
                return window.UI?.alert(`${parsed.warnings[0] || '未识别到可锁定课表。'} 请使用本模块导出的“联合总课表”。`);
            }
            const projectClasses = new Set(this.demands.map((demand) => demand.className));
            const warnings = [];
            Object.entries(parsed.schedule).forEach(([className, entries]) => {
                if (!projectClasses.has(className)) warnings.push(`锁定课表中的 ${className}班不在当前任课表中，仍会载入，但不会补排其余课时。`);
                if (!this.lockedSchedule[className]) this.lockedSchedule[className] = {};
                Object.entries(entries).forEach(([slotId, cell]) => {
                    if (slotId.startsWith('_') || !cell) return;
                    this.lockedSchedule[className][slotId] = { ...cell, fixed: true, locked: true };
                });
            });
            this.importWarnings = [...this.importWarnings, ...parsed.warnings, ...warnings];
            this.rebuildProjectFromDemands();
            this.schedule = this.cloneLockedSchedule();
            this.invalidateTableRenderCache();
            this.rebuildTeacherSlotIndex();
            this.rebuildVenueSlotIndex();
            this.manualSelection = null;
            this.manualHistory = [];
            document.getElementById('sch_result_area')?.classList.remove('hidden');
            this.renderTable();
            this.preflight({ silent: true });
            const remaining = this.demands.filter((demand) => this.countDemandLessons(demand) < Number(demand.weeklyHours));
            this.renderProjectStatus(remaining);
            window.UI?.toast(`已锁定 ${parsed.importedCells} 节已确认课表；其余班级和空时段将继续排课。`, 'success');
        } catch (error) {
            console.error('[grade-scheduler] import locked schedule failed:', error);
            window.UI?.alert(`导入锁定级部课表失败：${error?.message || error}`);
        } finally {
            if (input) input.value = '';
        }
    },

    // 课表单元格在每次渲染时重建，因此用一次捕获阶段的委托即可覆盖预检、
    // 撤销和动态单元格。属性值只映射到下面三种固定动作，不解析任意方法名。
    bindDeclarativeHandlers: function () {
        if (document.documentElement.dataset.schedulerBindingsInstalled === '1') return;
        document.documentElement.dataset.schedulerBindingsInstalled = '1';
        document.addEventListener('click', (event) => {
            const actionTrigger = event.target?.closest?.('[data-scheduler-click]');
            if (actionTrigger && document.documentElement.contains(actionTrigger) && !actionTrigger.disabled) {
                const action = actionTrigger.dataset.schedulerClick;
                if (action === 'preflight') this.preflight();
                if (action === 'undo-manual-move') this.undoManualMove();
                return;
            }
            const cell = event.target?.closest?.('[data-scheduler-slot]');
            if (!cell || !document.documentElement.contains(cell) || cell.disabled) return;
            const slotId = String(cell.dataset.schedulerSlot || '').trim();
            if (/^d[1-5]_(?:am|pm|eve)_\d+$/.test(slotId)) this.selectScheduleCell(slotId);
        }, true);
        document.addEventListener('change', (event) => {
            const fileInput = event.target?.closest?.('[data-scheduler-file]');
            if (fileInput && document.documentElement.contains(fileInput)) {
                if (fileInput.dataset.schedulerFile === 'import-locked') this.importLockedSchedule(fileInput);
                return;
            }
            const select = event.target?.closest?.('[data-scheduler-change]');
            if (!select || !document.documentElement.contains(select)) return;
            if (select.dataset.schedulerChange === 'activity-range') this.onActivityRangeChange(select);
        });
    }
};

    window.SCHEDULER = SCHEDULER;
    window.GradeSchedulerRuntime = SCHEDULER;
    SCHEDULER.bindDeclarativeHandlers();
    window.__GRADE_SCHEDULER_RUNTIME_PATCHED__ = true;
})();
