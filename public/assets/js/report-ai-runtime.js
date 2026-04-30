(() => {
    if (typeof window === 'undefined' || window.__REPORT_AI_RUNTIME_PATCHED__) return;

function saveLLMConfig() {
    const key = document.getElementById('llm_apikey').value;
    const url = document.getElementById('llm_baseurl').value;
    const model = document.getElementById('llm_model').value;

    if (!key) return alert("API Key 不能为空");

    localStorage.setItem('LLM_API_KEY', key);
    localStorage.setItem('LLM_BASE_URL', url);
    localStorage.setItem('LLM_MODEL', model);

    LLM_CONFIG.apiKey = key;
    LLM_CONFIG.baseURL = url;
    LLM_CONFIG.model = model;

    alert("✅ AI 配置已保存！");
}

// 页面加载时填充配置框（若已移除 UI，则跳过）

function hydrateLLMConfigInputs() {
    const apiEl = document.getElementById('llm_apikey');
    const urlEl = document.getElementById('llm_baseurl');
    const modelEl = document.getElementById('llm_model');
    if (!apiEl || !urlEl || !modelEl) return;
    if (LLM_CONFIG.apiKey) apiEl.value = LLM_CONFIG.apiKey;
    urlEl.value = LLM_CONFIG.baseURL;
    modelEl.value = LLM_CONFIG.model;
}

if (document.readyState === 'loading') {
    window.addEventListener('load', hydrateLLMConfigInputs, { once: true });
} else {
    hydrateLLMConfigInputs();
}

function isLocalAIHost(hostname) {
    const normalized = String(hostname || '').trim().toLowerCase();
    return !normalized
        || normalized === 'localhost'
        || normalized === '127.0.0.1'
        || normalized === '[::1]'
        || normalized.endsWith('.local');
}

function shouldUseSameOriginAIGateway() {
    if (!window.location) return false;
    const protocol = String(window.location.protocol || '').trim().toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    return !isLocalAIHost(window.location.hostname);
}

function getSameOriginAIChatUrl() {
    if (!window.location || !window.location.origin) return '/api/ai/chat';
    return String(window.location.origin).replace(/\/$/, '') + '/api/ai/chat';
}

function reportToast(message, type) {
    if (window.UI && typeof UI.toast === 'function') return UI.toast(message, type);
    return alert(message);
}

function escapeReportHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char]);
}

function toReportList(items, fallback) {
    const source = Array.isArray(items) ? items : [];
    const cleaned = source.map(item => String(item ?? '').trim()).filter(Boolean);
    return cleaned.length ? cleaned : [fallback];
}

function readNumericRank(rank) {
    const value = Number(String(rank ?? '').replace(/[^\d.-]/g, ''));
    return Number.isFinite(value) && value > 0 ? value : null;
}

