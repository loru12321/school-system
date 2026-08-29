(() => {
    if (typeof window === 'undefined' || window.__FRESHMAN_EXAM_RUNTIME_PATCHED__) return;

    let FB_STUDENTS = [];
    let FB_CLASSES = (typeof window.readFbClassesState === 'function')
        ? window.readFbClassesState()
        : (Array.isArray(window.FB_CLASSES) ? window.FB_CLASSES : []);
    let FB_CUR_CLASS_IDX = -1;
    let FB_SIMULATED_DATA = {};
    let EXAM_DATA = [];
    let EXAM_ROOMS = [];
    let FB_SCHEMES_CACHE = [];
    let FB_ACTIVE_SCHEME_ID = null;
    // 人工指定的“学生 → 具体班级”锁定项。键优先使用考号，其次使用归一化姓名。
    // 锁定只影响本次分班方案生成，不改动云端成绩和原始学生数据。
    let FB_FIXED_ASSIGNMENTS = {};
    // 同班组合：只锁定“必须同班”，不预先指定具体班级，由算法按整体代价选择班级。
    let FB_SAME_CLASS_GROUPS = [];
    let FB_SAME_CLASS_DRAFT = [];
    let balanceChartInstance = null;
    const FreshmanExamPerfCache = {
        schemeSelectorSignature: '',
        schemeSelectorHtml: '',
        dashboardSignature: '',
        dashboardHtml: '',
        balanceSignature: '',
        balanceChartSignature: '',
        balanceTableHtml: '',
        examOverviewSignature: '',
        examOverviewHtml: '',
        examStudentListSignature: '',
        examStudentListHtml: '',
        examProctorSignature: '',
        examProctorHtml: '',
        examPrintSignature: '',
        examPrintHtml: ''
    };
    let balanceChartLoadPending = false;

    function fbClassSignature(classes = FB_CLASSES) {
        return (Array.isArray(classes) ? classes : []).map((c) => [
            c?.id,
            c?.name,
            Array.isArray(c?.students) ? c.students.length : 0,
            Array.isArray(c?.students) ? c.students.map(s => `${s.name}:${s.score}:${s.gender}:${s.isDiff || s._isDiff ? 1 : 0}:${s.postType || ''}:${s.isNoExam ? 1 : 0}:${s.isViolation ? 1 : 0}`).join(',') : ''
        ].join(':')).join('|');
    }

    function fbIsNoExamStudent(student) {
        return !!student && (student.isNoExam === true
            || student.postType === 'roster-no-exam'
            || student.postType === '学籍在册未考试');
    }

    function fbCalcClassStats(students = []) {
        const list = Array.isArray(students) ? students : [];
        const n = list.length;
        let total = 0;
        let scored = 0;
        let male = 0;
        let female = 0;
        let unknownGender = 0;
        let diff = 0;
        list.forEach((student) => {
            if (Number.isFinite(Number(student?.score)) && !fbIsNoExamStudent(student)) { total += Number(student.score); scored += 1; }
            if (student?.gender === 'M') male += 1;
            else if (student?.gender === 'F') female += 1;
            else unknownGender += 1;
            if (student?.isDiff || student?._isDiff) diff += 1;
        });
        return {
            avg: scored ? total / scored : 0,
            male,
            female,
            unknownGender,
            diff,
            count: n,
            scoredCount: scored,
            noExam: n - scored
        };
    }

    function examRoomSignature() {
        return (Array.isArray(EXAM_ROOMS) ? EXAM_ROOMS : []).map(room => {
            const students = Array.isArray(room?.students) ? room.students : [];
            return [
                room?.id,
                students.length,
                students.map(student => [
                    student?.examNo,
                    student?.name,
                    student?.class,
                    student?.roomNo,
                    student?.seatNo,
                    student?.score
                ].join(':')).join(',')
            ].join('|');
        }).join('||');
    }

    function syncFbClasses() {
        const nextClasses = (typeof window.readFbClassesState === 'function')
            ? window.readFbClassesState()
            : (Array.isArray(window.FB_CLASSES) ? window.FB_CLASSES : []);
        if (Array.isArray(nextClasses)) FB_CLASSES = nextClasses;
        window.FB_CLASSES = FB_CLASSES;
        return FB_CLASSES;
    }

    function writeFbClasses(classes) {
        const nextClasses = (typeof window.setFbClassesState === 'function')
            ? window.setFbClassesState(classes)
            : (Array.isArray(classes) ? classes : []);
        FB_CLASSES = Array.isArray(nextClasses) ? nextClasses : [];
        window.FB_CLASSES = FB_CLASSES;
        return FB_CLASSES;
    }

    function getCurrentConfig() {
        return window.CONFIG || { name: '学校' };
    }

    function fbStudentIdentity(student) {
        if (!student) return '';
        const key = String(student.key || '').trim();
        if (key) return key;
        const id = fbNormalizeId(student.id || student.examNo || student.studentId);
        if (id) return `id:${id}`;
        if (student._id != null) return `row:${String(student._id)}`;
        return `name:${fbNormalizeName(student.name)}`;
    }

    function fbFixedClassCount() {
        return Math.max(1, Number(document.getElementById('fb_cls_num')?.value) || 6);
    }

    function fbFixedLabel(student) {
        const id = fbNormalizeId(student?.id || student?.examNo || student?.studentId);
        return `${student?.name || '未知'}${id ? `（${id}）` : ''}`;
    }

    function FB_getFixedAssignments() {
        return { ...FB_FIXED_ASSIGNMENTS };
    }

    // 指定班级控件在云端模式下可能早于成绩装配打开；此时仍应允许
    // 使用已上传的学籍/转入/性别名单选择学生，待成绩装配后再按考号或姓名归一化。
    function fbFixedAssignmentCandidates() {
        const candidates = [];
        const seen = new Set();
        const add = (student) => {
            if (!student) return;
            const name = fbNormalizeName(student.name);
            if (!name) return;
            const id = fbNormalizeId(student.id || student.examNo || student.studentId);
            const identity = id ? `id:${id}` : `name:${name}`;
            if (seen.has(identity)) return;
            seen.add(identity);
            candidates.push({
                ...student,
                name,
                id,
                gender: student.gender || 'U',
                score: Number.isFinite(Number(student.score)) ? Number(student.score) : 0,
                _candidateOnly: !FB_STUDENTS.some(item => fbStudentIdentity(item) === identity)
            });
        };
        (Array.isArray(FB_STUDENTS) ? FB_STUDENTS : []).forEach(add);
        (Array.isArray(FB_ROSTER_ROWS) ? FB_ROSTER_ROWS : []).forEach(add);
        (Array.isArray(FB_TRANSFER_IN_STUDENTS) ? FB_TRANSFER_IN_STUDENTS : []).forEach(add);
        // 性别名单没有考号时也提供姓名候选，避免用户必须先点击生成方案。
        (Array.isArray(FB_GENDER_NAMES) ? FB_GENDER_NAMES : []).forEach((name) => {
            const normalized = fbNormalizeName(name);
            if (normalized && !candidates.some(item => fbNormalizeName(item.name) === normalized)) add({ name: normalized, gender: FB_GENDER_MAP[`name:${normalized}`] || 'U' });
        });
        return candidates;
    }

    function fbResolveFixedAssignmentIdentities() {
        const candidates = fbFixedAssignmentCandidates();
        const primaryStudents = Array.isArray(FB_STUDENTS) ? FB_STUDENTS : [];
        const byName = new Map();
        candidates.forEach((student) => {
            const name = fbNormalizeName(student.name);
            const list = byName.get(name) || [];
            list.push(student);
            byName.set(name, list);
        });
        Object.entries(FB_FIXED_ASSIGNMENTS).forEach(([identity, classIdx]) => {
            if (!identity.startsWith('name:')) return;
            const name = identity.slice(5);
            // 优先使用已经装配完成的考试学生；学籍/性别名单可能同时保留
            // 同名记录，不应因此阻止唯一的成绩学生被解析。
            const primaryMatches = primaryStudents.filter(student => fbNormalizeName(student.name) === name);
            const matches = primaryMatches.length ? primaryMatches : (byName.get(name) || []);
            if (matches.length !== 1) return;
            const resolved = fbStudentIdentity(matches[0]);
            if (resolved && resolved !== identity) {
                FB_FIXED_ASSIGNMENTS[resolved] = classIdx;
                delete FB_FIXED_ASSIGNMENTS[identity];
            }
        });
    }

    function FB_refreshFixedAssignmentUI() {
        const studentSelect = document.getElementById('fb_fixed_student');
        const classSelect = document.getElementById('fb_fixed_class');
        const list = document.getElementById('fb_fixed_assignment_list');
        if (!studentSelect || !classSelect || !list) return;
        fbResolveFixedAssignmentIdentities();
        const students = fbFixedAssignmentCandidates().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'));
        const selectedStudent = studentSelect.value;
        studentSelect.innerHTML = students.length
            ? `<option value="">选择学生</option>${students.map(s => `<option value="${String(fbStudentIdentity(s)).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">${String(fbFixedLabel(s)).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}</option>`).join('')}`
            : '<option value="">请先载入成绩、学籍或性别名单</option>';
        if (selectedStudent && students.some(s => fbStudentIdentity(s) === selectedStudent)) studentSelect.value = selectedStudent;
        const k = fbFixedClassCount();
        const selectedClass = classSelect.value;
        classSelect.innerHTML = Array.from({ length: k }, (_, i) => `<option value="${i}">${i + 1}班</option>`).join('');
        if (selectedClass && Number(selectedClass) < k) classSelect.value = selectedClass;
        const rows = Object.entries(FB_FIXED_ASSIGNMENTS).map(([identity, classIdx]) => {
            const student = students.find(s => fbStudentIdentity(s) === identity);
            const label = student ? fbFixedLabel(student) : `当前名单未匹配（${identity}）`;
            const safeLabel = String(label).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
            const safeIdentity = String(identity).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
            return `<div class="freshman-fixed-row${student ? '' : ' is-stale'}"><span><strong>${safeLabel}</strong><small>锁定至 ${Number(classIdx) + 1}班</small></span><button type="button" class="btn btn-sm btn-gray" data-fb-action="remove-fixed" data-fb-student="${safeIdentity}">移除</button></div>`;
        }).join('');
        list.innerHTML = rows || '<div class="freshman-fixed-empty">暂未指定学生，系统将按均衡算法自动分班。</div>';
    }

    function FB_addFixedAssignment() {
        const studentSelect = document.getElementById('fb_fixed_student');
        const classSelect = document.getElementById('fb_fixed_class');
        const identity = String(studentSelect?.value || '').trim();
        const classIdx = Number(classSelect?.value);
        if (!identity) return window.UI?.alert?.('请先选择要指定的学生。');
        if (!Number.isInteger(classIdx) || classIdx < 0 || classIdx >= fbFixedClassCount()) return window.UI?.alert?.('请选择有效的具体班级。');
        const student = fbFixedAssignmentCandidates().find(s => fbStudentIdentity(s) === identity);
        if (!student) return window.UI?.alert?.('未找到该学生，请重新载入名单。');
        FB_FIXED_ASSIGNMENTS[identity] = classIdx;
        FB_refreshFixedAssignmentUI();
        window.UI?.toast?.(`${fbFixedLabel(student)} 已锁定至 ${classIdx + 1}班`, 'success');
    }

    function FB_removeFixedAssignment(identity) {
        const key = String(identity || '').trim();
        if (!key) return;
        delete FB_FIXED_ASSIGNMENTS[key];
        FB_refreshFixedAssignmentUI();
    }

    function FB_clearFixedAssignments() {
        FB_FIXED_ASSIGNMENTS = {};
        FB_refreshFixedAssignmentUI();
        window.UI?.toast?.('已清空全部指定班级', 'success');
    }

    function fbSameClassCandidates() {
        return fbFixedAssignmentCandidates();
    }

    function fbSameClassLabel(identity) {
        const student = fbSameClassCandidates().find(s => fbStudentIdentity(s) === identity);
        return student ? fbFixedLabel(student) : `未匹配（${identity}）`;
    }

    function FB_refreshSameClassUI() {
        const select = document.getElementById('fb_same_class_student');
        const draft = document.getElementById('fb_same_class_draft');
        const list = document.getElementById('fb_same_class_group_list');
        if (!select || !draft || !list) return;
        fbResolveSameClassIdentities();
        const students = fbSameClassCandidates().sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN'));
        const selected = select.value;
        select.innerHTML = students.length
            ? `<option value="">选择学生</option>${students.map(s => `<option value="${String(fbStudentIdentity(s)).replace(/&/g, '&amp;').replace(/\"/g, '&quot;')}">${String(fbFixedLabel(s)).replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[ch]))}</option>`).join('')}`
            : '<option value="">请先载入成绩、学籍或性别名单</option>';
        if (selected && students.some(s => fbStudentIdentity(s) === selected)) select.value = selected;
        draft.innerHTML = FB_SAME_CLASS_DRAFT.length
            ? FB_SAME_CLASS_DRAFT.map(id => `<span class="freshman-same-chip">${fbSameClassLabel(id)}<button type="button" aria-label="移除" data-fb-action="remove-same-draft" data-fb-student="${id}">×</button></span>`).join('')
            : '<span class="freshman-fixed-empty">尚未选择成员（至少两人）</span>';
        list.innerHTML = FB_SAME_CLASS_GROUPS.length
            ? FB_SAME_CLASS_GROUPS.map((group, index) => `<div class="freshman-fixed-row"><span><strong>组合${index + 1}</strong><small>${group.members.map(fbSameClassLabel).join('、')}</small></span><button type="button" class="btn btn-sm btn-gray" data-fb-action="remove-same-group" data-fb-group-id="${group.id}">移除</button></div>`).join('')
            : '<div class="freshman-fixed-empty">暂未设置同班组合，系统将按均衡算法自动分班。</div>';
    }

    function fbResolveSameClassIdentities() {
        const candidates = fbSameClassCandidates();
        const primary = Array.isArray(FB_STUDENTS) ? FB_STUDENTS : [];
        const resolve = (identity) => {
            if (!String(identity).startsWith('name:')) return identity;
            const name = String(identity).slice(5);
            const matches = primary.filter(s => fbNormalizeName(s.name) === name);
            if (matches.length === 1) return fbStudentIdentity(matches[0]);
            const fallback = candidates.filter(s => fbNormalizeName(s.name) === name);
            return fallback.length === 1 ? fbStudentIdentity(fallback[0]) : identity;
        };
        FB_SAME_CLASS_DRAFT = FB_SAME_CLASS_DRAFT.map(resolve);
        FB_SAME_CLASS_GROUPS.forEach(g => { g.members = g.members.map(resolve); });
    }

    function FB_addSameClassMember() {
        const id = String(document.getElementById('fb_same_class_student')?.value || '').trim();
        if (!id) return window.UI?.alert?.('请先选择要加入组合的学生。');
        if (FB_SAME_CLASS_DRAFT.includes(id)) return window.UI?.toast?.('该学生已在当前组合中。', 'warning');
        if (FB_SAME_CLASS_GROUPS.some(g => g.members.includes(id))) return window.UI?.alert?.('该学生已经属于一个同班组合，请先移除原组合。');
        FB_SAME_CLASS_DRAFT.push(id); FB_refreshSameClassUI();
    }

    function FB_removeSameClassDraft(identity) {
        FB_SAME_CLASS_DRAFT = FB_SAME_CLASS_DRAFT.filter(id => id !== String(identity)); FB_refreshSameClassUI();
    }

    function FB_createSameClassGroup() {
        if (FB_SAME_CLASS_DRAFT.length < 2) return window.UI?.alert?.('同班组合至少需要选择两名学生。');
        const group = { id: `same-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, members: [...FB_SAME_CLASS_DRAFT] };
        FB_SAME_CLASS_GROUPS.push(group); FB_SAME_CLASS_DRAFT = []; FB_refreshSameClassUI();
        window.UI?.toast?.(`已建立同班组合（${group.members.length}人），生成时由算法自动选择最均衡班级。`, 'success');
    }

    function FB_removeSameClassGroup(id) { FB_SAME_CLASS_GROUPS = FB_SAME_CLASS_GROUPS.filter(g => g.id !== String(id)); FB_refreshSameClassUI(); }
    function FB_clearSameClassGroups() { FB_SAME_CLASS_GROUPS = []; FB_SAME_CLASS_DRAFT = []; FB_refreshSameClassUI(); window.UI?.toast?.('已清空全部同班组合', 'success'); }

    function FB_loadSameClassList(input) {
        const file = input?.files?.[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const wb = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
                if (!rows.length) throw new Error('Excel没有数据');
                const grouped = new Map(); const errors = [];
                rows.forEach((row, index) => {
                    const group = String(row['组合编号'] ?? row['组号'] ?? row['组合'] ?? row['同班组'] ?? row['group'] ?? '').trim();
                    const student = fbRosterRow(row);
                    if (!group) { errors.push(`第${index + 2}行缺少组合编号`); return; }
                    if (!student) { errors.push(`第${index + 2}行缺少姓名`); return; }
                    const id = fbStudentIdentity(student);
                    const list = grouped.get(group) || []; if (!list.includes(id)) list.push(id); grouped.set(group, list);
                });
                const validGroups = [...grouped.entries()].filter(([, members]) => members.length >= 2);
                const invalidGroups = [...grouped.entries()].filter(([, members]) => members.length < 2).map(([group]) => group);
                if (!validGroups.length) throw new Error('没有找到至少包含两名学生的有效组合');
                const imported = [];
                validGroups.forEach(([label, members]) => {
                    const resolvedMembers = members.map(id => {
                        const candidate = fbSameClassCandidates().find(student => fbStudentIdentity(student) === id);
                        return candidate ? fbStudentIdentity(candidate) : id;
                    });
                    const existing = FB_SAME_CLASS_GROUPS.find(group => group.members.some(id => resolvedMembers.includes(id)));
                    if (existing) existing.members = [...new Set(existing.members.concat(resolvedMembers))];
                    else { FB_SAME_CLASS_GROUPS.push({ id: `same-upload-${Date.now()}-${imported.length}`, members: resolvedMembers }); imported.push(label); }
                });
                fbResolveSameClassIdentities(); FB_refreshSameClassUI(); input.value = '';
                const suffix = [...errors, ...(invalidGroups.length ? [`组合“${invalidGroups.join('、')}”少于两人，已跳过`] : [])];
                window.UI?.alert?.(`✅ 同班组合名单导入 ${validGroups.length} 组、${validGroups.reduce((sum, [, members]) => sum + members.length, 0)} 人。${suffix.length ? `\n⚠️ ${suffix.slice(0, 6).join('\n')}` : ''}`, suffix.length ? 'warning' : 'success');
            } catch (error) { input.value = ''; window.UI?.alert?.('同班组合名单读取失败：' + error.message, 'error'); }
        };
        reader.readAsArrayBuffer(file);
    }

    function fbMergeSameClassPair(a, b) {
        const ids = new Set([a, b]);
        const touching = FB_SAME_CLASS_GROUPS.filter(group => group.members.some(id => ids.has(id)));
        touching.forEach(group => group.members.forEach(id => ids.add(id)));
        FB_SAME_CLASS_GROUPS = FB_SAME_CLASS_GROUPS.filter(group => !touching.includes(group));
        FB_SAME_CLASS_GROUPS.push({ id: `same-remark-${[...ids].sort().join('-')}`, members: [...ids] });
    }

    function fbSameClassGroupMap() {
        const map = new Map(); FB_SAME_CLASS_GROUPS.forEach((g, i) => g.members.forEach(id => map.set(id, `same-${i + 1}`))); return map;
    }

    function fbResolveSameClassGroups(pool, k) {
        const byId = new Map(pool.map(s => [fbStudentIdentity(s), s]));
        const byName = new Map(pool.map(s => [fbNormalizeName(s.name), s]));
        return FB_SAME_CLASS_GROUPS.map((group, index) => {
            const members = group.members.map(id => byId.get(id) || (String(id).startsWith('name:') ? byName.get(String(id).slice(5)) : null)).filter(Boolean);
            return { ...group, id: group.id || `same-${index + 1}`, index, members };
        }).filter(group => group.members.length >= 2);
    }

    function fbValidateSameClassGroups(k) {
        const errors = []; fbResolveSameClassIdentities();
        const active = new Set(fbSameClassCandidates().map(fbStudentIdentity)); const seen = new Map();
        FB_SAME_CLASS_GROUPS.forEach((group, gi) => {
            if (!Array.isArray(group.members) || group.members.length < 2) errors.push(`组合${gi + 1} 少于两名学生。`);
            group.members.forEach(id => { if (!active.has(id)) errors.push(`组合${gi + 1} 中存在当前名单找不到的学生。`); const prior = seen.get(id); if (prior) errors.push(`${fbSameClassLabel(id)} 同时出现在组合${prior}和组合${gi + 1}中。`); else seen.set(id, gi + 1); });
            const fixed = [...new Set(group.members.map(id => FB_FIXED_ASSIGNMENTS[id]).filter(v => Number.isInteger(v)))];
            if (fixed.length > 1) errors.push(`组合${gi + 1}的成员被指定到了不同班级，无法同时满足同班与指定班级规则。`);
        });
        const transferIds = new Set((FB_TRANSFER_STUDENTS || []).map(fbStudentIdentity));
        FB_SAME_CLASS_GROUPS.forEach((group, gi) => group.members.forEach(id => { if (transferIds.has(id)) errors.push(`组合${gi + 1}包含转出学生${fbSameClassLabel(id)}，转出学生不参与分班。`); }));
        return [...new Set(errors)];
    }

    function fbFixedClassIndex(value, classCount) {
        const raw = String(value == null ? '' : value).trim();
        if (!raw) return -1;
        const match = raw.match(/(?:^|[.\-\s])([0-9]{1,2})\s*(?:班)?$/) || raw.match(/([0-9]{1,2})/);
        const number = match ? Number(match[1]) : NaN;
        return Number.isInteger(number) && number >= 1 && number <= classCount ? number - 1 : -1;
    }

    function FB_loadFixedClassList(input) {
        const file = input?.files?.[0]; if (!file) return;
        const classCount = fbFixedClassCount();
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                if (!rows.length) throw new Error('Excel没有数据');
                let imported = 0;
                const errors = [];
                rows.forEach((row, index) => {
                    const student = fbRosterRow(row);
                    const target = row['指定班级'] ?? row['目标班级'] ?? row['班级'] ?? row['分配班级'] ?? row['class'] ?? row['className'];
                    const classIdx = fbFixedClassIndex(target, classCount);
                    if (!student) { errors.push(`第${index + 2}行缺少姓名`); return; }
                    if (classIdx < 0) { errors.push(`第${index + 2}行班级“${target || ''}”无效（当前为1-${classCount}班）`); return; }
                    FB_FIXED_ASSIGNMENTS[fbStudentIdentity(student)] = classIdx;
                    imported += 1;
                });
                fbResolveFixedAssignmentIdentities();
                FB_refreshFixedAssignmentUI();
                const suffix = errors.length ? `\n⚠️ 已跳过 ${errors.length} 行：\n${errors.slice(0, 6).join('\n')}${errors.length > 6 ? '\n…' : ''}` : '';
                window.UI?.alert?.(`✅ 指定班级名单导入 ${imported} 人。${suffix}`, errors.length ? 'warning' : 'success');
                input.value = '';
            } catch (err) { window.UI?.alert?.('指定班级名单读取失败：' + err.message, 'error'); }
        };
        reader.readAsArrayBuffer(file);
    }

    function fbGetFixedClass(student, k) {
        const idx = FB_FIXED_ASSIGNMENTS[fbStudentIdentity(student)];
        return Number.isInteger(idx) && idx >= 0 && idx < k ? idx : -1;
    }

    function fbCountFixedAssignments(k) {
        const counts = Array.from({ length: k }, () => 0);
        (Array.isArray(FB_STUDENTS) ? FB_STUDENTS : []).forEach(student => {
            const idx = fbGetFixedClass(student, k);
            if (idx >= 0) counts[idx] += 1;
        });
        return counts;
    }

    function fbValidateFixedAssignments(k) {
        const errors = [];
        const active = new Set(fbFixedAssignmentCandidates().map(fbStudentIdentity));
        Object.keys(FB_FIXED_ASSIGNMENTS).forEach(identity => {
            const classIdx = FB_FIXED_ASSIGNMENTS[identity];
            if (!active.has(identity)) errors.push('指定班级中存在当前名单找不到的学生。');
            if (!Number.isInteger(classIdx) || classIdx < 0 || classIdx >= k) errors.push(`存在超出当前 ${k} 个班级范围的指定项。`);
        });
        const fixedStudents = FB_STUDENTS.filter(student => fbGetFixedClass(student, k) >= 0);
        fixedStudents.forEach(student => {
            const classIdx = fbGetFixedClass(student, k);
            const diffNames = Array.isArray(student.constraints?.diff) ? student.constraints.diff : [];
            diffNames.forEach(name => {
                const other = fixedStudents.find(candidate => fbNormalizeName(candidate.name) === fbNormalizeName(name));
                if (other && fbGetFixedClass(other, k) === classIdx && other !== student) {
                    errors.push(`${student.name} 与 ${other.name} 被指定在同一班，但规则要求分开。`);
                }
            });
        });
        return [...new Set(errors)];
    }

// ================== 新生分班 & 座位编排 ==================
// ==========================================================================
// 云端多次成绩分班装配层（阶段1）
// 只读 COHORT_DB.exams 的内存副本，按目标年级口径算「分班分」，绝不写云端/全局。
// 仅在用户进入本子模块并主动点击时运行。
// ==========================================================================

// 分班分科目口径：新7/新8 用各自年级常规总分；新9 只用语数英物化(物×0.9化×0.6，不含政治)。
// 直接复用 AnalyticsKernel 的年级满分规则作为权重来源，与云端口径一致。
const FB_GRADE9_SUBJECTS = Object.freeze(['语文', '数学', '英语', '物理', '化学']); // 明确排除政治/史/地/生
const FB_GRADE9_WEIGHT = Object.freeze({ '语文': 1, '数学': 1, '英语': 1, '物理': 0.9, '化学': 0.6 });
// 主科：每科每班均衡（均分/优秀率/及格率）只对语数英。副科只计入总分。
const FB_MAIN_SUBJECTS = Object.freeze(['语文', '数学', '英语']);
function fbMajorSubjectsForGradeValue(grade) { return String(grade) === '9' ? ['语文', '数学', '英语', '物理', '化学'] : [...FB_MAIN_SUBJECTS]; }
// 主科优秀/及格线（满分×0.85 / ×0.6，语数英满分均 150）。与系统 AnalyticsKernel 口径一致。
const FB_MAIN_FULL = 150;
const FB_MAIN_EXC_LINE = FB_MAIN_FULL * 0.85; // 127.5
const FB_MAIN_PASS_LINE = FB_MAIN_FULL * 0.6; // 90

function fbNormalizeName(v) {
    return String(v == null ? '' : v).replace(/\s+/g, '').trim();
}
function fbNormalizeId(v) {
    return String(v == null ? '' : v).replace(/\s+/g, '').trim();
}
// 学生跨考试/名单匹配键：考号优先，退回 归一化姓名。
function fbStudentKey(row) {
    const id = fbNormalizeId(row && (row.id || row.examNo || row.studentId));
    if (id && id !== '-' && id !== '0') return 'id:' + id;
    return 'name:' + fbNormalizeName(row && row.name);
}

function fbAcademicYearStart(dateOrYear) {
    const raw = String(dateOrYear || '').trim();
    const dateMatch = raw.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
    if (dateMatch) {
        const year = Number(dateMatch[1]);
        const month = Number(dateMatch[2]);
        return month >= 9 ? year : year - 1;
    }
    const yearMatch = raw.match(/^(\d{4})/);
    return yearMatch ? Number(yearMatch[1]) : 0;
}

function fbCurrentCohortEntryYear() {
    const metaYear = window.CURRENT_COHORT_META?.year;
    const raw = String(metaYear || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
    const match = raw.match(/\d{4}/);
    return match ? Number(match[0]) : 0;
}

function fbLockedTargetGrade() {
    const runtimeTarget = window.TeachingWorkbenchCohort?.targetGrade?.();
    if (runtimeTarget) return String(runtimeTarget);
    return String(document.getElementById('fb_target_grade')?.value || '7').trim();
}

// 取本届别与目标年级阶段相符的最近 N 次考试。
// 新生 G 年级：目标学年开始前（9 月前）使用 G-1 年级成绩；
// 目标学年开始后（9 月起）使用 G 年级成绩。以考试日期所属学年判断，
// 不再把当前届别内不同年级的成绩混在一起。
function fbGetRecentExams(limit = 3, targetGrade = '') {
    const db = (typeof window.COHORT_DB === 'object' && window.COHORT_DB) ? window.COHORT_DB : null;
    const exams = db && db.exams && typeof db.exams === 'object' ? db.exams : null;
    if (!exams) return [];
    const list = Object.keys(exams).map((examId) => {
        const ex = exams[examId] || {};
        const meta = ex.meta || {};
        const dateStr = String(meta.date || meta.examDate || '').trim();
        const ts = Date.parse(dateStr) || Number(ex.updatedAt) || Number(ex.createdAt) || 0;
        return {
            examId,
            meta,
            data: Array.isArray(ex.data) ? ex.data : [],
            subjects: Array.isArray(ex.subjects) ? ex.subjects : [],
            ts,
            dateStr,
            label: String(meta.type || meta.examName || examId)
        };
    }).filter((e) => e.data.length > 0);
    list.sort((a, b) => b.ts - a.ts);
    const grade = Number(targetGrade);
    const cohortYear = fbCurrentCohortEntryYear();
    if (!Number.isFinite(grade) || grade < 6 || grade > 9 || !cohortYear) {
        return list.slice(0, Math.max(1, Math.min(limit, 3)));
    }
    const targetAcademicYear = cohortYear + (grade - 6);
    const eligible = list.filter((exam) => {
        const academicYear = fbAcademicYearStart(exam.dateStr || exam.meta?.year);
        const examCohort = String(exam.meta?.cohortId || exam.meta?.cohort || exam.meta?.entryYear || '').match(/\d{4}/)?.[0];
        return (!examCohort || examCohort === String(cohortYear))
            && (academicYear === targetAcademicYear || academicYear === targetAcademicYear - 1);
    });
    return eligible.slice(0, Math.max(1, Math.min(limit, 3)));
}

// 单场考试内、按目标年级口径算某学生该场的分班分。
function fbExamAssignmentScore(studentRow, targetGrade) {
    const scores = (studentRow && studentRow.scores && typeof studentRow.scores === 'object') ? studentRow.scores : {};
    if (String(targetGrade) === '9') {
        // 新9：仅语数英物化，物×0.9化×0.6，排除政治/史/地/生。
        let sum = 0, got = 0;
        FB_GRADE9_SUBJECTS.forEach((sub) => {
            const raw = Number(scores[sub]);
            if (Number.isFinite(raw)) { sum += raw * FB_GRADE9_WEIGHT[sub]; got += 1; }
        });
        return got > 0 ? { score: sum, subjectsGot: got } : null;
    }
    // 新7/新8：常规总分（优先 row.total，否则可得科目求和）。
    const total = Number(studentRow && studentRow.total);
    if (Number.isFinite(total) && total > 0) return { score: total, subjectsGot: -1 };
    const vals = Object.values(scores).map(Number).filter(Number.isFinite);
    return vals.length ? { score: vals.reduce((a, b) => a + b, 0), subjectsGot: vals.length } : null;
}

// 用户上传的性别名单 / 违纪名单（子模块内存，按 key 索引）。
let FB_GENDER_MAP = {};      // key -> 'M' | 'F'
let FB_VIOLATION_SET = {};   // key -> true
let FB_GENDER_NAMES = [];    // 原始姓名（用于重名检测展示）
let FB_VIOLATION_NAMES = [];
let FB_LAST_ASSEMBLY = null; // { targetGrade, examCount, dupGroups, matched, ... } 供结果页横幅用
let FB_COST_CONTEXT = null;
let FB_ROSTER_ROWS = [];
let FB_TRANSFER_STUDENTS = [];
let FB_ROSTER_RECONCILIATION = null;
let FB_UNEXAM_ROSTER_STUDENTS = [];
let FB_TRANSFER_IN_STUDENTS = [];
let FB_DROPOUT_STUDENTS = [];

function fbRosterRow(raw) {
    const name = fbNormalizeName(raw?.姓名 || raw?.学生姓名 || raw?.名字 || raw?.Name || raw?.name);
    if (!name) return null;
    const genderRaw = String(raw?.性别 || raw?.Gender || raw?.gender || raw?.sex || raw?.性别名称 || '').trim().toUpperCase();
    const gender = genderRaw === '男' || genderRaw === 'M' ? 'M' : genderRaw === '女' || genderRaw === 'F' ? 'F' : '';
    const id = fbNormalizeId(raw?.考号 || raw?.学号 || raw?.学生学号 || raw?.准考证号 || raw?.studentId || raw?.id || '');
    return { name, gender, id };
}
function fbParseGender(value) {
    const raw = String(value ?? '').trim().toUpperCase();
    return raw === '男' || raw === 'M' ? 'M' : raw === '女' || raw === 'F' ? 'F' : 'U';
}
function fbGenderLabel(value) {
    return value === 'M' ? '男' : value === 'F' ? '女' : '未填';
}
function fbRosterIdentity(row) { return row?.id ? `id:${row.id}` : `name:${row?.name || ''}|${row?.gender || ''}`; }
function fbCurrentSchoolName() {
    return String((typeof window.readCurrentSchool === 'function' ? window.readCurrentSchool() : '')
        || window.MY_SCHOOL || window.CONFIG?.name || '').trim();
}
function fbExamBelongsToCurrentSchool(raw, context = {}) {
    // 云端考试常把学校放在考试 meta，而不是每一行；两处都要参与本校过滤。
    const school = String(raw?.school || raw?.学校 || raw?.学校名称 || raw?.schoolName
        || context?.school || context?.学校 || context?.schoolName || context?.学校名称
        || context?.meta?.school || context?.meta?.schoolName || context?.meta?.学校 || '').trim();
    const current = fbCurrentSchoolName();
    if (!current) return false;
    // 没有学校字段时，仅允许后续通过已上传学籍/人工名单匹配的学生；
    // 不能把整场考试的其他学校数据默认当成本校。
    if (!school) {
        // 缺少学校字段时保留考试名单中的学生，以便处理“考试有、学籍无”的合法情况；
        // 若因此超过本校班额安全上限，生成流程会立即阻断并要求检查数据来源。
        return true;
    }
    // 有明确学校字段时，只接受当前本校；考试有、学籍无的本校学生仍可进入核对弹窗。
    // 分班场景只允许当前本校，不能使用县域分析里的宽松别名匹配。
    const canonical = (value) => String(value || '').replace(/[\s　]/g, '').replace(/学校$/, '').replace(/校区$/, '');
    return canonical(school) === canonical(current);
}
function fbFindRosterMatch(row, candidates) {
    return candidates.find(item => row.id && item.id && row.id === item.id)
        || candidates.find(item => item.name === row.name && (!row.gender || !item.gender || row.gender === item.gender));
}
function fbIsTransferred(row) {
    return !!row && FB_TRANSFER_STUDENTS.some(student => (row.id && student.id && row.id === student.id) || (row.name && student.name === row.name));
}
function FB_renderRosterStatus() {
    const status = document.getElementById('fb_roster_status');
    if (status) status.innerHTML = FB_ROSTER_ROWS.length
        ? `已载入学籍名单 <strong>${FB_ROSTER_ROWS.length}</strong> 人；转出 <strong>${FB_TRANSFER_STUDENTS.length}</strong> 人；辍学 <strong>${FB_DROPOUT_STUDENTS.length}</strong> 人；新转入 <strong>${FB_TRANSFER_IN_STUDENTS.length}</strong> 人。生成分班前会自动核对学籍与考试名单。`
        : '尚未上传学籍名单；如不上传，系统沿用考试名单，不执行在校名单核对。';
    const list = document.getElementById('fb_transfer_list');
    if (list) list.innerHTML = [
        ...FB_TRANSFER_STUDENTS.map((s, i) => `<div class="freshman-fixed-row"><span><strong>${s.name}</strong><small>转出 · ${fbGenderLabel(s.gender)}</small></span><button type="button" class="btn btn-sm btn-gray" data-fb-action="remove-transfer" data-fb-index="${i}">移除</button></div>`),
        ...FB_DROPOUT_STUDENTS.map((s, i) => `<div class="freshman-fixed-row"><span><strong>${s.name}</strong><small>辍学/长期离校 · ${s.gender === 'M' ? '男' : s.gender === 'F' ? '女' : '未填'}${s.id ? ` · ${s.id}` : ''}</small></span><button type="button" class="btn btn-sm btn-gray" data-fb-action="remove-dropout" data-fb-index="${i}">移除</button></div>`),
        ...FB_TRANSFER_IN_STUDENTS.map((s, i) => `<div class="freshman-fixed-row"><span><strong>${s.name}</strong><small>新转入 · ${fbGenderLabel(s.gender)}${s.id ? ` · ${s.id}` : ''}</small></span><button type="button" class="btn btn-sm btn-gray" data-fb-action="remove-transfer-in" data-fb-index="${i}">移除</button></div>`)
    ].join('') || '<div class="freshman-fixed-empty">暂无转出或新转入登记。</div>';
}
function FB_addTransferStudent() {
    const name = fbNormalizeName(document.getElementById('fb_transfer_name')?.value);
    const gender = String(document.getElementById('fb_transfer_gender')?.value || '');
    if (!name || !gender) return window.UI.alert('请填写转出学生姓名和性别。', 'warning');
    if (!FB_TRANSFER_STUDENTS.some(s => s.name === name && s.gender === gender)) FB_TRANSFER_STUDENTS.push({ name, gender });
    document.getElementById('fb_transfer_name').value = '';
    document.getElementById('fb_transfer_gender').value = '';
    FB_renderRosterStatus();
}
function FB_removeTransferStudent(index) { FB_TRANSFER_STUDENTS.splice(Number(index), 1); FB_renderRosterStatus(); }
function FB_clearTransfers() { FB_TRANSFER_STUDENTS = []; FB_renderRosterStatus(); }
function fbReadRosterUpload(input, label, onRows) {
    const file = input.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).map(fbRosterRow).filter(Boolean);
            onRows(rows);
            FB_renderRosterStatus();
            window.UI.alert(`✅ ${label}导入 ${rows.length} 人。`, 'success');
        } catch (err) { window.UI.alert(`${label}读取失败：` + err.message, 'error'); }
    };
    reader.readAsArrayBuffer(file);
}
function FB_loadTransferList(input) {
    fbReadRosterUpload(input, '转出学生名单', (rows) => {
        rows.forEach(row => { if (!FB_TRANSFER_STUDENTS.some(s => (row.id && s.id && row.id === s.id) || s.name === row.name)) FB_TRANSFER_STUDENTS.push(row); });
    });
}
function FB_loadTransferInList(input) {
    fbReadRosterUpload(input, '转入学生名单', (rows) => {
        rows.forEach(row => { if (!FB_TRANSFER_IN_STUDENTS.some(s => (row.id && s.id && row.id === s.id) || (s.name === row.name && (!row.gender || !s.gender || row.gender === s.gender)))) FB_TRANSFER_IN_STUDENTS.push(row); });
    });
}
function FB_addDropoutStudent() {
    const name = fbNormalizeName(document.getElementById('fb_dropout_name')?.value);
    const gender = String(document.getElementById('fb_dropout_gender')?.value || '');
    const id = fbNormalizeId(document.getElementById('fb_dropout_id')?.value || '');
    if (!name) return window.UI.alert('请填写辍学学生姓名。', 'warning');
    if (!FB_DROPOUT_STUDENTS.some(s => (id && s.id === id) || (s.name === name && (!gender || !s.gender || s.gender === gender)))) FB_DROPOUT_STUDENTS.push({ name, gender, id });
    document.getElementById('fb_dropout_name').value = '';
    document.getElementById('fb_dropout_gender').value = '';
    document.getElementById('fb_dropout_id').value = '';
    FB_renderRosterStatus();
}
function FB_removeDropoutStudent(index) { FB_DROPOUT_STUDENTS.splice(Number(index), 1); FB_renderRosterStatus(); }
function FB_clearDropouts() { FB_DROPOUT_STUDENTS = []; FB_renderRosterStatus(); }
function FB_addTransferInStudent() {
    const name = fbNormalizeName(document.getElementById('fb_transfer_in_name')?.value);
    const gender = String(document.getElementById('fb_transfer_in_gender')?.value || '');
    const id = fbNormalizeId(document.getElementById('fb_transfer_in_id')?.value || '');
    if (!name || !gender) return window.UI.alert('请填写新转入学生姓名和性别。', 'warning');
    if (!FB_TRANSFER_IN_STUDENTS.some(s => (id && s.id === id) || (s.name === name && s.gender === gender))) FB_TRANSFER_IN_STUDENTS.push({ name, gender, id });
    document.getElementById('fb_transfer_in_name').value = '';
    document.getElementById('fb_transfer_in_gender').value = '';
    document.getElementById('fb_transfer_in_id').value = '';
    FB_renderRosterStatus();
}
function FB_removeTransferInStudent(index) { FB_TRANSFER_IN_STUDENTS.splice(Number(index), 1); FB_renderRosterStatus(); }
function FB_clearTransfersIn() { FB_TRANSFER_IN_STUDENTS = []; FB_renderRosterStatus(); }
function FB_loadRosterList(input) {
    const file = input.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            FB_ROSTER_ROWS = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).map(fbRosterRow).filter(Boolean);
            FB_ROSTER_RECONCILIATION = null;
            FB_renderRosterStatus();
            window.UI.alert(`✅ 学籍名单导入 ${FB_ROSTER_ROWS.length} 人。`, 'success');
            // 允许用户修正后再次选择同一个文件时仍触发 change。
            input.value = '';
        } catch (err) { window.UI.alert('学籍名单读取失败：' + err.message, 'error'); }
    };
    reader.readAsArrayBuffer(file);
}
function FB_loadDropoutList(input) {
    const file = input.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            FB_DROPOUT_STUDENTS = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]).map(fbRosterRow).filter(Boolean);
            FB_renderRosterStatus();
            window.UI.alert(`✅ 辍学名单导入 ${FB_DROPOUT_STUDENTS.length} 人；命中的考试学生将改为后置均衡分配。`, 'success');
        } catch (err) { window.UI.alert('辍学名单读取失败：' + err.message, 'error'); }
    };
    reader.readAsArrayBuffer(file);
}
function fbExamRosterRows(exams) {
    // 不同考试的考号可能重新编排；先按姓名+性别做跨考试合并，
    // 同名学生仍保留同场考试中的最大出现人数，避免把同一届学生重复算成多人。
    const groups = new Map();
    exams.forEach(ex => {
        const perExam = new Map();
        (ex.data || []).forEach(raw => {
            if (!fbExamBelongsToCurrentSchool(raw, ex.meta)) return;
            const row = fbRosterRow(raw); if (!row) return;
            const key = `${row.name}|${row.gender || ''}`;
            const list = perExam.get(key) || [];
            list.push(row); perExam.set(key, list);
        });
        perExam.forEach((list, key) => {
            const prev = groups.get(key);
            if (!prev || list.length > prev.rows.length) groups.set(key, { rows: list });
        });
    });
    return [...groups.values()].flatMap(group => group.rows);
}
function fbIsDropout(row) { return !!row && FB_DROPOUT_STUDENTS.some(student => fbFindRosterMatch(row, [student])); }
async function FB_reconcileRoster(exams) {
    if (!FB_ROSTER_ROWS.length) return true;
    const examRows = fbExamRosterRows(exams);
    const rosterOnly = FB_ROSTER_ROWS.filter(row => !fbFindRosterMatch(row, examRows));
    const examOnly = examRows.filter(row => !fbFindRosterMatch(row, FB_ROSTER_ROWS));
    const autoTransferred = rosterOnly.filter(row => fbFindRosterMatch(row, FB_TRANSFER_STUDENTS));
    // 已登记为转出/辍学/转入的考试名单外学生不再重复弹窗；
    // 尤其是考试名单有、学籍名单无但管理员已确认休学的学生，
    // 需要沿用该决定，避免每次生成都再次提示。
    const unresolved = [
        ...rosterOnly.filter(row => !fbIsTransferred(row) && !fbIsDropout(row)).map(row => ({ side: '学籍名单有、考试名单无', row })),
        ...examOnly.filter(row => !fbIsTransferred(row) && !fbIsDropout(row) && !FB_TRANSFER_IN_STUDENTS.some(student => fbFindRosterMatch(row, [student]))).map(row => ({ side: '考试名单有、学籍名单无', row }))
    ];
    if (!unresolved.length) { FB_ROSTER_RECONCILIATION = { rosterCount: FB_ROSTER_ROWS.length, examCount: examRows.length, autoTransferred, decisions: [], examOnly }; FB_UNEXAM_ROSTER_STUDENTS = []; return true; }
    const Swal = window.Swal && typeof window.Swal.fire === 'function' ? window.Swal : null;
    if (!Swal) { await window.UI.alert(`学籍与考试名单有 ${unresolved.length} 项不一致，请补充转出登记后再生成。`, 'warning'); return false; }
    const rowsHtml = unresolved.map((item, i) => {
        const examOnly = item.side === '考试名单有、学籍名单无';
        const defaultOption = examOnly ? '<option value="exam_present" selected>在校参加考试（按学籍处理）</option>' : '<option value="">请选择原因</option>';
        return `<tr><td>${i + 1}</td><td>${item.row.name}</td><td>${item.row.gender === 'M' ? '男' : item.row.gender === 'F' ? '女' : '未填'}</td><td>${item.side}</td><td><select data-fb-reconcile="${i}" style="width:100%;">${defaultOption}<option value="transfer">转出/已离校</option><option value="dropout">辍学/长期离校（不参与分班）</option><option value="not_exam">在校但本次未参加考试（后置分配）</option><option value="transfer_in">转入/临时在校（后置分配）</option><option value="not_enrolled">不在校/不参与本次分班</option><option value="data_error">姓名或性别信息错误（按在校处理）</option><option value="other">其他原因（按在校处理）</option></select></td></tr>`;
    }).join('');
    const result = await Swal.fire({ title: '学籍与考试名单不一致', html: `<div style="text-align:left;font-size:13px;margin-bottom:8px;">已自动匹配转出 ${autoTransferred.length} 人。考试名单有、学籍名单无的学生默认按“在校参加考试”处理并参与分班；学籍名单有、考试名单无的学生如确属辍学/长期离校，请选择对应原因，否则会按后置学生分配。</div><div style="max-height:360px;overflow:auto;"><table style="width:100%;font-size:12px;"><thead><tr><th>#</th><th>姓名</th><th>性别</th><th>差异</th><th>管理员确认原因</th></tr></thead><tbody>${rowsHtml}</tbody></table></div>`, showCancelButton: true, confirmButtonText: '确认并继续', cancelButtonText: '返回补充', width: 900, preConfirm: () => { const decisions = unresolved.map((_, i) => document.querySelector(`[data-fb-reconcile="${i}"]`)?.value || ''); if (decisions.some(v => !v)) { Swal.showValidationMessage('请为所有差异选择原因。'); return false; } return decisions; } });
    if (!result.isConfirmed) return false;
    const decisions = unresolved.map((item, i) => ({ ...item, reason: result.value[i] }));
    FB_UNEXAM_ROSTER_STUDENTS = decisions.filter(item => item.side === '学籍名单有、考试名单无' && !['transfer', 'not_enrolled'].includes(item.reason)).map(item => ({ ...item.row, postType: item.reason === 'dropout' ? '辍学/长期离校' : '学籍在册未考试' }));
    const decisionTransferIns = decisions.filter(item => item.side === '考试名单有、学籍名单无' && item.reason === 'transfer_in').map(item => item.row);
    const decisionTransfers = decisions.filter(item => item.side === '考试名单有、学籍名单无' && ['transfer', 'not_enrolled'].includes(item.reason)).map(item => item.row);
    const decisionDropouts = decisions.filter(item => item.side === '考试名单有、学籍名单无' && item.reason === 'dropout').map(item => item.row);
    // 将本次核对中确认休学的考试学生写回辍学集合，后续聚合时完全排除，
    // 并在再次生成时复用决定，不再重复弹窗。
    FB_DROPOUT_STUDENTS = [...FB_DROPOUT_STUDENTS, ...decisionDropouts.filter(row => !FB_DROPOUT_STUDENTS.some(student => fbFindRosterMatch(row, [student])))];
    FB_TRANSFER_IN_STUDENTS = [...FB_TRANSFER_IN_STUDENTS, ...decisionTransferIns.filter(row => !FB_TRANSFER_IN_STUDENTS.some(s => fbFindRosterMatch(row, [s])))];
    FB_TRANSFER_STUDENTS = [...FB_TRANSFER_STUDENTS, ...decisionTransfers.filter(row => !FB_TRANSFER_STUDENTS.some(s => fbFindRosterMatch(row, [s])))];
    FB_ROSTER_RECONCILIATION = { rosterCount: FB_ROSTER_ROWS.length, examCount: examRows.length, autoTransferred, decisions, examOnly };
    return true;
}

// 聚合最近 N 次云端成绩 → FB_STUDENTS（含分班分 + 性别 + 违纪 + 重名检测）。
// weights: 最近→次近→再次 的权重（默认最近2次 6:4）。
async function FB_assembleFromCloud(options = {}) {
    const targetGrade = fbLockedTargetGrade();
    const examLimit = Math.max(1, Math.min(Number(options.examLimit || document.getElementById('fb_exam_count')?.value || 2), 3));
    const exams = fbGetRecentExams(examLimit, targetGrade);
    if (!exams.length) {
        window.UI.alert('未找到本届别的云端考试数据，请先在「数据准备」上传并同步成绩。');
        return null;
    }
    if (!await FB_reconcileRoster(exams)) return null;
    const examRoster = fbExamRosterRows(exams);
    const dropoutRows = [...FB_ROSTER_ROWS, ...examRoster].filter(fbIsDropout);
    dropoutRows.forEach((row) => {
        if (!FB_UNEXAM_ROSTER_STUDENTS.some(student => fbFindRosterMatch(row, [student]))) FB_UNEXAM_ROSTER_STUDENTS.push({ ...row, postType: '辍学/长期离校' });
    });
    const notEnrolledRows = (FB_ROSTER_RECONCILIATION?.decisions || []).filter(item => item.side === '考试名单有、学籍名单无' && item.reason === 'not_enrolled').map(item => item.row);
    const notEnrolledKeys = new Set(notEnrolledRows.map(fbRosterIdentity));
    const notEnrolledNames = new Set(notEnrolledRows.map(row => row.name));
    // 默认权重：最近一次最高。2次=[0.6,0.4]，3次=[0.5,0.3,0.2]，主要依据最后2次。
    const defaultWeights = exams.length >= 3 ? [0.5, 0.3, 0.2] : (exams.length === 2 ? [0.6, 0.4] : [1]);
    const weights = Array.isArray(options.weights) && options.weights.length === exams.length ? options.weights : defaultWeights;

    // 按学生 key 聚合。
    const byKey = new Map();          // key -> { name, id, class, wSum, scoreSum, examsGot }
    const nameExamRows = new Map();   // 归一化姓名 -> Map(考试ID -> { count, ids })；仅同场重复才判定重名
    exams.forEach((ex, ei) => {
        const w = weights[ei] || 0;
        ex.data.forEach((row) => {
            if (!fbExamBelongsToCurrentSchool(row, ex.meta)) return;
            const rosterRow = fbRosterRow(row);
            if (rosterRow && (fbIsDropout(rosterRow) || FB_TRANSFER_IN_STUDENTS.some(student => fbFindRosterMatch(rosterRow, [student])) || fbIsTransferred(rosterRow))) return;
            const nm = fbNormalizeName(row.name);
            if (nm) {
                if (!nameExamRows.has(nm)) nameExamRows.set(nm, new Map());
                const examRows = nameExamRows.get(nm);
                const record = examRows.get(ex.examId) || { count: 0, ids: new Set() };
                record.count += 1;
                const rowId = fbNormalizeId(row.id || row.examNo || row.studentId);
                if (rowId) record.ids.add(rowId);
                examRows.set(ex.examId, record);
            }
            const s = fbExamAssignmentScore(row, targetGrade);
            if (!s) return;
            // 第一轮按考号/学号聚合仅用于兼容旧数据结构，稳定键会在下方统一重建；
            // 这里必须先明确学生键，避免生成流程因未定义变量直接中断。
            const key = fbStudentKey(row);
            if (!byKey.has(key)) {
                byKey.set(key, {
                    name: row.name || '未知', id: fbNormalizeId(row.id || row.examNo || row.studentId), class: row.class || '',
                    wSum: 0, scoreSum: 0, examsGot: 0,
                    // 主科（语数英）分别累加加权分，用于每科每班均衡。
                    subj: Object.fromEntries(fbMajorSubjectsForGradeValue(targetGrade).map(sub => [sub, { s: 0, w: 0 }]))
                });
            }
            const agg = byKey.get(key);
            agg.wSum += w;
            agg.scoreSum += s.score * w;
            agg.examsGot += 1;
            const rowScores = (row && row.scores && typeof row.scores === 'object') ? row.scores : {};
            fbMajorSubjectsForGradeValue(targetGrade).forEach((sub) => {
                const v = Number(rowScores[sub]);
                if (Number.isFinite(v)) { agg.subj[sub].s += v * w; agg.subj[sub].w += w; }
            });
        });
    });

    // 非重名学生优先按归一化姓名跨考试聚合，避免不同考试更换考号后被拆成多人；
    // 同场重名仍使用考号/学号，保留人工核对提示。
    const duplicateNames = new Set();
    nameExamRows.forEach((examMap, nm) => {
        if ([...examMap.values()].some(record => record.count > 1)) duplicateNames.add(nm);
    });
    const stableKey = (row) => {
        const nm = fbNormalizeName(row && row.name);
        return duplicateNames.has(nm) ? fbStudentKey(row) : `name:${nm}`;
    };
    // 上面的预扫描只建立重名集合；重新装配时使用稳定键。
    const stableByKey = new Map();
    exams.forEach((ex, ei) => {
        const w = weights[ei] || 0;
        ex.data.forEach((row) => {
            // 第二轮会覆盖第一轮聚合结果，因此必须重复执行本校过滤。
            // 此处若遗漏，会把县域整场考试的学生重新合并进本校分班名单。
            if (!fbExamBelongsToCurrentSchool(row, ex.meta)) return;
            const rosterRow = fbRosterRow(row);
            if (rosterRow && (fbIsDropout(rosterRow) || FB_TRANSFER_IN_STUDENTS.some(student => fbFindRosterMatch(rosterRow, [student])) || fbIsTransferred(rosterRow))) return;
            const s = fbExamAssignmentScore(row, targetGrade); if (!s) return;
            const key = stableKey(row);
            const nm = fbNormalizeName(row.name);
            if (!stableByKey.has(key)) stableByKey.set(key, { row, wSum: 0, scoreSum: 0, examsGot: 0, subj: Object.fromEntries(fbMajorSubjectsForGradeValue(targetGrade).map(sub => [sub, { s: 0, w: 0 }])) });
            const agg = stableByKey.get(key);
            agg.wSum += w; agg.scoreSum += s.score * w; agg.examsGot += 1;
            const rowScores = (row && row.scores && typeof row.scores === 'object') ? row.scores : {};
            fbMajorSubjectsForGradeValue(targetGrade).forEach((sub) => { const v = Number(rowScores[sub]); if (Number.isFinite(v)) { agg.subj[sub].s += v * w; agg.subj[sub].w += w; } });
            if (!agg.row.name && nm) agg.row = row;
        });
    });
    // 用稳定键结果替换前面按原始考号聚合的结果。
    byKey.clear();
    stableByKey.forEach((agg, key) => {
        const row = agg.row || {};
        byKey.set(key, { name: row.name || '未知', id: fbNormalizeId(row.id || row.examNo || row.studentId), class: row.class || '', wSum: agg.wSum, scoreSum: agg.scoreSum, examsGot: agg.examsGot, subj: agg.subj });
    });

    // 重名组（同名但多考号 / 或同名仅姓名匹配）。
    const dupGroups = [];
    nameExamRows.forEach((examMap, nm) => {
        examMap.forEach((record, examId) => {
            if (record.count > 1) {
                dupGroups.push({ name: nm, examId, ids: [...record.ids], count: record.count });
            }
        });
    });

    // 组装 FB_STUDENTS（沿用既有 shape：score/gender/isDiff/constraints/...）。
    let idx = 0, missingGender = 0, missingScore = 0;
    const students = [];
    byKey.forEach((agg, key) => {
        const score = agg.wSum > 0 ? (agg.scoreSum / agg.wSum) : 0;
        if (agg.wSum <= 0) missingScore += 1;
        const normalizedName = fbNormalizeName(agg.name);
        const normalizedId = fbNormalizeId(agg.id);
        // 优先考号/学号，再按姓名匹配；旧逻辑只查 stable name key，
        // 会漏掉带考号的性别名单，进而把大量未知性别误计为女生。
        let gender = (normalizedId && FB_GENDER_MAP['id:' + normalizedId])
            || FB_GENDER_MAP[key]
            || FB_GENDER_MAP['name:' + normalizedName];
        if (!gender) {
            const sourceRow = stableByKey.get(key)?.row;
            const sourceGender = fbRosterRow(sourceRow)?.gender;
            gender = sourceGender || 'U';
        }
        if (gender === 'U') missingGender += 1;
        const isViol = !!(FB_VIOLATION_SET[key] || FB_VIOLATION_SET['name:' + fbNormalizeName(agg.name)]);
        // 各主科加权平均分（缺该科则为 null，不计入该科均衡）。
        const subjAvg = {};
        fbMajorSubjectsForGradeValue(targetGrade).forEach((sub) => {
            const rec = agg.subj && agg.subj[sub];
            subjAvg[sub] = (rec && rec.w > 0) ? (rec.s / rec.w) : null;
        });
        students.push({
            _id: idx++, key, name: agg.name, id: agg.id, srcClass: agg.class,
            gender, score: parseFloat(score.toFixed(2)),
            subjAvg,
            examsGot: agg.examsGot, examsTotal: exams.length,
            height: 160, vision: 5.0, isNotEnrolled: notEnrolledKeys.has(fbRosterIdentity({ name: agg.name, id: agg.id, gender })) || notEnrolledNames.has(fbNormalizeName(agg.name)),
            isDiff: isViol, isViolation: isViol,
            remarks: '', constraints: { same: [], diff: [] }, classIdx: -1
        });
    });

    FB_STUDENTS = students;
    FB_LAST_ASSEMBLY = {
        targetGrade, examCount: exams.length,
        examLabels: exams.map((e) => `${e.label}${e.dateStr ? '(' + e.dateStr + ')' : ''}`),
        weights, matched: students.length, dupGroups,
        missingGender, missingScore,
        violationTotal: students.filter((s) => s.isViolation).length,
        genderUploaded: Object.keys(FB_GENDER_MAP).length > 0,
        violationUploaded: Object.keys(FB_VIOLATION_SET).length > 0
    };
    FB_refreshFixedAssignmentUI();
    FB_refreshSameClassUI();
    return FB_LAST_ASSEMBLY;
}

// 性别名单上传（独立表）：姓名 + 性别 [+ 考号]。
function FB_loadGenderList(input) {
    const file = input.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            FB_GENDER_MAP = {}; FB_GENDER_NAMES = [];
            const seen = new Map();
            json.forEach((r) => {
                const nm = fbNormalizeName(r['姓名'] || r['名字'] || r['Name']);
                if (!nm) return;
                const g = fbParseGender(r['性别'] || r['Gender'] || r['gender']);
                if (g === 'U') return;
                const rawId = fbNormalizeId(r['考号'] || r['学号'] || r['准考证号'] || '');
                const key = rawId ? 'id:' + rawId : 'name:' + nm;
                FB_GENDER_MAP[key] = g;
                if (!rawId) FB_GENDER_MAP['name:' + nm] = g;
                FB_GENDER_NAMES.push(nm);
                seen.set(nm, (seen.get(nm) || 0) + 1);
            });
            const dups = [...seen.entries()].filter(([, c]) => c > 1).map(([n]) => n);
            let msg = `✅ 性别名单导入 ${FB_GENDER_NAMES.length} 人。`;
            if (dups.length) msg += `\n⚠️ 检测到 ${dups.length} 个重名：${dups.slice(0, 8).join('、')}${dups.length > 8 ? '…' : ''}\n重名建议在名单中补「考号」列以精确匹配。`;
            window.UI.alert(msg);
            FB_updateAssemblyStatus();
        } catch (err) { window.UI.alert('性别名单读取失败：' + err.message); }
    };
    reader.readAsArrayBuffer(file);
}

