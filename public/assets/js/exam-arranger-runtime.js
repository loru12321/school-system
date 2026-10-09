(function attachExamArranger(root) {
    'use strict';

    if (!root || root.ExamArranger) return;
    const core = root.ExamArrangerCore;
    if (!core) throw new Error('ExamArrangerCore must load before exam-arranger-runtime.js');

    const DRAFT_SCHEMA_VERSION = 1;
    const fileHandles = [];
    let workspace = null;
    let bound = false;

    function activeIdentity() {
        return {
            cohortId: String(root.CURRENT_COHORT_ID || root.COHORT_DB?.currentCohortId || 'default').trim() || 'default',
            examId: String(root.CURRENT_EXAM_ID || root.COHORT_DB?.currentExamId || 'draft').trim() || 'draft'
        };
    }

    function draftKey() {
        const identity = activeIdentity();
        return `school:exam-arranger:draft:v${DRAFT_SCHEMA_VERSION}:${identity.cohortId}:${identity.examId}`;
    }

    function createFreshWorkspace() {
        const identity = activeIdentity();
        return core.createWorkspace({
            cohortId: identity.cohortId,
            examId: identity.examId,
            name: String(root.CONFIG?.name || '').trim(),
            grade: String(root.CONFIG?.grade || '').trim()
        });
    }

    function getWorkspace() {
        if (!workspace) workspace = createFreshWorkspace();
        return workspace;
    }

    function notify(message, type = 'info') {
        if (root.UI?.toast) root.UI.toast(message, type);
        else if (root.UI?.alert) root.UI.alert(message);
    }

    function cloneForStorage(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function saveDraft() {
        const current = getWorkspace();
        current.savedAt = new Date().toISOString();
        const payload = cloneForStorage(current);
        payload.schemaVersion = DRAFT_SCHEMA_VERSION;
        root.localStorage?.setItem(draftKey(), JSON.stringify(payload));
        current.dirty = false;
        notify('编排草稿已保存到本机', 'success');
        render();
        return payload;
    }

    function restoreDraft() {
        const raw = root.localStorage?.getItem(draftKey());
        if (!raw) return false;
        try {
            const restored = JSON.parse(raw);
            if (restored?.schemaVersion !== DRAFT_SCHEMA_VERSION) return false;
            workspace = restored;
            render();
            return true;
        } catch (_) {
            return false;
        }
    }

    function clearWorkspace() {
        root.localStorage?.removeItem(draftKey());
        fileHandles.length = 0;
        workspace = createFreshWorkspace();
        render();
        return workspace;
    }

    function readFileBuffer(file) {
        if (file && typeof file.arrayBuffer === 'function') return file.arrayBuffer();
        return new Promise((resolve, reject) => {
            if (typeof root.FileReader !== 'function') {
                reject(new Error('当前浏览器无法读取所选文件'));
                return;
            }
            const reader = new root.FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
            reader.readAsArrayBuffer(file);
        });
    }

    function isSupportedWorkbook(file) {
        return /\.(?:xlsx|xls|csv)$/i.test(String(file?.name || ''));
    }

    async function loadFiles(files) {
        const selected = Array.from(files || []).filter(isSupportedWorkbook);
        if (!selected.length) {
            notify('请选择 Excel 或 CSV 文件', 'warning');
            return { ok: false, code: 'NO_SUPPORTED_FILES' };
        }
        if (!root.XLSX?.read) throw new Error('Excel 组件尚未加载');
        const sources = [];
        for (const file of selected) {
            const buffer = await readFileBuffer(file);
            const workbook = root.XLSX.read(new Uint8Array(buffer), { type: 'array', cellDates: false });
            sources.push(core.inspectWorkbook({ name: file.name, workbook, xlsx: root.XLSX }));
        }
        const merged = core.mergeImportSources(sources);
        const current = getWorkspace();
        current.sources = sources.map((source) => ({
            name: source.name,
            sheets: source.sheets.map((sheet) => ({ name: sheet.name, kind: sheet.kind, rowCount: sheet.rowCount }))
        }));
        current.students = merged.students;
        current.exclusions = merged.exclusions;
        current.rooms = merged.rooms;
        current.issues = merged.issues;
        current.importSummary = merged.summary;
        current.assignments = [];
        current.generation = null;
        current.step = 2;
        current.dirty = true;
        render();
        notify(`已识别 ${merged.students.length} 名学生，请核对名单`, 'success');
        return { ok: true, ...merged };
    }

    async function loadDirectory() {
        if (typeof root.showDirectoryPicker !== 'function') {
            root.document?.getElementById('examFileInput')?.click?.();
            return 'fallback';
        }
        const directory = await root.showDirectoryPicker({ mode: 'read' });
        const files = [];
        for await (const handle of directory.values()) {
            if (handle.kind !== 'file') continue;
            const file = await handle.getFile();
            if (!isSupportedWorkbook(file)) continue;
            fileHandles.push(handle);
            files.push(file);
        }
        if (!files.length) {
            notify('所选文件夹中没有可读取的 Excel 或 CSV 文件', 'warning');
            return { ok: false, code: 'NO_SUPPORTED_FILES' };
        }
        return loadFiles(files);
    }

    function setStep(step) {
        const nextStep = Math.max(1, Math.min(4, Number(step) || 1));
        const current = getWorkspace();
        if (nextStep >= 3 && current.students.length) {
            const validation = core.validateWorkspace(current);
            if (!validation.valid) {
                notify(`还有 ${validation.blockingIssues.length} 项阻断问题需要处理`, 'warning');
                return current.step;
            }
        }
        current.step = nextStep;
        render();
        return nextStep;
    }

    function toggleExcluded(studentId, reason = '') {
        const student = getWorkspace().students.find((item) => item.id === studentId);
        if (!student) return false;
        student.excluded = !student.excluded;
        student.exclusionReason = student.excluded ? String(reason || student.exclusionReason || '人工排除').trim() : '';
        student.status = student.excluded
            ? 'excluded'
            : (student.totalScore === null || student.totalScore === undefined ? 'score-missing' : (Number(student.totalScore) === 0 ? 'score-zero' : 'normal'));
        const current = getWorkspace();
        current.assignments = [];
        current.generation = null;
        current.dirty = true;
        render();
        return true;
    }

    function resolveRooms(current) {
        if (Array.isArray(current.rooms) && current.rooms.length) return current.rooms;
        const eligibleCount = current.students.filter((student) => !student.excluded).length;
        return core.deriveBalancedRooms(eligibleCount, {
            roomCount: current.settings?.roomCount,
            maxPerRoom: current.settings?.maxPerRoom
        });
    }

    function readLegacySettings(current) {
        const prefix = root.document?.getElementById('exam_prefix')?.value;
        const seatsPerRoom = Number(root.document?.getElementById('exam_seats_per_room')?.value || 0);
        if (prefix !== undefined) current.settings.prefix = String(prefix).trim();
        if (seatsPerRoom > 0 && !current.settings.roomCount && !current.rooms.length) current.settings.maxPerRoom = seatsPerRoom;
        const separate = root.document?.getElementById('exam_opt_separate');
        const snake = root.document?.getElementById('exam_opt_snake');
        if (separate) current.settings.advancedRules.separateSameClass = separate.checked === true;
        if (snake) current.settings.advancedRules.snakeSeating = snake.checked === true;
    }

    function generate() {
        const current = getWorkspace();
        readLegacySettings(current);
        const validation = core.validateWorkspace(current);
        if (!validation.valid) {
            notify(`还有 ${validation.blockingIssues.length} 项问题需要处理`, 'warning');
            return { ok: false, code: 'VALIDATION_BLOCKED', validation };
        }
        const rooms = resolveRooms(current);
        if (!rooms.length) {
            notify('请配置考场容量、考场数量或单场人数上限', 'warning');
            return { ok: false, code: 'NO_ROOMS' };
        }
        const result = core.assignStudents(current.students, rooms, {
            prefix: current.settings.prefix,
            serialWidth: current.settings.serialWidth,
            advancedRules: current.settings.advancedRules
        });
        if (!result.ok) {
            if (result.code === 'ROOM_CAPACITY_SHORTFALL') notify(`考场容量不足，还缺 ${result.shortfall} 个座位`, 'warning');
            return result;
        }
        current.rooms = rooms;
        current.assignments = result.assignments;
        current.generation = result;
        current.step = 4;
        current.dirty = true;
        render();
        notify(`已生成 ${result.summary.roomCount} 个考场、${result.assignments.length} 个考号`, 'success');
        return result;
    }

    function legacySwitchView(view, button) {
        const area = root.document?.getElementById('exam-results-area');
        if (!area) return;
        area.querySelectorAll?.('.nav-link').forEach((item) => item.classList.remove('active'));
        button?.classList?.add('active');
        ['overview', 'setup', 'students', 'proctor'].forEach((name) => {
            area.querySelector?.(`#exam-view-${name}`)?.classList?.toggle('hidden', name !== view);
        });
    }

    function renderLegacyResult() {
        const current = getWorkspace();
        const result = current.generation;
        const resultsArea = root.document?.getElementById('exam-results-area');
        if (!result?.ok) {
            resultsArea?.classList?.add('hidden');
            return;
        }
        resultsArea?.classList?.remove('hidden');
        const roomGrid = root.document?.getElementById('exam_room_grid');
        if (roomGrid) {
            roomGrid.innerHTML = result.rooms.filter((room) => room.students.length).map((room) => {
                const first = room.students[0]?.examNo || '';
                const last = room.students[room.students.length - 1]?.examNo || '';
                return `<div class="exam-room-card analysis-exam-room-card"><div class="exam-room-title analysis-exam-room-title">${room.name}</div><div class="exam-room-info analysis-exam-room-info"><span>人数：${room.students.length}</span></div><div class="exam-room-range analysis-exam-room-range">${first} - ${last}</div></div>`;
            }).join('');
        }
        const studentBody = root.document?.querySelector?.('#exam_student_table tbody');
        if (studentBody) {
            studentBody.innerHTML = result.assignments.map((student) => `<tr><td>${student.examNo}</td><td>${student.name}</td><td>${student.currentClass}</td><td>${student.roomName}</td><td>${student.seatNo}</td><td>${student.totalScore ?? '缺失'}</td></tr>`).join('');
        }
        const proctorBody = root.document?.querySelector?.('#exam_proctor_table tbody');
        if (proctorBody) {
            proctorBody.innerHTML = result.rooms.filter((room) => room.students.length).map((room) => {
                const first = room.students[0]?.examNo || '';
                const last = room.students[room.students.length - 1]?.examNo || '';
                return `<tr><td>${room.name}</td><td>${room.students.length}</td><td>${first} - ${last}</td><td></td><td></td></tr>`;
            }).join('');
        }
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
        }[character]));
    }

    function setText(selector, value) {
        const node = root.document?.querySelector?.(selector);
        if (node) node.textContent = String(value ?? '');
    }

    function renderWorkbench() {
        const current = getWorkspace();
        const validation = core.validateWorkspace(current);
        const summary = validation.summary || {};
        setText('[data-exam-metric="raw"]', current.importSummary?.rawStudentRows || current.students.length || 0);
        setText('[data-exam-metric="eligible"]', summary.eligibleStudents || 0);
        setText('[data-exam-metric="excluded"]', summary.excludedStudents || 0);
        setText('[data-exam-metric="rooms"]', current.generation?.summary?.roomCount || current.rooms.length || 0);
        setText('[data-exam-metric="issues"]', (validation.issues || []).length || 0);
        setText('[data-exam-workspace-status]', current.generation?.ok ? '已生成待导出' : (current.students.length ? '待核对' : '等待导入'));
        setText('[data-exam-version]', current.generation?.generationSignature ? 'V1' : '未生成');
        root.document?.querySelectorAll?.('[data-exam-panel]').forEach((panel) => {
            const active = Number(panel.dataset.examPanel) === Number(current.step);
            panel.hidden = !active;
            panel.classList.toggle('is-active', active);
        });
        root.document?.querySelectorAll?.('.exam-step').forEach((step) => {
            step.classList.toggle('is-current', Number(step.dataset.examStep) === Number(current.step));
        });
        const sourceBody = root.document?.getElementById?.('exam-source-list');
        if (sourceBody && current.sources?.length) {
            sourceBody.innerHTML = current.sources.flatMap((source) => source.sheets.map((sheet) => `<tr><td>${escapeHtml(source.name)}</td><td>${escapeHtml(sheet.name)} · ${escapeHtml(sheet.kind)}</td><td>${sheet.rowCount}</td><td><span class="exam-status-complete">已识别</span></td></tr>`)).join('');
            setText('[data-exam-source-count]', `${current.sources.length} 个文件`);
        }
        const issueList = root.document?.getElementById?.('exam-issue-list');
        if (issueList && current.issues?.length) {
            issueList.innerHTML = current.issues.map((issue) => `<div class="exam-issue ${issue.blocking ? 'is-blocking' : ''}"><i class="ti ti-${issue.blocking ? 'alert-triangle' : 'alert-circle'}"></i><span>${escapeHtml(issue.message)}</span></div>`).join('');
        }
        const reviewBody = root.document?.querySelector?.('#exam-review-table tbody');
        if (reviewBody && current.students?.length) {
            reviewBody.innerHTML = current.students.map((student) => `<tr><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.currentClass)}</td><td>${escapeHtml(student.gender)}</td><td>${student.totalScore ?? '缺失'}</td><td>${escapeHtml(student.status)}</td><td><button type="button" class="btn btn-soft" data-exam-action="toggle-excluded" data-student-id="${escapeHtml(student.id)}" data-reason="人工排除">${student.excluded ? '恢复参考' : '列入排除'}</button></td></tr>`).join('');
        }
        const roomBody = root.document?.getElementById?.('exam-room-editor-body');
        if (roomBody && current.rooms?.length) {
            roomBody.innerHTML = current.rooms.map((room, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(room.name)}</td><td>${room.capacity}</td><td>${escapeHtml(room.building)}</td><td>${escapeHtml(room.classroom)}</td></tr>`).join('');
        }
        const outputBody = root.document?.querySelector?.('#exam-output-preview-table tbody');
        if (outputBody && current.assignments?.length) {
            outputBody.innerHTML = current.assignments.map((student) => `<tr><td>${escapeHtml(student.examNo)}</td><td>${escapeHtml(student.name)}</td><td>${escapeHtml(student.currentClass)}</td><td>${escapeHtml(student.roomName)}</td><td>${student.seatNo}</td></tr>`).join('');
        }
    }

    function downloadTemplate(kind) {
        if (!root.XLSX?.utils?.book_new) return notify('Excel 组件尚未加载', 'warning');
        const definitions = {
            students: [['姓名', '班级', '性别', '总分', '语文', '数学', '英语']],
            exclusions: [['姓名', '班级', '学号', '不参加原因', '备注']],
            rooms: [['考场名称', '容量', '教学楼', '教室', '排序']]
        };
        const rows = definitions[kind] || definitions.students;
        const workbook = root.XLSX.utils.book_new();
        root.XLSX.utils.book_append_sheet(workbook, root.XLSX.utils.aoa_to_sheet(rows), kind === 'rooms' ? '考场配置' : (kind === 'exclusions' ? '不参加考试名单' : '学生成绩'));
        root.XLSX.writeFile(workbook, `${kind === 'rooms' ? '考场配置' : (kind === 'exclusions' ? '不参加考试名单' : '学生及成绩表')}模板.xlsx`);
    }

    function addRoom() {
        const current = getWorkspace();
        const index = current.rooms.length + 1;
        current.rooms.push({ id: `room-${index}`, name: `第${index}考场`, capacity: 0, building: '', classroom: '', order: index });
        current.dirty = true;
        render();
    }

    function render() {
        renderWorkbench();
        renderLegacyResult();
        root.dispatchEvent?.(new root.CustomEvent('exam-arranger:state', { detail: getWorkspace() }));
    }

    function assignProctors() {
        const result = getWorkspace().generation;
        if (!result?.ok) {
            notify('请先生成考场安排', 'warning');
            return false;
        }
        const teachers = [...new Set(Object.values(root.TEACHER_MAP || {}).map((name) => String(name || '').trim()).filter(Boolean))];
        const excluded = Array.from(root.document?.querySelectorAll?.('.exclude-check:checked') || [], (item) => item.value);
        const patrols = Array.from(root.document?.getElementById('proctor-role-patrol')?.selectedOptions || [], (item) => item.value);
        const affairs = Array.from(root.document?.getElementById('proctor-role-affairs')?.selectedOptions || [], (item) => item.value)
            .filter((name) => !patrols.includes(name));
        const pool = teachers.filter((name) => !excluded.includes(name) && !patrols.includes(name) && !affairs.includes(name));
        const activeRooms = result.rooms.filter((room) => room.students.length);
        if (pool.length < activeRooms.length * 2) {
            notify(`监考人员不足：需要 ${activeRooms.length * 2} 人，当前可用 ${pool.length} 人`, 'warning');
            return false;
        }
        const tbody = root.document?.querySelector?.('#exam_proctor_table tbody');
        if (tbody) {
            tbody.innerHTML = activeRooms.map((room, index) => `<tr><td>${room.name}</td><td>${room.students.length}</td><td>${room.students[0].examNo} - ${room.students[room.students.length - 1].examNo}</td><td>${pool[index * 2]}</td><td>${pool[index * 2 + 1]}</td></tr>`).join('');
        }
        legacySwitchView('proctor', root.document?.querySelector?.('[data-ui-action="exam-switch-view"][data-ui-value="proctor"]'));
        notify('监考人员分配完成', 'success');
        return true;
    }

    function exportResult(kind = 'package') {
        const exporter = root.ExamArrangerExport;
        if (!exporter) {
            notify('输出组件将在进入“预览与输出”步骤后加载', 'info');
            return false;
        }
        const current = getWorkspace();
        const handlers = {
            confidential: exporter.downloadConfidential,
            public: exporter.downloadPublic,
            print: exporter.downloadPrint,
            package: exporter.downloadDefaultPackage
        };
        const handler = handlers[kind] || handlers.package;
        if (typeof handler !== 'function') return false;
        return handler(current, current.generation);
    }

    function actionFromEvent(event) {
        return event.target?.closest?.('[data-exam-action]') || null;
    }

    function bindHandlers() {
        if (bound || !root.document?.addEventListener) return;
        bound = true;
        root.document.addEventListener('click', (event) => {
            const target = actionFromEvent(event);
            if (!target) return;
            const action = target.dataset.examAction;
            if (action === 'pick-folder') loadDirectory();
            else if (action === 'set-step') setStep(target.dataset.examStep);
            else if (action === 'generate') generate();
            else if (action === 'save-draft') saveDraft();
            else if (action === 'clear') clearWorkspace();
            else if (action === 'toggle-excluded') toggleExcluded(target.dataset.studentId, target.dataset.reason);
            else if (action === 'download-template') downloadTemplate(target.dataset.examTemplate);
            else if (action === 'add-room') addRoom();
            else if (action === 'export') exportResult('package');
            else if (action === 'export-confidential') exportResult('confidential');
            else if (action === 'export-public') exportResult('public');
            else if (action === 'export-print') exportResult('print');
        });
        root.document.addEventListener('change', (event) => {
            const target = event.target?.closest?.('[data-exam-change]');
            if (!target) return;
            if (target.dataset.examChange === 'files') loadFiles(target.files);
        });
    }

    function init() {
        getWorkspace();
        bindHandlers();
        render();
        return workspace;
    }

    const facade = Object.freeze({
        init,
        getWorkspace,
        loadFiles,
        loadDirectory,
        setStep,
        toggleExcluded,
        generate,
        saveDraft,
        restoreDraft,
        clearWorkspace,
        assignProctors,
        exportResult,
        switchLegacyView: legacySwitchView,
        render
    });

    root.ExamArranger = facade;
    root.EXAM_loadData = (input) => loadFiles(input?.files || []);
    root.EXAM_generate = generate;
    root.EXAM_switchView = legacySwitchView;
    root.EXAM_assignProctors = assignProctors;
    root.EXAM_exportResult = exportResult;
    root.EXAM_generateDeskLabels = exportResult;
    root.EXAM_initProctorUI = () => true;

    if (root.document?.readyState === 'loading') {
        root.document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})(typeof window !== 'undefined' ? window : globalThis);
