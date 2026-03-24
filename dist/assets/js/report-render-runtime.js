(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const J=window.CompareSessionState||null,tt=window.ReportSessionState||null,vt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>J&&typeof J.getCloudStudentCompareContext=="function"&&J.getCloudStudentCompareContext()||null),wt=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>tt&&typeof tt.getCurrentReportStudent=="function"?tt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),St=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>J&&typeof J.getDuplicateCompareExams=="function"?J.getDuplicateCompareExams()||[]:[]);function lt(t){return typeof getCloudCompareHint=="function"?getCloudCompareHint(t):isCloudContextMatchStudent(t)||isCloudContextLikelyCurrentTarget(t)?vt():null}function B(t,o,r="score"){if(o==null||o==="-"||o==="")return"";const a=parseFloat(t),i=parseFloat(o);if(isNaN(a)||isNaN(i))return"";const d=a-i;if(Math.abs(d)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let u="",l="",s="";r==="score"?d>0?(u="#15803d",s="#dcfce7",l="▲"):(u="#b91c1c",s="#fee2e2",l="▼"):d<0?(u="#15803d",s="#dcfce7",l="▲"):(u="#b91c1c",s="#fee2e2",l="▼");const n=Math.abs(d);return`<span style="display:inline-flex; align-items:center; background:${s}; color:${u}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${l} ${r==="score"?n.toFixed(1):n}
        </span>`}function et(t,o){var gt,ut,mt,ht,bt,xt,yt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),et(t,"PC");const d=window.innerWidth<=768;if(!(o==="A4"||o==="PC"||o==="FULL")&&d||o==="IG"){const h=ct(t);return setTimeout(()=>{typeof nt=="function"&&nt(t)},50),h}const l=RAW_DATA.length,s=new Date().toLocaleDateString(),n=getComparisonStudentView(t,RAW_DATA),c=lt(n),e=(c==null?void 0:c.previousRecord)||findPreviousRecord(n),f=typeof getStudentExamHistory=="function"?getStudentExamHistory(n):[],x=getEffectiveCurrentExamId(),g=f.filter(h=>{const _=h.examFullKey||h.examId;return!x||!isExamKeyEquivalentForCompare(_,x)&&!isExamKeyEquivalentForCompare(h.examId,x)}).slice(-1)[0]||null,m=g?g.student||g:null,p=m&&m.scores?m:e,T=((gt=p==null?void 0:p.ranks)==null?void 0:gt.total)||{},b=h=>typeof h=="number"&&Number.isFinite(h)?h:h&&typeof h=="object"&&typeof h.score=="number"&&Number.isFinite(h.score)?h.score:"-",y=h=>{var _,F,E,K,V,Y;return{class:(F=(_=h==null?void 0:h.class)!=null?_:h==null?void 0:h.rankClass)!=null?F:"-",school:(K=(E=h==null?void 0:h.school)!=null?E:h==null?void 0:h.rankSchool)!=null?K:"-",township:(Y=(V=h==null?void 0:h.township)!=null?V:h==null?void 0:h.rankTown)!=null?Y:"-"}},v=n&&typeof n=="object"&&n.scores&&typeof n.scores=="object"?n.scores:{},C=safeGet(n,"ranks.total.township","-"),z=(mt=(ut=T.township)!=null?ut:e==null?void 0:e.townRank)!=null?mt:"-",R=safeGet(n,"ranks.total.class","-"),k=(bt=(ht=T.class)!=null?ht:e==null?void 0:e.classRank)!=null?bt:"-",L=safeGet(n,"ranks.total.school","-"),w=(yt=(xt=T.school)!=null?xt:e==null?void 0:e.schoolRank)!=null?yt:"-",$=Object.keys(SCHOOLS).length<=1,I=$?"display:none !important;":"";let j="";if(CONFIG.name==="9年级"){let h=0,_=0;["语文","数学","英语","物理","化学"].forEach(F=>{v[F]!==void 0&&(h+=v[F],_++)}),_>0&&(j+=`<tr style="background:rgba(248,250,252,0.5);">
                    <td style="font-weight:bold; color:#475569;">🏁 核心五科</td>
                    <td style="font-weight:bold; color:#2563eb;">${h.toFixed(1)}</td>
                    <td>-</td><td>-</td><td style="${I}">-</td>
                </tr>`)}const N=getComparisonTotalSubjects(),H=getComparisonTotalValue(n,N),Z=CONFIG.name==="9年级"&&N.length?"五科总分":CONFIG.label,S=p?recalcPrevTotal(p):"-",A=B(H,S,"score"),M=B(R,k,"rank"),G=B(L,w,"rank"),W=B(C,z,"rank");j+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            <td style="font-weight:bold; color:#1e3a8a;">🏆 ${Z}</td>
            <td style="font-weight:800; font-size:16px; color:#1e40af;">${Number.isFinite(H)?H.toFixed(2):"-"} ${A}</td>
            <td style="font-weight:bold; color:#334155;">${R} ${M}</td>
            <td style="font-weight:bold; color:#334155;">${L} ${G}</td>
            <td style="${I} font-weight:bold; color:#334155;">${C} ${W}</td>
        </tr>`,[...new Set(SUBJECTS)].forEach(h=>{if(v[h]!==void 0){const _=p&&p.scores?b(p.scores[h]):"-",F=B(v[h],_,"score");let E=y(p&&p.ranks?p.ranks[h]:null);E.class==="-"&&E.school==="-"&&E.township==="-"&&e&&e.ranks&&e.ranks[h]&&(E=y(e.ranks[h]));const K=safeGet(n,`ranks.${h}.class`,"-"),V=B(K,E.class||"-","rank"),Y=safeGet(n,`ranks.${h}.school`,"-"),it=B(Y,E.school||"-","rank"),X=safeGet(n,`ranks.${h}.township`,"-"),Q=B(X,E.township||"-","rank");j+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    <td style="font-weight:600; color:#475569;">${h}</td>
                    <td style="font-weight:bold; color:#334155;">${v[h]} ${F}</td>
                    <td style="color:#64748b;">${K} <span style="font-size:0.9em;">${V}</span></td>
                    <td style="color:#64748b;">${Y} <span style="font-size:0.9em;">${it}</span></td>
                    <td style="color:#64748b; ${I}">${X} <span style="font-size:0.9em;">${Q}</span></td>
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
        `,U=dt(n),O=Ft(n,f),P=pt(O),Wt=Nt(O),Ut=Dt(O),Vt=Pt(O),Yt=c?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${c.prevExamId||"上次"} → ${c.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${c.title||"云端记录"}</span>
            </div>
        </div>`:"",qt=St().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",Kt=`
        ${q}
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${t.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${s}</p>
        </div>
        ${Yt}
        ${qt}
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
            ${Wt}
            ${Ut}
            ${Vt}
        </div>
        <div class="fluent-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>班排</th><th>校排</th><th style="${I}">全镇排名</th></tr></thead>
                <tbody>${j}</tbody>
            </table>
        </div>`,at=f;let ft="";if(at.length>1){let h="",_=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${Z}</th><th>校排</th>`;$||(_+="<th>镇排</th>");for(let F=at.length-1;F>=0;F--){const E=at[F],K=E.examFullKey||E.examId,V=getEffectiveCurrentExamId(),Y=!!V&&(isExamKeyEquivalentForCompare(K,V)||isExamKeyEquivalentForCompare(E.examId,V)),it=Y?"background:rgba(239,246,255,0.7); font-weight:bold;":"",X=E.student||E,Q=getComparisonTotalValue(X,N),Jt=Number.isFinite(Q)?Q.toFixed(1):"-",Zt=safeGet(X,"ranks.total.school",E.rankSchool||"-"),Xt=safeGet(X,"ranks.total.township",E.rankTown||"-");h+=`<tr style="${it}">
                <td style="text-align:left; padding-left:20px; color:#475569;">${Y?"⭐ ":""}${E.examLabel||E.examId||E.examFullKey||"-"}</td>
                <td style="color:#2563eb;">${Jt}</td>
                <td style="color:#64748b;">${Zt}</td>
                ${$?"":`<td style="color:#64748b;">${Xt}</td>`}
            </tr>`}ft=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${_}</tr></thead>
                <tbody>${h}</tbody>
            </table>
        </div>`}return`
        ${Kt}
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
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>`}function ct(t){const o=new Date().toLocaleDateString(),r=RAW_DATA.length,a=getComparisonStudentView(t,RAW_DATA),i=getComparisonTotalSubjects(),d=getComparisonTotalValue(a,i),u=safeGet(a,"ranks.total.township","-"),l=typeof u=="number"?((1-u/r)*100).toFixed(0):"-",s=t.name.charAt(0),n=lt(a),e=Object.keys(SCHOOLS).length<=1?"全校":"全镇";let f="";l>=90?f="🌟 卓越之星":l>=75?f="🔥 进步飞速":f="📚 持续努力";let x="";i.forEach(w=>{if(a.scores[w]!==void 0){const $=a.scores[w],I=safeGet(a,`ranks.${w}.school`,"-");x+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${w}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${$}</span>
                            <!-- 修改点 2：显示文字改为 级排 -->
                            <span class="insta-comm-rank">级排#${I}</span>
                        </div>
                    </div>
                `}});const g=`
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
        `,p=(()=>{let w=[],$=[],I=[],j=[];getComparisonTotalSubjects().forEach(A=>{if(t.scores[A]!==void 0){const M=RAW_DATA.map(O=>O.scores[A]).filter(O=>typeof O=="number");if(M.length<2)return;const G=M.reduce((O,P)=>O+P,0)/M.length,W=M.reduce((O,P)=>O+Math.pow(P-G,2),0)/M.length,D=Math.sqrt(W)||1,q=(t.scores[A]-G)/D;j.push(q);const U=`${A}`;q>=.8?w.push(U):q<=-.8?$.push(U):I.push(U)}});const H=j.length?Math.max(...j):0,Z=j.length?Math.min(...j):0,S=H-Z;return{strong:w,weak:$,mid:I,range:S}})(),b=(w=>w>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:w>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(p.range),y=`
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
        `,v=(w,$)=>!w||w.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${$}</div>`:w.map(I=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${I}</span>`).join(""),C=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科 (Z≥0.8)
                        <span style="margin-left:auto; font-size:10px; color:#999;">${p.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${v(p.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${p.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科 (Z≤-0.8)
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${p.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${v(p.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,R=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const w=[];if(p.weak.length>0){const $=p.weak.join("、");w.push(`🎯 <strong>精准攻坚：</strong>针对 ${$}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(p.strong.length>0){const $=p.strong.join("、");w.push(`🛡️ <strong>保持自信：</strong>${$} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return p.strong.length===0&&p.weak.length===0&&w.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),w.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),w.map($=>`<li style="margin-bottom:8px; line-height:1.5;">${$}</li>`).join("")})()}
                </ul>
            </div>
        `,k=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(d)?d.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(a,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${e} ${l}% 的考生</div>
                </div>
            </div>
        `,L=n?`
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
                        <div class="insta-avatar-ring"><div class="insta-avatar">${s}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${t.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${t.school} · ${t.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${k}
                    ${Gt}
                    
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
                        本次考试成绩已出炉！${f}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${t.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof y!="undefined"?y:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof C!="undefined"?C:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${L}
                    ${g}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${x}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof R!="undefined"?R:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${o}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}function nt(t){setTimeout(()=>{const o=getComparisonTotalSubjects(),r=document.getElementById("igRadarChart");if(r){window.igRadarInstance&&window.igRadarInstance.destroy();const i=[],d=[];o.forEach(u=>{if(t.scores[u]!==void 0){i.push(u);const l=RAW_DATA.map(n=>n.scores[u]).filter(n=>typeof n=="number").sort((n,c)=>c-n),s=l.indexOf(t.scores[u])+1;d.push(((1-s/l.length)*100).toFixed(1))}}),window.igRadarInstance=new Chart(r,{type:"radar",data:{labels:i,datasets:[{label:"能力值",data:d,backgroundColor:"rgba(37, 99, 235, 0.2)",borderColor:"#2563eb",pointBackgroundColor:"#2563eb",pointBorderColor:"#fff",borderWidth:2}]},options:{responsive:!0,maintainAspectRatio:!1,scales:{r:{min:0,max:100,ticks:{display:!1},pointLabels:{font:{size:11,weight:"bold"},color:"#333"},grid:{color:"rgba(0,0,0,0.05)"}}},plugins:{legend:{display:!1}}}})}const a=document.getElementById("igVarianceChart");if(a){window.igVarianceInstance&&window.igVarianceInstance.destroy();const i=[],d=[],u=[],l=s=>{const n=s.length;if(n===0)return{mean:0,sd:1};const c=s.reduce((f,x)=>f+x,0)/n,e=s.reduce((f,x)=>f+Math.pow(x-c,2),0)/n;return{mean:c,sd:Math.sqrt(e)}};o.forEach(s=>{if(t.scores[s]!==void 0){const n=RAW_DATA.map(f=>f.scores[s]).filter(f=>typeof f=="number"),c=l(n);let e=0;c.sd>0&&(e=(t.scores[s]-c.mean)/c.sd),i.push(s),d.push(e),u.push(e>=0?"#16a34a":"#dc2626")}}),window.igVarianceInstance=new Chart(a,{type:"bar",data:{labels:i,datasets:[{label:"标准分 (Z-Score)",data:d,backgroundColor:u,borderRadius:4}]},options:{responsive:!0,maintainAspectRatio:!1,indexAxis:"y",scales:{x:{grid:{display:!0,color:"#f1f5f9"},title:{display:!0,text:"← 弱势 | 强势 →",font:{size:10},color:"#94a3b8"}},y:{grid:{display:!1}}},plugins:{legend:{display:!1}}}})}},150)}function Ct(){const t=document.getElementById("report-card-capture-area");if(!t||t.innerHTML.trim()==="")return uiAlert("请先查询生成报告","warning");const o=document.createElement("div");o.id="temp-print-wrapper";const r=t.querySelector("canvas");let a="";if(r&&(a=`<img src="${r.toDataURL()}" style="width:100%; height:100%; object-fit:contain;">`),o.innerHTML=t.innerHTML,r){const d=o.querySelector(".chart-wrapper");d&&(d.innerHTML=a)}o.className="exam-print-page",document.body.appendChild(o);const i=document.createElement("style");i.id="temp-print-style",i.innerHTML="@media print { body > *:not(#temp-print-wrapper) { display: none !important; } #temp-print-wrapper { display: block !important; width: 100%; position: absolute; top: 0; left: 0; } .report-card-container { box-shadow: none; border: 1px solid #ccc; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }",document.head.appendChild(i),window.print(),setTimeout(()=>{document.body.removeChild(o),document.head.removeChild(i)},500)}async function $t(){const t=document.getElementById("report-card-capture-area");if(!t||t.innerHTML.trim()==="")return uiAlert("请先查询生成报告","warning");if(!window.jspdf||!window.jspdf.jsPDF)return uiAlert("PDF 库未加载，请刷新页面重试","error");if(typeof html2canvas=="undefined")return uiAlert("截图引擎未加载，请刷新页面重试","error");const{jsPDF:o}=window.jspdf,r=await html2canvas(t,{scale:2,useCORS:!0,backgroundColor:"#ffffff"}),a=r.toDataURL("image/png"),i=new o("p","mm","a4"),d=i.internal.pageSize.getWidth(),u=i.internal.pageSize.getHeight(),l=d,s=r.height*l/r.width;let n=s,c=0;for(i.addImage(a,"PNG",0,c,l,s),n-=u;n>0;)c-=u,i.addPage(),i.addImage(a,"PNG",0,c,l,s),n-=u;i.save(`成绩单_${new Date().toISOString().slice(0,10)}.pdf`)}async function Tt(){const t=document.getElementById("sel-school").value,o=document.getElementById("sel-class").value;if(!t||t==="--请先选择学校--"||!o||o==="--请先选择学校--")return uiAlert("请先选择学校和班级！","warning");const r=SCHOOLS[t].students.filter(s=>s.class===o);if(r.length===0)return uiAlert("该班级没有学生数据","warning");if(r.sort((s,n)=>n.total-s.total),window.Swal){if(!(await Swal.fire({title:"确认批量打印",text:`即将生成 ${r.length} 份 A4 报告，是否继续？`,icon:"question",showCancelButton:!0,confirmButtonText:"继续",cancelButtonText:"取消"})).isConfirmed)return}else if(!confirm(`即将生成 ${r.length} 份 A4 报告。

系统将调用浏览器打印功能，请在打印预览页选择：
1. 目标打印机：另存为 PDF
2. 更多设置 -> 勾选“背景图形”

确定继续吗？`))return;const a=document.getElementById("batch-print-container");a.innerHTML="";let i="";const d=document.getElementById("report-card-capture-area");if(d&&(d.innerHTML=""),radarChartInstance){try{radarChartInstance.destroy()}catch(s){}radarChartInstance=null}const u=document.createElement("div");u.style.cssText="position:fixed; left:-9999px; top:0; width:794px; visibility:hidden;",document.body.appendChild(u);for(const s of r){u.innerHTML=et(s,"A4");const n=typeof getStudentExamHistory=="function"?getStudentExamHistory(s):[];try{typeof rt=="function"&&rt(s,n,u)}catch(e){console.warn("batch radar chart error:",e)}await new Promise(e=>setTimeout(e,200));const c=u.querySelector("canvas");if(c)try{const e=c.toDataURL("image/png"),f=document.createElement("img");f.src=e,f.style.cssText="width:100%; height:100%; object-fit:contain;",c.parentNode.replaceChild(f,c)}catch(e){console.warn("canvas capture error:",e)}i+=`<div style="page-break-after: always; padding: 20px; height: 100vh;">${u.innerHTML}</div>`}document.body.removeChild(u),a.innerHTML=i,a.style.display="block";const l=document.createElement("style");l.id="batch-print-style",l.innerHTML="@media print { body > *:not(#batch-print-container) { display: none !important; } #batch-print-container { display: block !important; } .report-card-container { box-shadow: none !important; border: 2px solid #333 !important; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }",document.head.appendChild(l),setTimeout(()=>{window.print(),setTimeout(()=>{a.style.display="none",a.innerHTML="",document.head.removeChild(l)},2e3)},500)}async function Qt(t){const o=t.files;if(!o.length)return;let r=0;for(let a=0;a<o.length;a++){const i=o[a],d=i.name.replace(".xlsx","").replace(".xls","");await new Promise(u=>{const l=new FileReader;l.onload=function(s){const n=new Uint8Array(s.target.result),c=XLSX.read(n,{type:"array"}),e=c.Sheets[c.SheetNames[0]],f=XLSX.utils.sheet_to_json(e);if(f.length>0){const x=f[0],g=Object.keys(x).find(b=>b.includes("姓名")||b.toLowerCase()==="name"),m=Object.keys(x).find(b=>b.includes("学校")||b.toLowerCase()==="school"),p=Object.keys(x).find(b=>b.includes("排名")||b.includes("名次")||b.includes("Rank")),T=Object.keys(x).find(b=>b.includes("总分")||b.includes("Total")||b==="得分");g&&(p||T)&&(!p&&T&&(f.sort((b,y)=>(y[T]||0)-(b[T]||0)),f.forEach((b,y)=>b._tempRank=y+1)),f.forEach(b=>{const y=b[g],v=m?b[m]:"默认学校",C=p?parseInt(b[p]):b._tempRank;let z="";const R=Object.keys(b).find(k=>k.includes("班")||k.toLowerCase().includes("class"));if(R&&(z=normalizeClass(b[R])),y&&C){const k=v+"_"+z+"_"+y;HISTORY_ARCHIVE[k]||(HISTORY_ARCHIVE[k]=[]),HISTORY_ARCHIVE[k].find(L=>L.exam===d)||HISTORY_ARCHIVE[k].push({exam:d,rank:C})}}),r++)}u()},l.readAsArrayBuffer(i)})}kt(),document.getElementById("history-status").innerText=`✅ 已建立 ${Object.keys(HISTORY_ARCHIVE).length} 份学生档案，包含 ${r} 次历史考试。`,t.value=""}function kt(){ROLLER_COASTER_STUDENTS=[],Object.keys(HISTORY_ARCHIVE).forEach(t=>{const o=HISTORY_ARCHIVE[t];if(o.length<3)return;const r=o.map(l=>l.rank),a=r.length,i=r.reduce((l,s)=>l+s,0)/a,d=r.reduce((l,s)=>l+Math.pow(s-i,2),0)/a;Math.sqrt(d)>50&&ROLLER_COASTER_STUDENTS.push(t)}),console.log("检测到波动剧烈学生数:",ROLLER_COASTER_STUDENTS.length)}function Rt(){const t=document.getElementById("llm_apikey").value,o=document.getElementById("llm_baseurl").value,r=document.getElementById("llm_model").value;if(!t)return alert("API Key 不能为空");localStorage.setItem("LLM_API_KEY",t),localStorage.setItem("LLM_BASE_URL",o),localStorage.setItem("LLM_MODEL",r),LLM_CONFIG.apiKey=t,LLM_CONFIG.baseURL=o,LLM_CONFIG.model=r,alert("✅ AI 配置已保存！")}window.addEventListener("load",()=>{const t=document.getElementById("llm_apikey"),o=document.getElementById("llm_baseurl"),r=document.getElementById("llm_model");!t||!o||!r||(LLM_CONFIG.apiKey&&(t.value=LLM_CONFIG.apiKey),o.value=LLM_CONFIG.baseURL,r.value=LLM_CONFIG.model)});function It(t){const o=String(t||"").trim().toLowerCase();return!o||o==="localhost"||o==="127.0.0.1"||o==="[::1]"||o.endsWith(".local")}function At(){if(!window.location)return!1;const t=String(window.location.protocol||"").trim().toLowerCase();return t!=="https:"&&t!=="http:"?!1:!It(window.location.hostname)}function Et(){return!window.location||!window.location.origin?"/api/ai/chat":String(window.location.origin).replace(/\/$/,"")+"/api/ai/chat"}async function ot(t,o,r){var i,d,u;if(AI_DISABLED)throw r&&r("(请求失败)"),new Error("AI 功能已移除");const a=At();if(!LLM_CONFIG.apiKey&&!a)return alert("请先在【数据中心】设置 AI API Key");try{const l={model:LLM_CONFIG.model,messages:[{role:"system",content:LLM_CONFIG.systemPrompt},{role:"user",content:t}],stream:!0},s={"Content-Type":"application/json"};let n=`${LLM_CONFIG.baseURL}/v1/chat/completions`;a?(n=Et(),l.baseURL=LLM_CONFIG.baseURL,l.apiKey=LLM_CONFIG.apiKey,l.prompt=t,l.systemPrompt=LLM_CONFIG.systemPrompt):s.Authorization=`Bearer ${LLM_CONFIG.apiKey}`;const c=await fetch(n,{method:"POST",headers:s,body:JSON.stringify(l)});if(!c.ok){let m="";try{const p=await c.json();m=(p==null?void 0:p.detail)||(p==null?void 0:p.error)||""}catch(p){m=await c.text().catch(()=>"")}throw new Error(m||`API Error: ${c.status}`)}if(String(c.headers.get("content-type")||"").toLowerCase().includes("application/json")){const m=await c.json(),p=((u=(d=(i=m==null?void 0:m.choices)==null?void 0:i[0])==null?void 0:d.message)==null?void 0:u.content)||(m==null?void 0:m.result)||(m==null?void 0:m.diagnosis)||"";o&&p&&o(p),r&&r(p);return}const f=c.body.getReader(),x=new TextDecoder("utf-8");let g="";for(;;){const{done:m,value:p}=await f.read();if(m)break;const b=x.decode(p,{stream:!0}).split(`
`);for(const y of b)if(y.startsWith("data: ")&&y!=="data: [DONE]")try{const C=JSON.parse(y.substring(6)).choices[0].delta.content||"";g+=C,o&&o(C)}catch(v){}}r&&r(g)}catch(l){console.error(l),alert("AI 请求失败: "+l.message),r&&r(" (请求失败)")}}function jt(t){if(!t||!t.isConnected)return!1;const o=window.getComputedStyle(t);if(o.display==="none"||o.visibility==="hidden"||o.opacity==="0")return!1;const r=t.getBoundingClientRect();return r.width>0&&r.height>0}function Ot(){const t=[document.querySelector("#parent-view-container #parent-ai-comment-box"),document.querySelector("#ai-analysis #ai-hub-comment-box"),document.getElementById("parent-ai-comment-box"),document.getElementById("ai-hub-comment-box"),document.getElementById("ai-comment-box")].filter(Boolean);return t.find(jt)||t[0]||null}function zt(){if(AI_DISABLED)return aiDisabledAlert();const t=wt();if(!t)return alert("请先查询一名学生");const o=Ot();if(!o)return alert("AI 评语容器未找到，请刷新页面后重试");o.innerHTML=`
            <div style="text-align:center; padding:20px;">
                <span class="loader-spinner" style="width:20px;height:20px;display:inline-block;vertical-align:middle;"></span>
                <span style="color:#4f46e5; font-weight:bold; margin-left:10px;">AI 正在根据全镇数据深度分析 ${t.name} 的学情...</span>
            </div>`;const r=buildStudentPrompt(t);let a=!0;ot(r,i=>{a&&(o.innerHTML="",o.style.fontFamily='"Segoe UI", system-ui, sans-serif',o.style.whiteSpace="pre-wrap",a=!1),o.innerText+=i},i=>{const d=i.replace(/\[(.*?)\]/g,'<br><strong style="color:#b45309; background:#fff7ed; padding:2px 5px; border-radius:4px;">$1</strong>').replace(/\*\*(.*?)\*\*/g,"<b>$1</b>");o.innerHTML=d})}function Lt(){if(AI_DISABLED)return aiDisabledAlert();if(!Object.keys(SCHOOLS).length)return alert("无数据");if(!MY_SCHOOL||!SCHOOLS[MY_SCHOOL])return alert(`⚠️ 无法生成针对性报告！

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
        `,document.body.appendChild(t);const o=SCHOOLS[MY_SCHOOL],r=Object.keys(SCHOOLS).length,a=o.rank2Rate||"-";let i=[];SUBJECTS.forEach(e=>{var y;if(!o.metrics[e])return;const f=Object.values(SCHOOLS).map(v=>v.metrics[e]).filter(v=>v),x=f.reduce((v,C)=>v+C.avg,0)/f.length,g=Math.max(...f.map(v=>v.avg)),m=o.metrics[e],p=m.avg-x,T=m.avg-g,b=((y=o.rankings[e])==null?void 0:y.avg)||"-";i.push({subject:e,myAvg:m.avg.toFixed(1),townAvg:x.toFixed(1),diff:p.toFixed(1),diffMax:T.toFixed(1),rank:b,excRate:(m.excRate*100).toFixed(1)+"%",passRate:(m.passRate*100).toFixed(1)+"%"})});const d=i.filter(e=>e.rank<=Math.ceil(r*.3)).map(e=>e.subject).join("、"),u=i.filter(e=>e.rank>Math.ceil(r*.6)).map(e=>e.subject).join("、"),l=`
        【基本信息】
        年级模式：${CONFIG.name} (特别注意：如果是9年级则面临中考，如果是7/8年级则处于基础阶段)
        本校：${MY_SCHOOL}
        全镇学校数：${r}
        本校综合排名：第 ${a} 名
        本校综合得分：${o.score2Rate?o.score2Rate.toFixed(2):"-"}

        【学科详细对比数据】(正数代表高于全镇均分，负数代表低于)：
        ${i.map(e=>`- ${e.subject}: 均分${e.myAvg} (与全镇差${e.diff}, 与第一名差${e.diffMax}), 排名${e.rank}, 优率${e.excRate}, 及格率${e.passRate}`).join(`
`)}
        
        【初步诊断】
        优势学科：${d||"无明显优势"}
        薄弱学科：${u||"无明显短板"}
        `,s=`
        你是一位资深教育数据分析师。请基于以下 **${MY_SCHOOL}** 的考试数据，进行深度诊断。

        【数据上下文】：
        ${l}

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
            </div>`;let c="";ot(s,e=>{c+=e},e=>{try{const f=c.replace(/```json/g,"").replace(/```/g,"").trim(),x=JSON.parse(f);n.innerHTML=`
                    <div style="padding:10px;">
                        <!-- 头部评分 -->
                        <div style="text-align:center; margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;">
                            <h2 style="color:#1e293b; margin:0 0 10px 0; font-size:24px;">${x.summary}</h2>
                            <div style="display:inline-flex; align-items:center; background:#fefce8; border:1px solid #facc15; padding:5px 15px; border-radius:20px;">
                                <span style="color:#854d0e; font-size:12px;">AI 综合健康指数：</span>
                                <span style="font-size:28px; font-weight:800; color:#d97706; margin-left:8px;">${x.score}</span>
                            </div>
                        </div>

                        <!-- 红绿榜对比 -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                            <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:1px solid #bbf7d0;">
                                <h4 style="color:#166534; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-thumb-up" style="margin-right:5px;"></i> 亮点与优势
                                </h4>
                                <ul style="padding-left:20px; color:#14532d; font-size:14px; margin:0; line-height:1.6;">
                                    ${x.highlights.map(g=>`<li>${g}</li>`).join("")}
                                </ul>
                            </div>
                            <div style="background:#fef2f2; padding:20px; border-radius:12px; border:1px solid #fecaca;">
                                <h4 style="color:#991b1b; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-alert-triangle" style="margin-right:5px;"></i> 风险与预警
                                </h4>
                                <ul style="padding-left:20px; color:#7f1d1d; font-size:14px; margin:0; line-height:1.6;">
                                    ${x.warnings.map(g=>`<li>${g}</li>`).join("")}
                                </ul>
                            </div>
                        </div>

                        <!-- 策略清单 -->
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                            <h4 style="color:#334155; margin:0 0 15px 0; border-left:4px solid var(--primary); padding-left:10px;">
                                🚀 提质增效行动方案
                            </h4>
                            <div style="display:flex; flex-direction:column; gap:15px;">
                                ${x.strategies.map((g,m)=>`
                                    <div style="display:flex; align-items:flex-start; gap:12px;">
                                        <div style="background:#eff6ff; color:#1d4ed8; width:28px; height:28px; border-radius:6px; text-align:center; line-height:28px; font-weight:bold; flex-shrink:0;">${m+1}</div>
                                        <div>
                                            <div style="font-weight:bold; color:#1e293b; font-size:15px;">${g.title}</div>
                                            <div style="font-size:14px; color:#475569; margin-top:4px; line-height:1.5;">${g.action}</div>
                                        </div>
                                    </div>
                                `).join("")}
                            </div>
                        </div>

                        <!-- 底部口号 -->
                        <div style="margin-top:30px; text-align:center;">
                            <span style="background:#f1f5f9; color:#64748b; padding:8px 20px; border-radius:50px; font-style:italic; font-size:14px;">
                                “ ${x.slogan} ”
                            </span>
                        </div>
                    </div>
                `}catch(f){console.error("AI JSON 解析失败",f),n.innerHTML=`
                    <div style="padding:20px; color:#333;">
                        <h3 style="color:#d97706;">⚠️ 解析模式降级</h3>
                        <p style="font-size:12px; color:#666;">AI 未返回标准 JSON 格式，已切换为纯文本显示。</p>
                        <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                        <pre style="white-space:pre-wrap; font-family:sans-serif; line-height:1.6;">${c}</pre>
                    </div>
                `}})}function Mt(){const t=document.getElementById("ai-report-content").innerText;navigator.clipboard.writeText(t).then(()=>alert("已复制到剪贴板"))}function Ht(){const t=document.getElementById("ai-report-content").innerText;if(!t||t.includes("正在汇总"))return(window.UI?UI.toast:alert)("请等待报告生成完毕后再导出");const{Document:o,Packer:r,Paragraph:a,TextRun:i,AlignmentType:d,HeadingLevel:u}=docx,l=t.split(`
`).filter(c=>c.trim()!==""),s=[];s.push(new a({text:`${CONFIG.name} 教学质量分析报告`,heading:u.TITLE,alignment:d.CENTER,spacing:{after:300}})),s.push(new a({children:[new i({text:`生成日期：${new Date().toLocaleDateString()}`,italics:!0,color:"666666",size:20})],alignment:d.CENTER,spacing:{after:500}})),l.forEach(c=>{const e=c.trim();/^[一二三四五六七八九十]、/.test(e)||/^\d+\./.test(e)||/^【.*】$/.test(e)?s.push(new a({children:[new i({text:e,bold:!0,size:28})],spacing:{before:400,after:200}})):s.push(new a({children:[new i({text:e,size:24})],indent:{firstLine:480},spacing:{line:360}}))}),s.push(new a({children:[new i({text:"（本报告由智能教务系统自动生成）",color:"999999",size:18})],alignment:d.CENTER,spacing:{before:800}}));const n=new o({sections:[{properties:{},children:s}]});r.toBlob(n).then(c=>{const e=`${CONFIG.name}_质量分析报告_${new Date().getTime()}.docx`;saveAs(c,e),window.UI&&UI.toast(`✅ 已导出 Word 文档：${e}`,"success")}).catch(c=>{console.error(c),alert("导出 Word 失败："+c.message)})}function te(t){const o=t.files[0];if(!o)return;const r=new FileReader;r.onload=function(a){TEACHER_STAMP_BASE64=a.target.result,alert("签名/章图片已导入")},r.readAsDataURL(o)}function ee(t){const o=document.getElementById("historyChart");if(!o)return;historyChartInstance&&historyChartInstance.destroy();const r=t.school+"_"+normalizeClass(t.class||"")+"_"+t.name;let a=HISTORY_ARCHIVE[r]?JSON.parse(JSON.stringify(HISTORY_ARCHIVE[r])):[];const i=safeGet(t,"ranks.total.township",0);if(i&&a.push({exam:"本次期末",rank:i}),a.length===0)return;let d=null;if(a.length>=3){const e=a.length;let f=0,x=0,g=0,m=0;a.forEach((C,z)=>{f+=z,x+=C.rank,g+=z*C.rank,m+=z*z});const p=(e*g-f*x)/(e*m-f*f),T=(x-p*f)/e,b=Math.round(p*e+T),y=Math.max(1,b),v=p<0?"📈 持续进步":p>0?"📉 有下滑风险":"➡️ 保持稳定";d={rank:y,label:"下期预测",trendText:v}}const u=a.map(e=>e.exam),l=a.map(e=>e.rank),s=l.map(()=>"#2563eb"),n=l.map(()=>5);d&&(u.push(d.label),l.push(d.rank),s.push("#f59e0b"),n.push(6));const c=ROLLER_COASTER_STUDENTS.includes(r);historyChartInstance=new Chart(o,{type:"line",data:{labels:u,datasets:[{label:"全镇排名 (越低越好)",data:l,backgroundColor:c?"rgba(220, 38, 38, 0.1)":"rgba(37, 99, 235, 0.1)",borderWidth:2,pointBackgroundColor:"#fff",pointBorderColor:s,pointRadius:n,fill:!0,tension:.3,segment:{borderDash:e=>{if(d&&e.p1DataIndex===l.length-1)return[6,4]},borderColor:e=>d&&e.p1DataIndex===l.length-1?"#f59e0b":c?"#dc2626":"#2563eb"}}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1},tooltip:{callbacks:{label:function(e){let f=e.dataset.label||"";return f&&(f+=": "),d&&e.dataIndex===l.length-1?f+e.raw+" (AI预测值)":f+e.raw}}},title:{display:!0,text:d?`历史走势 | 🤖 预测下次: 第 ${d.rank} 名 (${d.trendText})`:c?"⚠️ 排名波动剧烈，需关注":"历史排名走势",color:d&&d.trendText.includes("风险")||c?"#dc2626":"#333",font:{size:13}}},scales:{y:{reverse:!0,title:{display:!0,text:"名次"},suggestedMin:1}}}})}function rt(t,o=null){const r=getComparisonStudentView(t,RAW_DATA),a=document.getElementById("radarChart");if(!a)return;if(!window.Chart){const e=a.parentElement;e&&(e.innerHTML='<div style="text-align:center; color:#94a3b8; font-size:12px; padding:20px;">?????????????</div>');return}radarChartInstance&&radarChartInstance.destroy();const i=[],d=[];getComparisonTotalSubjects().forEach(e=>{if(r.scores[e]!==void 0){i.push(e);const f=RAW_DATA.map(m=>m.scores[e]).filter(m=>typeof m=="number").sort((m,p)=>p-m),x=f.indexOf(r.scores[e])+1,g=f.length;d.push(g>0?((1-x/g)*100).toFixed(1):null)}});const l=[{label:formatComparisonExamLabel(getEffectiveCurrentExamId(),"Current"),data:d,fill:!0,backgroundColor:"rgba(37, 99, 235, 0.2)",borderColor:"#2563eb",pointBackgroundColor:"#2563eb",pointBorderColor:"#fff",pointRadius:4,borderWidth:2,order:10}],s=getLatestHistoryExamEntry(r,o),n=s?s.student||s:null,c=Array.isArray(s==null?void 0:s.allStudents)?s.allStudents:[];if(n!=null&&n.scores){const e=i.map(f=>{if(n.scores[f]===void 0)return null;const x=c.map(m=>{var p;return(p=m==null?void 0:m.scores)==null?void 0:p[f]}).filter(m=>typeof m=="number").sort((m,p)=>p-m);if(!x.length)return null;const g=x.indexOf(n.scores[f])+1;return g>0?((1-g/x.length)*100).toFixed(1):null});e.some(f=>f!==null)&&l.push({label:formatComparisonExamLabel(s.examLabel||s.examId,"Previous"),data:e,fill:!1,borderDash:[6,4],borderColor:"#f97316",pointBackgroundColor:"#fff",pointBorderColor:"#f97316",pointRadius:4,pointStyle:"rectRot",borderWidth:1.5,order:1})}radarChartInstance=new Chart(a,{type:"radar",data:{labels:i,datasets:l},options:{responsive:!0,maintainAspectRatio:!1,scales:{r:{min:0,max:100,ticks:{display:!1},pointLabels:{font:{size:12,family:"Microsoft YaHei",weight:"bold"},color:"#475569"},grid:{color:"rgba(0,0,0,0.05)"},angleLines:{color:"rgba(0,0,0,0.05)"}}},plugins:{legend:{display:!0,position:"bottom",labels:{usePointStyle:!0,padding:15,font:{size:11}}},tooltip:{callbacks:{label:function(e){return`${e.dataset.label}: Percentile ${e.raw}%`}}}}}})}let st=null;function _t(t,o=null){const r=getComparisonStudentView(t,RAW_DATA),a=document.getElementById("varianceChart");if(!a)return;if(!window.Chart){const g=a.parentElement;g&&(g.innerHTML='<div style="text-align:center; color:#94a3b8; font-size:12px; padding:20px;">?????????????</div>');return}st&&st.destroy();const i=[],d=[],u=[],l=[],s=getLatestHistoryExamEntry(r,o),n=s?s.student||s:null,c=Array.isArray(s==null?void 0:s.allStudents)?s.allStudents:[],e=g=>{const m=g.length;if(m===0)return{mean:0,sd:1};const p=g.reduce((b,y)=>b+y,0)/m,T=g.reduce((b,y)=>b+Math.pow(y-p,2),0)/m;return{mean:p,sd:Math.sqrt(T)}};getComparisonTotalSubjects().forEach(g=>{if(r.scores[g]!==void 0){const m=RAW_DATA.map(y=>y.scores[g]).filter(y=>typeof y=="number"),p=e(m);let T=0;p.sd>0&&(T=(r.scores[g]-p.mean)/p.sd),i.push(g),d.push(T),T>=.8?l.push("#16a34a"):T<=-.8?l.push("#dc2626"):l.push("#3b82f6");let b=null;if(n&&n.scores&&n.scores[g]!==void 0){const y=c.map(C=>{var z;return(z=C==null?void 0:C.scores)==null?void 0:z[g]}).filter(C=>typeof C=="number"),v=e(y);v.sd>0&&(b=(n.scores[g]-v.mean)/v.sd)}u.push(b)}});const x=[{label:"Current",data:d,backgroundColor:l,borderRadius:3,barPercentage:.5,categoryPercentage:.8,order:1}];u.some(g=>g!==null)&&x.push({label:formatComparisonExamLabel((s==null?void 0:s.examLabel)||(s==null?void 0:s.examId),"Previous"),data:u,backgroundColor:"rgba(249, 115, 22, 0.4)",borderColor:"#f97316",borderWidth:1,borderRadius:3,barPercentage:.5,categoryPercentage:.8,order:2}),st=new Chart(a,{type:"bar",data:{labels:i,datasets:x},options:{responsive:!0,maintainAspectRatio:!1,indexAxis:"y",plugins:{legend:{display:!0,position:"bottom"},tooltip:{callbacks:{label:g=>`${g.dataset.label} Z-Score: ${g.raw?g.raw.toFixed(2):"-"}`}}},scales:{x:{grid:{color:g=>g.tick.value===0?"#475569":"#f1f5f9",lineWidth:g=>g.tick.value===0?1.5:1},suggestedMin:-2.5,suggestedMax:2.5,ticks:{display:!1}},y:{grid:{display:!1}}}}})}function Ft(t,o=null){const r=getComparisonStudentView(t,RAW_DATA),a=getComparisonTotalSubjects(),i=getComparisonTotalValue(r,a),d=RAW_DATA.length||1,l=Object.keys(SCHOOLS).length<=1?"全校":"全镇",s=safeGet(r,"ranks.total.township",safeGet(r,"ranks.total.school","-")),n=typeof s=="number"&&d>0?(1-s/d)*100:null,c=Array.isArray(o)?o:typeof getStudentExamHistory=="function"?getStudentExamHistory(r):[],e=getLatestHistoryExamEntry(r,c),f=e?e.student||e:null,x=f?recalcPrevTotal(f):null,g=Number.isFinite(i)&&Number.isFinite(x)?i-x:null,m=S=>{const A=S.length;if(!A)return{mean:0,sd:1};const M=S.reduce((W,D)=>W+D,0)/A,G=S.reduce((W,D)=>W+Math.pow(D-M,2),0)/A;return{mean:M,sd:Math.sqrt(G)||1}},p=[];a.forEach(S=>{var U;const A=(U=r==null?void 0:r.scores)==null?void 0:U[S];if(typeof A!="number")return;const M=RAW_DATA.map(O=>{var P;return(P=O==null?void 0:O.scores)==null?void 0:P[S]}).filter(O=>typeof O=="number").sort((O,P)=>P-O);if(!M.length)return;const G=M.indexOf(A)+1,W=G>0?(1-G/M.length)*100:null,D=m(M),q=D.sd>0?(A-D.mean)/D.sd:0;p.push({subject:S,score:A,percentile:W,zScore:q,schoolRank:safeGet(r,`ranks.${S}.school`,"-"),townshipRank:safeGet(r,`ranks.${S}.township`,"-")})});const T=p.filter(S=>S.zScore>=.8).sort((S,A)=>A.zScore-S.zScore),b=p.filter(S=>S.zScore<=-.8).sort((S,A)=>S.zScore-A.zScore),y=[...p].sort((S,A)=>S.zScore-A.zScore),v=[...p].sort((S,A)=>A.zScore-S.zScore),C=p.map(S=>S.zScore),z=C.length?Math.max(...C)-Math.min(...C):0;let R="结构均衡",k="ok";z>=2.6?(R="偏科明显",k="warn"):z>=1.4&&(R="有波动",k="info");let L="首次生成",w="neutral";typeof g=="number"&&(g>=5?(L=`较上次提升 ${g.toFixed(1)} 分`,w="up"):g>=.5?(L=`较上次小幅提升 ${g.toFixed(1)} 分`,w="up"):g<=-5?(L=`较上次回落 ${Math.abs(g).toFixed(1)} 分`,w="down"):g<=-.5?(L=`较上次略有回落 ${Math.abs(g).toFixed(1)} 分`,w="down"):(L="与上次基本持平",w="steady"));const $=Number.isFinite(i)?i+Math.max(4,Math.min(12,(b.length||1)*3)):null,I=typeof s=="number"?Math.max(1,s-Math.max(1,Math.round(s*.08))):null,j=b.slice(0,2),N=T.slice(0,2),H=[];j.length?H.push({tone:"warn",title:`优先补弱：${j.map(S=>S.subject).join("、")}`,detail:"先做基础概念回顾，再做近两次错题复盘；每天固定 15 到 20 分钟，先稳住容易失分点。"}):H.push({tone:"ok",title:"当前没有明显短板",detail:"说明整体结构比较稳，可以把更多精力放在提速、审题和规范表达上，争取把稳定优势转成总分。"}),N.length?H.push({tone:"info",title:`继续守住优势：${N.map(S=>S.subject).join("、")}`,detail:"优势科不要盲目加量，重点保持错题复盘和阶段总结，让强项持续稳定输出。"}):H.push({tone:"info",title:"建立自己的稳定科目",detail:"从最有把握的一门学科开始，先把基础题和中档题做稳，逐步形成可复制的得分来源。"}),H.push({tone:"goal",title:"下一次目标建议",detail:`${$!==null?`建议先把总分稳定到 ${$.toFixed(1)} 分左右；`:""}${I!==null?`争取 ${l}排名提升到前 ${I} 名。`:"先把当前优势延续到下一次考试。"}`});const Z=[`本次解读基于当前成绩库中的 ${d} 名同届样本和 ${Math.max(c.length,1)} 次考试记录。`,"分数、排名、百分位均按已导入的真实成绩计算，不做“估高”处理。","如果学校还没有导入最新一次考试或历史考试，趋势结论会更保守。"];return{reportStudent:r,totalScore:i,totalCount:d,scopeText:l,effectiveRank:s,percentile:n,previousTotal:x,totalDelta:g,balanceLabel:R,balanceTone:k,trendLabel:L,trendTone:w,focusSubjects:j,guardSubjects:N,actionPlans:H,realityNotes:Z,targetScore:$,targetRank:I,subjectInsights:p,strongSubjects:T,weakSubjects:b}}function Nt(t){return`
        <div class="report-action-grid">
            ${t.actionPlans.map(o=>`
                <div class="report-action-card tone-${o.tone}">
                    <div class="report-action-title">${o.title}</div>
                    <div class="report-action-text">${o.detail}</div>
                </div>
            `).join("")}
        </div>
    `}function Dt(t){const o=Array.isArray(t.subjectInsights)?t.subjectInsights:[];return o.length?`
        <div class="report-subject-board">
            ${o.map(r=>{const a=r.percentile!==null?Math.max(0,Math.min(100,r.percentile)):0,i=r.zScore>=.8?"strong":r.zScore<=-.8?"weak":"steady",d=i==="strong"?"优势科":i==="weak"?"优先补弱":"保持稳定",u=Number.isFinite(r.zScore)?r.zScore.toFixed(2):"-";return`
                    <div class="report-subject-item tone-${i}">
                        <div class="report-subject-head">
                            <strong>${r.subject}</strong>
                            <span>${d}</span>
                        </div>
                        <div class="report-subject-meta">
                            <span>成绩 ${r.score}</span>
                            <span>百分位 ${r.percentile!==null?r.percentile.toFixed(0)+"%":"-"}</span>
                            <span>Z ${u}</span>
                        </div>
                        <div class="report-progress-track">
                            <div class="report-progress-bar tone-${i}" style="width:${a}%;"></div>
                        </div>
                    </div>
                `}).join("")}
        </div>
    `:""}function Pt(t){return`
        <div class="report-reality-note">
            <div class="report-reality-title">真实成绩说明</div>
            <ul class="report-reality-list">
                ${t.realityNotes.map(o=>`<li>${o}</li>`).join("")}
            </ul>
        </div>
    `}function dt(t){const r=Object.keys(SCHOOLS).length<=1?"全校":"全镇",a=getComparisonStudentView(t,RAW_DATA),i=safeGet(a,"ranks.total.township",safeGet(a,"ranks.total.school","-")),d=RAW_DATA.length||1,u=typeof i=="number"?(1-i/d)*100:null,l=[],s=[],n=[],c=[],e=R=>{const k=R.length;if(k===0)return{mean:0,sd:1};const L=R.reduce(($,I)=>$+I,0)/k,w=R.reduce(($,I)=>$+Math.pow(I-L,2),0)/k;return{mean:L,sd:Math.sqrt(w)}};getComparisonTotalSubjects().forEach(R=>{if(a.scores[R]===void 0)return;const k=RAW_DATA.map(j=>j.scores[R]).filter(j=>typeof j=="number").sort((j,N)=>N-j);if(!k.length)return;const w=(1-(k.indexOf(a.scores[R])+1)/k.length)*100;l.push(w);const $=e(k),I=$.sd>0?(a.scores[R]-$.mean)/$.sd:0;s.push(I),I>=.8&&n.push(R),I<=-.8&&c.push(R)});const x=l.length?l.reduce((R,k)=>R+k,0)/l.length:null,g=s.length?Math.max(...s):0,m=s.length?Math.min(...s):0,p=g-m,T=p>=2.5?"偏科明显":p>=1.2?"相对均衡":"结构优秀",b=n.length?`优势学科：${n.join("、")}`:"暂无明显优势学科",y=c.length?`薄弱学科：${c.join("、")}`:"暂无明显薄弱学科";let v=[];c.length&&v.push(`优先补弱科（${c.join("、")}），建议每天固定 15 分钟回归基础概念。`),n.length&&v.push(`保持优势科（${n.join("、")}），可通过错题复盘稳住高位。`),!c.length&&!n.length&&v.push("整体均衡，建议选择一门兴趣学科进行小幅突破。"),v.push("复习建议：先概念后练习，错题当天归档。");const C=u!==null?`${u.toFixed(0)}%`:"-",z=x!==null?`${x.toFixed(0)}%`:"-";return`
        <div class="fluent-card" style="margin-top:10px;">
            <div class="fluent-header"><i class="ti ti-info-circle" style="color:#6366f1;"></i><span class="fluent-title">图表解读与建议</span></div>
            <div style="font-size:13px; color:#475569; line-height:1.8;">
                <div><strong>${CONFIG.name==="9年级"?"五科综合素质评价":"综合素质评价"}（百分位）</strong>：表示学生在${r}的相对位置，数值越高越优秀。</div>
                <div>当前综合排名：${i} / ${d}，综合百分位约 <strong>${C}</strong>；单科平均百分位约 <strong>${z}</strong>。</div>
                <div style="margin-top:6px;"><strong>${CONFIG.name==="9年级"?"五科学科均衡度":"学科均衡度"}（Z-Score）</strong>：正数代表优势、负数代表薄弱，绝对值越大差异越明显。</div>
                <div>均衡度判断：<strong>${T}</strong>；${b}；${y}。</div>
                <div style="margin-top:6px;"><strong>学习建议</strong>：${v.join(" ")}</div>
            </div>
        </div>`}function Bt(t){const o=document.getElementById("strengths-container"),r=document.getElementById("weaknesses-container"),a=document.getElementById("suggestions-container");if(!o||!r||!a)return;const i=RAW_DATA.map(n=>n.total).sort((n,c)=>c-n),d=(i.indexOf(t.total)+1)/i.length,u=[],l=[];SUBJECTS.forEach(n=>{if(t.scores[n]!==void 0){const c=RAW_DATA.map(f=>f.scores[n]).filter(f=>f!==void 0).sort((f,x)=>x-f),e=(c.indexOf(t.scores[n])+1)/c.length;e<d-.2?u.push({subject:n,percentile:e,score:t.scores[n]}):e>d+.2&&l.push({subject:n,percentile:e,score:t.scores[n]})}}),o.innerHTML=u.length?u.map(n=>`<span>${n.subject} <small>(${n.score})</small></span>`).join("、"):"无明显优势学科",r.innerHTML=l.length?l.map(n=>`<span>${n.subject} <small>(${n.score})</small></span>`).join("、"):"无明显劣势学科";let s=l.length?`<p>建议重点关注：${l.map(n=>n.subject).join("、")}，制定针对性复习计划。</p>`:"<p>各科发展均衡，请继续保持当前的良好状态。</p>";a.innerHTML=s}function pt(t){const o=t.percentile!==null?`${t.percentile.toFixed(0)}%`:"-",r=Number.isFinite(t.totalScore)?t.totalScore.toFixed(1):"-",a=typeof t.effectiveRank=="number"?`${t.effectiveRank}`:"-",i=Number.isFinite(t.previousTotal)?t.previousTotal.toFixed(1):"-",d=t.trendTone==="up"?"report-pill up":t.trendTone==="down"?"report-pill down":"report-pill",u=t.balanceTone==="warn"?"report-pill warn":t.balanceTone==="info"?"report-pill info":"report-pill ok",l=t.focusSubjects.length?t.focusSubjects.map(n=>n.subject).join("、"):"暂无明显短板",s=t.guardSubjects.length?t.guardSubjects.map(n=>n.subject).join("、"):"建议先培养一门稳定优势科";return`
        <div class="report-insight-grid">
            <div class="report-insight-card tone-score">
                <span class="report-insight-label">本次总分</span>
                <strong class="report-insight-value">${r}</strong>
                <span class="report-insight-sub">上次对比：${i}</span>
            </div>
            <div class="report-insight-card tone-rank">
                <span class="report-insight-label">${t.scopeText}定位</span>
                <strong class="report-insight-value">第 ${a} 名</strong>
                <span class="report-insight-sub">综合百分位：${o}</span>
            </div>
            <div class="report-insight-card tone-balance">
                <span class="report-insight-label">结构状态</span>
                <strong class="report-insight-value">${t.balanceLabel}</strong>
                <span class="${u}">${t.balanceLabel}</span>
            </div>
            <div class="report-insight-card tone-trend">
                <span class="report-insight-label">阶段走势</span>
                <strong class="report-insight-value">${t.trendLabel}</strong>
                <span class="${d}">${t.trendLabel}</span>
            </div>
        </div>
        <div class="report-chip-row">
            <span class="report-chip report-chip-focus">当前优先调整：${l}</span>
            <span class="report-chip report-chip-guard">继续守住优势：${s}</span>
        </div>
    `}var Gt="";Object.assign(window,{getTrendBadge:B,renderSingleReportCardHTML:et,renderInstagramCard:ct,renderIGCharts:nt,saveLLMConfig:Rt,callLLM:ot,callAIForComment:zt,generateAIMacroReport:Lt,copyReport:Mt,exportToWord:Ht,printSingleReport:Ct,downloadSingleReportPDF:$t,batchGeneratePDF:Tt,renderRadarChart:rt,renderVarianceChart:_t,buildChartNarrative:dt,analyzeStrengthsAndWeaknesses:Bt}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