// 违纪名单上传（独立表）：姓名 [+ 考号]。
function FB_loadViolationList(input) {
    const file = input.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
            const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            FB_VIOLATION_SET = {}; FB_VIOLATION_NAMES = [];
            const seen = new Map();
            json.forEach((r) => {
                const nm = fbNormalizeName(r['姓名'] || r['名字'] || r['Name']);
                if (!nm) return;
                const rawId = fbNormalizeId(r['考号'] || r['学号'] || r['准考证号'] || '');
                const key = rawId ? 'id:' + rawId : 'name:' + nm;
                FB_VIOLATION_SET[key] = true;
                if (!rawId) FB_VIOLATION_SET['name:' + nm] = true;
                FB_VIOLATION_NAMES.push(nm);
                seen.set(nm, (seen.get(nm) || 0) + 1);
            });
            const dups = [...seen.entries()].filter(([, c]) => c > 1).map(([n]) => n);
            let msg = `✅ 违纪名单导入 ${FB_VIOLATION_NAMES.length} 人。`;
            if (dups.length) msg += `\n⚠️ 检测到 ${dups.length} 个重名：${dups.slice(0, 8).join('、')}${dups.length > 8 ? '…' : ''}\n重名建议补「考号」列。`;
            window.UI.alert(msg);
            FB_updateAssemblyStatus();
        } catch (err) { window.UI.alert('违纪名单读取失败：' + err.message); }
    };
    reader.readAsArrayBuffer(file);
}

