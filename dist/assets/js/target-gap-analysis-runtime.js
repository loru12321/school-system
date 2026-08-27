(function(e){if(!e)return;function M(){return typeof e.ensureLazySectionLoaded=="function"&&e.ensureLazySectionLoaded("drill-modal"),e.document.getElementById("drill-modal")}function w(m,T,d){const b=Array.isArray(e.RAW_DATA)?e.RAW_DATA:[],E=Array.isArray(e.SUBJECTS)?e.SUBJECTS:[],$=e.CONFIG||{},G=e.TEACHER_MAP&&typeof e.TEACHER_MAP=="object"?e.TEACHER_MAP:{},C=e.getEquivalentSchoolStudents(m);if(!C.length)return;const B=e.getTargetConfigBySchool(m).value||{t1:0,t2:0},f=parseInt(T==="ind1"?B.t1:B.t2);if(!f)return e.alert(`未找到 ${m} 的目标设定，请先导入目标人数Excel。`);const D=[...C].sort((t,s)=>s.total-t.total),_=D.filter(t=>t.total>=d),F=D.filter(t=>t.total<d),z=_.length,y=f-z,x=Math.ceil(f*.1)||5;let p=0,v="";y>0?(p=y+x,v=`当前差 <strong style="color:red">${y}</strong> 人达标。已为您筛选最接近目标的 <strong>${p}</strong> 名潜力生（含 ${x} 名保险备份）。`):(p=x,v=`当前已达标 (超 ${Math.abs(y)} 人)。建议继续关注线下前 <strong>${p}</strong> 名学生，防止上线生波动下滑。`);let o=F.slice(0,p);if(o.length===0)return e.alert("线下没有更多学生可供挖掘了。");const L=typeof e.filterRowsToTownshipSchools=="function"?e.filterRowsToTownshipSchools(b||[]):Array.isArray(b)?b:[],I={};E.forEach(t=>{const s=L.map(a=>a.scores[t]).filter(a=>typeof a=="number");I[t]=s.reduce((a,r)=>a+r,0)/(s.length||1)}),o=o.map(t=>{const s=d-t.total;let a=E;$&&Array.isArray($.totalSubs)&&(a=$.totalSubs);const r=n=>{const l=`${t.class}_${n}`;let g=G[l];if(g){const H=g.charAt(0);return`${n}<small style="color:#666; font-size:0.9em;">(${H}师)</small>`}return n};let i=[],c=[];a.forEach(n=>{if(t.scores[n]!==void 0){const l=t.scores[n]-I[n],g={name:n,diff:l};i.push(g),l<-5&&c.push(g)}}),i.sort((n,l)=>n.diff-l.diff),c.sort((n,l)=>n.diff-l.diff);let h="",u="";if(c.length>0){const n=c.slice(0,2);h=n.map(l=>r(l.name)).join("、"),u=n.map(l=>l.diff.toFixed(1)).join(" / ")}else{const n=i.slice(0,2);n.length>0?(h="<span style='font-size:10px; color:#666; border:1px solid #ccc; padding:0 2px; border-radius:2px; margin-right:2px;'>潜力</span>"+n.map(l=>r(l.name)).join("、"),u=n.map(l=>(l.diff>0?"+":"")+l.diff.toFixed(1)).join(" / ")):(h="数据不足",u="-")}return{name:t.name,class:t.class,total:t.total,scoreGap:s,worstSub:h,worstDiff:u}});const R=`${m} - ${T==="ind1"?"指标一":"指标二"} 冲刺名单 (目标:${f}人)`;let A=`
            <div class="info-bar">
                <div>🎯 <strong>划线分数：${d} 分</strong></div>
                <div style="margin-top:4px;">📊 现状：已达标 ${z} 人 / 目标 ${f} 人。</div>
                <div style="margin-top:4px; color:#0369a1;">💡 策略：${v}</div>
            </div>
            <div class="table-wrap">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>班级</th>
                            <th>姓名</th>
                            <th>当前总分</th>
                            <th>距划线差</th>
                            <th style="background:#fee2e2; color:#b91c1c;">🆘 建议补救学科</th>
                            <th>与年级均分差</th>
                        </tr>
                    </thead>
                    <tbody>
        `;o.forEach(t=>{const s=t.worstSub.includes("潜力"),a=s?"color:#64748b; font-size:12px;":"color:#b91c1c; font-weight:bold;",r=s?"color:#64748b;":"color:#b91c1c; font-weight:bold;",i=Math.min(100,t.total/d*100).toFixed(1),c=i>=98?"#f59e0b":"#3b82f6";A+=`
                <tr>
                    <td style="vertical-align:middle;">${t.class}</td>
                    <td style="vertical-align:middle;">
                        <div style="font-weight:bold; font-size:14px;">${t.name}</div>
                    </td>

                    <!-- 🟢 改造：当前总分 + 可视化进度条 -->
                    <td style="vertical-align:middle;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; margin-bottom:2px;">
                            <span style="font-weight:800; font-size:15px; color:#333;">${t.total}</span>
                            <span style="color:#94a3b8; transform:scale(0.9);">目标:${d}</span>
                        </div>
                        <div style="width:100%; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;" title="达成率: ${i}%">
                            <div style="width:${i}%; height:100%; background:${c}; border-radius:3px;"></div>
                        </div>
                    </td>

                    <td style="vertical-align:middle;">
                        <span class="badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #dbeafe; font-size:12px;">
                            -${t.scoreGap.toFixed(1)}
                        </span>
                    </td>

                    <td style="vertical-align:middle; ${a}">
                        ${t.worstSub}
                    </td>

                    <td style="vertical-align:middle; ${r}">
                        ${t.worstDiff}
                    </td>
                </tr>
            `}),A+="</tbody></table></div>",M(),e.document.getElementById("drill-title").innerText=R,e.document.getElementById("drill-back-btn").classList.add("hidden"),e.document.getElementById("drill-content").innerHTML=A;const S={};o.forEach(t=>{S[t.class]=(S[t.class]||0)+1});const k=Object.entries(S).map(([t,s])=>`${t}班:${s}人`).join("， ");e.document.getElementById("drill-footer").innerText=`各班潜力生分布：${k} (请平衡各班指标压力)`,e.DrillSystem&&(e.DrillSystem.exportData={type:"gap",fileName:R,data:o});const j=e.document.getElementById("drill-export-btn");j&&j.classList.remove("hidden"),e.document.getElementById("drill-modal").style.display="flex"}e.analyzeTargetGap=w,e.TargetGapAnalysisRuntime={analyzeTargetGap:w}})(typeof window!="undefined"?window:globalThis);
