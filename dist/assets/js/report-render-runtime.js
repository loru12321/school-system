(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const I=window.CompareSessionState||null,nt=window.ReportSessionState||null,Ct=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>I&&typeof I.getCloudStudentCompareContext=="function"&&I.getCloudStudentCompareContext()||null),It=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>nt&&typeof nt.getCurrentReportStudent=="function"?nt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),St=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>I&&typeof I.getDuplicateCompareExams=="function"?I.getDuplicateCompareExams()||[]:[]);function ct(a){return typeof getCloudCompareHint=="function"?getCloudCompareHint(a):isCloudContextMatchStudent(a)||isCloudContextLikelyCurrentTarget(a)?Ct():null}function b(a,u,O="score"){if(u==null||u==="-"||u==="")return"";const l=parseFloat(a),G=parseFloat(u);if(isNaN(l)||isNaN(G))return"";const v=l-G;if(Math.abs(v)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let x="",w="",$="";O==="score"?v>0?(x="#15803d",$="#dcfce7",w="▲"):(x="#b91c1c",$="#fee2e2",w="▼"):v<0?(x="#15803d",$="#dcfce7",w="▲"):(x="#b91c1c",$="#fee2e2",w="▼");const o=Math.abs(v);return`<span style="display:inline-flex; align-items:center; background:${$}; color:${x}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${w} ${O==="score"?o.toFixed(1):o}
        </span>`}function pt(a,u){var xt,bt,mt,ht,yt,vt,wt,$t;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),pt(a,"PC");const v=window.innerWidth<=768;if(!(u==="A4"||u==="PC"||u==="FULL")&&v||u==="IG"){const t=ft(a);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(a)},50),t}const w=RAW_DATA.length,$=new Date().toLocaleDateString(),o=getComparisonStudentView(a,RAW_DATA),m=ct(o),c=(m==null?void 0:m.previousRecord)||findPreviousRecord(o),T=typeof getStudentExamHistory=="function"?getStudentExamHistory(o):[],J=getEffectiveCurrentExamId(),U=T.filter(t=>{const r=t.examFullKey||t.examId;return!J||!isExamKeyEquivalentForCompare(r,J)&&!isExamKeyEquivalentForCompare(t.examId,J)}).slice(-1)[0]||null,z=U?U.student||U:null,f=z&&z.scores?z:c,_=((xt=f==null?void 0:f.ranks)==null?void 0:xt.total)||{},gt=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",g=t=>String(t!=null?t:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),i=(t,r,s="")=>`<td data-label="${g(t)}"${s?` style="${s}"`:""}>${r}</td>`,D=t=>{var r,s,e,d,H,A;return{class:(s=(r=t==null?void 0:t.class)!=null?r:t==null?void 0:t.rankClass)!=null?s:"-",school:(d=(e=t==null?void 0:t.school)!=null?e:t==null?void 0:t.rankSchool)!=null?d:"-",township:(A=(H=t==null?void 0:t.township)!=null?H:t==null?void 0:t.rankTown)!=null?A:"-"}},Y=t=>{var e;const r=String((e=t==null?void 0:t.class)!=null?e:"").trim(),s=typeof normalizeClass=="function"?normalizeClass(r):r;return!s||s==="-"?!1:!/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(s)},Q=t=>{const r=String((t==null?void 0:t.school)||"").trim();if(!r||typeof getCountyDirectSchoolNames!="function"||typeof getTownshipManagedSchoolNames!="function")return!1;const s=Array.from(new Set([...Object.keys(SCHOOLS||{}),...(RAW_DATA||[]).map(d=>d==null?void 0:d.school)].map(d=>String(d||"").trim()).filter(Boolean)));return getTownshipManagedSchoolNames(s).length?getCountyDirectSchoolNames(s).some(d=>d===r||typeof areSchoolNamesEquivalent=="function"&&areSchoolNamesEquivalent(d,r)||typeof areSchoolNamesMatched=="function"&&areSchoolNamesMatched(d,r,!0)):!1},C=(t,r=!0)=>r?t==null||t===""?"-":t:"-",M=o&&typeof o=="object"&&o.scores&&typeof o.scores=="object"?o.scores:{},E=Y(o),F=!Q(o),X=C(safeGet(o,"ranks.total.township","-"),F),L=C((mt=(bt=_.township)!=null?bt:c==null?void 0:c.townRank)!=null?mt:"-",F),K=C(safeGet(o,"ranks.total.class","-"),E),n=C((yt=(ht=_.class)!=null?ht:c==null?void 0:c.classRank)!=null?yt:"-",E),p=safeGet(o,"ranks.total.school","-"),j=(wt=(vt=_.school)!=null?vt:c==null?void 0:c.schoolRank)!=null?wt:"-",h=getStudentCountyRankValue(o,"total"),tt=($t=_.county)!=null?$t:"-",S=Object.keys(SCHOOLS).length<=1,y=S?"display:none !important;":"";let P="";if(CONFIG.name==="9年级"){let t=0,r=0;["语文","数学","英语","物理","化学"].forEach(s=>{M[s]!==void 0&&(t+=M[s],r++)}),r>0&&(P+=`<tr style="background:rgba(248,250,252,0.5);">
                    ${i("科目","🏁 核心五科","font-weight:bold; color:#475569;")}
                    ${i("成绩（对比）",t.toFixed(1),"font-weight:bold; color:#2563eb;")}
                    ${i("班级排名","-")}
                    ${i("校级排名","-")}
                    ${i("全镇排名","-",y)}
                    ${i("全县排名","-",y)}
                </tr>`)}const N=getComparisonTotalSubjects(),k=getComparisonTotalValue(o,N),V=CONFIG.name==="9年级"&&N.length?"五科总分":CONFIG.label,rt=f?recalcPrevTotal(f):"-",at=b(k,rt,"score"),W=E?b(K,n,"rank"):"",B=b(p,j,"rank"),R=F?b(X,L,"rank"):"",Z=b(h,tt,"rank");P+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${i("科目",`🏆 ${V}`,"font-weight:bold; color:#1e3a8a;")}
            ${i("成绩（对比）",`${Number.isFinite(k)?k.toFixed(2):"-"} ${at}`,"font-weight:800; font-size:16px; color:#1e40af;")}
            ${i("班级排名",`${K} ${W}`,"font-weight:bold; color:#334155;")}
            ${i("校级排名",`${p} ${B}`,"font-weight:bold; color:#334155;")}
            ${i("全镇排名",`${X} ${R}`,`${y} font-weight:bold; color:#334155;`)}
            ${i("全县排名",`${h} ${Z}`,`${y} font-weight:bold; color:#334155;`)}
        </tr>`,[...new Set(SUBJECTS)].forEach(t=>{if(M[t]!==void 0){const r=f&&f.scores?gt(f.scores[t]):"-",s=b(M[t],r,"score");let e=D(f&&f.ranks?f.ranks[t]:null);e.class==="-"&&e.school==="-"&&e.township==="-"&&c&&c.ranks&&c.ranks[t]&&(e=D(c.ranks[t]));const d=C(safeGet(o,`ranks.${t}.class`,"-"),E),H=E?b(d,e.class||"-","rank"):"",A=safeGet(o,`ranks.${t}.school`,"-"),st=b(A,e.school||"-","rank"),q=C(safeGet(o,`ranks.${t}.township`,"-"),F),ot=F?b(q,e.township||"-","rank"):"",lt=getStudentCountyRankValue(o,t),dt=b(lt,e.county||"-","rank");P+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${i("科目",t,"font-weight:600; color:#475569;")}
                    ${i("成绩（对比）",`${M[t]} ${s}`,"font-weight:bold; color:#334155;")}
                    ${i("班级排名",`${d} <span style="font-size:0.9em;">${H}</span>`,"color:#64748b;")}
                    ${i("校级排名",`${A} <span style="font-size:0.9em;">${st}</span>`,"color:#64748b;")}
                    ${i("全镇排名",`${q} <span style="font-size:0.9em;">${ot}</span>`,`color:#64748b; ${y}`)}
                    ${i("全县排名",`${lt} <span style="font-size:0.9em;">${dt}</span>`,`color:#64748b; ${y}`)}
                </tr>`}});const kt=`
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
        `,Rt=buildChartNarrative(o),et=buildStudentInsightModel(o,T),Tt=renderStudentInsightOverview(et),zt=renderStudentActionPlan(et),Et=renderStudentSubjectBoard(et),jt=renderStudentRealityNote(et),Nt=m?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${m.prevExamId||"上次"} → ${m.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${m.title||"云端记录"}</span>
            </div>
        </div>`:"",Ht=St().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",At=`
        ${kt}
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${a.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${$}</p>
        </div>
        ${Nt}
        ${Ht}
        <div class="fluent-card" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${a.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${a.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${a.id}</div>
            </div>
        </div>
        <div class="fluent-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${Tt}
            ${zt}
            ${Et}
            ${jt}
        </div>
        <div class="fluent-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>班排</th><th>校排</th><th style="${y}">全镇排名</th><th style="${y}">全县排名</th></tr></thead>
                <tbody>${P}</tbody>
            </table>
        </div>`,it=T;let ut="";if(it.length>1){let t="",r=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${V}</th><th>校排</th>`;S||(r+="<th>镇排</th>");for(let s=it.length-1;s>=0;s--){const e=it[s],d=e.examFullKey||e.examId,H=getEffectiveCurrentExamId(),A=!!H&&(isExamKeyEquivalentForCompare(d,H)||isExamKeyEquivalentForCompare(e.examId,H)),st=A?"background:rgba(239,246,255,0.7); font-weight:bold;":"",q=e.student||e,ot=getComparisonTotalValue(q,N),dt=Number.isFinite(ot)?ot.toFixed(1):"-",Dt=safeGet(q,"ranks.total.school",e.rankSchool||"-"),Ft=safeGet(q,"ranks.total.township",e.rankTown||"-");t+=`<tr style="${st}">
                ${i("考试名称",`${A?"⭐ ":""}${e.examLabel||e.examId||e.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${i(V,dt,"color:#2563eb;")}
                ${i("校级排名",Dt,"color:#64748b;")}
                ${S?"":i("全镇排名",Ft,"color:#64748b;")}
            </tr>`}ut=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${r}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}return`
        ${At}
        ${ut}
        <div style="display:flex; gap:15px; margin-bottom:15px; flex-wrap:wrap; margin-top:20px;">
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-radar" style="color:#2563eb;"></i><span class="fluent-title">${CONFIG.name==="9年级"?"五科综合素质评价":"综合素质评价"} (百分位)</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="radarChart"></canvas></div>
            </div>            
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-scale" style="color:#059669;"></i><span class="fluent-title">${CONFIG.name==="9年级"?"五科学科均衡度诊断":"学科均衡度诊断"}</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="varianceChart"></canvas></div>
            </div> 
        </div>
        ${Rt}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>`}function ft(a){var L,K;const u=new Date().toLocaleDateString(),O=RAW_DATA.length,l=getComparisonStudentView(a,RAW_DATA),G=getComparisonTotalSubjects(),v=getComparisonTotalValue(l,G),x=!isCountyDirectStudent(l),w=x?safeGet(l,"ranks.total.township","-"):safeGet(l,"ranks.total.school","-"),$=(l==null?void 0:l.school)&&((K=(L=SCHOOLS==null?void 0:SCHOOLS[l.school])==null?void 0:L.students)==null?void 0:K.length)||O||1,m=typeof w=="number"?((1-w/(x?O||1:$))*100).toFixed(0):"-",c=a.name.charAt(0),T=ct(l),U=Object.keys(SCHOOLS).length<=1?"全校":x?"全镇":"本校";let z="";m>=90?z="🌟 卓越之星":m>=75?z="🔥 进步飞速":z="📚 持续努力";let f="";G.forEach(n=>{if(l.scores[n]!==void 0){const p=l.scores[n],j=safeGet(l,`ranks.${n}.school`,"-"),h=x?safeGet(l,`ranks.${n}.township`,"-"):"-",tt=getStudentCountyRankValue(l,n),S=[`级#${j}`];x&&S.push(`镇#${h}`),S.push(`县#${tt}`),f+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${n}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${p}</span>
                            <span class="insta-comm-rank">${S.join(" | ")}</span>
                        </div>
                    </div>
                `}});const _=`
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
        `,g=(()=>{let n=[],p=[],j=[],h=[];getComparisonTotalSubjects().forEach(N=>{if(a.scores[N]!==void 0){const k=RAW_DATA.map(R=>R.scores[N]).filter(R=>typeof R=="number");if(k.length<2)return;const V=k.reduce((R,Z)=>R+Z,0)/k.length,rt=k.reduce((R,Z)=>R+Math.pow(Z-V,2),0)/k.length,at=Math.sqrt(rt)||1,W=(a.scores[N]-V)/at;h.push(W);const B=`${N}`;W>=.8?n.push(B):W<=-.8?p.push(B):j.push(B)}});const S=h.length?Math.max(...h):0,y=h.length?Math.min(...h):0,P=S-y;return{strong:n,weak:p,mid:j,range:P}})(),D=(n=>n>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:n>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(g.range),Y=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${D.bg}; color:${D.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${D.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${D.text}
                </div>
            </div>
        `,Q=(n,p)=>!n||n.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${p}</div>`:n.map(j=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${j}</span>`).join(""),C=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科
                        <span style="margin-left:auto; font-size:10px; color:#999;">${g.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${Q(g.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${g.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${g.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${Q(g.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,E=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const n=[];if(g.weak.length>0){const p=g.weak.join("、");n.push(`🎯 <strong>精准攻坚：</strong>针对 ${p}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(g.strong.length>0){const p=g.strong.join("、");n.push(`🛡️ <strong>保持自信：</strong>${p} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return g.strong.length===0&&g.weak.length===0&&n.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),n.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),n.map(p=>`<li style="margin-bottom:8px; line-height:1.5;">${p}</li>`).join("")})()}
                </ul>
            </div>
        `,F=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(v)?v.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(l,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${U} ${m}% 的考生</div>
                </div>
            </div>
        `,X=T?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${T.prevExamId||"上次"} → ${T.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${T.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${c}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${a.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${a.school} · ${a.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${F}
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
                        本次考试成绩已出炉！${z}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${a.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof Y!="undefined"?Y:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof C!="undefined"?C:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${X}
                    ${_}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${f}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof E!="undefined"?E:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${u}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:b,renderSingleReportCardHTML:pt,renderInstagramCard:ft}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
