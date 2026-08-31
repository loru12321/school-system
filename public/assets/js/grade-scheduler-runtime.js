(() => {
    if (typeof window === 'undefined' || window.__GRADE_SCHEDULER_RUNTIME_PATCHED__) return;

const SCHEDULER = {
    // data 仅供既有预览/教师视图使用；真正的排课输入统一收敛到逐班 demands。
    // 这样同一教师在 6、7 年级的课时可以不同，且整个项目只有一个资源占用表。
    data: [],
    demands: [], // { grade, className, name, subject, weeklyHours, venue, note }
    // 手动补充的不参与教师考核的科目/项目，仍然占用班级时段。
    manualNonAssessmentDemands: [],
    classMeta: Object.create(null),
    lockedSchedule: Object.create(null), // 已确认级部课表：作为本项目不可移动的底图
    importWarnings: [],
    cloudTeacherMap: Object.create(null),
    cloudTeacherTermId: '',
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
    teacherDaySlotIndex: null,
    _reserveEveningThird: false,

    // 存储动态添加的规则
    rules: {
        meetings: [], // 班会 [{day:1, slot:'pm_3'}]
        busy: [],     // 教师忙
        softBusy: [], // 教师尽量避让（不作为硬禁排）
        activities: [], // 活动
        combined: [],  // 🟢 新增：合堂规则 [{subject:'物理', slot:'eve_3'}]
        pairs: [], // 同一班同一学科连堂偏好 [{subject:'语文', session:'pm', scope:'8'}]
        classSubjectBlocks: [], // 指定班级/学科/节次禁排 [{classNames, subject, days, slot}]
        teacherBlocks: {
            enabled: true,
            consecutiveWeight: 100,
            adjacentClassWeight: 160,
            sameSessionWeight: 28,
            sameDayWeight: 18,
            classSubjectBalanceWeight: 72,
            teacherDayLoadWeight: 12,
            classSubjectPeriodRepeatWeight: 220,
            teacherSubjectPeriodRepeatWeight: 54,
            newPeriodVarietyWeight: 18,
            teacherSubjectDayBalanceWeight: 96
        }
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
            const config = this.getSlotConfig();
            const parsedSlots = this.parseBusySlots(day, slotsRaw, config.am, config.pm, config.eve);
            if (!parsedSlots.length) return window.UI.alert('未识别到有效节次，请输入上午、下午、晚自习或具体节次。');
            const invalid = parsedSlots.filter((slotId) => !this.isValidSlotCode(slotId.replace(/^d\d+_/, ''), config));
            if (invalid.length) return window.UI.alert(`禁排节次超出当前课时结构：${invalid.map((slotId) => this.getSlotName(slotId.replace(/^d\d+_/, ''))).join('、')}`);
            const normalizedName = this.normalizeTeacherName(name);
            const existing = this.rules.busy.find((rule) => String(rule.day) === String(day) && this.normalizeTeacherName(rule.name) === normalizedName);
            if (existing) {
                const merged = new Set(this.parseBusySlots(day, existing.slotsStr, config.am, config.pm, config.eve));
                parsedSlots.forEach((slotId) => merged.add(slotId));
                existing.slotsStr = [...merged].map((slotId) => slotId.replace(/^d\d+_/, '')).join(',');
            } else {
                this.rules.busy.push({ day, slotsStr: slotsRaw, name: normalizedName, id: Date.now() });
            }
            this.renderTags('busy', this.rules.busy, b => `${b.name}: 周${b.day} [${b.slotsStr}] 不排`);
            document.getElementById('sch_busy_name').value = '';
            document.getElementById('sch_busy_slots').value = '';
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

    getGrade8TeacherMap: function () {
        const localMap = window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? window.TEACHER_MAP : {};
        const hasLocalGrade8 = Object.keys(localMap).some((key) => /^8(?:[._-])\d+_/.test(String(key || '').trim()));
        const source = hasLocalGrade8
            ? localMap
            : (Object.keys(this.cloudTeacherMap || {}).length ? this.cloudTeacherMap : localMap);
        const result = Object.create(null);
        Object.entries(source).forEach(([rawKey, rawTeacher]) => {
            const key = String(rawKey || '').trim();
            const separator = key.indexOf('_');
            if (separator <= 0) return;
            const className = this.normalizeClassName('', key.slice(0, separator));
            const subject = String(key.slice(separator + 1) || '').trim();
            const teacher = this.normalizeTeacherName(rawTeacher);
            if (!/^8\.\d+$/.test(className) || !subject || !teacher) return;
            result[`${className}_${subject}`] = teacher;
        });
        return result;
    },

    buildGrade8DemandsFromTeacherMap: function () {
        const teacherMap = this.getGrade8TeacherMap();
        const hours = {
            '语文': 8,
            '数学': 9,
            '英语': 9,
            '历史': 3,
            '地理': 3,
            '生物': 3,
            '政治': 2,
            '物理': 5,
            '化学': 5,
            '体育': 2
        };
        const classes = [...new Set(Object.keys(teacherMap).map((key) => key.split('_')[0]).filter((className) => /^8\.\d+$/.test(className)))]
            .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));
        const warnings = [];
        if (!classes.length) return { demands: [], classes: [], warnings: ['当前任课数据中没有识别到 8.x 班级。请先在“教师任课”导入 8 年级任课表，或点击“读取云端新学期任课”。'] };

        const physicalTeachers = [...new Set(classes.map((className) => teacherMap[`${className}_体育`] || '').filter(Boolean))];
        const physicalTeacher = physicalTeachers[0] || '体育教师';
        if (physicalTeachers.length > 1) warnings.push(`体育任课表识别到 ${physicalTeachers.length} 位教师；已按“全8年级同一位体育教师”规则统一使用 ${physicalTeacher}。`);
        if (!physicalTeachers.length) warnings.push('任课表未识别到体育教师；已暂用“体育教师”占位，生成前请确认实际姓名。');

        const demands = [];
        classes.forEach((className) => {
            Object.entries(hours).forEach(([subject, weeklyHours]) => {
                const teacher = subject === '体育' ? physicalTeacher : teacherMap[`${className}_${subject}`];
                if (!teacher) {
                    warnings.push(`${className}班缺少${subject}教师，已跳过该科 ${weeklyHours} 节。`);
                    return;
                }
                demands.push({
                    id: `grade8-${className}-${subject}`,
                    grade: '8',
                    className,
                    name: teacher,
                    subject,
                    weeklyHours,
                    venue: '',
                    note: '新8年级排课方案',
                    teacherSource: subject === '体育' && !physicalTeachers.length ? 'preset-placeholder' : 'teacher-map'
                });
            });
        });
        return { demands, classes, warnings };
    },

    clearGrade8PresetRules: function () {
        const isPreset = (rule) => rule && rule.profile === 'grade8-preset';
        this.rules.meetings = this.rules.meetings.filter((rule) => !isPreset(rule));
        this.rules.busy = this.rules.busy.filter((rule) => !isPreset(rule));
        this.rules.softBusy = (this.rules.softBusy || []).filter((rule) => !isPreset(rule));
        this.rules.activities = this.rules.activities.filter((rule) => !isPreset(rule));
        this.rules.combined = this.rules.combined.filter((rule) => !isPreset(rule));
        this.rules.pairs = (this.rules.pairs || []).filter((rule) => !isPreset(rule));
        this.rules.classSubjectBlocks = (this.rules.classSubjectBlocks || []).filter((rule) => !isPreset(rule));
    },

    applyGrade8PresetRules: function (teacherMap, classes) {
        this.clearGrade8PresetRules();
        const profile = 'grade8-preset';
        const pushMeeting = (day, slot) => this.rules.meetings.push({ day: String(day), slot, scope: '8', profile, id: `grade8-meeting-${day}-${slot}` });
        const pushActivity = (day, subject, slotsStr) => this.rules.activities.push({ day: String(day), range: 'custom', subject, scope: '8', slotsStr, profile, id: `grade8-activity-${day}-${subject}` });
        const pushBusy = (day, name, slotsStr) => {
            if (!name) return;
            this.rules.busy.push({ day: String(day), slotsStr, name: this.normalizeTeacherName(name), profile, id: `grade8-busy-${day}-${name}-${slotsStr}` });
        };
        const pushSoftBusy = (day, name, slotsStr) => {
            if (!name) return;
            this.rules.softBusy.push({ day: String(day), slotsStr, name: this.normalizeTeacherName(name), profile, id: `grade8-soft-busy-${day}-${name}-${slotsStr}` });
        };

        pushMeeting(1, 'pm_4');
        pushMeeting(5, 'pm_4');
        this.rules.activities.push({ day: '4', range: 'custom', subject: 'ALL', scope: '8', slotsStr: 'pm_4', profile, id: 'grade8-club-thu-pm4' });

        pushActivity(2, '语文', 'am_1,am_2,am_3');
        pushActivity(3, '数学', 'am_1,am_2,am_3');
        ['英语', '物理', '化学', '政治', '历史'].forEach((subject) => pushActivity(4, subject, 'am_1,am_2,am_3'));
        ['地理', '生物'].forEach((subject) => pushActivity(5, subject, 'am_1,am_2,am_3'));

        // 新 8 年级专项限制：8.3、8.4 班英语不得安排在上午第 4 节。
        this.rules.classSubjectBlocks.push({
            classNames: ['8.3', '8.4'],
            subject: '英语',
            days: [1, 2, 3, 4, 5],
            slot: 'am_4',
            profile,
            id: 'grade8-english-no-am4-83-84'
        });

        ['赵世骄', '孙少章', '王旋', '张靖硕'].forEach((name) => {
            pushBusy(5, name, 'am_3,am_4');
            pushSoftBusy(1, name, 'am_3,am_4');
        });
        [1, 2, 3, 4, 5].forEach((day) => pushBusy(day, '刘敏', 'pm_4'));
        [1, 2, 3, 4].forEach((day) => pushBusy(day, '薛丽娟', 'eve_1,eve_2,eve_3'));

        ['语文', '数学', '英语', '历史', '地理', '生物', '政治', '物理', '化学'].forEach((subject) => {
            this.rules.combined.push({ subject, slot: 'eve_3', scope: 'grade', profile, id: `grade8-combined-${subject}` });
        });
        this.rules.pairs.push({ subject: '语文', session: 'pm', scope: '8', profile, id: 'grade8-chinese-composition-pair' });
        return { teacherMap, classes };
    },

    applyGrade8Preset: async function () {
        const source = this.buildGrade8DemandsFromTeacherMap();
        if (!source.demands.length) return window.UI?.alert(source.warnings.join('\n'));
        if (this.demands.length && window.UI?.confirm) {
            const confirmed = await window.UI.confirm('将按新8年级规则重建当前排课项目，并替换当前待排课程需求；已有锁定课表不会保留。是否继续？');
            if (!confirmed) return;
        }
        this.demands = source.demands;
        this.manualNonAssessmentDemands = [];
        this.importWarnings = source.warnings;
        this.lockedSchedule = Object.create(null);
        this.schedule = {};
        this.cloudTeacherMap = { ...this.getGrade8TeacherMap() };
        this.applyGrade8PresetRules(this.cloudTeacherMap, source.classes);
        this.invalidateTableRenderCache();
        this.rebuildProjectFromDemands();
        this.preflight({ silent: true });
        this.renderProjectStatus();
        window.UI?.toast(`已按新8年级方案生成 ${source.classes.length} 个班、${source.demands.length} 条课程需求；请先查看预检再开始排课。`, source.warnings.length ? 'warning' : 'success');
    },

    addManualNonAssessmentDemand: function () {
        const subject = String(document.getElementById('sch_manual_subject')?.value || '').trim();
        const weeklyHours = Number(document.getElementById('sch_manual_hours')?.value || 0);
        const classSelect = document.getElementById('sch_manual_classes');
        const classNames = Array.from(classSelect?.selectedOptions || []).map((option) => String(option.value || '').trim()).filter(Boolean);
        const classHours = this.readManualClassHours(classNames, weeklyHours);
        const fixedDay = String(document.getElementById('sch_manual_day')?.value || '').trim();
        const fixedSlot = this.normalizeSlotCode(document.getElementById('sch_manual_slot')?.value || '');
        const venue = String(document.getElementById('sch_manual_venue')?.value || '').trim();
        const note = String(document.getElementById('sch_manual_note')?.value || '').trim();
        if (!subject) return window.UI?.alert('请填写科目或项目名称。');
        if (!Number.isInteger(weeklyHours) || weeklyHours <= 0) return window.UI?.alert('每班每周节数请输入正整数。');
        if (!classNames.length) return window.UI?.alert('请至少选择一个对应班级。');
        const invalidClassHours = classNames.filter((className) => !Number.isInteger(classHours[className]) || classHours[className] <= 0);
        if (invalidClassHours.length) return window.UI?.alert(`请为以下班级填写正整数课时：${invalidClassHours.join('、')}。`);
        const existingKeys = new Set(this.demands.map((item) => `${item.className}__${item.subject}__${item.nonAssessment ? 'manual' : 'regular'}`));
        const added = [];
        classNames.forEach((className) => {
            const key = `${className}__${subject}__manual`;
            if (existingKeys.has(key)) return;
            const grade = this.inferGradeFromClass(className);
            const demand = {
                id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                grade,
                className,
                name: '',
                subject,
                weeklyHours: classHours[className],
                venue,
                note,
                fixedDay,
                fixedSlot,
                nonAssessment: true,
                teacherSource: 'manual-non-assessment',
                countsForAssessment: false
            };
            this.demands.push(demand);
            this.manualNonAssessmentDemands.push(demand);
            existingKeys.add(key);
            added.push(className);
        });
        this.rebuildProjectFromDemands();
        this.invalidateTableRenderCache();
        this.preflight({ silent: true });
        this.renderManualDemandTags();
        if (added.length) window.UI?.toast(`已添加 ${added.length} 个班级的“${subject}”（非考核）课时。`, 'success');
        else window.UI?.toast('相同班级和科目已存在，未重复添加。', 'info');
        ['sch_manual_subject', 'sch_manual_hours', 'sch_manual_venue', 'sch_manual_note'].forEach((id) => { const el = document.getElementById(id); if (el) el.value = ''; });
        Array.from(classSelect?.options || []).forEach((option) => { option.selected = false; });
        this.refreshManualClassHours();
        this.updateManualClassSelectionSummary();
    },

    removeManualNonAssessmentDemand: function (id) {
        const targetId = String(id || '');
        this.demands = this.demands.filter((item) => String(item.id || '') !== targetId);
        this.manualNonAssessmentDemands = this.manualNonAssessmentDemands.filter((item) => String(item.id || '') !== targetId);
        this.rebuildProjectFromDemands();
        this.invalidateTableRenderCache();
        this.preflight({ silent: true });
        this.renderManualDemandTags();
    },

    clearManualNonAssessmentDemands: function () {
        if (!this.manualNonAssessmentDemands.length) return;
        this.demands = this.demands.filter((item) => !item.nonAssessment);
        this.manualNonAssessmentDemands = [];
        this.rebuildProjectFromDemands();
        this.invalidateTableRenderCache();
        this.preflight({ silent: true });
        this.renderManualDemandTags();
    },

    renderManualDemandTags: function () {
        const container = document.getElementById('sch_tags_manual');
        if (!container) return;
        if (!this.manualNonAssessmentDemands.length) {
            container.innerHTML = '<span style="color:#94a3b8; font-size:12px;">暂未添加手动非考核科目/项目。</span>';
            return;
        }
        container.innerHTML = this.manualNonAssessmentDemands.map((item) => {
            const fixed = item.fixedDay && item.fixedSlot
                ? ` · 固定周${item.fixedDay}${this.getSlotName(item.fixedSlot)}（每周1节固定，其余自动）`
                : (item.fixedDay
                    ? ` · 仅限周${item.fixedDay}（其余课时自动安排）`
                    : (item.fixedSlot ? ` · 仅限${this.getSlotName(item.fixedSlot)}（其余课时自动安排）` : ''));
            return `<div class="tag-chip" style="background:#ede9fe; color:#5b21b6; margin:3px 0;">${this.escapeHtml(item.subject)} · ${this.escapeHtml(item.className)}班 · ${Number(item.weeklyHours)}节/周${fixed}<button type="button" class="tag-chip-remove" data-scheduler-manual-remove="${this.escapeHtml(item.id)}" aria-label="删除">&times;</button></div>`;
        }).join('');
    },

    refreshManualClassOptions: function () {
        const select = document.getElementById('sch_manual_classes');
        if (!select) return;
        const selected = new Set(Array.from(select.selectedOptions || []).map((option) => option.value));
        select.innerHTML = this.classes.map((className) => `<option value="${this.escapeHtml(className)}">${this.escapeHtml(className)}班</option>`).join('');
        Array.from(select.options).forEach((option) => { option.selected = selected.has(option.value); });
        this.refreshManualClassHours();
        this.updateManualClassSelectionSummary();
    },

    updateManualClassSelectionSummary: function () {
        const select = document.getElementById('sch_manual_classes');
        const summary = document.getElementById('sch_manual_selected_count');
        if (summary) summary.textContent = `已选 ${Array.from(select?.selectedOptions || []).length} 个班`;
    },

    refreshManualClassHours: function () {
        const select = document.getElementById('sch_manual_classes');
        const panel = document.getElementById('sch_manual_class_hours');
        const rows = document.getElementById('sch_manual_class_hours_rows');
        if (!select || !panel || !rows) return;
        const selectedClasses = Array.from(select.selectedOptions || []).map((option) => String(option.value || '').trim()).filter(Boolean);
        const current = new Map(Array.from(rows.querySelectorAll('input[data-manual-class-hours]')).map((input) => [String(input.dataset.manualClassHours || ''), input.value]));
        const defaultHours = document.getElementById('sch_manual_hours')?.value || '';
        panel.style.display = selectedClasses.length ? '' : 'none';
        rows.innerHTML = selectedClasses.map((className) => {
            const value = current.has(className) ? current.get(className) : defaultHours;
            return `<label style="font-size:12px;">${this.escapeHtml(className)}班<input type="number" min="1" step="1" data-manual-class-hours="${this.escapeHtml(className)}" value="${this.escapeHtml(value)}" style="width:100%; margin-top:3px;"></label>`;
        }).join('');
    },

    readManualClassHours: function (classNames, fallback) {
        const result = Object.create(null);
        const rows = document.getElementById('sch_manual_class_hours_rows');
        const inputs = rows ? Array.from(rows.querySelectorAll('input[data-manual-class-hours]')) : [];
        const values = new Map(inputs.map((input) => [String(input.dataset.manualClassHours || ''), Number(input.value || fallback)]));
        (Array.isArray(classNames) ? classNames : []).forEach((className) => {
            result[className] = values.has(className) ? values.get(className) : fallback;
        });
        return result;
    },

    selectAllManualClasses: function () {
        const select = document.getElementById('sch_manual_classes');
        if (!select) return;
        Array.from(select.options).forEach((option) => { option.selected = true; });
        this.refreshManualClassHours();
        this.updateManualClassSelectionSummary();
    },

    clearManualClasses: function () {
        const select = document.getElementById('sch_manual_classes');
        if (!select) return;
        Array.from(select.options).forEach((option) => { option.selected = false; });
        this.refreshManualClassHours();
        this.updateManualClassSelectionSummary();
    },

    refreshManualSlotOptions: function () {
        const select = document.getElementById('sch_manual_slot');
        if (!select) return;
        const config = this.getSlotConfig();
        Array.from(select.options || []).forEach((option) => {
            const code = this.normalizeSlotCode(option.value || '');
            option.disabled = !!code && !this.isValidSlotCode(code, config);
            if (option.disabled && option.selected) { select.value = ''; }
        });
    },

    removeConstraint: function (type, id) {
        const parsedId = Number(id);
        const targetId = Number.isFinite(parsedId) ? parsedId : id;
        if (type === 'meeting') this.rules.meetings = this.rules.meetings.filter(x => x.id !== targetId);
        if (type === 'busy') this.rules.busy = this.rules.busy.filter(x => x.id !== targetId);
        if (type === 'activity') this.rules.activities = this.rules.activities.filter(x => x.id !== targetId);
        // 🟢 新增 combined 删除
        if (type === 'combined') this.rules.combined = this.rules.combined.filter(x => x.id !== targetId);

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
            tag.innerHTML = `${labelFn(item)} <button type="button" class="tag-chip-remove" data-scheduler-remove-type="${this.escapeHtml(type)}" data-scheduler-remove-id="${this.escapeHtml(item.id)}" aria-label="删除规则">&times;</button>`;
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

    getCloudTeacherTermContext: function () {
        const cohortId = String(
            (typeof window.getCurrentCohortId === 'function' ? window.getCurrentCohortId() : '')
            || window.CURRENT_COHORT_ID
            || (typeof window.readWorkspaceCohortId === 'function' ? window.readWorkspaceCohortId() : '')
            || ''
        ).trim();
        const termSelect = document.getElementById('dm-teacher-term-select');
        const selectedIsActive = termSelect && typeof window.isTeacherTermSelectActive === 'function'
            ? window.isTeacherTermSelectActive(termSelect)
            : !!termSelect && termSelect.options && termSelect.options.length > 0
                && termSelect.offsetParent !== null;
        const preferred = selectedIsActive
            ? String(termSelect.value || '').trim()
            : '';
        const parseTerm = (termId) => {
            const text = String(termId || '').trim();
            const year = (text.match(/(?:^|_)(\d{4}-\d{4})(?:_|$)/) || [])[1] || '';
            const term = (text.match(/(?:^|_)(上学期|下学期)(?:_|$)/) || [])[1] || '';
            const grade = (text.match(/(?:^|_)(\d{1,2})年级(?:_|$)/) || [])[1] || '';
            return { year, term, grade, termId: text };
        };
        const preferredContext = parseTerm(preferred);
        if (preferredContext.year && preferredContext.term && preferredContext.grade) {
            return { ...preferredContext, cohortId };
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const startYear = month >= 8 ? now.getFullYear() : now.getFullYear() - 1;
        const term = month >= 8 ? '上学期' : '下学期';
        const grade = cohortId && /^\d{4}$/.test(cohortId)
            ? String(6 + (startYear - Number(cohortId)))
            : '';
        const year = `${startYear}-${startYear + 1}`;
        const termId = year && grade ? `${year}_${term}_${grade}年级` : '';
        return { year, term, grade, termId, cohortId };
    },

    applyCloudTeacherMap: function (options = {}) {
        const cloudMap = this.cloudTeacherMap && typeof this.cloudTeacherMap === 'object'
            ? this.cloudTeacherMap : {};
        if (!Object.keys(cloudMap).length) return { updated: 0, missing: [] };
        const missing = [];
        let updated = 0;
        this.demands = (this.demands || []).map((demand) => {
            if (demand.nonAssessment) return demand;
            const key = `${demand.className}_${demand.subject}`;
            const teacher = String(cloudMap[key] || '').trim();
            if (!teacher) {
                missing.push(key);
                return demand;
            }
            if (demand.name !== teacher) updated += 1;
            return { ...demand, name: teacher, teacherSource: 'cloud' };
        });
        if (updated) {
            // 任课教师变化后，原课表的教师资源占用可能已经失效，必须重新排课。
            this.schedule = {};
            this.lockedSchedule = Object.create(null);
            this.invalidateTableRenderCache();
            this.rebuildProjectFromDemands();
            this.renderProjectStatus();
        }
        if (!options.silent && window.UI) {
            const suffix = missing.length ? `，${missing.length} 条班级/学科未找到云端教师` : '';
            UI.toast(`已用云端任课表更新 ${updated} 条排课资源${suffix}`, missing.length ? 'warning' : 'success');
        }
        return { updated, missing };
    },

    loadCloudTeachers: async function () {
        const context = this.getCloudTeacherTermContext();
        if (!context.cohortId) {
            return window.UI?.alert('请先选择届别。');
        }
        if (!context.termId) {
            return window.UI?.alert('无法确定任课学期，请先选择学年、学期和年级。');
        }
        if (!window.CloudManager || typeof window.CloudManager.loadTeachers !== 'function') {
            return window.UI?.alert('云端任课服务未就绪，请刷新后重试。');
        }
        const school = String(
            (typeof window.readCurrentSchool === 'function' ? window.readCurrentSchool() : '')
            || window.MY_SCHOOL || ''
        ).trim();
        const keyBuilder = typeof window.CloudManager.getTeacherKey === 'function'
            ? window.CloudManager.getTeacherKey.bind(window.CloudManager)
            : null;
        const keys = [];
        if (keyBuilder && school) keys.push(keyBuilder({ termId: context.termId, schoolName: school }));
        if (keyBuilder) keys.push(keyBuilder({ termId: context.termId }));
        let loaded = false;
        for (const exactKey of [...new Set(keys.filter(Boolean))]) {
            loaded = await window.CloudManager.loadTeachers({
                exactKey,
                schoolName: school,
                force: true,
                preferRemote: true,
                blocking: false,
                toast: false
            });
            if (loaded) break;
        }
        if (!loaded) {
            return window.UI?.alert(`未找到 ${context.cohortId}届 ${context.year} ${context.term} ${context.grade}年级任课表，请先同步。`);
        }
        this.cloudTeacherMap = JSON.parse(JSON.stringify(window.TEACHER_MAP || {}));
        this.cloudTeacherTermId = context.termId;
        const assignments = Object.entries(this.cloudTeacherMap).filter(([key, teacher]) => {
            const className = String(key).split('_')[0];
            return !context.grade || this.inferGradeFromClass(className) === context.grade;
        });
        const status = document.getElementById('sch_cloud_teacher_status');
        if (status) status.textContent = `已读取：${context.cohortId}届 · ${context.year} ${context.term} · ${context.grade}年级 · ${assignments.length} 条云端任课关系`;
        if (this.demands.length) {
            const result = this.applyCloudTeacherMap({ silent: true });
            window.UI?.toast(`✅ 已读取云端任课表并更新 ${result.updated} 条排课教师`, result.missing.length ? 'warning' : 'success');
        } else {
            const preview = document.getElementById('sch_resource_preview');
            if (preview) preview.innerHTML = `<div style="color:#166534;"><strong>云端任课已读取</strong>：${this.escapeHtml(context.cohortId)}届 ${this.escapeHtml(context.year)} ${this.escapeHtml(context.term)} ${this.escapeHtml(context.grade)}年级，共 ${assignments.length} 条。</div><div style="padding-top:6px;color:#64748b;">导入课时表时教师可留空，系统按班级+学科自动补齐。</div>`;
            window.UI?.toast(`✅ 已读取 ${assignments.length} 条云端任课关系`, 'success');
        }
        return true;
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
            softBusy: (this.rules.softBusy || []).length,
            activities: this.rules.activities.length,
            combined: this.rules.combined.length,
            pairs: (this.rules.pairs || []).length,
            classSubjectBlocks: (this.rules.classSubjectBlocks || []).length
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
        const allSlots = this.getAllSlots(config);
        const availableSlots = allSlots.filter((slot) => !this.isGloballyClosedSlot(slot)).length;

        if (!demands.length) errors.push('请先导入“学年联合任课表”，或先添加手动非考核科目/项目。');
        if (!this.classes.length) errors.push('当前项目未识别到班级，请先导入任课表，或添加手动项目并选择对应班级。');
        if (config.am + config.pm + config.eve <= 0) errors.push('上午、下午和晚自习节数不能同时为 0。');
        if (grades.length < 2 && demands.length) warnings.push('当前只导入了一个年级；跨级教师避让需要把相关年级一起导入同一份任课表。');

        demands.forEach((demand) => {
            if (!Number.isInteger(Number(demand.weeklyHours)) || Number(demand.weeklyHours) <= 0) {
                errors.push(`${demand.className}班 ${demand.subject}（${demand.name}）的“每班周课时”必须是正整数。`);
            }
            if (Number(demand.weeklyHours) > availableSlots) {
                errors.push(`${demand.className}班 ${demand.subject} 需要 ${demand.weeklyHours} 节，超过当前可排的 ${availableSlots} 个时段。`);
            }
            if (demand.nonAssessment && demand.fixedSlot && !this.isValidSlotCode(demand.fixedSlot, config)) {
                errors.push(`${demand.className}班 ${demand.subject} 固定的 ${this.getSlotName(demand.fixedSlot)} 超出当前课时结构。`);
            }
            if (demand.nonAssessment && demand.fixedDay && !demand.fixedSlot) {
                const daySlots = allSlots.filter((slot) => slot.day === Number(demand.fixedDay) && !this.isGloballyClosedSlot(slot));
                if (Number(demand.weeklyHours) > daySlots.length) {
                    errors.push(`${demand.className}班 ${demand.subject} 限定周${demand.fixedDay}，但每周需要 ${demand.weeklyHours} 节，当天只有 ${daySlots.length} 个可用时段。`);
                }
            }
            if (demand.nonAssessment && demand.fixedSlot && !demand.fixedDay) {
                const slotDays = allSlots.filter((slot) => slot.id.replace(/^d\d+_/, '') === demand.fixedSlot && !this.isGloballyClosedSlot(slot));
                if (Number(demand.weeklyHours) > slotDays.length) {
                    errors.push(`${demand.className}班 ${demand.subject} 限定${this.getSlotName(demand.fixedSlot)}，但每周需要 ${demand.weeklyHours} 节，当前每周只有 ${slotDays.length} 个该节次可用。`);
                }
            }
            if (demand.nonAssessment && demand.fixedDay && demand.fixedSlot) {
                const fixedSlot = allSlots.find((slot) => slot.day === Number(demand.fixedDay)
                    && slot.id.replace(/^d\d+_/, '') === demand.fixedSlot);
                if (!fixedSlot || this.isGloballyClosedSlot(fixedSlot)) {
                    errors.push(`${demand.className}班 ${demand.subject} 固定的周${demand.fixedDay}${this.getSlotName(demand.fixedSlot)}当前不可用，请调整周次或节次。`);
                }
            }
        });
        const fixedDemandKeys = new Set();
        demands.filter((demand) => demand.nonAssessment && demand.fixedDay && demand.fixedSlot).forEach((demand) => {
            const key = `${demand.className}__${demand.fixedDay}__${demand.fixedSlot}`;
            if (fixedDemandKeys.has(key)) errors.push(`${demand.className}班有多个手动项目固定在周${demand.fixedDay}${this.getSlotName(demand.fixedSlot)}，请调整其中一个时段。`);
            fixedDemandKeys.add(key);
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
        (this.rules.classSubjectBlocks || []).forEach((rule) => {
            const targetClasses = Array.isArray(rule.classNames) && rule.classNames.length
                ? rule.classNames.filter((className) => this.classes.includes(className))
                : this.getScopeClasses(rule.scope);
            if (!targetClasses.length) warnings.push(`班级学科禁排规则“${rule.subject}”当前没有对应班级。`);
            if (!subjects.has(rule.subject)) warnings.push(`班级学科禁排规则“${rule.subject}”未在任课表中识别到该学科。`);
            if (!this.isValidSlotCode(rule.slot, config)) errors.push(`班级学科禁排规则“${rule.subject} ${this.getSlotName(rule.slot)}”超出当前课时结构。`);
            const days = Array.isArray(rule.days) && rule.days.length ? rule.days : [1, 2, 3, 4, 5];
            if (days.some((day) => !Number.isInteger(Number(day)) || Number(day) < 1 || Number(day) > 5)) {
                errors.push(`班级学科禁排规则“${rule.subject}”包含无效星期。`);
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
                if (String(cell.subject || '').replace(/\(合\)$/, '').trim() === '体育' && slot.type === 'eve') {
                    errors.push(`锁定课表中的 ${className}班 ${this.getSlotName(slotId.replace(/^d\d+_/, ''))} 不允许安排体育课，请调整到上午或下午。`);
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
            `班会 ${counts.meetings} · 禁排 ${counts.busy} · 学科禁排 ${counts.classSubjectBlocks} · 软避让 ${counts.softBusy} · 教研 ${counts.activities} · 合堂 ${counts.combined} · 连堂 ${counts.pairs}`
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
            this.demands = parsed.demands;
            this.manualNonAssessmentDemands = [];
            this.importWarnings = parsed.warnings;
            this.lockedSchedule = Object.create(null);
            this.schedule = {};
            this.invalidateTableRenderCache();
            this.rebuildProjectFromDemands();

            this.manualSelection = null;
            this.manualHistory = [];
            this.preflight({ silent: true });
            this.renderProjectStatus();

            if (window.UI) UI.toast(`✅ 已导入 ${this.demands.length} 条逐班课程需求，覆盖 ${this.getProjectGrades().length} 个年级。`, 'success');
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
            if (!subject || !classValue || !hoursValue) {
                warnings.push(`第 ${index + 2} 行缺少学科、班级或每班周课时，已跳过。`);
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
                const cloudTeacher = this.cloudTeacherMap?.[`${className}_${subject}`] || '';
                const resolvedTeacher = this.normalizeTeacherName(cloudTeacher || name);
                if (!resolvedTeacher) {
                    warnings.push(`第 ${index + 2} 行缺少教师姓名，且云端任课表中未找到 ${className}班 ${subject}，已跳过。`);
                    return;
                }
                const key = [resolvedTeacher, subject, className].join('__');
                const current = merged.get(key) || {
                    grade: classGrade,
                    className,
                    name: resolvedTeacher,
                    subject,
                    weeklyHours: 0,
                    venue: String(venue || '').trim(),
                    note: String(note || '').trim(),
                    teacherSource: cloudTeacher ? 'cloud' : 'file'
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
        this.refreshManualClassOptions();
        this.renderManualDemandTags();
        this.refreshTeacherBusyOptions();
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
            `<strong>${this.escapeHtml(demand.className)}班</strong> · ${this.escapeHtml(demand.subject)} · ${demand.nonAssessment ? '<span style="color:#7c3aed;">非考核手动项目</span>' : this.escapeHtml(demand.name)} · ${this.escapeHtml(demand.weeklyHours)}节` +
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
            status.textContent = '导入任课表或添加手动非考核项目后，这里会显示单级部或联合项目的资源、锁定课与冲突状态。';
            return;
        }
        const conflicts = this.getScheduleResourceConflicts();
        const grades = this.getProjectGrades();
        const crossGradeTeachers = this.getCrossGradeTeachers();
        const base = `${grades.join('、')}年级联合排课 · ${this.classes.length} 个班级 · ${crossGradeTeachers.length} 位跨级教师 · 锁定 ${this.countScheduleCells(this.lockedSchedule)} 节`;
        const blockStats = this.countScheduleCells(this.schedule)
            ? this.getTeacherBlockStats()
            : null;
        const blockSummary = blockStats && blockStats.teacherSubjectGroups
            ? `教师同科：${blockStats.consecutiveLinks} 个相邻连排、${blockStats.sameSessionLinks} 个同段连接、${blockStats.sameDayGroups} 组同日安排`
            : '';
        const remainingCount = unfilled.length || this.demands.filter((demand) => (
            this.countDemandLessons(demand) < Number(demand.weeklyHours)
        )).length;
        if (!this.countScheduleCells(this.schedule)) {
            status.className = 'scheduler-project-status';
            const regularCount = this.demands.filter((demand) => !demand.nonAssessment).length;
            const manualCount = this.demands.filter((demand) => demand.nonAssessment).length;
            const sourceSummary = regularCount && manualCount
                ? `任课表与 ${manualCount} 条手动非考核项目均已就绪`
                : (regularCount ? '任课表已就绪' : `已配置 ${manualCount} 条手动非考核项目`);
            status.textContent = `${base}。${sourceSummary}；请完成规则预检后开始${grades.length > 1 ? '联合' : '本级部'}排课。`;
        } else if (conflicts.length) {
            status.className = 'scheduler-project-status is-error';
            status.textContent = `${base}。检测到 ${conflicts.length} 项资源冲突，请不要导出为正式课表。`;
        } else if (remainingCount) {
            status.className = 'scheduler-project-status is-warning';
            status.textContent = `${base}。仍有 ${remainingCount} 条逐班课程未排完，请放宽禁排/场地约束后重试。${blockSummary ? ` ${blockSummary}。` : ''}`;
        } else {
            status.className = 'scheduler-project-status is-ok';
            status.textContent = `${base}。教师与场地均无同一时段冲突，可按班级或教师复核后导出。${blockSummary ? ` ${blockSummary}。` : ''}`;
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
        // 指定班级的指定学科/节次禁排，按星期批量写入班级黑名单。
        (this.rules.classSubjectBlocks || []).forEach((rule) => {
            const targetClasses = Array.isArray(rule.classNames) && rule.classNames.length
                ? rule.classNames.filter((className) => this.classes.includes(className))
                : this.getScopeClasses(rule.scope);
            const days = Array.isArray(rule.days) && rule.days.length ? rule.days : [1, 2, 3, 4, 5];
            targetClasses.forEach((className) => {
                days.forEach((day) => {
                    this.addBlacklist(className, `d${day}_${this.normalizeSlotCode(rule.slot)}`, rule.subject);
                });
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

    refreshTeacherBusyOptions: function () {
        const list = document.getElementById('sch_busy_teacher_options');
        if (!list) return;
        const names = [...new Set(this.demands.map((demand) => this.normalizeTeacherName(demand.name)).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'zh-CN'));
        list.innerHTML = names.map((name) => `<option value="${this.escapeHtml(name)}"></option>`).join('');
    },

    isDemandBlocked: function (demand, slotId) {
        const blocked = this.schedule[demand.className]?._blackList?.[slotId] || [];
        return blocked.includes('ALL') || blocked.includes(demand.subject);
    },

    getAdjacentClassNumber: function (className) {
        const match = String(className || '').match(/(?:^|[._-])(\d+)$/);
        return match ? Number(match[1]) : NaN;
    },

    areAdjacentClasses: function (left, right) {
        const leftNumber = this.getAdjacentClassNumber(left);
        const rightNumber = this.getAdjacentClassNumber(right);
        return Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && Math.abs(leftNumber - rightNumber) === 1
            && String(left || '').replace(/\d+$/, '') === String(right || '').replace(/\d+$/, '');
    },

    isSameClassSubjectConsecutiveAllowed: function (demand, slot, options = {}) {
        if (!demand || !slot) return false;
        const subject = String(demand.subject || '').replace(/\(合\)$/, '').trim();
        if (options.combined || (slot.type === 'eve' && slot.period === 3)) return true;
        return (this.rules.pairs || []).some((rule) => rule.subject === subject
            && String(rule.session || '') === String(slot.type || '')
            && this.getScopeClasses(rule.scope).includes(demand.className));
    },

    isEveningThirdReserved: function (demand, slot) {
        if (!this._reserveEveningThird || !demand || !slot || slot.type !== 'eve' || slot.period !== 3) return false;
        const subject = String(demand.subject || '').replace(/\(合\)$/, '').trim();
        return (this.rules.combined || []).some((rule) => rule.slot === 'eve_3'
            && rule.subject === subject
            && this.getScopeClasses(rule.scope).includes(demand.className));
    },

    // 晚自习第三节合堂是教师同时照看多个班级的管理时段：
    // 它必须占用班级/教师时段，防止冲突，但不应消耗该班正常教学周课时。
    isNonTeachingHourCombinedCell: function (cell, slotId) {
        return !!cell?.isCombined && /^d[1-5]_eve_3$/.test(String(slotId || ''));
    },

    canPlaceDemand: function (demand, slot, teacherBusyMap, options = {}) {
        if (!demand || !slot || this.isGloballyClosedSlot(slot)) return false;
        if (String(demand.subject || '').replace(/\(合\)$/, '').trim() === '体育' && slot.type === 'eve') return false;
        const classSchedule = this.schedule[demand.className] || {};
        if (classSchedule[slot.id] || this.isDemandBlocked(demand, slot.id)) return false;
        if (this.isEveningThirdReserved(demand, slot) && !options.combined) return false;
        const subject = String(demand.subject || '').replace(/\(合\)$/, '').trim();
        const adjacentPeriods = [slot.period - 1, slot.period + 1].filter((period) => period >= 1);
        const hasAdjacentSameSubject = adjacentPeriods.some((period) => {
            const adjacentId = `d${slot.day}_${slot.type}_${period}`;
            const cell = classSchedule[adjacentId];
            return cell && String(cell.subject || '').replace(/\(合\)$/, '').trim() === subject;
        });
        if (hasAdjacentSameSubject && !this.isSameClassSubjectConsecutiveAllowed(demand, slot, options)) return false;
        if (teacherBusyMap[`${this.normalizeTeacherName(demand.name)}_${slot.id}`]) return false;
        if (this.isTeacherBusyInOtherClass(demand.name, slot.id)) return false;
        if (demand.venue && this.isVenueBusyInOtherClass(demand.venue, slot.id)) return false;
        return true;
    },

    countDemandLessons: function (demand, schedule = this.schedule) {
        return Object.entries(schedule?.[demand.className] || {}).filter(([slotId, cell]) => {
            return !slotId.startsWith('_') && cell
                && !this.isNonTeachingHourCombinedCell(cell, slotId)
                && this.normalizeTeacherName(cell.teacher) === this.normalizeTeacherName(demand.name)
                && String(cell.subject || '').replace(/\(合\)$/, '') === String(demand.subject || '');
        }).length;
    },

    placeDemand: function (demand, slotId, options = {}) {
        const cell = {
            subject: demand.subject,
            teacher: options.combined ? `${demand.name}(合)` : demand.name,
            venue: demand.venue || '',
            nonAssessment: !!demand.nonAssessment,
            isCombined: !!options.combined,
            fixed: !!options.combined || !!(demand.nonAssessment && demand.fixedDay && demand.fixedSlot && !demand._fixedPlaced),
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
                const teacherSlotKey = `${this.normalizeTeacherName(demand.name)}__${slotId}`;
                if (!this.teacherDaySlotIndex) this.teacherDaySlotIndex = Object.create(null);
                if (!this.teacherDaySlotIndex[teacherSlotKey]) {
                    this.teacherDaySlotIndex[teacherSlotKey] = true;
                    this.teacherDayLoadIndex[teacherKey] = (this.teacherDayLoadIndex[teacherKey] || 0) + 1;
                }
            }
        }
        return cell;
    },

    rebuildDayLoadIndexes: function () {
        this.classSubjectDayIndex = Object.create(null);
        this.teacherDayLoadIndex = Object.create(null);
        this.teacherDaySlotIndex = Object.create(null);
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
                    const teacherSlotKey = `${teacher}__${slotId}`;
                    if (!this.teacherDaySlotIndex[teacherSlotKey]) {
                        this.teacherDaySlotIndex[teacherSlotKey] = true;
                        this.teacherDayLoadIndex[teacherKey] = (this.teacherDayLoadIndex[teacherKey] || 0) + 1;
                    }
                }
            });
        });
    },

    getCombinedGroups: function (rule, pending, options = {}) {
        const groups = new Map();
        pending.filter((demand) => !demand.nonAssessment
            && demand.subject === rule.subject
            && (options.includeFulfilled || demand.remaining > 0)).forEach((demand) => {
            const key = rule.scope === 'all'
                ? `${this.normalizeTeacherName(demand.name)}__${demand.subject}`
                : `${this.normalizeTeacherName(demand.name)}__${demand.subject}__${demand.grade}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(demand);
        });
        return [...groups.entries()].filter(([, demands]) => demands.length > 1);
    },

    applyCombinedRules: function (pending, allSlots, teacherBusyMap, options = {}) {
        this.rules.combined.forEach((rule) => {
            if (options.deferEveningThird && rule.slot === 'eve_3') return;
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

    applyEveningThirdCombinedRules: function (pending, allSlots, teacherBusyMap) {
        this.rules.combined.filter((rule) => rule.slot === 'eve_3').forEach((rule) => {
            // 第三节合堂不消耗正常课时，因此即使这些需求已排满，仍需根据前两节
            // 的实际授课安排生成合堂监督单元。
            this.getCombinedGroups(rule, pending, { includeFulfilled: true }).forEach(([groupId, demands]) => {
                const subject = String(rule.subject || '').replace(/\(合\)$/, '');
                const teacher = this.normalizeTeacherName(demands[0]?.name);
                if (!teacher) return;
                const subjectAt = (className, day, period) => {
                    const cell = this.schedule[className]?.[`d${day}_eve_${period}`];
                    return cell
                        && this.normalizeTeacherName(cell.teacher) === teacher
                        && String(cell.subject || '').replace(/\(合\)$/, '') === subject;
                };
                const frontPairs = [];
                for (let left = 0; left < demands.length; left += 1) {
                    for (let right = left + 1; right < demands.length; right += 1) {
                        const firstDemand = demands[left];
                        const secondDemand = demands[right];
                        if (!this.areAdjacentClasses(firstDemand.className, secondDemand.className)) continue;
                        for (let day = 1; day <= 5; day += 1) {
                            const forward = subjectAt(firstDemand.className, day, 1) && subjectAt(secondDemand.className, day, 2);
                            const reverse = subjectAt(firstDemand.className, day, 2) && subjectAt(secondDemand.className, day, 1);
                            if (forward || reverse) frontPairs.push({ day, demands: [firstDemand, secondDemand] });
                        }
                    }
                }
                frontPairs.sort((left, right) => left.day - right.day || left.demands[0].className.localeCompare(right.demands[0].className, 'zh-CN', { numeric: true }));
                frontPairs.forEach(({ day, demands: pair }) => {
                    const slot = allSlots.find((item) => item.day === day && item.type === 'eve' && item.period === 3 && !this.isGloballyClosedSlot(item));
                    if (!slot || teacherBusyMap[`${teacher}_${slot.id}`] || this.isTeacherBusyInOtherClass(teacher, slot.id)) return;
                    const canCombine = pair.every((demand) => {
                        const classSchedule = this.schedule[demand.className] || {};
                        return !classSchedule[slot.id] && !this.isDemandBlocked(demand, slot.id)
                            && (!demand.venue || !this.isVenueBusyInOtherClass(demand.venue, slot.id));
                    });
                    if (!canCombine) return;
                    const slotId = slot.id;
                    pair.forEach((demand) => {
                        this.placeDemand(demand, slotId, { combined: true, groupId: `${groupId}__${day}` });
                        // 合堂监督不计入每班正常周课时，故不修改 demand.remaining。
                    });
                    this.markTeacherBusy(teacher, slotId);
                    pair.map((demand) => demand.venue).filter(Boolean)
                        .forEach((venue) => this.markVenueBusy(venue, slotId));
                });
            });
        });
    },

    getClassSubjectDayCount: function (className, subject, day) {
        if (this.classSubjectDayIndex) return this.classSubjectDayIndex[`${className}__${subject}__${day}`] || 0;
        return Object.entries(this.schedule[className] || {}).filter(([slotId, cell]) => (
            slotId.startsWith(`d${day}_`) && cell && cell.subject === subject
        )).length;
    },

    // 同一班同一科不应在周一到周五每天都落在同一个节次；这里把“节次位置”
    // 作为独立的软约束。它不会破坏作文连堂、晚自习第三节合堂等硬规则，
    // 但会让算法优先选择本周尚未使用过的时段。
    getClassSubjectPeriodRepeatCount: function (demand, slot) {
        if (!demand || !slot) return 0;
        const subject = String(demand.subject || '').replace(/\(合\)$/, '').trim();
        return Object.entries(this.schedule[demand.className] || {}).filter(([slotId, cell]) => {
            const match = String(slotId).match(/^d(\d+)_(am|pm|eve)_(\d+)$/);
            if (!match || !cell) return false;
            return String(cell.subject || '').replace(/\(合\)$/, '').trim() === subject
                && match[2] === String(slot.type)
                && Number(match[3]) === Number(slot.period);
        }).length;
    },

    getTeacherSubjectPeriodRepeatCount: function (demand, slot) {
        if (!demand || !slot) return 0;
        const teacher = this.normalizeTeacherName(demand.name);
        const subject = String(demand.subject || '').replace(/\(合\)$/, '').trim();
        let count = 0;
        this.classes.forEach((className) => {
            Object.entries(this.schedule[className] || {}).forEach(([slotId, cell]) => {
                const match = String(slotId).match(/^d(\d+)_(am|pm|eve)_(\d+)$/);
                if (!match || !cell) return;
                if (this.normalizeTeacherName(cell.teacher) !== teacher) return;
                if (String(cell.subject || '').replace(/\(合\)$/, '').trim() !== subject) return;
                if (match[2] === String(slot.type) && Number(match[3]) === Number(slot.period)) count += 1;
            });
        });
        return count;
    },

    getSubjectTimeDistributionScore: function (demand, slot) {
        const weights = this.rules.teacherBlocks || {};
        const classRepeats = this.getClassSubjectPeriodRepeatCount(demand, slot);
        const teacherRepeats = this.getTeacherSubjectPeriodRepeatCount(demand, slot);
        const periodKey = `${slot.type}_${slot.period}`;
        const usedPeriods = new Set();
        Object.entries(this.schedule[demand.className] || {}).forEach(([slotId, cell]) => {
            const match = String(slotId).match(/^d(\d+)_(am|pm|eve)_(\d+)$/);
            if (!match || !cell) return;
            if (String(cell.subject || '').replace(/\(合\)$/, '').trim() !== String(demand.subject || '').replace(/\(合\)$/, '').trim()) return;
            usedPeriods.add(`${match[2]}_${match[3]}`);
        });
        const variety = usedPeriods.has(periodKey) ? 0 : Number(weights.newPeriodVarietyWeight || 18);
        return variety
            - classRepeats * Number(weights.classSubjectPeriodRepeatWeight || 220)
            - teacherRepeats * Number(weights.teacherSubjectPeriodRepeatWeight || 54);
    },

    getTeacherSubjectSlots: function (teacherName, subject, schedule = this.schedule) {
        const teacher = this.normalizeTeacherName(teacherName);
        const normalizedSubject = String(subject || '').replace(/\(合\)$/, '');
        const slots = [];
        this.classes.forEach((className) => {
            Object.entries(schedule?.[className] || {}).forEach(([slotId, cell]) => {
                if (slotId.startsWith('_') || !cell) return;
                if (this.normalizeTeacherName(cell.teacher) !== teacher) return;
                if (String(cell.subject || '').replace(/\(合\)$/, '') !== normalizedSubject) return;
                const match = slotId.match(/^d(\d+)_(am|pm|eve)_(\d+)$/);
                if (match) slots.push({ id: slotId, day: Number(match[1]), type: match[2], period: Number(match[3]), className });
            });
        });
        return slots;
    },

    getTeacherSubjectBlockScore: function (demand, slot) {
        const weights = this.rules.teacherBlocks || {};
        if (weights.enabled === false) return 0;
        const existing = this.getTeacherSubjectSlots(demand.name, demand.subject);
        if (!existing.length) return 0;
        const sameDay = existing.filter((item) => item.day === slot.day);
        const sameSession = sameDay.filter((item) => item.type === slot.type);
        const adjacent = existing.filter((item) => item.day === slot.day && item.type === slot.type
            && Math.abs(item.period - slot.period) === 1).length;
        const adjacentClass = existing.filter((item) => item.day === slot.day && item.type === slot.type
            && Math.abs(item.period - slot.period) === 1 && this.areAdjacentClasses(item.className, demand.className)).length;
        const sameDayCount = sameDay.length;
        const sameSessionCount = sameSession.length;
        return adjacent * Number(weights.consecutiveWeight || 0)
            + adjacentClass * Number(weights.adjacentClassWeight || 160)
            + sameSessionCount * Number(weights.sameSessionWeight || 0)
            + sameDayCount * Number(weights.sameDayWeight || 0);
    },

    getClassSubjectBalanceScore: function (demand, slot) {
        const weights = this.rules.teacherBlocks || {};
        const count = this.getClassSubjectDayCount(demand.className, demand.subject, slot.day);
        const daysWithSubject = new Set();
        Object.entries(this.schedule[demand.className] || {}).forEach(([slotId, cell]) => {
            if (slotId.startsWith('_') || !cell) return;
            if (String(cell.subject || '').replace(/\(合\)$/, '') !== String(demand.subject || '')) return;
            const match = slotId.match(/^d(\d+)_/);
            if (match) daysWithSubject.add(Number(match[1]));
        });
        // 新的一天优先；同一天出现第二节及以上时明显扣分，避免把一个班的同科堆在一天。
        const spreadBonus = daysWithSubject.has(slot.day) ? 0 : 24;
        return spreadBonus - count * Number(weights.classSubjectBalanceWeight || 0);
    },

    getTeacherSubjectDayBalanceScore: function (demand, slot) {
        if (!demand || !slot) return 0;
        const teacher = this.normalizeTeacherName(demand.name);
        const subject = String(demand.subject || '').replace(/\(合\)$/, '').trim();
        const grade = String(demand.grade || this.inferGradeFromClass(demand.className) || '');
        const peers = [...new Set(this.demands
            .filter((item) => !item.nonAssessment
                && this.normalizeTeacherName(item.name) === teacher
                && String(item.subject || '').replace(/\(合\)$/, '').trim() === subject
                && String(item.grade || this.inferGradeFromClass(item.className) || '') === grade)
            .map((item) => item.className))];
        if (peers.length < 2) return 0;
        const countForClass = (className) => Object.entries(this.schedule[className] || {}).filter(([slotId, cell]) => {
            if (!slotId.startsWith(`d${slot.day}_`) || !cell || this.isNonTeachingHourCombinedCell(cell, slotId)) return false;
            return this.normalizeTeacherName(cell.teacher) === teacher
                && String(cell.subject || '').replace(/\(合\)$/, '').trim() === subject;
        }).length;
        const projected = countForClass(demand.className) + 1;
        const peerCounts = peers.filter((className) => className !== demand.className).map(countForClass);
        if (!peerCounts.length) return 0;
        const peerAverage = peerCounts.reduce((sum, count) => sum + count, 0) / peerCounts.length;
        const balanceWeight = Number(this.rules.teacherBlocks?.teacherSubjectDayBalanceWeight || 96);
        return -Math.abs(projected - peerAverage) * balanceWeight;
    },

    getTeacherScheduleQualityScore: function (demand, slot) {
        const weights = this.rules.teacherBlocks || {};
        const block = this.getTeacherSubjectBlockScore(demand, slot);
        const balance = this.getClassSubjectBalanceScore(demand, slot);
        const timeDistribution = this.getSubjectTimeDistributionScore(demand, slot);
        const teacherDayPenalty = this.getTeacherDayLoad(demand.name, slot.day) * Number(weights.teacherDayLoadWeight || 0);
        return block + balance + timeDistribution - teacherDayPenalty
            + this.getTeacherSubjectDayBalanceScore(demand, slot)
            + this.getSoftBusyScore(demand.name, slot)
            + this.getEveningPreferenceScore(demand, slot);
    },

    getSoftBusyScore: function (teacherName, slot) {
        const teacher = this.normalizeTeacherName(teacherName);
        if (!teacher || !slot) return 0;
        const blocked = (this.rules.softBusy || []).some((rule) => {
            if (String(rule.day) !== String(slot.day) || this.normalizeTeacherName(rule.name) !== teacher) return false;
            return this.parseBusySlots(rule.day, rule.slotsStr, this.getSlotConfig().am, this.getSlotConfig().pm, this.getSlotConfig().eve).includes(slot.id);
        });
        return blocked ? -180 : 0;
    },

    getEveningPreferenceScore: function (demand, slot) {
        if (!slot || slot.type !== 'eve') return 0;
        const subject = String(demand?.subject || '').replace(/\(合\)$/, '');
        const core = new Set(['语文', '数学', '英语']);
        const existing = Object.entries(this.schedule[demand.className] || {})
            .filter(([slotId, cell]) => slotId.startsWith('d') && cell && String(cell.subject || '').replace(/\(合\)$/, '') === subject)
            .map(([slotId]) => slotId.match(/^d(\d+)_eve_/))
            .filter(Boolean)
            .map((match) => Number(match[1]));
        const days = new Set(existing);
        let score = days.has(slot.day) ? 70 : 0;
        if (!days.has(slot.day) && days.size >= 2) score -= 260;
        if (core.has(subject) && days.has(slot.day - 1)) score -= 140;
        if (core.has(subject) && slot.day > 4) score -= 120;
        const sameSessionSubject = Object.entries(this.schedule[demand.className] || {})
            .some(([slotId, cell]) => slotId.startsWith(`d${slot.day}_eve_`)
                && cell && String(cell.subject || '').replace(/\(合\)$/, '') === subject);
        if (sameSessionSubject) score += 90;
        const adjacentClassBlock = this.classes.some((className) => this.areAdjacentClasses(className, demand.className)
            && [1, 2].some((period) => {
                const cell = this.schedule[className]?.[`d${slot.day}_eve_${period}`];
                return cell && String(cell.subject || '').replace(/\(合\)$/, '') === subject
                    && this.normalizeTeacherName(cell.teacher) === this.normalizeTeacherName(demand.name);
            }));
        if (adjacentClassBlock && slot.period <= 2) score += 220;
        if (slot.period === 2) {
            const frontSubject = Object.values(this.schedule).some((classSchedule) => {
                const cell = classSchedule?.[`d${slot.day}_eve_1`];
                return cell && String(cell.subject || '').replace(/\(合\)$/, '') === subject;
            });
            if (frontSubject) score += 180;
        }
        if (slot.period === 3) {
            const frontSubject = Object.values(this.schedule).some((classSchedule) => [1, 2].some((period) => {
                const cell = classSchedule?.[`d${slot.day}_eve_${period}`];
                return cell && String(cell.subject || '').replace(/\(合\)$/, '') === subject;
            }));
            score += frontSubject ? 260 : -220;
        }
        return score;
    },

    applyConsecutivePairRules: function (pending, allSlots, teacherBusyMap) {
        (this.rules.pairs || []).forEach((rule) => {
            const targets = pending.filter((demand) => demand.remaining >= 2
                && demand.subject === rule.subject
                && this.getScopeClasses(rule.scope).includes(demand.className));
            targets.forEach((demand) => {
                const candidates = allSlots.filter((slot) => slot.type === rule.session)
                    .map((slot) => {
                        const next = allSlots.find((item) => item.day === slot.day && item.type === slot.type && item.period === slot.period + 1);
                        return next ? [slot, next] : null;
                    })
                    .filter(Boolean)
                    .filter(([first, second]) => this.canPlaceDemand(demand, first, teacherBusyMap) && this.canPlaceDemand(demand, second, teacherBusyMap));
                candidates.sort((left, right) => {
                    const leftScore = this.getTeacherScheduleQualityScore(demand, left[0]) + this.getTeacherScheduleQualityScore(demand, left[1]);
                    const rightScore = this.getTeacherScheduleQualityScore(demand, right[0]) + this.getTeacherScheduleQualityScore(demand, right[1]);
                    return rightScore - leftScore || left[0].id.localeCompare(right[0].id);
                });
                const pair = candidates[0];
                if (!pair) return;
                pair.forEach((slot) => {
                    this.placeDemand(demand, slot.id);
                    this.markTeacherBusy(demand.name, slot.id);
                    if (demand.venue) this.markVenueBusy(demand.venue, slot.id);
                    demand.remaining -= 1;
                });
            });
        });
    },

    getTeacherBlockStats: function () {
        const stats = { teacherSubjectGroups: 0, consecutiveLinks: 0, sameSessionLinks: 0, sameDayGroups: 0 };
        const groups = new Map();
        this.classes.forEach((className) => {
            Object.entries(this.schedule[className] || {}).forEach(([slotId, cell]) => {
                if (slotId.startsWith('_') || !cell || !cell.teacher || cell.teacher === '-') return;
                const match = slotId.match(/^d(\d+)_(am|pm|eve)_(\d+)$/);
                if (!match) return;
                const key = `${this.normalizeTeacherName(cell.teacher)}__${String(cell.subject || '').replace(/\(合\)$/, '')}`;
                if (!groups.has(key)) groups.set(key, []);
                groups.get(key).push({ day: Number(match[1]), type: match[2], period: Number(match[3]) });
            });
        });
        groups.forEach((slots) => {
            if (slots.length < 2) return;
            stats.teacherSubjectGroups += 1;
            const days = new Set(slots.map((slot) => slot.day));
            if (days.size < slots.length) stats.sameDayGroups += 1;
            const bySession = new Map();
            slots.forEach((slot) => {
                const key = `${slot.day}__${slot.type}`;
                if (!bySession.has(key)) bySession.set(key, []);
                bySession.get(key).push(slot.period);
            });
            bySession.forEach((periods) => {
                if (periods.length > 1) stats.sameSessionLinks += periods.length - 1;
                periods.sort((a, b) => a - b).forEach((period, index) => {
                    if (index && period === periods[index - 1] + 1) stats.consecutiveLinks += 1;
                });
            });
        });
        return stats;
    },

    findBestSlotForDemand: function (demand, allSlots, teacherBusyMap) {
        const fixedDay = Number(demand.fixedDay || 0);
        const fixedSlot = this.normalizeSlotCode(demand.fixedSlot || '');
        const fixedPending = !!demand.nonAssessment && fixedDay > 0 && fixedSlot && !demand._fixedPlaced;
        const candidates = allSlots.filter((slot) => {
            if (fixedPending && (slot.day !== fixedDay || slot.id.replace(/^d\d+_/, '') !== fixedSlot)) return false;
            if (demand.nonAssessment && demand.fixedDay && !demand.fixedSlot && slot.day !== Number(demand.fixedDay)) return false;
            if (demand.nonAssessment && demand.fixedSlot && !demand.fixedDay && slot.id.replace(/^d\d+_/, '') !== fixedSlot) return false;
            return this.canPlaceDemand(demand, slot, teacherBusyMap);
        });
        candidates.sort((left, right) => {
            const qualityDiff = this.getTeacherScheduleQualityScore(demand, right)
                - this.getTeacherScheduleQualityScore(demand, left);
            if (qualityDiff) return qualityDiff;
            const subjectSpread = this.getClassSubjectDayCount(demand.className, demand.subject, left.day)
                - this.getClassSubjectDayCount(demand.className, demand.subject, right.day);
            if (subjectSpread) return subjectSpread;
            const teacherLoad = this.getTeacherDayLoad(demand.name, left.day) - this.getTeacherDayLoad(demand.name, right.day);
            if (teacherLoad) return teacherLoad;
            return left.id.localeCompare(right.id);
        });
        return candidates[0] || null;
    },

    // 将已排课单元转换为可再次校验的 demand 结构。
    // 这是局部换位/增广链使用的内部辅助，不改变原始课时需求。
    getScheduledCellDemand: function (className, cell) {
        if (!cell || !cell.subject || cell.subject === '🚫 无课' || cell.subject === '班会') return null;
        return {
            className,
            name: this.normalizeTeacherName(cell.teacher),
            subject: String(cell.subject || '').replace(/\(合\)$/, '').trim(),
            venue: cell.venue || '',
            nonAssessment: !!cell.nonAssessment
        };
    },

    isMovableScheduleCell: function (cell) {
        return !!cell && !cell.fixed && !cell.locked && !cell.isCombined
            && !!cell.teacher && cell.teacher !== '-'
            && cell.subject !== '🚫 无课' && cell.subject !== '班会';
    },

    // 尝试把一个已排课单元移动到其它位置；如果候选位置被另一个可移动单元占用，
    // 则递归尝试继续移动后者，形成有限深度的增广链。每次失败都恢复完整课表，
    // 因而不会留下半成品或破坏教师/场地索引。
    tryRelocateScheduleCell: function (className, oldSlotId, cell, allSlots, teacherBusyMap, depth, forbiddenSlotIds) {
        if (!this.isMovableScheduleCell(cell) || depth < 0) return false;
        const demand = this.getScheduledCellDemand(className, cell);
        if (!demand) return false;
        const forbidden = new Set(forbiddenSlotIds || []);
        forbidden.add(oldSlotId);
        const snapshot = JSON.stringify(this.schedule);
        delete (this.schedule[className] || {})[oldSlotId];
        this.rebuildTeacherSlotIndex();
        this.rebuildVenueSlotIndex();
        this.rebuildDayLoadIndexes();

        const candidates = allSlots.filter((slot) => (
            !forbidden.has(slot.id)
            && !this.isGloballyClosedSlot(slot)
            && !(String(demand.subject || '').trim() === '体育' && slot.type === 'eve')
            && !this.isDemandBlocked(demand, slot.id)
        ));
        candidates.sort((left, right) => (
            this.getTeacherScheduleQualityScore(demand, right)
            - this.getTeacherScheduleQualityScore(demand, left)
            || left.id.localeCompare(right.id)
        ));

        for (const slot of candidates) {
            const branchSnapshot = JSON.stringify(this.schedule);
            const occupant = this.schedule[className]?.[slot.id];
            if (occupant) {
                if (depth <= 0 || !this.isMovableScheduleCell(occupant)) continue;
                if (!this.tryRelocateScheduleCell(className, slot.id, occupant, allSlots, teacherBusyMap, depth - 1, [...forbidden, slot.id])) {
                    continue;
                }
            }
            if (this.canPlaceDemand(demand, slot, teacherBusyMap)) {
                this.placeDemand(demand, slot.id);
                this.rebuildTeacherSlotIndex();
                this.rebuildVenueSlotIndex();
                this.rebuildDayLoadIndexes();
                return true;
            }
            this.schedule = JSON.parse(branchSnapshot);
            this.rebuildTeacherSlotIndex();
            this.rebuildVenueSlotIndex();
            this.rebuildDayLoadIndexes();
        }

        this.schedule = JSON.parse(snapshot);
        this.rebuildTeacherSlotIndex();
        this.rebuildVenueSlotIndex();
        this.rebuildDayLoadIndexes();
        return false;
    },

    // 贪心排课在强约束较多时可能把某个班的最后一节课“挤”掉。
    // 这里做有限深度局部换位/增广链，并重新通过全部硬约束校验，
    // 不放宽体育晚自习、禁排、教师撞课等规则。
    repairUnfilledDemand: function (demand, allSlots, teacherBusyMap) {
        if (!demand || demand.remaining <= 0) return false;
        const baseCandidates = allSlots.filter((slot) => {
            const classSchedule = this.schedule[demand.className] || {};
            if (this.isGloballyClosedSlot(slot)) return false;
            if (String(demand.subject || '').replace(/\(合\)$/, '').trim() === '体育' && slot.type === 'eve') return false;
            if (classSchedule[slot.id] || this.isDemandBlocked(demand, slot.id)) return false;
            if (this.isEveningThirdReserved(demand, slot)) return false;
            if (teacherBusyMap[`${this.normalizeTeacherName(demand.name)}_${slot.id}`]) return false;
            if (this.isTeacherBusyInOtherClass(demand.name, slot.id)) return false;
            if (demand.venue && this.isVenueBusyInOtherClass(demand.venue, slot.id)) return false;
            return true;
        });
        for (const target of baseCandidates) {
            const classSchedule = this.schedule[demand.className] || {};
            const subject = String(demand.subject || '').replace(/\(合\)$/, '').trim();
            const adjacentIds = [target.period - 1, target.period + 1]
                .filter((period) => period >= 1)
                .map((period) => `d${target.day}_${target.type}_${period}`)
                .filter((slotId) => {
                    const cell = classSchedule[slotId];
                    return cell && String(cell.subject || '').replace(/\(合\)$/, '').trim() === subject;
                });
            if (!adjacentIds.length) continue;

            // 一次先尝试移动一个相邻同科单元；如两侧均冲突则分别尝试。
            for (const blockerId of adjacentIds) {
                const currentClassSchedule = this.schedule[demand.className] || {};
                const blocker = currentClassSchedule[blockerId];
                if (!this.isMovableScheduleCell(blocker)) continue;
                const snapshot = JSON.stringify(this.schedule);
                delete currentClassSchedule[blockerId];
                this.rebuildTeacherSlotIndex();
                this.rebuildVenueSlotIndex();
                this.rebuildDayLoadIndexes();
                const canPlaceTarget = this.canPlaceDemand(demand, target, teacherBusyMap);
                const relocated = canPlaceTarget && this.tryRelocateScheduleCell(
                    demand.className,
                    blockerId,
                    blocker,
                    allSlots,
                    teacherBusyMap,
                    3,
                    [target.id, blockerId]
                );
                if (relocated) {
                    this.placeDemand(demand, target.id);
                    this.markTeacherBusy(demand.name, target.id);
                    if (demand.venue) this.markVenueBusy(demand.venue, target.id);
                    this.rebuildTeacherSlotIndex();
                    this.rebuildVenueSlotIndex();
                    this.rebuildDayLoadIndexes();
                    demand.remaining -= 1;
                    return true;
                }
                this.schedule = JSON.parse(snapshot);
                this.rebuildTeacherSlotIndex();
                this.rebuildVenueSlotIndex();
                this.rebuildDayLoadIndexes();
            }
        }
        return false;
    },

    repairUnfilledDemands: function (pending, allSlots, teacherBusyMap) {
        let repaired = 0;
        for (let pass = 0; pass < 3; pass += 1) {
            let changed = false;
            pending.filter((demand) => demand.remaining > 0).forEach((demand) => {
                if (this.repairUnfilledDemand(demand, allSlots, teacherBusyMap)) {
                    repaired += 1;
                    changed = true;
                }
            });
            if (!changed) break;
        }
        return repaired;
    },

    getTeacherDayLoad: function (teacherName, day) {
        const teacher = this.normalizeTeacherName(teacherName);
        if (this.teacherDayLoadIndex) return this.teacherDayLoadIndex[`${teacher}__${day}`] || 0;
        const slots = new Set();
        this.classes.forEach((className) => {
            Object.entries(this.schedule[className] || {}).forEach(([slotId, cell]) => {
                if (slotId.startsWith(`d${day}_`) && this.normalizeTeacherName(cell?.teacher) === teacher) slots.add(slotId);
            });
        });
        return slots.size;
    },

    run: function () {
        if (!this.demands.length) return window.UI.alert("请先导入教师任课数据，或先添加手动非考核科目/项目");
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
                this._reserveEveningThird = true;
                const pending = this.demands.map((demand) => ({
                    ...demand,
                    remaining: Math.max(0, Number(demand.weeklyHours) - this.countDemandLessons(demand))
                }));

                this.applyConsecutivePairRules(pending, allSlots, teacherBusyMap);
                this.applyCombinedRules(pending, allSlots, teacherBusyMap, { deferEveningThird: true });
                const crossGradeNames = new Set(this.getCrossGradeTeachers().map((item) => item.name));
                const teacherSubjectTotals = new Map();
                pending.forEach((demand) => {
                    const key = `${this.normalizeTeacherName(demand.name)}__${demand.subject}`;
                    teacherSubjectTotals.set(key, (teacherSubjectTotals.get(key) || 0) + Number(demand.remaining || 0));
                });
                pending.sort((left, right) => {
                    const fixedDiff = Number(!!right.nonAssessment && (right.fixedDay || right.fixedSlot)) - Number(!!left.nonAssessment && (left.fixedDay || left.fixedSlot));
                    if (fixedDiff) return fixedDiff;
                    const crossDiff = Number(crossGradeNames.has(this.normalizeTeacherName(right.name))) - Number(crossGradeNames.has(this.normalizeTeacherName(left.name)));
                    const leftGroup = teacherSubjectTotals.get(`${this.normalizeTeacherName(left.name)}__${left.subject}`) || 0;
                    const rightGroup = teacherSubjectTotals.get(`${this.normalizeTeacherName(right.name)}__${right.subject}`) || 0;
                    return crossDiff || rightGroup - leftGroup || right.remaining - left.remaining
                        || this.normalizeTeacherName(left.name).localeCompare(this.normalizeTeacherName(right.name), 'zh-CN')
                        || String(left.subject).localeCompare(String(right.subject), 'zh-CN')
                        || left.className.localeCompare(right.className, 'zh-CN', { numeric: true });
                });
                pending.forEach((demand) => {
                    while (demand.remaining > 0) {
                        const slot = this.findBestSlotForDemand(demand, allSlots, teacherBusyMap);
                        if (!slot) break;
                        this.placeDemand(demand, slot.id);
                        this.markTeacherBusy(demand.name, slot.id);
                        if (demand.venue) this.markVenueBusy(demand.venue, slot.id);
                        if (demand.nonAssessment && demand.fixedDay && demand.fixedSlot && !demand._fixedPlaced) demand._fixedPlaced = true;
                        demand.remaining -= 1;
                    }
                });

                // 晚自习第三节只从前两节已出现的科目中选取合堂；没有形成前置科目时，留到最后普通排课兜底。
                this._reserveEveningThird = false;
                this.applyEveningThirdCombinedRules(pending, allSlots, teacherBusyMap);
                pending.forEach((demand) => {
                    while (demand.remaining > 0) {
                        const slot = this.findBestSlotForDemand(demand, allSlots, teacherBusyMap);
                        if (!slot) break;
                        this.placeDemand(demand, slot.id);
                        this.markTeacherBusy(demand.name, slot.id);
                        if (demand.venue) this.markVenueBusy(demand.venue, slot.id);
                        if (demand.nonAssessment && demand.fixedDay && demand.fixedSlot && !demand._fixedPlaced) demand._fixedPlaced = true;
                        demand.remaining -= 1;
                    }
                });

                // 最后一轮局部换位，修复贪心顺序造成的少量遗漏课时。
                this.repairUnfilledDemands(pending, allSlots, teacherBusyMap);

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

        const classSubjectPeriodRepeats = [];
        const teacherSubjectPeriodRepeats = [];
        const teacherSubjectPeriodMap = new Map();
        this.classes.forEach((className) => {
            const classMap = new Map();
            Object.entries(this.schedule[className] || {}).forEach(([slotId, cell]) => {
                const match = slotId.match(/^d(\d+)_(am|pm|eve)_(\d+)$/);
                if (!match || !cell || !cell.subject || cell.subject === '🚫 无课') return;
                const subject = String(cell.subject).replace(/\(合\)$/, '').trim();
                if (!subject) return;
                const slotKey = `${subject}__${match[2]}__${match[3]}`;
                if (!classMap.has(slotKey)) classMap.set(slotKey, { subject, type: match[2], period: Number(match[3]), days: [] });
                classMap.get(slotKey).days.push(Number(match[1]));
                const teacher = String(cell.teacher || '').replace(/\([^)]*\)/g, '').trim();
                if (teacher && teacher !== '-') {
                    const teacherKey = `${teacher}__${subject}__${match[2]}__${match[3]}`;
                    if (!teacherSubjectPeriodMap.has(teacherKey)) teacherSubjectPeriodMap.set(teacherKey, { teacher, subject, type: match[2], period: Number(match[3]), classes: [], days: new Set() });
                    const teacherRepeat = teacherSubjectPeriodMap.get(teacherKey);
                    teacherRepeat.classes.push(className);
                    teacherRepeat.days.add(Number(match[1]));
                }
            });
            classMap.forEach((item) => {
                if (item.days.length > 1) classSubjectPeriodRepeats.push({ class: className, ...item, count: item.days.length });
            });
        });
        teacherSubjectPeriodMap.forEach((item) => {
            // 同一教师同一科在同一节次跨多个日期出现时，提示检查是否过于机械；
            // 同一天的相邻班连续授课不会触发，因为教师同一时段不可同时占用。
            const distinctDays = [...item.days].sort((a, b) => a - b);
            if (distinctDays.length > 1) {
                const { days: _days, ...rest } = item;
                teacherSubjectPeriodRepeats.push({ ...rest, days: distinctDays, count: distinctDays.length });
            }
        });

        const flags = {
            classConsecutiveOver4: classStats.filter(x => x.maxConsecutive >= 4).slice(0, 10),
            teacherConsecutiveOver3: teacherStats.filter(x => x.maxConsecutive >= 3).slice(0, 10),
            classEveningOver2: classStats.filter(x => x.eveningLessons >= 2).slice(0, 10),
            teacherEveningOver2: teacherStats.filter(x => x.eveningLessons >= 2).slice(0, 10),
            classSubjectPeriodRepeats: classSubjectPeriodRepeats.slice(0, 10),
            teacherSubjectPeriodRepeats: teacherSubjectPeriodRepeats.slice(0, 10)
        };

        const result = {
            meta: {
                am, pm, eve,
                classCount: this.classes.length,
                teacherCount: Object.keys(teacherMap).length
            },
            classStats,
            teacherStats,
            classSubjectPeriodRepeats,
            teacherSubjectPeriodRepeats,
            flags
        };
        this._fatigueAnalysisCacheKey = cacheKey;
        this._fatigueAnalysisCache = result;
        return result;
    },

    buildFallbackAuditList: function (analysis) {
        const dayName = d => `周${['一', '二', '三', '四', '五'][d - 1] || d}`;
        const list = [];
        analysis.flags.classSubjectPeriodRepeats.forEach(x => {
            list.push(`班级${x.class} 的${x.subject}在${x.type === 'am' ? '上午' : x.type === 'pm' ? '下午' : '晚自习'}第${x.period}节重复 ${x.count} 天，建议换用不同节次。`);
        });
        analysis.flags.teacherSubjectPeriodRepeats.forEach(x => {
            list.push(`教师${x.teacher} 的${x.subject}在同一${x.type === 'am' ? '上午' : x.type === 'pm' ? '下午' : '晚自习'}第${x.period}节跨 ${x.count} 天重复，建议打散时段。`);
        });
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
            const sessionMatch = p.match(/^(上午|早上|下午|晚|晚自习)(?:第?([1-9]\d*)节?)$/);
            if (sessionMatch) {
                const session = sessionMatch[1];
                const period = Number(sessionMatch[2]);
                const type = /上午|早上/.test(session) ? 'am' : (/下午/.test(session) ? 'pm' : 'eve');
                res.push(`d${day}_${type}_${period}`);
            } else if (p === '上午' || /^am(?:_all)?$/i.test(p)) {
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
                if (slotId.startsWith('_') || !cell || ((!cell.teacher || cell.teacher === '-' || cell.teacher === '班主任') && !cell.venue)) return;
                const teacher = this.normalizeTeacherName(cell.teacher);
                if (teacher) {
                    const teacherKey = `${teacher}__${slotId}`;
                    if (!teacherMap.has(teacherKey)) teacherMap.set(teacherKey, []);
                    teacherMap.get(teacherKey).push({ className, cell });
                }
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
            ? `<strong>${this.escapeHtml(cell.subject)}</strong><span>${cell.nonAssessment ? '非考核手动项目' : this.escapeHtml(cell.teacher || '')}${cell.venue ? ` · ${this.escapeHtml(cell.venue)}` : ''}</span>`
            : '<span class="scheduler-cell-empty">空课</span>';
        return `<button type="button" class="scheduler-cell${selected ? ' is-selected' : ''}${cell?.fixed ? ' is-fixed' : ''}" data-scheduler-slot="${this.escapeHtml(slotId)}" title="${this.escapeHtml(cell?.fixed ? '固定规则时段，不可移动' : `${title}：点击选择/交换`)}" ${cell?.fixed ? 'disabled' : ''}>${content}</button>`;
    },

    getSchedulerSubjects: function () {
        const values = [];
        (this.demands || []).forEach((item) => values.push(item.subject));
        Object.values(this.schedule || {}).forEach((entries) => Object.values(entries || {}).forEach((cell) => {
            if (cell && cell.subject) values.push(String(cell.subject).replace(/\(合\)$/, ''));
        }));
        return [...new Set(values.map((value) => String(value || '').trim()).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));
    },

    getSchedulerTeachers: function () {
        const values = [];
        (this.demands || []).forEach((item) => values.push(item.name));
        Object.values(this.schedule || {}).forEach((entries) => Object.values(entries || {}).forEach((cell) => {
            if (cell && cell.teacher && cell.teacher !== '-') values.push(cell.teacher);
        }));
        return [...new Set(values.map((value) => this.normalizeTeacherName(value)).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));
    },

    compactSubjectLabel: function (subject) {
        const normalized = String(subject || '').replace(/\(合\)$/, '').trim();
        const aliases = {
            '语文': '语', '数学': '数', '英语': '英', '历史': '历', '地理': '地',
            '生物': '生', '政治': '政', '物理': '物', '化学': '化', '体育': '体',
            '班会': '班会', '社团活动': '社团', '🚫 无课': '无课'
        };
        if (aliases[normalized]) return aliases[normalized];
        return normalized.length > 5 ? `${normalized.slice(0, 5)}…` : normalized;
    },

    getCompactCellText: function (className, slotId, subjectFilter = '') {
        const cell = this.schedule[className]?.[slotId];
        if (!cell || !cell.subject) return '';
        const subject = String(cell.subject).replace(/\(合\)$/, '');
        if (subjectFilter && subject !== subjectFilter) return '';
        return this.compactSubjectLabel(subject);
    },

    renderQuickFilters: function () {
        const host = document.getElementById('sch_filter_chips');
        if (!host) return;
        const currentMode = document.getElementById('sch_view_mode')?.value || 'grade';
        const currentTarget = document.getElementById('sch_view_target')?.value || '';
        const subjects = this.getSchedulerSubjects();
        const teachers = this.getSchedulerTeachers();
        const chip = (mode, value, label, active = false) => `<button type="button" class="scheduler-filter-chip${active ? ' is-active' : ''}" data-scheduler-filter="${this.escapeHtml(mode)}" data-scheduler-filter-value="${this.escapeHtml(value)}">${this.escapeHtml(label)}</button>`;
        host.innerHTML = [
            chip('grade', '', '全部班级', currentMode === 'grade'),
            ...subjects.map((subject) => chip('subject', subject, `学科·${subject}`, currentMode === 'subject' && currentTarget === subject)),
            teachers.length ? `<details class="scheduler-filter-teachers"${currentMode === 'teacher' ? ' open' : ''}><summary>教师快速筛选（${teachers.length}）</summary><div class="scheduler-filter-teacher-list">${teachers.map((teacher) => chip('teacher', teacher, teacher, currentMode === 'teacher' && currentTarget === teacher)).join('')}</div></details>` : ''
        ].join('');
    },

    applyViewFilter: function (mode, target = '') {
        const viewMode = document.getElementById('sch_view_mode');
        const viewTarget = document.getElementById('sch_view_target');
        if (viewMode) viewMode.value = mode;
        if (viewTarget && mode === 'grade') viewTarget.value = '';
        if (viewTarget && mode !== 'grade') {
            const options = [...viewTarget.options].map((option) => option.value);
            if (options.includes(target)) viewTarget.value = target;
        }
        this.renderTable();
    },

    renderGradeOverviewTable: function () {
        const table = document.getElementById('sch_table');
        if (!table) return;
        const classes = [...this.classes].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));
        const days = ['周一', '周二', '周三', '周四', '周五'];
        const am = Number(document.getElementById('sch_am_count')?.value || 4);
        const pm = Number(document.getElementById('sch_pm_count')?.value || 4);
        const eve = Number(document.getElementById('sch_eve_count')?.value || 3);
        const totalCols = 2 + days.length * classes.length;
        const row = (values, className = '') => `<tr${className ? ` class="${className}"` : ''}>${values.map((value) => `<td>${value}</td>`).join('')}</tr>`;
        const cellsFor = (slotKey) => days.flatMap((_, dayIndex) => classes.map((className) => {
            const text = this.getCompactCellText(className, `d${dayIndex + 1}_${slotKey}`);
            return text ? `<span class="scheduler-compact-subject">${this.escapeHtml(text)}</span>` : '<span class="scheduler-compact-empty">—</span>';
        }));
        let html = '<thead>';
        html += `<tr><th colspan="${totalCols}" class="scheduler-compact-title">${this.escapeHtml(this.getGradeOverviewTitle())}</th></tr>`;
        html += `<tr><th rowspan="2">时段</th><th rowspan="2">节次</th>${days.map((day) => `<th colspan="${classes.length}">${day}</th>`).join('')}</tr>`;
        html += `<tr>${days.flatMap(() => classes.map((className) => `<th>${this.escapeHtml(className.replace(/^\d+\./, ''))}班</th>`)).join('')}</tr>`;
        html += '</thead><tbody>';
        for (let period = 1; period <= am; period += 1) html += row([`上午`, period, ...cellsFor(`am_${period}`)]);
        html += row(new Array(totalCols).fill(''), 'scheduler-compact-break');
        for (let period = 1; period <= pm; period += 1) html += row([`下午`, period, ...cellsFor(`pm_${period}`)]);
        html += row(new Array(totalCols).fill(''), 'scheduler-compact-break');
        for (let period = 1; period <= eve; period += 1) html += row([`晚自习`, period, ...cellsFor(`eve_${period}`)]);
        html += '</tbody>';
        table.innerHTML = html;
        table.dataset.schedulerRenderSignature = `compact|${this.scheduleRenderVersion}|${classes.join(',')}|${am}|${pm}|${eve}`;
    },

    getGradeOverviewTitle: function () {
        const grades = [...new Set(this.classes.map((className) => this.inferGradeFromClass(className)).filter(Boolean))];
        return `${grades.length === 1 ? `${grades[0]}年级` : '学年联合'}简版总课表（仅显示学科）`;
    },

    renderTable: function () {
        const mode = document.getElementById('sch_view_mode').value;
        let target = document.getElementById('sch_view_target').value;

        // 切换下拉框内容
        const sel = document.getElementById('sch_view_target');
        if (mode === 'grade') {
            if (sel) {
                sel.innerHTML = '<option value="">全部班级</option>';
                sel.value = '';
                sel.disabled = true;
            }
            this.renderQuickFilters();
            this.renderGradeOverviewTable();
            this.updateManualControls();
            return;
        }
        if (sel) sel.disabled = false;
        if (mode === 'teacher') {
            const teachers = this.getSchedulerTeachers();
            if (!teachers.includes(target)) {
                sel.innerHTML = teachers.map(t => `<option value="${this.escapeHtml(t)}">${this.escapeHtml(t)}</option>`).join('');
                target = teachers[0];
            }
        } else if (mode === 'subject') {
            const subjects = this.getSchedulerSubjects();
            if (!subjects.includes(target)) {
                sel.innerHTML = subjects.map(subject => `<option value="${this.escapeHtml(subject)}">${this.escapeHtml(subject)}</option>`).join('');
                target = subjects[0];
            }
        } else {
            if (!this.classes.includes(target)) {
                sel.innerHTML = this.classes.map(c => `<option value="${this.escapeHtml(c)}">${this.escapeHtml(c)}班</option>`).join('');
                target = this.classes[0];
            }
        }
        if (sel && target) sel.value = target;
        this.renderQuickFilters();

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
                    const teacherMatch = mode === 'teacher' && s && this.normalizeTeacherName(s.teacher) === this.normalizeTeacherName(target);
                    const subjectMatch = mode === 'subject' && s && String(s.subject || '').replace(/\(合\)$/, '') === String(target || '');
                    if (teacherMatch || subjectMatch) {
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
        const marker = cell.nonAssessment ? '\n（非考核手动配置）' : '';
        return `${cell.subject}${marker}${teacher}${venue}`;
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

    buildCompactGradeSheet: function (config = this.getSlotConfig()) {
        const classes = [...this.classes].sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }));
        const days = ['周一', '周二', '周三', '周四', '周五'];
        const width = 2 + days.length * classes.length;
        const rows = [];
        rows.push([this.getGradeOverviewTitle()]);
        rows.push(['说明：本页为简版年级总课表，按星期横向列出各班，仅显示学科，不显示教师；原有“联合总课表”“教师总表”等工作表保持不变。']);
        rows.push(['时段', '节次', ...days.flatMap((day) => new Array(classes.length).fill(day))]);
        rows.push(['', '', ...days.flatMap(() => classes.map((className) => `${className.replace(/^\d+\./, '')}班`))]);
        const addPeriodRows = (type, label, count) => {
            for (let period = 1; period <= Number(count || 0); period += 1) {
                rows.push([label, period, ...days.flatMap((_, dayIndex) => classes.map((className) => this.getCompactCellText(className, `d${dayIndex + 1}_${type}_${period}`)))]);
            }
        };
        addPeriodRows('am', '上午', config.am);
        rows.push(['课间操', '', ...new Array(width - 2).fill('')]);
        addPeriodRows('pm', '下午', config.pm);
        rows.push(['午休/晚餐', '', ...new Array(width - 2).fill('')]);
        addPeriodRows('eve', '晚自习', config.eve);

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet['!cols'] = [{ wch: 11 }, { wch: 7 }, ...new Array(width - 2).fill(null).map(() => ({ wch: 7 }))];
        sheet['!rows'] = [{ hpt: 26 }, { hpt: 30 }, { hpt: 22 }, { hpt: 22 }];
        sheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: width - 1 } },
            { s: { r: 1, c: 0 }, e: { r: 1, c: width - 1 } },
            ...days.map((_, index) => ({
                s: { r: 2, c: 2 + index * classes.length },
                e: { r: 2, c: 1 + (index + 1) * classes.length }
            }))
        ];
        const border = { top: { style: 'thin', color: { rgb: 'CBD5E1' } }, bottom: { style: 'thin', color: { rgb: 'CBD5E1' } }, left: { style: 'thin', color: { rgb: 'CBD5E1' } }, right: { style: 'thin', color: { rgb: 'CBD5E1' } } };
        const titleStyle = { font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 }, fill: { fgColor: { rgb: '4F46E5' } }, alignment: { horizontal: 'center', vertical: 'center' }, border };
        const headerStyle = { font: { bold: true, color: { rgb: '1E293B' } }, fill: { fgColor: { rgb: 'E0E7FF' } }, alignment: { horizontal: 'center', vertical: 'center' }, border };
        const noteStyle = { font: { italic: true, color: { rgb: '64748B' }, sz: 10 }, alignment: { horizontal: 'left', vertical: 'center', wrapText: true }, border };
        const bodyStyle = { alignment: { horizontal: 'center', vertical: 'center' }, border };
        const breakStyle = { font: { color: { rgb: '64748B' }, italic: true }, fill: { fgColor: { rgb: 'F1F5F9' } }, alignment: { horizontal: 'center', vertical: 'center' }, border };
        for (let c = 0; c < width; c += 1) {
            const titleCell = sheet[XLSX.utils.encode_cell({ r: 0, c })];
            if (titleCell) titleCell.s = titleStyle;
            const noteCell = sheet[XLSX.utils.encode_cell({ r: 1, c })];
            if (noteCell) noteCell.s = noteStyle;
            for (let r = 2; r < rows.length; r += 1) {
                const cell = sheet[XLSX.utils.encode_cell({ r, c })];
                if (!cell) continue;
                cell.s = (r === 2 || r === 3) ? headerStyle : (rows[r][0] === '课间操' || rows[r][0] === '午休/晚餐' ? breakStyle : bodyStyle);
            }
        }
        return sheet;
    },

    exportResult: function () {
        if (Object.keys(this.schedule).length === 0) return window.UI.alert("暂无课表数据");
        const wb = XLSX.utils.book_new();
        const config = this.getSlotConfig();
        XLSX.utils.book_append_sheet(wb, this.buildCompactGradeSheet(config), '年级简版总课表');
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

        const manualRows = [['科目/项目', '年级', '班级', '每周节数', '固定星期', '固定节次', '场地/资源', '备注', '考核计入']];
        this.demands.filter((demand) => demand.nonAssessment).forEach((demand) => manualRows.push([
            demand.subject || '',
            demand.grade || this.inferGradeFromClass(demand.className),
            `${demand.className}班`,
            Number(demand.weeklyHours) || 0,
            demand.fixedDay ? `周${demand.fixedDay}` : '自动安排',
            demand.fixedSlot ? this.getSlotName(demand.fixedSlot) : '自动安排',
            demand.venue || '',
            demand.note || '',
            '否（非考核手动配置）'
        ]));
        if (manualRows.length > 1) {
            const manualSheet = XLSX.utils.aoa_to_sheet(manualRows);
            manualSheet['!cols'] = [{ wch: 18 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 28 }, { wch: 22 }];
            XLSX.utils.book_append_sheet(wb, manualSheet, '非考核手动项目');
        }

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
                if (action === 'add-manual-demand') this.addManualNonAssessmentDemand();
                if (action === 'clear-manual-demands') this.clearManualNonAssessmentDemands();
                if (action === 'select-all-manual-classes') this.selectAllManualClasses();
                if (action === 'clear-manual-classes') this.clearManualClasses();
                if (action === 'export-result') this.exportResult();
                if (action === 'load-cloud-teachers') this.loadCloudTeachers();
                if (action === 'apply-grade8-preset') this.applyGrade8Preset();
                if (action === 'audit-fatigue') this.auditFatigue();
                if (action === 'download-template') this.downloadTemplate();
                if (action === 'add-constraint-combined') this.addConstraint('combined');
                if (action === 'add-constraint-meeting') this.addConstraint('meeting');
                if (action === 'add-constraint-busy') this.addConstraint('busy');
                if (action === 'add-constraint-activity') this.addConstraint('activity');
                if (action === 'run') this.run();
                return;
            }
            const removeManual = event.target?.closest?.('[data-scheduler-manual-remove]');
            if (removeManual && document.documentElement.contains(removeManual)) {
                this.removeManualNonAssessmentDemand(removeManual.dataset.schedulerManualRemove);
                return;
            }
            const removeConstraint = event.target?.closest?.('[data-scheduler-remove-type][data-scheduler-remove-id]');
            if (removeConstraint && document.documentElement.contains(removeConstraint)) {
                this.removeConstraint(removeConstraint.dataset.schedulerRemoveType, removeConstraint.dataset.schedulerRemoveId);
                return;
            }
            const filter = event.target?.closest?.('[data-scheduler-filter]');
            if (filter && document.documentElement.contains(filter)) {
                this.applyViewFilter(filter.dataset.schedulerFilter, filter.dataset.schedulerFilterValue || '');
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
                if (fileInput.dataset.schedulerFile === 'import-existing') this.importExisting(fileInput);
                if (fileInput.dataset.schedulerFile === 'load-data') this.loadData(fileInput);
                return;
            }
            const select = event.target?.closest?.('[data-scheduler-change]');
            if (!select || !document.documentElement.contains(select)) return;
            if (select.dataset.schedulerChange === 'activity-range') this.onActivityRangeChange(select);
            if (select.dataset.schedulerChange === 'teacher-blocks') {
                this.rules.teacherBlocks.enabled = !!select.checked;
                this.preflight({ silent: true });
            }
            if (select.dataset.schedulerChange === 'friday-pm') {
                const value = document.getElementById('sch_fri_pm_val');
                if (value) value.disabled = !select.checked;
            }
            if (select.dataset.schedulerChange === 'render-table') this.renderTable();
            if (['sch_am_count', 'sch_pm_count', 'sch_eve_count'].includes(select.id)) this.refreshManualSlotOptions();
            if (select.id === 'sch_manual_classes') {
                this.refreshManualClassHours();
                this.updateManualClassSelectionSummary();
            }
        });
        ['sch_am_count', 'sch_pm_count', 'sch_eve_count'].forEach((id) => {
            document.getElementById(id)?.addEventListener('change', () => this.refreshManualSlotOptions());
        });
        document.getElementById('sch_manual_hours')?.addEventListener('input', () => {
            const value = document.getElementById('sch_manual_hours')?.value || '';
            document.querySelectorAll('#sch_manual_class_hours_rows input[data-manual-class-hours]').forEach((input) => {
                if (!String(input.value || '').trim()) input.value = value;
            });
        });
        document.getElementById('sch_manual_classes')?.addEventListener('change', () => {
            this.refreshManualClassHours();
            this.updateManualClassSelectionSummary();
        });
        this.refreshManualSlotOptions();
        this.refreshManualClassHours();
        this.updateManualClassSelectionSummary();
        const fridayPm = document.getElementById('sch_rule_fri_pm');
        const fridayPmValue = document.getElementById('sch_fri_pm_val');
        if (fridayPm && fridayPmValue) fridayPmValue.disabled = !fridayPm.checked;
    }
};

    window.SCHEDULER = SCHEDULER;
    window.GradeSchedulerRuntime = SCHEDULER;
    SCHEDULER.bindDeclarativeHandlers();
    window.__GRADE_SCHEDULER_RUNTIME_PATCHED__ = true;
})();