// 切换成绩来源：cloud 隐藏手动 Excel 上传，manual 显示。
function FB_toggleDataSource() {
    const src = document.getElementById('fb_data_source')?.value || 'cloud';
    const manualRow = document.getElementById('fb_manual_upload_row');
    const cloudStatus = document.getElementById('fb_assembly_status');
    if (manualRow) manualRow.style.display = (src === 'manual') ? 'flex' : 'none';
    if (cloudStatus) cloudStatus.style.display = (src === 'manual') ? 'none' : 'block';
}

// 声明式事件绑定：把本模块原先散在 index.html 上的内联 onclick/onchange
// 收敛为 data-fb-pick（点击代理到隐藏 file input）和 data-fb-change（change
// 转发到同名 FB_* 函数）。行为与内联属性完全等价——两者都依赖本运行时按需
// 加载完成后 FB_* 才存在，而本函数就在加载末尾调用。
// 幂等：每个节点用 dataset 标记，重复调用不会重复绑定。
function FB_bindDeclarativeHandlers(root = document) {
    const scope = root && typeof root.querySelectorAll === 'function' ? root : document;

    scope.querySelectorAll('[data-fb-pick]').forEach((box) => {
        if (box.dataset.fbPickBound === '1') return;
        box.dataset.fbPickBound = '1';
        box.addEventListener('click', () => {
            const target = document.getElementById(String(box.dataset.fbPick || '').trim());
            if (target) target.click();
        });
    });

    scope.querySelectorAll('[data-fb-change]').forEach((el) => {
        if (el.dataset.fbChangeBound === '1') return;
        el.dataset.fbChangeBound = '1';
        el.addEventListener('change', () => {
            const handlerName = String(el.dataset.fbChange || '').trim();
            // 只允许调用本模块导出的 FB_* 入口,避免 data 属性变成任意函数跳板。
            if (!/^FB_[A-Za-z0-9_]+$/.test(handlerName)) return;
            const handler = window[handlerName];
            if (typeof handler === 'function') handler(el);
        });
    });

    scope.querySelectorAll('[data-fb-action]').forEach((el) => {
        if (el.dataset.fbActionBound === '1') return;
        el.dataset.fbActionBound = '1';
        el.addEventListener('click', () => {
            const action = String(el.dataset.fbAction || '').trim();
            if (action === 'add-fixed') FB_addFixedAssignment();
            if (action === 'clear-fixed') FB_clearFixedAssignments();
            if (action === 'remove-fixed') FB_removeFixedAssignment(el.dataset.fbStudent);
            if (action === 'add-same-member') FB_addSameClassMember();
            if (action === 'remove-same-draft') FB_removeSameClassDraft(el.dataset.fbStudent);
            if (action === 'create-same-group') FB_createSameClassGroup();
            if (action === 'remove-same-group') FB_removeSameClassGroup(el.dataset.fbGroupId);
            if (action === 'clear-same-groups') FB_clearSameClassGroups();
            if (action === 'add-transfer') FB_addTransferStudent();
            if (action === 'clear-transfers') FB_clearTransfers();
            if (action === 'remove-transfer') FB_removeTransferStudent(el.dataset.fbIndex);
            if (action === 'add-dropout') FB_addDropoutStudent();
            if (action === 'clear-dropouts') FB_clearDropouts();
            if (action === 'remove-dropout') FB_removeDropoutStudent(el.dataset.fbIndex);
            if (action === 'add-transfer-in') FB_addTransferInStudent();
            if (action === 'clear-transfers-in') FB_clearTransfersIn();
            if (action === 'remove-transfer-in') FB_removeTransferInStudent(el.dataset.fbIndex);
        });
    });
    // 班级卡片是运行时动态生成的，违纪人数按钮使用文档级委托确保
    // 重绘后仍可点击，并阻止事件冒泡到“打开座位编排”的卡片处理器。
    if (!document.documentElement.dataset.fbViolationDelegated) {
        document.documentElement.dataset.fbViolationDelegated = '1';
        document.addEventListener('click', (event) => {
            const trigger = event.target?.closest?.('[data-fb-action="view-violations"]');
            if (!trigger) return;
            event.preventDefault();
            event.stopPropagation();
            FB_viewClassViolations(Number(trigger.dataset.fbClassId));
        });
    }
}

// 数据体检状态条（显示匹配/缺项/违纪/重名概况）。
function FB_updateAssemblyStatus() {
    const el = document.getElementById('fb_assembly_status');
    if (!el) return;
    const genderN = Object.keys(FB_GENDER_MAP).length;
    const violN = FB_VIOLATION_NAMES.length;
    el.innerHTML = `已载入性别名单 <strong>${FB_GENDER_NAMES.length}</strong> 人 · 违纪名单 <strong>${violN}</strong> 人。点击「生成分班方案」将读取本届别最近考试成绩并聚合。`;
    FB_renderRosterStatus();
}

function FB_loadData(input) {
    const file = input.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result); const wb = XLSX.read(data, { type: 'array' }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            if (!json.length) throw new Error("Excel没有数据");
            const manualSubjects = fbMajorSubjectsForGradeValue(fbLockedTargetGrade());
            FB_STUDENTS = json.map((r, i) => {
                const remarks = String(r['备注'] || r['说明'] || ""); const sameMatch = remarks.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:同班|一起|一班)/); const diffMatch = remarks.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:分开|不同班|不在一起)/);
                const subjAvg = Object.fromEntries(manualSubjects.map((subject) => {
                    const raw = r[subject] ?? r[`${subject}成绩`] ?? r[`${subject}分数`];
                    const value = Number(raw);
                    return [subject, Number.isFinite(value) ? value : null];
                }));
                return { _id: i, name: r['姓名'] || '未知', gender: fbParseGender(r['性别'] || r['Gender']), score: parseFloat(r['总分'] || r['语数英'] || 0), subjAvg, height: parseFloat(r['身高'] || 160), vision: parseFloat(r['视力'] || r['左眼'] || 5.0), isDiff: (String(r['难管'] || "").includes('是') || remarks.includes('难管') || remarks.includes('调皮')), remarks: remarks, constraints: { same: sameMatch ? [sameMatch[1]] : [], diff: diffMatch ? [diffMatch[1]] : [] }, classIdx: -1 };
            });
            // 兼容旧版备注规则：将“和XX同班”转成同班组合硬约束。
            const byName = new Map(FB_STUDENTS.map(s => [fbNormalizeName(s.name), s]));
            FB_STUDENTS.forEach(student => (student.constraints?.same || []).forEach(name => {
                const other = byName.get(fbNormalizeName(name));
                if (!other || other === student) return;
                const ids = [fbStudentIdentity(student), fbStudentIdentity(other)].sort();
                if (!FB_SAME_CLASS_GROUPS.some(g => ids.every(id => g.members.includes(id)))) fbMergeSameClassPair(ids[0], ids[1]);
            }));
            // 手动导入 Excel → 切到 manual 模式，使 FB_runDivision 用这批学生而非覆盖为云端聚合。
            const srcSel = document.getElementById('fb_data_source');
            if (srcSel) { srcSel.value = 'manual'; if (typeof FB_toggleDataSource === 'function') FB_toggleDataSource(); }
            window.UI.alert(`✅ 导入成功！共 ${FB_STUDENTS.length} 人。`); document.getElementById('fb-results-area').classList.add('hidden');
            FB_refreshFixedAssignmentUI();
            FB_refreshSameClassUI();
        } catch (err) { window.UI.alert("读取失败：" + err.message); }
    }; reader.readAsArrayBuffer(file);
}

function calculateQuartiles(sortedData) {
    const q2 = calculateMedian(sortedData); const midIndex = Math.floor(sortedData.length / 2); const lowerHalf = sortedData.slice(0, midIndex); const upperHalf = sortedData.slice((sortedData.length % 2 === 0) ? midIndex : midIndex + 1); const q1 = calculateMedian(lowerHalf); const q3 = calculateMedian(upperHalf); return { q1, q2, q3 };
}
function calculateMedian(sortedData) { const mid = Math.floor(sortedData.length / 2); return sortedData.length % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2; }
function calculateSD(data) { const n = data.length; if (n === 0) return 0; const mean = data.reduce((a, b) => a + b, 0) / n; const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n; return Math.sqrt(variance); }

// 1. 主入口：运行分班
async function FB_runDivision() {
    // 数据源模式：cloud = 读云端最近N次成绩聚合（新默认）；manual = 沿用单次 Excel 导入。
    const sourceEl = document.getElementById('fb_data_source');
    const source = sourceEl ? sourceEl.value : 'cloud';
    if (source === 'cloud') {
        const assembly = await FB_assembleFromCloud();
        if (!assembly) return; // 无云端数据，已弹提示
        // 重名弹窗：装配阶段发现重名 → 明确提示人工核对（阻断前先确认）。
        if (assembly.dupGroups && assembly.dupGroups.length) {
            const list = assembly.dupGroups.slice(0, 12).map((g) => `· ${g.name}（${g.count || g.ids.length} 人${g.examId ? `，${g.examId}` : ''}）`).join('\n');
            const more = assembly.dupGroups.length > 12 ? `\n…共 ${assembly.dupGroups.length} 组` : '';
            const proceed = await window.UI.confirm(
                `⚠️ 检测到 ${assembly.dupGroups.length} 组重名学生，成绩/性别/违纪可能匹配错乱：\n${list}${more}\n\n`
                + `建议在性别/违纪名单中补「考号」列以精确匹配。\n是否仍按当前匹配继续分班？`
            );
            if (!proceed) return;
        }
        if (assembly.missingGender > 0) {
            // 缺性别不阻断，但提示（默认按女生处理会影响男女均衡）。
            window.UI && window.UI.toast && window.UI.toast(`⚠️ ${assembly.missingGender} 人未匹配到性别，已标记为未填，不计入男女比例；建议补全性别名单`, 'warning');
        }
    }
    if (!FB_STUDENTS.length) return window.UI.alert(source === 'cloud' ? "云端未聚合到学生成绩，请检查考试数据与名单。" : "请先导入数据");

    // 获取参数
    const k = parseInt(document.getElementById('fb_cls_num').value) || 6;
    // 本校分班安全阈值：银山实验学校单班不超过 60 人。
    // 若考试数据仍混入其他学校，先阻断生成并明确提示，不允许导出错误方案。
    const maxStudentsForClasses = k * 60;
    if (FB_STUDENTS.length > maxStudentsForClasses) {
        FB_CLASSES = writeFbClasses([]);
        FB_SCHEMES_CACHE = [];
        document.getElementById('fb-results-area')?.classList.add('hidden');
        return window.UI.alert(`当前本校分班名单 ${FB_STUDENTS.length} 人，超过 ${k} 个班 × 60 人的安全上限（${maxStudentsForClasses} 人）。已停止生成，请检查考试数据的学校字段或届别筛选。`, 'error');
    }
    const algo = document.getElementById('fb_algorithm').value;
    const fixedCounts = fbCountFixedAssignments(k);
    const fixedErrors = fbValidateFixedAssignments(k);
    if (fixedErrors.length) {
        return window.UI.alert(`指定班级检查未通过：\n\n${fixedErrors.slice(0, 6).map(item => `· ${item}`).join('\n')}`);
    }
    const sameErrors = fbValidateSameClassGroups(k);
    if (sameErrors.length) {
        return window.UI.alert(`同班组合检查未通过：\n\n${sameErrors.slice(0, 8).map(item => `· ${item}`).join('\n')}`);
    }
    const activeIdentities = new Set(fbFixedAssignmentCandidates().map(fbStudentIdentity));
    const staleAssignments = Object.keys(FB_FIXED_ASSIGNMENTS).filter(identity => !activeIdentities.has(identity));
    if (staleAssignments.length) {
        return window.UI.alert(`有 ${staleAssignments.length} 条指定班级记录未匹配到当前学生名单，请移除后再生成，避免把上一届设置误用于本届。`);
    }
    const maxPerClass = Math.ceil(FB_STUDENTS.length / k);
    const overloadedClass = fixedCounts.findIndex(count => count > maxPerClass);
    if (overloadedClass >= 0) {
        return window.UI.alert(`第 ${overloadedClass + 1} 班已有 ${fixedCounts[overloadedClass]} 名锁定学生，超过当前人数上限 ${maxPerClass} 人；请调整指定班级或增加班级数。`);
    }
    FB_refreshFixedAssignmentUI();
    const btn = document.querySelector('button[onclick="FB_runDivision()"]');

    // UI 反馈
    btn.innerHTML = '⏳ 正在运算多套方案...';
    btn.disabled = true;

    // 使用 setTimeout 让 UI 有机会渲染 Loading 状态
    setTimeout(async () => {
      try {
        FB_SCHEMES_CACHE = [];

        // 如果是蛇形分班，因为是固定的，只生成 1 套
        // 如果是智能优化，生成 3 套供选择
        const runs = (algo === 'snake') ? 1 : 3;

        for (let i = 0; i < runs; i++) {
            const classes = FB_generateSingleScheme(k, algo);
            const examClasses = JSON.parse(JSON.stringify(classes));
            FB_appendRosterOnlyStudents(classes, k);
            // 后置学生加入后再次校正，确保最终名单的男女数量也保持接近。
            fbBalanceGenderCounts(classes, k);
            classes.forEach(c => { c.stats = fbCalcClassStats(c.students); });
            const finalClasses = JSON.parse(JSON.stringify(classes));
            // 计算该方案的评分 (极差)
            const avgs = classes.map(c => c.stats.avg);
            const range = Math.max(...avgs) - Math.min(...avgs);
            const sd = calculateSD(avgs);
            // 优秀率是本模块的首要均衡指标；以主科各班优秀率极差作为方案主排序键。
            const excellentRanges = fbMajorSubjectsForGrade()
                .map((subject) => fbSubjectMetric(examClasses, subject).map((metric) => metric.excellent).filter(Number.isFinite))
                .filter((values) => values.length > 1)
                .map((values) => Math.max(...values) - Math.min(...values));
            const excellentRange = excellentRanges.length ? Math.max(...excellentRanges) : 0;
            const excellentRangeAvg = excellentRanges.length ? excellentRanges.reduce((sum, value) => sum + value, 0) / excellentRanges.length : 0;

            FB_SCHEMES_CACHE.push({
                id: i,
                name: runs === 1 ? '标准方案' : `方案 ${String.fromCharCode(65 + i)}`, // 方案A, 方案B...
                data: classes,
                examData: examClasses,
                finalData: finalClasses,
                range: range,
                excellentRange,
                excellentRangeAvg,
                sd: sd,
                desc: `优秀率极差 ${(excellentRange * 100).toFixed(1)} 个百分点 · 均分极差 ${range.toFixed(2)}`
            });
        }

        // 渲染方案选择器
        FB_renderSchemeSelector();

        // 默认应用均分极差最小（最均衡）的方案
        // 先比较主科优秀率极差，再比较均分极差；确保优秀率均衡优先。
        const bestScheme = [...FB_SCHEMES_CACHE].sort((a, b) => (a.excellentRange - b.excellentRange) || (a.range - b.range))[0];
        FB_applyScheme(bestScheme.id);

        // 显示区域
        document.getElementById('fb-results-area').classList.remove('hidden');
        const schemePanel = document.getElementById('fb-scheme-panel');
        if (runs > 1) {
            if (schemePanel) schemePanel.classList.remove('hidden');
        } else {
            if (schemePanel) schemePanel.classList.add('hidden');
        }

      } catch (err) {
        console.error('[freshman] division failed', err);
        const message = err && err.message ? err.message : String(err);
        if (window.UI && typeof window.UI.alert === 'function') await window.UI.alert(`分班方案生成失败：${message}`, 'error');
        else window.alert(`分班方案生成失败：${message}`);
      } finally {
        btn.innerHTML = '🚀 开始智能分班';
        btn.disabled = false;
      }
    }, 100);
}