function buildLocalQualityDiagnosis(context) {
    const subjectRows = Array.isArray(context?.subjectComparison) ? context.subjectComparison : [];
    const totalSchools = Math.max(1, Number(context?.totalSchools) || 1);
    const rankValue = readNumericRank(context?.myRank);
    const rankedRatio = rankValue ? rankValue / totalSchools : 0.5;
    const byTownDiff = subjectRows
        .map(row => ({ ...row, diffNum: Number(row.diff), rankNum: readNumericRank(row.rank) }))
        .filter(row => Number.isFinite(row.diffNum));
    const leadingSubjects = byTownDiff.filter(row => row.diffNum >= 0).sort((a, b) => b.diffNum - a.diffNum);
    const trailingSubjects = byTownDiff.filter(row => row.diffNum < 0).sort((a, b) => a.diffNum - b.diffNum);
    const strongNames = String(context?.strongSubjects || leadingSubjects.slice(0, 2).map(row => row.subject).join('、') || '').trim();
    const weakNames = String(context?.weakSubjects || trailingSubjects.slice(0, 2).map(row => row.subject).join('、') || '').trim();
    const score = Math.max(62, Math.min(92, Math.round(94 - rankedRatio * 26 + leadingSubjects.length - trailingSubjects.length * 1.5)));
    const best = leadingSubjects[0];
    const weakest = trailingSubjects[0];
    const rankPhrase = rankValue ? `综合排名第 ${rankValue}/${totalSchools}` : '综合排名暂缺';

    return {
        notice: 'AI 网关暂未就绪，已根据本地成绩数据生成离线诊断。',
        summary: `整体表现${rankPhrase}，${strongNames ? `优势学科集中在 ${strongNames}` : '优势学科仍需继续识别'}，${weakNames ? `需关注 ${weakNames}` : '短板暂不明显'}。`,
        score,
        highlights: [
            best ? `${best.subject}均分高于全镇 ${best.diff} 分，当前可作为校内提质样板。` : '当前未发现明显高于全镇均分的学科，建议先稳住基础盘。',
            strongNames ? `优势学科：${strongNames}，可沉淀备课、作业和讲评经验。` : '各学科差距相对接近，适合用统一质量监测先找关键班级。',
            rankValue && rankValue <= Math.ceil(totalSchools * 0.35) ? '综合位次处于前列，下一步重点是保持稳定性。' : '综合位次还有提升空间，优先抓可快速拉动均分的薄弱科目。'
        ],
        warnings: [
            weakest ? `${weakest.subject}低于全镇均分 ${Math.abs(weakest.diffNum).toFixed(1)} 分，需要进入学科攻坚清单。` : '未发现明显低于全镇均分的学科，但仍需防止高分段断层。',
            weakNames ? `薄弱学科：${weakNames}，建议结合班级明细定位具体任课与学生群体。` : '短板暂不明显，建议继续关注优率、及格率和班级波动。',
            rankedRatio > 0.5 ? '当前综合位次偏后，单靠平均分追赶不够，需要同步提升及格率和优生贡献。' : '排名靠前时更要警惕学科间分化，避免优势科目掩盖局部风险。'
        ],
        strategies: [
            {
                title: 'Subject focus',
                action: weakest ? `以${weakest.subject}为首个攻坚学科，拆解到班级、题型和临界生名单，每周复盘一次。` : '按学科均分、优率、及格率三项建立周度看板，先找波动最大的班级。'
            },
            {
                title: 'Teacher support',
                action: best ? `提炼${best.subject}的有效做法，安排同备课组共享课堂节奏、作业设计和错题讲评方式。` : '组织同备课组交叉听评课，把有效课堂动作沉淀成可复制清单。'
            },
            {
                title: 'Student tiers',
                action: '把临界生、潜力优生和学困生分层跟踪，使用短周期小测验证干预是否真正拉动分数。'
            }
        ],
        slogan: '稳中提质'
    };
}

