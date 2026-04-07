(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const z=window.CompareSessionState||null,X=window.ReportSessionState||null,bt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>z&&typeof z.getCloudStudentCompareContext=="function"&&z.getCloudStudentCompareContext()||null),Tt=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>X&&typeof X.getCurrentReportStudent=="function"?X.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),ut=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>z&&typeof z.getDuplicateCompareExams=="function"?z.getDuplicateCompareExams()||[]:[]);function rt(n){return typeof getCloudCompareHint=="function"?getCloudCompareHint(n):isCloudContextMatchStudent(n)||isCloudContextLikelyCurrentTarget(n)?bt():null}function x(n,p,N="score"){if(p==null||p==="-"||p==="")return"";const f=parseFloat(n),E=parseFloat(p);if(isNaN(f)||isNaN(E))return"";const b=f-E;if(Math.abs(b)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let u="",g="",m="";N==="score"?b>0?(u="#15803d",m="#dcfce7",g="▲"):(u="#b91c1c",m="#fee2e2",g="▼"):b<0?(u="#15803d",m="#dcfce7",g="▲"):(u="#b91c1c",m="#fee2e2",g="▼");const e=Math.abs(b);return`<span style="display:inline-flex; align-items:center; background:${m}; color:${u}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${g} ${N==="score"?e.toFixed(1):e}
        </span>`}function it(n,p){var dt,lt,ct,pt,ft,gt,xt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),it(n,"PC");const b=window.innerWidth<=768;if(!(p==="A4"||p==="PC"||p==="FULL")&&b||p==="IG"){const t=at(n);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(n)},50),t}const g=RAW_DATA.length,m=new Date().toLocaleDateString(),e=getComparisonStudentView(n,RAW_DATA),y=rt(e),s=(y==null?void 0:y.previousRecord)||findPreviousRecord(e),w=typeof getStudentExamHistory=="function"?getStudentExamHistory(e):[],j=getEffectiveCurrentExamId(),D=w.filter(t=>{const l=t.examFullKey||t.examId;return!j||!isExamKeyEquivalentForCompare(l,j)&&!isExamKeyEquivalentForCompare(t.examId,j)}).slice(-1)[0]||null,q=D?D.student||D:null,o=q&&q.scores?q:s,K=((dt=o==null?void 0:o.ranks)==null?void 0:dt.total)||{},H=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",W=t=>String(t!=null?t:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),r=(t,l,c="")=>`<td data-label="${W(t)}"${c?` style="${c}"`:""}>${l}</td>`,_=t=>{var l,c,a,T,S,k;return{class:(c=(l=t==null?void 0:t.class)!=null?l:t==null?void 0:t.rankClass)!=null?c:"-",school:(T=(a=t==null?void 0:t.school)!=null?a:t==null?void 0:t.rankSchool)!=null?T:"-",township:(k=(S=t==null?void 0:t.township)!=null?S:t==null?void 0:t.rankTown)!=null?k:"-"}},A=e&&typeof e=="object"&&e.scores&&typeof e.scores=="object"?e.scores:{},G=safeGet(e,"ranks.total.township","-"),L=(ct=(lt=K.township)!=null?lt:s==null?void 0:s.townRank)!=null?ct:"-",Z=safeGet(e,"ranks.total.class","-"),i=(ft=(pt=K.class)!=null?pt:s==null?void 0:s.classRank)!=null?ft:"-",d=safeGet(e,"ranks.total.school","-"),$=(xt=(gt=K.school)!=null?gt:s==null?void 0:s.schoolRank)!=null?xt:"-",h=Object.keys(SCHOOLS).length<=1,O=h?"display:none !important;":"";let F="";if(CONFIG.name==="9年级"){let t=0,l=0;["语文","数学","英语","物理","化学"].forEach(c=>{A[c]!==void 0&&(t+=A[c],l++)}),l>0&&(F+=`<tr style="background:rgba(248,250,252,0.5);">
                    ${r("科目","🏁 核心五科","font-weight:bold; color:#475569;")}
                    ${r("成绩（对比）",t.toFixed(1),"font-weight:bold; color:#2563eb;")}
                    ${r("班级排名","-")}
                    ${r("校级排名","-")}
                    ${r("全镇排名","-",O)}
                </tr>`)}const P=getComparisonTotalSubjects(),M=getComparisonTotalValue(e,P),C=CONFIG.name==="9年级"&&P.length?"五科总分":CONFIG.label,R=o?recalcPrevTotal(o):"-",B=x(M,R,"score"),tt=x(Z,i,"rank"),et=x(d,$,"rank"),U=x(G,L,"rank");F+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${r("科目",`🏆 ${C}`,"font-weight:bold; color:#1e3a8a;")}
            ${r("成绩（对比）",`${Number.isFinite(M)?M.toFixed(2):"-"} ${B}`,"font-weight:800; font-size:16px; color:#1e40af;")}
            ${r("班级排名",`${Z} ${tt}`,"font-weight:bold; color:#334155;")}
            ${r("校级排名",`${d} ${et}`,"font-weight:bold; color:#334155;")}
            ${r("全镇排名",`${G} ${U}`,`${O} font-weight:bold; color:#334155;`)}
        </tr>`,[...new Set(SUBJECTS)].forEach(t=>{if(A[t]!==void 0){const l=o&&o.scores?H(o.scores[t]):"-",c=x(A[t],l,"score");let a=_(o&&o.ranks?o.ranks[t]:null);a.class==="-"&&a.school==="-"&&a.township==="-"&&s&&s.ranks&&s.ranks[t]&&(a=_(s.ranks[t]));const T=safeGet(e,`ranks.${t}.class`,"-"),S=x(T,a.class||"-","rank"),k=safeGet(e,`ranks.${t}.school`,"-"),nt=x(k,a.school||"-","rank"),I=safeGet(e,`ranks.${t}.township`,"-"),Q=x(I,a.township||"-","rank");F+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${r("科目",t,"font-weight:600; color:#475569;")}
                    ${r("成绩（对比）",`${A[t]} ${c}`,"font-weight:bold; color:#334155;")}
                    ${r("班级排名",`${T} <span style="font-size:0.9em;">${S}</span>`,"color:#64748b;")}
                    ${r("校级排名",`${k} <span style="font-size:0.9em;">${nt}</span>`,"color:#64748b;")}
                    ${r("全镇排名",`${I} <span style="font-size:0.9em;">${Q}</span>`,`color:#64748b; ${O}`)}
                </tr>`}});const v=`
            <style>
                .fluent-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
                .fluent-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
                .fluent-title { font-size: 15px; font-weight: 700; color: #1e293b; }
                .fluent-subtitle { font-size: 11px; color: #94a3b8; margin-left: auto; }
                .fluent-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .fluent-table th { text-align: center; padding: 10px 5px; color: #64748b; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background: rgba(248, 250, 252, 0.5); }
                .fluent-table td { text-align: center; padding: 12px 5px; border-bottom: 1px solid rgba(0,0,0,0.03); font-size: 14px; }
                .fluent-table tr:last-child td { border-bottom: none; }
                .report-insight-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; margin:16px 0 12px; }
                .report-insight-card { border-radius:18px; padding:16px 18px; border:1px solid #e2e8f0; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); box-shadow:0 10px 26px rgba(15, 23, 42, 0.04); }
                .report-insight-card.tone-score { border-color:#bfdbfe; background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); }
                .report-insight-card.tone-rank { border-color:#fde68a; background:linear-gradient(180deg, #ffffff 0%, #fffbeb 100%); }
                .report-insight-card.tone-balance { border-color:#bbf7d0; background:linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); }
                .report-insight-card.tone-trend { border-color:#fbcfe8; background:linear-gradient(180deg, #ffffff 0%, #fdf2f8 100%); }
                .report-insight-label { display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:8px; }
                .report-insight-value { display:block; font-size:20px; line-height:1.35; color:#0f172a; font-weight:800; }
                .report-insight-sub { display:block; margin-top:6px; font-size:12px; color:#64748b; line-height:1.6; }
                .report-chip-row { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 18px; }
                .report-chip { display:inline-flex; align-items:center; min-height:32px; padding:0 12px; border-radius:999px; font-size:12px; font-weight:700; }
                .report-chip-focus { background:#fff7ed; color:#c2410c; border:1px solid #fdba74; }
                .report-chip-guard { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
                .report-pill { display:inline-flex; align-items:center; min-height:26px; padding:0 10px; border-radius:999px; font-size:11px; font-weight:700; color:#475569; background:#f8fafc; border:1px solid #e2e8f0; margin-top:8px; }
                .report-pill.up { color:#166534; background:#dcfce7; border-color:#86efac; }
                .report-pill.down { color:#b91c1c; background:#fee2e2; border-color:#fca5a5; }
                .report-pill.ok, .report-pill.steady { color:#0369a1; background:#e0f2fe; border-color:#7dd3fc; }
                .report-pill.info { color:#7c2d12; background:#fff7ed; border-color:#fdba74; }
                .report-pill.warn { color:#b91c1c; background:#fff1f2; border-color:#fda4af; }
                .report-action-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin:0 0 18px; }
                .report-action-card { border-radius:18px; padding:16px 18px; border:1px solid #e2e8f0; background:#fff; min-height:140px; }
                .report-action-card.tone-warn { background:linear-gradient(180deg, #ffffff 0%, #fff7ed 100%); border-color:#fdba74; }
                .report-action-card.tone-info { background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); border-color:#bfdbfe; }
                .report-action-card.tone-ok { background:linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); border-color:#bbf7d0; }
                .report-action-card.tone-goal { background:linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%); border-color:#ddd6fe; }
                .report-action-title { font-size:14px; font-weight:800; color:#0f172a; margin-bottom:8px; }
                .report-action-text { font-size:13px; color:#475569; line-height:1.8; }
                .report-subject-board { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; margin:0 0 18px; }
                .report-subject-item { border-radius:16px; padding:14px 16px; border:1px solid #e2e8f0; background:#fff; }
                .report-subject-item.tone-strong { background:linear-gradient(180deg, #ffffff 0%, #effdf5 100%); border-color:#bbf7d0; }
                .report-subject-item.tone-weak { background:linear-gradient(180deg, #ffffff 0%, #fff7ed 100%); border-color:#fdba74; }
                .report-subject-item.tone-steady { background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); border-color:#bfdbfe; }
                .report-subject-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
                .report-subject-head strong { font-size:14px; color:#0f172a; }
                .report-subject-head span { font-size:11px; font-weight:700; color:#64748b; }
                .report-subject-meta { display:flex; gap:10px; flex-wrap:wrap; font-size:11px; color:#64748b; margin-bottom:10px; }
                .report-progress-track { height:8px; border-radius:999px; background:#e2e8f0; overflow:hidden; }
                .report-progress-bar { height:100%; border-radius:999px; }
                .report-progress-bar.tone-strong { background:linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }
                .report-progress-bar.tone-weak { background:linear-gradient(90deg, #fb923c 0%, #ea580c 100%); }
                .report-progress-bar.tone-steady { background:linear-gradient(90deg, #60a5fa 0%, #2563eb 100%); }
                .report-reality-note { margin-top:12px; border-radius:18px; border:1px dashed #cbd5e1; padding:14px 16px; background:#f8fafc; }
                .report-reality-title { font-size:12px; font-weight:800; color:#475569; margin-bottom:8px; }
                .report-metric-tipline { margin-top:8px; padding:8px 10px; border-radius:12px; background:#ffffff; color:#475569; font-size:12px; font-weight:700; border:1px solid #dbeafe; }
                .report-reality-list { margin:0; padding-left:18px; font-size:12px; color:#64748b; line-height:1.75; }
                .report-reality-list li { margin-bottom:4px; }
                .report-subject-note { margin-top:10px; font-size:11px; color:#64748b; line-height:1.65; }
                @media (max-width: 768px) { .report-insight-grid, .report-action-grid, .report-subject-board { grid-template-columns:minmax(0, 1fr); } .report-insight-card, .report-action-card, .report-subject-item { padding:14px 16px; } }
                @media print { .fluent-card { box-shadow: none; border: 1px solid #ccc; backdrop-filter: none; } }
            </style>
        `,V=buildChartNarrative(e),Y=buildStudentInsightModel(e,w),mt=renderStudentInsightOverview(Y),ht=renderStudentActionPlan(Y),vt=renderStudentSubjectBoard(Y),yt=renderStudentRealityNote(Y),wt=y?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${y.prevExamId||"上次"} → ${y.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${y.title||"云端记录"}</span>
            </div>
        </div>`:"",$t=ut().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",Ct=`
        ${v}
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${n.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${m}</p>
        </div>
        ${wt}
        ${$t}
        <div class="fluent-card" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${n.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${n.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${n.id}</div>
            </div>
        </div>
        <div class="fluent-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${mt}
            ${ht}
            ${vt}
            ${yt}
        </div>
        <div class="fluent-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>班排</th><th>校排</th><th style="${O}">全镇排名</th></tr></thead>
                <tbody>${F}</tbody>
            </table>
        </div>`,ot=w;let st="";if(ot.length>1){let t="",l=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${C}</th><th>校排</th>`;h||(l+="<th>镇排</th>");for(let c=ot.length-1;c>=0;c--){const a=ot[c],T=a.examFullKey||a.examId,S=getEffectiveCurrentExamId(),k=!!S&&(isExamKeyEquivalentForCompare(T,S)||isExamKeyEquivalentForCompare(a.examId,S)),nt=k?"background:rgba(239,246,255,0.7); font-weight:bold;":"",I=a.student||a,Q=getComparisonTotalValue(I,P),St=Number.isFinite(Q)?Q.toFixed(1):"-",kt=safeGet(I,"ranks.total.school",a.rankSchool||"-"),Rt=safeGet(I,"ranks.total.township",a.rankTown||"-");t+=`<tr style="${nt}">
                ${r("考试名称",`${k?"⭐ ":""}${a.examLabel||a.examId||a.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${r(C,St,"color:#2563eb;")}
                ${r("校级排名",kt,"color:#64748b;")}
                ${h?"":r("全镇排名",Rt,"color:#64748b;")}
            </tr>`}st=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${l}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}return`
        ${Ct}
        ${st}
        <div style="display:flex; gap:15px; margin-bottom:15px; flex-wrap:wrap; margin-top:20px;">
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-radar" style="color:#2563eb;"></i><span class="fluent-title">${CONFIG.name==="9年级"?"五科综合素质评价":"综合素质评价"} (百分位)</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="radarChart"></canvas></div>
            </div>            
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-scale" style="color:#059669;"></i><span class="fluent-title">${CONFIG.name==="9年级"?"五科学科均衡度诊断":"学科均衡度诊断"} (Z-Score)</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="varianceChart"></canvas></div>
            </div> 
        </div>
        ${V}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>`}function at(n){const p=new Date().toLocaleDateString(),N=RAW_DATA.length,f=getComparisonStudentView(n,RAW_DATA),E=getComparisonTotalSubjects(),b=getComparisonTotalValue(f,E),u=safeGet(f,"ranks.total.township","-"),g=typeof u=="number"?((1-u/N)*100).toFixed(0):"-",m=n.name.charAt(0),e=rt(f),s=Object.keys(SCHOOLS).length<=1?"全校":"全镇";let w="";g>=90?w="🌟 卓越之星":g>=75?w="🔥 进步飞速":w="📚 持续努力";let j="";E.forEach(i=>{if(f.scores[i]!==void 0){const d=f.scores[i],$=safeGet(f,`ranks.${i}.school`,"-");j+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${i}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${d}</span>
                            <!-- 修改点 2：显示文字改为 级排 -->
                            <span class="insta-comm-rank">级排#${$}</span>
                        </div>
                    </div>
                `}});const D=`
            <div style="margin-top: 20px; padding: 0 14px;">
                <!-- 雷达图容器 -->
                <div style="background: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                    <div style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 10px; border-left: 4px solid #2563eb; padding-left: 8px;">
                        📊 ${CONFIG.name==="9年级"?"五科能力雷达图":"学科能力雷达图"}
                    </div>
                    <div style="height: 250px; position: relative;">
                        <canvas id="igRadarChart"></canvas>
                    </div>
                </div>

                <!-- 均衡度容器 -->
                <div style="background: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 10px; border-left: 4px solid #059669; padding-left: 8px;">
                        ⚖️ ${CONFIG.name==="9年级"?"五科学科均衡度诊断":"学科均衡度诊断"}
                    </div>
                    <div style="height: 200px; position: relative;">
                        <canvas id="igVarianceChart"></canvas>
                    </div>
                    <div style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 5px;">
                        注：向右(绿)为优势学科，向左(红)为薄弱学科
                    </div>
                </div>
            </div>
        `,o=(()=>{let i=[],d=[],$=[],h=[];getComparisonTotalSubjects().forEach(C=>{if(n.scores[C]!==void 0){const R=RAW_DATA.map(v=>v.scores[C]).filter(v=>typeof v=="number");if(R.length<2)return;const B=R.reduce((v,V)=>v+V,0)/R.length,tt=R.reduce((v,V)=>v+Math.pow(V-B,2),0)/R.length,et=Math.sqrt(tt)||1,U=(n.scores[C]-B)/et;h.push(U);const J=`${C}`;U>=.8?i.push(J):U<=-.8?d.push(J):$.push(J)}});const F=h.length?Math.max(...h):0,P=h.length?Math.min(...h):0,M=F-P;return{strong:i,weak:d,mid:$,range:M}})(),H=(i=>i>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:i>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(o.range),W=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${H.bg}; color:${H.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${H.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${H.text}
                </div>
            </div>
        `,r=(i,d)=>!i||i.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${d}</div>`:i.map($=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${$}</span>`).join(""),_=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科 (Z≥0.8)
                        <span style="margin-left:auto; font-size:10px; color:#999;">${o.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${r(o.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${o.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科 (Z≤-0.8)
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${o.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${r(o.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,G=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const i=[];if(o.weak.length>0){const d=o.weak.join("、");i.push(`🎯 <strong>精准攻坚：</strong>针对 ${d}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(o.strong.length>0){const d=o.strong.join("、");i.push(`🛡️ <strong>保持自信：</strong>${d} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return o.strong.length===0&&o.weak.length===0&&i.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),i.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),i.map(d=>`<li style="margin-bottom:8px; line-height:1.5;">${d}</li>`).join("")})()}
                </ul>
            </div>
        `,L=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(b)?b.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(f,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${s} ${g}% 的考生</div>
                </div>
            </div>
        `,Z=e?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${e.prevExamId||"上次"} → ${e.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${e.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${m}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${n.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${n.school} · ${n.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${L}
                    ${igInsightHtml}
                    
                    <!-- Actions (点赞栏 - 旧模块) -->
                    <div class="insta-actions">
                        <div class="insta-action-left">
                            <i class="ti ti-heart insta-icon liked"></i>
                            <i class="ti ti-message-circle-2 insta-icon"></i>
                            <i class="ti ti-send insta-icon"></i>
                        </div>
                        <i class="ti ti-bookmark insta-icon"></i>
                    </div>
                    
                    <!-- Likes -->
                    <div class="insta-likes">${(Math.random()*100+50).toFixed(0)} likes</div>
                    
                    <!-- Caption (文案 - 旧模块) -->
                    <div class="insta-caption">
                        <span class="insta-caption-name">${CONFIG.name}教务处</span>
                        本次考试成绩已出炉！${w}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${n.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof W!="undefined"?W:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof _!="undefined"?_:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${Z}
                    ${D}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${j}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof G!="undefined"?G:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${p}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:x,renderSingleReportCardHTML:it,renderInstagramCard:at}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
