(() => {
    if (typeof window === 'undefined' || window.__AI_HUB_RUNTIME_PATCHED__) return;

    function getAIAnalysisSchoolValue() {
        const aiSchool = String(document.getElementById('ai-school-select')?.value || '').trim();
        if (aiSchool && SCHOOLS[aiSchool]) return aiSchool;
        const reportSchool = String(document.getElementById('sel-school')?.value || '').trim();
        return reportSchool && SCHOOLS[reportSchool] ? reportSchool : '';
    }

    function getAIAnalysisClassValue() {
        const aiClass = String(document.getElementById('ai-class-select')?.value || '').trim();
        if (aiClass) return aiClass;
        return String(document.getElementById('sel-class')?.value || '').trim();
    }

    function syncAIAnalysisClassOptions() {
        const classSelect = document.getElementById('ai-class-select');
        if (!classSelect) return;

        const school = getAIAnalysisSchoolValue();
        const user = getCurrentUser();
        const currentValue = String(classSelect.value || '').trim();
        classSelect.innerHTML = '<option value="">-- 请选择班级 --</option>';
        if (!school || !SCHOOLS[school]) return;

        const classes = PermissionPolicy.getAccessibleClassNames(
            user,
            [...new Set((SCHOOLS[school].students || []).map(s => s.class))].sort(),
            school,
            { mode: 'homeroom' }
        );

        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = cls;
            classSelect.appendChild(option);
        });

        const fallback = classes.includes(currentValue)
            ? currentValue
            : String(document.getElementById('sel-class')?.value || '').trim();
        if (fallback && classes.includes(fallback)) classSelect.value = fallback;
    }

    function syncAIAnalysisSelectors() {
        const schoolSelect = document.getElementById('ai-school-select');
        if (!schoolSelect) return;

        const user = getCurrentUser();
        const schools = PermissionPolicy.getAccessibleSchoolNames(user, Object.keys(SCHOOLS || {}));
        const currentSchool = getAIAnalysisSchoolValue() || readCurrentSchool() || schools[0] || '';
        schoolSelect.innerHTML = '<option value="">-- 请选择学校 --</option>';
        schools.forEach((school) => {
            const option = document.createElement('option');
            option.value = school;
            option.textContent = school;
            schoolSelect.appendChild(option);
        });
        if (currentSchool && schools.includes(currentSchool)) schoolSelect.value = currentSchool;
        syncAIAnalysisClassOptions();
    }

    function syncAISelectionToReportQuery(school, className) {
        const schoolSelect = document.getElementById('sel-school');
        const classSelect = document.getElementById('sel-class');
        if (!schoolSelect || !classSelect) return;

        if (school && schoolSelect.value !== school) {
            schoolSelect.value = school;
            if (typeof updateClassSelect === 'function') updateClassSelect();
        }
        if (className) {
            classSelect.value = className;
            if (classSelect.value !== className && typeof updateClassSelect === 'function') {
                updateClassSelect();
                classSelect.value = className;
            }
        }
    }

    function getCurrentAIHubStudent() {
        if (typeof readCurrentReportStudentState === 'function') return readCurrentReportStudentState();
        return window.CURRENT_REPORT_STUDENT && typeof window.CURRENT_REPORT_STUDENT === 'object'
            ? window.CURRENT_REPORT_STUDENT
            : null;
    }

    async function ensureAIRuntimeReady() {
        if (typeof window.ensureReportRenderRuntimeLoaded === 'function') {
            await window.ensureReportRenderRuntimeLoaded();
        }
        if (window.normalizeMojibakeUi) window.normalizeMojibakeUi();
    }

    function updateAIAnalysisHubStatus() {
        const currentStudent = getCurrentAIHubStudent();
        const studentSummary = document.getElementById('ai-current-student-summary');
        if (studentSummary) {
            studentSummary.textContent = currentStudent
                ? `当前已选学生：${currentStudent.name} | ${currentStudent.school || MY_SCHOOL || '未识别学校'} ${currentStudent.class || ''}`.trim()
                : '当前还没有已查询的学生。请先到“成绩单/家长查分”里查询一名学生。';
        }

        const school = getAIAnalysisSchoolValue();
        const className = getAIAnalysisClassValue();
        const batchSummary = document.getElementById('ai-batch-summary');
        if (batchSummary) {
            batchSummary.textContent = school && className
                ? `当前批量目标：${school} / ${className}`
                : '请选择学校和班级，再打开批量 AI 工作台。';
        }

        const macroSummary = document.getElementById('ai-macro-summary');
        if (macroSummary) {
            macroSummary.textContent = MY_SCHOOL
                ? `当前本校：${MY_SCHOOL}，将基于当前工作区成绩生成 AI 宏观诊断。`
                : '当前还没有锁定本校，请先在页面顶部或数据中心选择本校。';
        }

        const gatewayStatus = document.getElementById('ai-gateway-status');
        if (gatewayStatus) {
            const useGateway = canUseSameOriginAIGatewayFromApp();
            gatewayStatus.textContent = useGateway
                ? '当前环境将优先通过同域 AI 网关发起请求。'
                : '当前环境将使用本地填写的 AI API Key / Base URL 直接请求。';
        }
    }

    function renderAIAnalysisHub() {
        const apiKeyInput = document.getElementById('llm_apikey');
        const baseUrlInput = document.getElementById('llm_baseurl');
        const modelInput = document.getElementById('llm_model');
        if (apiKeyInput && !apiKeyInput.value) apiKeyInput.value = localStorage.getItem('LLM_API_KEY') || (window.LLM_CONFIG?.apiKey || '');
        if (baseUrlInput && !baseUrlInput.value) baseUrlInput.value = localStorage.getItem('LLM_BASE_URL') || (window.LLM_CONFIG?.baseURL || 'https://api.deepseek.com');
        if (modelInput && !modelInput.value) modelInput.value = localStorage.getItem('LLM_MODEL') || (window.LLM_CONFIG?.model || 'deepseek-chat');
        syncAIAnalysisSelectors();
        updateAIAnalysisHubStatus();
    }

    async function openReportGeneratorForAI() {
        switchTab('report-generator');
        await ensureAIRuntimeReady();
        const nameInput = document.getElementById('inp-name');
        if (nameInput) nameInput.focus();
    }

    async function saveAIConfigFromHub() {
        if (AI_DISABLED) return aiDisabledAlert();
        await ensureAIRuntimeReady();
        if (typeof window.saveLLMConfig !== 'function') {
            return alert('AI 配置保存函数未加载，请刷新后重试。');
        }
        window.saveLLMConfig();
        renderAIAnalysisHub();
    }

    async function testAIConnectionFromHub() {
        if (AI_DISABLED) return aiDisabledAlert();
        await ensureAIRuntimeReady();
        const statusEl = document.getElementById('ai-gateway-status');
        if (statusEl) statusEl.textContent = '正在测试 AI 连接，请稍候...';
        try {
            const result = await new Promise((resolve) => {
                let finalText = '';
                window.callLLM('请只回复“连接正常”四个字。', null, (fullText) => {
                    finalText = fullText;
                    resolve(finalText);
                });
            });
            if (statusEl) statusEl.textContent = `AI 连接测试成功：${String(result || '连接正常').trim()}`;
            if (window.UI) UI.toast('AI 连接正常', 'success');
        } catch (error) {
            if (statusEl) statusEl.textContent = `AI 连接测试失败：${error.message}`;
            alert(`AI 连接测试失败：${error.message}`);
        }
    }

    async function runSingleStudentAIFromHub() {
        if (AI_DISABLED) return aiDisabledAlert();
        const stu = getCurrentAIHubStudent();
        if (!stu) {
            await openReportGeneratorForAI();
            return alert('请先在“成绩单/家长查分”模块查询一名学生，再回来生成 AI 评语。');
        }
        await ensureAIRuntimeReady();
        if (!PermissionPolicy.isParentLike(getCurrentUser())) {
            switchTab('ai-analysis');
        }
        if (typeof window.callAIForComment !== 'function') {
            return alert('AI 评语运行时未加载，请刷新后重试。');
        }
        window.callAIForComment();
    }

    function openAIAnalysisHubForCurrentUser() {
        const user = getCurrentUser();
        if (PermissionPolicy.isParentLike(user)) {
            const parentContainer = document.getElementById('parent-view-container');
            const app = document.getElementById('app');
            const header = document.querySelector('header');
            if (parentContainer) parentContainer.style.display = 'none';
            if (app) {
                app.style.display = 'block';
                app.classList.remove('hidden');
            }
            if (header) header.style.display = '';
            if (typeof renderNavigation === 'function') renderNavigation();
        }

        if (typeof window.switchNavCategory === 'function') {
            window.switchNavCategory('ai');
        }
        switchTab('ai-analysis');
    }

    async function runAIMacroReportFromHub() {
        if (AI_DISABLED) return aiDisabledAlert();
        const school = getAIAnalysisSchoolValue();
        if (school && school !== MY_SCHOOL) {
            writeCurrentSchool(school);
            MY_SCHOOL = readCurrentSchool();
            window.MY_SCHOOL = MY_SCHOOL;
            const mySchoolSelect = document.getElementById('mySchoolSelect');
            if (mySchoolSelect) mySchoolSelect.value = MY_SCHOOL;
        }
        await ensureAIRuntimeReady();
        if (typeof window.generateAIMacroReport !== 'function') {
            return alert('AI 宏观报告运行时未加载，请刷新后重试。');
        }
        window.generateAIMacroReport();
    }

    async function openAIBatchWorkspaceFromHub() {
        if (AI_DISABLED) return aiDisabledAlert();
        const school = getAIAnalysisSchoolValue();
        const className = getAIAnalysisClassValue();
        if (!school || !className) {
            return alert('请先在 AI 工作台里选择学校和班级。');
        }
        syncAISelectionToReportQuery(school, className);
        switchTab('ai-analysis');
        openBatchAIModal();
        updateAIAnalysisHubStatus();
    }

    async function startAIBatchFromHub() {
        if (AI_DISABLED) return aiDisabledAlert();
        const school = getAIAnalysisSchoolValue();
        const className = getAIAnalysisClassValue();
        if (!school || !className) {
            return alert('请先在 AI 工作台里选择学校和班级。');
        }
        syncAISelectionToReportQuery(school, className);
        if (document.getElementById('batch-ai-workspace')?.classList.contains('hidden')) {
            openBatchAIModal();
        }
        await startBatchAIComments();
    }

    async function exportAIBatchFromHub() {
        if (AI_DISABLED) return aiDisabledAlert();
        const school = getAIAnalysisSchoolValue();
        const className = getAIAnalysisClassValue();
        if (!school || !className) {
            return alert('请先在 AI 工作台里选择学校和班级。');
        }
        syncAISelectionToReportQuery(school, className);
        exportAICommentsExcel();
    }

    function openBatchAIModal() {
        if (AI_DISABLED) return aiDisabledAlert();
        const sch = getAIAnalysisSchoolValue();
        const cls = getAIAnalysisClassValue();
        if (!sch || sch.includes('请选择') || !cls || cls.includes('请选择')) {
            return alert('请先选择具体的【学校】和【班级】！');
        }
        syncAISelectionToReportQuery(sch, cls);
        document.getElementById('batch-ai-workspace').classList.remove('hidden');
        document.getElementById('batch-ai-workspace').scrollIntoView({ behavior: 'smooth' });

        const students = SCHOOLS[sch].students.filter(s => s.class === cls).sort((a, b) => b.total - a.total);
        const batchAiCache = readBatchAICacheState();
        const tbody = document.querySelector('#batch-ai-table tbody');
        tbody.innerHTML = '';

        students.forEach(s => {
            const key = `${s.school}_${s.class}_${s.name}`;
            const hasComment = batchAiCache[key];
            const statusIcon = hasComment ? '✅' : '⚪';
            const commentPreview = hasComment ? hasComment : '<span style="color:#ccc">等待生成...</span>';

            tbody.innerHTML += `
                <tr id="row-${key.replace(/\s+/g, '')}">
                    <td class="status-cell">${statusIcon}</td>
                    <td>${s.name}</td>
                    <td>${safeGet(s, 'ranks.total.township', '-')}</td>
                    <td class="comment-cell" style="text-align:left; white-space:normal;">${commentPreview}</td>
                    <td><button class="btn btn-gray btn-sm" style="padding:2px 5px; font-size:10px;" onclick="regenerateOneAI('${key}')">重试</button></td>
                </tr>
            `;
        });
        updateBatchProgress(0, students.length);
    }

    function updateBatchProgress(current, total) {
        const pct = total === 0 ? 0 : (current / total) * 100;
        document.getElementById('batch-ai-progress').style.width = `${pct}%`;
        document.getElementById('batch-ai-progress-text').innerText = `${current} / ${total}`;
    }

    async function startBatchAIComments() {
        if (AI_DISABLED) return aiDisabledAlert();
        if (!LLM_CONFIG.apiKey && !canUseSameOriginAIGatewayFromApp()) {
            return alert('请先在【数据中心 -> AI 配置】中设置 API Key');
        }
        const sch = getAIAnalysisSchoolValue();
        const cls = getAIAnalysisClassValue();
        syncAISelectionToReportQuery(sch, cls);
        const students = SCHOOLS[sch].students.filter(s => s.class === cls).sort((a, b) => b.total - a.total);
        const interval = (parseFloat(document.getElementById('batch-ai-interval').value) || 3) * 1000;
        let batchAiCache = readBatchAICacheState();

        setBatchAIRunningState(true);
        document.getElementById('btn-start-batch-ai').classList.add('hidden');
        document.getElementById('btn-stop-batch-ai').classList.remove('hidden');

        let processedCount = 0;
        for (let i = 0; i < students.length; i++) {
            if (!readIsBatchAIRunningState()) break;
            const s = students[i];
            const key = `${s.school}_${s.class}_${s.name}`;
            const rowId = `row-${key.replace(/\s+/g, '')}`;
            const row = document.getElementById(rowId);

            if (batchAiCache[key]) {
                processedCount++;
                updateBatchProgress(processedCount, students.length);
                continue;
            }

            if (row) {
                row.querySelector('.status-cell').innerHTML = '⏳';
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }

            const prompt = buildStudentPrompt(s);
            try {
                let aiResponse = '';
                await new Promise((resolve) => {
                    callLLM(prompt, null, (fullText) => {
                        aiResponse = fullText;
                        resolve();
                    });
                });
                if (aiResponse && !aiResponse.includes('失败')) {
                    upsertBatchAICacheEntryState(key, aiResponse);
                    batchAiCache = readBatchAICacheState();
                    if (row) {
                        row.querySelector('.status-cell').innerHTML = '✅';
                        row.querySelector('.comment-cell').innerText = aiResponse;
                    }
                } else if (row) {
                    row.querySelector('.status-cell').innerHTML = '❌';
                }
            } catch (error) {
                if (row) row.querySelector('.status-cell').innerHTML = '❌';
            }

            processedCount++;
            updateBatchProgress(processedCount, students.length);
            if (i < students.length - 1 && readIsBatchAIRunningState()) {
                await new Promise(r => setTimeout(r, interval));
            }
        }
        stopBatchAI();
        alert('批量生成任务结束！');
    }

    function regenerateOneAI(key) {
        if (AI_DISABLED) return aiDisabledAlert();
        const [sch, cls, name] = key.split('_');
        const stu = SCHOOLS[sch].students.find(s => s.name === name && s.class === cls);
        if (!stu) return;
        removeBatchAICacheEntryState(key);
        const rowId = `row-${key.replace(/\s+/g, '')}`;
        const row = document.getElementById(rowId);
        if (row) {
            row.querySelector('.status-cell').innerHTML = '⏳';
            row.querySelector('.comment-cell').innerText = '重试中...';
        }
        callLLM(buildStudentPrompt(stu), null, (fullText) => {
            if (fullText && !fullText.includes('失败')) {
                upsertBatchAICacheEntryState(key, fullText);
                if (row) {
                    row.querySelector('.status-cell').innerHTML = '✅';
                    row.querySelector('.comment-cell').innerText = fullText;
                }
            } else if (row) {
                row.querySelector('.comment-cell').innerText = '生成失败';
            }
        });
    }

    function exportAICommentsExcel() {
        if (AI_DISABLED) return aiDisabledAlert();
        const sch = getAIAnalysisSchoolValue();
        const cls = getAIAnalysisClassValue();
        if (!sch || !cls) return alert('无选中班级');
        const wb = XLSX.utils.book_new();
        const data = [['学校', '班级', '姓名', '总分', '评语']];
        const students = SCHOOLS[sch].students.filter(s => s.class === cls).sort((a, b) => b.total - a.total);
        const batchAiCache = readBatchAICacheState();
        students.forEach(s => {
            const key = `${s.school}_${s.class}_${s.name}`;
            data.push([s.school, s.class, s.name, s.total, batchAiCache[key] || '']);
        });
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 80 }];
        XLSX.utils.book_append_sheet(wb, ws, 'AI评语导出');
        XLSX.writeFile(wb, `${sch}_${cls}_AI评语.xlsx`);
    }

    window.getAIAnalysisSchoolValue = getAIAnalysisSchoolValue;
    window.getAIAnalysisClassValue = getAIAnalysisClassValue;
    window.syncAIAnalysisClassOptions = syncAIAnalysisClassOptions;
    window.syncAIAnalysisSelectors = syncAIAnalysisSelectors;
    window.syncAISelectionToReportQuery = syncAISelectionToReportQuery;
    window.getCurrentAIHubStudent = getCurrentAIHubStudent;
    window.ensureAIRuntimeReady = ensureAIRuntimeReady;
    window.updateAIAnalysisHubStatus = updateAIAnalysisHubStatus;
    window.renderAIAnalysisHub = renderAIAnalysisHub;
    window.openReportGeneratorForAI = openReportGeneratorForAI;
    window.saveAIConfigFromHub = saveAIConfigFromHub;
    window.testAIConnectionFromHub = testAIConnectionFromHub;
    window.runSingleStudentAIFromHub = runSingleStudentAIFromHub;
    window.openAIAnalysisHubForCurrentUser = openAIAnalysisHubForCurrentUser;
    window.runAIMacroReportFromHub = runAIMacroReportFromHub;
    window.openAIBatchWorkspaceFromHub = openAIBatchWorkspaceFromHub;
    window.startAIBatchFromHub = startAIBatchFromHub;
    window.exportAIBatchFromHub = exportAIBatchFromHub;
    window.openBatchAIModal = openBatchAIModal;
    window.startBatchAIComments = startBatchAIComments;
    window.regenerateOneAI = regenerateOneAI;
    window.exportAICommentsExcel = exportAICommentsExcel;
    window.__AI_HUB_RUNTIME_PATCHED__ = true;
})();
