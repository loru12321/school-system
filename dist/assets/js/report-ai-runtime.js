(()=>{if(typeof window=="undefined"||window.__REPORT_AI_RUNTIME_PATCHED__)return;function C(){const e=document.getElementById("llm_apikey").value,t=document.getElementById("llm_baseurl").value,i=document.getElementById("llm_model").value;if(!e)return alert("API Key 不能为空");localStorage.setItem("LLM_API_KEY",e),localStorage.setItem("LLM_BASE_URL",t),localStorage.setItem("LLM_MODEL",i),LLM_CONFIG.apiKey=e,LLM_CONFIG.baseURL=t,LLM_CONFIG.model=i,alert("✅ AI 配置已保存！")}function S(){const e=document.getElementById("llm_apikey"),t=document.getElementById("llm_baseurl"),i=document.getElementById("llm_model");!e||!t||!i||(LLM_CONFIG.apiKey&&(e.value=LLM_CONFIG.apiKey),t.value=LLM_CONFIG.baseURL,i.value=LLM_CONFIG.model)}document.readyState==="loading"?window.addEventListener("load",S,{once:!0}):S();function _(e){const t=String(e||"").trim().toLowerCase();return!t||t==="localhost"||t==="127.0.0.1"||t==="[::1]"||t.endsWith(".local")}function M(){if(!window.location)return!1;const e=String(window.location.protocol||"").trim().toLowerCase();return e!=="https:"&&e!=="http:"?!1:!_(window.location.hostname)}function A(){return!window.location||!window.location.origin?"/api/ai/chat":String(window.location.origin).replace(/\/$/,"")+"/api/ai/chat"}async function L(e,t,i){var a,d,x;if(AI_DISABLED)throw i&&i("(请求失败)"),new Error("AI 功能已移除");const l=M();if(!LLM_CONFIG.apiKey&&!l)return alert("请先在【数据中心】设置 AI API Key");try{const c={model:LLM_CONFIG.model,messages:[{role:"system",content:LLM_CONFIG.systemPrompt},{role:"user",content:e}],stream:!0},p={"Content-Type":"application/json"};let y=`${LLM_CONFIG.baseURL}/v1/chat/completions`;l?(y=A(),c.baseURL=LLM_CONFIG.baseURL,c.apiKey=LLM_CONFIG.apiKey,c.prompt=e,c.systemPrompt=LLM_CONFIG.systemPrompt):p.Authorization=`Bearer ${LLM_CONFIG.apiKey}`;const s=await fetch(y,{method:"POST",headers:p,body:JSON.stringify(c)});if(!s.ok){let o="";try{const r=await s.json();o=(r==null?void 0:r.detail)||(r==null?void 0:r.error)||""}catch(r){o=await s.text().catch(()=>"")}throw new Error(o||`API Error: ${s.status}`)}if(String(s.headers.get("content-type")||"").toLowerCase().includes("application/json")){const o=await s.json(),r=((x=(d=(a=o==null?void 0:o.choices)==null?void 0:a[0])==null?void 0:d.message)==null?void 0:x.content)||(o==null?void 0:o.result)||(o==null?void 0:o.diagnosis)||"";t&&r&&t(r),i&&i(r);return}const h=s.body.getReader(),b=new TextDecoder("utf-8");let n="";for(;;){const{done:o,value:r}=await h.read();if(o)break;const g=b.decode(r,{stream:!0}).split(`
`);for(const w of g)if(w.startsWith("data: ")&&w!=="data: [DONE]")try{const v=JSON.parse(w.substring(6)).choices[0].delta.content||"";n+=v,t&&t(v)}catch(I){}}i&&i(n)}catch(c){console.error(c),alert("AI 请求失败: "+c.message),i&&i(" (请求失败)")}}function $(e){if(!e||!e.isConnected)return!1;const t=window.getComputedStyle(e);if(t.display==="none"||t.visibility==="hidden"||t.opacity==="0")return!1;const i=e.getBoundingClientRect();return i.width>0&&i.height>0}function E(){const e=[document.querySelector("#parent-view-container #parent-ai-comment-box"),document.querySelector("#ai-analysis #ai-hub-comment-box"),document.getElementById("parent-ai-comment-box"),document.getElementById("ai-hub-comment-box"),document.getElementById("ai-comment-box")].filter(Boolean);return e.find($)||e[0]||null}function T(){if(AI_DISABLED)return aiDisabledAlert();const e=readCurrentReportStudentSessionState();if(!e)return alert("请先查询一名学生");const t=E();if(!t)return alert("AI 评语容器未找到，请刷新页面后重试");t.innerHTML=`
            <div style="text-align:center; padding:20px;">
                <span class="loader-spinner" style="width:20px;height:20px;display:inline-block;vertical-align:middle;"></span>
                <span style="color:#4f46e5; font-weight:bold; margin-left:10px;">AI 正在根据全镇数据深度分析 ${e.name} 的学情...</span>
            </div>`;const i=buildStudentPrompt(e);let l=!0;L(i,a=>{l&&(t.innerHTML="",t.style.fontFamily='"Segoe UI", system-ui, sans-serif',t.style.whiteSpace="pre-wrap",l=!1),t.innerText+=a},a=>{const d=a.replace(/\[(.*?)\]/g,'<br><strong style="color:#b45309; background:#fff7ed; padding:2px 5px; border-radius:4px;">$1</strong>').replace(/\*\*(.*?)\*\*/g,"<b>$1</b>");t.innerHTML=d})}function N(){if(AI_DISABLED)return aiDisabledAlert();if(!Object.keys(SCHOOLS).length)return alert("无数据");const e=typeof listAvailableSchoolsForCompare=="function"?listAvailableSchoolsForCompare():Object.keys(SCHOOLS||{}),t=new Set((e||[]).map(n=>String(n||"").trim()).filter(Boolean)),i=Object.values(SCHOOLS||{}).filter(n=>!t.size||t.has(String((n==null?void 0:n.name)||"").trim()));if(!MY_SCHOOL||!SCHOOLS[MY_SCHOOL])return alert(`⚠️ 无法生成针对性报告！

请先在页面顶部的【选择本校】下拉框中选中您的学校，系统才能进行“本校 vs 他校”的深度对比分析。`);const l=document.createElement("div");l.className="modal",l.style.display="flex",l.innerHTML=`
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
        `,document.body.appendChild(l);const a=SCHOOLS[MY_SCHOOL],d=i.length,x=a.rank2Rate||"-";let c=[];SUBJECTS.forEach(n=>{var O;if(!a.metrics[n])return;const o=i.map(u=>u.metrics[n]).filter(u=>u),r=o.reduce((u,j)=>u+j.avg,0)/o.length,f=Math.max(...o.map(u=>u.avg)),g=a.metrics[n],w=g.avg-r,I=g.avg-f,v=((O=a.rankings[n])==null?void 0:O.avg)||"-";c.push({subject:n,myAvg:g.avg.toFixed(1),townAvg:r.toFixed(1),diff:w.toFixed(1),diffMax:I.toFixed(1),rank:v,excRate:(g.excRate*100).toFixed(1)+"%",passRate:(g.passRate*100).toFixed(1)+"%"})});const p=c.filter(n=>n.rank<=Math.ceil(d*.3)).map(n=>n.subject).join("、"),y=c.filter(n=>n.rank>Math.ceil(d*.6)).map(n=>n.subject).join("、"),s=`
        【基本信息】
        年级模式：${CONFIG.name} (特别注意：如果是9年级则面临中考，如果是7/8年级则处于基础阶段)
        本校：${MY_SCHOOL}
        全镇学校数：${d}
        本校综合排名：第 ${x} 名
        本校综合得分：${a.score2Rate?a.score2Rate.toFixed(2):"-"}

        【学科详细对比数据】(正数代表高于全镇均分，负数代表低于)：
        ${c.map(n=>`- ${n.subject}: 均分${n.myAvg} (与全镇差${n.diff}, 与第一名差${n.diffMax}), 排名${n.rank}, 优率${n.excRate}, 及格率${n.passRate}`).join(`
`)}
        
        【初步诊断】
        优势学科：${p||"无明显优势"}
        薄弱学科：${y||"无明显短板"}
        `,m=`
        你是一位资深教育数据分析师。请基于以下 **${MY_SCHOOL}** 的考试数据，进行深度诊断。

        【数据上下文】：
        ${s}

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
        `,h=document.getElementById("ai-report-content");h.innerHTML=`
            <div style="text-align:center; padding:50px;">
                <div class="loader-spinner" style="width:40px;height:40px;margin:0 auto 15px;display:block;"></div>
                <div style="font-size:16px; color:#4f46e5; font-weight:bold;">🤖 AI 正在进行多维度推理...</div>
                <div style="font-size:12px; color:#64748b; margin-top:5px;">正在对比全镇数据 / 计算学科差异 / 生成提分策略</div>
            </div>`;let b="";L(m,n=>{b+=n},n=>{try{const o=b.replace(/```json/g,"").replace(/```/g,"").trim(),r=JSON.parse(o);h.innerHTML=`
                    <div style="padding:10px;">
                        <!-- 头部评分 -->
                        <div style="text-align:center; margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;">
                            <h2 style="color:#1e293b; margin:0 0 10px 0; font-size:24px;">${r.summary}</h2>
                            <div style="display:inline-flex; align-items:center; background:#fefce8; border:1px solid #facc15; padding:5px 15px; border-radius:20px;">
                                <span style="color:#854d0e; font-size:12px;">AI 综合健康指数：</span>
                                <span style="font-size:28px; font-weight:800; color:#d97706; margin-left:8px;">${r.score}</span>
                            </div>
                        </div>

                        <!-- 红绿榜对比 -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                            <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:1px solid #bbf7d0;">
                                <h4 style="color:#166534; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-thumb-up" style="margin-right:5px;"></i> 亮点与优势
                                </h4>
                                <ul style="padding-left:20px; color:#14532d; font-size:14px; margin:0; line-height:1.6;">
                                    ${r.highlights.map(f=>`<li>${f}</li>`).join("")}
                                </ul>
                            </div>
                            <div style="background:#fef2f2; padding:20px; border-radius:12px; border:1px solid #fecaca;">
                                <h4 style="color:#991b1b; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-alert-triangle" style="margin-right:5px;"></i> 风险与预警
                                </h4>
                                <ul style="padding-left:20px; color:#7f1d1d; font-size:14px; margin:0; line-height:1.6;">
                                    ${r.warnings.map(f=>`<li>${f}</li>`).join("")}
                                </ul>
                            </div>
                        </div>

                        <!-- 策略清单 -->
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                            <h4 style="color:#334155; margin:0 0 15px 0; border-left:4px solid var(--primary); padding-left:10px;">
                                🚀 提质增效行动方案
                            </h4>
                            <div style="display:flex; flex-direction:column; gap:15px;">
                                ${r.strategies.map((f,g)=>`
                                    <div style="display:flex; align-items:flex-start; gap:12px;">
                                        <div style="background:#eff6ff; color:#1d4ed8; width:28px; height:28px; border-radius:6px; text-align:center; line-height:28px; font-weight:bold; flex-shrink:0;">${g+1}</div>
                                        <div>
                                            <div style="font-weight:bold; color:#1e293b; font-size:15px;">${f.title}</div>
                                            <div style="font-size:14px; color:#475569; margin-top:4px; line-height:1.5;">${f.action}</div>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>

                        <!-- 底部口号 -->
                        <div style="margin-top:30px; text-align:center;">
                            <span style="background:#f1f5f9; color:#64748b; padding:8px 20px; border-radius:50px; font-style:italic; font-size:14px;">
                                “ ${r.slogan} ”
                            </span>
                        </div>
                    </div>
                `}catch(o){console.error("AI JSON 解析失败",o),h.innerHTML=`
                    <div style="padding:20px; color:#333;">
                        <h3 style="color:#d97706;">⚠️ 解析模式降级</h3>
                        <p style="font-size:12px; color:#666;">AI 未返回标准 JSON 格式，已切换为纯文本显示。</p>
                        <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                        <pre style="white-space:pre-wrap; font-family:sans-serif; line-height:1.6;">${b}</pre>
                    </div>
                `}})}function k(){const e=document.getElementById("ai-report-content").innerText;navigator.clipboard.writeText(e).then(()=>alert("已复制到剪贴板"))}function R(){const e=document.getElementById("ai-report-content").innerText;if(!e||e.includes("正在汇总"))return(window.UI?UI.toast:alert)("请等待报告生成完毕后再导出");const{Document:t,Packer:i,Paragraph:l,TextRun:a,AlignmentType:d,HeadingLevel:x}=docx,c=e.split(`
`).filter(s=>s.trim()!==""),p=[];p.push(new l({text:`${CONFIG.name} 教学质量分析报告`,heading:x.TITLE,alignment:d.CENTER,spacing:{after:300}})),p.push(new l({children:[new a({text:`生成日期：${new Date().toLocaleDateString()}`,italics:!0,color:"666666",size:20})],alignment:d.CENTER,spacing:{after:500}})),c.forEach(s=>{const m=s.trim();/^[一二三四五六七八九十]、/.test(m)||/^\d+\./.test(m)||/^【.*】$/.test(m)?p.push(new l({children:[new a({text:m,bold:!0,size:28})],spacing:{before:400,after:200}})):p.push(new l({children:[new a({text:m,size:24})],indent:{firstLine:480},spacing:{line:360}}))}),p.push(new l({children:[new a({text:"（本报告由智能教务系统自动生成）",color:"999999",size:18})],alignment:d.CENTER,spacing:{before:800}}));const y=new t({sections:[{properties:{},children:p}]});i.toBlob(y).then(s=>{const m=`${CONFIG.name}_质量分析报告_${new Date().getTime()}.docx`;saveAs(s,m),window.UI&&UI.toast(`✅ 已导出 Word 文档：${m}`,"success")}).catch(s=>{console.error(s),alert("导出 Word 失败："+s.message)})}Object.assign(window,{saveLLMConfig:C,callLLM:L,callAIForComment:T,generateAIMacroReport:N,copyReport:k,exportToWord:R}),window.__REPORT_AI_RUNTIME_PATCHED__=!0})();