function renderQualityDiagnosisReport(contentDiv, data) {
    const safeData = data || {};
    const highlights = toReportList(safeData.highlights, '暂无结构化亮点，请结合学科明细继续观察。');
    const warnings = toReportList(safeData.warnings, '暂无结构化预警，请持续关注排名与及格率波动。');
    const strategies = Array.isArray(safeData.strategies) && safeData.strategies.length
        ? safeData.strategies
        : [{ title: 'Follow-up', action: '先从排名变化、薄弱学科和临界学生三个维度建立跟踪台账。' }];
    const score = Math.max(0, Math.min(100, Math.round(Number(safeData.score) || 75)));
    const notice = String(safeData.notice || '').trim();

    contentDiv.innerHTML = `
                    <div style="padding:10px;">
                        ${notice ? `
                        <div style="background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; padding:10px 14px; border-radius:10px; margin-bottom:18px; font-size:13px;">
                            ${escapeReportHtml(notice)}
                        </div>` : ''}
                        <!-- 头部评分 -->
                        <div style="text-align:center; margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;">
                            <h2 style="color:#1e293b; margin:0 0 10px 0; font-size:24px;">${escapeReportHtml(safeData.summary || '已生成质量诊断报告。')}</h2>
                            <div style="display:inline-flex; align-items:center; background:#fefce8; border:1px solid #facc15; padding:5px 15px; border-radius:20px;">
                                <span style="color:#854d0e; font-size:12px;">AI 综合健康指数：</span>
                                <span style="font-size:28px; font-weight:800; color:#d97706; margin-left:8px;">${score}</span>
                            </div>
                        </div>

                        <!-- 红绿榜对比 -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                            <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:1px solid #bbf7d0;">
                                <h4 style="color:#166534; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-thumb-up" style="margin-right:5px;"></i> 亮点与优势
                                </h4>
                                <ul style="padding-left:20px; color:#14532d; font-size:14px; margin:0; line-height:1.6;">
                                    ${highlights.map(h => `<li>${escapeReportHtml(h)}</li>`).join('')}
                                </ul>
                            </div>
                            <div style="background:#fef2f2; padding:20px; border-radius:12px; border:1px solid #fecaca;">
                                <h4 style="color:#991b1b; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-alert-triangle" style="margin-right:5px;"></i> 风险与预警
                                </h4>
                                <ul style="padding-left:20px; color:#7f1d1d; font-size:14px; margin:0; line-height:1.6;">
                                    ${warnings.map(w => `<li>${escapeReportHtml(w)}</li>`).join('')}
                                </ul>
                            </div>
                        </div>

                        <!-- 策略清单 -->
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                            <h4 style="color:#334155; margin:0 0 15px 0; border-left:4px solid var(--primary); padding-left:10px;">
                                🚀 提质增效行动方案
                            </h4>
                            <div style="display:flex; flex-direction:column; gap:15px;">
                                ${strategies.map((strategy, index) => `
                                    <div style="display:flex; align-items:flex-start; gap:12px;">
                                        <div style="background:#eff6ff; color:#1d4ed8; width:28px; height:28px; border-radius:6px; text-align:center; line-height:28px; font-weight:bold; flex-shrink:0;">${index + 1}</div>
                                        <div>
                                            <div style="font-weight:bold; color:#1e293b; font-size:15px;">${escapeReportHtml(strategy?.title || `Action ${index + 1}`)}</div>
                                            <div style="font-size:14px; color:#475569; margin-top:4px; line-height:1.5;">${escapeReportHtml(strategy?.action || '')}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 底部口号 -->
                        <div style="margin-top:30px; text-align:center;">
                            <span style="background:#f1f5f9; color:#64748b; padding:8px 20px; border-radius:50px; font-style:italic; font-size:14px;">
                                “ ${escapeReportHtml(safeData.slogan || '持续改进')} ”
                            </span>
                        </div>
                    </div>
                `;
}

function renderPlainQualityReport(contentDiv, text) {
    contentDiv.innerHTML = `
                    <div style="padding:20px; color:#333;">
                        <h3 style="color:#d97706;">⚠️ 解析模式降级</h3>
                        <p style="font-size:12px; color:#666;">AI 未返回标准 JSON 格式，已切换为纯文本显示。</p>
                        <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                        <pre style="white-space:pre-wrap; font-family:sans-serif; line-height:1.6;">${escapeReportHtml(text || '暂无可显示内容')}</pre>
                    </div>
                `;
}

// 2. 通用 LLM 请求函数
async function callLLM(prompt, onChunk, onFinish) {
    if (AI_DISABLED) {
        if (onFinish) onFinish("(请求失败)");
        throw new Error('AI 功能已移除');
    }
    const useGateway = shouldUseSameOriginAIGateway();
    if (!LLM_CONFIG.apiKey && !useGateway) return alert("请先在【数据中心】设置 AI API Key");

    try {
        const requestBody = {
            model: LLM_CONFIG.model,
            messages: [
                { role: "system", content: LLM_CONFIG.systemPrompt },
                { role: "user", content: prompt }
            ],
            stream: true
        };
        const headers = {
            "Content-Type": "application/json"
        };
        let endpoint = `${LLM_CONFIG.baseURL}/v1/chat/completions`;
        if (useGateway) {
            endpoint = getSameOriginAIChatUrl();
            requestBody.baseURL = LLM_CONFIG.baseURL;
            requestBody.apiKey = LLM_CONFIG.apiKey;
            requestBody.prompt = prompt;
            requestBody.systemPrompt = LLM_CONFIG.systemPrompt;
        } else {
            headers.Authorization = `Bearer ${LLM_CONFIG.apiKey}`;
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let detail = '';
            try {
                const errorBody = await response.json();
                detail = errorBody?.detail || errorBody?.error || '';
            } catch (e) {
                detail = await response.text().catch(() => '');
            }
            throw new Error(detail || `API Error: ${response.status}`);
        }

        const contentType = String(response.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('application/json')) {
            const data = await response.json();
            const fullText = data?.choices?.[0]?.message?.content || data?.result || data?.diagnosis || '';
            if (onChunk && fullText) onChunk(fullText);
            if (onFinish) onFinish(fullText);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // 处理 SSE 数据流 (data: {...})
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const json = JSON.parse(line.substring(6));
                        const content = json.choices[0].delta.content || "";
                        fullText += content;
                        if (onChunk) onChunk(content);
                    } catch (e) { }
                }
            }
        }
        if (onFinish) onFinish(fullText);

    } catch (error) {
        const message = String(error?.message || error || '未知错误');
        if (/AI_API_KEY_MISSING/i.test(message)) {
            window.__AI_GATEWAY_UNAVAILABLE__ = true;
            console.warn('AI gateway unavailable, using local fallback.');
        } else {
            console.error(error);
            alert("AI 请求失败: " + message);
        }
        if (onFinish) onFinish(" (请求失败)");
    }
}

// 3. 生成单个学生评语
function isVisibleAICommentBox(el) {
    if (!el || !el.isConnected) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function resolveAICommentBox() {
    const candidates = [
        document.querySelector('#parent-view-container #parent-ai-comment-box'),
        document.querySelector('#ai-analysis #ai-hub-comment-box'),
        document.getElementById('parent-ai-comment-box'),
        document.getElementById('ai-hub-comment-box'),
        document.getElementById('ai-comment-box')
    ].filter(Boolean);
    return candidates.find(isVisibleAICommentBox) || candidates[0] || null;
}

function callAIForComment() {
    if (AI_DISABLED) return aiDisabledAlert();
    const stu = readCurrentReportStudentSessionState();
    if (!stu) return alert("请先查询一名学生");

    const box = resolveAICommentBox();
    if (!box) return alert("AI 评语容器未找到，请刷新页面后重试");
    // 增加一个 Loading 动画效果
    box.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <span class="loader-spinner" style="width:20px;height:20px;display:inline-block;vertical-align:middle;"></span>
                <span style="color:#4f46e5; font-weight:bold; margin-left:10px;">AI 正在根据全镇数据深度分析 ${stu.name} 的学情...</span>
            </div>`;

    // 使用上面定义的增强版 Prompt 构建器
    const prompt = buildStudentPrompt(stu);

    let isFirstChunk = true;

    callLLM(prompt, (chunk) => {
        if (isFirstChunk) {
            box.innerHTML = ""; // 清除 Loading
            // 增加 Markdown 样式的简单处理容器
            box.style.fontFamily = '"Segoe UI", system-ui, sans-serif';
            box.style.whiteSpace = 'pre-wrap';
            isFirstChunk = false;
        }

        // 简单的流式追加
        box.innerText += chunk;

    }, (fullText) => {
        // (可选) 生成结束后，可以对文本进行简单的 Markdown 高亮处理
        // 这里为了简单，我们把 [小标题] 加粗
        const formatted = fullText
            .replace(/\[(.*?)\]/g, '<br><strong style="color:#b45309; background:#fff7ed; padding:2px 5px; border-radius:4px;">$1</strong>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // 处理 Markdown 加粗

        box.innerHTML = formatted;
    });
}

// 4. 生成年级质量分析报告 (长文) - 智能增强版 (本校 VS 乡镇)
// 功能：专注于本校与全镇对比，提供分层级、分科目的深度诊断与实操建议
function generateAIMacroReport() {
    if (AI_DISABLED) return aiDisabledAlert();
    if (!Object.keys(SCHOOLS).length) return alert("无数据");
    const townshipSchoolNames = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare()
        : Object.keys(SCHOOLS || {});
    const townshipSchoolSet = new Set((townshipSchoolNames || []).map(name => String(name || '').trim()).filter(Boolean));
    const townshipSchools = Object.values(SCHOOLS || {}).filter((school) => (
        !townshipSchoolSet.size || townshipSchoolSet.has(String(school?.name || '').trim())
    ));

    // 1. 强制检查本校设置 (关键逻辑：没有本校就无法做对比)
    if (!MY_SCHOOL || !SCHOOLS[MY_SCHOOL]) {
        return alert("⚠️ 无法生成针对性报告！\n\n请先在页面顶部的【选择本校】下拉框中选中您的学校，系统才能进行“本校 vs 他校”的深度对比分析。");
    }

    // 创建模态框显示报告
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
            <div class="modal-content" style="width:95%; max-width:1600px; height:90vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3>🤖 AI 深度质量诊断: ${MY_SCHOOL} (对比分析版)</h3>
                    <button onclick="this.closest('.modal').remove()" style="border:none; bg:none; cursor:pointer; font-size:20px;">&times;</button>
                </div>
                <div id="ai-report-content" style="flex:1; overflow-y:auto; padding:20px; white-space:pre-wrap; line-height:1.8; font-family:serif; font-size:16px;">
                    正在调取 ${MY_SCHOOL} 与全镇其他 ${Math.max(0, townshipSchools.length - 1)} 所学校的对比数据...
                    <br>正在分析学科短板与提分空间...
                    <br>正在生成针对 ${CONFIG.name} 的备考建议...
                    <br><br>
                    <span class="loader-spinner" style="width:20px;height:20px;display:inline-block;"></span> AI 正在奋笔疾书，请稍候 (约30秒)...
                </div>
                <div style="border-top:1px solid #eee; padding-top:10px; text-align:right;">
                    <button class="btn btn-blue" onclick="copyReport()">📋 复制全文</button>
                    <button class="btn btn-primary" onclick="exportToWord()" style="background:#2b579a; margin-left:10px;">
                        <i class="ti ti-file-word"></i> 导出为 Word
                    </button>
                </div>
            </div>
        `;
    document.body.appendChild(modal);

    // --- A. 数据准备 (Data Context) ---
    const myData = SCHOOLS[MY_SCHOOL];
    const totalSchools = townshipSchools.length;
    const myRank = myData.rank2Rate || '-';

    // 计算全镇基准数据
    let subjectComparison = []; // 存储单科对比详情

    // 遍历所有科目进行对比
    SUBJECTS.forEach(sub => {
        if (!myData.metrics[sub]) return;

        // 全镇该科数据收集
        const allSchoolsMetrics = townshipSchools.map(s => s.metrics[sub]).filter(m => m);
        const townSubAvg = allSchoolsMetrics.reduce((a, b) => a + b.avg, 0) / allSchoolsMetrics.length;
        const maxSubAvg = Math.max(...allSchoolsMetrics.map(m => m.avg)); // 第一名均分

        // 本校数据
        const mySub = myData.metrics[sub];
        const diff = mySub.avg - townSubAvg; // 与全镇平均差
        const diffMax = mySub.avg - maxSubAvg; // 与第一名差
        const rank = myData.rankings[sub]?.avg || '-';

        subjectComparison.push({
            subject: sub,
            myAvg: mySub.avg.toFixed(1),
            townAvg: townSubAvg.toFixed(1),
            diff: diff.toFixed(1), // 与均值差
            diffMax: diffMax.toFixed(1), // 与第一名差
            rank: rank,
            excRate: (mySub.excRate * 100).toFixed(1) + '%',
            passRate: (mySub.passRate * 100).toFixed(1) + '%'
        });
    });

    // 区分优势与劣势学科 (简单算法：排名前30%为优，后40%为劣)
    const strongSubjects = subjectComparison.filter(s => s.rank <= Math.ceil(totalSchools * 0.3)).map(s => s.subject).join('、');
    const weakSubjects = subjectComparison.filter(s => s.rank > Math.ceil(totalSchools * 0.6)).map(s => s.subject).join('、');

    // 构建上下文文本，喂给 AI
    const contextText = `
        【基本信息】
        年级模式：${CONFIG.name} (特别注意：如果是9年级则面临中考，如果是7/8年级则处于基础阶段)
        本校：${MY_SCHOOL}
        全镇学校数：${totalSchools}
        本校综合排名：第 ${myRank} 名
        本校综合得分：${myData.score2Rate ? myData.score2Rate.toFixed(2) : '-'}

        【学科详细对比数据】(正数代表高于全镇均分，负数代表低于)：
        ${subjectComparison.map(s => `- ${s.subject}: 均分${s.myAvg} (与全镇差${s.diff}, 与第一名差${s.diffMax}), 排名${s.rank}, 优率${s.excRate}, 及格率${s.passRate}`).join('\n')}
        
        【初步诊断】
        优势学科：${strongSubjects || '无明显优势'}
        薄弱学科：${weakSubjects || '无明显短板'}
        `;

    // --- B. 构建 Prompt (要求 AI 返回 JSON 格式) ---
    const prompt = `
        你是一位资深教育数据分析师。请基于以下 **${MY_SCHOOL}** 的考试数据，进行深度诊断。

        【数据上下文】：
        ${contextText}

        【输出指令】：
        请严格按照以下 **JSON** 格式返回分析结果，不要包含任何 Markdown 标记（如 \`\`\`json），也不要包含任何开场白或结束语，直接返回 JSON 对象：
        {
            "summary": "一句话考情综述（例如：整体稳中有进，但优生断层严重，需警惕两极分化）",
            "score": 85, 
            "highlights": ["亮点1：XX学科均分超全镇平均5分", "亮点2：及格率稳步提升"], 
            "warnings": ["预警1：903班数学出现严重滑坡", "预警2：全校前100名人数偏少"], 
            "strategies": [
                { "title": "学科攻坚", "action": "针对英语薄弱问题，建议早读增加20分钟单词听写..." },
                { "title": "培优辅差", "action": "建立临界生档案，实行导师制..." },
                { "title": "课堂常规", "action": "严抓晚自习纪律，提高作业完成率..." }
            ],
            "slogan": "一句鼓舞人心的短句（10字以内）"
        }
        `;

    const contentDiv = document.getElementById('ai-report-content');
    // 初始化 Loading 界面
    contentDiv.innerHTML = `
            <div style="text-align:center; padding:50px;">
                <div class="loader-spinner" style="width:40px;height:40px;margin:0 auto 15px;display:block;"></div>
                <div style="font-size:16px; color:#4f46e5; font-weight:bold;">🤖 AI 正在进行多维度推理...</div>
                <div style="font-size:12px; color:#64748b; margin-top:5px;">正在对比全镇数据 / 计算学科差异 / 生成提分策略</div>
            </div>`;

    // 调用 AI 接口 (使用累积模式处理 JSON)
    let jsonBuffer = "";
    const localFallback = buildLocalQualityDiagnosis({
        myRank,
        totalSchools,
        subjectComparison,
        strongSubjects,
        weakSubjects
    });

    if (window.__AI_GATEWAY_UNAVAILABLE__ && shouldUseSameOriginAIGateway() && !LLM_CONFIG.apiKey) {
        renderQualityDiagnosisReport(contentDiv, localFallback);
        return;
    }

    callLLM(prompt, (chunk) => {
        // 流式接收数据，暂不渲染，只存入 buffer
        jsonBuffer += chunk;
    }, (fullText) => {
        // 生成结束，开始解析与渲染
        const sourceText = (jsonBuffer || fullText || '').replace(/```json/g, '').replace(/```/g, '').trim();
        if (!sourceText || sourceText.includes('请求失败')) {
            renderQualityDiagnosisReport(contentDiv, localFallback);
            return;
        }

        try {
            const data = JSON.parse(sourceText);
            renderQualityDiagnosisReport(contentDiv, data);
        } catch (e) {
            // 如果 AI 返回的不是合法 JSON，回退显示原始文本
            console.warn("AI JSON 解析失败，已切换为纯文本显示。", e);
            renderPlainQualityReport(contentDiv, sourceText);
        }
    });
}

function copyReport() {
    const text = document.getElementById('ai-report-content').innerText;
    navigator.clipboard.writeText(text).then(() => alert("已复制到剪贴板"));
}

function downloadReportBlob(blob, fileName) {
    if (typeof window.saveAs === 'function') {
        window.saveAs(blob, fileName);
        return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
    }, 0);
}

