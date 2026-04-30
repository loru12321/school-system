(()=>{if(typeof window=="undefined"||window.__REPORT_AI_RUNTIME_PATCHED__)return;function j(){const e=document.getElementById("llm_apikey").value,t=document.getElementById("llm_baseurl").value,i=document.getElementById("llm_model").value;if(!e)return alert("API Key 不能为空");localStorage.setItem("LLM_API_KEY",e),localStorage.setItem("LLM_BASE_URL",t),localStorage.setItem("LLM_MODEL",i),LLM_CONFIG.apiKey=e,LLM_CONFIG.baseURL=t,LLM_CONFIG.model=i,alert("✅ AI 配置已保存！")}function _(){const e=document.getElementById("llm_apikey"),t=document.getElementById("llm_baseurl"),i=document.getElementById("llm_model");!e||!t||!i||(LLM_CONFIG.apiKey&&(e.value=LLM_CONFIG.apiKey),t.value=LLM_CONFIG.baseURL,i.value=LLM_CONFIG.model)}document.readyState==="loading"?window.addEventListener("load",_,{once:!0}):_();function k(e){const t=String(e||"").trim().toLowerCase();return!t||t==="localhost"||t==="127.0.0.1"||t==="[::1]"||t.endsWith(".local")}function O(){if(!window.location)return!1;const e=String(window.location.protocol||"").trim().toLowerCase();return e!=="https:"&&e!=="http:"?!1:!k(window.location.hostname)}function R(){return!window.location||!window.location.origin?"/api/ai/chat":String(window.location.origin).replace(/\/$/,"")+"/api/ai/chat"}function v(e,t){return window.UI&&typeof UI.toast=="function"?UI.toast(e,t):alert(e)}function h(e){return String(e!=null?e:"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function C(e,t){const o=(Array.isArray(e)?e:[]).map(r=>String(r!=null?r:"").trim()).filter(Boolean);return o.length?o:[t]}function M(e){const t=Number(String(e!=null?e:"").replace(/[^\d.-]/g,""));return Number.isFinite(t)&&t>0?t:null}function T(e){const t=Array.isArray(e==null?void 0:e.subjectComparison)?e.subjectComparison:[],i=Math.max(1,Number(e==null?void 0:e.totalSchools)||1),o=M(e==null?void 0:e.myRank),r=o?o/i:.5,p=t.map(c=>({...c,diffNum:Number(c.diff),rankNum:M(c.rank)})).filter(c=>Number.isFinite(c.diffNum)),f=p.filter(c=>c.diffNum>=0).sort((c,n)=>n.diffNum-c.diffNum),a=p.filter(c=>c.diffNum<0).sort((c,n)=>c.diffNum-n.diffNum),s=String((e==null?void 0:e.strongSubjects)||f.slice(0,2).map(c=>c.subject).join("、")||"").trim(),m=String((e==null?void 0:e.weakSubjects)||a.slice(0,2).map(c=>c.subject).join("、")||"").trim(),g=Math.max(62,Math.min(92,Math.round(94-r*26+f.length-a.length*1.5))),b=f[0],l=a[0];return{notice:"AI 网关暂未就绪，已根据本地成绩数据生成离线诊断。",summary:`整体表现${o?`综合排名第 ${o}/${i}`:"综合排名暂缺"}，${s?`优势学科集中在 ${s}`:"优势学科仍需继续识别"}，${m?`需关注 ${m}`:"短板暂不明显"}。`,score:g,highlights:[b?`${b.subject}均分高于全镇 ${b.diff} 分，当前可作为校内提质样板。`:"当前未发现明显高于全镇均分的学科，建议先稳住基础盘。",s?`优势学科：${s}，可沉淀备课、作业和讲评经验。`:"各学科差距相对接近，适合用统一质量监测先找关键班级。",o&&o<=Math.ceil(i*.35)?"综合位次处于前列，下一步重点是保持稳定性。":"综合位次还有提升空间，优先抓可快速拉动均分的薄弱科目。"],warnings:[l?`${l.subject}低于全镇均分 ${Math.abs(l.diffNum).toFixed(1)} 分，需要进入学科攻坚清单。`:"未发现明显低于全镇均分的学科，但仍需防止高分段断层。",m?`薄弱学科：${m}，建议结合班级明细定位具体任课与学生群体。`:"短板暂不明显，建议继续关注优率、及格率和班级波动。",r>.5?"当前综合位次偏后，单靠平均分追赶不够，需要同步提升及格率和优生贡献。":"排名靠前时更要警惕学科间分化，避免优势科目掩盖局部风险。"],strategies:[{title:"Subject focus",action:l?`以${l.subject}为首个攻坚学科，拆解到班级、题型和临界生名单，每周复盘一次。`:"按学科均分、优率、及格率三项建立周度看板，先找波动最大的班级。"},{title:"Teacher support",action:b?`提炼${b.subject}的有效做法，安排同备课组共享课堂节奏、作业设计和错题讲评方式。`:"组织同备课组交叉听评课，把有效课堂动作沉淀成可复制清单。"},{title:"Student tiers",action:"把临界生、潜力优生和学困生分层跟踪，使用短周期小测验证干预是否真正拉动分数。"}],slogan:"稳中提质"}}function I(e,t){const i=t||{},o=C(i.highlights,"暂无结构化亮点，请结合学科明细继续观察。"),r=C(i.warnings,"暂无结构化预警，请持续关注排名与及格率波动。"),p=Array.isArray(i.strategies)&&i.strategies.length?i.strategies:[{title:"Follow-up",action:"先从排名变化、薄弱学科和临界学生三个维度建立跟踪台账。"}],f=Math.max(0,Math.min(100,Math.round(Number(i.score)||75))),a=String(i.notice||"").trim();e.innerHTML=`
                    <div style="padding:10px;">
                        ${a?`
                        <div style="background:#fff7ed; border:1px solid #fed7aa; color:#9a3412; padding:10px 14px; border-radius:10px; margin-bottom:18px; font-size:13px;">
                            ${h(a)}
                        </div>`:""}
                        <!-- 头部评分 -->
                        <div style="text-align:center; margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;">
                            <h2 style="color:#1e293b; margin:0 0 10px 0; font-size:24px;">${h(i.summary||"已生成质量诊断报告。")}</h2>
                            <div style="display:inline-flex; align-items:center; background:#fefce8; border:1px solid #facc15; padding:5px 15px; border-radius:20px;">
                                <span style="color:#854d0e; font-size:12px;">AI 综合健康指数：</span>
                                <span style="font-size:28px; font-weight:800; color:#d97706; margin-left:8px;">${f}</span>
                            </div>
                        </div>

                        <!-- 红绿榜对比 -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                            <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:1px solid #bbf7d0;">
                                <h4 style="color:#166534; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-thumb-up" style="margin-right:5px;"></i> 亮点与优势
                                </h4>
                                <ul style="padding-left:20px; color:#14532d; font-size:14px; margin:0; line-height:1.6;">
                                    ${o.map(s=>`<li>${h(s)}</li>`).join("")}
                                </ul>
                            </div>
                            <div style="background:#fef2f2; padding:20px; border-radius:12px; border:1px solid #fecaca;">
                                <h4 style="color:#991b1b; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-alert-triangle" style="margin-right:5px;"></i> 风险与预警
                                </h4>
                                <ul style="padding-left:20px; color:#7f1d1d; font-size:14px; margin:0; line-height:1.6;">
                                    ${r.map(s=>`<li>${h(s)}</li>`).join("")}
                                </ul>
                            </div>
                        </div>

                        <!-- 策略清单 -->
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                            <h4 style="color:#334155; margin:0 0 15px 0; border-left:4px solid var(--primary); padding-left:10px;">
                                🚀 提质增效行动方案
                            </h4>
                            <div style="display:flex; flex-direction:column; gap:15px;">
                                ${p.map((s,m)=>`
                                    <div style="display:flex; align-items:flex-start; gap:12px;">
                                        <div style="background:#eff6ff; color:#1d4ed8; width:28px; height:28px; border-radius:6px; text-align:center; line-height:28px; font-weight:bold; flex-shrink:0;">${m+1}</div>
                                        <div>
                                            <div style="font-weight:bold; color:#1e293b; font-size:15px;">${h((s==null?void 0:s.title)||`Action ${m+1}`)}</div>
                                            <div style="font-size:14px; color:#475569; margin-top:4px; line-height:1.5;">${h((s==null?void 0:s.action)||"")}</div>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>

                        <!-- 底部口号 -->
                        <div style="margin-top:30px; text-align:center;">
                            <span style="background:#f1f5f9; color:#64748b; padding:8px 20px; border-radius:50px; font-style:italic; font-size:14px;">
                                “ ${h(i.slogan||"持续改进")} ”
                            </span>
                        </div>
                    </div>
                `}function F(e,t){e.innerHTML=`
                    <div style="padding:20px; color:#333;">
                        <h3 style="color:#d97706;">⚠️ 解析模式降级</h3>
                        <p style="font-size:12px; color:#666;">AI 未返回标准 JSON 格式，已切换为纯文本显示。</p>
                        <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                        <pre style="white-space:pre-wrap; font-family:sans-serif; line-height:1.6;">${h(t||"暂无可显示内容")}</pre>
                    </div>
                `}async function S(e,t,i){var r,p,f;if(AI_DISABLED)throw i&&i("(请求失败)"),new Error("AI 功能已移除");const o=O();if(!LLM_CONFIG.apiKey&&!o)return alert("请先在【数据中心】设置 AI API Key");try{const a={model:LLM_CONFIG.model,messages:[{role:"system",content:LLM_CONFIG.systemPrompt},{role:"user",content:e}],stream:!0},s={"Content-Type":"application/json"};let m=`${LLM_CONFIG.baseURL}/v1/chat/completions`;o?(m=R(),a.baseURL=LLM_CONFIG.baseURL,a.apiKey=LLM_CONFIG.apiKey,a.prompt=e,a.systemPrompt=LLM_CONFIG.systemPrompt):s.Authorization=`Bearer ${LLM_CONFIG.apiKey}`;const g=await fetch(m,{method:"POST",headers:s,body:JSON.stringify(a)});if(!g.ok){let n="";try{const d=await g.json();n=(d==null?void 0:d.detail)||(d==null?void 0:d.error)||""}catch(d){n=await g.text().catch(()=>"")}throw new Error(n||`API Error: ${g.status}`)}if(String(g.headers.get("content-type")||"").toLowerCase().includes("application/json")){const n=await g.json(),d=((f=(p=(r=n==null?void 0:n.choices)==null?void 0:r[0])==null?void 0:p.message)==null?void 0:f.content)||(n==null?void 0:n.result)||(n==null?void 0:n.diagnosis)||"";t&&d&&t(d),i&&i(d);return}const l=g.body.getReader(),u=new TextDecoder("utf-8");let c="";for(;;){const{done:n,value:d}=await l.read();if(n)break;const A=u.decode(d,{stream:!0}).split(`
`);for(const y of A)if(y.startsWith("data: ")&&y!=="data: [DONE]")try{const L=JSON.parse(y.substring(6)).choices[0].delta.content||"";c+=L,t&&t(L)}catch($){}}i&&i(c)}catch(a){const s=String((a==null?void 0:a.message)||a||"未知错误");/AI_API_KEY_MISSING/i.test(s)?(window.__AI_GATEWAY_UNAVAILABLE__=!0,console.warn("AI gateway unavailable, using local fallback.")):(console.error(a),alert("AI 请求失败: "+s)),i&&i(" (请求失败)")}}function B(e){if(!e||!e.isConnected)return!1;const t=window.getComputedStyle(e);if(t.display==="none"||t.visibility==="hidden"||t.opacity==="0")return!1;const i=e.getBoundingClientRect();return i.width>0&&i.height>0}function H(){const e=[document.querySelector("#parent-view-container #parent-ai-comment-box"),document.querySelector("#ai-analysis #ai-hub-comment-box"),document.getElementById("parent-ai-comment-box"),document.getElementById("ai-hub-comment-box"),document.getElementById("ai-comment-box")].filter(Boolean);return e.find(B)||e[0]||null}function D(){if(AI_DISABLED)return aiDisabledAlert();const e=readCurrentReportStudentSessionState();if(!e)return alert("请先查询一名学生");const t=H();if(!t)return alert("AI 评语容器未找到，请刷新页面后重试");t.innerHTML=`
            <div style="text-align:center; padding:20px;">
                <span class="loader-spinner" style="width:20px;height:20px;display:inline-block;vertical-align:middle;"></span>
                <span style="color:#4f46e5; font-weight:bold; margin-left:10px;">AI 正在根据全镇数据深度分析 ${e.name} 的学情...</span>
            </div>`;const i=buildStudentPrompt(e);let o=!0;S(i,r=>{o&&(t.innerHTML="",t.style.fontFamily='"Segoe UI", system-ui, sans-serif',t.style.whiteSpace="pre-wrap",o=!1),t.innerText+=r},r=>{const p=r.replace(/\[(.*?)\]/g,'<br><strong style="color:#b45309; background:#fff7ed; padding:2px 5px; border-radius:4px;">$1</strong>').replace(/\*\*(.*?)\*\*/g,"<b>$1</b>");t.innerHTML=p})}function G(){if(AI_DISABLED)return aiDisabledAlert();if(!Object.keys(SCHOOLS).length)return alert("无数据");const e=typeof listAvailableSchoolsForCompare=="function"?listAvailableSchoolsForCompare():Object.keys(SCHOOLS||{}),t=new Set((e||[]).map(n=>String(n||"").trim()).filter(Boolean)),i=Object.values(SCHOOLS||{}).filter(n=>!t.size||t.has(String((n==null?void 0:n.name)||"").trim()));if(!MY_SCHOOL||!SCHOOLS[MY_SCHOOL])return alert(`⚠️ 无法生成针对性报告！

请先在页面顶部的【选择本校】下拉框中选中您的学校，系统才能进行“本校 vs 他校”的深度对比分析。`);const o=document.createElement("div");o.className="modal",o.style.display="flex",o.innerHTML=`
            <div class="modal-content" style="width:95%; max-width:1600px; height:90vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3>🤖 AI 深度质量诊断: ${MY_SCHOOL} (对比分析版)</h3>
                    <button onclick="this.closest('.modal').remove()" style="border:none; bg:none; cursor:pointer; font-size:20px;">&times;</button>
                </div>
                <div id="ai-report-content" style="flex:1; overflow-y:auto; padding:20px; white-space:pre-wrap; line-height:1.8; font-family:serif; font-size:16px;">
                    正在调取 ${MY_SCHOOL} 与全镇其他 ${Math.max(0,i.length-1)} 所学校的对比数据...
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
        `,document.body.appendChild(o);const r=SCHOOLS[MY_SCHOOL],p=i.length,f=r.rank2Rate||"-";let a=[];SUBJECTS.forEach(n=>{var E;if(!r.metrics[n])return;const d=i.map(w=>w.metrics[n]).filter(w=>w),x=d.reduce((w,K)=>w+K.avg,0)/d.length,A=Math.max(...d.map(w=>w.avg)),y=r.metrics[n],$=y.avg-x,L=y.avg-A,Y=((E=r.rankings[n])==null?void 0:E.avg)||"-";a.push({subject:n,myAvg:y.avg.toFixed(1),townAvg:x.toFixed(1),diff:$.toFixed(1),diffMax:L.toFixed(1),rank:Y,excRate:(y.excRate*100).toFixed(1)+"%",passRate:(y.passRate*100).toFixed(1)+"%"})});const s=a.filter(n=>n.rank<=Math.ceil(p*.3)).map(n=>n.subject).join("、"),m=a.filter(n=>n.rank>Math.ceil(p*.6)).map(n=>n.subject).join("、"),g=`
        【基本信息】
        年级模式：${CONFIG.name} (特别注意：如果是9年级则面临中考，如果是7/8年级则处于基础阶段)
        本校：${MY_SCHOOL}
        全镇学校数：${p}
        本校综合排名：第 ${f} 名
        本校综合得分：${r.score2Rate?r.score2Rate.toFixed(2):"-"}

        【学科详细对比数据】(正数代表高于全镇均分，负数代表低于)：
        ${a.map(n=>`- ${n.subject}: 均分${n.myAvg} (与全镇差${n.diff}, 与第一名差${n.diffMax}), 排名${n.rank}, 优率${n.excRate}, 及格率${n.passRate}`).join(`
`)}
        
        【初步诊断】
        优势学科：${s||"无明显优势"}
        薄弱学科：${m||"无明显短板"}
        `,b=`
        你是一位资深教育数据分析师。请基于以下 **${MY_SCHOOL}** 的考试数据，进行深度诊断。

        【数据上下文】：
        ${g}

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
        `,l=document.getElementById("ai-report-content");l.innerHTML=`
            <div style="text-align:center; padding:50px;">
                <div class="loader-spinner" style="width:40px;height:40px;margin:0 auto 15px;display:block;"></div>
                <div style="font-size:16px; color:#4f46e5; font-weight:bold;">🤖 AI 正在进行多维度推理...</div>
                <div style="font-size:12px; color:#64748b; margin-top:5px;">正在对比全镇数据 / 计算学科差异 / 生成提分策略</div>
            </div>`;let u="";const c=T({myRank:f,totalSchools:p,subjectComparison:a,strongSubjects:s,weakSubjects:m});if(window.__AI_GATEWAY_UNAVAILABLE__&&O()&&!LLM_CONFIG.apiKey){I(l,c);return}S(b,n=>{u+=n},n=>{const d=(u||n||"").replace(/```json/g,"").replace(/```/g,"").trim();if(!d||d.includes("请求失败")){I(l,c);return}try{const x=JSON.parse(d);I(l,x)}catch(x){console.warn("AI JSON 解析失败，已切换为纯文本显示。",x),F(l,d)}})}function z(){const e=document.getElementById("ai-report-content").innerText;navigator.clipboard.writeText(e).then(()=>alert("已复制到剪贴板"))}function N(e,t){if(typeof window.saveAs=="function"){window.saveAs(e,t);return}const i=URL.createObjectURL(e),o=document.createElement("a");o.href=i,o.download=t,o.style.display="none",document.body.appendChild(o),o.click(),setTimeout(()=>{URL.revokeObjectURL(i),o.remove()},0)}function U(e,t){const i=`${CONFIG.name} 教学质量分析报告`,o=String(e||"").split(`
`).map(f=>f.trim()).filter(Boolean).map(f=>`<p>${h(f)}</p>`).join(`
`),r=`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${h(i)}</title>
    <style>
        body { font-family: "Microsoft YaHei", Arial, sans-serif; line-height: 1.8; color: #1f2937; }
        h1 { text-align: center; font-size: 24px; }
        .date { text-align: center; color: #64748b; margin-bottom: 28px; }
        p { margin: 0 0 10px; text-indent: 2em; }
    </style>
</head>
<body>
    <h1>${h(i)}</h1>
    <div class="date">生成日期：${h(new Date().toLocaleDateString())}</div>
    ${o}
    <p style="text-align:center;color:#94a3b8;text-indent:0;margin-top:32px;">（本报告由智能教务系统自动生成）</p>
</body>
</html>`,p=new Blob(["\uFEFF",r],{type:"application/msword;charset=utf-8"});N(p,t)}function P(){var b;const e=((b=document.getElementById("ai-report-content"))==null?void 0:b.innerText)||"";if(!e||/正在(调取|分析|生成|进行|奋笔疾书)|请稍候|AI 正在/.test(e))return v("请等待报告生成完毕后再导出");const t=`${CONFIG.name}_质量分析报告_${new Date().getTime()}`;if(!window.docx){const l=`${t}.doc`;U(e,l),v(`✅ 已导出 Word 兼容文档：${l}`,"success");return}const{Document:i,Packer:o,Paragraph:r,TextRun:p,AlignmentType:f,HeadingLevel:a}=window.docx,s=e.split(`
`).filter(l=>l.trim()!==""),m=[];m.push(new r({text:`${CONFIG.name} 教学质量分析报告`,heading:a.TITLE,alignment:f.CENTER,spacing:{after:300}})),m.push(new r({children:[new p({text:`生成日期：${new Date().toLocaleDateString()}`,italics:!0,color:"666666",size:20})],alignment:f.CENTER,spacing:{after:500}})),s.forEach(l=>{const u=l.trim();/^[一二三四五六七八九十]、/.test(u)||/^\d+\./.test(u)||/^【.*】$/.test(u)?m.push(new r({children:[new p({text:u,bold:!0,size:28})],spacing:{before:400,after:200}})):m.push(new r({children:[new p({text:u,size:24})],indent:{firstLine:480},spacing:{line:360}}))}),m.push(new r({children:[new p({text:"（本报告由智能教务系统自动生成）",color:"999999",size:18})],alignment:f.CENTER,spacing:{before:800}}));const g=new i({sections:[{properties:{},children:m}]});o.toBlob(g).then(l=>{const u=`${t}.docx`;N(l,u),v(`✅ 已导出 Word 文档：${u}`,"success")}).catch(l=>{console.error(l),alert("导出 Word 失败："+l.message)})}Object.assign(window,{saveLLMConfig:j,callLLM:S,callAIForComment:D,generateAIMacroReport:G,copyReport:z,exportToWord:P}),window.__REPORT_AI_RUNTIME_PATCHED__=!0})();
