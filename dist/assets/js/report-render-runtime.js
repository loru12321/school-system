(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const J=window.CompareSessionState||null,tt=window.ReportSessionState||null,vt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>J&&typeof J.getCloudStudentCompareContext=="function"&&J.getCloudStudentCompareContext()||null),wt=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>tt&&typeof tt.getCurrentReportStudent=="function"?tt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),St=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>J&&typeof J.getDuplicateCompareExams=="function"?J.getDuplicateCompareExams()||[]:[]);function it(t){return typeof getCloudCompareHint=="function"?getCloudCompareHint(t):isCloudContextMatchStudent(t)||isCloudContextLikelyCurrentTarget(t)?vt():null}function B(t,s,o="score"){if(s==null||s==="-"||s==="")return"";const a=parseFloat(t),i=parseFloat(s);if(isNaN(a)||isNaN(i))return"";const l=a-i;if(Math.abs(l)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let g="",d="",r="";o==="score"?l>0?(g="#15803d",r="#dcfce7",d="▲"):(g="#b91c1c",r="#fee2e2",d="▼"):l<0?(g="#15803d",r="#dcfce7",d="▲"):(g="#b91c1c",r="#fee2e2",d="▼");const n=Math.abs(l);return`<span style="display:inline-flex; align-items:center; background:${r}; color:${g}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${d} ${o==="score"?n.toFixed(1):n}
        </span>`}function et(t,s){var gt,ut,ht,mt,bt,xt,yt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),et(t,"PC");const l=window.innerWidth<=768;if(!(s==="A4"||s==="PC"||s==="FULL")&&l||s==="IG"){const h=lt(t);return setTimeout(()=>{typeof nt=="function"&&nt(t)},50),h}const d=RAW_DATA.length,r=new Date().toLocaleDateString(),n=getComparisonStudentView(t,RAW_DATA),c=it(n),e=(c==null?void 0:c.previousRecord)||findPreviousRecord(n),p=typeof getStudentExamHistory=="function"?getStudentExamHistory(n):[],m=getEffectiveCurrentExamId(),f=p.filter(h=>{const _=h.examFullKey||h.examId;return!m||!isExamKeyEquivalentForCompare(_,m)&&!isExamKeyEquivalentForCompare(h.examId,m)}).slice(-1)[0]||null,x=f?f.student||f:null,u=x&&x.scores?x:e,k=((gt=u==null?void 0:u.ranks)==null?void 0:gt.total)||{},b=h=>typeof h=="number"&&Number.isFinite(h)?h:h&&typeof h=="object"&&typeof h.score=="number"&&Number.isFinite(h.score)?h.score:"-",S=h=>{var _,F,E,K,V,Y;return{class:(F=(_=h==null?void 0:h.class)!=null?_:h==null?void 0:h.rankClass)!=null?F:"-",school:(K=(E=h==null?void 0:h.school)!=null?E:h==null?void 0:h.rankSchool)!=null?K:"-",township:(Y=(V=h==null?void 0:h.township)!=null?V:h==null?void 0:h.rankTown)!=null?Y:"-"}},v=n&&typeof n=="object"&&n.scores&&typeof n.scores=="object"?n.scores:{},T=safeGet(n,"ranks.total.township","-"),z=(ht=(ut=k.township)!=null?ut:e==null?void 0:e.townRank)!=null?ht:"-",R=safeGet(n,"ranks.total.class","-"),$=(bt=(mt=k.class)!=null?mt:e==null?void 0:e.classRank)!=null?bt:"-",M=safeGet(n,"ranks.total.school","-"),y=(yt=(xt=k.school)!=null?xt:e==null?void 0:e.schoolRank)!=null?yt:"-",C=Object.keys(SCHOOLS).length<=1,A=C?"display:none !important;":"";let j="";if(CONFIG.name==="9年级"){let h=0,_=0;["语文","数学","英语","物理","化学"].forEach(F=>{v[F]!==void 0&&(h+=v[F],_++)}),_>0&&(j+=`<tr style="background:rgba(248,250,252,0.5);">
                    <td style="font-weight:bold; color:#475569;">🏁 核心五科</td>
                    <td style="font-weight:bold; color:#2563eb;">${h.toFixed(1)}</td>
                    <td>-</td><td>-</td><td style="${A}">-</td>
                </tr>`)}const N=getComparisonTotalSubjects(),L=getComparisonTotalValue(n,N),Z=CONFIG.name==="9年级"&&N.length?"五科总分":CONFIG.label,w=u?recalcPrevTotal(u):"-",I=B(L,w,"score"),H=B(R,$,"rank"),G=B(M,y,"rank"),W=B(T,z,"rank");j+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            <td style="font-weight:bold; color:#1e3a8a;">🏆 ${Z}</td>
            <td style="font-weight:800; font-size:16px; color:#1e40af;">${Number.isFinite(L)?L.toFixed(2):"-"} ${I}</td>
            <td style="font-weight:bold; color:#334155;">${R} ${H}</td>
            <td style="font-weight:bold; color:#334155;">${M} ${G}</td>
            <td style="${A} font-weight:bold; color:#334155;">${T} ${W}</td>
        </tr>`,[...new Set(SUBJECTS)].forEach(h=>{if(v[h]!==void 0){const _=u&&u.scores?b(u.scores[h]):"-",F=B(v[h],_,"score");let E=S(u&&u.ranks?u.ranks[h]:null);E.class==="-"&&E.school==="-"&&E.township==="-"&&e&&e.ranks&&e.ranks[h]&&(E=S(e.ranks[h]));const K=safeGet(n,`ranks.${h}.class`,"-"),V=B(K,E.class||"-","rank"),Y=safeGet(n,`ranks.${h}.school`,"-"),at=B(Y,E.school||"-","rank"),X=safeGet(n,`ranks.${h}.township`,"-"),Q=B(X,E.township||"-","rank");j+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    <td style="font-weight:600; color:#475569;">${h}</td>
                    <td style="font-weight:bold; color:#334155;">${v[h]} ${F}</td>
                    <td style="color:#64748b;">${K} <span style="font-size:0.9em;">${V}</span></td>
                    <td style="color:#64748b;">${Y} <span style="font-size:0.9em;">${at}</span></td>
                    <td style="color:#64748b; ${A}">${X} <span style="font-size:0.9em;">${Q}</span></td>
                </tr>`}});const q=`
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
        `,U=dt(n),O=Et(n,p),P=pt(O),Lt=jt(O),_t=Ot(O),Ft=zt(O),Nt=c?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${c.prevExamId||"上次"} → ${c.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${c.title||"云端记录"}</span>
            </div>
        </div>`:"",Dt=St().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",Pt=`
        ${q}
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${t.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${r}</p>
        </div>
        ${Nt}
        ${Dt}
        <div class="fluent-card" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${t.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${t.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${t.id}</div>
            </div>
        </div>
        <div class="fluent-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${P}
            ${Lt}
            ${_t}
            ${Ft}
        </div>
        <div class="fluent-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>班排</th><th>校排</th><th style="${A}">全镇排名</th></tr></thead>
                <tbody>${j}</tbody>
            </table>
        </div>`,st=p;let ft="";if(st.length>1){let h="",_=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${Z}</th><th>校排</th>`;C||(_+="<th>镇排</th>");for(let F=st.length-1;F>=0;F--){const E=st[F],K=E.examFullKey||E.examId,V=getEffectiveCurrentExamId(),Y=!!V&&(isExamKeyEquivalentForCompare(K,V)||isExamKeyEquivalentForCompare(E.examId,V)),at=Y?"background:rgba(239,246,255,0.7); font-weight:bold;":"",X=E.student||E,Q=getComparisonTotalValue(X,N),Bt=Number.isFinite(Q)?Q.toFixed(1):"-",Gt=safeGet(X,"ranks.total.school",E.rankSchool||"-"),Wt=safeGet(X,"ranks.total.township",E.rankTown||"-");h+=`<tr style="${at}">
                <td style="text-align:left; padding-left:20px; color:#475569;">${Y?"⭐ ":""}${E.examLabel||E.examId||E.examFullKey||"-"}</td>
                <td style="color:#2563eb;">${Bt}</td>
                <td style="color:#64748b;">${Gt}</td>
                ${C?"":`<td style="color:#64748b;">${Wt}</td>`}
            </tr>`}ft=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${_}</tr></thead>
                <tbody>${h}</tbody>
            </table>
        </div>`}return`
        ${Pt}
        ${ft}
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
        ${U}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>`}function lt(t){const s=new Date().toLocaleDateString(),o=RAW_DATA.length,a=getComparisonStudentView(t,RAW_DATA),i=getComparisonTotalSubjects(),l=getComparisonTotalValue(a,i),g=safeGet(a,"ranks.total.township","-"),d=typeof g=="number"?((1-g/o)*100).toFixed(0):"-",r=t.name.charAt(0),n=it(a),e=Object.keys(SCHOOLS).length<=1?"全校":"全镇";let p="";d>=90?p="🌟 卓越之星":d>=75?p="🔥 进步飞速":p="📚 持续努力";let m="";i.forEach(y=>{if(a.scores[y]!==void 0){const C=a.scores[y],A=safeGet(a,`ranks.${y}.school`,"-");m+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${y}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${C}</span>
                            <!-- 修改点 2：显示文字改为 级排 -->
                            <span class="insta-comm-rank">级排#${A}</span>
                        </div>
                    </div>
                `}});const f=`
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
        `,u=(()=>{let y=[],C=[],A=[],j=[];getComparisonTotalSubjects().forEach(I=>{if(t.scores[I]!==void 0){const H=RAW_DATA.map(O=>O.scores[I]).filter(O=>typeof O=="number");if(H.length<2)return;const G=H.reduce((O,P)=>O+P,0)/H.length,W=H.reduce((O,P)=>O+Math.pow(P-G,2),0)/H.length,D=Math.sqrt(W)||1,q=(t.scores[I]-G)/D;j.push(q);const U=`${I}`;q>=.8?y.push(U):q<=-.8?C.push(U):A.push(U)}});const L=j.length?Math.max(...j):0,Z=j.length?Math.min(...j):0,w=L-Z;return{strong:y,weak:C,mid:A,range:w}})(),b=(y=>y>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:y>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(u.range),S=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${b.bg}; color:${b.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${b.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${b.text}
                </div>
            </div>
        `,v=(y,C)=>!y||y.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${C}</div>`:y.map(A=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${A}</span>`).join(""),T=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科 (Z≥0.8)
                        <span style="margin-left:auto; font-size:10px; color:#999;">${u.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${v(u.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${u.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科 (Z≤-0.8)
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${u.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${v(u.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,R=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const y=[];if(u.weak.length>0){const C=u.weak.join("、");y.push(`🎯 <strong>精准攻坚：</strong>针对 ${C}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(u.strong.length>0){const C=u.strong.join("、");y.push(`🛡️ <strong>保持自信：</strong>${C} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return u.strong.length===0&&u.weak.length===0&&y.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),y.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),y.map(C=>`<li style="margin-bottom:8px; line-height:1.5;">${C}</li>`).join("")})()}
                </ul>
            </div>
        `,$=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(l)?l.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(a,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${e} ${d}% 的考生</div>
                </div>
            </div>
        `,M=n?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${n.prevExamId||"上次"} → ${n.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${n.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${r}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${t.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${t.school} · ${t.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${$}
                    ${Ht}
                    
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
                        本次考试成绩已出炉！${p}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${t.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof S!="undefined"?S:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof T!="undefined"?T:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${M}
                    ${f}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${m}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof R!="undefined"?R:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${s}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}function nt(t){setTimeout(()=>{const s=getComparisonTotalSubjects(),o=document.getElementById("igRadarChart");if(o){window.igRadarInstance&&window.igRadarInstance.destroy();const i=[],l=[];s.forEach(g=>{if(t.scores[g]!==void 0){i.push(g);const d=RAW_DATA.map(n=>n.scores[g]).filter(n=>typeof n=="number").sort((n,c)=>c-n),r=d.indexOf(t.scores[g])+1;l.push(((1-r/d.length)*100).toFixed(1))}}),window.igRadarInstance=new Chart(o,{type:"radar",data:{labels:i,datasets:[{label:"能力值",data:l,backgroundColor:"rgba(37, 99, 235, 0.2)",borderColor:"#2563eb",pointBackgroundColor:"#2563eb",pointBorderColor:"#fff",borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,scales:{r:{min:0,max:100,ticks:{display:!1},pointLabels:{font:{size:11,weight:"bold"},color:"#333"},grid:{color:"rgba(0,0,0,0.05)"}}},plugins:{legend:{display:!1}}}})}const a=document.getElementById("igVarianceChart");if(a){window.igVarianceInstance&&window.igVarianceInstance.destroy();const i=[],l=[],g=[],d=r=>{const n=r.length;if(n===0)return{mean:0,sd:1};const c=r.reduce((p,m)=>p+m,0)/n,e=r.reduce((p,m)=>p+Math.pow(m-c,2),0)/n;return{mean:c,sd:Math.sqrt(e)}};s.forEach(r=>{if(t.scores[r]!==void 0){const n=RAW_DATA.map(p=>p.scores[r]).filter(p=>typeof p=="number"),c=d(n);let e=0;c.sd>0&&(e=(t.scores[r]-c.mean)/c.sd),i.push(r),l.push(e),g.push(e>=0?"#16a34a":"#dc2626")}}),window.igVarianceInstance=new Chart(a,{type:"bar",data:{labels:i,datasets:[{label:"标准分 (Z-Score)",data:l,backgroundColor:g,borderRadius:4}]},options:{responsive:!0,maintainAspectRatio:!1,indexAxis:"y",scales:{x:{grid:{display:!0,color:"#f1f5f9"},title:{display:!0,text:"← 弱势 | 强势 →",font:{size:10},color:"#94a3b8"}},y:{grid:{display:!1}}},plugins:{legend:{display:!1}}}})}},150)}function Ct(){const t=document.getElementById("report-card-capture-area");if(!t||t.innerHTML.trim()==="")return uiAlert("请先查询生成报告","warning");const s=document.createElement("div");s.id="temp-print-wrapper";const o=t.querySelector("canvas");let a="";if(o&&(a=`<img src="${o.toDataURL()}" style="width:100%; height:100%; object-fit:contain;">`),s.innerHTML=t.innerHTML,o){const l=s.querySelector(".chart-wrapper");l&&(l.innerHTML=a)}s.className="exam-print-page",document.body.appendChild(s);const i=document.createElement("style");i.id="temp-print-style",i.innerHTML="@media print { body > *:not(#temp-print-wrapper) { display: none !important; } #temp-print-wrapper { display: block !important; width: 100%; position: absolute; top: 0; left: 0; } .report-card-container { box-shadow: none; border: 1px solid #ccc; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }",document.head.appendChild(i),window.print(),setTimeout(()=>{document.body.removeChild(s),document.head.removeChild(i)},500)}async function $t(){const t=document.getElementById("report-card-capture-area");if(!t||t.innerHTML.trim()==="")return uiAlert("请先查询生成报告","warning");if(!window.jspdf||!window.jspdf.jsPDF)return uiAlert("PDF 库未加载，请刷新页面重试","error");if(typeof html2canvas=="undefined")return uiAlert("截图引擎未加载，请刷新页面重试","error");const{jsPDF:s}=window.jspdf,o=await html2canvas(t,{scale:2,useCORS:!0,backgroundColor:"#ffffff"}),a=o.toDataURL("image/png"),i=new s("p","mm","a4"),l=i.internal.pageSize.getWidth(),g=i.internal.pageSize.getHeight(),d=l,r=o.height*d/o.width;let n=r,c=0;for(i.addImage(a,"PNG",0,c,d,r),n-=g;n>0;)c-=g,i.addPage(),i.addImage(a,"PNG",0,c,d,r),n-=g;i.save(`成绩单_${new Date().toISOString().slice(0,10)}.pdf`)}async function kt(){const t=document.getElementById("sel-school").value,s=document.getElementById("sel-class").value;if(!t||t==="--请先选择学校--"||!s||s==="--请先选择学校--")return uiAlert("请先选择学校和班级！","warning");const o=SCHOOLS[t].students.filter(r=>r.class===s);if(o.length===0)return uiAlert("该班级没有学生数据","warning");if(o.sort((r,n)=>n.total-r.total),window.Swal){if(!(await Swal.fire({title:"确认批量打印",text:`即将生成 ${o.length} 份 A4 报告，是否继续？`,icon:"question",showCancelButton:!0,confirmButtonText:"继续",cancelButtonText:"取消"})).isConfirmed)return}else if(!confirm(`即将生成 ${o.length} 份 A4 报告。

系统将调用浏览器打印功能，请在打印预览页选择：
1. 目标打印机：另存为 PDF
2. 更多设置 -> 勾选“背景图形”

确定继续吗？`))return;const a=document.getElementById("batch-print-container");a.innerHTML="";let i="";const l=document.getElementById("report-card-capture-area");if(l&&(l.innerHTML=""),radarChartInstance){try{radarChartInstance.destroy()}catch(r){}radarChartInstance=null}const g=document.createElement("div");g.style.cssText="position:fixed; left:-9999px; top:0; width:794px; visibility:hidden;",document.body.appendChild(g);for(const r of o){g.innerHTML=et(r,"A4");const n=typeof getStudentExamHistory=="function"?getStudentExamHistory(r):[];try{typeof ot=="function"&&ot(r,n,g)}catch(e){console.warn("batch radar chart error:",e)}await new Promise(e=>setTimeout(e,200));const c=g.querySelector("canvas");if(c)try{const e=c.toDataURL("image/png"),p=document.createElement("img");p.src=e,p.style.cssText="width:100%; height:100%; object-fit:contain;",c.parentNode.replaceChild(p,c)}catch(e){console.warn("canvas capture error:",e)}i+=`<div style="page-break-after: always; padding: 20px; height: 100vh;">${g.innerHTML}</div>`}document.body.removeChild(g),a.innerHTML=i,a.style.display="block";const d=document.createElement("style");d.id="batch-print-style",d.innerHTML="@media print { body > *:not(#batch-print-container) { display: none !important; } #batch-print-container { display: block !important; } .report-card-container { box-shadow: none !important; border: 2px solid #333 !important; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }",document.head.appendChild(d),setTimeout(()=>{window.print(),setTimeout(()=>{a.style.display="none",a.innerHTML="",document.head.removeChild(d)},2e3)},500)}async function Ut(t){const s=t.files;if(!s.length)return;let o=0;for(let a=0;a<s.length;a++){const i=s[a],l=i.name.replace(".xlsx","").replace(".xls","");await new Promise(g=>{const d=new FileReader;d.onload=function(r){const n=new Uint8Array(r.target.result),c=XLSX.read(n,{type:"array"}),e=c.Sheets[c.SheetNames[0]],p=XLSX.utils.sheet_to_json(e);if(p.length>0){const m=p[0],f=Object.keys(m).find(b=>b.includes("姓名")||b.toLowerCase()==="name"),x=Object.keys(m).find(b=>b.includes("学校")||b.toLowerCase()==="school"),u=Object.keys(m).find(b=>b.includes("排名")||b.includes("名次")||b.includes("Rank")),k=Object.keys(m).find(b=>b.includes("总分")||b.includes("Total")||b==="得分");f&&(u||k)&&(!u&&k&&(p.sort((b,S)=>(S[k]||0)-(b[k]||0)),p.forEach((b,S)=>b._tempRank=S+1)),p.forEach(b=>{const S=b[f],v=x?b[x]:"默认学校",T=u?parseInt(b[u]):b._tempRank;let z="";const R=Object.keys(b).find($=>$.includes("班")||$.toLowerCase().includes("class"));if(R&&(z=normalizeClass(b[R])),S&&T){const $=v+"_"+z+"_"+S;HISTORY_ARCHIVE[$]||(HISTORY_ARCHIVE[$]=[]),HISTORY_ARCHIVE[$].find(M=>M.exam===l)||HISTORY_ARCHIVE[$].push({exam:l,rank:T})}}),o++)}g()},d.readAsArrayBuffer(i)})}Tt(),document.getElementById("history-status").innerText=`✅ 已建立 ${Object.keys(HISTORY_ARCHIVE).length} 份学生档案，包含 ${o} 次历史考试。`,t.value=""}function Tt(){ROLLER_COASTER_STUDENTS=[],Object.keys(HISTORY_ARCHIVE).forEach(t=>{const s=HISTORY_ARCHIVE[t];if(s.length<3)return;const o=s.map(d=>d.rank),a=o.length,i=o.reduce((d,r)=>d+r,0)/a,l=o.reduce((d,r)=>d+Math.pow(r-i,2),0)/a;Math.sqrt(l)>50&&ROLLER_COASTER_STUDENTS.push(t)}),console.log("检测到波动剧烈学生数:",ROLLER_COASTER_STUDENTS.length)}function Vt(){const t=document.getElementById("llm_apikey").value,s=document.getElementById("llm_baseurl").value,o=document.getElementById("llm_model").value;if(!t)return alert("API Key 不能为空");localStorage.setItem("LLM_API_KEY",t),localStorage.setItem("LLM_BASE_URL",s),localStorage.setItem("LLM_MODEL",o),LLM_CONFIG.apiKey=t,LLM_CONFIG.baseURL=s,LLM_CONFIG.model=o,alert("✅ AI 配置已保存！")}window.addEventListener("load",()=>{const t=document.getElementById("llm_apikey"),s=document.getElementById("llm_baseurl"),o=document.getElementById("llm_model");!t||!s||!o||(LLM_CONFIG.apiKey&&(t.value=LLM_CONFIG.apiKey),s.value=LLM_CONFIG.baseURL,o.value=LLM_CONFIG.model)});async function ct(t,s,o){if(AI_DISABLED)throw o&&o("(请求失败)"),new Error("AI 功能已移除");if(!LLM_CONFIG.apiKey)return alert("请先在【数据中心】设置 AI API Key");try{const a=await fetch(`${LLM_CONFIG.baseURL}/v1/chat/completions`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${LLM_CONFIG.apiKey}`},body:JSON.stringify({model:LLM_CONFIG.model,messages:[{role:"system",content:LLM_CONFIG.systemPrompt},{role:"user",content:t}],stream:!0})});if(!a.ok)throw new Error(`API Error: ${a.status}`);const i=a.body.getReader(),l=new TextDecoder("utf-8");let g="";for(;;){const{done:d,value:r}=await i.read();if(d)break;const c=l.decode(r,{stream:!0}).split(`
`);for(const e of c)if(e.startsWith("data: ")&&e!=="data: [DONE]")try{const m=JSON.parse(e.substring(6)).choices[0].delta.content||"";g+=m,s&&s(m)}catch(p){}}o&&o(g)}catch(a){console.error(a),alert("AI 请求失败: "+a.message),o&&o(" (请求失败)")}}function Yt(){if(AI_DISABLED)return aiDisabledAlert();const t=wt();if(!t)return alert("请先查询一名学生");const s=document.getElementById("ai-comment-box");s.innerHTML=`
            <div style="text-align:center; padding:20px;">
                <span class="loader-spinner" style="width:20px;height:20px;display:inline-block;vertical-align:middle;"></span>
                <span style="color:#4f46e5; font-weight:bold; margin-left:10px;">AI 正在根据全镇数据深度分析 ${t.name} 的学情...</span>
            </div>`;const o=buildStudentPrompt(t);let a=!0;ct(o,i=>{a&&(s.innerHTML="",s.style.fontFamily='"Segoe UI", system-ui, sans-serif',s.style.whiteSpace="pre-wrap",a=!1),s.innerText+=i},i=>{const l=i.replace(/\[(.*?)\]/g,'<br><strong style="color:#b45309; background:#fff7ed; padding:2px 5px; border-radius:4px;">$1</strong>').replace(/\*\*(.*?)\*\*/g,"<b>$1</b>");s.innerHTML=l})}function qt(){if(AI_DISABLED)return aiDisabledAlert();if(!Object.keys(SCHOOLS).length)return alert("无数据");if(!MY_SCHOOL||!SCHOOLS[MY_SCHOOL])return alert(`⚠️ 无法生成针对性报告！

请先在页面顶部的【选择本校】下拉框中选中您的学校，系统才能进行“本校 vs 他校”的深度对比分析。`);const t=document.createElement("div");t.className="modal",t.style.display="flex",t.innerHTML=`
            <div class="modal-content" style="width:95%; max-width:1600px; height:90vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3>🤖 AI 深度质量诊断: ${MY_SCHOOL} (对比分析版)</h3>
                    <button onclick="this.closest('.modal').remove()" style="border:none; bg:none; cursor:pointer; font-size:20px;">&times;</button>
                </div>
                <div id="ai-report-content" style="flex:1; overflow-y:auto; padding:20px; white-space:pre-wrap; line-height:1.8; font-family:serif; font-size:16px;">
                    正在调取 ${MY_SCHOOL} 与全镇其他 ${Object.keys(SCHOOLS).length-1} 所学校的对比数据...
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
        `,document.body.appendChild(t);const s=SCHOOLS[MY_SCHOOL],o=Object.keys(SCHOOLS).length,a=s.rank2Rate||"-";let i=[];SUBJECTS.forEach(e=>{var S;if(!s.metrics[e])return;const p=Object.values(SCHOOLS).map(v=>v.metrics[e]).filter(v=>v),m=p.reduce((v,T)=>v+T.avg,0)/p.length,f=Math.max(...p.map(v=>v.avg)),x=s.metrics[e],u=x.avg-m,k=x.avg-f,b=((S=s.rankings[e])==null?void 0:S.avg)||"-";i.push({subject:e,myAvg:x.avg.toFixed(1),townAvg:m.toFixed(1),diff:u.toFixed(1),diffMax:k.toFixed(1),rank:b,excRate:(x.excRate*100).toFixed(1)+"%",passRate:(x.passRate*100).toFixed(1)+"%"})});const l=i.filter(e=>e.rank<=Math.ceil(o*.3)).map(e=>e.subject).join("、"),g=i.filter(e=>e.rank>Math.ceil(o*.6)).map(e=>e.subject).join("、"),d=`
        【基本信息】
        年级模式：${CONFIG.name} (特别注意：如果是9年级则面临中考，如果是7/8年级则处于基础阶段)
        本校：${MY_SCHOOL}
        全镇学校数：${o}
        本校综合排名：第 ${a} 名
        本校综合得分：${s.score2Rate?s.score2Rate.toFixed(2):"-"}

        【学科详细对比数据】(正数代表高于全镇均分，负数代表低于)：
        ${i.map(e=>`- ${e.subject}: 均分${e.myAvg} (与全镇差${e.diff}, 与第一名差${e.diffMax}), 排名${e.rank}, 优率${e.excRate}, 及格率${e.passRate}`).join(`
`)}
        
        【初步诊断】
        优势学科：${l||"无明显优势"}
        薄弱学科：${g||"无明显短板"}
        `,r=`
        你是一位资深教育数据分析师。请基于以下 **${MY_SCHOOL}** 的考试数据，进行深度诊断。

        【数据上下文】：
        ${d}

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
        `,n=document.getElementById("ai-report-content");n.innerHTML=`
            <div style="text-align:center; padding:50px;">
                <div class="loader-spinner" style="width:40px;height:40px;margin:0 auto 15px;display:block;"></div>
                <div style="font-size:16px; color:#4f46e5; font-weight:bold;">🤖 AI 正在进行多维度推理...</div>
                <div style="font-size:12px; color:#64748b; margin-top:5px;">正在对比全镇数据 / 计算学科差异 / 生成提分策略</div>
            </div>`;let c="";ct(r,e=>{c+=e},e=>{try{const p=c.replace(/```json/g,"").replace(/```/g,"").trim(),m=JSON.parse(p);n.innerHTML=`
                    <div style="padding:10px;">
                        <!-- 头部评分 -->
                        <div style="text-align:center; margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;">
                            <h2 style="color:#1e293b; margin:0 0 10px 0; font-size:24px;">${m.summary}</h2>
                            <div style="display:inline-flex; align-items:center; background:#fefce8; border:1px solid #facc15; padding:5px 15px; border-radius:20px;">
                                <span style="color:#854d0e; font-size:12px;">AI 综合健康指数：</span>
                                <span style="font-size:28px; font-weight:800; color:#d97706; margin-left:8px;">${m.score}</span>
                            </div>
                        </div>

                        <!-- 红绿榜对比 -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                            <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:1px solid #bbf7d0;">
                                <h4 style="color:#166534; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-thumb-up" style="margin-right:5px;"></i> 亮点与优势
                                </h4>
                                <ul style="padding-left:20px; color:#14532d; font-size:14px; margin:0; line-height:1.6;">
                                    ${m.highlights.map(f=>`<li>${f}</li>`).join("")}
                                </ul>
                            </div>
                            <div style="background:#fef2f2; padding:20px; border-radius:12px; border:1px solid #fecaca;">
                                <h4 style="color:#991b1b; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-alert-triangle" style="margin-right:5px;"></i> 风险与预警
                                </h4>
                                <ul style="padding-left:20px; color:#7f1d1d; font-size:14px; margin:0; line-height:1.6;">
                                    ${m.warnings.map(f=>`<li>${f}</li>`).join("")}
                                </ul>
                            </div>
                        </div>

                        <!-- 策略清单 -->
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                            <h4 style="color:#334155; margin:0 0 15px 0; border-left:4px solid var(--primary); padding-left:10px;">
                                🚀 提质增效行动方案
                            </h4>
                            <div style="display:flex; flex-direction:column; gap:15px;">
                                ${m.strategies.map((f,x)=>`
                                    <div style="display:flex; align-items:flex-start; gap:12px;">
                                        <div style="background:#eff6ff; color:#1d4ed8; width:28px; height:28px; border-radius:6px; text-align:center; line-height:28px; font-weight:bold; flex-shrink:0;">${x+1}</div>
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
                                “ ${m.slogan} ”
                            </span>
                        </div>
                    </div>
                `}catch(p){console.error("AI JSON 解析失败",p),n.innerHTML=`
                    <div style="padding:20px; color:#333;">
                        <h3 style="color:#d97706;">⚠️ 解析模式降级</h3>
                        <p style="font-size:12px; color:#666;">AI 未返回标准 JSON 格式，已切换为纯文本显示。</p>
                        <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                        <pre style="white-space:pre-wrap; font-family:sans-serif; line-height:1.6;">${c}</pre>
                    </div>
                `}})}function Rt(){const t=document.getElementById("ai-report-content").innerText;navigator.clipboard.writeText(t).then(()=>alert("已复制到剪贴板"))}function At(){const t=document.getElementById("ai-report-content").innerText;if(!t||t.includes("正在汇总"))return(window.UI?UI.toast:alert)("请等待报告生成完毕后再导出");const{Document:s,Packer:o,Paragraph:a,TextRun:i,AlignmentType:l,HeadingLevel:g}=docx,d=t.split(`
`).filter(c=>c.trim()!==""),r=[];r.push(new a({text:`${CONFIG.name} 教学质量分析报告`,heading:g.TITLE,alignment:l.CENTER,spacing:{after:300}})),r.push(new a({children:[new i({text:`生成日期：${new Date().toLocaleDateString()}`,italics:!0,color:"666666",size:20})],alignment:l.CENTER,spacing:{after:500}})),d.forEach(c=>{const e=c.trim();/^[一二三四五六七八九十]、/.test(e)||/^\d+\./.test(e)||/^【.*】$/.test(e)?r.push(new a({children:[new i({text:e,bold:!0,size:28})],spacing:{before:400,after:200}})):r.push(new a({children:[new i({text:e,size:24})],indent:{firstLine:480},spacing:{line:360}}))}),r.push(new a({children:[new i({text:"（本报告由智能教务系统自动生成）",color:"999999",size:18})],alignment:l.CENTER,spacing:{before:800}}));const n=new s({sections:[{properties:{},children:r}]});o.toBlob(n).then(c=>{const e=`${CONFIG.name}_质量分析报告_${new Date().getTime()}.docx`;saveAs(c,e),window.UI&&UI.toast(`✅ 已导出 Word 文档：${e}`,"success")}).catch(c=>{console.error(c),alert("导出 Word 失败："+c.message)})}function Kt(t){const s=t.files[0];if(!s)return;const o=new FileReader;o.onload=function(a){TEACHER_STAMP_BASE64=a.target.result,alert("签名/章图片已导入")},o.readAsDataURL(s)}function Jt(t){const s=document.getElementById("historyChart");if(!s)return;historyChartInstance&&historyChartInstance.destroy();const o=t.school+"_"+normalizeClass(t.class||"")+"_"+t.name;let a=HISTORY_ARCHIVE[o]?JSON.parse(JSON.stringify(HISTORY_ARCHIVE[o])):[];const i=safeGet(t,"ranks.total.township",0);if(i&&a.push({exam:"本次期末",rank:i}),a.length===0)return;let l=null;if(a.length>=3){const e=a.length;let p=0,m=0,f=0,x=0;a.forEach((T,z)=>{p+=z,m+=T.rank,f+=z*T.rank,x+=z*z});const u=(e*f-p*m)/(e*x-p*p),k=(m-u*p)/e,b=Math.round(u*e+k),S=Math.max(1,b),v=u<0?"📈 持续进步":u>0?"📉 有下滑风险":"➡️ 保持稳定";l={rank:S,label:"下期预测",trendText:v}}const g=a.map(e=>e.exam),d=a.map(e=>e.rank),r=d.map(()=>"#2563eb"),n=d.map(()=>5);l&&(g.push(l.label),d.push(l.rank),r.push("#f59e0b"),n.push(6));const c=ROLLER_COASTER_STUDENTS.includes(o);historyChartInstance=new Chart(s,{type:"line",data:{labels:g,datasets:[{label:"全镇排名 (越低越好)",data:d,backgroundColor:c?"rgba(220, 38, 38, 0.1)":"rgba(37, 99, 235, 0.1)",borderWidth:2,pointBackgroundColor:"#fff",pointBorderColor:r,pointRadius:n,fill:!0,tension:.3,segment:{borderDash:e=>{if(l&&e.p1DataIndex===d.length-1)return[6,4]},borderColor:e=>l&&e.p1DataIndex===d.length-1?"#f59e0b":c?"#dc2626":"#2563eb"}}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(e){let p=e.dataset.label||"";return p&&(p+=": "),l&&e.dataIndex===d.length-1?p+e.raw+" (AI预测值)":p+e.raw}}},title:{display:!0,text:l?`历史走势 | 🤖 预测下次: 第 ${l.rank} 名 (${l.trendText})`:c?"⚠️ 排名波动剧烈，需关注":"历史排名走势",color:l&&l.trendText.includes("风险")||c?"#dc2626":"#333",font:{size:13}}},scales:{y:{reverse:!0,title:{display:!0,text:"名次"},suggestedMin:1}}}})}function ot(t,s=null){const o=getComparisonStudentView(t,RAW_DATA),a=document.getElementById("radarChart");if(!a)return;if(!window.Chart){const e=a.parentElement;e&&(e.innerHTML='<div style="text-align:center; color:#94a3b8; font-size:12px; padding:20px;">?????????????</div>');return}radarChartInstance&&radarChartInstance.destroy();const i=[],l=[];getComparisonTotalSubjects().forEach(e=>{if(o.scores[e]!==void 0){i.push(e);const p=RAW_DATA.map(x=>x.scores[e]).filter(x=>typeof x=="number").sort((x,u)=>u-x),m=p.indexOf(o.scores[e])+1,f=p.length;l.push(f>0?((1-m/f)*100).toFixed(1):null)}});const d=[{label:formatComparisonExamLabel(getEffectiveCurrentExamId(),"Current"),data:l,fill:!0,backgroundColor:"rgba(37, 99, 235, 0.2)",borderColor:"#2563eb",pointBackgroundColor:"#2563eb",pointBorderColor:"#fff",pointRadius:4,borderWidth:2,order:10}],r=getLatestHistoryExamEntry(o,s),n=r?r.student||r:null,c=Array.isArray(r==null?void 0:r.allStudents)?r.allStudents:[];if(n!=null&&n.scores){const e=i.map(p=>{if(n.scores[p]===void 0)return null;const m=c.map(x=>{var u;return(u=x==null?void 0:x.scores)==null?void 0:u[p]}).filter(x=>typeof x=="number").sort((x,u)=>u-x);if(!m.length)return null;const f=m.indexOf(n.scores[p])+1;return f>0?((1-f/m.length)*100).toFixed(1):null});e.some(p=>p!==null)&&d.push({label:formatComparisonExamLabel(r.examLabel||r.examId,"Previous"),data:e,fill:!1,borderDash:[6,4],borderColor:"#f97316",pointBackgroundColor:"#fff",pointBorderColor:"#f97316",pointRadius:4,pointStyle:"rectRot",borderWidth:1.5,order:1})}radarChartInstance=new Chart(a,{type:"radar",data:{labels:i,datasets:d},options:{responsive:!0,maintainAspectRatio:!1,scales:{r:{min:0,max:100,ticks:{display:!1},pointLabels:{font:{size:12,family:"Microsoft YaHei",weight:"bold"},color:"#475569"},grid:{color:"rgba(0,0,0,0.05)"},angleLines:{color:"rgba(0,0,0,0.05)"}}},plugins:{legend:{display:!0,position:"bottom",labels:{usePointStyle:!0,padding:15,font:{size:11}}},tooltip:{callbacks:{label:function(e){return`${e.dataset.label}: Percentile ${e.raw}%`}}}}}})}let rt=null;function It(t,s=null){const o=getComparisonStudentView(t,RAW_DATA),a=document.getElementById("varianceChart");if(!a)return;if(!window.Chart){const f=a.parentElement;f&&(f.innerHTML='<div style="text-align:center; color:#94a3b8; font-size:12px; padding:20px;">?????????????</div>');return}rt&&rt.destroy();const i=[],l=[],g=[],d=[],r=getLatestHistoryExamEntry(o,s),n=r?r.student||r:null,c=Array.isArray(r==null?void 0:r.allStudents)?r.allStudents:[],e=f=>{const x=f.length;if(x===0)return{mean:0,sd:1};const u=f.reduce((b,S)=>b+S,0)/x,k=f.reduce((b,S)=>b+Math.pow(S-u,2),0)/x;return{mean:u,sd:Math.sqrt(k)}};getComparisonTotalSubjects().forEach(f=>{if(o.scores[f]!==void 0){const x=RAW_DATA.map(S=>S.scores[f]).filter(S=>typeof S=="number"),u=e(x);let k=0;u.sd>0&&(k=(o.scores[f]-u.mean)/u.sd),i.push(f),l.push(k),k>=.8?d.push("#16a34a"):k<=-.8?d.push("#dc2626"):d.push("#3b82f6");let b=null;if(n&&n.scores&&n.scores[f]!==void 0){const S=c.map(T=>{var z;return(z=T==null?void 0:T.scores)==null?void 0:z[f]}).filter(T=>typeof T=="number"),v=e(S);v.sd>0&&(b=(n.scores[f]-v.mean)/v.sd)}g.push(b)}});const m=[{label:"Current",data:l,backgroundColor:d,borderRadius:3,barPercentage:.5,categoryPercentage:.8,order:1}];g.some(f=>f!==null)&&m.push({label:formatComparisonExamLabel((r==null?void 0:r.examLabel)||(r==null?void 0:r.examId),"Previous"),data:g,backgroundColor:"rgba(249, 115, 22, 0.4)",borderColor:"#f97316",borderWidth:1,borderRadius:3,barPercentage:.5,categoryPercentage:.8,order:2}),rt=new Chart(a,{type:"bar",data:{labels:i,datasets:m},options:{responsive:!0,maintainAspectRatio:!1,indexAxis:"y",plugins:{legend:{display:!0,position:"bottom"},tooltip:{callbacks:{label:f=>`${f.dataset.label} Z-Score: ${f.raw?f.raw.toFixed(2):"-"}`}}},scales:{x:{grid:{color:f=>f.tick.value===0?"#475569":"#f1f5f9",lineWidth:f=>f.tick.value===0?1.5:1},suggestedMin:-2.5,suggestedMax:2.5,ticks:{display:!1}},y:{grid:{display:!1}}}}})}function Et(t,s=null){const o=getComparisonStudentView(t,RAW_DATA),a=getComparisonTotalSubjects(),i=getComparisonTotalValue(o,a),l=RAW_DATA.length||1,d=Object.keys(SCHOOLS).length<=1?"全校":"全镇",r=safeGet(o,"ranks.total.township",safeGet(o,"ranks.total.school","-")),n=typeof r=="number"&&l>0?(1-r/l)*100:null,c=Array.isArray(s)?s:typeof getStudentExamHistory=="function"?getStudentExamHistory(o):[],e=getLatestHistoryExamEntry(o,c),p=e?e.student||e:null,m=p?recalcPrevTotal(p):null,f=Number.isFinite(i)&&Number.isFinite(m)?i-m:null,x=w=>{const I=w.length;if(!I)return{mean:0,sd:1};const H=w.reduce((W,D)=>W+D,0)/I,G=w.reduce((W,D)=>W+Math.pow(D-H,2),0)/I;return{mean:H,sd:Math.sqrt(G)||1}},u=[];a.forEach(w=>{var U;const I=(U=o==null?void 0:o.scores)==null?void 0:U[w];if(typeof I!="number")return;const H=RAW_DATA.map(O=>{var P;return(P=O==null?void 0:O.scores)==null?void 0:P[w]}).filter(O=>typeof O=="number").sort((O,P)=>P-O);if(!H.length)return;const G=H.indexOf(I)+1,W=G>0?(1-G/H.length)*100:null,D=x(H),q=D.sd>0?(I-D.mean)/D.sd:0;u.push({subject:w,score:I,percentile:W,zScore:q,schoolRank:safeGet(o,`ranks.${w}.school`,"-"),townshipRank:safeGet(o,`ranks.${w}.township`,"-")})});const k=u.filter(w=>w.zScore>=.8).sort((w,I)=>I.zScore-w.zScore),b=u.filter(w=>w.zScore<=-.8).sort((w,I)=>w.zScore-I.zScore),S=[...u].sort((w,I)=>w.zScore-I.zScore),v=[...u].sort((w,I)=>I.zScore-w.zScore),T=u.map(w=>w.zScore),z=T.length?Math.max(...T)-Math.min(...T):0;let R="结构均衡",$="ok";z>=2.6?(R="偏科明显",$="warn"):z>=1.4&&(R="有波动",$="info");let M="首次生成",y="neutral";typeof f=="number"&&(f>=5?(M=`较上次提升 ${f.toFixed(1)} 分`,y="up"):f>=.5?(M=`较上次小幅提升 ${f.toFixed(1)} 分`,y="up"):f<=-5?(M=`较上次回落 ${Math.abs(f).toFixed(1)} 分`,y="down"):f<=-.5?(M=`较上次略有回落 ${Math.abs(f).toFixed(1)} 分`,y="down"):(M="与上次基本持平",y="steady"));const C=Number.isFinite(i)?i+Math.max(4,Math.min(12,(b.length||1)*3)):null,A=typeof r=="number"?Math.max(1,r-Math.max(1,Math.round(r*.08))):null,j=b.slice(0,2),N=k.slice(0,2),L=[];j.length?L.push({tone:"warn",title:`优先补弱：${j.map(w=>w.subject).join("、")}`,detail:"先做基础概念回顾，再做近两次错题复盘；每天固定 15 到 20 分钟，先稳住容易失分点。"}):L.push({tone:"ok",title:"当前没有明显短板",detail:"说明整体结构比较稳，可以把更多精力放在提速、审题和规范表达上，争取把稳定优势转成总分。"}),N.length?L.push({tone:"info",title:`继续守住优势：${N.map(w=>w.subject).join("、")}`,detail:"优势科不要盲目加量，重点保持错题复盘和阶段总结，让强项持续稳定输出。"}):L.push({tone:"info",title:"建立自己的稳定科目",detail:"从最有把握的一门学科开始，先把基础题和中档题做稳，逐步形成可复制的得分来源。"}),L.push({tone:"goal",title:"下一次目标建议",detail:`${C!==null?`建议先把总分稳定到 ${C.toFixed(1)} 分左右；`:""}${A!==null?`争取 ${d}排名提升到前 ${A} 名。`:"先把当前优势延续到下一次考试。"}`});const Z=[`本次解读基于当前成绩库中的 ${l} 名同届样本和 ${Math.max(c.length,1)} 次考试记录。`,"分数、排名、百分位均按已导入的真实成绩计算，不做“估高”处理。","如果学校还没有导入最新一次考试或历史考试，趋势结论会更保守。"];return{reportStudent:o,totalScore:i,totalCount:l,scopeText:d,effectiveRank:r,percentile:n,previousTotal:m,totalDelta:f,balanceLabel:R,balanceTone:$,trendLabel:M,trendTone:y,focusSubjects:j,guardSubjects:N,actionPlans:L,realityNotes:Z,targetScore:C,targetRank:A,subjectInsights:u,strongSubjects:k,weakSubjects:b}}function jt(t){return`
        <div class="report-action-grid">
            ${t.actionPlans.map(s=>`
                <div class="report-action-card tone-${s.tone}">
                    <div class="report-action-title">${s.title}</div>
                    <div class="report-action-text">${s.detail}</div>
                </div>
            `).join("")}
        </div>
    `}function Ot(t){const s=Array.isArray(t.subjectInsights)?t.subjectInsights:[];return s.length?`
        <div class="report-subject-board">
            ${s.map(o=>{const a=o.percentile!==null?Math.max(0,Math.min(100,o.percentile)):0,i=o.zScore>=.8?"strong":o.zScore<=-.8?"weak":"steady",l=i==="strong"?"优势科":i==="weak"?"优先补弱":"保持稳定",g=Number.isFinite(o.zScore)?o.zScore.toFixed(2):"-";return`
                    <div class="report-subject-item tone-${i}">
                        <div class="report-subject-head">
                            <strong>${o.subject}</strong>
                            <span>${l}</span>
                        </div>
                        <div class="report-subject-meta">
                            <span>成绩 ${o.score}</span>
                            <span>百分位 ${o.percentile!==null?o.percentile.toFixed(0)+"%":"-"}</span>
                            <span>Z ${g}</span>
                        </div>
                        <div class="report-progress-track">
                            <div class="report-progress-bar tone-${i}" style="width:${a}%;"></div>
                        </div>
                    </div>
                `}).join("")}
        </div>
    `:""}function zt(t){return`
        <div class="report-reality-note">
            <div class="report-reality-title">真实成绩说明</div>
            <ul class="report-reality-list">
                ${t.realityNotes.map(s=>`<li>${s}</li>`).join("")}
            </ul>
        </div>
    `}function dt(t){const o=Object.keys(SCHOOLS).length<=1?"全校":"全镇",a=getComparisonStudentView(t,RAW_DATA),i=safeGet(a,"ranks.total.township",safeGet(a,"ranks.total.school","-")),l=RAW_DATA.length||1,g=typeof i=="number"?(1-i/l)*100:null,d=[],r=[],n=[],c=[],e=R=>{const $=R.length;if($===0)return{mean:0,sd:1};const M=R.reduce((C,A)=>C+A,0)/$,y=R.reduce((C,A)=>C+Math.pow(A-M,2),0)/$;return{mean:M,sd:Math.sqrt(y)}};getComparisonTotalSubjects().forEach(R=>{if(a.scores[R]===void 0)return;const $=RAW_DATA.map(j=>j.scores[R]).filter(j=>typeof j=="number").sort((j,N)=>N-j);if(!$.length)return;const y=(1-($.indexOf(a.scores[R])+1)/$.length)*100;d.push(y);const C=e($),A=C.sd>0?(a.scores[R]-C.mean)/C.sd:0;r.push(A),A>=.8&&n.push(R),A<=-.8&&c.push(R)});const m=d.length?d.reduce((R,$)=>R+$,0)/d.length:null,f=r.length?Math.max(...r):0,x=r.length?Math.min(...r):0,u=f-x,k=u>=2.5?"偏科明显":u>=1.2?"相对均衡":"结构优秀",b=n.length?`优势学科：${n.join("、")}`:"暂无明显优势学科",S=c.length?`薄弱学科：${c.join("、")}`:"暂无明显薄弱学科";let v=[];c.length&&v.push(`优先补弱科（${c.join("、")}），建议每天固定 15 分钟回归基础概念。`),n.length&&v.push(`保持优势科（${n.join("、")}），可通过错题复盘稳住高位。`),!c.length&&!n.length&&v.push("整体均衡，建议选择一门兴趣学科进行小幅突破。"),v.push("复习建议：先概念后练习，错题当天归档。");const T=g!==null?`${g.toFixed(0)}%`:"-",z=m!==null?`${m.toFixed(0)}%`:"-";return`
        <div class="fluent-card" style="margin-top:10px;">
            <div class="fluent-header"><i class="ti ti-info-circle" style="color:#6366f1;"></i><span class="fluent-title">图表解读与建议</span></div>
            <div style="font-size:13px; color:#475569; line-height:1.8;">
                <div><strong>${CONFIG.name==="9年级"?"五科综合素质评价":"综合素质评价"}（百分位）</strong>：表示学生在${o}的相对位置，数值越高越优秀。</div>
                <div>当前综合排名：${i} / ${l}，综合百分位约 <strong>${T}</strong>；单科平均百分位约 <strong>${z}</strong>。</div>
                <div style="margin-top:6px;"><strong>${CONFIG.name==="9年级"?"五科学科均衡度":"学科均衡度"}（Z-Score）</strong>：正数代表优势、负数代表薄弱，绝对值越大差异越明显。</div>
                <div>均衡度判断：<strong>${k}</strong>；${b}；${S}。</div>
                <div style="margin-top:6px;"><strong>学习建议</strong>：${v.join(" ")}</div>
            </div>
        </div>`}function Mt(t){const s=document.getElementById("strengths-container"),o=document.getElementById("weaknesses-container"),a=document.getElementById("suggestions-container");if(!s||!o||!a)return;const i=RAW_DATA.map(n=>n.total).sort((n,c)=>c-n),l=(i.indexOf(t.total)+1)/i.length,g=[],d=[];SUBJECTS.forEach(n=>{if(t.scores[n]!==void 0){const c=RAW_DATA.map(p=>p.scores[n]).filter(p=>p!==void 0).sort((p,m)=>m-p),e=(c.indexOf(t.scores[n])+1)/c.length;e<l-.2?g.push({subject:n,percentile:e,score:t.scores[n]}):e>l+.2&&d.push({subject:n,percentile:e,score:t.scores[n]})}}),s.innerHTML=g.length?g.map(n=>`<span>${n.subject} <small>(${n.score})</small></span>`).join("、"):"无明显优势学科",o.innerHTML=d.length?d.map(n=>`<span>${n.subject} <small>(${n.score})</small></span>`).join("、"):"无明显劣势学科";let r=d.length?`<p>建议重点关注：${d.map(n=>n.subject).join("、")}，制定针对性复习计划。</p>`:"<p>各科发展均衡，请继续保持当前的良好状态。</p>";a.innerHTML=r}function pt(t){const s=t.percentile!==null?`${t.percentile.toFixed(0)}%`:"-",o=Number.isFinite(t.totalScore)?t.totalScore.toFixed(1):"-",a=typeof t.effectiveRank=="number"?`${t.effectiveRank}`:"-",i=Number.isFinite(t.previousTotal)?t.previousTotal.toFixed(1):"-",l=t.trendTone==="up"?"report-pill up":t.trendTone==="down"?"report-pill down":"report-pill",g=t.balanceTone==="warn"?"report-pill warn":t.balanceTone==="info"?"report-pill info":"report-pill ok",d=t.focusSubjects.length?t.focusSubjects.map(n=>n.subject).join("、"):"暂无明显短板",r=t.guardSubjects.length?t.guardSubjects.map(n=>n.subject).join("、"):"建议先培养一门稳定优势科";return`
        <div class="report-insight-grid">
            <div class="report-insight-card tone-score">
                <span class="report-insight-label">本次总分</span>
                <strong class="report-insight-value">${o}</strong>
                <span class="report-insight-sub">上次对比：${i}</span>
            </div>
            <div class="report-insight-card tone-rank">
                <span class="report-insight-label">${t.scopeText}定位</span>
                <strong class="report-insight-value">第 ${a} 名</strong>
                <span class="report-insight-sub">综合百分位：${s}</span>
            </div>
            <div class="report-insight-card tone-balance">
                <span class="report-insight-label">结构状态</span>
                <strong class="report-insight-value">${t.balanceLabel}</strong>
                <span class="${g}">${t.balanceLabel}</span>
            </div>
            <div class="report-insight-card tone-trend">
                <span class="report-insight-label">阶段走势</span>
                <strong class="report-insight-value">${t.trendLabel}</strong>
                <span class="${l}">${t.trendLabel}</span>
            </div>
        </div>
        <div class="report-chip-row">
            <span class="report-chip report-chip-focus">当前优先调整：${d}</span>
            <span class="report-chip report-chip-guard">继续守住优势：${r}</span>
        </div>
    `}var Ht="";Object.assign(window,{getTrendBadge:B,renderSingleReportCardHTML:et,renderInstagramCard:lt,renderIGCharts:nt,copyReport:Rt,exportToWord:At,printSingleReport:Ct,downloadSingleReportPDF:$t,batchGeneratePDF:kt,renderRadarChart:ot,renderVarianceChart:It,buildChartNarrative:dt,analyzeStrengthsAndWeaknesses:Mt}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