function exportReportAsHtmlWord(content, fileName) {
    const title = `${CONFIG.name} 教学质量分析报告`;
    const paragraphs = String(content || '')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => `<p>${escapeReportHtml(line)}</p>`)
        .join('\n');
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${escapeReportHtml(title)}</title>
    <style>
        body { font-family: "Microsoft YaHei", Arial, sans-serif; line-height: 1.8; color: #1f2937; }
        h1 { text-align: center; font-size: 24px; }
        .date { text-align: center; color: #64748b; margin-bottom: 28px; }
        p { margin: 0 0 10px; text-indent: 2em; }
    </style>
</head>
<body>
    <h1>${escapeReportHtml(title)}</h1>
    <div class="date">生成日期：${escapeReportHtml(new Date().toLocaleDateString())}</div>
    ${paragraphs}
    <p style="text-align:center;color:#94a3b8;text-indent:0;margin-top:32px;">（本报告由智能教务系统自动生成）</p>
</body>
</html>`;
    const blob = new Blob(['\ufeff', html], { type: 'application/msword;charset=utf-8' });
    downloadReportBlob(blob, fileName);
}

function exportToWord() {
    const content = document.getElementById('ai-report-content')?.innerText || '';
    // 使用我们之前封装的 UI.toast 替代 alert，如果还没加 UI 模块，这里依然可以用 alert
    if (!content || /正在(调取|分析|生成|进行|奋笔疾书)|请稍候|AI 正在/.test(content)) {
        return reportToast("请等待报告生成完毕后再导出");
    }

    const baseFileName = `${CONFIG.name}_质量分析报告_${new Date().getTime()}`;
    if (!window.docx) {
        const fileName = `${baseFileName}.doc`;
        exportReportAsHtmlWord(content, fileName);
        reportToast(`✅ 已导出 Word 兼容文档：${fileName}`, "success");
        return;
    }

    const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = window.docx;

    // 1. 解析文本：简单按换行符分割
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const docChildren = [];

    // 1.1 添加大标题
    docChildren.push(
        new Paragraph({
            text: `${CONFIG.name} 教学质量分析报告`,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        })
    );

    // 1.2 添加生成日期
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `生成日期：${new Date().toLocaleDateString()}`,
                    italics: true,
                    color: "666666",
                    size: 20 // 10pt
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 500 }
        })
    );

    // 1.3 智能识别正文段落结构
    lines.forEach(line => {
        const trimmed = line.trim();

        // 简单的标题识别逻辑：以 "一、" "1." 等开头，或者包含 "【"
        const isHeading = /^[一二三四五六七八九十]、/.test(trimmed) ||
            /^\d+\./.test(trimmed) ||
            /^【.*】$/.test(trimmed);

        if (isHeading) {
            // 小标题格式：加粗，字号稍大，段前段后间距
            docChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: trimmed, bold: true, size: 28 })], // 14pt
                    spacing: { before: 400, after: 200 }
                })
            );
        } else {
            // 普通正文：首行缩进 2 字符，1.5倍行距
            docChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: trimmed, size: 24 })], // 12pt
                    indent: { firstLine: 480 },
                    spacing: { line: 360 }
                })
            );
        }
    });

    // 1.4 底部落款
    docChildren.push(
        new Paragraph({
            children: [new TextRun({ text: "（本报告由智能教务系统自动生成）", color: "999999", size: 18 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 800 }
        })
    );

    // 2. 创建文档对象
    const doc = new Document({
        sections: [{ properties: {}, children: docChildren }],
    });

    // 3. 生成并下载
    Packer.toBlob(doc).then((blob) => {
        const fileName = `${baseFileName}.docx`;
        downloadReportBlob(blob, fileName);
        reportToast(`✅ 已导出 Word 文档：${fileName}`, "success");
    }).catch(err => {
        console.error(err);
        alert("导出 Word 失败：" + err.message);
    });
}

    Object.assign(window, {
        saveLLMConfig,
        callLLM,
        callAIForComment,
        generateAIMacroReport,
        copyReport,
        exportToWord
    });

    window.__REPORT_AI_RUNTIME_PATCHED__ = true;
})();
