(function(t){if(!t)return;const h={signature:"",rows:[]};function M(n){return Array.isArray(n)?n.map(s=>({...s})):[]}function b(n){const s=Number(n);return Number.isFinite(s)&&s>0?s:0}function G(n,s){const f=typeof t.ensureNormalizedTargets=="function"?t.ensureNormalizedTargets():t.TARGETS||{},u=Object.keys(f||{}).sort((i,o)=>String(i).localeCompare(String(o),"zh-CN")).map(i=>{const o=f[i]||{};return`${String(i).trim()}:${b(o.t1)}:${b(o.t2)}`}).join("|");return[t.CURRENT_EXAM_ID||"",t.__RAW_DATA_VERSION||0,Array.isArray(t.RAW_DATA)?t.RAW_DATA.length:0,Object.keys(t.SCHOOLS||{}).sort((i,o)=>String(i).localeCompare(String(o),"zh-CN")).join("|"),parseInt(n,10)||0,parseInt(s,10)||0,u].join("::")}function N(n=!1){var U,L,v,j,z,P;if(!t.isIndicatorPromptAllowed())return t.clearIndicatorTargetMatchPanel(),!n&&t.UI&&t.UI.toast("仅 9 年级可使用指标生功能","warning"),[];let s=(L=(U=t.SYS_VARS)==null?void 0:U.indicator)==null?void 0:L.ind1,f=(j=(v=t.SYS_VARS)==null?void 0:v.indicator)==null?void 0:j.ind2;s||(s=(z=t.document.getElementById("dm_ind1_input"))==null?void 0:z.value),f||(f=(P=t.document.getElementById("dm_ind2_input"))==null?void 0:P.value);const u=parseInt(s),i=parseInt(f);if(!u||!i)return t.clearIndicatorTargetMatchPanel(),!n&&t.confirm(`❌ 检测到【划线名次】尚未设置！

是否立即打开「教务数据综合控制台」进行设置？`)&&t.DataManager.open("params"),[];if(!t.isIndicatorCalcAllowed())return t.clearIndicatorTargetMatchPanel(),t.UI&&t.UI.toast("请先加载当前 9 年级考试成绩后再开始计算","warning"),[];if(!t.isIndicatorCalcAllowed()){t.clearIndicatorTargetMatchPanel(),t.UI&&t.UI.toast("仅 9 年级期中/期末考试可开始计算","warning");return}if(!t.TARGETS||Object.keys(t.TARGETS).length===0)return t.clearIndicatorTargetMatchPanel(),!n&&t.confirm(`❌ 检测到【目标人数】尚未导入！

是否立即打开「教务数据综合控制台」进行导入？`)&&t.DataManager.open("targets"),[];const o=G(u,i);if(n&&h.signature===o&&Array.isArray(h.rows)&&h.rows.length){const e=M(h.rows);return t.INDICATOR_LAST_RESULT=e,t.__LAST_INDICATOR_CALC_DATA__=e,e}t.clearIndicatorTargetMatchPanel(),Object.values(t.SCHOOLS||{}).forEach(e=>{e&&typeof e=="object"&&(e.scoreInd=0)});const m=(typeof t.filterRowsToTownshipSchools=="function"?t.filterRowsToTownshipSchools(t.RAW_DATA||[]):Array.isArray(t.RAW_DATA)?t.RAW_DATA:[]).map(e=>e.total).filter(e=>typeof e=="number").sort((e,c)=>c-e);if(!m.length)return t.clearIndicatorTargetMatchPanel(),!n&&t.UI&&t.UI.toast("暂无可计算的指标生成绩数据","warning"),[];const K=Math.min(Math.max(u,1),m.length)-1,V=Math.min(Math.max(i,1),m.length)-1,I=m[K],A=m[V];let r=[],y=0,S=0;t.buildIndicatorSchoolBuckets().filter(e=>typeof t.isTownshipManagedSchool=="function"?t.isTownshipManagedSchool(e.name,Object.keys(t.SCHOOLS||{})):!0).forEach(e=>{var B,W;const c=e.students.map(p=>p.total),g=c.filter(p=>p>=I).length,l=c.filter(p=>p>=A).length,d=t.getTargetConfigBySchool(e.name),T=c.length,w=b((B=d.value)==null?void 0:B.t1),$=b((W=d.value)==null?void 0:W.t2),H=w>0&&T>0&&w>T,F=$>0&&T>0&&$>T,a={t1:H?0:w,t2:F?0:$},q=H||F,X=!d.key||!a.t1&&!a.t2;let _=0;a.t1>0&&(g<a.t1*.6?_=0:g>=a.t1?_=30:_=g/a.t1*30);const x=a.t1>0?Math.max(0,g-a.t1):0;x>y&&(y=x);let C=0;a.t2>0&&(l<a.t2*.6?C=0:l>=a.t2?C=30:C=l/a.t2*30);const R=a.t2>0?Math.max(0,l-a.t2):0;R>S&&(S=R),r.push({name:e.name,rawNames:Array.isArray(e.rawNames)?e.rawNames.slice():[],targetKey:d.key||"",missingTarget:X,invalidTarget:q,studentCount:T,rawT1:w,rawT2:$,t1:a.t1,r1:g,base1:_,excess1:x,t2:a.t2,r2:l,base2:C,excess2:R})}),r.forEach(e=>{e.bonus1=y>0?e.excess1/y*5:0,e.score1=e.base1+e.bonus1,e.bonus2=S>0?e.excess2/S*5:0,e.score2=e.base2+e.bonus2,e.finalScore=e.score1+e.score2,t.syncIndicatorScoreToSchools(e.name,e.finalScore),Array.isArray(e.rawNames)&&e.rawNames.forEach(c=>t.syncIndicatorScoreToSchools(c,e.finalScore))}),r.sort((e,c)=>c.finalScore-e.finalScore).forEach((e,c)=>e.rank=c+1);const D=r.filter(e=>e.missingTarget).map(e=>e.name),E=r.filter(e=>e.invalidTarget).map(e=>`${e.name}(人数${e.studentCount}, 目标${e.rawT1}/${e.rawT2})`),Y=t.document.querySelector("#tb-indicator thead");Y.innerHTML=`
            <tr>
                <th rowspan="2">学校</th>
                <th colspan="4" style="background:#e0f2fe; color:#0369a1;">指标一 (参考分:${I})</th>
                <th colspan="4" style="background:#fff7ed; color:#b45309;">指标二 (参考分:${A})</th>
                <th rowspan="2">指标总分</th>
                <th rowspan="2">排名</th>
            </tr>
            <tr>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
            </tr>
        `;let O="";r.forEach(e=>{const c=t.sameAppSchoolName(e.name,t.MY_SCHOOL),g=t.escapeAppHtml(e.name),l=t.jsStringLiteral(e.name),d=e.targetKey?`目标人数匹配：${e.targetKey}`:"未匹配目标人数";O+=`
            <tr class="${c?"bg-highlight":""}">
                <td style="font-weight:bold;" title="${t.escapeAppHtml(d)}">${g}${e.invalidTarget?'<span style="display:block; font-size:11px; color:#d97706; font-weight:600;">目标异常</span>':e.missingTarget?'<span style="display:block; font-size:11px; color:#dc2626; font-weight:600;">未匹配目标人数</span>':""}</td>

                <!-- 指标一 -->
                <td>
                    <!-- 👇 新增点击事件：点击目标人数，分析如何达标 -->
                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          onclick="analyzeTargetGap(${l}, 'ind1', ${I})"
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${e.t1||(e.invalidTarget?"异常":e.missingTarget?"未匹配":0)}
                    </span> /
                    <strong class="clickable-num" onclick="handleIndicatorClick(${l}, 'ind1')">${e.r1}</strong>
                </td>
                <td>${e.base1.toFixed(2)}</td>
                <td style="color:${e.bonus1>0?"green":"#ccc"}; font-weight:bold;">${e.bonus1>0?"+":""}${e.bonus1.toFixed(2)}</td>
                <td style="background:#f0f9ff; font-weight:bold;">${e.score1.toFixed(2)}</td>

                <!-- 指标二 -->
                <td>

                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          onclick="analyzeTargetGap(${l}, 'ind2', ${A})"
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${e.t2||(e.invalidTarget?"异常":e.missingTarget?"未匹配":0)}
                    </span> /
                    <strong class="clickable-num" onclick="handleIndicatorClick(${l}, 'ind2')">${e.r2}</strong>
                </td>
                <td>${e.base2.toFixed(2)}</td>
                <td style="color:${e.bonus2>0?"green":"#ccc"}; font-weight:bold;">${e.bonus2>0?"+":""}${e.bonus2.toFixed(2)}</td>
                <td style="background:#fffaf0; font-weight:bold;">${e.score2.toFixed(2)}</td>

                <!-- 总分 -->
                <td class="text-red" style="font-size:1.1em; font-weight:bold;">${e.finalScore.toFixed(2)}</td>
                ${t.getRankHTML(e.rank)}
            </tr>`}),t.document.querySelector("#tb-indicator tbody").innerHTML=O,t.renderIndicatorTargetMatchPanel(r,I,A);const k=M(r);return h.signature=o,h.rows=k,t.INDICATOR_LAST_RESULT=k,t.__LAST_INDICATOR_CALC_DATA__=k,t.markSummaryDataChangedIfDependencyChanged("indicator",t.buildSummaryDependencySignature("indicator",r),"指标生核算结果已更新，请重新生成总排名。"),!n&&t.UI&&t.UI.toast("✅ 指标生核算完成 (含附加分)","success"),!n&&D.length&&t.UI&&t.UI.toast(`⚠️ ${D.length} 所学校未匹配到目标人数，指标基础分已按 0 分处理`,"warning"),!n&&E.length&&t.UI&&t.UI.toast(`⚠️ 以下学校目标人数异常（大于学生总数），已按未匹配处理：${E.join("、")}`,"warning"),r}t.calcIndicators=N,t.IndicatorCalcRuntime={calcIndicators:N}})(typeof window!="undefined"?window:globalThis);