function FB_appendRosterOnlyStudents(classes, k) {
    const postStudents = [
        // 保留核对阶段标记的辍学类型；普通学籍有、考试无才归为在册未考。
        ...FB_UNEXAM_ROSTER_STUDENTS.map(row => ({ ...row, postType: row.postType || '学籍在册未考试' })),
        ...FB_TRANSFER_IN_STUDENTS.map(row => ({ ...row, postType: '新转入' }))
    ];
    if (!postStudents.length) return;
    const alreadyPlaced = new Set(classes.flatMap(cls => (cls.students || []).map(fbStudentIdentity)));
    postStudents.forEach((row, index) => {
        const rowStudent = { name: row.name, id: row.id, gender: row.gender || 'U' };
        if (alreadyPlaced.has(fbStudentIdentity(rowStudent))) return;
        const fixedClass = fbGetFixedClass(rowStudent, k);
        const ranked = classes.map((cls, classIdx) => ({
            cls, classIdx,
            noExam: cls.students.filter(fbIsNoExamStudent).length,
            notEnrolled: cls.students.filter(s => s.isNotEnrolled).length,
            maleRatio: cls.students.length ? cls.students.filter(s => s.gender === 'M').length / cls.students.length : 0
        })).sort((a, b) => (a.noExam - b.noExam) || (a.notEnrolled - b.notEnrolled) || (Math.abs((row.gender === 'M' ? 1 : 0) - a.maleRatio) - Math.abs((row.gender === 'M' ? 1 : 0) - b.maleRatio)) || (a.classIdx - b.classIdx));
        const picked = fixedClass >= 0 ? { cls: classes[fixedClass], classIdx: fixedClass } : ranked[0];
        if (!picked) return;
        const isTransferIn = row.postType === '新转入';
        const isDropout = row.postType === '辍学/长期离校' || row.postType === 'dropout';
        picked.cls.students.push({ _id: `roster-${index}`, key: `roster:${fbRosterIdentity(row)}`, name: row.name, id: row.id, gender: row.gender || 'U', score: 0, subjAvg: {}, examsGot: 0, examsTotal: 0, height: 160, vision: 5, isNoExam: true, postType: isTransferIn ? 'transfer-in' : isDropout ? 'dropout' : 'roster-no-exam', isNotEnrolled: false, isDiff: false, isViolation: false, isFixedAssignment: fixedClass >= 0, remarks: isTransferIn ? '新转入学生，后置均衡分配' : isDropout ? '辍学/长期离校，按要求后置均衡分配' : '学籍在册，本次未参加考试', constraints: { same: [], diff: [] }, classIdx: picked.classIdx });
        alreadyPlaced.add(fbStudentIdentity(rowStudent));
    });
    classes.forEach(c => { c.stats = fbCalcClassStats(c.students); });
}

// 严格男女均衡的二次校正：智能交换可能因均分/主科/违纪等多重代价停在
// 男女差距较大的局部最优。这里在不移动人工锁定学生、不破坏互斥约束的前提下，
// 从男生最多的班与男生最少的班交换一名男女生，直到已知性别人数相差不超过 1 人，
// 同时优先选择成绩接近且综合代价增量最小的交换。
function fbBalanceGenderCounts(classes, k) {
    const mode = document.getElementById('fb_rule_gender')?.value || 'strict';
    if (mode !== 'strict' || !Array.isArray(classes) || classes.length < 2) return;
    const maxIterations = Math.max(1, (FB_STUDENTS || []).length * 2);

    // 以男女两组的班级极差作为硬优先级。只看已知性别，未知性别不参与
    // 配额计算；这样即使班额有 1 人浮动，也不会出现“男生均了、女生仍差很多”。
    const genderSpread = (counts) => {
        const maleValues = counts.map(item => item.male);
        const femaleValues = counts.map(item => item.female);
        const maleRange = Math.max(...maleValues) - Math.min(...maleValues);
        const femaleRange = Math.max(...femaleValues) - Math.min(...femaleValues);
        return { maleRange, femaleRange, penalty: maleRange * 1000 + femaleRange * 1000 };
    };

    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
        const counts = classes.map((cls, classIdx) => ({
            classIdx,
            male: cls.students.filter(s => s.gender === 'M').length,
            female: cls.students.filter(s => s.gender === 'F').length
        }));
        const beforeSpread = genderSpread(counts);
        if (beforeSpread.maleRange <= 1 && beforeSpread.femaleRange <= 1) break;

        let best = null;
        for (const high of counts) {
            for (const low of counts) {
                if (high.classIdx === low.classIdx) continue;
                const highClass = classes[high.classIdx];
                const lowClass = classes[low.classIdx];
                const highMale = highClass.students.filter(s => s.gender === 'M' && !s.isFixedAssignment && !s.sameGroupId);
                const lowFemale = lowClass.students.filter(s => s.gender === 'F' && !s.isFixedAssignment && !s.sameGroupId);
                if (!highMale.length || !lowFemale.length) continue;

                for (const maleStudent of highMale) {
                    for (const femaleStudent of lowFemale) {
                        const nextHighStudents = highClass.students.filter(s => s !== maleStudent).concat(femaleStudent);
                        const nextLowStudents = lowClass.students.filter(s => s !== femaleStudent).concat(maleStudent);
                        if (FB_checkConflict(maleStudent, nextLowStudents) || FB_checkConflict(femaleStudent, nextHighStudents)) continue;

                        const before = FB_calcClassCost(highClass, FB_COST_CONTEXT?.globalAvg ?? 0)
                            + FB_calcClassCost(lowClass, FB_COST_CONTEXT?.globalAvg ?? 0);
                        const nextHigh = { ...highClass, students: nextHighStudents };
                        const nextLow = { ...lowClass, students: nextLowStudents };
                        const nextCounts = counts.map(item => ({ ...item }));
                        nextCounts[high.classIdx].male -= 1;
                        nextCounts[high.classIdx].female += 1;
                        nextCounts[low.classIdx].male += 1;
                        nextCounts[low.classIdx].female -= 1;
                        const afterSpread = genderSpread(nextCounts);
                        if (afterSpread.penalty >= beforeSpread.penalty) continue;
                        const after = FB_calcClassCost(nextHigh, FB_COST_CONTEXT?.globalAvg ?? 0)
                            + FB_calcClassCost(nextLow, FB_COST_CONTEXT?.globalAvg ?? 0);
                        const scoreDistance = Math.abs(Number(maleStudent.score || 0) - Number(femaleStudent.score || 0));
                        const delta = (after - before) + scoreDistance * 0.02;
                        const improvement = beforeSpread.penalty - afterSpread.penalty;
                        if (!best || improvement > best.improvement || (improvement === best.improvement && delta < best.delta)) {
                            best = { highClass, lowClass, maleStudent, femaleStudent, delta, improvement };
                        }
                    }
                }
            }
        }
        if (!best) break;
        const highIndex = best.highClass.students.indexOf(best.maleStudent);
        const lowIndex = best.lowClass.students.indexOf(best.femaleStudent);
        if (highIndex < 0 || lowIndex < 0) break;
        best.highClass.students[highIndex] = best.femaleStudent;
        best.lowClass.students[lowIndex] = best.maleStudent;
        best.femaleStudent.classIdx = classes.indexOf(best.highClass);
        best.maleStudent.classIdx = classes.indexOf(best.lowClass);
    }
}

// 2. 核心算法：生成单次方案 (提取出来的纯逻辑)
    function FB_generateSingleScheme(k, algo) {
    // 供 cost 函数读取的班数 + 分段阈值（档次分布均衡用）。
    window.__FB_K = k;
    FB_computeTiers();
    const tierCounts = { high: 0, low: 0 };
    FB_STUDENTS.forEach((student) => {
        const tier = fbTierOf(student.score);
        if (tier === 'high') tierCounts.high += 1;
        if (tier === 'low') tierCounts.low += 1;
    });
    FB_COST_CONTEXT = {
        diffRule: document.getElementById('fb_rule_diff')?.value || 'spread',
        tierRule: document.getElementById('fb_rule_tier')?.value || 'on',
        rankRule: document.getElementById('fb_rule_rank')?.value || 'on',
        subjRule: document.getElementById('fb_rule_subject')?.value || 'on',
        idealHigh: tierCounts.high / k,
        idealLow: tierCounts.low / k,
        classCount: k,
        targetSize: FB_STUDENTS.length / k,
        targetMaleRatio: (() => {
            const known = FB_STUDENTS.filter(s => s.gender === 'M' || s.gender === 'F');
            return known.length ? known.filter(s => s.gender === 'M').length / known.length : 0.5;
        })(),
        subjectTarget: FB_SUBJ_TARGET
    };
    // 初始化空班级
    let classes = Array.from({ length: k }, (_, i) => ({ id: i, name: (i + 1) + "班", students: [], stats: {} }));
    let pool = JSON.parse(JSON.stringify(FB_STUDENTS)); // 深拷贝，防止污染
    // 若同班组合包含学籍/新转入中的未考试学生，先以“后置学生”占位参与组级落班，
    // 生成最终名单时跳过重复追加，确保组合仍然不可拆分。
    const poolIds = new Set(pool.map(fbStudentIdentity));
    FB_SAME_CLASS_GROUPS.flatMap(group => group.members).forEach(identity => {
        if (poolIds.has(identity)) return;
        const roster = fbSameClassCandidates().find(student => fbStudentIdentity(student) === identity);
        if (!roster) return;
        const isTransferIn = (FB_TRANSFER_IN_STUDENTS || []).some(row => fbFindRosterMatch(roster, [row]));
        const isDropout = (FB_DROPOUT_STUDENTS || []).some(row => fbFindRosterMatch(roster, [row]));
        pool.push({ ...roster, score: 0, subjAvg: {}, examsGot: 0, examsTotal: 0, isNoExam: true, postType: isTransferIn ? 'transfer-in' : isDropout ? 'dropout' : 'roster-no-exam', isNotEnrolled: false, isDiff: false, isViolation: false, constraints: { same: [], diff: [] }, classIdx: -1 });
        poolIds.add(identity);
    });
    FB_COST_CONTEXT.targetSize = pool.length / k;
    const scoredPool = pool.filter(student => !student.isNoExam && Number.isFinite(Number(student.score)));
    const globalAvg = scoredPool.length ? scoredPool.reduce((a, b) => a + Number(b.score), 0) / scoredPool.length : 0;
    FB_COST_CONTEXT.globalAvg = globalAvg;

    // 预处理：按分数排序，并给每人打「级部总名次」+ 名次区块号（每 k 人一个区块）。
    // 区块号让「1..k 名各占一个班、k+1..2k 名再各占一个班」的蛇形分布可被 cost 保护。
    pool.sort((a, b) => b.score - a.score);
    pool.forEach((s, i) => { s.globalRank = i + 1; s.rankBlock = Math.floor(i / k); });

    const fixedStudents = new Set();
    // 先放入锁定学生，后续算法只在剩余池中优化，确保每套方案都尊重人工指定。
    pool.forEach((student) => {
        const fixedClass = fbGetFixedClass(student, k);
        if (fixedClass >= 0) {
            classes[fixedClass].students.push(student);
            student.classIdx = fixedClass;
            student.isFixedAssignment = true;
            fixedStudents.add(fbStudentIdentity(student));
        }
    });
    const sameGroups = fbResolveSameClassGroups(pool, k);
    const groupedIds = new Set();
    sameGroups.forEach(group => group.members.forEach(student => { groupedIds.add(fbStudentIdentity(student)); student.sameGroupId = group.id; }));
    // 指定班级与同班组合同时存在时，整组继承唯一的指定班级。
    sameGroups.forEach(group => {
        const fixed = [...new Set(group.members.map(student => fbGetFixedClass(student, k)).filter(idx => idx >= 0))];
        if (fixed.length === 1) {
            group.members.forEach(student => {
                if (!fixedStudents.has(fbStudentIdentity(student))) {
                    classes[fixed[0]].students.push(student); student.classIdx = fixed[0]; student.isFixedAssignment = true; fixedStudents.add(fbStudentIdentity(student));
                }
            });
        }
    });
    const freePool = pool.filter(student => !fixedStudents.has(fbStudentIdentity(student)) && !groupedIds.has(fbStudentIdentity(student)));
    const classCapacity = Math.ceil(pool.length / k);
    const addFreeStudent = (student, preferred) => {
        const candidates = classes
            .map((cls, idx) => ({ cls, idx }))
            .filter(({ cls }) => cls.students.length < classCapacity)
            .sort((a, b) => (a.cls.students.length - b.cls.students.length) || (a.idx === preferred ? -1 : 0) - (b.idx === preferred ? -1 : 0));
        const picked = candidates[0] || { cls: classes[preferred], idx: preferred };
        picked.cls.students.push(student);
        student.classIdx = picked.idx;
    };

    // 将未指定班级的同班组合视为一个整体，选择加入后 FB_calcClassCost 最低的班级。
    const placeSameGroup = (group) => {
        const members = group.members.filter(student => !fixedStudents.has(fbStudentIdentity(student)));
        if (!members.length) return;
        const options = classes.map((cls, idx) => ({ cls, idx }))
            .filter(({ cls }) => cls.students.length + members.length <= classCapacity && !members.some(student => FB_checkConflict(student, cls.students)))
            .map(({ cls, idx }) => ({ cls, idx, cost: FB_calcClassCost({ ...cls, students: cls.students.concat(members) }, globalAvg) }))
            .sort((a, b) => (a.cost - b.cost) || (a.cls.students.length - b.cls.students.length) || (a.idx - b.idx));
        const picked = options[0] || classes.map((cls, idx) => ({ cls, idx })).sort((a, b) => (a.cls.students.length - b.cls.students.length) || (a.idx - b.idx))[0];
        if (!picked) return;
        members.forEach(student => { picked.cls.students.push(student); student.classIdx = picked.idx; });
    };
    sameGroups.sort((a, b) => b.members.length - a.members.length).forEach(placeSameGroup);

    if (algo === 'snake') {
        // --- 蛇形分班 ---
        freePool.forEach((s, i) => {
            const round = Math.floor(i / k);
            const target = (round % 2 === 0) ? (i % k) : (k - 1 - (i % k));
            addFreeStudent(s, target);
        });
    } else {
        // --- 智能优化分班 (基于模拟退火思想的简化版) ---
        // A. 初步蛇形分配作为基准
        freePool.forEach((s, i) => {
            const target = (Math.floor(i / k) % 2 === 0) ? (i % k) : (k - 1 - (i % k));
            addFreeStudent(s, target);
        });

        // B. 随机交换优化
        const iterations = 8000; // 增加迭代次数以获得不同结果
        for (let i = 0; i < iterations; i++) {
            const c1 = Math.floor(Math.random() * k);
            const c2 = Math.floor(Math.random() * k);
            if (c1 === c2) continue;

            const cls1 = classes[c1];
            const cls2 = classes[c2];
            if (!cls1.students.length || !cls2.students.length) continue;

            const idx1 = Math.floor(Math.random() * cls1.students.length);
            const idx2 = Math.floor(Math.random() * cls2.students.length);

            const s1 = cls1.students[idx1];
            const s2 = cls2.students[idx2];

            // 人工指定学生是硬约束，不能被交换。
            if (s1.isFixedAssignment || s2.isFixedAssignment || s1.sameGroupId || s2.sameGroupId) continue;

            // 计算交换前的代价 (方差 + 性别平衡 + 难管分布)
            const costBefore = FB_calcClassCost(cls1, globalAvg) + FB_calcClassCost(cls2, globalAvg);

            // 试探性交换
            cls1.students[idx1] = s2; s2.classIdx = c1;
            cls2.students[idx2] = s1; s1.classIdx = c2;

            const costAfter = FB_calcClassCost(cls1, globalAvg) + FB_calcClassCost(cls2, globalAvg);

            // 检查硬性约束 (如: 互斥)
            let violate = false;
            if (FB_checkConflict(s1, cls2.students) || FB_checkConflict(s2, cls1.students)) violate = true;

            // 决策：如果代价变高了(更不平衡) 或者 违反约束，则撤销交换
            // (加入一点点随机接受概率以跳出局部最优，但这里为了稳定简化处理)
            if (violate || costAfter > costBefore) {
                // 撤销
                cls1.students[idx1] = s1; s1.classIdx = c1;
                cls2.students[idx2] = s2; s2.classIdx = c2;
            }
        }
    }

    // 严格均衡模式下做一次确定性男女校正，避免随机交换留下 5~8 人的班级差距。
    fbBalanceGenderCounts(classes, k);

    // 这里的计算是为了 stats，方便外部筛选
    classes.forEach(c => {
        c.stats = fbCalcClassStats(c.students);
    });

    return classes;
}

// 3. 渲染方案选择卡片
function FB_renderSchemeSelector() {
    const container = document.getElementById('fb-scheme-cards');
    if (!container) return;
    const bestExcellentRange = FB_SCHEMES_CACHE.length ? Math.min(...FB_SCHEMES_CACHE.map(s => s.excellentRange ?? Infinity)) : Infinity;
    const signature = FB_SCHEMES_CACHE.map(scheme => `${scheme.id}:${(scheme.excellentRange ?? 0).toFixed(3)}:${scheme.range.toFixed(3)}:${scheme.sd.toFixed(3)}:${fbClassSignature(scheme.data)}`).join('|');
    if (FreshmanExamPerfCache.schemeSelectorSignature === signature) {
        if (container.dataset.freshmanSchemeSig !== signature) {
            container.innerHTML = FreshmanExamPerfCache.schemeSelectorHtml;
            container.dataset.freshmanSchemeSig = signature;
        }
        return;
    }

    const html = FB_SCHEMES_CACHE.map(scheme => {
        // 简单的评分逻辑
        const isBest = (scheme.excellentRange ?? Infinity) <= bestExcellentRange;
        const borderStyle = isBest ? 'border:2px solid #16a34a; background:#fff;' : 'border:1px solid #ddd; background:#fff;';

        // 找出该方案中男女比例极差
        const males = scheme.data.map(c => c.stats.male);
        const maleRange = Math.max(...males) - Math.min(...males);

        return `
                <div data-scheme-id="${scheme.id}" onclick="FB_applyScheme(${scheme.id})" style="cursor:pointer; padding:10px; border-radius:6px; ${borderStyle} transition:0.2s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#fff'">
                    <div style="font-weight:bold; color:#333; display:flex; justify-content:space-between;">
                        <span>${scheme.name}</span>
                        ${isBest ? '<span style="color:red; font-size:10px;">★ 推荐</span>' : ''}
                    </div>
                    <div style="font-size:12px; color:#666; margin-top:5px;">
                        <div>主科优秀率极差: <strong>${((scheme.excellentRange ?? 0) * 100).toFixed(1)} 个百分点</strong></div>
                        <div>均分极差: ${scheme.range.toFixed(2)}</div>
                        <div>男女极差: ${maleRange} 人</div>
                    </div>
                </div>
            `;
    }).join('');
    FreshmanExamPerfCache.schemeSelectorSignature = signature;
    FreshmanExamPerfCache.schemeSelectorHtml = html;
    container.innerHTML = html;
    container.dataset.freshmanSchemeSig = signature;
}

// 4. 应用选中的方案
function FB_applyScheme(id) {
    const scheme = FB_SCHEMES_CACHE.find(s => s.id === id);
    if (!scheme) return;
    FB_ACTIVE_SCHEME_ID = scheme.id;

    // 更新全局变量
    writeFbClasses(scheme.data);
    FB_SIMULATED_DATA = {};
    FB_CLASSES.forEach(c => FB_SIMULATED_DATA[c.name] = c.students);

    // 渲染原有仪表盘
    FB_renderDashboard();
    FB_renderTwoStageBalance(scheme);

    // 高亮选中的卡片
    const cardsWrap = document.getElementById('fb-scheme-cards');
    if (cardsWrap) {
        const cards = cardsWrap.children;
        Array.from(cards).forEach((card) => {
            if (String(card.dataset.schemeId) === String(scheme.id)) {
                card.style.borderColor = '#16a34a';
                card.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.2)';
            } else {
                card.style.borderColor = '#ddd';
                card.style.boxShadow = 'none';
            }
        });
    }
}

function fbMajorSubjectsForGrade() {
    const grade = String(document.getElementById('fb_target_grade')?.value || '7');
    return grade === '9' ? ['语文', '数学', '英语', '物理', '化学'] : ['语文', '数学', '英语'];
}
// 两率一分沿用系统当前考试的优秀线/及格线；若当前考试没有显式配置，
// 按全体分班学生的 85%/60% 分位回退，避免把班级内部成绩当作各班自己的划线。
function fbResolveSubjectThreshold(subject, kind, scores) {
    if (window.ThresholdRuntime && typeof window.ThresholdRuntime.resolveSubjectThreshold === 'function') {
        return window.ThresholdRuntime.resolveSubjectThreshold(subject, kind, scores, {
            thresholds: window.THRESHOLDS,
            sourceLabel: window.THRESHOLD_SCOPE?.sourceLabel || '当前数据范围按比例划线',
            schoolCount: window.THRESHOLD_SCOPE?.schoolCount,
            scope: window.THRESHOLD_SCOPE?.scope
        }).value;
    }
    const config = (window.THRESHOLDS && typeof window.THRESHOLDS === 'object' && window.THRESHOLDS[subject]) || {};
    const direct = kind === 'excellent'
        ? (config.excellent ?? config.exc ?? config.good)
        : (config.pass ?? config.passLine);
    if (Number.isFinite(Number(direct)) && Number(direct) > 0) return Number(direct);
    const sorted = (scores || []).map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) return kind === 'excellent' ? FB_MAIN_EXC_LINE : FB_MAIN_PASS_LINE;
    const ratio = kind === 'excellent' ? 0.85 : 0.6;
    return sorted[Math.max(0, Math.min(sorted.length - 1, Math.floor(sorted.length * ratio)))];
}
function fbSubjectMetric(classes, subject) {
    const allValues = (classes || []).flatMap(cls => (cls.students || [])
        .filter(s => !fbIsNoExamStudent(s))
        .map(s => Number(s?.subjAvg?.[subject]))
        .filter(Number.isFinite));
    const excellentLine = fbResolveSubjectThreshold(subject, 'excellent', allValues);
    const passLine = fbResolveSubjectThreshold(subject, 'pass', allValues);
    return (classes || []).map(cls => {
        const valid = (cls.students || []).filter(s => !fbIsNoExamStudent(s)).map(s => Number(s?.subjAvg?.[subject])).filter(Number.isFinite);
        if (!valid.length) return { avg: null, excellent: null, pass: null, n: 0 };
        return { avg: valid.reduce((a, b) => a + b, 0) / valid.length, excellent: valid.filter(v => v >= excellentLine).length / valid.length, pass: valid.filter(v => v >= passLine).length / valid.length, n: valid.length };
    });
}
function fbBuildStageBalanceTable(classes, title, subjects) {
    let html = `<div style="margin-top:12px;"><div style="font-weight:700;color:#334155;margin-bottom:6px;">${title}</div><table class="comparison-table" style="font-size:12px;"><thead><tr><th>班级</th><th>总人数</th><th>男生</th><th>女生</th><th>有效成绩人数</th>`;
    subjects.forEach(s => { html += `<th>${s}均分</th><th>${s}优秀率</th><th>${s}及格率</th>`; });
    html += '</tr></thead><tbody>';
    const metrics = Object.fromEntries(subjects.map(s => [s, fbSubjectMetric(classes, s)]));
    (classes || []).forEach((cls, i) => {
        const stats = fbCalcClassStats(cls.students || []);
        const scoredCount = (cls.students || []).filter(s => !fbIsNoExamStudent(s) && Number.isFinite(Number(s?.score))).length;
        html += `<tr><td>${cls.name}</td><td>${stats.count}</td><td>${stats.male}</td><td>${stats.female}</td><td>${scoredCount}</td>`;
        subjects.forEach(s => { const m = metrics[s][i]; html += m.n ? `<td>${m.avg.toFixed(1)}</td><td>${(m.excellent * 100).toFixed(1)}%</td><td>${(m.pass * 100).toFixed(1)}%</td>` : '<td>-</td><td>-</td><td>-</td>'; });
        html += '</tr>';
    });
    return html + '</tbody></table></div>';
}
function FB_renderTwoStageBalance(scheme) {
    const root = document.getElementById('fb_two_stage_balance'); if (!root || !scheme) return;
    const subjects = fbMajorSubjectsForGrade();
    root.innerHTML = `<div style="font-weight:700;color:#1e293b;">📊 两阶段主要学科“两率一分”对照（${subjects.join('、')}）</div>`
        + '<div style="font-size:12px;color:#64748b;margin-top:4px;">第一阶段只统计有考试成绩的分班名单；第二阶段包含后置补入的未考试/新转入学生，缺少成绩的学生不计入均分、优秀率和及格率分母。</div>'
        + fbBuildStageBalanceTable(scheme.examData || scheme.data, '第一阶段：按考试名单分配', subjects)
        + fbBuildStageBalanceTable(scheme.finalData || scheme.data, '第二阶段：加入未考试及新转入学生后的最终名单', subjects);
}

