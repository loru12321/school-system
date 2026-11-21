var uiDeclaredAttrs=globalThis.uiDeclaredAttrs||(globalThis.uiDeclaredAttrs=function(i,S,...p){const T=i==="change"?"data-ui-change":i==="input"?"data-ui-input":"data-ui-action",_=C=>String(C).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),w=p.length?` data-ui-args="${_(JSON.stringify(p))}"`:"";return`${T}="call" data-ui-call="${_(S)}"${w}`});(function(e){if(!e)return;const i={signature:"",rows:[]};function S(){i.signature="",i.rows=[]}function p(n){return Array.isArray(n)?n.map(s=>({...s})):[]}function T(n){const s=Number(n);return Number.isFinite(s)&&s>0?s:0}function _(n,s){const A=typeof e.ensureNormalizedTargets=="function"?e.ensureNormalizedTargets():e.TARGETS||{},I=Object.keys(A||{}).sort((r,g)=>String(r).localeCompare(String(g),"zh-CN")).map(r=>{const g=A[r]||{};return`${String(r).trim()}:${T(g.t1)}:${T(g.t2)}`}).join("|");return[e.CURRENT_EXAM_ID||"",e.__RAW_DATA_VERSION||0,Array.isArray(e.RAW_DATA)?e.RAW_DATA.length:0,Object.keys(e.SCHOOLS||{}).sort((r,g)=>String(r).localeCompare(String(g),"zh-CN")).join("|"),parseInt(n,10)||0,parseInt(s,10)||0,I].join("::")}function w(){e.__LAST_INDICATOR_CALC_CONTEXT_KEY__=typeof e.getIndicatorResultContextKey=="function"?e.getIndicatorResultContextKey():[e.CURRENT_COHORT_ID||"",e.CURRENT_EXAM_ID||"",e.__RAW_DATA_VERSION||0,Array.isArray(e.RAW_DATA)?e.RAW_DATA.length:0].join("::")}function C(n=!1){var j,z,H,P,W,F;if(!e.isIndicatorPromptAllowed())return S(),typeof e.clearIndicatorRuntimeState=="function"&&e.clearIndicatorRuntimeState(),e.clearIndicatorTargetMatchPanel(),!n&&e.UI&&e.UI.toast("仅 9 年级可使用指标生功能","warning"),[];let s=(z=(j=e.SYS_VARS)==null?void 0:j.indicator)==null?void 0:z.ind1,A=(P=(H=e.SYS_VARS)==null?void 0:H.indicator)==null?void 0:P.ind2;s||(s=(W=e.document.getElementById("dm_ind1_input"))==null?void 0:W.value),A||(A=(F=e.document.getElementById("dm_ind2_input"))==null?void 0:F.value);const I=parseInt(s),r=parseInt(A);if(!I||!r)return e.clearIndicatorTargetMatchPanel(),!n&&e.confirm(`❌ 检测到【划线名次】尚未设置！

是否立即打开「教务数据综合控制台」进行设置？`)&&e.DataManager.open("params"),[];if(!e.isIndicatorCalcAllowed())return e.clearIndicatorTargetMatchPanel(),e.UI&&e.UI.toast("请先加载当前 9 年级考试成绩后再开始计算","warning"),[];if(!e.isIndicatorCalcAllowed()){e.clearIndicatorTargetMatchPanel(),e.UI&&e.UI.toast("仅 9 年级期中/期末考试可开始计算","warning");return}if(!e.TARGETS||Object.keys(e.TARGETS).length===0)return e.clearIndicatorTargetMatchPanel(),!n&&e.confirm(`❌ 检测到【目标人数】尚未导入！

是否立即打开「教务数据综合控制台」进行导入？`)&&e.DataManager.open("targets"),[];const g=_(I,r);if(n&&i.signature===g&&Array.isArray(i.rows)&&i.rows.length){const t=p(i.rows);return e.INDICATOR_LAST_RESULT=t,e.__LAST_INDICATOR_CALC_DATA__=t,w(),t}e.clearIndicatorTargetMatchPanel(),Object.values(e.SCHOOLS||{}).forEach(t=>{t&&typeof t=="object"&&(t.scoreInd=0)});const y=(typeof e.filterRowsToTownshipSchools=="function"?e.filterRowsToTownshipSchools(e.RAW_DATA||[]):Array.isArray(e.RAW_DATA)?e.RAW_DATA:[]).map(t=>t.total).filter(t=>typeof t=="number").sort((t,c)=>c-t);if(!y.length)return e.clearIndicatorTargetMatchPanel(),!n&&e.UI&&e.UI.toast("暂无可计算的指标生成绩数据","warning"),[];const Y=Math.min(Math.max(I,1),y.length)-1,q=Math.min(Math.max(r,1),y.length)-1,R=y[Y],$=y[q];let l=[],k=0,x=0;e.buildIndicatorSchoolBuckets().filter(t=>typeof e.isTownshipManagedSchool=="function"?e.isTownshipManagedSchool(t.name,Object.keys(e.SCHOOLS||{})):!0).forEach(t=>{var G,V;const c=t.students.map(b=>b.total),h=c.filter(b=>b>=R).length,u=c.filter(b=>b>=$).length,d=e.getTargetConfigBySchool(t.name),o=c.length,f=T((G=d.value)==null?void 0:G.t1),m=T((V=d.value)==null?void 0:V.t2),B=f>0&&o>0&&f>o,K=m>0&&o>0&&m>o,a={t1:B?0:f,t2:K?0:m},J=B||K,Q=!d.key||!a.t1&&!a.t2;let D=0;a.t1>0&&(h<a.t1*.6?D=0:h>=a.t1?D=30:D=h/a.t1*30);const E=a.t1>0?Math.max(0,h-a.t1):0;E>k&&(k=E);let N=0;a.t2>0&&(u<a.t2*.6?N=0:u>=a.t2?N=30:N=u/a.t2*30);const O=a.t2>0?Math.max(0,u-a.t2):0;O>x&&(x=O),l.push({name:t.name,rawNames:Array.isArray(t.rawNames)?t.rawNames.slice():[],targetKey:d.key||"",missingTarget:Q,invalidTarget:J,studentCount:o,rawT1:f,rawT2:m,t1:a.t1,r1:h,base1:D,excess1:E,t2:a.t2,r2:u,base2:N,excess2:O})}),l.forEach(t=>{t.bonus1=k>0?t.excess1/k*5:0,t.score1=t.base1+t.bonus1,t.bonus2=x>0?t.excess2/x*5:0,t.score2=t.base2+t.bonus2,t.finalScore=t.score1+t.score2,e.syncIndicatorScoreToSchools(t.name,t.finalScore),Array.isArray(t.rawNames)&&t.rawNames.forEach(c=>e.syncIndicatorScoreToSchools(c,t.finalScore))}),l.sort((t,c)=>c.finalScore-t.finalScore).forEach((t,c)=>t.rank=c+1);const U=l.filter(t=>t.missingTarget).map(t=>t.name),L=l.filter(t=>t.invalidTarget).map(t=>`${t.name}(人数${t.studentCount}, 目标${t.rawT1}/${t.rawT2})`),X=e.document.querySelector("#tb-indicator thead");X.innerHTML=`
            <tr>
                <th rowspan="2">学校</th>
                <th colspan="4" style="background:#e0f2fe; color:#0369a1;">指标一 (参考分:${R})</th>
                <th colspan="4" style="background:#fff7ed; color:#b45309;">指标二 (参考分:${$})</th>
                <th rowspan="2">指标总分</th>
                <th rowspan="2">排名</th>
            </tr>
            <tr>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
            </tr>
        `;let v="";l.forEach(t=>{var d,o,f,m;const c=e.sameAppSchoolName(t.name,e.MY_SCHOOL),h=e.escapeAppHtml(t.name),u=t.targetKey?`目标人数匹配：${t.targetKey}`:"未匹配目标人数";v+=`
            <tr class="${c?"bg-highlight":""}">
                <td style="font-weight:bold;" title="${e.escapeAppHtml(u)}">${h}${t.invalidTarget?'<span style="display:block; font-size:11px; color:#d97706; font-weight:600;">目标异常</span>':t.missingTarget?'<span style="display:block; font-size:11px; color:#dc2626; font-weight:600;">未匹配目标人数</span>':""}</td>

                <!-- 指标一 -->
                <td>
                    <!-- 👇 新增点击事件：点击目标人数，分析如何达标 -->
                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          ${uiDeclaredAttrs("click","analyzeTargetGap",String((d=t.name)!=null?d:""),"ind1",Number(R))}
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${t.t1||(t.invalidTarget?"异常":t.missingTarget?"未匹配":0)}
                    </span> /
                    <strong class="clickable-num" ${uiDeclaredAttrs("click","handleIndicatorClick",String((o=t.name)!=null?o:""),"ind1")}>${t.r1}</strong>
                </td>
                <td>${t.base1.toFixed(2)}</td>
                <td style="color:${t.bonus1>0?"green":"#ccc"}; font-weight:bold;">${t.bonus1>0?"+":""}${t.bonus1.toFixed(2)}</td>
                <td style="background:#f0f9ff; font-weight:bold;">${t.score1.toFixed(2)}</td>

                <!-- 指标二 -->
                <td>

                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          ${uiDeclaredAttrs("click","analyzeTargetGap",String((f=t.name)!=null?f:""),"ind2",Number($))}
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${t.t2||(t.invalidTarget?"异常":t.missingTarget?"未匹配":0)}
                    </span> /
                    <strong class="clickable-num" ${uiDeclaredAttrs("click","handleIndicatorClick",String((m=t.name)!=null?m:""),"ind2")}>${t.r2}</strong>
                </td>
                <td>${t.base2.toFixed(2)}</td>
                <td style="color:${t.bonus2>0?"green":"#ccc"}; font-weight:bold;">${t.bonus2>0?"+":""}${t.bonus2.toFixed(2)}</td>
                <td style="background:#fffaf0; font-weight:bold;">${t.score2.toFixed(2)}</td>

                <!-- 总分 -->
                <td class="text-red" style="font-size:1.1em; font-weight:bold;">${t.finalScore.toFixed(2)}</td>
                ${e.getRankHTML(t.rank)}
            </tr>`}),e.document.querySelector("#tb-indicator tbody").innerHTML=v,e.renderIndicatorTargetMatchPanel(l,R,$);const M=p(l);return i.signature=g,i.rows=M,e.INDICATOR_LAST_RESULT=M,e.__LAST_INDICATOR_CALC_DATA__=M,w(),e.markSummaryDataChangedIfDependencyChanged("indicator",e.buildSummaryDependencySignature("indicator",l),"指标生核算结果已更新，请重新生成总排名。"),!n&&e.UI&&e.UI.toast("✅ 指标生核算完成 (含附加分)","success"),!n&&U.length&&e.UI&&e.UI.toast(`⚠️ ${U.length} 所学校未匹配到目标人数，指标基础分已按 0 分处理`,"warning"),!n&&L.length&&e.UI&&e.UI.toast(`⚠️ 以下学校目标人数异常（大于学生总数），已按未匹配处理：${L.join("、")}`,"warning"),l}e.calcIndicators=C,e.IndicatorCalcRuntime={calcIndicators:C,clearCache:S}})(typeof window!="undefined"?window:globalThis);
