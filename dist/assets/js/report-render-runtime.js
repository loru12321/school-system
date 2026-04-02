(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const T=window.CompareSessionState||null,J=window.ReportSessionState||null,xt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>T&&typeof T.getCloudStudentCompareContext=="function"&&T.getCloudStudentCompareContext()||null),kt=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>J&&typeof J.getCurrentReportStudent=="function"?J.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),bt=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>T&&typeof T.getDuplicateCompareExams=="function"?T.getDuplicateCompareExams()||[]:[]);function et(n){return typeof getCloudCompareHint=="function"?getCloudCompareHint(n):isCloudContextMatchStudent(n)||isCloudContextLikelyCurrentTarget(n)?xt():null}function u(n,d,F="score"){if(d==null||d==="-"||d==="")return"";const p=parseFloat(n),z=parseFloat(d);if(isNaN(p)||isNaN(z))return"";const m=p-z;if(Math.abs(m)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let h="",x="",y="";F==="score"?m>0?(h="#15803d",y="#dcfce7",x="▲"):(h="#b91c1c",y="#fee2e2",x="▼"):m<0?(h="#15803d",y="#dcfce7",x="▲"):(h="#b91c1c",y="#fee2e2",x="▼");const e=Math.abs(m);return`<span style="display:inline-flex; align-items:center; background:${y}; color:${h}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${x} ${F==="score"?e.toFixed(1):e}
        </span>`}function ot(n,d){var st,dt,lt,ct,pt,ft,gt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),ot(n,"PC");const m=window.innerWidth<=768;if(!(d==="A4"||d==="PC"||d==="FULL")&&m||d==="IG"){const t=nt(n);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(n)},50),t}const x=RAW_DATA.length,y=new Date().toLocaleDateString(),e=getComparisonStudentView(n,RAW_DATA),v=et(e),a=(v==null?void 0:v.previousRecord)||findPreviousRecord(e),w=typeof getStudentExamHistory=="function"?getStudentExamHistory(e):[],E=getEffectiveCurrentExamId(),I=w.filter(t=>{const c=t.examFullKey||t.examId;return!E||!isExamKeyEquivalentForCompare(c,E)&&!isExamKeyEquivalentForCompare(t.examId,E)}).slice(-1)[0]||null,U=I?I.student||I:null,o=U&&U.scores?U:a,V=((st=o==null?void 0:o.ranks)==null?void 0:st.total)||{},j=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",N=t=>{var c,g,i,R,C,S;return{class:(g=(c=t==null?void 0:t.class)!=null?c:t==null?void 0:t.rankClass)!=null?g:"-",school:(R=(i=t==null?void 0:t.school)!=null?i:t==null?void 0:t.rankSchool)!=null?R:"-",township:(S=(C=t==null?void 0:t.township)!=null?C:t==null?void 0:t.rankTown)!=null?S:"-"}},$=e&&typeof e=="object"&&e.scores&&typeof e.scores=="object"?e.scores:{},D=safeGet(e,"ranks.total.township","-"),rt=(lt=(dt=V.township)!=null?dt:a==null?void 0:a.townRank)!=null?lt:"-",_=safeGet(e,"ranks.total.class","-"),Y=(pt=(ct=V.class)!=null?ct:a==null?void 0:a.classRank)!=null?pt:"-",K=safeGet(e,"ranks.total.school","-"),r=(gt=(ft=V.school)!=null?ft:a==null?void 0:a.schoolRank)!=null?gt:"-",s=Object.keys(SCHOOLS).length<=1,f=s?"display:none !important;":"";let b="";if(CONFIG.name==="9年级"){let t=0,c=0;["语文","数学","英语","物理","化学"].forEach(g=>{$[g]!==void 0&&(t+=$[g],c++)}),c>0&&(b+=`<tr style="background:rgba(248,250,252,0.5);">
                    <td style="font-weight:bold; color:#475569;">🏁 核心五科</td>
                    <td style="font-weight:bold; color:#2563eb;">${t.toFixed(1)}</td>
                    <td>-</td><td>-</td><td style="${f}">-</td>
                </tr>`)}const q=getComparisonTotalSubjects(),G=getComparisonTotalValue(e,q),W=CONFIG.name==="9年级"&&q.length?"五科总分":CONFIG.label,Q=o?recalcPrevTotal(o):"-",H=u(G,Q,"score"),k=u(_,Y,"rank"),Z=u(K,r,"rank"),X=u(D,rt,"rank");b+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            <td style="font-weight:bold; color:#1e3a8a;">🏆 ${W}</td>
            <td style="font-weight:800; font-size:16px; color:#1e40af;">${Number.isFinite(G)?G.toFixed(2):"-"} ${H}</td>
            <td style="font-weight:bold; color:#334155;">${_} ${k}</td>
            <td style="font-weight:bold; color:#334155;">${K} ${Z}</td>
            <td style="${f} font-weight:bold; color:#334155;">${D} ${X}</td>
        </tr>`,[...new Set(SUBJECTS)].forEach(t=>{if($[t]!==void 0){const c=o&&o.scores?j(o.scores[t]):"-",g=u($[t],c,"score");let i=N(o&&o.ranks?o.ranks[t]:null);i.class==="-"&&i.school==="-"&&i.township==="-"&&a&&a.ranks&&a.ranks[t]&&(i=N(a.ranks[t]));const R=safeGet(e,`ranks.${t}.class`,"-"),C=u(R,i.class||"-","rank"),S=safeGet(e,`ranks.${t}.school`,"-"),tt=u(S,i.school||"-","rank"),A=safeGet(e,`ranks.${t}.township`,"-"),B=u(A,i.township||"-","rank");b+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    <td style="font-weight:600; color:#475569;">${t}</td>
                    <td style="font-weight:bold; color:#334155;">${$[t]} ${g}</td>
                    <td style="color:#64748b;">${R} <span style="font-size:0.9em;">${C}</span></td>
                    <td style="color:#64748b;">${S} <span style="font-size:0.9em;">${tt}</span></td>
                    <td style="color:#64748b; ${f}">${A} <span style="font-size:0.9em;">${B}</span></td>
                </tr>`}});const O=`
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
        `,P=buildChartNarrative(e),l=buildStudentInsightModel(e,w),M=renderStudentInsightOverview(l),ut=renderStudentActionPlan(l),mt=renderStudentSubjectBoard(l),ht=renderStudentRealityNote(l),yt=v?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${v.prevExamId||"上次"} → ${v.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${v.title||"云端记录"}</span>
            </div>
        </div>`:"",vt=bt().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",wt=`
        ${O}
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${n.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${y}</p>
        </div>
        ${yt}
        ${vt}
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
            ${M}
            ${ut}
            ${mt}
            ${ht}
        </div>
        <div class="fluent-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>班排</th><th>校排</th><th style="${f}">全镇排名</th></tr></thead>
                <tbody>${b}</tbody>
            </table>
        </div>`,L=w;let at="";if(L.length>1){let t="",c=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${W}</th><th>校排</th>`;s||(c+="<th>镇排</th>");for(let g=L.length-1;g>=0;g--){const i=L[g],R=i.examFullKey||i.examId,C=getEffectiveCurrentExamId(),S=!!C&&(isExamKeyEquivalentForCompare(R,C)||isExamKeyEquivalentForCompare(i.examId,C)),tt=S?"background:rgba(239,246,255,0.7); font-weight:bold;":"",A=i.student||i,B=getComparisonTotalValue(A,q),$t=Number.isFinite(B)?B.toFixed(1):"-",Ct=safeGet(A,"ranks.total.school",i.rankSchool||"-"),St=safeGet(A,"ranks.total.township",i.rankTown||"-");t+=`<tr style="${tt}">
                <td style="text-align:left; padding-left:20px; color:#475569;">${S?"⭐ ":""}${i.examLabel||i.examId||i.examFullKey||"-"}</td>
                <td style="color:#2563eb;">${$t}</td>
                <td style="color:#64748b;">${Ct}</td>
                ${s?"":`<td style="color:#64748b;">${St}</td>`}
            </tr>`}at=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${c}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}return`
        ${wt}
        ${at}
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
        ${P}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>`}function nt(n){const d=new Date().toLocaleDateString(),F=RAW_DATA.length,p=getComparisonStudentView(n,RAW_DATA),z=getComparisonTotalSubjects(),m=getComparisonTotalValue(p,z),h=safeGet(p,"ranks.total.township","-"),x=typeof h=="number"?((1-h/F)*100).toFixed(0):"-",y=n.name.charAt(0),e=et(p),a=Object.keys(SCHOOLS).length<=1?"全校":"全镇";let w="";x>=90?w="🌟 卓越之星":x>=75?w="🔥 进步飞速":w="📚 持续努力";let E="";z.forEach(r=>{if(p.scores[r]!==void 0){const s=p.scores[r],f=safeGet(p,`ranks.${r}.school`,"-");E+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${r}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${s}</span>
                            <!-- 修改点 2：显示文字改为 级排 -->
                            <span class="insta-comm-rank">级排#${f}</span>
                        </div>
                    </div>
                `}});const I=`
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
        `,o=(()=>{let r=[],s=[],f=[],b=[];getComparisonTotalSubjects().forEach(H=>{if(n.scores[H]!==void 0){const k=RAW_DATA.map(l=>l.scores[H]).filter(l=>typeof l=="number");if(k.length<2)return;const Z=k.reduce((l,M)=>l+M,0)/k.length,X=k.reduce((l,M)=>l+Math.pow(M-Z,2),0)/k.length,it=Math.sqrt(X)||1,O=(n.scores[H]-Z)/it;b.push(O);const P=`${H}`;O>=.8?r.push(P):O<=-.8?s.push(P):f.push(P)}});const G=b.length?Math.max(...b):0,W=b.length?Math.min(...b):0,Q=G-W;return{strong:r,weak:s,mid:f,range:Q}})(),j=(r=>r>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:r>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(o.range),N=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${j.bg}; color:${j.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${j.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${j.text}
                </div>
            </div>
        `,$=(r,s)=>!r||r.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${s}</div>`:r.map(f=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${f}</span>`).join(""),D=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科 (Z≥0.8)
                        <span style="margin-left:auto; font-size:10px; color:#999;">${o.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${$(o.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${o.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科 (Z≤-0.8)
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${o.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${$(o.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,_=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const r=[];if(o.weak.length>0){const s=o.weak.join("、");r.push(`🎯 <strong>精准攻坚：</strong>针对 ${s}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(o.strong.length>0){const s=o.strong.join("、");r.push(`🛡️ <strong>保持自信：</strong>${s} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return o.strong.length===0&&o.weak.length===0&&r.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),r.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),r.map(s=>`<li style="margin-bottom:8px; line-height:1.5;">${s}</li>`).join("")})()}
                </ul>
            </div>
        `,Y=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(m)?m.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(p,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${a} ${x}% 的考生</div>
                </div>
            </div>
        `,K=e?`
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
                        <div class="insta-avatar-ring"><div class="insta-avatar">${y}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${n.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${n.school} · ${n.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${Y}
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
                    ${typeof N!="undefined"?N:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof D!="undefined"?D:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${K}
                    ${I}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${E}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof _!="undefined"?_:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${d}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:u,renderSingleReportCardHTML:ot,renderInstagramCard:nt}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
