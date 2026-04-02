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
        console.error(error);
        alert("AI 请求失败: " + error.message);
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
                    正在调取 ${MY_SCHOOL} 与全镇其他 ${Object.keys(SCHOOLS).length - 1} 所学校的对比数据...
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
    const totalSchools = Object.keys(SCHOOLS).length;
    const myRank = myData.rank2Rate || '-';

    // 计算全镇基准数据
    let subjectComparison = []; // 存储单科对比详情

    // 遍历所有科目进行对比
    SUBJECTS.forEach(sub => {
        if (!myData.metrics[sub]) return;

        // 全镇该科数据收集
        const allSchoolsMetrics = Object.values(SCHOOLS).map(s => s.metrics[sub]).filter(m => m);
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

    callLLM(prompt, (chunk) => {
        // 流式接收数据，暂不渲染，只存入 buffer
        jsonBuffer += chunk;
    }, (fullText) => {
        // 生成结束，开始解析与渲染
        try {
            // 1. 清洗数据：去除可能存在的 Markdown 代码块标记
            const cleanJson = jsonBuffer.replace(/```json/g, '').replace(/```/g, '').trim();

            // 2. 解析 JSON
            const data = JSON.parse(cleanJson);

            // 3. 渲染漂亮的 UI
            contentDiv.innerHTML = `
                    <div style="padding:10px;">
                        <!-- 头部评分 -->
                        <div style="text-align:center; margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;">
                            <h2 style="color:#1e293b; margin:0 0 10px 0; font-size:24px;">${data.summary}</h2>
                            <div style="display:inline-flex; align-items:center; background:#fefce8; border:1px solid #facc15; padding:5px 15px; border-radius:20px;">
                                <span style="color:#854d0e; font-size:12px;">AI 综合健康指数：</span>
                                <span style="font-size:28px; font-weight:800; color:#d97706; margin-left:8px;">${data.score}</span>
                            </div>
                        </div>

                        <!-- 红绿榜对比 -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                            <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:1px solid #bbf7d0;">
                                <h4 style="color:#166534; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-thumb-up" style="margin-right:5px;"></i> 亮点与优势
                                </h4>
                                <ul style="padding-left:20px; color:#14532d; font-size:14px; margin:0; line-height:1.6;">
                                    ${data.highlights.map(h => `<li>${h}</li>`).join('')}
                                </ul>
                            </div>
                            <div style="background:#fef2f2; padding:20px; border-radius:12px; border:1px solid #fecaca;">
                                <h4 style="color:#991b1b; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-alert-triangle" style="margin-right:5px;"></i> 风险与预警
                                </h4>
                                <ul style="padding-left:20px; color:#7f1d1d; font-size:14px; margin:0; line-height:1.6;">
                                    ${data.warnings.map(w => `<li>${w}</li>`).join('')}
                                </ul>
                            </div>
                        </div>

                        <!-- 策略清单 -->
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                            <h4 style="color:#334155; margin:0 0 15px 0; border-left:4px solid var(--primary); padding-left:10px;">
                                🚀 提质增效行动方案
                            </h4>
                            <div style="display:flex; flex-direction:column; gap:15px;">
                                ${data.strategies.map((s, i) => `
                                    <div style="display:flex; align-items:flex-start; gap:12px;">
                                        <div style="background:#eff6ff; color:#1d4ed8; width:28px; height:28px; border-radius:6px; text-align:center; line-height:28px; font-weight:bold; flex-shrink:0;">${i + 1}</div>
                                        <div>
                                            <div style="font-weight:bold; color:#1e293b; font-size:15px;">${s.title}</div>
                                            <div style="font-size:14px; color:#475569; margin-top:4px; line-height:1.5;">${s.action}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 底部口号 -->
                        <div style="margin-top:30px; text-align:center;">
                            <span style="background:#f1f5f9; color:#64748b; padding:8px 20px; border-radius:50px; font-style:italic; font-size:14px;">
                                “ ${data.slogan} ”
                            </span>
                        </div>
                    </div>
                `;
        } catch (e) {
            // 如果 AI 返回的不是合法 JSON，回退显示原始文本
            console.error("AI JSON 解析失败", e);
            contentDiv.innerHTML = `
                    <div style="padding:20px; color:#333;">
                        <h3 style="color:#d97706;">⚠️ 解析模式降级</h3>
                        <p style="font-size:12px; color:#666;">AI 未返回标准 JSON 格式，已切换为纯文本显示。</p>
                        <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                        <pre style="white-space:pre-wrap; font-family:sans-serif; line-height:1.6;">${jsonBuffer}</pre>
                    </div>
                `;
        }
    });
}

function copyReport() {
    const text = document.getElementById('ai-report-content').innerText;
    navigator.clipboard.writeText(text).then(() => alert("已复制到剪贴板"));
}
function exportToWord() {
    const content = document.getElementById('ai-report-content').innerText;
    // 使用我们之前封装的 UI.toast 替代 alert，如果还没加 UI 模块，这里依然可以用 alert
    if (!content || content.includes("正在汇总")) return (window.UI ? UI.toast : alert)("请等待报告生成完毕后再导出");

    const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = docx;

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
        const fileName = `${CONFIG.name}_质量分析报告_${new Date().getTime()}.docx`;
        saveAs(blob, fileName);
        if (window.UI) UI.toast(`✅ 已导出 Word 文档：${fileName}`, "success");
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
