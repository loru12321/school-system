(() => {
    if (typeof window === 'undefined' || window.__GRADE_SCHEDULER_RUNTIME_PATCHED__) return;

const SCHEDULER = {
    data: [], // 存储导入的 {teacher, subject, classes:[], hours}
    schedule: {}, // 结果
    classes: [], // 所有班级列表
    maxIterations: 8000,

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
            const slot = document.getElementById('sch_comb_slot').value; // 'eve_3'

            // 查重：同一个学科不能重复添加规则
            if (this.rules.combined.some(r => r.subject === subject)) {
                return alert(`学科 [${subject}] 已存在合堂规则，请勿重复添加。`);
            }

            this.rules.combined.push({ subject, slot, id: Date.now() });
            this.renderTags('combined', this.rules.combined, r => `🔗 ${r.subject} (${this.getSlotName(r.slot)} 合堂)`);
        }
        else if (type === 'meeting') {
            const day = document.getElementById('sch_meet_day').value;
            const slot = document.getElementById('sch_meet_slot').value;
            const key = `${day}_${slot}`;
            if (this.rules.meetings.some(m => `${m.day}_${m.slot}` === key)) return;

            this.rules.meetings.push({ day, slot, id: Date.now() });
            this.renderTags('meeting', this.rules.meetings, m => `周${m.day} ${this.getSlotName(m.slot)} (班会)`);
        }
        else if (type === 'busy') {
            const day = document.getElementById('sch_busy_day').value;
            const name = document.getElementById('sch_busy_name').value.trim();
            const slotsRaw = document.getElementById('sch_busy_slots').value.trim();
            if (!name || !slotsRaw) return alert("请填写教师姓名和节次");

            this.rules.busy.push({ day, slotsStr: slotsRaw, name, id: Date.now() });
            this.renderTags('busy', this.rules.busy, b => `${b.name}: 周${b.day} [${b.slotsStr}] 不排`);
            document.getElementById('sch_busy_name').value = '';
        }
        else if (type === 'activity') {
            const day = document.getElementById('sch_act_day').value;
            const range = document.getElementById('sch_act_range').value;
            const subject = document.getElementById('sch_act_subject').value;
            let labelRange = range === 'pm_all' ? '下午' : (range === 'am_all' ? '上午' : '指定节');

            this.rules.activities.push({ day, range, subject, id: Date.now() });
            this.renderTags('activity', this.rules.activities, a => `周${a.day} ${labelRange} (${a.subject === "ALL" ? "全级无课" : a.subject + "教研"})`);
        }
    },

    removeConstraint: function (type, id) {
        if (type === 'meeting') this.rules.meetings = this.rules.meetings.filter(x => x.id !== id);
        if (type === 'busy') this.rules.busy = this.rules.busy.filter(x => x.id !== id);
        if (type === 'activity') this.rules.activities = this.rules.activities.filter(x => x.id !== id);
        // 🟢 新增 combined 删除
        if (type === 'combined') this.rules.combined = this.rules.combined.filter(x => x.id !== id);

        // 重新渲染对应区域
        if (type === 'meeting') this.renderTags('meeting', this.rules.meetings, m => `周${m.day} ${this.getSlotName(m.slot)} (班会)`);
        if (type === 'busy') this.renderTags('busy', this.rules.busy, b => `${b.name}: 周${b.day} [${b.slotsStr}] 不排`);
        if (type === 'activity') this.renderTags('activity', this.rules.activities, a => `周${a.day} ${a.range} (${a.subject})`);
        // 🟢 新增 combined 渲染
        if (type === 'combined') this.renderTags('combined', this.rules.combined, r => `🔗 ${r.subject} (${this.getSlotName(r.slot)} 合堂)`);
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

    getSlotName: function (code) {
        const map = { 'am': '上午', 'pm': '下午', 'eve': '晚' };
        const parts = code.split('_');
        if (parts.length >= 2) return `${map[parts[0]] || ''}第${parts[parts.length - 1]}节`;
        return code;
    },

    downloadTemplate: function () {
        const data = [
            ['教师姓名', '学科', '任教班级', '周课时量'],
            ['张老师', '语文', '701,702', 12],
            ['李老师', '数学', '701,703', 12],
            ['王老师', '英语', '702,703', 12],
            ['赵老师', '物理', '801,802,803', 9]
        ];
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, '任课模板');
        XLSX.writeFile(wb, '级部排课任课模板.xlsx');
    },

    loadData: async function (input) {
        const file = input && input.files ? input.files[0] : null;
        if (!file) return;
        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            const pick = (row, keys) => {
                for (const key of keys) {
                    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
                        return String(row[key]).trim();
                    }
                }
                return '';
            };

            const merged = {};
            rows.forEach(row => {
                const name = pick(row, ['教师姓名', '教师', '老师', '姓名', 'teacher', 'Teacher']);
                const subject = pick(row, ['学科', '科目', 'subject', 'Subject']);
                const classStr = pick(row, ['任教班级', '班级', '班级列表', 'classes', 'Classes']);
                const hoursStr = pick(row, ['周课时量', '周课时', '课时', 'hours', 'Hours']);

                if (!name || !subject || !classStr) return;
                const classes = classStr.split(/[，,、\s]+/).map(x => x.trim()).filter(Boolean);
                if (!classes.length) return;
                const hours = Math.max(1, parseInt(hoursStr, 10) || classes.length);

                const key = `${name}__${subject}`;
                if (!merged[key]) {
                    merged[key] = { name, subject, classes: [], hours: 0 };
                }
                classes.forEach(c => {
                    if (!merged[key].classes.includes(c)) merged[key].classes.push(c);
                });
                merged[key].hours += hours;
            });

            this.data = Object.values(merged);
            this.classes = [...new Set(this.data.flatMap(item => item.classes))]
                .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));

            const preview = document.getElementById('sch_resource_preview');
            if (!this.data.length) {
                if (preview) preview.innerHTML = '<span style="color:#dc2626;">未识别到有效任课数据，请检查列名与内容。</span>';
                if (window.UI) UI.toast('未识别到有效任课数据', 'warning');
                return;
            }

            if (preview) {
                const top = this.data.slice(0, 8).map(item =>
                    `<div style="padding:4px 0; border-bottom:1px dashed #e2e8f0;">` +
                    `<strong>${item.name}</strong> · ${item.subject} · ${item.classes.join(',')} · ${item.hours}课时` +
                    `</div>`
                ).join('');
                const extra = this.data.length > 8 ? `<div style="padding-top:6px; color:#94a3b8;">...另有 ${this.data.length - 8} 条</div>` : '';
                preview.innerHTML = `<div style="color:#334155;">已导入 ${this.data.length} 条任课记录，覆盖 ${this.classes.length} 个班级。</div>${top}${extra}`;
            }

            const targetSel = document.getElementById('sch_view_target');
            if (targetSel && this.classes.length) {
                targetSel.innerHTML = this.classes.map(c => `<option value="${c}">${c}班</option>`).join('');
            }

            if (window.UI) UI.toast(`✅ 任课数据导入成功（${this.data.length} 条）`, 'success');
        } catch (e) {
            console.error(e);
            alert('导入失败: ' + (e.message || e));
        } finally {
            if (input) input.value = '';
        }
    },

    // --- 核心排课逻辑 (Run) ---
    run: function () {
        if (!this.data.length) return alert("请先导入教师任课数据");

        const btn = document.querySelector('#grade-scheduler .btn-primary');
        btn.innerHTML = '<i class="ti ti-loader"></i> 正在进行多维约束运算...';
        btn.disabled = true;

        setTimeout(() => {
            try {
                // 初始化
                this.schedule = {};
                this.classes.forEach(c => this.schedule[c] = {});

                const days = ['周一', '周二', '周三', '周四', '周五'];
                const am = parseInt(document.getElementById('sch_am_count').value);
                const pm = parseInt(document.getElementById('sch_pm_count').value);
                const eve = parseInt(document.getElementById('sch_eve_count').value);

                // 生成所有时间槽
                const allSlots = [];
                // ... (保持原有的 slot 生成逻辑) ...
                days.forEach((d, dIdx) => {
                    const dayNum = dIdx + 1;
                    for (let i = 1; i <= am; i++) allSlots.push({ id: `d${dayNum}_am_${i}`, day: dayNum, period: i, type: 'am' });
                    for (let i = 1; i <= pm; i++) allSlots.push({ id: `d${dayNum}_pm_${i}`, day: dayNum, period: i, type: 'pm' });
                    for (let i = 1; i <= eve; i++) allSlots.push({ id: `d${dayNum}_eve_${i}`, day: dayNum, period: i, type: 'eve' });
                });
                let queue = JSON.parse(JSON.stringify(this.data))
                    .map(item => ({ ...item, remainingHours: item.hours }))
                    .sort((a, b) => b.hours - a.hours);

                // --- 阶段 A & B (保持不变，略) ---
                // A. 全局封锁 (活动)
                this.rules.activities.forEach(act => {
                    const targetSlots = this.resolveTimeRange(act.day, act.range, am, pm, eve);
                    this.classes.forEach(cls => {
                        targetSlots.forEach(slotId => {
                            if (act.subject === 'ALL') {
                                this.schedule[cls][slotId] = { subject: '🚫 无课', teacher: '-', fixed: true };
                            }
                            if (!this.schedule[cls]._blackList) this.schedule[cls]._blackList = {};
                            if (!this.schedule[cls]._blackList[slotId]) this.schedule[cls]._blackList[slotId] = [];
                            this.schedule[cls]._blackList[slotId].push(act.subject);
                        });
                    });
                });

                // B. 固定班会
                this.rules.meetings.forEach(meet => {
                    const slotId = `d${meet.day}_${meet.slot.replace(/pm|am|eve/, (m) => m + '_')}`; // am_3 -> am_3
                    this.classes.forEach(cls => {
                        if (!this.schedule[cls][slotId]) {
                            this.schedule[cls][slotId] = { subject: '班会', teacher: '班主任', fixed: true };
                        }
                    });
                });

                // 👇👇👇 🟢 [核心修改] 阶段 C: 应用动态合堂课 🟢 👇👇👇
                // 逻辑：遍历用户设置的合堂规则 (例如: 物理 -> eve_3)
                this.rules.combined.forEach(rule => {
                    const targetSubject = rule.subject;
                    const targetSlotSuffix = rule.slot.replace(/pm|am|eve/, (m) => m + '_'); // e.g. "eve_3" -> "eve_3"

                    // 1. 找出所有教该学科且教多个班的老师
                    const eligibleTeachers = queue.filter(t => t.subject === targetSubject && t.classes.length > 1 && t.remainingHours > 0);

                    eligibleTeachers.forEach(t => {
                        // 2. 寻找合适的时间 (周1-5)
                        // 必须保证：该老师的所有班级，在某一天的 targetSlot 都是空的
                        let allocatedDay = -1;

                        // 随机尝试周一到周五 (均衡分布)
                        const tryDays = [1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);

                        for (let dayNum of tryDays) {
                            const fullSlotId = `d${dayNum}_${targetSlotSuffix}`;

                            // 检查所有相关班级是否空闲
                            const allFree = t.classes.every(cls => {
                                const cell = this.schedule[cls]?.[fullSlotId];
                                // 必须没课，且不在黑名单中
                                const notBlocked = !cell && (!this.schedule[cls]._blackList?.[fullSlotId]?.includes(targetSubject));
                                return notBlocked;
                            });

                            // 检查该老师当天该时段是否空闲 (防止和其他合堂撞车)
                            const teacherFree = !this.isTeacherBusyInOtherClass(t.name, fullSlotId);

                            if (allFree && teacherFree) {
                                allocatedDay = dayNum;

                                // 3. 执行锁定
                                t.classes.forEach(cls => {
                                    this.schedule[cls][fullSlotId] = {
                                        subject: t.subject,
                                        teacher: t.name + '(合)',
                                        fixed: true,
                                        isCombined: true
                                    };
                                });

                                // 4. 扣减该老师的待排课时
                                t.remainingHours = Math.max(0, t.remainingHours - 1);

                                break; // 该老师安排完毕，跳出天数循环
                            }
                        }

                        if (allocatedDay === -1) {
                            console.warn(`⚠️ 警告：无法为 ${t.name} (${t.subject}) 安排合堂，所有晚自习时段均冲突。`);
                        }
                    });
                });
                // 👆👆👆 🟢 [修改结束] 🟢 👆👆👆

                // --- 阶段 D: 智能填充 (保持不变) ---
                // ...
                const teacherBusyMap = {};
                this.rules.busy.forEach(b => {
                    const slots = this.parseBusySlots(b.day, b.slotsStr, am, pm, eve);
                    slots.forEach(sid => teacherBusyMap[`${b.name}_${sid}`] = true);
                });

                queue.forEach(t => {
                    let remaining = t.remainingHours;
                    t.classes.forEach(cls => {
                        if (!this.schedule[cls]) return;
                        let placedCount = 0;
                        const shuffledSlots = [...allSlots].sort(() => Math.random() - 0.5);

                        let iter = 0;
                        for (let sObj of shuffledSlots) {
                            iter++;
                            if (iter > this.maxIterations) break;
                            if (remaining <= 0) break;
                            if (placedCount >= Math.ceil(t.hours / t.classes.length)) break;

                            const sid = sObj.id;
                            if (this.schedule[cls][sid]) continue;
                            if (this.schedule[cls]._blackList &&
                                this.schedule[cls]._blackList[sid] &&
                                this.schedule[cls]._blackList[sid].includes(t.subject)) continue;
                            if (teacherBusyMap[`${t.name}_${sid}`]) continue;
                            if (this.isTeacherBusyInOtherClass(t.name, sid)) continue;

                            const isFriEve = (sObj.day === 5 && sObj.type === 'eve' && document.getElementById('sch_rule_fri_eve').checked);
                            if (isFriEve) continue;

                            this.schedule[cls][sid] = { subject: t.subject, teacher: t.name };
                            remaining--;
                            placedCount++;
                        }
                    });
                    t.remainingHours = remaining;
                });

                // 回退机制：检测是否存在未安排的课时
                const hasUnfilled = queue.some(t => t.remainingHours > 0);
                if (hasUnfilled) {
                    UI.toast("⚠️ 部分课时未能安排，已停止优化。请降低约束或重试。", "warning");
                }

                this.renderTable();
                document.getElementById('sch_result_area').classList.remove('hidden');
                UI.toast("✅ 排课完成！已应用所有复杂约束。", "success");

            } catch (e) {
                console.error(e);
                alert("排课运算出错: " + e.message);
            } finally {
                btn.innerHTML = '🚀 开始智能排课';
                btn.disabled = false;
            }
        }, 200);
    },

    // --- 🧠 AI 疲劳审计 ---
    auditFatigue: async function () {
        if (!this.schedule || !this.classes || !this.classes.length) return alert("请先完成排课");
        const area = document.getElementById('sch_audit_area');
        const summaryEl = document.getElementById('sch_audit_summary');
        const listEl = document.getElementById('sch_audit_list');
        if (!area || !summaryEl || !listEl) return;

        area.classList.remove('hidden');
        listEl.innerHTML = '';
        summaryEl.innerText = 'AI 正在分析排课疲劳风险...';

        const analysis = this.buildFatigueAnalysis();

        try {
            const prompt = this.buildFatiguePrompt(analysis);
            const aiText = await callUnifiedAI(prompt);
            const bullets = this.extractAuditBullets(aiText);
            this.renderAuditList(bullets.length ? bullets : [aiText.trim()]);
            summaryEl.innerText = `已完成审计（${analysis.meta.classCount} 个班级 / ${analysis.meta.teacherCount} 位教师）`;
        } catch (e) {
            console.error(e);
            const fallback = this.buildFallbackAuditList(analysis);
            this.renderAuditList(fallback);
            summaryEl.innerText = 'AI 审计失败，已展示规则化风险提示';
        }
    },

    buildFatigueAnalysis: function () {
        const am = parseInt(document.getElementById('sch_am_count').value);
        const pm = parseInt(document.getElementById('sch_pm_count').value);
        const eve = parseInt(document.getElementById('sch_eve_count').value);

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

        return {
            meta: {
                am, pm, eve,
                classCount: this.classes.length,
                teacherCount: Object.keys(teacherMap).length
            },
            classStats,
            teacherStats,
            flags
        };
    },

    buildFatiguePrompt: function (analysis) {
        const dayName = d => `周${['一', '二', '三', '四', '五'][d - 1] || d}`;
        const topClasses = analysis.flags.classConsecutiveOver4
            .map(x => `${x.class}班 ${dayName(x.day)} 连续${x.maxConsecutive}节`).join('；') || '无';
        const topTeachers = analysis.flags.teacherConsecutiveOver3
            .map(x => `${x.teacher} ${dayName(x.day)} 连续${x.maxConsecutive}节`).join('；') || '无';
        const eveClasses = analysis.flags.classEveningOver2
            .map(x => `${x.class}班 ${dayName(x.day)} 晚上${x.eveningLessons}节`).join('；') || '无';
        const eveTeachers = analysis.flags.teacherEveningOver2
            .map(x => `${x.teacher} ${dayName(x.day)} 晚上${x.eveningLessons}节`).join('；') || '无';

        return `你是资深教务专家。请根据以下排课疲劳摘要给出审计要点。\n` +
            `要求：输出 5-8 条要点，每条以“• ”开头，包含具体对象(班级/教师/日期)+风险+改进建议。不要输出代码或Markdown代码块。\n\n` +
            `【摘要】\n` +
            `班级数:${analysis.meta.classCount} 教师数:${analysis.meta.teacherCount} 课时结构: 上午${analysis.meta.am} 下午${analysis.meta.pm} 晚自习${analysis.meta.eve}\n` +
            `连续4节及以上的班级: ${topClasses}\n` +
            `连续3节及以上的教师: ${topTeachers}\n` +
            `单日晚自习≥2节的班级: ${eveClasses}\n` +
            `单日晚自习≥2节的教师: ${eveTeachers}\n`;
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

    extractAuditBullets: function (text) {
        if (!text) return [];
        let cleaned = text.replace(/```[\s\S]*?```/g, '').trim();
        const lines = cleaned.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const bullets = [];
        lines.forEach(l => {
            const item = l.replace(/^[-*•\d\.\)\s]+/g, '').trim();
            if (item) bullets.push(item);
        });
        if (!bullets.length && cleaned) bullets.push(cleaned);
        return bullets.slice(0, 10);
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
            if (/^\d+$/.test(p)) {
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

    isTeacherBusyInOtherClass: function (teacherName, slotId) {
        const normalizedTeacher = String(teacherName || '').replace(/\([^)]*\)/g, '').trim();
        if (!normalizedTeacher) return false;
        for (let cls of this.classes) {
            const cell = this.schedule[cls][slotId];
            const cellTeacher = String(cell?.teacher || '').replace(/\([^)]*\)/g, '').trim();
            if (cellTeacher === normalizedTeacher) return true;
        }
        return false;
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
        const days = ['周一', '周二', '周三', '周四', '周五'];

        let html = `<thead><tr><th style="width:80px;background:#f3f4f6;">节次</th>${days.map(d => `<th>${d}</th>`).join('')}</tr></thead><tbody>`;

        // 辅助：获取单元格
        const getCellHtml = (day, slotStr) => {
            const slotId = `d${day}_${slotStr}`;
            let cellData = null;

            if (mode === 'class') {
                cellData = this.schedule[target]?.[slotId];
                if (!cellData) return '';
                return `<div style="font-weight:bold; color:#1e3a8a;">${cellData.subject}</div><div style="font-size:10px; color:#666;">${cellData.teacher}</div>`;
            } else {
                const foundCls = [];
                this.classes.forEach(c => {
                    const s = this.schedule[c][slotId];
                    if (s && typeof s.teacher === 'string' && s.teacher.includes(target)) foundCls.push(c);
                });
                if (foundCls.length) return `<div style="font-weight:bold; color:#059669;">${foundCls.join(',')}班</div><div style="font-size:10px;">上课</div>`;
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
    },

    getExportCellText: function (className, slotId) {
        const cell = this.schedule[className]?.[slotId];
        return cell ? `${cell.subject}\n(${cell.teacher})` : '';
    },

    appendExportSectionRows: function (data, className, labelPrefix, slotType, count, options = {}) {
        const isFridayLimited = !!options.fridayDisabled;
        const fridayText = options.fridayText || '';
        const startIndex = parseInt(options.startIndex, 10) || 1;
        for (let i = 1; i <= count; i++) {
            const slotNumber = startIndex + i - 1;
            const row = [`${className}班`, `${labelPrefix}${slotNumber}`];
            for (let day = 1; day <= 5; day++) {
                if (day === 5 && isFridayLimited) {
                    row.push(fridayText);
                } else {
                    row.push(this.getExportCellText(className, `d${day}_${slotType}_${slotNumber}`));
                }
            }
            data.push(row);
        }
    },

    exportResult: function () {
        if (Object.keys(this.schedule).length === 0) return alert("暂无课表数据");
        const wb = XLSX.utils.book_new();
        const data = [['班级', '时段', '周一', '周二', '周三', '周四', '周五']];
        const am = parseInt(document.getElementById('sch_am_count').value);
        const pm = parseInt(document.getElementById('sch_pm_count').value);
        const eve = parseInt(document.getElementById('sch_eve_count').value);
        const hasMorningRead = document.getElementById('sch_rule_morning_read').checked;
        const hasNoonWrite = document.getElementById('sch_rule_noon_write').checked;
        const fridayPmLimit = document.getElementById('sch_rule_fri_pm').checked;
        const fridayPmMax = parseInt(document.getElementById('sch_fri_pm_val').value, 10) || 0;
        const noFridayEve = document.getElementById('sch_rule_fri_eve').checked;

        this.classes.forEach(c => {
            if (hasMorningRead) data.push([`${c}班`, '早读', '语文/英语', '语文/英语', '语文/英语', '语文/英语', '语文/英语']);

            this.appendExportSectionRows(data, c, '上午', 'am', am);

            if (hasNoonWrite) data.push([`${c}班`, '午练', '练字', '练字', '练字', '练字', '练字']);

            for (let i = 1; i <= pm; i++) {
                this.appendExportSectionRows(data, c, '下午', 'pm', 1, {
                    startIndex: i,
                    fridayDisabled: fridayPmLimit && i > fridayPmMax,
                    fridayText: '(放假)'
                });
            }

            this.appendExportSectionRows(data, c, '晚', 'eve', eve, {
                fridayDisabled: noFridayEve,
                fridayText: '-'
            });

            data.push(['---', '---', '---', '---', '---', '---', '---']);
        });

        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "级部总课表");
        XLSX.writeFile(wb, "智能排课结果.xlsx");
    },

    importExisting: function () { alert("功能开发中：支持上传 Excel 反向解析课表"); }
};

    window.SCHEDULER = SCHEDULER;
    window.GradeSchedulerRuntime = SCHEDULER;
    window.__GRADE_SCHEDULER_RUNTIME_PATCHED__ = true;
})();
