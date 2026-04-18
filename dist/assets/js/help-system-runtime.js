(function(o,e){const s=e(o||{});if(typeof module=="object"&&module.exports){const l=function(u){return e(u||o||{})};l.runtime=s,module.exports=l}!o||o.HelpSystemRuntime||(o.HelpSystemRuntime=s)})(typeof globalThis!="undefined"?globalThis:this,function(e){const s="hasSeenV3Tour";function l(){return e.Swal&&typeof e.Swal.fire=="function"?e.Swal:null}function u(t){typeof e.alert=="function"&&e.alert(t)}function c(){try{return e.localStorage||null}catch(t){return null}}function g(){const t=c();if(!t||typeof t.getItem!="function")return!1;try{return!!t.getItem(s)}catch(n){return!1}}function f(){const t=c();if(!(!t||typeof t.setItem!="function"))try{t.setItem(s,"true")}catch(n){}}function m(){return typeof e.setTimeout=="function"?e.setTimeout.bind(e):typeof setTimeout=="function"?setTimeout:function(t){return typeof t=="function"&&t(),0}}function h(){return e.document||null}function y(){return{upload:{title:"📁 数据上传规范",html:`
                    <div style="text-align:left; line-height:1.6;">
                        <p><strong>1. Excel 格式要求：</strong></p>
                        <ul>
                            <li>第一行必须是表头（如：姓名、班级、语文、数学...）。</li>
                            <li>必须包含<strong>姓名</strong>列。</li>
                            <li>如果有多个学校，请使用不同的 Sheet 页，<strong>Sheet名称即为学校名</strong>。</li>
                        </ul>
                        <p style="margin-top:10px;"><strong>2. 常见问题：</strong></p>
                        <ul>
                            <li>缺考/作弊：可填 "0" 或 "缺考"（系统按0分处理）。</li>
                            <li>列名识别：系统支持“语文/语/Chinese”等多种别名自动识别。</li>
                        </ul>
                    </div>
                `,icon:"info"},macro:{title:"📊 两率一分算法说明",html:`
                    <div style="text-align:left;">
                        <p><strong>核心公式：</strong></p>
                        <p>总分 = (均分赋分) + (优率赋分) + (及格赋分)</p>
                        <hr style="margin:10px 0; border:0; border-top:1px dashed #eee;">
                        <p><strong>默认权重配置：</strong></p>
                        <ul>
                            <li><strong>6-8年级：</strong> 均分60 + 优率70 + 及格70 = 满分200</li>
                            <li><strong>9年级：</strong> 均分50 + 优率80 + 及格50 = 满分180</li>
                        </ul>
                        <p style="font-size:12px; color:#666; margin-top:5px;">* 指标计算基准：以全镇最高值为满分进行归一化折算。</p>
                    </div>
                `},teacher:{title:"👨‍🏫 教师评价模型",html:`
                    <div style="text-align:left;">
                        <p>系统现在按“联考赋分 + 基线校正 + 置信修正”评价教师学科绩效：</p>
                        <ol>
                            <li><strong>联考赋分：</strong> 按系统现有“两率一分”口径，对同校同学科教师做赋分。</li>
                            <li><strong>基线校正：</strong> 用最近一次历史考试匹配学生，按同基础分层比较“实际值 - 预计值”。</li>
                            <li><strong>重点学生：</strong> 自动给出培优边缘生、及格临界生、辅差关注生名单。</li>
                        </ol>
                        <div class="info-bar" style="margin-top:10px; font-size:12px;">
                            提示：请先完成任课表同步，并尽量加载最近一次历史考试，基线校正才会更稳定。
                        </div>
                    </div>
                `}}}function d(){return[{title:"👋 欢迎使用智能教务系统",html:"只需 3 步完成一次完整流程：<strong>导入 → 分析 → 导出</strong>。",icon:"info",confirmButtonText:"下一步: 导入数据"},{title:"1️⃣ 导入",html:'进入<strong>【数据枢纽】</strong>上传 Excel。<br><small style="color:#666">系统自动识别学校、班级与学科。</small>',icon:"info",confirmButtonText:"下一步: 分析"},{title:"2️⃣ 分析",html:"进入<strong>【校际联考分析】</strong>查看横向排名，<br>进入<strong>【班级教学管理】</strong>看教师贡献度。",icon:"success",confirmButtonText:"下一步: 导出"},{title:"3️⃣ 导出",html:"进入<strong>【综合分析报告】</strong>或<strong>【成绩单/家长查分】</strong>一键导出。",icon:"success",confirmButtonText:"开始使用！"}]}function S(t,n){const i=t&&t.content&&t.content[n]?t.content[n]:null;if(!i)return;const r=l();if(!r){u(String(i.title||"").trim()||"帮助");return}r.fire({title:i.title,html:i.html,icon:"question",confirmButtonText:"明白了",confirmButtonColor:"#4f46e5"})}function a(){const t=l();if(!t)return;const n=d(),i=r=>{r>=n.length||t.fire({...n[r],showCancelButton:r<n.length-1,cancelButtonText:"跳过教程",confirmButtonColor:"#4f46e5",allowOutsideClick:!1}).then(p=>{p&&p.isConfirmed&&i(r+1)})};i(0)}function T(){const t=e.WorkspaceState&&typeof e.WorkspaceState=="object"?e.WorkspaceState:null;if(t&&typeof t.hasSavedWorkspace=="function")return!!t.hasSavedWorkspace();const n=typeof e.readWorkspaceExamId=="function"?e.readWorkspaceExamId():"",i=typeof e.readWorkspaceProjectKey=="function"?e.readWorkspaceProjectKey():"";return!!(String(n||"").trim()||String(i||"").trim())}function x(){const t=h();if(!t||typeof t.getElementById!="function")return!1;const n=t.getElementById("login-overlay");if(!n)return!1;const i=typeof e.getComputedStyle=="function"?e.getComputedStyle.bind(e):null;if(!i)return!1;try{return i(n).display!=="none"}catch(r){return!1}}function v(){const t=e.AuthState&&typeof e.AuthState=="object"?e.AuthState:null;return!t||typeof t.hasActiveSession!="function"?!1:!!t.hasActiveSession(e.Auth&&e.Auth.currentUser)}function A(){return Array.isArray(e.RAW_DATA)&&e.RAW_DATA.length>0}function b(t){if(g()||x())return;if(v()||T()||A()){f();return}m()(()=>{t&&typeof t.startTour=="function"?t.startTour():a(),f()},1e3)}return{createDefaultContent:y,show:S,startTour:a,checkFirstRun:b}});