// 分段阈值（高/中/低）：全局前 27% 为高分段、后 27% 为低分段，中间为中段。
// 用于「档次分布均衡」——不只均分相等，还让每班高/中/低段人数接近。
let FB_TIER = null; // { high, low }  score 阈值，由 FB_computeTiers 设置
// 主科全局目标（每班应接近的均分/优秀率/及格率），由 FB_computeTiers 一并算出。
let FB_SUBJ_TARGET = null; // { 语文:{avg,exc,pass,n}, ... }
function FB_computeTiers() {
    const scores = FB_STUDENTS.map(s => s.score).filter(Number.isFinite).sort((a, b) => b - a);
    if (!scores.length) { FB_TIER = null; FB_SUBJ_TARGET = null; return; }
    const hi = scores[Math.floor(scores.length * 0.27)] ?? scores[0];
    const lo = scores[Math.floor(scores.length * 0.73)] ?? scores[scores.length - 1];
    FB_TIER = { high: hi, low: lo };
    // 主科全局均分/优秀率/及格率（作为每班目标基准）。
    FB_SUBJ_TARGET = {};
    FB_MAIN_SUBJECTS.forEach((sub) => {
        const vals = FB_STUDENTS.map(s => (s.subjAvg && Number.isFinite(s.subjAvg[sub])) ? s.subjAvg[sub] : null).filter(v => v != null);
        if (!vals.length) { FB_SUBJ_TARGET[sub] = null; return; }
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        const excLine = fbResolveSubjectThreshold(sub, 'excellent', vals);
        const passLine = fbResolveSubjectThreshold(sub, 'pass', vals);
        const exc = vals.filter(v => v >= excLine).length / vals.length;
        const pass = vals.filter(v => v >= passLine).length / vals.length;
        FB_SUBJ_TARGET[sub] = { avg, exc, pass, n: vals.length };
    });
}
function fbTierOf(score) {
    if (!FB_TIER) return 'mid';
    if (score >= FB_TIER.high) return 'high';
    if (score <= FB_TIER.low) return 'low';
    return 'mid';
}

function FB_calcClassCost(cls, gAvg) {
    const n = cls.students.length; if (n === 0) return 10000;
    const avg = cls.students.reduce((a, b) => a + b.score, 0) / n;
    const male = cls.students.filter(s => s.gender === 'M').length;
    const knownGender = cls.students.filter(s => s.gender === 'M' || s.gender === 'F').length;
    // 违纪生（分班装配里 isViolation，兼容旧的 isDiff/_isDiff 备注难管）。
    const viol = cls.students.filter(s => (s.isViolation || s.isDiff || s._isDiff)).length;
    const notEnrolled = cls.students.filter(s => s.isNotEnrolled).length;

    let cost = Math.pow(avg - gAvg, 2) * 100;         // 均分均衡
    const targetMaleRatio = FB_COST_CONTEXT?.targetMaleRatio ?? 0.5;
    const classMaleRatio = knownGender ? male / knownGender : targetMaleRatio;
    cost += Math.pow(classMaleRatio - targetMaleRatio, 2) * 5000; // 已知性别男女均衡，未知不计入女生
    const classCount = FB_COST_CONTEXT?.classCount || ((typeof window.__FB_K === 'number' && window.__FB_K > 0) ? window.__FB_K : 1);
    const targetSize = FB_COST_CONTEXT?.targetSize ?? (FB_STUDENTS.length / classCount);
    cost += Math.pow(n - targetSize, 2) * 260;          // 班额均衡：指定学生较多的班由其余学生自动让位

    // 违纪「分散 + 均衡」：软惩罚。同班违纪越多惩罚越重（二次），鼓励打散；
    // 目标不是绝对不同班，而是每班违纪数尽量少且接近。
    const diffRule = FB_COST_CONTEXT?.diffRule || document.getElementById('fb_rule_diff')?.value || 'spread';
    if (diffRule === 'spread') { cost += Math.pow(viol, 2) * 600; }
    else if (diffRule === 'gather') { cost -= viol * 100; } // 集中管理：轻微鼓励聚集
    // 不在籍/考试名单独有学生尽量分散，避免集中到同一班。
    cost += Math.pow(notEnrolled, 2) * 500;

    // 档次分布均衡：每班高/中/低段人数接近理想值（总数/班数）。可选开关。
    const tierRule = FB_COST_CONTEXT?.tierRule || document.getElementById('fb_rule_tier')?.value || 'on';
    if (tierRule === 'on' && FB_TIER && FB_STUDENTS.length) {
        const k = (typeof window.__FB_K === 'number' && window.__FB_K > 0) ? window.__FB_K : 1;
        const idealHigh = FB_COST_CONTEXT?.idealHigh ?? (FB_STUDENTS.filter(s => fbTierOf(s.score) === 'high').length / k);
        const idealLow = FB_COST_CONTEXT?.idealLow ?? (FB_STUDENTS.filter(s => fbTierOf(s.score) === 'low').length / k);
        const hi = cls.students.filter(s => fbTierOf(s.score) === 'high').length;
        const lo = cls.students.filter(s => fbTierOf(s.score) === 'low').length;
        cost += (Math.pow(hi - idealHigh, 2) + Math.pow(lo - idealLow, 2)) * 300;
    }

    // 名次蛇形铺开保护：每班理想是每个「名次区块」各占 1 人（1..k 名分到 k 个班、
    // k+1..2k 名再各占一个班…）。同班出现同区块的多名学生 → 惩罚，保证 1..k 名散到不同班。
    const rankRule = FB_COST_CONTEXT?.rankRule || document.getElementById('fb_rule_rank')?.value || 'on';
    if (rankRule === 'on') {
        const blockCount = {};
        cls.students.forEach((s) => {
            if (typeof s.rankBlock === 'number') blockCount[s.rankBlock] = (blockCount[s.rankBlock] || 0) + 1;
        });
        let clash = 0;
        Object.values(blockCount).forEach((cnt) => { if (cnt > 1) clash += (cnt - 1) * (cnt - 1); });
        cost += clash * 1200; // 高权重：优先保证名次均匀铺开
    }

    // 主科（语数英）每班均衡：均分 + 优秀率 + 及格率 都向全局目标靠拢。
    // 只在开启时（fb_rule_subject）且有主科目标时生效。
    const subjRule = FB_COST_CONTEXT?.subjRule || document.getElementById('fb_rule_subject')?.value || 'on';
    const subjectTarget = FB_COST_CONTEXT?.subjectTarget || FB_SUBJ_TARGET;
    if (subjRule === 'on' && subjectTarget) {
        FB_MAIN_SUBJECTS.forEach((sub) => {
            const tgt = subjectTarget[sub];
            if (!tgt) return;
            const vals = cls.students.map(s => (s.subjAvg && Number.isFinite(s.subjAvg[sub])) ? s.subjAvg[sub] : null).filter(v => v != null);
            if (!vals.length) return;
            const cAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
            // 评分与展示必须使用同一套全局划线。旧逻辑固定使用 85%/60% 满分线
            // （如 150/127.5、90），会让算法按错误口径优化，最终展示的优秀率/及格率
            // 与“两率一分”模块不一致。优先读取当前考试配置，缺省时再按全体分班学生分位线回退。
            const globalValues = FB_STUDENTS
                .map(s => (s.subjAvg && Number.isFinite(s.subjAvg[sub])) ? s.subjAvg[sub] : null)
                .filter(v => v != null);
            const excLine = fbResolveSubjectThreshold(sub, 'excellent', globalValues);
            const passLine = fbResolveSubjectThreshold(sub, 'pass', globalValues);
            const cExc = vals.filter(v => v >= excLine).length / vals.length;
            const cPass = vals.filter(v => v >= passLine).length / vals.length;
            // 优秀率是本模块首要均衡目标；均分、及格率作为次级约束。
            // 比例偏差按 0~1 计算，权重保持可解释且不改变优秀线/及格线口径。
            cost += Math.pow(cExc - tgt.exc, 2) * 12000;
            cost += Math.pow(cPass - tgt.pass, 2) * 2500;
            cost += Math.pow(cAvg - tgt.avg, 2) * 20;
        });
    }
    return cost;
}

function FB_checkConflict(stu, targetArr) {
    if (!stu.constraints) return false;
    for (let name of stu.constraints.diff) { if (targetArr.find(s => s.name === name)) return true; }
    return false;
}

// 结果页顶部常驻横幅：重名提示 + 数据来源摘要（新9口径/参考考试/违纪缺项）。
function FB_renderAssemblyBanner() {
    const area = document.getElementById('fb-results-area');
    if (!area) return;
    let banner = document.getElementById('fb_assembly_banner');
    const a = FB_LAST_ASSEMBLY;
    if (!a) { if (banner) banner.remove(); return; }
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'fb_assembly_banner';
        area.insertBefore(banner, area.firstChild);
    }
    const gradeLabel = a.targetGrade === '9' ? '新9年级（语数英物化，物×0.9 化×0.6，不含政治）'
        : `新${a.targetGrade || '7'}年级`;
    const parts = [];
    parts.push(`口径：${gradeLabel}`);
    parts.push('成绩阶段：9月前按上一年级，9月后按目标年级');
    parts.push(`参考考试：${a.examLabels.join(' + ') || a.examCount + ' 次'}`);
    parts.push(`匹配学生：${a.matched} 人`);
    const fixedCount = Object.keys(FB_FIXED_ASSIGNMENTS).length;
    if (fixedCount) parts.push(`指定班级：${fixedCount} 人`);
    if (a.violationUploaded) parts.push(`违纪：${a.violationTotal} 人`);
    if (a.missingGender > 0) parts.push(`⚠️ 缺性别 ${a.missingGender} 人`);
    const dupWarn = (a.dupGroups && a.dupGroups.length)
        ? `<div style="margin-top:8px; color:#b91c1c; font-weight:600;">
             ⚠️ 存在 ${a.dupGroups.length} 组重名学生（${a.dupGroups.slice(0, 10).map(g => g.name).join('、')}${a.dupGroups.length > 10 ? '…' : ''}），
             成绩/性别/违纪匹配可能有误，请务必人工核对；建议名单补「考号」列以精确匹配。
           </div>` : '';
    const bg = (a.dupGroups && a.dupGroups.length) ? '#fef2f2' : '#f0f9ff';
    const bd = (a.dupGroups && a.dupGroups.length) ? '#fecaca' : '#bae6fd';
    banner.style.cssText = `background:${bg}; border:1px solid ${bd}; border-radius:8px; padding:12px 14px; margin-bottom:15px; font-size:13px; color:#334155;`;
    banner.innerHTML = `<div><i class="ti ti-info-circle"></i> <strong>分班数据摘要</strong>（仅本次分班使用，不影响云端成绩）</div>
        <div style="margin-top:6px;">${parts.join(' · ')}</div>${dupWarn}`;
}

function fbRenderStatusLegend() {
    const area = document.getElementById('fb-results-area');
    if (!area) return;
    let legend = document.getElementById('fb_status_legend');
    if (!legend) {
        legend = document.createElement('div');
        legend.id = 'fb_status_legend';
        const heading = area.querySelector('.sub-header');
        if (heading) heading.insertAdjacentElement('afterend', legend);
        else area.insertBefore(legend, area.firstChild);
    }
    legend.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;margin:10px 0 14px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#475569;font-size:12px;line-height:1.6;';
    const item = (bg, border, text) => `<span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;"><i style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${bg};border:1px solid ${border};"></i>${text}</span>`;
    legend.innerHTML = `<strong style="color:#1e293b;">特殊学生颜色说明：</strong>${item('#fef3c7', '#f59e0b', '黄色：在册未考，后置均衡；不计入两率一分')}${item('#f3e8ff', '#a855f7', '紫色：辍学/长期离校，后置均衡')}${item('#dbeafe', '#3b82f6', '蓝色：新转入，后置均衡')}${item('#fee2e2', '#ef4444', '红色：违纪，参与分班并尽量分散')}`;
}

function fbStudentStatus(student) {
    if (student?.postType === 'dropout' || student?.postType === '辍学/长期离校') return '辍学/长期离校';
    if (student?.postType === 'transfer-in' || student?.postType === '新转入') return '新转入';
    if (fbIsNoExamStudent(student)) return '学籍在册未考试';
    if (student?.isViolation) return '违纪';
    if (student?.isFixedAssignment) return '指定班级';
    if (student?.sameGroupId) return '同班组合';
    return '';
}

function fbStudentStatusExplanation(student) {
    const status = fbStudentStatus(student);
    if (status === '辍学/长期离校') {
        return '辍学/长期离校名单学生，按后置均衡分配；无考试成绩。';
    }
    if (status === '新转入') {
        return '新转入学生，按后置均衡分配；无本次考试成绩。';
    }
    if (status === '学籍在册未考试' || fbIsNoExamStudent(student)) {
        return '学籍在册但本次未参加考试，按后置均衡分配；各科成绩不计入两率一分。';
    }
    if (status === '违纪') return '违纪学生参与分班，算法已尽量分散到各班。';
    if (status === '指定班级') return '管理员指定班级，作为硬约束保留。';
    if (status === '同班组合') return '同班组合，作为整体参与分班，不拆分。';
    return '';
}

function fbExportSubjectNames(classes = []) {
    const names = [];
    const preferred = typeof fbMajorSubjectsForGrade === 'function'
        ? fbMajorSubjectsForGrade()
        : fbMajorSubjectsForGradeValue(fbLockedTargetGrade());
    preferred.forEach((subject) => { if (!names.includes(subject)) names.push(subject); });
    const discovered = new Set();
    (Array.isArray(classes) ? classes : []).forEach((cls) => (cls?.students || []).forEach((student) => {
        Object.keys(student?.subjAvg || {}).forEach((subject) => discovered.add(String(subject || '').trim()));
        Object.keys(student?.scores || {}).forEach((subject) => discovered.add(String(subject || '').trim()));
    }));
    [...discovered].filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN')).forEach((subject) => {
        if (!names.includes(subject)) names.push(subject);
    });
    return names;
}

function fbStudentSubjectScore(student, subject) {
    const raw = student?.subjAvg?.[subject] ?? student?.scores?.[subject];
    const value = Number(raw);
    return Number.isFinite(value) && !fbIsNoExamStudent(student) ? value : null;
}

function fbSameGroupLabel(student) {
    if (!student?.sameGroupId) return '';
    const idx = FB_SAME_CLASS_GROUPS.findIndex(group => group.id === student.sameGroupId);
    return idx >= 0 ? `组合${idx + 1}` : String(student.sameGroupId);
}

function FB_viewClassViolations(classIdx) {
    const cls = FB_CLASSES[Number(classIdx)];
    if (!cls) return;
    const students = cls.students.filter(student => student.isViolation);
    const message = students.length
        ? `${cls.name} 违纪学生 ${students.length} 人：\n${students.map((student, index) => `${index + 1}. ${student.name}${student.id ? `（${student.id}）` : ''}`).join('\n')}`
        : `${cls.name} 暂无已匹配的违纪学生。`;
    window.UI?.alert?.(message, students.length ? 'warning' : 'info');
}

function fbDecorateRosterExportSheet(ws, headers, dataRows = []) {
    if (!ws || !ws['!ref']) return;
    if (typeof window.decorateExcelSheet === 'function') window.decorateExcelSheet(ws, headers);
    const range = XLSX.utils.decode_range(ws['!ref']);
    const statusCol = headers.findIndex(header => String(header).includes('状态'));
    if (statusCol < 0) return;
    const colors = {
        '违纪': ['FEE2E2', 'B91C1C'],
        '辍学/长期离校': ['F3E8FF', '7E22CE'],
        '新转入': ['DBEAFE', '1D4ED8'],
        '学籍在册未考试': ['FEF3C7', '92400E'],
        '指定班级': ['DCFCE7', '166534'],
        '同班组合': ['E0E7FF', '3730A3']
    };
    dataRows.forEach((student, index) => {
        const row = range.s.r + index + 1;
        const status = fbStudentStatus(student);
        const style = colors[status];
        if (!style) return;
        // 特殊学生整行着色，保证在 Excel 中横向查看时仍能识别；状态列额外加粗。
        for (let column = range.s.c; column <= range.e.c; column += 1) {
            const ref = XLSX.utils.encode_cell({ c: column, r: row });
            if (!ws[ref]) continue;
            ws[ref].s = {
                ...(ws[ref].s || {}),
                fill: { fgColor: { rgb: style[0] } },
                font: { ...(ws[ref].s?.font || {}), color: { rgb: style[1] }, bold: column === statusCol || !!ws[ref].s?.font?.bold }
            };
        }
    });
}

