(function(e){if(!e)return;const g={signature:"",rows:[]};function D(){g.signature="",g.rows=[]}function N(a){return Array.isArray(a)?a.map(i=>({...i})):[]}function I(a){const i=Number(a);return Number.isFinite(i)&&i>0?i:0}function V(a,i){const f=typeof e.ensureNormalizedTargets=="function"?e.ensureNormalizedTargets():e.TARGETS||{},u=Object.keys(f||{}).sort((s,o)=>String(s).localeCompare(String(o),"zh-CN")).map(s=>{const o=f[s]||{};return`${String(s).trim()}:${I(o.t1)}:${I(o.t2)}`}).join("|");return[e.CURRENT_EXAM_ID||"",e.__RAW_DATA_VERSION||0,Array.isArray(e.RAW_DATA)?e.RAW_DATA.length:0,Object.keys(e.SCHOOLS||{}).sort((s,o)=>String(s).localeCompare(String(o),"zh-CN")).join("|"),parseInt(a,10)||0,parseInt(i,10)||0,u].join("::")}function M(){e.__LAST_INDICATOR_CALC_CONTEXT_KEY__=typeof e.getIndicatorResultContextKey=="function"?e.getIndicatorResultContextKey():[e.CURRENT_COHORT_ID||"",e.CURRENT_EXAM_ID||"",e.__RAW_DATA_VERSION||0,Array.isArray(e.RAW_DATA)?e.RAW_DATA.length:0].join("::")}function E(a=!1){var v,j,z,H,P,W;if(!e.isIndicatorPromptAllowed())return D(),typeof e.clearIndicatorRuntimeState=="function"&&e.clearIndicatorRuntimeState(),e.clearIndicatorTargetMatchPanel(),!a&&e.UI&&e.UI.toast("仅 9 年级可使用指标生功能","warning"),[];let i=(j=(v=e.SYS_VARS)==null?void 0:v.indicator)==null?void 0:j.ind1,f=(H=(z=e.SYS_VARS)==null?void 0:z.indicator)==null?void 0:H.ind2;i||(i=(P=e.document.getElementById("dm_ind1_input"))==null?void 0:P.value),f||(f=(W=e.document.getElementById("dm_ind2_input"))==null?void 0:W.value);const u=parseInt(i),s=parseInt(f);if(!u||!s)return e.clearIndicatorTargetMatchPanel(),!a&&e.confirm(`❌ 检测到【划线名次】尚未设置！

是否立即打开「教务数据综合控制台」进行设置？`)&&e.DataManager.open("params"),[];if(!e.isIndicatorCalcAllowed())return e.clearIndicatorTargetMatchPanel(),e.UI&&e.UI.toast("请先加载当前 9 年级考试成绩后再开始计算","warning"),[];if(!e.isIndicatorCalcAllowed()){e.clearIndicatorTargetMatchPanel(),e.UI&&e.UI.toast("仅 9 年级期中/期末考试可开始计算","warning");return}if(!e.TARGETS||Object.keys(e.TARGETS).length===0)return e.clearIndicatorTargetMatchPanel(),!a&&e.confirm(`❌ 检测到【目标人数】尚未导入！

是否立即打开「教务数据综合控制台」进行导入？`)&&e.DataManager.open("targets"),[];const o=V(u,s);if(a&&g.signature===o&&Array.isArray(g.rows)&&g.rows.length){const t=N(g.rows);return e.INDICATOR_LAST_RESULT=t,e.__LAST_INDICATOR_CALC_DATA__=t,M(),t}e.clearIndicatorTargetMatchPanel(),Object.values(e.SCHOOLS||{}).forEach(t=>{t&&typeof t=="object"&&(t.scoreInd=0)});const m=(typeof e.filterRowsToTownshipSchools=="function"?e.filterRowsToTownshipSchools(e.RAW_DATA||[]):Array.isArray(e.RAW_DATA)?e.RAW_DATA:[]).map(t=>t.total).filter(t=>typeof t=="number").sort((t,c)=>c-t);if(!m.length)return e.clearIndicatorTargetMatchPanel(),!a&&e.UI&&e.UI.toast("暂无可计算的指标生成绩数据","warning"),[];const Y=Math.min(Math.max(u,1),m.length)-1,X=Math.min(Math.max(s,1),m.length)-1,p=m[Y],y=m[X];let r=[],b=0,S=0;e.buildIndicatorSchoolBuckets().filter(t=>typeof e.isTownshipManagedSchool=="function"?e.isTownshipManagedSchool(t.name,Object.keys(e.SCHOOLS||{})):!0).forEach(t=>{var K,G;const c=t.students.map(A=>A.total),h=c.filter(A=>A>=p).length,l=c.filter(A=>A>=y).length,d=e.getTargetConfigBySchool(t.name),T=c.length,_=I((K=d.value)==null?void 0:K.t1),w=I((G=d.value)==null?void 0:G.t2),F=_>0&&T>0&&_>T,B=w>0&&T>0&&w>T,n={t1:F?0:_,t2:B?0:w},J=F||B,Q=!d.key||!n.t1&&!n.t2;let C=0;n.t1>0&&(h<n.t1*.6?C=0:h>=n.t1?C=30:C=h/n.t1*30);const x=n.t1>0?Math.max(0,h-n.t1):0;x>b&&(b=x);let R=0;n.t2>0&&(l<n.t2*.6?R=0:l>=n.t2?R=30:R=l/n.t2*30);const k=n.t2>0?Math.max(0,l-n.t2):0;k>S&&(S=k),r.push({name:t.name,rawNames:Array.isArray(t.rawNames)?t.rawNames.slice():[],targetKey:d.key||"",missingTarget:Q,invalidTarget:J,studentCount:T,rawT1:_,rawT2:w,t1:n.t1,r1:h,base1:C,excess1:x,t2:n.t2,r2:l,base2:R,excess2:k})}),r.forEach(t=>{t.bonus1=b>0?t.excess1/b*5:0,t.score1=t.base1+t.bonus1,t.bonus2=S>0?t.excess2/S*5:0,t.score2=t.base2+t.bonus2,t.finalScore=t.score1+t.score2,e.syncIndicatorScoreToSchools(t.name,t.finalScore),Array.isArray(t.rawNames)&&t.rawNames.forEach(c=>e.syncIndicatorScoreToSchools(c,t.finalScore))}),r.sort((t,c)=>c.finalScore-t.finalScore).forEach((t,c)=>t.rank=c+1);const O=r.filter(t=>t.missingTarget).map(t=>t.name),U=r.filter(t=>t.invalidTarget).map(t=>`${t.name}(人数${t.studentCount}, 目标${t.rawT1}/${t.rawT2})`),q=e.document.querySelector("#tb-indicator thead");q.innerHTML=`
            <tr>
                <th rowspan="2">学校</th>
                <th colspan="4" style="background:#e0f2fe; color:#0369a1;">指标一 (参考分:${p})</th>
                <th colspan="4" style="background:#fff7ed; color:#b45309;">指标二 (参考分:${y})</th>
                <th rowspan="2">指标总分</th>
                <th rowspan="2">排名</th>
            </tr>
            <tr>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
            </tr>
        `;let L="";r.forEach(t=>{const c=e.sameAppSchoolName(t.name,e.MY_SCHOOL),h=e.escapeAppHtml(t.name),l=e.jsStringLiteral(t.name),d=t.targetKey?`目标人数匹配：${t.targetKey}`:"未匹配目标人数";L+=`
            <tr class="${c?"bg-highlight":""}">
                <td style="font-weight:bold;" title="${e.escapeAppHtml(d)}">${h}${t.invalidTarget?'<span style="display:block; font-size:11px; color:#d97706; font-weight:600;">目标异常</span>':t.missingTarget?'<span style="display:block; font-size:11px; color:#dc2626; font-weight:600;">未匹配目标人数</span>':""}</td>

                <!-- 指标一 -->
                <td>
                    <!-- 👇 新增点击事件：点击目标人数，分析如何达标 -->
                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          onclick="analyzeTargetGap(${l}, 'ind1', ${p})"
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${t.t1||(t.invalidTarget?"异常":t.missingTarget?"未匹配":0)}
                    </span> /
                    <strong class="clickable-num" onclick="handleIndicatorClick(${l}, 'ind1')">${t.r1}</strong>
                </td>
                <td>${t.base1.toFixed(2)}</td>
                <td style="color:${t.bonus1>0?"green":"#ccc"}; font-weight:bold;">${t.bonus1>0?"+":""}${t.bonus1.toFixed(2)}</td>
                <td style="background:#f0f9ff; font-weight:bold;">${t.score1.toFixed(2)}</td>

                <!-- 指标二 -->
                <td>

                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          onclick="analyzeTargetGap(${l}, 'ind2', ${y})"
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${t.t2||(t.invalidTarget?"异常":t.missingTarget?"未匹配":0)}
                    </span> /
                    <strong class="clickable-num" onclick="handleIndicatorClick(${l}, 'ind2')">${t.r2}</strong>
                </td>
                <td>${t.base2.toFixed(2)}</td>
                <td style="color:${t.bonus2>0?"green":"#ccc"}; font-weight:bold;">${t.bonus2>0?"+":""}${t.bonus2.toFixed(2)}</td>
                <td style="background:#fffaf0; font-weight:bold;">${t.score2.toFixed(2)}</td>

                <!-- 总分 -->
                <td class="text-red" style="font-size:1.1em; font-weight:bold;">${t.finalScore.toFixed(2)}</td>
                ${e.getRankHTML(t.rank)}
            </tr>`}),e.document.querySelector("#tb-indicator tbody").innerHTML=L,e.renderIndicatorTargetMatchPanel(r,p,y);const $=N(r);return g.signature=o,g.rows=$,e.INDICATOR_LAST_RESULT=$,e.__LAST_INDICATOR_CALC_DATA__=$,M(),e.markSummaryDataChangedIfDependencyChanged("indicator",e.buildSummaryDependencySignature("indicator",r),"指标生核算结果已更新，请重新生成总排名。"),!a&&e.UI&&e.UI.toast("✅ 指标生核算完成 (含附加分)","success"),!a&&O.length&&e.UI&&e.UI.toast(`⚠️ ${O.length} 所学校未匹配到目标人数，指标基础分已按 0 分处理`,"warning"),!a&&U.length&&e.UI&&e.UI.toast(`⚠️ 以下学校目标人数异常（大于学生总数），已按未匹配处理：${U.join("、")}`,"warning"),r}e.calcIndicators=E,e.IndicatorCalcRuntime={calcIndicators:E,clearCache:D}})(typeof window!="undefined"?window:globalThis);