function fbSafeExportSheetName(name, usedNames = new Set()) {
    const base = String(name || '班级').replace(/[\\/*?:\[\]]/g, '').trim() || '班级';
    let candidate = base.slice(0, 31);
    let suffix = 2;
    while (usedNames.has(candidate)) {
        const tail = `-${suffix++}`;
        candidate = `${base.slice(0, Math.max(1, 31 - tail.length))}${tail}`;
    }
    usedNames.add(candidate);
    return candidate;
}

function fbBuildClassRosterRows(cls, stageLabel = '最终名单', subjects = fbExportSubjectNames([cls])) {
    const rows = [['阶段', '班级', '座位号', '姓名', '性别', '总分', ...subjects.map((subject) => `${subject}成绩`), '是否后置分配', '状态', '状态说明', '同班组合', '备注']];
    const students = [];
    const list = cls?.seatLayout || cls?.students || [];
    list.forEach((student, index) => {
        const status = fbStudentStatus(student);
        rows.push([
            stageLabel,
            cls?.name || '',
            index + 1,
            student?.name || '',
            fbGenderLabel(student?.gender),
            Number.isFinite(Number(student?.score)) && !fbIsNoExamStudent(student) ? student.score : '',
            ...subjects.map((subject) => {
                const value = fbStudentSubjectScore(student, subject);
                return value === null ? (fbIsNoExamStudent(student) ? '未参加考试' : '—') : value;
            }),
            fbIsNoExamStudent(student) ? '是' : '否',
            status || '正常',
            fbStudentStatusExplanation(student),
            fbSameGroupLabel(student),
            student?.remarks || ''
        ]);
        students.push(student);
    });
    return { rows, students };
}

function fbAppendClassRosterSheets(wb, classes, stageLabel = '最终名单') {
    const usedNames = new Set((wb.SheetNames || []).map(name => String(name)));
    const subjects = fbExportSubjectNames(classes);
    (Array.isArray(classes) ? classes : []).forEach((cls) => {
        const { rows, students } = fbBuildClassRosterRows(cls, stageLabel, subjects);
        const sheet = XLSX.utils.aoa_to_sheet(rows);
        sheet['!cols'] = [
            { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 8 }, { wch: 10 },
            ...subjects.map(() => ({ wch: 11 })),
            { wch: 14 }, { wch: 18 }, { wch: 52 }, { wch: 12 }, { wch: 34 }
        ];
        fbDecorateRosterExportSheet(sheet, rows[0], students);
        XLSX.utils.book_append_sheet(wb, sheet, fbSafeExportSheetName(cls?.name || '班级', usedNames));
    });
}

function FB_renderDashboard() {
    document.getElementById('fb-results-area').classList.remove('hidden');
    FB_renderAssemblyBanner();
    fbRenderStatusLegend();
    const container = document.getElementById('fb_class_container');
    const dashboardSignature = fbClassSignature(FB_CLASSES);
    if (container?.dataset.freshmanDashboardSig === dashboardSignature && FreshmanExamPerfCache.dashboardSignature === dashboardSignature) {
        FB_renderBalanceChart();
        return;
    }
    let allAvgs = [], tMale = 0, tFemale = 0, totalDiffCnt = 0;
    const classCardsHtml = FB_CLASSES.map(c => {
        const stats = fbCalcClassStats(c.students);
        const n = stats.count; const avg = stats.avg; const male = stats.male;
        const violationStudents = c.students.filter(student => student.isViolation);
        const violationCnt = violationStudents.length;
        const diffCnt = stats.diff;
        allAvgs.push(avg); tMale += male; tFemale += stats.female; totalDiffCnt += diffCnt; c.stats = stats; const isWarn = diffCnt > 3;
        // 档次分布（高/低段人数），供均衡核对。
        const hiCnt = c.students.filter(s => !fbIsNoExamStudent(s) && fbTierOf(s.score) === 'high').length;
        const loCnt = c.students.filter(s => !fbIsNoExamStudent(s) && fbTierOf(s.score) === 'low').length;
        const fixedCnt = c.students.filter(s => s.isFixedAssignment).length;
        const sameGroupIds = [...new Set(c.students.map(s => s.sameGroupId).filter(Boolean))];
        const postRosterCnt = c.students.filter(s => fbIsNoExamStudent(s)
            && s.postType !== 'dropout' && s.postType !== '辍学/长期离校'
            && s.postType !== 'transfer-in' && s.postType !== '新转入').length;
        const postDropoutCnt = c.students.filter(s => s.postType === 'dropout').length;
        const postTransferCnt = c.students.filter(s => s.postType === 'transfer-in').length;
        const violLabel = (FB_LAST_ASSEMBLY && FB_LAST_ASSEMBLY.violationUploaded) ? '违纪' : '难管';
        const violationBadge = violationCnt > 0
            ? `<button type="button" class="fb-tag fb-tag-red fb-violation-link" data-fb-action="view-violations" data-fb-class-id="${c.id}">${violLabel}: ${violationCnt}</button>`
            : (diffCnt > 0 ? `<span class="fb-tag fb-tag-red">${violLabel}: ${diffCnt}</span>` : '');
        const noExamBadge = postRosterCnt > 0 ? `<span class="fb-tag fb-tag-yellow" title="学籍在册但本次未参加考试，按后置均衡分配；各科成绩不计入两率一分。">未参加考试（后置）: ${postRosterCnt}</span>` : '';
        const dropoutBadge = postDropoutCnt > 0 ? `<span class="fb-tag fb-tag-purple">辍学/长期离校: ${postDropoutCnt}</span>` : '';
        return `<div class="fb-class-box ${isWarn ? 'fb-warn-bg' : ''}" onclick="FB_openSeatMap(${c.id})"><div class="fb-c-head"><span style="font-weight:bold; font-size:16px;">${c.name}</span><span style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">${violationBadge}${noExamBadge}${dropoutBadge}</span></div><div class="fb-c-body"><div>人数: <strong>${n}</strong></div><div>均分: <strong>${avg.toFixed(1)}</strong></div><div>男生: ${male}</div><div>女生: ${stats.female}</div><div>高分段: ${hiCnt}</div><div>低分段: ${loCnt}</div>${postRosterCnt || postDropoutCnt || postTransferCnt ? `<div style="grid-column:span 2; color:#7c3aed; font-weight:700;">↳ 后置学生: ${postRosterCnt + postDropoutCnt + postTransferCnt} 人（${postRosterCnt ? `在册未考 ${postRosterCnt}` : ''}${postRosterCnt && (postDropoutCnt || postTransferCnt) ? '、' : ''}${postDropoutCnt ? `辍学/长期离校 ${postDropoutCnt}` : ''}${postDropoutCnt && postTransferCnt ? '、' : ''}${postTransferCnt ? `新转入 ${postTransferCnt}` : ''}）</div>` : ''}${fixedCnt ? `<div style="grid-column:span 2; color:#166534; font-weight:700;">🔒 指定学生: ${fixedCnt} 人</div>` : ''}${sameGroupIds.length ? `<div style="grid-column:span 2; color:#1d4ed8; font-weight:700;">👥 同班组合: ${sameGroupIds.length} 组</div>` : ''}<div style="grid-column:span 2; font-size:11px; color:#999; margin-top:5px;">颜色说明：黄色=在册未参加考试，后置均衡分配；点击进入座位编排 →</div></div></div>`;
    }).join('');
    if (container && container.innerHTML !== classCardsHtml) {
        container.innerHTML = classCardsHtml;
        container.dataset.freshmanDashboardSig = dashboardSignature;
    }
    FreshmanExamPerfCache.dashboardSignature = dashboardSignature;
    FreshmanExamPerfCache.dashboardHtml = classCardsHtml;
    const range = allAvgs.length ? (Math.max(...allAvgs) - Math.min(...allAvgs)) : 0;
    const elTotal = document.getElementById('fb_res_total');
    const elMale = document.getElementById('fb_res_male');
    const elFemale = document.getElementById('fb_res_female');
    const elDiff = document.getElementById('fb_res_diff');
    const elDiffCnt = document.getElementById('fb_res_diff_cnt');
    if (elTotal) elTotal.innerText = FB_STUDENTS.length;
    if (elMale) elMale.innerText = tMale;
    if (elFemale) elFemale.innerText = tFemale;
    if (elDiff) elDiff.innerText = range.toFixed(2);
    if (elDiffCnt) elDiffCnt.innerText = totalDiffCnt;
    const evalEl = document.getElementById('fb_res_eval');
    if (evalEl) {
        if (range <= 1.0) evalEl.innerHTML = '<span style="color:green;font-weight:bold;">✅ 完美均衡</span>'; else if (range <= 3.0) evalEl.innerHTML = '<span style="color:#d97706;font-weight:bold;">⚠️ 基本均衡</span>'; else evalEl.innerHTML = '<span style="color:red;font-weight:bold;">❌ 差异过大</span>';
    }
    FB_renderBalanceChart();
}

// 清理旧版本遗留的异常分班结果，避免页面打开后继续显示“269 人/班”等错误缓存。
function FB_sanitizePersistedClasses() {
    const k = Math.max(1, Number(document.getElementById('fb_cls_num')?.value) || 6);
    const counts = (Array.isArray(FB_CLASSES) ? FB_CLASSES : []).map(c => Array.isArray(c?.students) ? c.students.length : 0);
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (!counts.length || (!counts.some(count => count > 60) && total <= k * 60)) return false;
    writeFbClasses([]);
    FB_SCHEMES_CACHE = [];
    FB_ACTIVE_SCHEME_ID = null;
    document.getElementById('fb-results-area')?.classList.add('hidden');
    window.UI?.toast?.(`已清除旧版异常分班缓存（${total} 人），请重新载入本校数据后生成。`, 'warning');
    return true;
}

// 主科（语数英）每班均衡诊断表：均分 / 优秀率 / 及格率，供人工核对是否坐到接近。
function fbBuildSubjectBalanceTable(labels) {
    // 仅当聚合了主科数据时展示。
    const hasSubj = FB_CLASSES.some(c => c.students.some(s => s.subjAvg && FB_MAIN_SUBJECTS.some(sub => Number.isFinite(s.subjAvg[sub]))));
    if (!hasSubj) return '';
    const fmtPct = (v) => (v * 100).toFixed(0) + '%';
    const thresholdLabels = FB_MAIN_SUBJECTS.map((sub) => {
        const values = FB_CLASSES.flatMap(item => (item.students || []).filter(s => !fbIsNoExamStudent(s)).map(s => Number(s?.subjAvg?.[sub])).filter(Number.isFinite));
        return `${sub}优秀线≥${fbResolveSubjectThreshold(sub, 'excellent', values).toFixed(1)}、及格线≥${fbResolveSubjectThreshold(sub, 'pass', values).toFixed(1)}`;
    }).join('；');
    let html = `<div style="margin-top:16px; font-weight:600; color:#334155;">📚 主科每班均衡（语数英 · 均分 / 优秀率 / 及格率）</div><div style="font-size:11px;color:#64748b;margin-top:3px;">${thresholdLabels}</div>`;
    html += `<table class="comparison-table" style="font-size:12px; margin-top:6px;"><thead><tr><th>班级</th>`;
    FB_MAIN_SUBJECTS.forEach(sub => { html += `<th>${sub}均分</th><th>${sub}优秀</th><th>${sub}及格</th>`; });
    html += `</tr></thead><tbody>`;
    FB_CLASSES.forEach((c, i) => {
        html += `<tr><td>${labels[i]}</td>`;
        FB_MAIN_SUBJECTS.forEach(sub => {
            const vals = c.students.filter(s => !fbIsNoExamStudent(s)).map(s => (s.subjAvg && Number.isFinite(s.subjAvg[sub])) ? s.subjAvg[sub] : null).filter(v => v != null);
            if (!vals.length) { html += `<td>-</td><td>-</td><td>-</td>`; return; }
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            const allValues = FB_CLASSES.flatMap(item => (item.students || []).filter(s => !fbIsNoExamStudent(s)).map(s => Number(s?.subjAvg?.[sub])).filter(Number.isFinite));
            const excLine = fbResolveSubjectThreshold(sub, 'excellent', allValues);
            const passLine = fbResolveSubjectThreshold(sub, 'pass', allValues);
            const exc = vals.filter(v => v >= excLine).length / vals.length;
            const pass = vals.filter(v => v >= passLine).length / vals.length;
            html += `<td>${avg.toFixed(1)}</td><td>${fmtPct(exc)}</td><td>${fmtPct(pass)}</td>`;
        });
        html += `</tr>`;
    });
    html += `</tbody></table>`;
    return html;
}

function FB_renderBalanceChart() {
    const ctx = document.getElementById('balanceChart'); const tableContainer = document.getElementById('balanceTableContainer'); const labels = FB_CLASSES.map(c => c.name);
    const signature = fbClassSignature(FB_CLASSES);
    if (FreshmanExamPerfCache.balanceSignature === signature
        && tableContainer?.dataset.freshmanBalanceSig === signature
        && FreshmanExamPerfCache.balanceChartSignature === signature) {
        return;
    }
    const statsData = FB_CLASSES.map(c => { const scores = c.students.filter(s => !fbIsNoExamStudent(s)).map(s => Number(s.score)).filter(Number.isFinite).sort((a, b) => a - b); const safeScores = scores.length ? scores : [0]; const qs = calculateQuartiles(safeScores); return { min: safeScores[0], max: safeScores[safeScores.length - 1], q1: qs.q1, median: qs.q2, q3: qs.q3, avg: c.stats.avg, sd: calculateSD(safeScores) }; });
    let tableHtml = `<table class="comparison-table" style="font-size:12px;"><thead><tr><th>班级</th><th>总人数</th><th>男生</th><th>女生</th><th>平均分</th><th>标准差 (SD)</th><th>极差 (Max-Min)</th><th>前25%线 (Q3)</th><th>后25%线 (Q1)</th></tr></thead><tbody>`;
    statsData.forEach((s, i) => {
        const classStats = fbCalcClassStats(FB_CLASSES[i].students || []);
        tableHtml += `<tr><td>${labels[i]}</td><td>${classStats.count}</td><td>${classStats.male}</td><td>${classStats.female}</td><td>${s.avg.toFixed(2)}</td><td>${s.sd.toFixed(2)}</td><td>${(s.max - s.min).toFixed(1)}</td><td>${s.q3}</td><td>${s.q1}</td></tr>`;
    });
    const nextTableHtml = tableHtml + `</tbody></table>` + fbBuildSubjectBalanceTable(labels);
    if (tableContainer && tableContainer.innerHTML !== nextTableHtml) {
        tableContainer.innerHTML = nextTableHtml;
        tableContainer.dataset.freshmanBalanceSig = signature;
    }
    FreshmanExamPerfCache.balanceSignature = signature;
    FreshmanExamPerfCache.balanceTableHtml = nextTableHtml;
    if (!ctx) return;
    if (!window.Chart) {
        if (!balanceChartLoadPending && typeof window.ensureChartVendorLoaded === 'function') {
            balanceChartLoadPending = true;
            window.ensureChartVendorLoaded()
                .then(() => {
                    balanceChartLoadPending = false;
                    if (document.getElementById('freshman-simulator')?.classList.contains('active')
                        || document.getElementById('exam-arranger')?.classList.contains('active')) {
                        FreshmanExamPerfCache.balanceChartSignature = '';
                        FB_renderBalanceChart();
                    }
                })
                .catch((error) => {
                    balanceChartLoadPending = false;
                    console.warn('[freshman] chart runtime load failed:', error);
                });
        }
        return;
    }
    if (FreshmanExamPerfCache.balanceChartSignature === signature) return;
    if (balanceChartInstance) balanceChartInstance.destroy();
    balanceChartInstance = new Chart(ctx, {
        type: 'bar', data: { labels: labels, datasets: [{ label: '平均分', data: statsData.map(s => s.avg), type: 'scatter', backgroundColor: '#2563eb', borderColor: '#2563eb', pointStyle: 'rectRot', pointRadius: 6 }, { label: '分数区间 (Min-Max)', data: statsData.map(s => [s.min, s.max]), backgroundColor: 'rgba(156, 163, 175, 0.2)', borderColor: 'rgba(156, 163, 175, 0.5)', borderWidth: 1, barPercentage: 0.1 }, { label: '核心分布 (Q1-Q3)', data: statsData.map(s => [s.q1, s.q3]), backgroundColor: 'rgba(37, 99, 235, 0.5)', borderColor: '#1e40af', borderWidth: 1, barPercentage: 0.6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: function (context) { const s = statsData[context.dataIndex]; if (context.dataset.type === 'scatter') return `平均分: ${s.avg.toFixed(2)}`; if (context.datasetIndex === 1) return `范围: ${s.min} - ${s.max}`; if (context.datasetIndex === 2) return `核心区间: ${s.q1} - ${s.q3}`; } } }, title: { display: true, text: '班级分数结构对比 (箱线图)' } }, scales: { y: { beginAtZero: false, title: { display: true, text: '分数' } } } }
    });
    FreshmanExamPerfCache.balanceChartSignature = signature;
}

const HistoryManager = {
    past: [],   // 过去的状态栈
    future: [], // 未来的状态栈 (供重做)
    limit: 20,  // 最多记录20步，防止内存溢出

    // 1. 记录当前状态 (在修改数据前调用)
    record: function () {
        // 深拷贝当前班级数据 (FB_CLASSES)
        // 注意：这里我们只记录当前正在操作的班级，以节省内存
        if (FB_CUR_CLASS_IDX === -1) return;

        const currentClassData = FB_CLASSES[FB_CUR_CLASS_IDX];
        const snapshot = JSON.parse(JSON.stringify(currentClassData));

        this.past.push(snapshot);
        if (this.past.length > this.limit) this.past.shift(); // 超过限制删最早的

        this.future = []; // 一旦有新操作，清空未来栈
        this.updateUI();
    },

    // 2. 执行撤销
    undo: function () {
        if (this.past.length === 0) return;

        // A. 把当前状态推入未来栈
        const current = JSON.parse(JSON.stringify(FB_CLASSES[FB_CUR_CLASS_IDX]));
        this.future.push(current);

        // B. 从过去栈取出上一个状态
        const previous = this.past.pop();
        FB_CLASSES[FB_CUR_CLASS_IDX] = previous;

        // C. 刷新视图
        this.refreshView("已撤销 ↩");
    },

    // 3. 执行重做
    redo: function () {
        if (this.future.length === 0) return;

        // A. 把当前状态推入过去栈
        const current = JSON.parse(JSON.stringify(FB_CLASSES[FB_CUR_CLASS_IDX]));
        this.past.push(current);

        // B. 从未来栈取出下一个状态
        const next = this.future.pop();
        FB_CLASSES[FB_CUR_CLASS_IDX] = next;

        // C. 刷新视图
        this.refreshView("已重做 ↪");
    },

    // 4. 辅助：刷新界面和按钮状态
    refreshView: function (msg) {
        FB_renderSeatMap(); // 重绘座位表
        this.updateUI();
        UI.toast(msg, 'info'); // 提示用户
    },

    updateUI: function () {
        const btnUndo = document.getElementById('btn_undo');
        const btnRedo = document.getElementById('btn_redo');
        if (btnUndo) {
            btnUndo.disabled = (this.past.length === 0);
            btnUndo.className = this.past.length > 0 ? "btn btn-primary" : "btn btn-gray";
        }
        if (btnRedo) {
            btnRedo.disabled = (this.future.length === 0);
            btnRedo.className = this.future.length > 0 ? "btn btn-primary" : "btn btn-gray";
        }
    },

    // 5. 初始化/清空
    reset: function () {
        this.past = [];
        this.future = [];
        this.updateUI();
    }
};

function FB_openSeatMap(clsId) {
    HistoryManager.reset();
    FB_CUR_CLASS_IDX = clsId; const cls = FB_CLASSES[clsId]; document.getElementById('seat_class_title').innerText = cls.name;
    document.getElementById('fb_seat_view').classList.remove('hidden'); document.getElementById('fb_seat_view').scrollIntoView({ behavior: 'smooth' });
    updateConstraintWidgetsContext('fb'); // 联动更新
    if (!cls.seatLayout) { FB_autoSeatAlgo(); } else { FB_renderSeatMap(); }
    FB_initScenarioSelect(); // <--- 记得加上这句
}

// --- 家长查分轻量包生成器 (严格验证版：必须输入 密码+班级+姓名) ---
const STANDALONE_EXPORT_LIB_SOURCE_CACHE = Object.create(null);

function getStandaloneExportLibraryCandidates(src) {
    const normalized = String(src || '').trim();
    const candidates = [];
    const pushCandidate = (value) => {
        const text = String(value || '').trim();
        if (!text || candidates.includes(text)) return;
        candidates.push(text);
    };
    pushCandidate(normalized);
    if (window.location && window.location.protocol === 'file:' && normalized.startsWith('./assets/')) {
        const relativePath = normalized.replace(/^\.\//, '');
        pushCandidate(`./public/${relativePath}`);
        pushCandidate(`./dist/${relativePath}`);
    }
    return candidates;
}

function escapeInlineScriptContent(content) {
    return String(content || '').replace(/<\/script/gi, '<\\/script');
}

async function readStandaloneExportLibrarySource(key, fallbackSrc) {
    if (STANDALONE_EXPORT_LIB_SOURCE_CACHE[key]) return STANDALONE_EXPORT_LIB_SOURCE_CACHE[key];

    const scripts = Array.from(document.querySelectorAll(`script[data-standalone-lib="${key}"]`));
    for (const script of scripts) {
        const inlineText = String(script.textContent || '').trim();
        if (!script.src && inlineText) {
            STANDALONE_EXPORT_LIB_SOURCE_CACHE[key] = inlineText;
            return inlineText;
        }
    }

    const candidates = [];
    scripts.forEach(script => {
        const src = String(script.getAttribute('src') || script.src || '').trim();
        if (src && !candidates.includes(src)) candidates.push(src);
    });
    getStandaloneExportLibraryCandidates(fallbackSrc).forEach(src => {
        if (!candidates.includes(src)) candidates.push(src);
    });

    let lastError = null;
    for (const candidate of candidates) {
        try {
            const response = await fetch(candidate, { cache: 'force-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            if (!text.trim()) throw new Error('EMPTY_SOURCE');
            STANDALONE_EXPORT_LIB_SOURCE_CACHE[key] = text;
            return text;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    throw lastError || new Error(`${key} source unavailable`);
}

async function getStandaloneInquiryPackageLibraries() {
    const [cryptoJsSource, chartJsSource] = await Promise.all([
        readStandaloneExportLibrarySource('crypto-js', './assets/vendor/crypto-js/crypto-js.min.js'),
        readStandaloneExportLibrarySource('chart.js', './assets/vendor/chart.js/chart.umd.min.js')
    ]);

    return {
        cryptoJsSource: escapeInlineScriptContent(cryptoJsSource),
        chartJsSource: escapeInlineScriptContent(chartJsSource)
    };
}

async function ensureInquiryCryptoRuntime() {
    if (typeof CryptoJS !== 'undefined') return CryptoJS;
    if (typeof window.ensureCryptoJsVendorLoaded === 'function') {
        return window.ensureCryptoJsVendorLoaded();
    }
    await new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = './assets/vendor/crypto-js/crypto-js.min.js';
        s.onload = resolve;
        s.onerror = () => reject(new Error('crypto-js load failed'));
        document.head.appendChild(s);
    });
    if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJS runtime unavailable');
    }
    return CryptoJS;
}

async function generateInquiryPackage() {
    const sch = document.getElementById('studentSchoolSelect').value;
    if (!sch || sch.includes('请选择')) return window.UI.alert("请先选择一个学校，系统将生成该校的查分包。");

    if (typeof CryptoJS === 'undefined') {
        try {
            await ensureInquiryCryptoRuntime();
        } catch (error) {
            console.error('[InquiryPackage] crypto-js load failed:', error);
            return window.UI.alert("❌ 导出失败：加密库未加载完成，请刷新页面后重试。");
        }
    }

    // 1. 准备数据
    const schoolRecord = typeof window.getAppSchoolRecord === 'function'
        ? window.getAppSchoolRecord(sch)
        : SCHOOLS[sch];
    const schoolStudents = schoolRecord?.students || [];
    if (!schoolStudents || schoolStudents.length === 0) return window.UI.alert("该学校无数据");

    // 判断是否只有一所学校 (用于控制显示的排名类型)
    const isSingleSchool = Object.keys(SCHOOLS).length <= 1;

    const gradeStats = {};
    SUBJECTS.forEach(sub => {
        const scores = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number');
        if (scores.length > 0) {
            const sum = scores.reduce((a, b) => a + b, 0);
            const avg = sum / scores.length;
            const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
            gradeStats[sub] = { avg: avg, sd: Math.sqrt(variance) };
        } else {
            gradeStats[sub] = { avg: 0, sd: 1 };
        }
    });

    // 2. 数据打包
    const secureData = {};

    schoolStudents.forEach(stu => {
        // 生成唯一 Key: 班级_姓名 (例如: 701_张三)
        // 去除所有空格，确保匹配准确
        const key = (stu.class + "_" + stu.name).replace(/\s+/g, "");

        const scoresSimple = {};

        const radarData = { labels: [], data: [] }; // 雷达图数据
        const varianceData = { labels: [], data: [] }; // 均衡度数据
        const canShowClassRank = typeof hasStudentClassRankScope === 'function' ? hasStudentClassRankScope(stu) : true;
        const canShowTownRank = typeof isCountyDirectStudentForRank === 'function' ? !isCountyDirectStudentForRank(stu) : true;

        SUBJECTS.forEach(sub => {
            if (stu.scores[sub] !== undefined) {
                scoresSimple[sub] = [
                    stu.scores[sub],
                    safeGet(stu, `ranks.${sub}.school`, '-'),
                    canShowTownRank ? safeGet(stu, `ranks.${sub}.township`, '-') : '-'
                ];

                // A. 计算雷达图数据 (百分位)
                // 逻辑复用 renderRadarChart 中的算法
                const allScores = RAW_DATA.map(s => s.scores[sub]).filter(v => v !== undefined).sort((a, b) => b - a);
                const rank = allScores.indexOf(stu.scores[sub]) + 1;
                const total = allScores.length;
                const percentile = ((1 - (rank / total)) * 100).toFixed(1);
                radarData.labels.push(sub);
                radarData.data.push(percentile);

                // B. 计算均衡度数据
                const stats = gradeStats[sub];
                let z = 0;
                if (stats && stats.sd > 0) {
                    z = (stu.scores[sub] - stats.avg) / stats.sd;
                }
                varianceData.labels.push(sub);
                varianceData.data.push(parseFloat(z.toFixed(2)));
            }
        });

        // C. 生成本地规则评语
        const studentComment = typeof generateStudentComment === 'function'
            ? generateStudentComment(stu)
            : '';

        secureData[key] = {
            cls: stu.class,  // 存储班级
            name: stu.name,  // 存储姓名
            s: scoresSimple,
            t: stu.total,
            tr: canShowTownRank ? safeGet(stu, 'ranks.total.township', '-') : '-',
            sr: safeGet(stu, 'ranks.total.school', '-'),
            cr: canShowClassRank ? safeGet(stu, 'ranks.total.class', '-') : '-',
            showClassRank: canShowClassRank,
            showTownRank: canShowTownRank,

            rd: radarData,   // Radar Data
            vd: varianceData,// Variance Data
            cm: studentComment    // Comment

        };
    });

    // 3. 提示设置访问密码
    const password = window.UI && typeof window.UI.prompt === 'function'
        ? await window.UI.prompt(
            '请设置一个访问密码。家长查询时需要同时输入此密码、准确班级和准确姓名。',
            '',
            {
                title: '安全查分包访问密码',
                input: 'password',
                confirmText: '生成查分包',
                inputAttributes: {
                    autocomplete: 'new-password',
                    minlength: 8
                },
                inputValidator: (value) => {
                    const text = String(value || '').trim();
                    if (text.length < 8) return '访问密码至少 8 位';
                    if (!/[A-Za-z]/.test(text) || !/\d/.test(text)) return '访问密码需同时包含字母和数字';
                    return null;
                }
            }
        )
        : window.prompt('请设置一个访问密码。至少 8 位，并同时包含字母和数字。', '');

    if (password === null) return;
    if (!password) return window.UI.alert("❌ 必须设置密码才能生成安全查分包！");
    if (String(password).trim().length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return window.UI.alert("❌ 访问密码至少 8 位，并需同时包含字母和数字。");
    }

    // 使用 CryptoJS 进行 AES 加密
    const jsonStr = JSON.stringify(secureData);
    const encryptedData = CryptoJS.AES.encrypt(jsonStr, password).toString();
    let inquiryPackageLibraries = null;
    try {
        inquiryPackageLibraries = await getStandaloneInquiryPackageLibraries();
    } catch (error) {
        console.error('[InquiryPackage] standalone libs unavailable:', error);
        return window.UI.alert("❌ 导出失败：查分包依赖未准备好，请刷新页面后重试。");
    }
    const encryptedPayloadLiteral = JSON.stringify(encryptedData).replace(/</g, '\\u003c');

    // 4. 构建独立的 HTML 模板 (包含班级输入框)
    const examName = getCurrentConfig().name || "期中考试";
    const genDate = new Date().toLocaleDateString();

    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${sch} - 成绩查询</title>
<script>${inquiryPackageLibraries.cryptoJsSource}<\/script>
<script>${inquiryPackageLibraries.chartJsSource}<\/script>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 420px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #2563eb; margin-bottom: 5px; font-size: 20px; }
    .sub-title { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
    input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; transition:0.3s; }
    input:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    button { width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    button:active { transform: scale(0.98); }

    .password-section { background: #fffbeb; padding: 10px; border-radius: 8px; border: 1px solid #fcd34d; margin-bottom: 15px; }
    .password-section label { color: #b45309; }

    /* 结果卡片样式 */
    .result-box { margin-top: 20px; display: none; animation: fadeIn 0.3s; }
    .score-card { background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 15px; }
    .head-section { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 20px; text-align: center; }
    .total-val { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 5px; }
    .total-lbl { font-size: 12px; opacity: 0.9; }
    .stu-info-bar { background: rgba(0,0,0,0.1); padding: 4px 10px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
    .rank-bar { display: flex; background: #eff6ff; border-bottom: 1px solid #dbeafe; padding: 10px 0; }
    .rank-item { flex: 1; text-align: center; border-right: 1px solid #dbeafe; }
    .rank-item:last-child { border-right: none; }
    .rank-val { font-weight: bold; color: #1e40af; font-size: 15px; }
    .rank-lbl { font-size: 10px; color: #64748b; }
    .sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px; background: #f8fafc; }
    .sub-item { background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .sub-main { display: flex; flex-direction: column; }
    .sub-name { font-size: 13px; color: #64748b; font-weight: bold; }
    .sub-val { font-size: 18px; font-weight: 800; color: #333; margin-top: 2px; }
    .sub-ranks { text-align: right; font-size: 11px; color: #94a3b8; display: flex; flex-direction: column; gap: 2px; }
    .tag-rank { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #ccc; }

    .chart-box { background:white; border-radius:10px; padding:15px; margin-bottom:15px; border:1px solid #e2e8f0; position:relative; min-height:220px; }
    .chart-title { font-size:13px; font-weight:bold; color:#475569; margin-bottom:10px; border-left:4px solid #2563eb; padding-left:8px; }
    .comment-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:15px; margin-bottom:15px; position:relative; }
    .comment-title { font-weight:bold; color:#166534; font-size:14px; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
    .comment-text { font-size:13px; color:#333; line-height:1.6; white-space: pre-wrap; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>
<div class="container">
    <h2>${sch} 成绩查询</h2>
    <div class="sub-title">${examName} | 发布日期: ${genDate}</div>

    <div class="password-section">
        <label>🔐 访问密码 (由老师提供)</label>
        <input type="password" id="inpPass" placeholder="请输入查看密码">
    </div>

    <!-- 👇👇👇 🟢 恢复：班级输入框 (必填) 🟢 👇👇👇 -->
    <div class="form-group">
        <label>班级</label>
        <input type="text" id="inpClass" placeholder="请输入班级 (如: 701)">
    </div>

    <div class="form-group">
        <label>学生姓名</label>
        <input type="text" id="inpName" placeholder="请输入姓名 (如: 张三)">
    </div>

    <button onclick="doSearch()">🔓 解密并查询</button>

    <div id="resultArea" class="result-box"></div>
</div>
<div class="footer">AES 256位端对端加密<br>仅限查询本人成绩</div>

<script>
    const PAYLOAD = ${encryptedPayloadLiteral};
    const IS_SINGLE_SCHOOL = ${isSingleSchool};

    let radarInst = null;
    let varInst = null;
    const notify = (message) => window.alert(message);

    function doSearch() {
        const pass = document.getElementById('inpPass').value.trim();
        const cls = document.getElementById('inpClass').value.trim();
        const name = document.getElementById('inpName').value.trim();
        const resBox = document.getElementById('resultArea');

        if(!pass) return notify("❌ 请输入访问密码");
        if(!cls) return notify("❌ 请输入班级");
        if(!name) return notify("❌ 请输入学生姓名");

        let allData = null;

        // 1. 解密数据
        try {
            if (typeof CryptoJS === 'undefined') return notify("⚠️ 加载中，请稍后重试...");
            const bytes = CryptoJS.AES.decrypt(PAYLOAD, pass);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) throw new Error("密码错误");
            allData = JSON.parse(originalText);
        } catch(e) {
            return notify("⛔ 访问拒绝：密码错误！");
        }

        // 2. 精确查找 (班级 + 姓名 必须完全匹配)
        // 构造 Key：将用户输入的班级和姓名拼接，并去除空格 (例如 "701_张三")
        const key = (cls + "_" + name).replace(/\\s+/g, "");
        const res = allData[key];

        // 3. 渲染结果
        resBox.innerHTML = '';

        if(!res) {
            notify("❌ 未找到学生信息！\\n请检查【班级】和【姓名】是否输入正确。\\n(班级如：701)");
        } else {
            let subHtml = '';
            for(let sub in res.s) {
                const item = res.s[sub];
                let rankHtml = '<span class="tag-rank">校: ' + item[1] + '</span>';
                if (!IS_SINGLE_SCHOOL && res.showTownRank) rankHtml += '<span class="tag-rank">镇: ' + item[2] + '</span>';
                subHtml +=
                    '<div class="sub-item">' +
                        '<div class="sub-main"><div class="sub-name">' + sub + '</div><div class="sub-val">' + item[0] + '</div></div>' +
                        '<div class="sub-ranks">' + rankHtml + '</div>' +
                    '</div>';
            }

            let totalRankHtml =
                '<div class="rank-item"><div class="rank-val">' + res.sr + '</div><div class="rank-lbl">校排</div></div>';
            if (res.showClassRank) totalRankHtml = '<div class="rank-item"><div class="rank-val">' + res.cr + '</div><div class="rank-lbl">班排</div></div>' + totalRankHtml;
            if (!IS_SINGLE_SCHOOL && res.showTownRank) totalRankHtml += '<div class="rank-item"><div class="rank-val">' + res.tr + '</div><div class="rank-lbl">镇排</div></div>';

            // 注意：Canvas 需要固定高度
            const chartsHtml = \`
                <div class="comment-box">
                    <div class="comment-title">👩‍🏫 班主任评语</div>
                    <div class="comment-text">\${res.cm || '暂无评语'}</div>
                </div>

                <div class="chart-box">
                    <div class="chart-title">📊 学科能力分布 (雷达图)</div>
                    <div style="height:200px; position:relative;">
                        <canvas id="mobRadarChart"></canvas>
                    </div>
                </div>

                <div class="chart-box">
                    <div class="chart-title">⚖️ 学科均衡度诊断</div>
                    <div style="height:200px; position:relative;">
                        <canvas id="mobVarChart"></canvas>
                    </div>
                    <div style="font-size:10px; color:#999; text-align:center; margin-top:5px;">
                        注: 柱子朝上为优势科目，朝下为弱势科目
                    </div>
                </div>
            \`;

            resBox.innerHTML =
                '<div class="score-card">' +
                    '<div class="head-section">' +
                        '<div class="stu-info-bar">' + res.cls + '班 · ' + res.name + '</div>' +
                        '<div class="total-val">' + res.t + '</div>' +
                        '<div class="total-lbl">总分</div>' +
                    '</div>' +
                    '<div class="rank-bar">' + totalRankHtml + '</div>' +
                    '<div class="sub-grid">' + subHtml + '</div>' +
                '</div>' +
                '<div style="text-align:center; color:green; font-size:12px; margin-top:10px;">✅ 查询成功</div>';

            resBox.style.display = 'block';

            setTimeout(() => {
                // 1. 绘制雷达图
                if (radarInst) radarInst.destroy();
                const ctxRadar = document.getElementById('mobRadarChart');
                if (ctxRadar && res.rd) {
                    radarInst = new Chart(ctxRadar, {
                        type: 'radar',
                        data: {
                            labels: res.rd.labels,
                            datasets: [{
                                label: '能力值',
                                data: res.rd.data,
                                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                                borderColor: '#2563eb',
                                pointBackgroundColor: '#2563eb'
                            }]
                        },
                        options: {
                            maintainAspectRatio: false,
                            scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { size: 10 } } } },
                            plugins: { legend: { display: false } }
                        }
                    });
                }

                // 2. 绘制均衡度柱状图
                if (varInst) varInst.destroy();
                const ctxVar = document.getElementById('mobVarChart');
                if (ctxVar && res.vd) {
                    const colors = res.vd.data.map(v => v >= 0 ? '#16a34a' : '#dc2626');
                    varInst = new Chart(ctxVar, {
                        type: 'bar',
                        data: {
                            labels: res.vd.labels,
                            datasets: [{
                                label: '相对差异',
                                data: res.vd.data,
                                backgroundColor: colors,
                                borderRadius: 3
                            }]
                        },
                        options: {
                            maintainAspectRatio: false,
                            indexAxis: 'y', // 横向柱状图更适合手机查看长标签
                            scales: {
                                x: { grid: { display: true }, title: {display:true, text:'← 弱势 | 强势 →'} },
                                y: { grid: { display: false } }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
                }
            }, 100);

        }
    }
<\/script>
</body>
</html>`;

    // 5. 下载文件
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sch}_查分包_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.UI.alert("✅ 加密查分包已生成！\n文件名：" + link.download + "\n访问密码：" + password + "\n\n请将文件发给家长，告知密码。\n家长必须输入正确的 [班级] 和 [姓名] 才能查询。");
}

function parseConstraintStr(str) {
    if (!str) return [];
    return str.replace(/，/g, ',').replace(/；/g, ';').split(/[,;]/).map(s => s.trim()).filter(s => s);
}

function parseConflictStr(str) {
    if (!str) return [];
    return str.replace(/，/g, ',').split(',').map(pair => {
        const parts = pair.split('&').map(s => s.trim());
        if (parts.length === 2) return parts;
        return null;
    }).filter(p => p);
}

// ================== 新生分班-座位生成逻辑 ==================
function FB_autoSeatAlgo() {
    HistoryManager.record();
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];

    // 1. 获取现有布局（如果是初次生成，则初始化为空数组）
    let currentLayout = cls.seatLayout || [];
    // 如果长度不够（比如人数变多了），补齐
    if (currentLayout.length < cls.students.length) {
        currentLayout = [...cls.students];
    }

    // 2. 分离“锁定”学生和“自由”学生
    let lockedSlots = {}; // 记录 { 索引: 学生对象 }
    let freeStudents = [];

    // 遍历当前布局，把被锁定的钉在原位，没锁定的扔进池子重排
    currentLayout.forEach((s, idx) => {
        if (s && s.locked) {
            lockedSlots[idx] = s;
        } else {
            if (s) freeStudents.push(s); // 收集所有非锁定学生
        }
    });

    // 3. 处理约束条件 (仅针对自由学生)
    // 使用隐藏Input的值，兼容 Tag Widget
    const diffInput = parseConstraintStr(document.getElementById('fb_c_diff').value);
    const visionInput = parseConstraintStr(document.getElementById('fb_c_vision').value);
    const talkInput = parseConstraintStr(document.getElementById('fb_c_talk').value);
    const conflictInput = parseConflictStr(document.getElementById('fb_c_conflict').value);

    // 获取绑定配置
    const bindInput = parseConflictStr(document.getElementById('fb_c_bind').value); // 复用解析函数，格式也是 A&B
    const bindMap = new Map(); // name -> partnerName
    bindInput.forEach(pair => {
        bindMap.set(pair[0], pair[1]);
        bindMap.set(pair[1], pair[0]);
    });

    // 重新标记临时属性（只针对自由学生，锁定的不管）
    freeStudents.forEach(s => {
        s._isDiff = false; s._isVision = false;
        if (diffInput.includes(s.name) || talkInput.includes(s.name)) s._isDiff = true;
        if (visionInput.includes(s.name)) s._isVision = true;
        s._bindPartner = bindMap.get(s.name); // 标记搭档
    });

    const useH = document.getElementById('rule_s_height').checked;
    const useV = document.getElementById('rule_s_vision').checked;
    const useG = document.getElementById('rule_s_gender').checked;
    const useD = document.getElementById('rule_s_diff').checked;

    // --- 排序逻辑 (仅对自由池) ---
    if (useH) freeStudents.sort((a, b) => a.height - b.height);
    // 核心逻辑：处理绑定关系，使其在列表中紧邻
    // 1. 提取所有有绑定关系的且在自由池中的学生
    let boundPairs = [];
    let processedBindNames = new Set();
    let singleStudents = [];

    freeStudents.forEach(s => {
        if (s._bindPartner && !processedBindNames.has(s.name)) {
            // 找搭档
            const partner = freeStudents.find(p => p.name === s._bindPartner);
            if (partner) {
                // 找到一对，放入 Pairs
                processedBindNames.add(s.name);
                processedBindNames.add(partner.name);
                // 两人按身高排序，矮的在前
                const pair = [s, partner].sort((a, b) => a.height - b.height);
                boundPairs.push(pair);
            } else {
                // 搭档可能被锁定了或者不在班里，降级为单人
                singleStudents.push(s);
            }
        } else if (!processedBindNames.has(s.name)) {
            singleStudents.push(s);
        }
    });

    // 2. 将 Pairs 视为一个整体 (用两人平均身高) 与 Singles 混排
    // 这里为了简单，直接把 Pairs 插在 Singles 队列中对应身高位置
    // 视力优先原则：如果 Pair 中有人视力不好，整个 Pair 提至最前

    let finalQueue = [];
    let visionQueue = [];
    let normalQueue = [];

    // 分流单人
    singleStudents.forEach(s => {
        if (visionInput.length > 0 && s._isVision) visionQueue.push(s);
        else normalQueue.push(s);
    });

    // 分流 Pair
    boundPairs.forEach(pair => {
        const isVisionPair = pair.some(s => s._isVision);
        if (visionInput.length > 0 && isVisionPair) {
            // 拆开插入到视力队列头部（保持相邻）
            visionQueue.push(pair[0], pair[1]);
        } else {
            // 插入到普通队列，根据平均身高找到位置
            const pairAvgHeight = (pair[0].height + pair[1].height) / 2;
            // 简单的二分查找或者直接遍历插入，这里用简单遍历
            let inserted = false;
            for (let i = 0; i < normalQueue.length; i++) {
                // 如果当前位置是普通学生，且身高比 Pair 高，插在前面
                if (normalQueue[i].height > pairAvgHeight) {
                    normalQueue.splice(i, 0, pair[0], pair[1]);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                normalQueue.push(pair[0], pair[1]);
            }
        }
    });

    freeStudents = [...visionQueue, ...normalQueue];

    // 3. 处理难管插空 (尽量避开破坏 Pair，简化处理：如果插空位置正好拆散 Pair，往后挪一位)
    // (由于 Pair 在数组中是相邻的，只要填充逻辑是线性的，大部分情况会同桌)
    // ... 原有的难管逻辑略微复杂，这里暂且保留原有逻辑，但要注意它可能会打乱 Pair
    // 为保证“强绑定”，建议在此处禁用“难管插空”对 Pair 的破坏，或者简单跳过。
    // (此处代码复用上文旧代码的逻辑，暂不修改难管部分，通常只会轻微影响)

    // 视力生提前 (放在数组前面)
    if (visionInput.length > 0 || useV) {
        const visions = freeStudents.filter(s => s._isVision || (useV && s.vision < 4.8));
        const others = freeStudents.filter(s => !s._isVision && !(useV && s.vision < 4.8));
        freeStudents = [...visions, ...others];
    }

    // 难管生插空 (均匀分布)
    const diffs = freeStudents.filter(s => s._isDiff || (useD && s.isDiff));
    if (diffs.length > 0) {
        const cleanList = freeStudents.filter(s => !s._isDiff && !(useD && s.isDiff));
        const step = Math.floor(cleanList.length / (diffs.length + 1));
        let currentPos = step;
        diffs.forEach(d => {
            if (currentPos < cleanList.length) cleanList.splice(currentPos, 0, d);
            else cleanList.push(d);
            currentPos += step + 1;
        });
        freeStudents = cleanList;
    }

    // 男女混排 (简单的相邻互斥)
    if (useG) {
        for (let i = 0; i < freeStudents.length - 1; i += 2) {
            if (freeStudents[i].gender === freeStudents[i + 1].gender) {
                for (let j = i + 2; j < freeStudents.length; j++) {
                    if (freeStudents[j].gender !== freeStudents[i].gender) {
                        [freeStudents[i + 1], freeStudents[j]] = [freeStudents[j], freeStudents[i + 1]];
                        break;
                    }
                }
            }
        }
    }

    // 4. 重组布局：将自由学生填回非锁定的坑位
    let newLayout = [];
    let freeIdx = 0;
    // 总座位数取 学生总数 和 现有布局长度 的最大值
    const totalSeats = Math.max(cls.students.length, currentLayout.length);

    for (let i = 0; i < totalSeats; i++) {
        if (lockedSlots[i]) {
            newLayout[i] = lockedSlots[i]; // 放回锁定学生
        } else {
            if (freeIdx < freeStudents.length) {
                newLayout[i] = freeStudents[freeIdx++]; // 填入自由学生
            } else {
                newLayout[i] = null; // 空位
            }
        }
    }

    cls.seatLayout = newLayout;
    FB_renderSeatMap();
}

function FB_renderSeatMap() {
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    const container = document.getElementById('seat_map_container');
    container.innerHTML = '';

    const groups = parseInt(document.getElementById('seat_opt_groups').value);
    const colsPerGroup = parseInt(document.getElementById('seat_opt_cols').value);

    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${groups}, 1fr)`;
    container.style.gap = '50px';
    container.style.alignItems = 'start';
    container.style.padding = '20px'; // 增加内边距防止旋转溢出

    const list = cls.seatLayout || cls.students;
    const rowCapacity = groups * colsPerGroup;
    const totalRows = Math.ceil(list.length / rowCapacity);

    const groupEls = [];
    for (let g = 0; g < groups; g++) {
        const gel = document.createElement('div'); gel.className = 'seat-group';
        gel.style.display = 'grid'; gel.style.gridTemplateColumns = `repeat(${colsPerGroup}, 1fr)`;
        gel.style.gap = '10px'; gel.style.position = 'relative';
        groupEls.push(gel); container.appendChild(gel);
    }

    for (let r = 0; r < totalRows; r++) {
        for (let g = 0; g < groups; g++) {
            for (let c = 0; c < colsPerGroup; c++) {
                const stuIdx = r * rowCapacity + g * colsPerGroup + c;
                const stu = list[stuIdx];
                const desk = document.createElement('div');
                desk.className = 'desk';

                if (stu) {
                    if (stu.gender === 'M') desk.classList.add('is-male');
                    if (stu.gender === 'F') desk.classList.add('is-female');
                    if (stu.isDiff || stu._isDiff) desk.classList.add('is-diff');
                    const status = fbStudentStatus(stu);
                    if (status === '学籍在册未考试') desk.classList.add('is-no-exam');
                    if (status === '辍学/长期离校') desk.classList.add('is-dropout');
                    if (status === '新转入') desk.classList.add('is-transfer-in');
                    // 处理锁定状态
                    if (stu.locked) desk.classList.add('locked');

                    desk.draggable = !stu.locked; // 锁定的不能拖
                    desk.dataset.idx = stuIdx;
                    const statusText = fbStudentStatusExplanation(stu);
                    desk.title = statusText || '正常学生';
                    desk.innerHTML = `<div class="desk-name">${stu.name}</div><div class="desk-info"><span>${stu.height}cm</span><span>${fbIsNoExamStudent(stu) ? '未参加考试' : stu.score}</span></div><div class="desk-popover">视力:${stu.vision} | ${statusText || `备注:${stu.remarks || '无'}`}</div>`;

                    // 绑定右键事件
                    desk.oncontextmenu = (e) => {
                        e.preventDefault();
                        FB_toggleLock(stuIdx);
                    };

                    // 拖拽事件 (仅未锁定时有效)
                    if (!stu.locked) {
                        desk.ondragstart = (e) => { e.dataTransfer.setData('text/plain', stuIdx); desk.classList.add('dragging'); };
                        desk.ondragend = () => desk.classList.remove('dragging');
                        desk.ondragover = (e) => { e.preventDefault(); desk.classList.add('drag-over'); };
                        desk.ondragleave = () => desk.classList.remove('drag-over');
                        desk.ondrop = (e) => {
                            e.preventDefault();
                            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                            const toIdx = stuIdx;
                            // 只有当位置真的发生变化，且双方都没锁定时，才记录历史
                            if (fromIdx !== toIdx && !list[toIdx].locked && !list[fromIdx].locked) {
                                HistoryManager.record(); // 📸 记录！因为马上要交换了
                            }
                            if (!list[toIdx].locked && !list[fromIdx].locked) {
                                [cls.seatLayout[fromIdx], cls.seatLayout[toIdx]] = [cls.seatLayout[toIdx], cls.seatLayout[fromIdx]];
                                FB_renderSeatMap();
                            }
                        };
                    }
                } else {
                    desk.style.visibility = 'hidden';
                }
                groupEls[g].appendChild(desk);
            }
        }
    }

    // 渲染学习小组框 (保持不变)
    for (let g = 0; g < groups; g++) {
        const gel = groupEls[g];
        if (colsPerGroup % 2 === 0) {
            for (let r = 0; r < totalRows; r += 2) {
                for (let c = 0; c < colsPerGroup; c += 2) {
                    const box = document.createElement('div'); box.className = 'learning-group-box';
                    box.style.left = `${c * 90 - 5}px`; box.style.top = `${r * 65 - 5}px`; box.style.width = `175px`; box.style.height = `125px`;
                    const groupsPerBigRow = colsPerGroup / 2; const groupNum = (g * (Math.ceil(totalRows / 2) * groupsPerBigRow)) + ((r / 2) * groupsPerBigRow) + (c / 2) + 1;
                    box.innerHTML = `<div class="learning-group-label">小组 ${groupNum}</div>`; gel.appendChild(box);
                }
            }
        }
    }
}

// 辅助函数：切换锁定状态
function FB_toggleLock(idx) {
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    const stu = cls.seatLayout[idx];
    if (stu) {
        stu.locked = !stu.locked; // 切换状态
        FB_renderSeatMap(); // 重绘
    }
}

// 辅助函数：切换视角旋转
function FB_toggleViewRotation() {
    const canvas = document.querySelector('.seat-canvas');
    if (!canvas) return;
    canvas.classList.toggle('view-rotated');
}

function FB_saveToLocal() {
    if (!FB_CLASSES.length) return window.UI.alert("暂无数据");
    localStorage.setItem('FB_DATA_BACKUP', JSON.stringify(FB_CLASSES));
    window.UI.alert(`方案已保存至浏览器缓存${Object.keys(FB_FIXED_ASSIGNMENTS).length ? `（当前会话保留 ${Object.keys(FB_FIXED_ASSIGNMENTS).length} 条指定班级）` : ''}`);
}
function FB_exportResult() {
    if (!FB_CLASSES.length) return window.UI.alert("无数据"); const wb = XLSX.utils.book_new(); const subjects = fbExportSubjectNames(FB_CLASSES); const data = [['班级', '座位号', '姓名', '性别', '总分', ...subjects.map((subject) => `${subject}成绩`), '身高', '视力', '状态', '状态说明', '同班组合', '备注']];
    const students = [];
    FB_CLASSES.forEach(c => { const list = c.seatLayout || c.students; list.forEach((s, i) => { const status = fbStudentStatus(s); const noExam = fbIsNoExamStudent(s); data.push([c.name, i + 1, s.name, fbGenderLabel(s.gender), Number.isFinite(Number(s.score)) && !noExam ? s.score : (noExam ? '' : s.score), ...subjects.map((subject) => { const value = fbStudentSubjectScore(s, subject); return value === null ? (noExam ? '未参加考试' : '—') : value; }), s.height, s.vision, status || '正常', fbStudentStatusExplanation(s), fbSameGroupLabel(s), s.remarks]); students.push(s); }); });
    const ws = XLSX.utils.aoa_to_sheet(data); fbDecorateRosterExportSheet(ws, data[0], students);
    XLSX.utils.book_append_sheet(wb, ws, "分班与座位表");
    fbAppendClassRosterSheets(wb, FB_CLASSES, '最终名单');
    XLSX.writeFile(wb, "新生分班结果.xlsx");
}
function FB_exportResultWithBalance() {
    if (!FB_CLASSES.length) return window.UI.alert('请先生成分班方案。', 'warning');
    const scheme = FB_SCHEMES_CACHE.find(item => item.id === FB_ACTIVE_SCHEME_ID) || FB_SCHEMES_CACHE[0] || { data: FB_CLASSES, examData: FB_CLASSES, finalData: FB_CLASSES };
    const subjects = fbMajorSubjectsForGrade();
    const wb = XLSX.utils.book_new();
    const buildRows = (classes) => {
        const rows = [['班级', '总人数', '男生', '女生', '有效成绩人数']];
        subjects.forEach(s => rows[0].push(`${s}平均分`, `${s}优秀率`, `${s}及格率`));
        const metrics = Object.fromEntries(subjects.map(s => [s, fbSubjectMetric(classes, s)]));
        (classes || []).forEach((cls, i) => {
            const stats = fbCalcClassStats(cls.students || []);
            const scored = (cls.students || []).filter(s => !fbIsNoExamStudent(s) && Number.isFinite(Number(s?.score))).length;
            const row = [cls.name, stats.count, stats.male, stats.female, scored];
            subjects.forEach(s => { const m = metrics[s][i]; row.push(m.n ? Number(m.avg.toFixed(2)) : null, m.n ? Number((m.excellent * 100).toFixed(2)) : null, m.n ? Number((m.pass * 100).toFixed(2)) : null); });
            rows.push(row);
        });
        return rows;
    };
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buildRows(scheme.examData || FB_CLASSES)), '考试名单两率一分');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buildRows(scheme.finalData || FB_CLASSES)), '最终名单两率一分');
    const roster = [['阶段', '班级', '姓名', '性别', '总分', '是否后置分配', '状态', '状态说明', '同班组合', '备注']];
    const rosterStudents = [];
    (scheme.finalData || FB_CLASSES).forEach(cls => (cls.students || []).forEach(s => { const status = fbStudentStatus(s); const noExam = fbIsNoExamStudent(s); roster.push(['最终名单', cls.name, s.name, fbGenderLabel(s.gender), Number.isFinite(Number(s.score)) && !noExam ? s.score : '', noExam ? '是' : '否', status || '正常', fbStudentStatusExplanation(s), fbSameGroupLabel(s), s.remarks || '']); rosterStudents.push(s); }));
    const rosterSheet = XLSX.utils.aoa_to_sheet(roster); fbDecorateRosterExportSheet(rosterSheet, roster[0], rosterStudents);
    XLSX.utils.book_append_sheet(wb, rosterSheet, '最终分班名单');
    fbAppendClassRosterSheets(wb, scheme.finalData || FB_CLASSES, '最终名单');
    XLSX.writeFile(wb, '新生分班方案及两率一分.xlsx');
}

// --- 固定搭档 (绑定) 辅助函数 ---
function addBindPair(type) {
    const idA = 'fb_bind_sel_a';
    const idB = 'fb_bind_sel_b';
    const wrapperId = 'widget_fb_bind';
    const hiddenId = 'fb_c_bind';

    const selA = document.getElementById(idA);
    const selB = document.getElementById(idB);


    if (!selA || !selB) return;
    if (!selA.value || !selB.value) return window.UI.alert("请先选择两个学生");
    if (selA.value === selB.value) return window.UI.alert("不能选择同一个学生");

    addTagToWidget(wrapperId, hiddenId, `${selA.value}&${selB.value}`);
    selA.value = ""; selB.value = "";
}

// --- 方案管理 (保存/读取) ---
function FB_initScenarioSelect() {
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    const sel = document.getElementById('seat_scenario_select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 选择方案 --</option>';
    if (!cls) {
        sel.disabled = true;
        return;
    }
    sel.disabled = false;

    if (!cls.scenarios) cls.scenarios = {}; // 初始化存储结构

    Object.keys(cls.scenarios).forEach(name => {
        sel.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

async function FB_saveScenario() {
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    if (!cls) return window.UI.alert("请先打开一个班级座位图");
    if (!cls.seatLayout || cls.seatLayout.length === 0) return window.UI.alert("当前座位表为空，无法保存");

    const name = await window.UI.prompt("请输入方案名称 (如：期中考试、日常、互助组)", `方案 ${Object.keys(cls.scenarios || {}).length + 1}`, {
        title: '保存座位方案',
        confirmText: '保存'
    });
    if (!name) return;

    if (!cls.scenarios) cls.scenarios = {};
    // 深度拷贝当前布局
    cls.scenarios[name] = JSON.parse(JSON.stringify(cls.seatLayout));

    window.UI.alert(`方案 [${name}] 保存成功！`);
    FB_initScenarioSelect(); // 刷新下拉框
    document.getElementById('seat_scenario_select').value = name;
}

async function FB_loadScenario() {
    const sel = document.getElementById('seat_scenario_select');
    if (!sel) return;
    const name = sel.value;
    if (!name) return;

    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    if (!cls) return window.UI.alert("请先打开一个班级座位图");
    if (cls.scenarios && cls.scenarios[name]) {
        if (!await window.UI.confirm(`确定要加载 [${name}] 方案吗？\n当前未保存的修改将丢失。`)) {
            sel.value = "";
            return;
        }
        // 恢复布局
        cls.seatLayout = JSON.parse(JSON.stringify(cls.scenarios[name]));
        FB_renderSeatMap();
    }
}

async function FB_deleteScenario() {
    const sel = document.getElementById('seat_scenario_select');
    if (!sel) return;
    const name = sel.value;
    if (!name) return window.UI.alert("请先选择一个要删除的方案");

    if (await window.UI.confirm(`确定要永久删除方案 [${name}] 吗？`)) {
        const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
        if (!cls) return window.UI.alert("请先打开一个班级座位图");
        delete cls.scenarios[name];
        FB_initScenarioSelect();
    }
}

// Hook: 在打开座位表时初始化下拉框
// 需要修改 FB_openSeatMap 函数，这里通过重写或在原函数后追加逻辑
// 为了简单，请在 FB_openSeatMap 函数内部末尾添加 FB_initScenarioSelect();

// ================== 智能考场编排逻辑 ==================
function EXAM_loadData(input) {
    const file = input.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result); const wb = XLSX.read(data, { type: 'array' }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            if (!json.length) throw new Error("Excel没有数据");
            EXAM_DATA = json.map(r => ({ name: r['姓名'] || '未知', class: r['班级'] || r['班'] || '未知', school: r['学校'] || '', score: parseFloat(r['总分'] || r['score'] || 0) }));
            window.UI.alert(`✅ 已导入 ${EXAM_DATA.length} 名学生，准备进行考场编排。`);
        } catch (err) { window.UI.alert("读取失败：" + err.message); }
    }; reader.readAsArrayBuffer(file);
}

function EXAM_generate() {
    if (!EXAM_DATA.length) return window.UI.alert("请先导入学生名单");

    const prefix = document.getElementById('exam_prefix').value;
    const seatsPerRoom = parseInt(document.getElementById('exam_seats_per_room').value) || 30;
    const useSeparate = document.getElementById('exam_opt_separate').checked;
    const useSnake = document.getElementById('exam_opt_snake').checked;

    // 1. 初步排序：按成绩降序 (保证考场分层)
    let list = [...EXAM_DATA].sort((a, b) => b.score - a.score);

    // 2. 同班互斥逻辑 (核心业务升级)
    // 原理：遍历列表，如果发现当前学生与上一个学生同班，则向后寻找非同班学生进行交换
    // 限制：仅在小范围内(如后10名)寻找，避免破坏成绩分层太严重
    if (useSeparate) {
        let swapCount = 0;
        for (let i = 1; i < list.length - 1; i++) {
            // 如果当前学生与前一个同班
            if (list[i].class === list[i - 1].class) {
                // 向后寻找最近的一个不同班同学
                let swapped = false;
                for (let j = i + 1; j < Math.min(i + 15, list.length); j++) {
                    if (list[j].class !== list[i].class && list[j].class !== list[i - 1].class) {
                        // 交换位置
                        [list[i], list[j]] = [list[j], list[i]];
                        swapped = true;
                        swapCount++;
                        break;
                    }
                }
            }
        }
        if (swapCount > 0) UI.toast(`已智能微调 ${swapCount} 人次以打散同班同学`, 'success');
    }

    EXAM_ROOMS = [];
    const cols = 4; // 假设每行4列 (用于计算蛇形)

    list.forEach((s, i) => {
        // 基础考号逻辑
        s.examNo = prefix + String(i + 1).padStart(3, '0');
        s.roomNo = Math.floor(i / seatsPerRoom) + 1;

        // 3. 座位号计算
        let seatIdx = (i % seatsPerRoom); // 0 ~ 29

        // 蛇形排列逻辑 (S型)
        // 假设排列是：
        // 1 2 3 4
        // 8 7 6 5 (反向)
        // 9 10 11 12
        if (useSnake) {
            const row = Math.floor(seatIdx / cols);
            // 如果是奇数行(第2行, idx=1)，则列号反转
            if (row % 2 !== 0) {
                const col = seatIdx % cols;
                const reversedCol = (cols - 1) - col;
                // 重新计算 seatIdx
                seatIdx = (row * cols) + reversedCol;
            }
        }

        s.seatNo = seatIdx + 1;

        if (!EXAM_ROOMS[s.roomNo - 1]) {
            EXAM_ROOMS[s.roomNo - 1] = { id: s.roomNo, students: [] };
        }
        EXAM_ROOMS[s.roomNo - 1].students.push(s);
    });

    // 如果用了蛇形，按座号重新排序一下，方便打印查看
    if (useSnake) {
        EXAM_ROOMS.forEach(r => r.students.sort((a, b) => a.seatNo - b.seatNo));
    }

    document.getElementById('exam-results-area').classList.remove('hidden');
    EXAM_renderOverview();
    EXAM_renderStudentList();
    EXAM_renderProctorTable();
    EXAM_renderPrintView();
}

function EXAM_switchView(view, btn) {
    const links = Array.from(document.querySelectorAll('#exam-results-area .nav-link'));
    links.forEach(l => l.classList.remove('active'));
    const activeBtn = btn || links.find(link => {
        const handler = link.getAttribute('onclick') || '';
        return handler.includes(`'${view}'`) || handler.includes(`"${view}"`);
    });
    if (activeBtn) activeBtn.classList.add('active');
    document.getElementById('exam-view-overview').classList.add('hidden'); document.getElementById('exam-view-students').classList.add('hidden'); document.getElementById('exam-view-proctor').classList.add('hidden');
    const targetView = document.getElementById('exam-view-' + view);
    if (targetView) targetView.classList.remove('hidden');
}

function EXAM_renderOverview() {
    const container = document.getElementById('exam_room_grid'); if (!container) return;
    const signature = examRoomSignature();
    if (FreshmanExamPerfCache.examOverviewSignature === signature) {
        if (container.innerHTML !== FreshmanExamPerfCache.examOverviewHtml) container.innerHTML = FreshmanExamPerfCache.examOverviewHtml;
        return;
    }
    const html = EXAM_ROOMS.map(room => {
        const first = room.students[0].examNo;
        const last = room.students[room.students.length - 1].examNo;
        return `<div class="exam-room-card analysis-exam-room-card" onclick="window.UI.alert('提示：请使用“打印桌贴”功能查看该考场的详细座次表')"><div class="exam-room-title analysis-exam-room-title">第 ${String(room.id).padStart(2, '0')} 考场</div><div class="exam-room-info analysis-exam-room-info"><span>人数: ${room.students.length}</span></div><div class="exam-room-range analysis-exam-room-range">${first} - ${last}</div></div>`;
    }).join('');
    FreshmanExamPerfCache.examOverviewSignature = signature;
    FreshmanExamPerfCache.examOverviewHtml = html;
    if (container.innerHTML !== html) container.innerHTML = html;
}

function EXAM_renderStudentList() {
    const tbody = document.querySelector('#exam_student_table tbody'); if (!tbody) return;
    const signature = examRoomSignature();
    if (FreshmanExamPerfCache.examStudentListSignature === signature) {
        if (tbody.innerHTML !== FreshmanExamPerfCache.examStudentListHtml) tbody.innerHTML = FreshmanExamPerfCache.examStudentListHtml;
        return;
    }
    let html = '';
    const sorted = [...EXAM_DATA].sort((a, b) => { if (a.class !== b.class) return String(a.class).localeCompare(String(b.class), undefined, { numeric: true }); return a.examNo.localeCompare(b.examNo); });
    sorted.slice(0, 500).forEach(s => { html += `<tr><td>${s.examNo}</td><td>${s.name}</td><td>${s.class}</td><td>${String(s.roomNo).padStart(2, '0')}</td><td>${String(s.seatNo).padStart(2, '0')}</td><td>${s.score}</td></tr>`; });
    if (sorted.length > 500) html += `<tr><td colspan="6" style="text-align:center">...更多数据请导出Excel查看...</td></tr>`;
    FreshmanExamPerfCache.examStudentListSignature = signature;
    FreshmanExamPerfCache.examStudentListHtml = html;
    if (tbody.innerHTML !== html) tbody.innerHTML = html;
}

function EXAM_renderProctorTable() {
    const tbody = document.querySelector('#exam_proctor_table tbody'); if (!tbody) return;
    const signature = examRoomSignature();
    if (FreshmanExamPerfCache.examProctorSignature === signature) {
        if (tbody.innerHTML !== FreshmanExamPerfCache.examProctorHtml) tbody.innerHTML = FreshmanExamPerfCache.examProctorHtml;
        return;
    }
    let html = '';
    EXAM_ROOMS.forEach(room => { const first = room.students[0].examNo; const last = room.students[room.students.length - 1].examNo; html += `<tr><td>第 ${String(room.id).padStart(2, '0')} 考场</td><td>${room.students.length}</td><td>${first} - ${last}</td><td></td><td></td></tr>`; });
    FreshmanExamPerfCache.examProctorSignature = signature;
    FreshmanExamPerfCache.examProctorHtml = html;
    if (tbody.innerHTML !== html) tbody.innerHTML = html;
}

function EXAM_renderPrintView() {
    const container = document.getElementById('batch-print-area-wrapper') || document.getElementById('batch-print-container'); if (!container) return;
    const signature = examRoomSignature();
    if (FreshmanExamPerfCache.examPrintSignature === signature) {
        if (container.innerHTML !== FreshmanExamPerfCache.examPrintHtml) container.innerHTML = FreshmanExamPerfCache.examPrintHtml;
        return;
    }
    let html = '';
    EXAM_ROOMS.forEach(room => {
        let seatsHtml = ''; room.students.forEach(s => { seatsHtml += `<div class="exam-print-seat"><div class="exam-print-seat-num">第${String(s.seatNo).padStart(2, '0')}号</div><div class="exam-print-seat-name">${s.name}</div><div class="exam-print-seat-id">考号: ${s.examNo}</div><div style="font-size:10px;">${s.class}</div></div>`; });
        html += `<div class="exam-print-page"><div class="exam-print-header">第 ${String(room.id).padStart(2, '0')} 考场座位表 (共${room.students.length}人)</div><div class="exam-print-grid">${seatsHtml}</div><div style="margin-top:20px; font-size:12px;">监考员签字：_________________   &nbsp;&nbsp;&nbsp; 巡考员签字：_________________</div></div>`;
    });
    FreshmanExamPerfCache.examPrintSignature = signature;
    FreshmanExamPerfCache.examPrintHtml = html;
    if (container.innerHTML !== html) container.innerHTML = html;
}

function EXAM_generateDeskLabels() {
    if (!EXAM_ROOMS || EXAM_ROOMS.length === 0) return window.UI.alert("请先点击“一键生成考场安排”");

    const container = document.getElementById('desk-labels-print-area');
    container.innerHTML = '';
    let html = '';

    EXAM_ROOMS.forEach(room => {
        html += `<div class="desk-label-page">`;

        room.students.forEach(s => {
            html += `
                    <div class="desk-label-card">
                        <!-- 1. 顶部：考号 (最大) -->
                        <div class="dl-exam-no">${s.examNo}</div>

                        <!-- 2. 中间：班级(左) + 姓名(右) (中等) -->
                        <div class="dl-main-row">
                            <span>${s.class}</span>
                            <span>${s.name}</span>
                        </div>

                        <!-- 3. 底部：考场 + 座号 (最小) -->
                        <div class="dl-footer-row">
                            <span class="dl-room-box">${String(room.id).padStart(2, '0')}场</span>
                            <span class="dl-seat-box">${String(s.seatNo).padStart(2, '0')}座</span>
                        </div>
                    </div>
                `;
        });
        html += `</div>`;
    });

    container.innerHTML = html;
    UI.toast("✅ 桌贴生成完毕 (考号最大化)", "success");

    const app = document.getElementById('app');
    const labelsArea = document.getElementById('desk-labels-print-area');
    const originalDisplay = app.style.display;

    app.style.display = 'none';
    labelsArea.style.display = 'block';

    setTimeout(() => {
        window.print();
        app.style.display = originalDisplay;
        labelsArea.style.display = 'none';
        container.innerHTML = '';
    }, 500);
}

// 初始化教师勾选列表和下拉框
function EXAM_initProctorUI() {
    const teachers = [...new Set(Object.values(TEACHER_MAP || {}).map(name => String(name || '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const poolContainer = document.getElementById('proctor-teacher-pool');
    const patrolSel = document.getElementById('proctor-role-patrol');
    const affairsSel = document.getElementById('proctor-role-affairs');
    if (!poolContainer || !patrolSel || !affairsSel) return;

    const prevExcluded = Array.from(document.querySelectorAll('.exclude-check:checked')).map(option => option.value);
    const prevPatrols = Array.from(patrolSel.selectedOptions).map(option => option.value);
    const prevAffairs = Array.from(affairsSel.selectedOptions).map(option => option.value);

    if (!teachers.length) {
        poolContainer.innerHTML = '<div style="padding:8px 0; color:#94a3b8;">暂无任课教师数据，请先导入任课表。</div>';
        patrolSel.disabled = true;
        affairsSel.disabled = true;
        patrolSel.innerHTML = '';
        affairsSel.innerHTML = '';
        return;
    }

    // 渲染黑名单勾选
    poolContainer.innerHTML = teachers.map(name => `
            <label class="teacher-item">
                <input type="checkbox" class="exclude-check" value="${name}" ${prevExcluded.includes(name) ? 'checked' : ''}> ${name}
            </label>
        `).join('');

    // 渲染多选下拉框
    patrolSel.disabled = false;
    affairsSel.disabled = false;
    setMultiSelectOptions(patrolSel, teachers, prevPatrols);
    setMultiSelectOptions(affairsSel, teachers, prevAffairs);
}

// 执行编排逻辑
function EXAM_assignProctors() {
    if (!EXAM_ROOMS.length) return window.UI.alert("请先生成考场安排");

    const allTeachers = [...new Set(Object.values(TEACHER_MAP || {}).map(name => String(name || '').trim()).filter(Boolean))];
    if (!allTeachers.length) return window.UI.alert("请先导入任课表，当前没有可用于监考分配的教师。");
    const patrolSelect = document.getElementById('proctor-role-patrol');
    const affairsSelect = document.getElementById('proctor-role-affairs');
    if (!patrolSelect || !affairsSelect) return window.UI.alert("监考配置面板未就绪，请刷新页面后重试。");

    // 获取排除人员
    const excluded = Array.from(document.querySelectorAll('.exclude-check:checked')).map(el => el.value);

    // 获取特殊岗位人员
    const patrols = [...new Set(Array.from(patrolSelect.selectedOptions).map(o => o.value))];
    const affairsRaw = [...new Set(Array.from(affairsSelect.selectedOptions).map(o => o.value))];
    const duplicateRoles = affairsRaw.filter(name => patrols.includes(name));
    const affairs = affairsRaw.filter(name => !patrols.includes(name));
    if (duplicateRoles.length) {
        Array.from(affairsSelect.options).forEach(option => {
            option.selected = affairs.includes(option.value);
        });
        if (window.UI) UI.toast(`已自动去重特殊岗位：${duplicateRoles.join('、')}`, 'warning');
    }

    // 可用监考池 = 总人员 - 排除 - 特殊岗位
    let availablePool = allTeachers.filter(t =>
        !excluded.includes(t) && !patrols.includes(t) && !affairs.includes(t)
    );

    const needed = EXAM_ROOMS.length * 2;
    if (availablePool.length < needed) {
        return window.UI.alert(`❌ 人员不足！\n当前考场需要 ${needed} 名监考，但排除后仅剩 ${availablePool.length} 人。\n请减少排除项或合并岗位。`);
    }

    // 洗牌算法乱序
    availablePool.sort(() => Math.random() - 0.5);

    // 填充监考汇总表
    const tbody = document.querySelector('#exam_proctor_table tbody');
    let html = '';
    EXAM_ROOMS.forEach((room, i) => {
        const p1 = availablePool[i * 2];
        const p2 = availablePool[i * 2 + 1];
        const first = room.students[0].examNo;
        const last = room.students[room.students.length - 1].examNo;

        html += `
                <tr>
                    <td><strong>第 ${String(room.id).padStart(2, '0')} 考场</strong></td>
                    <td>${room.students.length}</td>
                    <td>${first} - ${last}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${p1}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${p2}</td>
                </tr>
            `;
    });

    // 底部追加考务组
    html += `
            <tr style="background:#f8fafc; border-top: 2px solid #333;">
                <td colspan="3" style="text-align:right; font-weight:bold;">⚖️ 纪律巡考人员：</td>
                <td colspan="2" style="text-align:left; color:var(--danger); font-weight:bold;">${patrols.join('、') || '未指定'}</td>
            </tr>
            <tr style="background:#f8fafc;">
                <td colspan="3" style="text-align:right; font-weight:bold;">🧹 卫生考务保障：</td>
                <td colspan="2" style="text-align:left; color:var(--success); font-weight:bold;">${affairs.join('、') || '未指定'}</td>
            </tr>
        `;

    tbody.innerHTML = html;
    UI.toast("✅ 监考人员分配完成，请查看“监考汇总表”", "success");
    // 自动切到汇总表看结果
    EXAM_switchView('proctor', document.querySelector('.nav-link[onclick*="proctor"]'));
}

function EXAM_exportResult() {
    if (!EXAM_DATA.length) return window.UI.alert("无考生数据");
    if (!EXAM_ROOMS.length) return window.UI.alert("请先生成考场安排");

    const wb = XLSX.utils.book_new();

    // 1. 考生总表
    const sheet1Data = [['考号', '姓名', '学校', '班级', '考场号', '座号', '参考分']];
    EXAM_DATA.forEach(s => sheet1Data.push([s.examNo, s.name, s.school, s.class, s.roomNo, s.seatNo, s.score]));

    // 2. 监考人员安排表 (核心：直接读取界面表格，所见即所得)
    const sheet2Data = [['单位/考场', '应考人数', '起止考号', '监考老师 A', '监考老师 B']];
    const proctorRows = document.querySelectorAll('#exam_proctor_table tbody tr');

    if (proctorRows.length === 0) {
        window.UI.alert("⚠️ 提示：您尚未进行“人员配置”或点击“一键编排”。监考表将只包含考生信息。");
    } else {
        proctorRows.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            const rowData = [];
            tds.forEach(td => rowData.push(td.innerText));
            sheet2Data.push(rowData);
        });
    }

    // 3. 考场参考表
    const sheet3Data = [['考场', '座号', '姓名', '考号', '班级']];
    EXAM_DATA.forEach(s => sheet3Data.push([s.roomNo, s.seatNo, s.name, s.examNo, s.class]));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1Data), "考生座次总表");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2Data), "全校监考考务表");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet3Data), "桌贴打印备份");

    XLSX.writeFile(wb, `${getCurrentConfig().name || '学校'}考务编排结果全集.xlsx`);
}

    window.FreshmanExamRuntime = {
        syncFbClasses,
        writeFbClasses,
        get students() { return FB_STUDENTS; },
        get classes() { return FB_CLASSES; },
        get simulatedData() { return FB_SIMULATED_DATA; },
        get examData() { return EXAM_DATA; },
        get examRooms() { return EXAM_ROOMS; },
        get assignmentDataStatus() {
            return {
                studentCount: FB_STUDENTS.length,
                genderRows: Object.keys(FB_GENDER_MAP || {}).length,
                violationRows: Object.keys(FB_VIOLATION_SET || {}).length,
                lastAssembly: FB_LAST_ASSEMBLY ? { ...FB_LAST_ASSEMBLY } : null
            };
        },
        getFixedAssignments: () => ({ ...FB_FIXED_ASSIGNMENTS })
    };

    if (typeof FB_loadData === 'function') window.FB_loadData = FB_loadData;
    if (typeof FB_loadRosterList === 'function') window.FB_loadRosterList = FB_loadRosterList;
    if (typeof FB_loadGenderList === 'function') window.FB_loadGenderList = FB_loadGenderList;
    if (typeof FB_loadViolationList === 'function') window.FB_loadViolationList = FB_loadViolationList;
    if (typeof FB_loadDropoutList === 'function') window.FB_loadDropoutList = FB_loadDropoutList;
    if (typeof FB_loadTransferList === 'function') window.FB_loadTransferList = FB_loadTransferList;
    if (typeof FB_loadTransferInList === 'function') window.FB_loadTransferInList = FB_loadTransferInList;
    if (typeof FB_loadFixedClassList === 'function') window.FB_loadFixedClassList = FB_loadFixedClassList;
    if (typeof FB_assembleFromCloud === 'function') window.FB_assembleFromCloud = FB_assembleFromCloud;
    if (typeof FB_updateAssemblyStatus === 'function') window.FB_updateAssemblyStatus = FB_updateAssemblyStatus;
    if (typeof FB_refreshFixedAssignmentUI === 'function') window.FB_refreshFixedAssignmentUI = FB_refreshFixedAssignmentUI;
    if (typeof FB_addFixedAssignment === 'function') window.FB_addFixedAssignment = FB_addFixedAssignment;
    if (typeof FB_removeFixedAssignment === 'function') window.FB_removeFixedAssignment = FB_removeFixedAssignment;
    if (typeof FB_clearFixedAssignments === 'function') window.FB_clearFixedAssignments = FB_clearFixedAssignments;
    if (typeof FB_getFixedAssignments === 'function') window.FB_getFixedAssignments = FB_getFixedAssignments;
    if (typeof FB_refreshSameClassUI === 'function') window.FB_refreshSameClassUI = FB_refreshSameClassUI;
    if (typeof FB_addSameClassMember === 'function') window.FB_addSameClassMember = FB_addSameClassMember;
    if (typeof FB_removeSameClassDraft === 'function') window.FB_removeSameClassDraft = FB_removeSameClassDraft;
    if (typeof FB_createSameClassGroup === 'function') window.FB_createSameClassGroup = FB_createSameClassGroup;
    if (typeof FB_removeSameClassGroup === 'function') window.FB_removeSameClassGroup = FB_removeSameClassGroup;
    if (typeof FB_clearSameClassGroups === 'function') window.FB_clearSameClassGroups = FB_clearSameClassGroups;
    if (typeof FB_loadSameClassList === 'function') window.FB_loadSameClassList = FB_loadSameClassList;
    if (typeof FB_toggleDataSource === 'function') window.FB_toggleDataSource = FB_toggleDataSource;
    if (typeof FB_runDivision === 'function') window.FB_runDivision = FB_runDivision;
    if (typeof FB_generateSingleScheme === 'function') window.FB_generateSingleScheme = FB_generateSingleScheme;
    if (typeof FB_renderSchemeSelector === 'function') window.FB_renderSchemeSelector = FB_renderSchemeSelector;
    if (typeof FB_applyScheme === 'function') window.FB_applyScheme = FB_applyScheme;
    if (typeof FB_calcClassCost === 'function') window.FB_calcClassCost = FB_calcClassCost;
    if (typeof FB_checkConflict === 'function') window.FB_checkConflict = FB_checkConflict;
    if (typeof FB_renderDashboard === 'function') window.FB_renderDashboard = FB_renderDashboard;
    if (typeof FB_renderAssemblyBanner === 'function') window.FB_renderAssemblyBanner = FB_renderAssemblyBanner;
    if (typeof FB_renderBalanceChart === 'function') window.FB_renderBalanceChart = FB_renderBalanceChart;
    if (typeof FB_openSeatMap === 'function') window.FB_openSeatMap = FB_openSeatMap;
    if (typeof FB_autoSeatAlgo === 'function') window.FB_autoSeatAlgo = FB_autoSeatAlgo;
    if (typeof FB_renderSeatMap === 'function') window.FB_renderSeatMap = FB_renderSeatMap;
    if (typeof FB_toggleLock === 'function') window.FB_toggleLock = FB_toggleLock;
    if (typeof FB_toggleViewRotation === 'function') window.FB_toggleViewRotation = FB_toggleViewRotation;
    if (typeof FB_saveToLocal === 'function') window.FB_saveToLocal = FB_saveToLocal;
    if (typeof FB_exportResult === 'function') window.FB_exportResult = FB_exportResult;
    if (typeof FB_exportResultWithBalance === 'function') window.FB_exportResultWithBalance = FB_exportResultWithBalance;
    if (typeof addBindPair === 'function') window.addBindPair = addBindPair;
    if (typeof FB_initScenarioSelect === 'function') window.FB_initScenarioSelect = FB_initScenarioSelect;
    if (typeof FB_saveScenario === 'function') window.FB_saveScenario = FB_saveScenario;
    if (typeof FB_loadScenario === 'function') window.FB_loadScenario = FB_loadScenario;
    // 模块首次加载时即清理超出单班 60 人的旧缓存。
    if (typeof FB_sanitizePersistedClasses === 'function') FB_sanitizePersistedClasses();
    if (typeof FB_deleteScenario === 'function') window.FB_deleteScenario = FB_deleteScenario;
    if (typeof EXAM_loadData === 'function') window.EXAM_loadData = EXAM_loadData;
    if (typeof EXAM_generate === 'function') window.EXAM_generate = EXAM_generate;
    if (typeof EXAM_switchView === 'function') window.EXAM_switchView = EXAM_switchView;
    if (typeof EXAM_renderOverview === 'function') window.EXAM_renderOverview = EXAM_renderOverview;
    if (typeof EXAM_renderStudentList === 'function') window.EXAM_renderStudentList = EXAM_renderStudentList;
    if (typeof EXAM_renderProctorTable === 'function') window.EXAM_renderProctorTable = EXAM_renderProctorTable;
    if (typeof EXAM_renderPrintView === 'function') window.EXAM_renderPrintView = EXAM_renderPrintView;
    if (typeof EXAM_generateDeskLabels === 'function') window.EXAM_generateDeskLabels = EXAM_generateDeskLabels;
    if (typeof EXAM_initProctorUI === 'function') window.EXAM_initProctorUI = EXAM_initProctorUI;
    if (typeof EXAM_assignProctors === 'function') window.EXAM_assignProctors = EXAM_assignProctors;
    if (typeof EXAM_exportResult === 'function') window.EXAM_exportResult = EXAM_exportResult;
    if (typeof FB_bindDeclarativeHandlers === 'function') window.FB_bindDeclarativeHandlers = FB_bindDeclarativeHandlers;

    // 绑定必须在上面的 window.FB_* 导出之后:data-fb-change 通过 window[name]
    // 解析处理器。本运行时是按需加载的,DOM 此时已是静态首屏的一部分。
    try {
        FB_bindDeclarativeHandlers(document);
        FB_refreshFixedAssignmentUI();
        FB_refreshSameClassUI();
    } catch (_) { /* 绑定失败不应阻断模块其余功能 */ }

    window.__FRESHMAN_EXAM_RUNTIME_PATCHED__ = true;
})();
